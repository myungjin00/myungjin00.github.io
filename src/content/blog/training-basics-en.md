---
title: "The training loop: learning rate, schedules and when to stop"
date: 2024-10-18
description: "What one training step does · epoch, batch and iteration counted properly · where to start the learning rate · optimisers, schedules and batch size · early stopping, seeds, and the five failures worth recognising"
category: concept
updated: 2024-11
lang: en
group: training-basics
topic: Machine learning
subtopic: Basics
tags: [learning rate, optimiser, early stopping, reproducibility]
---

A model, a loss and an optimiser is [the whole of training](../ml-and-dl-en/), and `model.fit()` hides every decision inside it: what one step does, what each knob changes, and how the run decides to stop.

## One step

For every batch of data, four things happen in this order.

1. **Forward pass** — the model turns inputs into predictions.
2. **Loss** — one number saying how wrong those predictions are.
3. **Backward pass** — backpropagation computes the gradient of the loss with respect to every parameter: which way each weight would have to move to make the loss worse.
4. **Optimiser step** — every weight moves a little in the opposite direction.

Then it repeats. In PyTorch that is literally five lines:

```python
import torch
model = torch.nn.Sequential(torch.nn.Linear(20, 64), torch.nn.ReLU(), torch.nn.Linear(64, 1))
opt = torch.optim.AdamW(model.parameters(), lr=1e-3)
X, y = torch.randn(512, 20), torch.randn(512, 1)
loader = torch.utils.data.DataLoader(torch.utils.data.TensorDataset(X, y), batch_size=32)

for x, target in loader:                                  # one pass over the loader = one epoch
    opt.zero_grad()                                       # gradients accumulate, so clear them first
    loss = torch.nn.functional.mse_loss(model(x), target) # 1 + 2: forward and loss
    loss.backward()                                       # 3: fills .grad on every parameter
    opt.step()                                            # 4: the update
```

`opt.zero_grad()` is the line people leave out. PyTorch **adds** new gradients to whatever is already in `.grad`, so without it every step is contaminated by the previous one — training still runs, just badly.

## Epoch, batch, iteration

These three get used interchangeably and they are not the same thing.

| Term | Definition |
| --- | --- |
| **batch** | the group of samples whose gradients are averaged into **one** update |
| **iteration** (step) | one optimiser update — one batch in, one `opt.step()` out |
| **epoch** | one full pass over the training set |

So the arithmetic is: iterations per epoch = ⌈N / B⌉, where N is the training-set size and B the batch size.

```python
import math, torch
from torch.utils.data import DataLoader, TensorDataset

ds = TensorDataset(torch.randn(10_000, 8), torch.randint(0, 2, (10_000,)))
loader = DataLoader(ds, batch_size=32, shuffle=True)   # drop_last=False
print("iterations per epoch:", len(loader))            # 313
print("last batch size:", 10_000 % 32)                 # 16
print("ceil(10000/32) =", math.ceil(10_000 / 32))      # 313
print("iterations in 50 epochs:", 50 * len(loader))    # 15650
```

10,000 samples at batch 32 gives **313** iterations, not 312: the last batch is a short one holding 16 samples (`drop_last=True` throws it away and you get 312). <mark>Over 50 epochs the model is not updated 50 times — it is updated 15,650 times.</mark>

<figure>
<img src="/assets/fig/epoch-batch-iteration.svg" alt="Batches, iterations and epochs counted for 10,000 samples at batch size 32" loading="lazy" />
<figcaption><b>Counting one epoch.</b> 313 batches rather than 312, the last one holding half a batch. Which unit a scheduler or a patience counter is stepped in decides whether it sees 50 events or 15,650.</figcaption>
</figure>

Schedulers and early stopping are counted in one of these units or the other, so the distinction is load-bearing: a scheduler stepped once per iteration when you meant once per epoch decays 313 times too fast.

## The learning rate

<mark class="blue">The learning rate is the one hyperparameter to get approximately right before touching anything else.</mark> It is the η in

$$
w \leftarrow w - \eta \, g
$$

and that is all it is: a plain multiplier on the gradient, before the gradient is subtracted from the weight.

What the two failure modes look like, on a 20-feature regression a small network solves easily:

```python
import torch

def run(lr, steps=200):
    torch.manual_seed(43)
    X = torch.randn(512, 20); w = torch.randn(20, 1)
    y = X @ w + 0.1 * torch.randn(512, 1)
    model = torch.nn.Sequential(torch.nn.Linear(20, 64), torch.nn.ReLU(), torch.nn.Linear(64, 1))
    opt = torch.optim.AdamW(model.parameters(), lr=lr)
    for _ in range(steps):
        opt.zero_grad()
        loss = torch.nn.functional.mse_loss(model(X), y)
        loss.backward(); opt.step()
    return loss.item()

for lr in (10.0, 1e-2, 1e-7):
    print(f"lr={lr:<8g} loss after 200 steps = {run(lr):.4g}")
# lr=10       loss after 200 steps = 15.98     (started at 16.22 — went nowhere)
# lr=0.01     loss after 200 steps = 0.0068
# lr=1e-07    loss after 200 steps = 16.21     (started at 16.22 — did not move)
```

**Too large** and each step overshoots: the loss bounces, refuses to settle, and in a deeper model with exponentials or logs in it goes to NaN (not a number) within a few hundred steps and never comes back. **Too small** and the loss does fall — smoothly, convincingly, and far too slowly to arrive. A plateau at a bad loss value looks like a model that cannot learn the task; often it is a learning rate two orders of magnitude short.

Starting points, assuming AdamW:

| Situation | Typical starting learning rate |
| --- | --- |
| training from scratch | 1e-3 |
| fine-tuning a pretrained encoder | 1e-4 — about ten times lower, so the [pre-trained weights](../transfer-learning-en/) are not overwritten |
| linear probe (encoder frozen, head only) | 1e-3 to 1e-2 — nothing fragile is being updated |
| from scratch with SGD and momentum | 1e-2 to 1e-1, an order of magnitude or two above the Adam numbers |

Those are starting points, not answers. **The right value depends on the batch size and on the optimiser**, so a number lifted from a paper that trained at batch 1024 is not transferable to your batch 32 run, and an SGD learning rate is not an Adam learning rate. If you want the value rather than a guess, the **learning rate range test** gives it cheaply: train for a few hundred iterations while raising the learning rate geometrically, watch where the loss starts to diverge, and use something below that. Searching it properly, alongside the other settings, is [hyperparameter search](../hyperparameter-search-en/).

## Optimisers

| Optimiser | What it adds | When |
| --- | --- | --- |
| **SGD** (stochastic gradient descent) | nothing — the update is exactly `w -= lr * grad` | a baseline, and anywhere you want full control |
| **SGD with momentum** | a running average of past gradients, so the step keeps direction through noise and small bumps | large-scale vision, where well-tuned SGD still generalises best |
| **Adam** (adaptive moment estimation) | a per-parameter step size from running estimates of the gradient's mean and squared magnitude | sparse or wildly scaled gradients, and anything you want working on the first try |
| **AdamW** (Adam with decoupled weight decay) | weight decay applied straight to the weights instead of through the gradient | the default |

**AdamW is the default to start from.** It converges quickly from a near-default learning rate, which matters most when the thing you are testing is not the optimiser.

Classic Adam implements weight decay by adding an L2 penalty — the sum of the squared weights — to the loss, so the decay term passes through the same per-parameter adaptive rescaling as the gradient. Parameters with a long history of large gradients therefore get **less** decay than the ones that need it least — and the effective amount of regularisation ends up tangled with the learning rate, so retuning one silently changes the other. AdamW subtracts the decay from the weights directly, which makes `weight_decay` an independent knob.

## Schedules

The learning rate does not have to be a constant. A **scheduler** changes it over training.

| Schedule | Shape |
| --- | --- |
| **constant** | one value throughout |
| **step** | hold, then multiply by a factor (usually 0.1) at fixed boundaries |
| **cosine** | decay smoothly from the base rate to near zero along half a cosine |
| **linear warmup** | ramp up from near zero over the first few hundred iterations, then hand over to one of the above |

```python
import torch, matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

EPOCHS, BASE_LR, WARMUP = 100, 1e-3, 5

def lrs(make_sched):
    p = torch.nn.Parameter(torch.zeros(1))
    opt = torch.optim.AdamW([p], lr=BASE_LR)
    sched = make_sched(opt)
    out = []
    for _ in range(EPOCHS):
        out.append(opt.param_groups[0]["lr"])
        opt.step(); sched.step()
    return out

step   = lrs(lambda o: torch.optim.lr_scheduler.StepLR(o, step_size=30, gamma=0.1))
cosine = lrs(lambda o: torch.optim.lr_scheduler.CosineAnnealingLR(o, T_max=EPOCHS))
warm   = lrs(lambda o: torch.optim.lr_scheduler.LambdaLR(
    o, lambda e: (e + 1) / WARMUP if e < WARMUP else 1.0))

for name, s in [("step", step), ("cosine", cosine), ("warmup", warm)]:
    print(f"{name:7s} epoch 0/5/30/50/99: " + " ".join(f"{s[e]:.2e}" for e in (0, 5, 30, 50, 99)))
    plt.plot(s, label=name)
plt.xlabel("epoch"); plt.ylabel("learning rate"); plt.legend()
# step    epoch 0/5/30/50/99: 1.00e-03 1.00e-03 1.00e-04 1.00e-04 1.00e-06
# cosine  epoch 0/5/30/50/99: 1.00e-03 9.94e-04 7.94e-04 5.00e-04 2.47e-07
# warmup  epoch 0/5/30/50/99: 2.00e-04 1.00e-03 1.00e-03 1.00e-03 1.00e-03
```

The printed numbers are the shapes. Step holds 1e-3 flat and drops tenfold at epochs 30, 60 and 90, ending at 1e-6. Cosine leaves the base rate gently (9.94e-4 after five epochs), is at exactly half of it at the midpoint, and finishes at 2.47e-7. Warmup starts at a fifth of the base rate and reaches full rate at epoch 5, where a real run would hand over to cosine.

**Warmup exists because the first few hundred updates are the dangerous ones.** The weights are random, so the initial gradients are large; and Adam's running estimates of the gradient mean and squared magnitude have been built from a handful of batches, so the per-parameter scaling they imply is noise. A full-rate step taken on a large badly-scaled gradient can throw the weights somewhere they never recover from. Ramping up for a few hundred iterations costs nothing and removes the whole failure mode — and the larger the batch, the more it is needed.

**Cosine decay is the common default** because it needs no boundaries chosen, has no cliffs for the optimiser to fall off, and ends small enough that the last epochs refine the solution instead of bouncing around it.

One practical trap: `sched.step()` once per epoch is what the snippet above does. Warmup is normally stepped per iteration instead, since it is measured in iterations.

## Batch size

Batch size trades gradient noise against memory and wall-clock. What it does to throughput, and the rest of making an epoch finish sooner, is in [making a training run faster](../training-speed-en/).

| Larger batch | Smaller batch |
| --- | --- |
| less noisy gradient estimate | noisier estimate, which regularises a little |
| better GPU utilisation, faster per epoch | poor utilisation, slower |
| more memory — the limit is usually here | fits anywhere |
| fewer updates per epoch | many updates per epoch |

Because a larger batch gives a more reliable gradient, you can afford a bigger step with it. The rough rule is **linear scaling: multiply the batch size by k, multiply the learning rate by k** (with warmup, which is where the rule was actually established). It holds over a wide range for SGD; for Adam many people scale by √k instead, and either way it is a starting point to verify, not a law.

When the batch you want does not fit in memory, **gradient accumulation** gets it anyway: run several small batches, sum their gradients, and step once.

```python
import torch
from torch.utils.data import DataLoader, TensorDataset

ACCUM = 8                                  # loader batch 32 × 8 = effective batch 256
model = torch.nn.Linear(8, 1)
opt = torch.optim.AdamW(model.parameters(), lr=1e-3)
loader = DataLoader(TensorDataset(torch.randn(256, 8), torch.randn(256, 1)), batch_size=32)

steps = 0
for i, (x, y) in enumerate(loader):
    (torch.nn.functional.mse_loss(model(x), y) / ACCUM).backward()   # divide: gradients sum
    if (i + 1) % ACCUM == 0:
        opt.step(); opt.zero_grad(); steps += 1
print("micro-batches:", i + 1, "| optimiser steps:", steps)   # 8 | 1
```

Dividing the loss by `ACCUM` is required, otherwise the accumulated gradient is eight times too large and the effective learning rate goes with it. The one thing accumulation does not reproduce is normalisation statistics: batch normalisation still sees 32 samples at a time, not 256.

## When to stop

Training loss falls more or less forever — a model with enough capacity will [memorise the training set](../ml-and-dl-en/) given enough epochs. So the training loss cannot tell you when to stop. The validation loss can: it falls, bottoms out, and turns back up, and the bottom is where you want the weights.

**Early stopping with patience** automates that. `patience` is the number of consecutive validation checks you tolerate without a new best before giving up. With validation once per epoch, patience 5 means five epochs of no improvement.

```python
val_loss = [0.70, 0.52, 0.41, 0.38, 0.39, 0.37, 0.40, 0.41, 0.43, 0.44, 0.46]
PATIENCE = 5
best, best_epoch, bad = float("inf"), -1, 0

for epoch, v in enumerate(val_loss):
    if v < best:
        best, best_epoch, bad = v, epoch, 0   # torch.save(model.state_dict(), "best.pt")
    else:
        bad += 1
        if bad == PATIENCE:
            print(f"stopped at epoch {epoch}")
            break
print(f"restore epoch {best_epoch} (val {best}), not epoch {epoch} (val {val_loss[epoch]})")
# stopped at epoch 10
# restore epoch 5 (val 0.37), not epoch 10 (val 0.46)
```

The commented `torch.save` is the whole point. **You restore the best checkpoint, not the last one.** By construction, stopping happens `patience` epochs after the best model existed, so the weights in memory when the loop exits are the worst ones you have seen since. Here the final model scores 0.46 and the one you should ship scores 0.37.

Two details. `patience` interacts with the schedule: stop early under a cosine schedule and you stopped before the learning rate had decayed, so set the schedule's length to the epoch budget you actually expect to use. And the set that decides the epoch is a validation set, never the test set — [the moment the test set picks the epoch it has stopped being a test set](../evaluation-protocol-en/).

## Regularisation, briefly

- **Weight decay** pulls weights toward zero at every step, which keeps the fitted function smoother. With AdamW, 1e-2 is a reasonable default.
- **Dropout** zeroes a random fraction of activations during training, so no single unit can be relied on. Typical p is 0.1 to 0.5, and it must be off at evaluation time — which `model.eval()` handles, and forgetting it makes every reported number noise.
- **More data beats both**, and [augmentation](../augmentation-en/) is the cheap way to get more of it when it is valid.

## Reproducibility

```python
import random, numpy as np, torch
SEED = 43
random.seed(SEED); np.random.seed(SEED); torch.manual_seed(SEED)
torch.cuda.manual_seed_all(SEED)
torch.use_deterministic_algorithms(True)   # raises if an op has no deterministic implementation
print("deterministic:", torch.are_deterministic_algorithms_enabled())   # True
```

Three generators need seeding, not one: Python's `random` (shuffling, sampling in your own code), NumPy's (most preprocessing), and torch's (initialisation, dropout, the DataLoader's shuffle). `torch.use_deterministic_algorithms(True)` goes further and makes torch refuse to run an operation that has no deterministic version, instead of quietly using the fast one. On CUDA it also wants `CUBLAS_WORKSPACE_CONFIG=:4096:8` set in the environment, and DataLoader workers need their own seeding through `worker_init_fn`.

Even then there is a ceiling: some CUDA kernels are not bit-reproducible, atomics accumulate in whatever order the scheduler produces, and a run of the same code with the same seed on the same machine can land on a different number. This is not a reason to skip seeding — it is the reason [a result is reported as a mean over several seeds](../evaluation-protocol-en/) rather than as one number. If a claimed improvement is smaller than the spread across seeds, there is no improvement to report.

## What goes wrong

- **Loss is NaN.** Learning rate too high, almost always — divide by ten and rerun. Otherwise a `log(0)` or a division by zero somewhere in the loss, often from feeding raw logits to something expecting probabilities.
- **Loss is flat from step one.** Either the learning rate is far too low, or nothing is connected: `opt.zero_grad()` and `loss.backward()` in the wrong order, parameters missing from the optimiser, a frozen encoder you meant to unfreeze. Shuffled or misaligned labels look the same — the loss sits at the chance level and never moves.
- **Training loss far below validation loss.** Overfitting. More data, augmentation, weight decay, dropout, earlier stopping, less capacity — [in that order of preference](../ml-and-dl-en/).
- **Validation loss lower than training loss.** Usually not a bug. Dropout is active during training and off during validation, so the training number is handicapped; and the training loss is averaged across the epoch while validation is measured after it, with better weights.
- **Out of memory** (OOM). Reduce the batch size, recover the effective batch with gradient accumulation, or switch to [mixed precision](../training-speed-en/) — AMP (automatic mixed precision) stores activations in 16-bit and typically halves the memory for free.

## Summary

- One step is forward, loss, backward, update — and `opt.zero_grad()` before each one
- iterations per epoch = ⌈N / B⌉: 10,000 samples at batch 32 is 313 iterations, 15,650 updates over 50 epochs
- The learning rate multiplies the gradient; too large bounces or goes NaN, too small never arrives
- Start at 1e-3 from scratch, 1e-4 for fine-tuning, and never copy a rate from a paper with a different batch size
- AdamW is the default; warmup protects the first few hundred steps, cosine decay handles the rest
- Larger batch means less noise and more memory, and the learning rate scales with it
- Stop on validation loss with patience, and **restore the best checkpoint, not the last**
- Seed all three generators, and still report a mean over several seeds

## References

- Loshchilov & Hutter, [Decoupled Weight Decay Regularization](https://arxiv.org/abs/1711.05101) (ICLR 2019) — why AdamW exists and what decoupling fixes
- Smith, [Cyclical Learning Rates for Training Neural Networks](https://arxiv.org/abs/1506.01186) (2015) — includes the learning rate range test
- Goyal et al., [Accurate, Large Minibatch SGD: Training ImageNet in 1 Hour](https://arxiv.org/abs/1706.02677) (2017) — the linear scaling rule and the warmup scheme that makes it work
