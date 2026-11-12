---
title: "학습 루프: learning rate, 스케줄, 그리고 멈추는 시점"
date: 2024-10-18
description: "한 step에서 실제로 벌어지는 일 · 에폭·batch·iteration을 제대로 세는 법 · learning rate를 어디서 출발할까 · optimiser·스케줄·batch 크기 · early stopping, seed, 그리고 알아둘 만한 고장 다섯 가지"
category: concept
updated: 2024-11
lang: ko
group: training-basics
topic: Machine learning
subtopic: Basics
tags: [learning rate, optimiser, early stopping, reproducibility]
---

모델·손실 함수·optimiser, [이 셋이 학습의 전부](../ml-and-dl-ko/)인데 `model.fit()`은 그 안의 결정을 전부 가려 준다. 한 step에서 무슨 일이 일어나는지, 손잡이 하나하나가 무엇을 바꾸는지, 언제 멈추기로 하는지가 그 안에 있다.

## 한 step

데이터 batch 하나마다 네 가지가 이 순서로 일어난다.

1. **forward pass** — 모델이 입력을 예측으로 바꾼다.
2. **손실** — 그 예측이 얼마나 틀렸는지를 숫자 하나로 만든다.
3. **backward pass** — backpropagation으로 모든 파라미터에 대한 손실의 gradient를 구한다. 각 weight를 어느 쪽으로 움직이면 손실이 커지는지에 해당한다.
4. **optimiser step** — 모든 weight가 그 반대 방향으로 조금 움직인다.

그리고 반복한다. PyTorch에서는 정말로 다섯 줄이다.

```python
import torch
model = torch.nn.Sequential(torch.nn.Linear(20, 64), torch.nn.ReLU(), torch.nn.Linear(64, 1))
opt = torch.optim.AdamW(model.parameters(), lr=1e-3)
X, y = torch.randn(512, 20), torch.randn(512, 1)
loader = torch.utils.data.DataLoader(torch.utils.data.TensorDataset(X, y), batch_size=32)

for x, target in loader:                                  # loader를 한 바퀴 = epoch 하나
    opt.zero_grad()                                       # gradient는 누적되므로 먼저 비운다
    loss = torch.nn.functional.mse_loss(model(x), target) # 1 + 2: forward와 손실
    loss.backward()                                       # 3: 모든 파라미터의 .grad를 채운다
    opt.step()                                            # 4: 업데이트
```

사람들이 빼먹는 줄이 `opt.zero_grad()`다. PyTorch는 새 gradient를 `.grad`에 이미 있던 값에 **더한다.** 이걸 안 비우면 매 step이 앞 step에 오염된다. 학습은 그래도 돌아가고 성능만 나빠진다.

## 에폭 (epoch), batch, iteration

세 단어를 섞어 쓰는 일이 많은데 같은 것이 아니다.

| 용어 | 정의 |
| --- | --- |
| **batch** | gradient를 평균해서 업데이트 **한 번** 을 만드는 표본 집합 |
| **iteration** (step) | optimiser 업데이트 한 번 — batch 하나가 들어가고 `opt.step()` 하나가 나온다 |
| **에폭** | 학습셋을 한 바퀴 전부 도는 것 |

그래서 산수는 이렇다. epoch당 iteration 수 = ⌈N / B⌉, N은 학습셋 크기, B는 batch 크기.

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

표본 10,000개에 batch 32면 312가 아니라 **313** 이다. 마지막 batch는 16개만 든 짧은 것이다 (`drop_last=True`로 버리면 312가 된다). <mark>50 epoch을 돌리면 모델이 50번 업데이트되는 게 아니라 15,650번 업데이트된다.</mark>

<figure>
<img src="/assets/fig/epoch-batch-iteration.svg" alt="Batches, iterations and epochs counted for 10,000 samples at batch size 32" loading="lazy" />
<figcaption><b>epoch 하나를 세어 보면.</b> batch는 312개가 아니라 313개이고 마지막 하나는 절반만 찼다. scheduler나 patience를 어느 단위로 세느냐에 따라 같은 학습이 50번이 되기도 하고 15,650번이 되기도 한다.</figcaption>
</figure>

scheduler와 early stopping은 둘 중 한 단위로 세므로 이 구분이 그대로 결과를 바꾼다. epoch마다 한 번 밟을 생각으로 만든 scheduler를 iteration마다 밟으면 313배 빠르게 감쇠한다.

## learning rate

<mark class="blue">learning rate는 다른 걸 건드리기 전에 대략이라도 맞춰 놔야 하는 유일한 hyperparameter다.</mark> 아래 식의 η이고,

$$
w \leftarrow w - \eta \, g
$$

그게 전부다. gradient를 weight에서 빼기 직전에 곱하는 그냥 배수다.

작은 신경망이 쉽게 푸는 20개 특징 회귀에서 두 가지 고장이 어떻게 보이는지.

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
# lr=10       loss after 200 steps = 15.98     (16.22에서 시작 — 제자리)
# lr=0.01     loss after 200 steps = 0.0068
# lr=1e-07    loss after 200 steps = 16.21     (16.22에서 시작 — 움직이지 않았다)
```

**너무 크면** step마다 지나쳐 버린다. 손실이 튀고 가라앉지 않으며, 지수나 log가 들어간 깊은 모델이면 수백 step 안에 NaN (not a number)으로 가서 돌아오지 않는다. **너무 작으면** 손실이 떨어지기는 한다. 매끄럽게, 그럴듯하게, 도착하기에는 턱없이 느리게. 나쁜 손실값에서 평평해진 그래프는 모델이 과제를 못 배우는 것처럼 보이지만, learning rate가 100배 작은 경우가 흔하다.

AdamW 기준 출발점.

| 상황 | 흔한 learning rate 출발값 |
| --- | --- |
| 처음부터 학습 | 1e-3 |
| 사전학습된 encoder 파인튜닝 | 1e-4 — 10배 낮게 잡아 [사전학습 weight](../transfer-learning-ko/)를 덮어쓰지 않는다 |
| linear probe (encoder 동결, head만) | 1e-3 ~ 1e-2 — 망가질 게 없으니 크게 간다 |
| SGD + momentum으로 처음부터 | 1e-2 ~ 1e-1, Adam 숫자보다 10~100배 위 |

이건 답이 아니라 출발점이다. **맞는 값은 batch 크기와 optimiser에 달려 있다.** batch 1024로 학습한 논문에서 가져온 숫자는 batch 32짜리 실험에 그대로 쓸 수 없고, SGD의 learning rate는 Adam의 learning rate가 아니다. 짐작 대신 값을 얻고 싶으면 **learning rate range test** 가 적은 비용으로 알려 준다. 수백 iteration 동안 learning rate를 기하적으로 올리면서 손실이 발산하기 시작하는 지점을 보고, 그보다 아래를 쓰면 된다. 다른 설정들과 함께 제대로 탐색하는 방법은 [hyperparameter 고르기](../hyperparameter-search-ko/)에 있다.

## optimiser

| optimiser | 무엇을 더하나 | 언제 |
| --- | --- | --- |
| **SGD** (stochastic gradient descent) | 아무것도 — 업데이트가 정확히 `w -= lr * grad` | baseline, 그리고 전부 직접 제어하고 싶을 때 |
| **SGD + momentum** | 과거 gradient의 이동평균. noise와 작은 요동을 지나며 방향을 유지한다 | 대규모 비전. 잘 튜닝한 SGD가 여전히 일반화가 가장 좋다 |
| **Adam** (adaptive moment estimation) | gradient의 평균과 제곱 크기 추정치로 파라미터마다 step 크기를 따로 | gradient가 희소하거나 스케일이 제각각일 때, 그리고 한 번에 돌아가길 바랄 때 |
| **AdamW** (Adam with decoupled weight decay) | weight decay를 gradient를 통하지 않고 weight에 직접 적용 | 기본값 |

**기본값은 AdamW다.** 거의 기본 learning rate에서 빨리 수렴하고, 지금 시험하려는 대상이 optimiser가 아닐 때 그게 가장 중요하다.

고전적인 Adam은 손실에 weight를 제곱해 더한 L2 항을 얹어서 weight decay를 구현하는데, 그러면 decay 항도 gradient와 똑같은 파라미터별 적응 스케일링을 통과한다. 큰 gradient를 오래 받아 온 파라미터일수록 decay를 **덜** 받는다. 정작 필요 없는 쪽이 더 받는 셈이고, 정규화의 실효 세기가 learning rate와 엉켜서 한쪽을 다시 튜닝하면 다른 쪽이 조용히 바뀐다. AdamW는 decay를 weight에서 바로 빼기 때문에 `weight_decay`가 독립적인 손잡이가 된다.

## 스케줄

learning rate가 상수일 필요는 없다. **scheduler** 가 학습 도중에 그 값을 바꾼다.

| 스케줄 | 모양 |
| --- | --- |
| **constant** | 끝까지 한 값 |
| **step** | 유지하다가 정해진 지점에서 일정 비율 (보통 0.1)을 곱한다 |
| **cosine** | 기준값에서 거의 0까지 코사인 반 주기로 매끄럽게 감쇠 |
| **linear warmup** | 처음 수백 iteration 동안 거의 0에서 올린 뒤 위의 스케줄로 넘긴다 |

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

찍힌 숫자가 곧 모양이다. step은 1e-3을 평평하게 유지하다 에폭 30·60·90에서 10배씩 떨어져 1e-6으로 끝난다. cosine은 기준값에서 서서히 벗어나고 (5 에폭 뒤 9.94e-4), 중간 지점에서 정확히 절반이며, 2.47e-7로 끝난다. warmup은 기준값의 1/5에서 시작해 에폭 5에 기준값에 닿고, 실제 학습이라면 거기서 cosine으로 넘긴다.

**warmup이 있는 이유는 첫 수백 번의 업데이트가 가장 위험하기 때문이다.** weight가 무작위라 초기 gradient가 크고, Adam이 들고 있는 gradient 평균·제곱 크기 추정치는 batch 몇 개로 만든 것이라 그것이 지시하는 파라미터별 스케일링은 noise다. 크고 스케일도 엉망인 gradient에 전속력 step을 밟으면 weight가 회복 불가능한 자리로 튕겨 나갈 수 있다. 수백 iteration 동안 올려 주는 비용은 사실상 0인데 이 고장 유형이 통째로 사라진다. 그리고 batch가 클수록 더 필요해진다.

**cosine 감쇠가 흔한 기본값인 이유** 는 경계 지점을 고를 필요가 없고, optimiser가 떨어질 절벽이 없고, 마지막 epoch들이 해를 가다듬을 만큼 충분히 작게 끝나기 때문이다.

실전에서 자주 틀리는 것 하나. 위 코드는 `sched.step()`을 epoch마다 한 번 밟는다. warmup은 단위가 iteration이므로 보통 iteration마다 밟는다.

## batch 크기

batch 크기는 gradient의 noise를 메모리와 실제 걸리는 시간과 맞바꾼다. batch 크기가 처리량에 무엇을 하는지, 그리고 epoch을 더 빨리 끝내는 방법은 [학습을 빠르게 돌리기](../training-speed-ko/)에 있다.

| batch가 클 때 | batch가 작을 때 |
| --- | --- |
| gradient 추정이 덜 흔들린다 | 추정이 더 흔들리고, 그게 약한 정규화 (regularization)가 된다 |
| GPU를 잘 채워서 epoch당 빠르다 | GPU가 비고 느리다 |
| 메모리를 많이 쓴다 — 한계는 보통 여기서 온다 | 어디서든 돌아간다 |
| epoch당 업데이트 수가 적다 | epoch당 업데이트 수가 많다 |

batch가 크면 gradient가 더 믿을 만하므로 그만큼 큰 step을 밟을 여유가 생긴다. 대략의 규칙이 **선형 스케일링이다. batch 크기를 k배 하면 learning rate도 k배 한다** (warmup과 함께. 원래 이 규칙이 확인된 조건이 그렇다). SGD에서는 꽤 넓은 범위에서 성립하고, Adam에서는 √k를 쓰는 사람이 많다. 어느 쪽이든 법칙이 아니라 확인해 볼 출발점이다.

원하는 batch가 메모리에 안 들어가면 **gradient accumulation** 으로 결국 만들어낸다. 작은 batch를 여러 번 돌려 gradient를 합치고 한 번만 step을 밟는다.

```python
import torch
from torch.utils.data import DataLoader, TensorDataset

ACCUM = 8                                  # loader batch 32 × 8 = 실효 batch 256
model = torch.nn.Linear(8, 1)
opt = torch.optim.AdamW(model.parameters(), lr=1e-3)
loader = DataLoader(TensorDataset(torch.randn(256, 8), torch.randn(256, 1)), batch_size=32)

steps = 0
for i, (x, y) in enumerate(loader):
    (torch.nn.functional.mse_loss(model(x), y) / ACCUM).backward()   # gradient는 합쳐지므로 나눈다
    if (i + 1) % ACCUM == 0:
        opt.step(); opt.zero_grad(); steps += 1
print("micro-batches:", i + 1, "| optimiser steps:", steps)   # 8 | 1
```

손실을 `ACCUM`으로 나누는 건 필수다. 안 나누면 누적된 gradient가 8배 커지고 실효 learning rate도 같이 커진다. accumulation이 재현하지 못하는 한 가지는 정규화 통계다. batch normalisation은 여전히 256개가 아니라 32개씩만 본다.

## 언제 멈추나

training loss는 사실상 끝없이 떨어진다. 표현력이 충분한 모델은 epoch만 넉넉하면 [학습셋을 통째로 외운다](../ml-and-dl-ko/). 그래서 언제 멈출지는 training loss가 알려주지 못한다. validation loss는 알려준다. 떨어지다 바닥을 치고 다시 올라가는데, 그 바닥의 weight가 우리가 원하는 것이다.

**early stopping with patience** 가 그걸 자동으로 한다. `patience`는 새 최저값이 안 나와도 참아 주는 연속 validation 횟수다. epoch마다 한 번 검증한다면 patience 5는 개선 없는 에폭 다섯 번을 뜻한다.

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

주석 처리된 `torch.save`가 핵심이다. **마지막 checkpoint가 아니라 가장 좋았던 checkpoint를 되살린다.** 구조상 멈추는 시점은 최적 모델이 나온 뒤 `patience` 에폭 지난 뒤이므로, 루프가 끝난 순간 메모리에 있는 weight는 그동안 본 중 가장 나쁜 것이다. 위 예에서 마지막 모델은 0.46, 실제로 써야 할 모델은 0.37이다.

두 가지 더. `patience`는 스케줄과 상호작용한다. cosine 스케줄에서 일찍 멈추면 learning rate가 감쇠하기 전에 멈춘 것이므로, 스케줄 길이는 실제로 쓸 에폭 예산에 맞춰야 한다. 그리고 epoch을 고르는 세트는 validation set이고 test set이 아니다. [test set이 epoch을 고르는 순간 그것은 더 이상 test set이 아니다](../evaluation-protocol-ko/).

## 정규화, 짧게

- **weight decay** 는 매 step마다 weight를 0 쪽으로 당겨서 맞춰지는 함수를 더 매끄럽게 유지한다. AdamW라면 1e-2가 무난한 기본값이다.
- **dropout** 은 학습 중에 활성값의 일부를 무작위로 0으로 만들어, 특정 유닛 하나에 의존하지 못하게 한다. p는 보통 0.1~0.5이고, 평가 때는 반드시 꺼야 한다. `model.eval()`이 그 일을 하며, 이걸 잊으면 보고하는 모든 숫자가 noise가 된다.
- **데이터를 늘리는 쪽이 둘 다를 이긴다.** 유효한 변환이 있을 때 손쉽게 늘리는 방법이 [데이터 증강](../augmentation-ko/)이다.

## 재현성

```python
import random, numpy as np, torch
SEED = 43
random.seed(SEED); np.random.seed(SEED); torch.manual_seed(SEED)
torch.cuda.manual_seed_all(SEED)
torch.use_deterministic_algorithms(True)   # 결정론적 구현이 없는 연산이면 예외를 던진다
print("deterministic:", torch.are_deterministic_algorithms_enabled())   # True
```

seed를 심어야 하는 생성기가 하나가 아니라 세 개다. Python의 `random` (직접 쓴 셔플·샘플링), NumPy의 것 (전처리 대부분), torch의 것 (초기화, dropout, DataLoader의 shuffle). `torch.use_deterministic_algorithms(True)`는 한 걸음 더 나가서, 결정론적 버전이 없는 연산을 조용히 빠른 쪽으로 돌리는 대신 아예 거부하게 만든다. CUDA에서는 환경변수 `CUBLAS_WORKSPACE_CONFIG=:4096:8`도 필요하고, DataLoader worker는 `worker_init_fn`으로 따로 seed를 줘야 한다.

그렇게 해도 한계가 남는다. 일부 CUDA kernel은 비트 단위로 재현되지 않고, atomic 연산은 스케줄러가 만든 순서대로 누적되며, 같은 코드를 같은 seed로 같은 장비에서 돌려도 다른 숫자가 나올 수 있다. 이게 seed를 건너뛸 이유는 아니다. [결과를 seed 여러 개의 평균으로 보고하는](../evaluation-protocol-ko/) 이유일 뿐이다. 주장하는 개선폭이 seed 간 편차보다 작으면 보고할 개선이 없는 것이다.

## 이럴 때 뭐가 고장났나

- **손실이 NaN이다.** 거의 항상 learning rate가 너무 높다. 10으로 나눠서 다시 돌려 본다. 아니면 손실 어딘가의 `log(0)`이나 0으로 나누기인데, 확률을 기대하는 함수에 raw logit을 넣었을 때가 많다.
- **손실이 첫 step부터 평평하다.** learning rate가 한참 낮거나, 아무것도 연결이 안 된 것이다. `opt.zero_grad()`와 `loss.backward()` 순서가 뒤바뀜, optimiser에 안 들어간 파라미터, 풀어 줄 생각이었는데 동결된 encoder. 라벨이 섞였거나 어긋난 경우도 똑같이 보인다. 손실이 우연 수준에 앉아서 움직이지 않는다.
- **training loss가 validation loss보다 훨씬 낮다.** 과적합이다. 데이터 늘리기, 증강, weight decay, dropout, 더 일찍 멈추기, 표현력 줄이기 — [선호하는 순서가 그렇다](../ml-and-dl-ko/).
- **validation loss가 training loss보다 낮다.** 보통 버그가 아니다. dropout은 학습 중에만 켜져 있어서 training 숫자가 불리하고, training loss는 에폭 내내 평균 낸 값인데 validation은 그 epoch이 끝난 뒤 더 좋아진 weight로 재기 때문이다.
- **메모리 부족** (OOM, out of memory). batch 크기를 줄이고, 실효 batch는 gradient accumulation으로 되찾고, 아니면 [mixed precision](../training-speed-ko/)으로 바꾼다. AMP (automatic mixed precision)는 활성값을 16비트로 들고 있어서 보통 메모리를 절반으로 줄여 준다.

## 정리

- 한 step은 forward → 손실 → backward → 업데이트, 그리고 그 앞에 `opt.zero_grad()`
- epoch당 iteration = ⌈N / B⌉. 표본 10,000개에 batch 32면 313 iteration, 50 epoch이면 15,650번 업데이트
- learning rate는 gradient에 곱하는 수. 너무 크면 튀거나 NaN, 너무 작으면 도착하지 못한다
- 처음부터 학습은 1e-3, 파인튜닝은 1e-4에서 출발하고, batch 크기가 다른 논문의 값을 그대로 가져오지 않는다
- 기본은 AdamW. warmup이 첫 수백 step을 보호하고, 나머지는 cosine 감쇠가 맡는다
- batch가 크면 noise가 줄고 메모리를 더 쓰며, learning rate도 함께 커진다
- validation loss와 patience로 멈추고, **마지막이 아니라 가장 좋았던 checkpoint를 되살린다**
- 생성기 셋 다 seed를 심고, 그래도 결과는 seed 여러 개의 평균으로 보고한다

## 참고

- Loshchilov & Hutter, [Decoupled Weight Decay Regularization](https://arxiv.org/abs/1711.05101) (ICLR 2019) — AdamW가 왜 나왔고 decoupling이 무엇을 고치는가
- Smith, [Cyclical Learning Rates for Training Neural Networks](https://arxiv.org/abs/1506.01186) (2015) — learning rate range test가 여기 들어 있다
- Goyal et al., [Accurate, Large Minibatch SGD: Training ImageNet in 1 Hour](https://arxiv.org/abs/1706.02677) (2017) — 선형 스케일링 규칙과 그걸 돌아가게 만드는 warmup
