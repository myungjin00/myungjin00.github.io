---
title: "Loss 함수: 모델에게 실제로 무엇을 시키고 있는가"
date: 2024-11-01
description: "loss가 곧 명세다 · 제곱오차·절대오차·Huber, 라벨이 더러울 때 어느 쪽인가 · accuracy가 아니라 cross-entropy인 이유 · triplet·InfoNCE·NT-Xent를 목표에서부터 쌓아 보기 · temperature가 실제로 바꾸는 것 · 그리고 loss가 조용히 엉뚱한 걸 시키게 되는 경로들"
category: concept
updated: 2024-11
lang: ko
group: loss-functions
topic: Machine learning
subtopic: Basics
tags: [loss functions, contrastive learning, optimisation]
---

[학습 한 step](../training-basics-ko/)은 loss를 gradient로, gradient를 weight 업데이트로 바꾼다. 과제가 모델에 들어오는 문은 loss 하나뿐이다. 모델은 "과제"를 배우는 게 아니라 숫자 하나를 최소화한다. 내가 중요하게 생각하는 것이 그 숫자 안에 들어 있지 않으면 학습되지 않고, 다른 데를 아무리 튜닝해도 되돌아오지 않는다.

## 회귀 loss

세 가지가 있고, 오차가 커질 때 벌점이 어떻게 자라는지만 다르다.

| loss | 식 | 벌점의 모양 | 적합한 상황 |
| --- | --- | --- | --- |
| **MSE** (mean squared error) | $\frac{1}{n}\sum_i (y_i - \hat y_i)^2$ | 2차 — 오차가 2배면 비용은 4배 | 오차가 대체로 대칭이고 라벨을 다 믿을 수 있을 때. 기본값 |
| **MAE** (mean absolute error) | $\frac{1}{n}\sum_i \lvert y_i - \hat y_i \rvert$ | 선형 — 오차 크기에 비례해서만 비싸진다 | 모델이 따라가지 않았으면 하는 outlier가 라벨에 섞여 있을 때. 0에서 미분이 안 된다 |
| **Huber** / smooth L1 | $\delta$ 아래는 2차, 위는 선형 | 0 근처는 2차, 멀어지면 선형 | MAE의 robust함과 MSE의 매끄러운 gradient를 둘 다 원할 때 |

Huber는 노골적인 절충이다.

$$
L_\delta(e) = \begin{cases}
\tfrac{1}{2}e^{2} & \lvert e \rvert \le \delta \\[2pt]
\delta\left(\lvert e \rvert - \tfrac{1}{2}\delta\right) & \text{otherwise}
\end{cases}
$$

MAE의 문제는 0에서 꺾인다는 것이다. gradient가 어디서나 $\pm 1$이고 오차가 줄어도 같이 줄지 않으니, 수렴 막바지에 모델이 최적점을 같은 보폭으로 넘나든다. Huber는 그게 문제가 되는 구간은 2차로 두고, outlier가 있는 쪽만 선형으로 바꾼다. 어디부터 "outlier"인지는 $\delta$가 정한다.

[분자 물성 예측](../mpp-ko/)에서는 이게 사소한 얘기가 아니다. 용해도나 lipophilicity 데이터셋은 여러 논문, 여러 실험실에서 모아 붙인 것이고, 아무도 기록해 두지 않은 assay 차이 때문에 라벨 몇 개가 log 단위로 2씩 틀어져 있다. MSE에서는 오차 2가 오차 0.2보다 100배 비싸다. 그래서 나쁜 라벨 몇 개가 gradient의 대부분을 가져가고, 모델은 측정 noise를 맞추는 데 표현력을 쓴다. <mark>분자 수천 개에 나쁜 라벨이 몇 개 섞인 상황에서 제곱오차와 절대오차 중 뭘 쓸지는 어느 라벨을 믿을지 고르는 일이다.</mark>

## 분류 loss

두 분류면 신경망이 **logit** $z$ 하나를 내놓는다. 범위 제한이 없는 실수이고, sigmoid가 이걸 확률로 바꾼다.

$$
p = \sigma(z) = \frac{1}{1 + e^{-z}}, \qquad
L = -\frac{1}{n}\sum_i \Big[\, y_i \log p_i + (1 - y_i)\log(1 - p_i) \,\Big]
$$

$C$개 분류면 logit을 $C$개 내놓고 softmax가 그걸 분포로 정규화한다. loss는 그중 정답 class의 항만 남긴다.

$$
p_{i,c} = \frac{\exp(z_{i,c})}{\sum_k \exp(z_{i,k})}, \qquad
L = -\frac{1}{n}\sum_i \log p_{i,y_i}
$$

softmax에 지수가 들어가는 이유가 이것이다. 전부 양수로 만들어 정규화할 수 있게 하고, logit들 사이의 *차이*만 의미를 갖게 만든다. 모든 logit에 5를 더해도 분포는 그대로다. sigmoid는 두 분류 softmax를 풀어 쓴 것이다.

보고하는 숫자는 accuracy인데 **왜 accuracy가 아니라 cross-entropy로 학습하는가.** accuracy는 맞힌 개수를 센 것이고, 개수는 평평하다. 예측 확률을 0.4에서 0.49로 옮겨도 예측 class는 그대로여서 accuracy는 꿈쩍하지 않고, gradient는 거의 모든 곳에서 0이다. cross-entropy는 예측 확률에 대해 연속이라서 모든 표본이 방향을 하나씩 보탠다. 이미 맞게 분류된 표본까지 포함해서, 더 확신하는 쪽으로 계속 밀어 준다. 최적화하는 건 loss이고 accuracy는 [보고하는 숫자](../metrics-ko/) 중 하나다. 둘이 어긋나도 된다.

**label smoothing**은 정답을 무르게 만든다. 정답 class에 1, 나머지에 0 대신 $1 - \varepsilon$을 주고 $\varepsilon$을 나머지에 나눠 준다. 보통 $\varepsilon = 0.1$을 쓴다. 정확히 1이라는 목표는 logit이 무한대일 때만 닿으니, 모델은 끝까지 받을 수 없는 loss를 쫓아 logit을 계속 키운다. smoothing은 그 동기를 없애고, 보통 확률의 calibration도 나아진다.

## Contrastive loss

이제 라벨이 아예 없는 경우다. 대신 가진 것이 **positive pair** — 가까이 놓여야 하는 두 개 — 와, 떨어져야 하는 나머지 더미다. loss는 embedding 공간의 기하에 대한 진술이 된다. 쌍은 당기고 나머지는 밀어낸다. [자기지도 사전학습](../learning-paradigms-ko/)이 쓰는 목적 함수가 이것이다.

### Triplet loss

가장 오래된 형태는 셋을 받는다. 기준 $a$, positive $p$, negative $n$, 그리고 거리 $d$.

$$
L = \max\big(0,\; d(a,p) - d(a,n) + m \big)
$$

negative가 positive보다 적어도 **margin** $m$ 만큼 더 멀어지면 loss는 0이 되고, 그 전까지는 양수다. 장치의 전부가 margin이다. $m = 0$이면 모든 입력을 같은 점으로 보내는 encoder가 loss를 완벽하게 최소화한다. $d(a,p) = d(a,n) = 0$이니 차이가 0이고, 아무것도 배우지 않는다. 이게 **trivial collapse**이고, 과제를 안 해도 만족되는 loss는 이렇게 생겼다. 순서가 아니라 *간격*을 요구하는 것이 상수 함수로는 못 내놓는 조건이다.

실제로 치르는 비용은 대부분의 triplet이 이미 조건을 만족해서 gradient를 주지 않는다는 것이다. 그래서 triplet 학습에는 batch에서 어려운 triplet을 캐내는 mining이 필요하다. 회귀 모델에 triplet 항을 얹는 것도 같은 이유이고, activity cliff를 인지하는 모델들이 [cliff](../activity-cliff-ko/) triplet으로 하는 일이 그것이다.

### InfoNCE와 NT-Xent

InfoNCE (information noise-contrastive estimation)는 negative 하나를 전부로 바꾼다. NT-Xent (normalised temperature-scaled cross-entropy)는 같은 loss를 L2 정규화된 embedding에 적용한 것에 SimCLR가 붙인 이름이고, 그래서 유사도가 cosine이 된다.

$$
\mathcal{L}_i = -\log
\frac{\exp\!\big(\mathrm{sim}(z_i,\, z_i^{+})/\tau\big)}
{\sum_{j \neq i}\exp\!\big(\mathrm{sim}(z_i,\, z_j)/\tau\big)}
$$

분수 위쪽에는 positive가 있다. 분모에는 positive *와* 모든 negative가 함께 들어간다. 그래서 positive의 유사도가 나머지에 비해 커질 때만 loss가 떨어진다.

<mark class="blue">이 식을 cross-entropy로 읽으면 전체가 분류 문제 하나가 된다. 기준이 주어졌을 때 batch에서 positive를 골라내라.</mark> 후보가 class이고, 유사도가 logit이고, positive의 번호가 정답이다. 비유가 아니라 구현이 말 그대로 유사도 행렬에 건 cross-entropy다.

```python
import torch, torch.nn.functional as F

def nt_xent(z, tau):
    z = F.normalize(z, dim=1)            # embedding 2N개. i와 i+N이 한 분자의 두 view
    sim = z @ z.T / tau                  # cosine 유사도를 temperature로 나눈 것
    sim.fill_diagonal_(-torch.inf)       # 자기 자신은 negative가 아니다
    N = z.shape[0] // 2
    target = torch.cat([torch.arange(N, 2 * N), torch.arange(0, N)])
    return F.cross_entropy(sim, target)  # "batch에서 positive를 골라내라"

torch.manual_seed(43)
z = torch.randn(128, 64)                 # 분자 64개, 각각 view 2개, 학습 전 encoder
for tau in (0.07, 0.5):
    print(f"tau={tau}: loss = {nt_xent(z, tau).item():.3f}")
print("chance level = ln(127) =", round(torch.log(torch.tensor(127.0)).item(), 3))
# tau=0.07: loss = 6.242
# tau=0.5: loss = 4.856
# chance level = ln(127) = 4.844
```

분자 64개에 view가 각각 둘이면 기준 하나당 후보가 127개다. 아무것도 모르는 encoder라면 $\ln 127 = 4.844$가 나와야 하고, $\tau = 0.5$에서 무작위 encoder가 4.856을 받는다. 사전학습을 돌리기 전에 해 볼 만한 점검이 이거다. 같은 무작위 embedding이 $\tau = 0.07$에서는 6.242, 우연 수준보다 *나쁘게* 나온다. 어떤 negative가 우연히 positive보다 가까이 있고, 작은 temperature가 그걸 제값으로 다 받아 내기 때문이다.

### Temperature

$\tau$는 softmax에 들어가기 전에 모든 유사도를 나눈다. 후보들에 대한 분포가 얼마나 뾰족해지는지를 정하는 셈이다. 유사도를 고정해 두고 negative 다섯 개를 둔 기준 하나에서, 그게 gradient에 하는 일.

```python
import torch
neg = torch.tensor([0.80, 0.40, 0.20, 0.00, -0.20])   # negative 다섯 개에 대한 cosine 유사도
for tau in (0.05, 0.2, 1.0):
    w = torch.softmax(neg / tau, 0)
    print(f"tau={tau:<5} share of the gradient on each negative: "
          + " ".join(f"{x:.3f}" for x in w))
# tau=0.05  share of the gradient on each negative: 1.000 0.000 0.000 0.000 0.000
# tau=0.2   share of the gradient on each negative: 0.826 0.112 0.041 0.015 0.006
# tau=1.0   share of the gradient on each negative: 0.329 0.221 0.181 0.148 0.121
```

이 softmax 비중이 각 negative가 밀리는 세기다. $\tau = 0.05$에서는 가장 가까운 negative가 사실상 전부를 가져가고 나머지 넷은 학습에 아예 안 쓰인다. $\tau = 0.2$에서는 0.826을 가져간다. $\tau = 1.0$에서는 다섯 개가 0.329부터 0.121까지 거의 고르다.

그러니까 **$\tau$가 작으면 loss가 스스로 hard negative mining을 한다.** 크면 모든 negative를 똑같이 대한다. 어느 쪽도 공짜는 아니다. temperature가 날카로우면 embedding이 잘 분리되지만, 분자 batch에서 가장 어려운 negative는 실제로 닮은 화합물인 경우가 많다. 유사체이거나, 같은 구조를 다른 tautomer로 적은 것이거나. 그러면 모델은 붙어 있어야 할 둘을 떼어 놓으라는 지시를 최대 세기로 받는다. temperature가 평평하면 그런 준중복에 관대해지고, 대신 표현이 공간에 덜 고르게 퍼진다. Wang과 Isola는 이걸 positive pair의 alignment와 구면 위 embedding의 uniformity 사이의 절충으로 설명한다.

$\tau$는 사소한 손잡이가 아니다. 모델이 어떤 negative로 학습되는지를 바꾸고, 따라서 표현이 무엇을 담게 되는지를 바꾼다.

### Negative는 batch에서 나온다

NT-Xent 형태에는 negative 샘플러가 없다. negative는 그냥 batch에 같이 들어온 나머지다. batch 256이면 기준당 negative가 510개, batch 32면 62개다. 후보가 62개인 분모는 쉬운 과제다. 약한 encoder도 positive를 골라내고, loss는 떨어지고, 배우는 건 거의 없다. **loss와 batch 크기는 독립적인 hyperparameter가 아니다.** contrastive 방법이 지도학습보다 훨씬 큰 batch를 요구하는 이유이고, 지난 embedding을 queue에 쌓아 두는 변형들이 있는 이유다. [학습 루프](../training-basics-ko/)에서 본 batch 크기와 learning rate의 얽힘도 여기서는 한 겹 더 일한다.

### 증강 두 번이 아니라 view 두 개

positive pair를 어디서 가져오느냐가 진짜 설계 판단이고, 그건 loss보다 앞단에 있다. 이미지에서는 같은 이미지를 두 번 증강한다. 분자에서는 증강이 안전하지 않은 단계다. 원자를 지우면 다른 화합물이 되고, 그게 [증강 기반 positive pair에 대한 반론 전체](../augmentation-ko/)다.

dual-view encoder는 쌍을 다르게 만든다. 한 분자를 원자 그래프로도, [junction tree](../fragmentation-ko/)로도 encoding하면 그 둘은 애초에 같은 분자에 대한 두 가지 서술이다. positive pair가 공짜로 생기고, 아무것도 변형하지 않았고, 라벨이 보존된다는 가정을 할 필요가 없다. 내 사전학습 작업이 쓴 구성이 이것이고, loss 자체는 손대지 않은 NT-Xent다. 분수 위쪽이 어디서 오는지만 달라졌다.

이건 분수 위쪽을 고치는 것이고 분모는 그대로다. 같은 batch에 들어온 서로 다른 분자 둘이 준중복일 수 있고, loss는 그래도 둘을 떼어 놓는다. loss 안에는 그 둘이 닮았다는 정보가 없다.

## Multi-task loss와 가중합

목적이 여러 개면 가중합이 된다.

$$
\mathcal{L} = \sum_t \lambda_t \,\mathcal{L}_t
$$

같은 종류의 과제끼리면 순한 얘기다. 과제 12개짜리 독성 데이터셋은 binary cross-entropy 12개의 평균이고, 없는 라벨은 음성으로 세지 말고 masking해서 빼면 된다. 종류가 다른 과제끼리면 순하지 않다. 0.6쯤에 있는 회귀 항과 4쯤에 있는 contrastive 항은 스케일이 다르다. 그냥 더하면 숫자가 큰 쪽이 gradient를 대부분 가져가고, 다른 항은 얹혀 간다.

$\lambda_t$는 learning rate와 같은 급의 hyperparameter이고 [탐색](../hyperparameter-search-ko/) 대상이다. 싸게 출발하는 방법은 초기화 시점에 항들의 크기가 비슷해지도록 맞춰 놓고 위아래로 10배씩 훑는 것이다. 가중치를 안 밝힌 multi-task 결과는 그 결과를 만든 두 가지 중 하나를 빼고 보고한 것이다.

## 어디서 어긋나는가

- **loss가 보고하는 지표와 안 맞는다.** MSE로 학습하고 Spearman 상관으로 보고하거나, cross-entropy로 학습하고 ROC-AUC (area under the receiver operating characteristic curve)로 고르는 경우. 대개는 괜찮지만 가끔 아니고, 체크포인트를 고른 쪽이 어느 것인지는 알고 있어야 한다.
- **class 불균형.** 양성이 5%면 전부 "음성"이라고 답하는 쪽이 loss가 낮고, gradient의 95%를 다수 class가 공급한다. class 가중치나 focal loss는 명세를 바꾸는 쪽이고, 재샘플링은 데이터를 바꾸는 쪽이다.
- **loss가 편법으로 최소화된다.** margin 0인 triplet loss, negative가 너무 적은 contrastive loss, 입력을 그대로 복사할 만큼 넓은 autoencoder. 상수나 망가진 encoder가 좋은 점수를 받으면 그 loss는 과제를 명세하고 있지 않다.
- **수치 문제.** $\log 0$은 $-\infty$이고, 0이나 1로 반올림된 확률이 정확히 그걸 만든다. 확률이 아니라 logit을 loss에 넘긴다. sigmoid를 거쳐 `binary_cross_entropy`를 쓰는 대신 `binary_cross_entropy_with_logits`를 쓴다. 합쳐진 형태는 log와 지수가 서로 상쇄되어 둘 중 어느 것도 극한에서 계산하지 않는다.
- **loss를 test set에 맞춰 튜닝하는 것.** MSE 해 보고, MAE 해 보고, Huber 해 보고, $\lambda$ 두 값 해 보고 test 점수가 제일 좋은 걸 남기는 건 test set을 validation set으로 쓴 hyperparameter 탐색이다. loss도 다른 것과 똑같은 hyperparameter이고, 그 선택은 [validation 분할](../evaluation-protocol-ko/)에서 해야 한다.

## 정리

- loss가 곧 명세다. 그 숫자 안에 없는 것은 학습되지 않는다
- MSE가 기본값이고, MAE는 outlier에 버티지만 gradient가 줄지 않고, Huber는 0 근처는 2차 $\delta$ 너머는 선형이다
- 잘못 측정된 라벨 몇 개가 MSE에서 gradient의 대부분을 가져갈 수 있다. 분자 물성 데이터에서 흔한 상황이다
- accuracy가 아니라 cross-entropy로 학습한다. 맞힌 개수에는 **쓸 만한 gradient가 없다.** label smoothing은 logit이 끝없이 커지는 걸 막는다
- triplet loss에는 **margin**이 필요하고, 전부를 한 점으로 보내는 해를 막는 것이 margin이다
- InfoNCE와 NT-Xent는 **분류 문제 하나다. batch에서 positive를 골라내는 것.** positive가 분수 위에, 모든 negative가 분모에 들어간다
- temperature가 가장 어려운 negative에 gradient를 얼마나 몰아 줄지 정한다. $\tau = 0.05$면 사실상 전부, $\tau = 1.0$이면 특별히 몰아 주지 않는다
- negative는 batch에서 나오므로 **batch 크기가 loss의 일부다**
- 한 분자의 두 view는 증강 없이 positive pair를 준다. 분모 쪽 문제는 그대로 남는다
- multi-task 가중합의 가중치는 **엄연한 hyperparameter**이고, 그냥 더하는 것도 결정이다

## 참고

- Chen et al., [A simple framework for contrastive learning of visual representations](https://arxiv.org/abs/2002.05709) (ICML 2020) — SimCLR와 NT-Xent 형태. batch 크기 의존성도 여기 있다
- van den Oord et al., [Representation learning with contrastive predictive coding](https://arxiv.org/abs/1807.03748) (2018) — InfoNCE의 출처
- Schroff et al., [FaceNet: a unified embedding for face recognition and clustering](https://arxiv.org/abs/1503.03832) (CVPR 2015) — margin이 들어간 triplet loss와 온라인 mining
- Wang & Isola, [Understanding contrastive representation learning through alignment and uniformity on the hypersphere](https://arxiv.org/abs/2005.10242) (ICML 2020) — contrastive loss가 최적화하는 것을 측정 가능한 두 성질로 정리
