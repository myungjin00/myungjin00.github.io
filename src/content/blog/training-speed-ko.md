---
title: "학습을 빠르게 돌리기: DataLoader, mixed precision, 그리고 GPU"
date: 2026-03-20
description: "최적화보다 진단이 먼저 · nvidia-smi 사용률 읽기 · DataLoader 설정과 ancdata 오류 · autocast와 GradScaler · gradient checkpointing · torch.compile을 쓸 때와 안 쓸 때 · 증상별 대처 표"
category: tutorial
updated: 2026-04
lang: ko
group: training-speed
topic: Python
tags: [PyTorch, DataLoader, mixed precision, GPU utilisation]
---

학습 루프가 무엇을 하는지, 학습률·스케줄·early stopping·재현성 같은 내용은 [학습의 기본](../training-basics-ko/)에 있다.

"학습이 너무 느리다"는 문제는 거의 항상 같은 지점에서 끝난다. GPU (graphics processing unit)가 대부분의 시간을 놀고 있는데, 정작 읽고 있는 건 mixed precision 문서였다. <mark class="blue">무엇이 병목인지 재기 전에는 아무것도 손대지 말 것. 아래 세 가지 처방은 서로 다른 문제를 고치고, 엉뚱한 걸 고르면 아무 효과가 없다.</mark>

## 병목부터 찾는다

학습을 돌리는 동안 다른 터미널에서 명령 하나만 띄워 둔다.

```bash
watch -n 1 nvidia-smi
```

볼 숫자는 두 개다. `utilization.gpu`는 직전 샘플링 구간에서 kernel (카드 위에서 도는 연산 하나)이 하나라도 돌고 있던 시간의 비율이고, `memory.used`는 카드 메모리를 얼마나 잡았는지다. 화면으로 보는 대신 로그로 남기려면 이렇게 쓴다.

```bash
nvidia-smi --query-gpu=index,utilization.gpu,memory.used,memory.total --format=csv
```

| 보이는 것 | 뜻 |
| --- | --- |
| 사용률 10~30%, 100%까지 튀었다 내려옴 | GPU가 데이터를 기다리고 있다 — 입력 쪽이 병목 |
| 사용률이 90% 위에서 안정적인데 에폭 (epoch)이 느림 | GPU가 실제로 바쁘다. 모델이나 batch가 그냥 큰 것 |
| 메모리는 꽉 찼는데 사용률은 낮음 | batch가 너무 커서 메모리를 오가거나, 놓아야 할 tensor를 붙들고 있다 |

사용률이 낮다는 건 CPU (central processing unit) 쪽 — 파일 읽기, 디코딩, 특징 계산, batch 모으기 — 가 못 따라간다는 뜻이고, **여기에 mixed precision을 붙여도 달라지지 않는다**. 사용률이 높으면 이미 계산이 병목이라는 뜻이라, 남은 선택은 더 가벼운 모델, 더 큰 batch, 또는 카드를 늘리는 것뿐이다.

<figure>
<img src="/assets/fig/gpu-timeline.svg" alt="Timelines of GPU-busy and GPU-waiting time for an input-bound run and a compute-bound run" loading="lazy" />
<figcaption><b>같은 시간, 다른 병목.</b> batch 하나당 GPU 계산량은 위아래가 같다. 다른 것은 기다리는 시간뿐이고, 사용률이라는 숫자가 재는 것이 바로 그 기다림이다. mixed precision은 파란 블록을 줄이는 처방이라 위쪽 학습에는 아무 소용이 없다.</figcaption>
</figure>

어느 쪽인지 애매할 때는 `torch.profiler`가 네 줄로 답을 준다.

```python
from torch.profiler import profile, ProfilerActivity

with profile(activities=[ProfilerActivity.CPU, ProfilerActivity.CUDA]) as prof:
    train_one_step(model, batch)        # 한 스텝으로 충분하다. profiler 자체가 비싸다
print(prof.key_averages().table(sort_by="cuda_time_total", row_limit=10))
```

표는 위에서부터 읽는다. 비싼 항목이 kernel(convolution, 행렬곱, scatter 연산)이면 **계산 병목**이다. `aten::copy_`·`cudaMemcpyAsync`나 데이터 로딩 쪽에 시간이 앉아 있으면 **입력 병목**이다.

## DataLoader — 대개 여기가 범인

인자를 기본값으로 둔 `DataLoader`는 모든 batch를 메인 프로세스에서 하나씩 만들고, 그동안 GPU는 기다린다. <mark>GPU 사용률이 20%에서 머물면 먼저 볼 곳이 이 기본값이다.</mark>

```python
from torch.utils.data import DataLoader

loader = DataLoader(
    dataset,
    batch_size=64,
    shuffle=True,
    num_workers=8,            # GPU보다 앞서서 batch를 만드는 별도 프로세스 개수
    pin_memory=True,          # page-locked 호스트 메모리. 복사와 계산이 겹칠 수 있다
    persistent_workers=True,  # 에폭마다 worker를 다시 띄우지 않는다
    prefetch_factor=4,        # worker 하나가 미리 준비해 두는 batch 수
)
```

| 설정 | 실제로 하는 일 |
| --- | --- |
| `num_workers` | 그 수만큼의 자식 프로세스가 batch를 통째로, 미리, 병렬로 만든다. `0`이면 메인 프로세스가 직접 만들고 아무것도 겹치지 않는다 |
| `pin_memory` | batch를 swap 대상이 되지 않는 page-locked 호스트 메모리에 쓴다. 덕분에 호스트→GPU 전송이 비동기로 돌아 직전 스텝의 계산과 겹친다 |
| `persistent_workers` | 에폭 사이에 worker를 살려 둔다. 프로세스 기동과 데이터셋 초기화 비용을 에폭마다 다시 내지 않는다 |
| `prefetch_factor` | worker가 큐에 쌓아 두는 batch 수. 올리면 항목별 처리 시간이 고르지 않아도 잘 버티는데, 호스트 메모리를 더 쓴다 |

`pin_memory=True`는 전송이 실제로 **비동기일 때만** 제값을 한다. 복사 쪽에 `non_blocking=True`가 같이 있어야 한다.

```python
x = x.to("cuda", non_blocking=True)
```

**조정하는 법:** `num_workers=4`로 시작해 사용률을 보면서 두 배씩 올리고, 사용률이 더 안 오르는 지점에서 멈춘다. 상한은 대략 GPU 하나당 쓸 수 있는 CPU 코어 수다. 그 위로 올리면 worker끼리 코어와 메모리 대역폭을 다투고, 많이 띄우는 쪽이 오히려 느리다.

## worker가 너무 많을 때: ancdata 오류

`num_workers`를 충분히 올리면 PyTorch가 이렇게 죽는다.

```
RuntimeError: received 0 items of ancdata
```

worker 프로세스는 tensor를 파일 디스크립터 (프로세스가 열어 둔 파일이나 소켓마다 하나씩 받는 번호) 형태로 소켓을 통해 메인 프로세스에 넘긴다. worker가 많고, 떠 있는 batch가 많고, batch마다 tensor가 많으면 프로세스당 열 수 있는 파일 수 한계에 걸린다. 시도할 순서대로 세 가지 방법이 있다.

1. `num_workers`를 줄인다. **대개 이게 정답이고**, 줄이는 편이 더 빠른 경우도 흔하다.
2. 한계를 올린다. `ulimit -n`으로 현재 값을 보고 `ulimit -n 65535`로 현재 셸에서 올린다(hard limit까지만 올라가며, 그 값은 `ulimit -Hn`으로 본다).
3. tensor를 공유하는 방식을 바꾼다. 스크립트 맨 앞, worker가 하나도 뜨기 전에 넣어야 한다.

```python
import torch.multiprocessing as mp
mp.set_sharing_strategy("file_system")   # 기본값은 "file_descriptor"
```

`file_system` 전략은 tensor마다 디스크립터를 하나씩 쓰지 않는다. 절충할 점은, 프로세스가 험하게 죽으면 아무도 치우지 않는 **공유 메모리 파일이 남는다**는 것이다.

## Mixed precision

AMP (automatic mixed precision)는 연산 대부분을 16비트로 돌리면서, optimizer 업데이트용으로 **32비트 weight 복사본**을 따로 들고 있다. reduction과 손실 계산은 32비트에 남고, 그게 안정성을 지켜 준다. 어떤 연산을 어느 쪽에 둘지는 PyTorch가 연산별로 정하고, 직접 표시할 건 없다.

빨라지는 이유는 두 가지다. tensor core가 16비트 행렬곱을 32비트보다 몇 배 빠르게 처리하고, activation의 폭이 절반이 되면 **메모리 트래픽도 절반이 된다**. batch가 차지하는 메모리도 줄어서, 속도 이득 위에 batch 크기까지 더 키울 수 있는 경우가 많다.

```python
import torch

# model, opt, loader, loss_fn은 이미 있다고 가정
scaler = torch.amp.GradScaler("cuda")      # torch.cuda.amp.GradScaler는 deprecated

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

scaler가 필요한 이유는 fp16 (16-bit floating point)의 지수 범위가 좁기 때문이다. 대략 6e-8보다 작은 gradient는 0으로 떨어지고, gradient가 전부 0으로 떨어진 층은 **조용히 학습을 멈춘다**. `GradScaler`는 `backward()` 전에 손실에 큰 값을 곱해 두고, optimizer 스텝 전에 gradient를 원래 크기로 되돌리며, 무한이나 NaN (not a number)이 돌아온 스텝은 건너뛰면서 곱하는 값을 낮춘다.

bf16 (bfloat16)은 32비트 float과 지수 범위가 같고 mantissa 비트만 적다. 그래서 0으로 떨어질 일이 없고 **scaler가 필요 없다**.

```python
with torch.autocast(device_type="cuda", dtype=torch.bfloat16):
    loss = loss_fn(model(x), y)
```

대신 최근 카드가 필요하다 — **Ampere 세대 이상**. 그 이전 하드웨어에서는 bf16이 아예 안 되거나 소프트웨어로 처리되어 느리므로, 거기서는 fp16 + scaler가 맞는 선택이다.

**mixed precision은 수치 계산을 조금 바꾼다.** 32비트로 돌린 같은 설정과 비트 단위로 같은 결과가 나오지 않고, 두 손실 곡선이 조금 다른 것은 버그가 아니라 당연한 일이다. 기존 fp32 실행을 정확성 확인의 기준으로 쓰고 있다면 그 실행은 남겨 둔다.

## batch가 메모리에 안 들어갈 때

첫 수단은 **gradient accumulation**, 곧 [기본 학습 루프](../training-basics-ko/)에서 다룬 그것이다. 작은 batch를 몇 번 돌리고 스텝은 한 번만 밟아서, 작은 batch의 메모리로 실효 batch를 되찾는다. `autocast` 아래에서는 `loss.backward()` 자리에 `scaler.scale(loss).backward()`가 들어가는 것만 다르고, 손실을 누적 횟수로 나눠야 하는 것도 그대로다.

**Gradient checkpointing**은 한 걸음 더 간다. 중간 activation을 들고 있지 않고 backward 때 다시 계산한다. 비싼 블록을 `torch.utils.checkpoint.checkpoint(block, x, use_reentrant=False)`로 감싸면 된다. 계산을 20~30% 더 쓰는 대신 메모리를 크게 아끼므로, 안 쓰면 아예 못 돌리는 상황에서만 쓸 만하다.

**`torch.cuda.empty_cache()`는 답이 되는 경우가 거의 없다.** 캐시 블록을 드라이버에 돌려주는 것뿐이고 tensor가 참조 중인 메모리는 하나도 놓지 않으며, allocator가 곧 다시 가져간다. `nvidia-smi` 숫자만 보기 좋아지고 학습은 느려진다.

## torch.compile

`model = torch.compile(model)`은 모델을 추적해 연산을 합치고 kernel을 생성한다. 조밀하고 모양이 고정된 모델에서는 한 줄 바꿔서 실제로 빨라지는 경우가 많으니, **한 번은 재 볼 가치가 있다**. 비용은 첫 스텝이 느린 것(컴파일에 수십 초에서 몇 분)과, 입력 모양이 바뀔 때마다 다시 컴파일한다는 것이다. 분자 그래프는 batch마다 모양이 바뀐다(분자마다 원자·결합·조각 개수가 다르다). 그래서 컴파일한 그래프 신경망은 **평생 재컴파일만 하다가** 그냥 돌리는 쪽보다 느려질 수 있다. 모양이 고정된 모델에서 시도하고, 첫 에폭이 아니라 두 번째 에폭으로 시간을 재고, batch 모양이 제각각이고 모델이 작으면 손대지 않는다.

## 대개 문제가 아닌 것들

- **optimizer 선택.** AdamW냐 SGD (stochastic gradient descent)냐는 수렴에 관한 결정이고 속도 문제가 아니다. optimizer 스텝은 forward·backward 옆에 두면 반올림 오차 수준이다.
- **에폭 사이의 `.item()`과 로그 기록.** 에폭마다 scalar 한 번 읽고, 로그 한 줄 쓰고, 체크포인트 저장하는 것 — 측정에 걸리지도 않는다.
- **출력 (print).** 스텝 수천 번의 안쪽 루프에서 찍는 게 아니라면 상관없다. 그 경우도 print보다는 아래의 동기화가 비용이다.

마지막 항목의 진짜 버전은 이렇다. 루프 **안에서** tensor에 `.item()`·`.cpu()`·`.numpy()`·`float()`을 호출하면 CPU가 GPU 작업이 끝날 때까지 기다리게 되고, worker와 pin memory로 만들어 둔 겹침이 그대로 깨진다. 장치 위에서 누적하고 한 번만 읽는다.

```python
total = torch.zeros((), device="cuda")
for x, y in loader:
    loss = loss_fn(model(x), y)
    total += loss.detach()            # 장치에 그대로 둔다. 동기화 없음
print(float(total) / len(loader))     # 루프가 끝난 뒤 동기화 한 번
```

## 증상별 대처

| 증상 | 짐작되는 원인과 대처 |
| --- | --- |
| GPU 사용률 10~30% | 입력 병목. `num_workers`를 올리고, `pin_memory=True` + `non_blocking=True`, `persistent_workers=True`. 에폭마다 다시 계산하는 건 캐시하거나 미리 특징으로 만들어 둔다 |
| 사용률 95%인데도 느림 | 정말로 계산 병목. mixed precision, 더 큰 batch, 더 작은 모델, 아니면 카드를 늘린다. 여기서 DataLoader를 만져도 소용없다 |
| OOM (out of memory) | batch 크기를 줄이고, 실효 batch를 유지하려면 gradient accumulation. mixed precision도 메모리를 아껴 준다. gradient checkpointing은 마지막 수단 |
| 첫 에폭만 유난히 느림 | 한 번만 드는 비용 — 데이터셋 구성, 첫 읽기라 파일시스템 캐시가 비어 있음, 또는 `torch.compile` 컴파일. `persistent_workers=True`로 worker 기동 비용을 한 번만 내고, 시간은 항상 두 번째 에폭부터 잰다 |
| 실행마다 속도가 다름 | 같은 카드에 다른 사람이 올라와 있거나(`nvidia-smi`로 확인), 같은 저장장치에 I/O (input/output)가 겹치거나, 온도·전력 때문에 클럭이 떨어지거나, 항목별 처리 시간 차가 커서 worker가 제각각 멈추는 것 |

## GPU가 둘 이상일 때

GPU 하나짜리 파이프라인이 정말로 꽉 찬 다음 — 사용률이 높고 DataLoader가 더는 한계가 아닐 때 — 카드를 하나 더 붙이면 에폭이 대략 절반이 된다. 이때 쓰는 건 **`DataParallel`이 아니라 DDP** (DistributedDataParallel)다. DDP는 GPU마다 프로세스를 하나씩 띄우고 gradient all-reduce (카드 전체의 gradient를 합산해 모든 카드에 돌려주는 연산)를 backward와 겹쳐 돌리는데, 옛 `DataParallel`은 한 프로세스가 모든 카드를 몰아서 GPU 0이 메모리와 Python 인터프리터 양쪽에서 병목이 된다. 파이프라인이 차기 전에 카드를 늘리면 노는 시간만 배로 늘고, 하이퍼파라미터 탐색이라면 작업 하나를 여러 카드로 쪼개는 것보다 **카드마다 독립된 작업 하나씩** 돌리는 쪽이 거의 항상 낫다.

## 정리

- **진단이 먼저다.** `watch -n 1 nvidia-smi`, 원인이 애매하면 `torch.profiler`. 사용률이 낮으면 입력 쪽, 높으면 모델 쪽
- `num_workers` + `pin_memory` + `persistent_workers`가 느린 학습 대부분을 고친다. `num_workers`는 사용률이 더 안 오를 때까지 올리고, 상한은 GPU당 CPU 코어 수 근처
- `received 0 items of ancdata`는 **worker가 열 수 있는 파일 수 한계를 넘었다는 뜻** — `num_workers`를 줄이거나, `ulimit -n`, 또는 `file_system` 공유 전략
- mixed precision은 `torch.autocast` + `torch.amp.GradScaler`. bf16은 scaler가 필요 없지만 최근 카드가 필요하고, **둘 다 fp32와 비트 단위로 같지는 않다**
- batch가 안 들어가면 **gradient accumulation**, 그다음이 checkpointing. `empty_cache()`는 얻는 게 없다
- `torch.compile`은 한 번 재 볼 가치가 있고, 분자 그래프에서는 대개 득이 없다
- 안쪽 루프 **안에서** `.item()`·`.cpu()`를 부르지 않는다. 동기화는 스텝마다가 아니라 에폭마다 한 번
- DDP는 **GPU 하나짜리 파이프라인이 꽉 찬 다음에** 꺼낸다

## 참고

- [PyTorch 성능 튜닝 가이드](https://docs.pytorch.org/tutorials/recipes/recipes/tuning_guide.html) — DataLoader 설정부터 분산 학습까지 정리된 기본 목록
- [Automatic mixed precision recipe](https://docs.pytorch.org/tutorials/recipes/recipes/amp_recipe.html) · [AMP 예제](https://docs.pytorch.org/docs/stable/notes/amp_examples.html) — accumulation과 gradient clipping을 포함한 scaler 사용 패턴
- Micikevicius et al., [Mixed precision training](https://arxiv.org/abs/1710.03740), *ICLR* (2018) — loss scaling과 32비트 weight 복사본이 나온 논문
- [torch.utils.data](https://docs.pytorch.org/docs/stable/data.html) · [torch.compiler](https://docs.pytorch.org/docs/stable/torch.compiler.html) — DataLoader 인자 전체, 그리고 컴파일이 다루는 것과 못 다루는 것
