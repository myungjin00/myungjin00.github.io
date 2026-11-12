---
title: "Making a training run faster: the DataLoader, mixed precision and the GPU"
date: 2026-03-20
description: "Diagnose before you optimise · reading nvidia-smi utilisation · the DataLoader knobs and the ancdata failure · autocast and GradScaler · gradient checkpointing · when torch.compile is worth it · a symptom-to-fix table"
category: tutorial
updated: 2026-04
lang: en
group: training-speed
topic: Python
tags: [PyTorch, DataLoader, mixed precision, GPU utilisation]
---

What the training loop does and why — the loop itself, learning rate, schedules, early stopping, reproducibility — is in [training basics](../training-basics-en/).

Almost every "my training is slow" problem ends in the same place: the GPU (graphics processing unit) was idle most of the time while the person was reading about mixed precision. <mark class="blue">Measure the bottleneck before you change anything, because the three fixes below help three different problems and the wrong one does nothing.</mark>

## Find the bottleneck first

One command, running in a second terminal while training:

```bash
watch -n 1 nvidia-smi
```

Two numbers matter. `utilization.gpu` is the fraction of the last sampling interval in which at least one kernel — one operation running on the card — was busy; `memory.used` is how much of the card you have taken. For a number you can log instead of watch:

```bash
nvidia-smi --query-gpu=index,utilization.gpu,memory.used,memory.total --format=csv
```

| what you see | what it means |
| --- | --- |
| utilisation 10–30%, jumping to 100% and back | the GPU is waiting for data — the input pipeline is the bottleneck |
| utilisation steady above 90%, epochs still slow | the GPU is genuinely busy; the model or the batch is simply big |
| memory near total, utilisation low | too large a batch thrashing, or something is holding tensors it should have freed |

Low utilisation means the CPU (central processing unit) side — reading files, decoding, featurising, collating — cannot keep up, and **no amount of mixed precision fixes that**. High utilisation means you are already compute-bound, and the only things left are a cheaper model, a bigger batch, or more cards.

<figure>
<img src="/assets/fig/gpu-timeline.svg" alt="Timelines of GPU-busy and GPU-waiting time for an input-bound run and a compute-bound run" loading="lazy" />
<figcaption><b>The same window, two bottlenecks.</b> The GPU work per batch is identical in both runs; only the waiting differs, and the utilisation number is a measure of that waiting. Mixed precision shortens the blue blocks, which does nothing whatever for the run on top.</figcaption>
</figure>

When it is not obvious which, `torch.profiler` answers it in four lines:

```python
from torch.profiler import profile, ProfilerActivity

with profile(activities=[ProfilerActivity.CPU, ProfilerActivity.CUDA]) as prof:
    train_one_step(model, batch)        # one step is enough; profiling is expensive
print(prof.key_averages().table(sort_by="cuda_time_total", row_limit=10))
```

Read the table from the top. If the expensive rows are kernels (convolutions, matrix multiplies, scatter operations) you are **compute-bound**. If the time is sitting in `aten::copy_`, `cudaMemcpyAsync` or in the data-loading frames, you are **input-bound**.

## The DataLoader — the usual culprit

A `DataLoader` with default arguments prepares every batch in the main process, one at a time, while the GPU waits. <mark>When a GPU sits at 20%, that default is the first thing to check.</mark>

```python
from torch.utils.data import DataLoader

loader = DataLoader(
    dataset,
    batch_size=64,
    shuffle=True,
    num_workers=8,            # separate processes building batches ahead of the GPU
    pin_memory=True,          # page-locked host memory, so the copy can overlap compute
    persistent_workers=True,  # do not respawn workers every epoch
    prefetch_factor=4,        # batches each worker keeps ready
)
```

| knob | what it actually does |
| --- | --- |
| `num_workers` | that many child processes each build whole batches in parallel, ahead of time; `0` means the main process does it and nothing overlaps |
| `pin_memory` | batches are written into page-locked host memory, which cannot be swapped out, so the host-to-device transfer can run asynchronously and overlap the previous step's compute |
| `persistent_workers` | keeps the workers alive between epochs instead of paying process startup and dataset re-initialisation every epoch |
| `prefetch_factor` | how many batches each worker keeps queued; raising it buys more tolerance for uneven item costs at the price of host memory |

`pin_memory=True` only pays off if the transfer is actually **asynchronous**, which needs `non_blocking=True` on the copy:

```python
x = x.to("cuda", non_blocking=True)
```

**How to tune it:** start at `num_workers=4`, watch utilisation, double it, and stop when utilisation stops improving. A sane ceiling is roughly the number of CPU cores available per GPU. Past that the workers contend for cores and for memory bandwidth, and more is usually slower, not faster.

## Too many workers: the ancdata error

Push `num_workers` high enough and PyTorch dies with:

```
RuntimeError: received 0 items of ancdata
```

Worker processes hand tensors to the main process as file descriptors — the numbered handles a process holds for each open file or socket — over a socket, and with many workers, many batches in flight and many tensors per batch you exhaust the per-process open-file limit. Three fixes, in order:

1. Lower `num_workers`. It is **usually the right answer**, and often faster anyway.
2. Raise the limit: `ulimit -n` shows it, `ulimit -n 65535` raises it for the current shell (up to the hard limit, which `ulimit -Hn` shows).
3. Change how tensors are shared, at the top of your script, before any worker starts:

```python
import torch.multiprocessing as mp
mp.set_sharing_strategy("file_system")   # default is "file_descriptor"
```

The `file_system` strategy stops using one descriptor per tensor. The trade-off is that a hard crash can **leak shared-memory files** that nobody cleans up.

## Mixed precision

AMP (automatic mixed precision) runs most operations in 16-bit while keeping a **32-bit copy of the weights** for the optimiser update. Reductions and loss computations stay in 32-bit, which is what keeps it stable; PyTorch decides per operation, you do not annotate anything.

Two reasons it is faster. Tensor cores execute 16-bit matrix multiplies at several times the 32-bit rate, and halving the width of activations **halves the memory traffic** — and the memory a batch costs, so you can often raise the batch size on top of the speedup.

```python
import torch

# assumes model, opt, loader, loss_fn already exist
scaler = torch.amp.GradScaler("cuda")      # torch.cuda.amp.GradScaler is deprecated

for x, y in loader:
    x = x.to("cuda", non_blocking=True)
    y = y.to("cuda", non_blocking=True)
    opt.zero_grad(set_to_none=True)
    with torch.autocast(device_type="cuda", dtype=torch.float16):
        loss = loss_fn(model(x), y)
    scaler.scale(loss).backward()
    scaler.step(opt)
    scaler.update()
```

The scaler exists because fp16 (16-bit floating point) has a narrow exponent range: gradients smaller than roughly 6e-8 round to zero, and a layer whose gradients all underflow **stops learning silently**. `GradScaler` multiplies the loss by a large factor before `backward()`, unscales the gradients before the optimiser step, and skips any step whose gradients came back as infinity or not-a-number while lowering the factor.

bf16 (bfloat16) has the same exponent range as 32-bit float and fewer mantissa bits, so nothing underflows and **no scaler is needed**:

```python
with torch.autocast(device_type="cuda", dtype=torch.bfloat16):
    loss = loss_fn(model(x), y)
```

That needs a recent card — **Ampere generation or newer**. On older hardware bf16 either is unsupported or is emulated and slow, so fp16 with the scaler remains the right choice there.

**Mixed precision changes the numerics.** A run is not bit-identical to its 32-bit twin, and small differences in a loss curve between the two are expected rather than a bug. If an existing fp32 run is your reference for a correctness check, keep it.

## Memory, when the batch does not fit

The first move is **[gradient accumulation](../training-basics-en/)** — several small batches, one optimiser step — which recovers the effective batch at the memory cost of the small one. Under `autocast` it is the same loop with `scaler.scale(loss).backward()` in place of `loss.backward()`, and the loss still has to be divided by the accumulation count.

**Gradient checkpointing** goes further: forget the intermediate activations and recompute them during the backward pass. Call `torch.utils.checkpoint.checkpoint(block, x, use_reentrant=False)` around the expensive blocks. It buys a large memory saving for roughly 20–30% more compute, which is worth it only when the alternative is not running at all.

**`torch.cuda.empty_cache()` is almost never the answer.** It returns cached blocks to the driver but frees nothing your tensors still reference, and the allocator will just take the memory back. It makes `nvidia-smi` look better and your run slower.

## torch.compile

`model = torch.compile(model)` traces the model, fuses operations and generates kernels. On a dense, static model it is often a real speedup for a one-line change, so it is **worth one measured attempt**. The costs are a slow first step — tens of seconds to minutes of compilation — and recompilation whenever an input shape changes. Molecular graphs have shapes that change on every batch (different numbers of atoms, bonds and fragments per molecule), so a compiled graph neural network can **spend its life recompiling** and come out slower than the uncompiled (eager) version. Try it on fixed-shape models, measure the second epoch rather than the first, and do not bother if your batches are ragged and your model is small.

## Things that are usually not the problem

- **The optimiser.** AdamW versus SGD (stochastic gradient descent) is a convergence decision, not a speed one; the optimiser step is a rounding error next to the forward and backward passes.
- **`.item()` and logging between epochs.** Reading a scalar once per epoch, writing a log line, saving a checkpoint — none of it is measurable.
- **Printing.** Unless you print inside the inner loop over thousands of steps, in which case it is the synchronisation below rather than the print that costs you.

The genuine version of that last point: calling `.item()`, `.cpu()`, `.numpy()` or `float()` on a tensor **inside** the loop forces the CPU to wait for the GPU to finish, which destroys the overlap you set up with workers and pinned memory. Accumulate on the device and read once:

```python
total = torch.zeros((), device="cuda")
for x, y in loader:
    loss = loss_fn(model(x), y)
    total += loss.detach()            # stays on the device, no synchronisation
print(float(total) / len(loader))     # one synchronisation, after the loop
```

## Symptom to fix

| symptom | likely cause and fix |
| --- | --- |
| GPU at 10–30% | input-bound. Raise `num_workers`, add `pin_memory=True` with `non_blocking=True`, `persistent_workers=True`; cache or pre-featurise anything you recompute every epoch |
| GPU at 95% but still slow | genuinely compute-bound. Mixed precision, a larger batch, a smaller model, or more cards. Tuning the DataLoader here will do nothing |
| OOM (out of memory) | lower the batch size, then gradient accumulation to keep the effective batch; mixed precision frees memory too; gradient checkpointing last |
| first epoch far slower than the rest | one-off cost — dataset construction, file-system cache cold on first read, or `torch.compile` compiling. Set `persistent_workers=True` so you pay worker startup once, and always time from the second epoch |
| speed varies run to run | someone else is on the card (check `nvidia-smi`), shared I/O (input/output) to the same storage, thermal or power throttling, or a dataset with very uneven item costs so workers stall unevenly |

## More than one GPU

When the single-GPU pipeline is genuinely saturated — high utilisation, a DataLoader that is no longer the limit — a second card roughly halves the epoch. Use **`DistributedDataParallel` (DDP), not `DataParallel`**: DDP runs one process per GPU with gradient all-reduce — summing each gradient across every card and giving them all the result — overlapping the backward pass, while the older `DataParallel` drives all cards from one process and makes GPU 0 a bottleneck for both memory and the Python interpreter. Reaching for multiple cards before the pipeline is saturated just multiplies the idle time, and for hyperparameter search it is nearly always better to run **one independent job per card** than to split one job across all of them.

## Summary

- **Diagnose first**: `watch -n 1 nvidia-smi`, then `torch.profiler` if the cause is unclear. Low utilisation is the input pipeline, high utilisation is the model
- `num_workers` + `pin_memory` + `persistent_workers` fix most slow runs; tune `num_workers` upward until utilisation stops improving, ceiling around the CPU cores per GPU
- `received 0 items of ancdata` means **too many workers for the open-file limit** — lower `num_workers`, `ulimit -n`, or the `file_system` sharing strategy
- Mixed precision via `torch.autocast` + `torch.amp.GradScaler`; bf16 needs no scaler but needs a recent card; **neither is bit-identical to fp32**
- For the batch that does not fit: **gradient accumulation** first, then checkpointing; `empty_cache()` buys nothing
- `torch.compile` is worth one measurement, and usually not worth it on molecular graphs
- Do not call `.item()` or `.cpu()` **inside** the inner loop — one synchronisation per epoch, not per step
- DDP, **after the single-GPU pipeline is saturated** and not before

## References

- [PyTorch performance tuning guide](https://docs.pytorch.org/tutorials/recipes/recipes/tuning_guide.html) — the canonical list, DataLoader settings through to distributed training
- [Automatic mixed precision recipe](https://docs.pytorch.org/tutorials/recipes/recipes/amp_recipe.html) · [AMP examples](https://docs.pytorch.org/docs/stable/notes/amp_examples.html) — the scaler patterns, including accumulation and gradient clipping
- Micikevicius et al., [Mixed precision training](https://arxiv.org/abs/1710.03740), *ICLR* (2018) — where loss scaling and the 32-bit weight copy come from
- [torch.utils.data](https://docs.pytorch.org/docs/stable/data.html) and [torch.compiler](https://docs.pytorch.org/docs/stable/torch.compiler.html) — every DataLoader argument, and what compilation does and does not handle
