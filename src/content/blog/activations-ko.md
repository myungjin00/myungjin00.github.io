---
title: "활성함수: 왜 반드시 있어야 하고, 무엇을 고를까"
date: 2024-12-06
description: "linear 층만 쌓으면 왜 무너지나 · sigmoid·tanh와 gradient 소실 · ReLU가 고친 것과 죽는 유닛 · GELU·SiLU와 gate 계열 · softmax는 종류가 다르다"
category: concept
updated: 2025-01
lang: ko
group: activations
topic: Machine learning
subtopic: Basics
tags: [activation function, ReLU, GELU, deep learning]
---

지금까지 돌려 본 모든 신경망의 모든 층에 하나씩 들어 있고, 보통 `nn.ReLU()`라고 적어 놓고 다시는 생각하지 않는 것. 이게 없으면 몇 층을 쌓아도 linear 사상 하나다. 그래서 어떤 비선형성을 쓰느냐에는 역사가 있다. 처음 두 선택지는 gradient를 제대로 넘기지 못해 밀려났고, transformer에서 또 한 번 바뀌었다.

## activation이 없으면 깊이가 아무 의미가 없다

linear 층은 $Wx + b$를 계산한다. 사이에 아무것도 없이 두 개를 쌓으면

$$
W_2(W_1 x) = (W_2 W_1) x
$$

가 되고, 이건 다시 linear 사상 하나다. linear 층을 백 개 쌓아도 표현력은 한 개짜리와 정확히 같다. 깊이를 늘려서 얻는 게 하나도 없다. <mark class="blue">층 사이의 비선형성이 깊이에 의미를 부여하는 전부다.</mark>

비유가 아니다. 곱 행렬 하나가 2층 출력을 부동소수점 정밀도까지 그대로 재현한다.

```python
import torch
torch.manual_seed(43)

W1 = torch.nn.Linear(8, 16, bias=False)
W2 = torch.nn.Linear(16, 4, bias=False)
x = torch.randn(5, 8)

stacked = W2(W1(x))                        # 두 층, 사이에 아무것도 없음
collapsed = x @ (W2.weight @ W1.weight).T  # 행렬 하나로 합친 W2·W1

print("two linear layers vs one matrix:", torch.allclose(stacked, collapsed, atol=1e-6))
with_relu = W2(torch.relu(W1(x)))
print("with a ReLU between them:       ", torch.allclose(with_relu, collapsed, atol=1e-6))
print("largest difference:              ", (with_relu - collapsed).abs().max().item())
# two linear layers vs one matrix: True
# with a ReLU between them:        False
# largest difference:              0.33910638093948364
```

`torch.relu` 한 번이 초평면 하나밖에 못 그리는 모델과 보편 근사기 사이의 차이다.

## 고전적인 둘, 그리고 밀려난 이유

**sigmoid**는 logistic 함수라고도 하고, 무엇이든 $(0, 1)$로 눌러 넣는다.

$$
\sigma(x) = \frac{1}{1 + e^{-x}}
$$

**tanh**는 같은 모양을 $(-1, 1)$로 다시 맞춘 것이라 0을 중심에 둔다. sigmoid는 출력이 항상 양수여서 한 층의 gradient를 전부 같은 방향으로 밀어 버리는데, 그에 비하면 실질적인 장점이다.

둘 다 표준이었고, 둘 다 같은 문제로 밀려났다. **gradient 소실**이다. backpropagation은 각 층 activation의 도함수를 사슬처럼 곱해 가므로, 첫 층에 도착하는 값은 그 도함수 전부의 곱이다. 이 곱이 살아남는지는 도함수의 최댓값이 결정한다.

| | 도함수 최댓값 | 어디서 |
| --- | --- | --- |
| sigmoid | **0.25** | $x = 0$ |
| tanh | **1.0** | $x = 0$ |

치명적인 쪽은 sigmoid의 0.25다. 모든 유닛이 가장 유리한 입력에 정확히 앉아 있는 최상의 경우라도, 열 층이면 gradient에 $0.25^{10} \approx 9.5 \times 10^{-7}$을 곱한다. 유닛이 0에 있을 리가 없으니 실제로는 훨씬 나쁘다. $x = 4$에서 sigmoid의 도함수는 이미 0.0177이다. tanh의 상한 1.0은 둘 중에는 나은 쪽이지만, 입력이 0 근처 좁은 구간을 벗어나면 똑같이 평평하게 포화된다.

20층 쌓은 신경망에서 어떻게 되는지 보자. 비교가 공정하도록 초기화 gain을 activation마다 맞춰 줬다.

```python
import torch

def first_layer_grad(name, act, depth=20, width=64):
    torch.manual_seed(43)
    layers = []
    for _ in range(depth):
        lin = torch.nn.Linear(width, width)
        torch.nn.init.xavier_normal_(lin.weight, gain=torch.nn.init.calculate_gain(name))
        torch.nn.init.zeros_(lin.bias)
        layers += [lin, act()]
    net = torch.nn.Sequential(*layers)
    net(torch.randn(256, width)).pow(2).mean().backward()
    return net[0].weight.grad.norm().item(), net[-2].weight.grad.norm().item()

for name, act in [("sigmoid", torch.nn.Sigmoid), ("tanh", torch.nn.Tanh), ("relu", torch.nn.ReLU)]:
    f, l = first_layer_grad(name, act)
    print(f"{name:8s} layer 1 grad norm = {f:.2e}   layer 20 = {l:.2e}")
# sigmoid  layer 1 grad norm = 2.13e-14   layer 20 = 1.24e-01
# tanh     layer 1 grad norm = 1.83e-01   layer 20 = 7.66e-02
# relu     layer 1 grad norm = 7.47e-01   layer 20 = 2.05e+00
```

sigmoid 신경망의 마지막 층은 0.124라는 지극히 평범한 gradient를 받는다. 첫 층이 받는 값은 $2.13 \times 10^{-14}$, 열세 자릿수나 작은 값이고 상식적인 learning rate에서는 0이다. <mark>깊은 sigmoid 신경망의 앞쪽 층은 느리게 배우는 게 아니라 안 배운다.</mark> 2010년 이전에 깊은 신경망이 학습되지 않던 이유가 이것이다.

sigmoid에 남은 일은 정확히 하나다. **이진 분류기의 출력**이다. 모델이 아직 아무것도 거치지 않고 내놓은 값, 즉 logit 하나를 $(0,1)$ 확률 하나로 바꾸는 것이 손실 함수가 기대하는 입력이다. 은닉층 activation과는 다른 일이다.

## ReLU가 실제로 고친 것

$$
\mathrm{ReLU}(x) = \max(0, x)
$$

ReLU (rectified linear unit)는 한 번에 세 가지를 한다.

- **양수 입력에서 도함수가 정확히 1이다.** 1을 스무 번 곱해도 1이라, gradient가 깊은 층을 줄지 않고 통과한다. 깊이를 학습 가능하게 만든 성질이 이것이다.
- **연산 비용이 이보다 낮을 수 없다** — 비교 하나와 선택 하나, 지수 없음.
- **activation이 희소해진다.** 입력 하나당 대략 절반의 유닛이 정확히 0을 내보내고, 저장 비용도 낮고 도움도 되는 것으로 보인다.

대가는 **dying ReLU**다. 데이터셋의 *모든* 예시에서 pre-activation이 음수인 유닛은 전부 0을 내보내고, ReLU의 도함수는 음수 쪽에서 0이므로 gradient도 0이다. gradient가 없으면 업데이트가 없고, 업데이트가 없으면 입력은 계속 음수다. 그 유닛은 영구히 죽었고 학습 중에 되살릴 방법이 없다.

step을 밟을 때 bias도 다른 파라미터처럼 gradient를 받으므로, learning rate가 너무 높거나 이상한 batch 하나를 만나면 업데이트 한 번으로 bias가 충분히 음수 쪽으로 밀려 데이터셋의 어떤 입력도 pre-activation을 0 위로 올리지 못하게 된다. 해법도 거기 있다. **dying ReLU 문제는 거의 항상 learning rate 문제다.** activation을 바꾸는 것보다 learning rate를 낮추는 쪽이 훨씬 확실하게 없앤다.

<figure>
<img src="/assets/fig/activations.svg" alt="Five activation functions and their derivatives, plotted over the input range minus six to six" loading="lazy" />
<figcaption><b>논증을 담은 쪽은 오른쪽 패널이다.</b> 고전적인 둘 (점선)은 원점에서 멀어지면 도함수가 0으로 떨어지고, sigmoid는 가장 좋은 지점에서도 0.25를 넘지 못한다 &mdash; 깊은 층을 따라 곱해지면 아무것도 남지 않는다. ReLU는 양수 입력 전 구간에서 1을 평평하게 유지한다. 아래에서 다룰 GELU와 SiLU는 꺾인 모서리 대신 매끄러운 모서리로 같은 일을 한다. 이 글을 쓰면서 torch autograd로 계산했다.</figcaption>
</figure>

## ReLU를 고치려 한 변형 셋

유닛이 죽는 걸 막으려는 변형이 셋 있고, 전부 음수 쪽에 0이 아닌 기울기를 주는 방식이다.

| | 무엇을 바꾸나 |
| --- | --- |
| **Leaky ReLU** | 음수 입력에 0 대신 작은 고정 기울기, 보통 0.01을 준다 |
| **PReLU** (parametric rectified linear unit) | 같은 기울기를 고정값이 아니라 채널마다 학습한다 |
| **ELU** (exponential linear unit) | 음수 쪽이 $\alpha(e^x - 1)$이라 직선으로 내려가는 대신 $-\alpha$까지 매끄럽게 휜다 |

세 가지 중 어느 것도 실전에서 의미 있는 차이로 기본 ReLU를 안정적으로 이기지 못한다. 각각 어떤 벤치마크에서 이득을 보인 논문이 있고, 각각 다른 데서는 재현되지 않는다. ReLU가 살아남은 이유가 그것이다. 이 변형들이 고치는 문제는 적당한 learning rate가 이미 대부분 고쳐 놓은 문제인데, 그 대가로 hyperparameter 하나나 지수 연산을 치른다.

## GELU, 그리고 transformer가 쓰는 이유

GELU (Gaussian error linear unit)의 식은

$$
\mathrm{GELU}(x) = x \cdot \Phi(x)
$$

이고 $\Phi$는 표준정규분포의 누적분포함수 (CDF, cumulative distribution function)다. 부드러운 gate로 읽으면 된다. ReLU처럼 0에서 딱 자르는 대신, 입력이 표준정규 난수보다 클 확률을 가중치로 곱한다. 큰 입력은 거의 그대로 통과하고($\Phi \to 1$), 크게 음수인 입력은 거의 전부 눌리며, 그 사이에서는 gate가 서서히 열린다.

여기서 두 가지 성질이 따라 나온다.

- **매끄럽다.** 도함수가 어디서나 연속이다. ReLU는 원점에서 0에서 1로 튄다. GELU를 고르는 이유가 이 성질이다.
- **단조가 아니다.** $x$가 음수인데 $\Phi(x)$가 아직 꽤 남아 있는 구간이 있어서, 곡선이 0 아래로 내려갔다가 돌아온다. 최솟값을 재 보니 **−0.17, $x = -0.75$ 근처**였다. 음수 구간이 작긴 하지만 순서를 보존하지 않는다는 뜻이다.

ReLU 대비 실측 이득은 작고, GELU가 어디에나 있는 이유는 **근거가 아니라 상속**이다. BERT가 썼고 GPT가 썼고 그 뒤의 모든 transformer 구현이 그 선택을 베꼈다. transformer를 학습한다면 GELU를 쓰는 게 맞다. 나머지 레시피가 GELU에 맞춰 튜닝됐기 때문이지, 결정적인 결과가 있어서가 아니다. 그런 결과는 없다.

프레임워크는 두 가지 형태를 제공한다. 정확한 쪽은 오차함수를 부르고, 더 오래된 **tanh 근사**는 당시 하드웨어에서 `erf`가 느렸기 때문에 생겼다.

$$
\mathrm{GELU}(x) \approx 0.5\,x\left(1 + \tanh\!\left[\sqrt{2/\pi}\,(x + 0.044715\,x^3)\right]\right)
$$

```python
import torch
x = torch.linspace(-6, 6, 20001)
e = torch.nn.functional.gelu(x, approximate="none")
a = torch.nn.functional.gelu(x, approximate="tanh")
print("exact vs tanh-approx, max |diff| =", (e - a).abs().max().item())
# exact vs tanh-approx, max |diff| = 0.0004737377166748047
```

쓸 만한 구간 전체에서 최대 0.00047 차이니 정확도 면에서는 어느 쪽이든 상관없다. 재현 면에서는 상관있다. 한쪽으로 학습한 checkpoint를 다른 쪽으로 평가하면 그건 불일치이고, 실제로 그 버그를 안고 나간 이식본들이 있다.

## SiLU, Swish, 그리고 gate 계열

SiLU (sigmoid linear unit)는 정규분포 CDF 자리에 그냥 sigmoid를 넣은 것이다.

$$
\mathrm{SiLU}(x) = x \cdot \sigma(x)
$$

두 번 발표됐다. Elfwing 등이 강화학습 논문에서 SiLU로 냈고, 함수 자동 탐색이 **Swish**로 다시 찾아냈다. GELU와 거의 같은 곡선이고 $[-6, 6]$ 전 구간에서 차이가 0.193 이내다. sigmoid가 오차함수보다 가벼워서 연산 비용도 낮고, 요즘 비전 backbone과 LLM (large language model) 스택이 실제로 돌리는 게 이쪽이다.

gate를 쓰는 변형은 한 걸음 더 간다. GLU (gated linear unit)는 projection을 두 쪽으로 쪼개고 한쪽이 activation을 거쳐 다른 쪽에 곱해지게 한다.

$$
\mathrm{SwiGLU}(x) = \big(\mathrm{SiLU}(xW_1)\big) \odot (xW_2)
$$

이름은 전부 쓰는 activation에 GLU를 붙인 것이다. **SwiGLU**는 위에 적은 SiLU (Swish) 버전이고, **GeGLU**는 SiLU 자리에 GELU를 넣은 같은 구조다. Llama 계열 모델이 feed-forward 블록에서 쓰는 게 이것이고, 실제로 도움이 되는 것으로 보인다. projection을 쪼갠다는 건 weight 행렬이 하나이던 자리에 둘이 필요하다는 뜻이라, GLU 블록은 대체하는 블록보다 파라미터가 많다. **공정한 비교는 파라미터 수를 고정한다.** 실무에서는 은닉 차원을 대략 2/3로 줄여서 맞추고, 그러지 않은 비교는 gate가 아니라 폭을 재고 있는 것이다.

## 비교

| | 식 | 범위 | 0에서 미분 가능 | 지금 쓰이는 곳 | 꼭 알아둘 것 |
| --- | --- | --- | --- | --- | --- |
| **sigmoid** | $1/(1+e^{-x})$ | $(0, 1)$ | 가능 | 이진 분류기 출력 | 도함수 최댓값 0.25라 깊이 쌓으면 죽는다 |
| **tanh** | $\tanh x$ | $(-1, 1)$ | 가능 | LSTM (long short-term memory)·GRU (gated recurrent unit)의 gate | 0 중심이지만 포화되는 건 마찬가지 |
| **ReLU** | $\max(0, x)$ | $[0, \infty)$ | 불가능 — 꺾인다 | 일반 신경망과 CNN (convolutional neural network)의 기본값 | 양수에서 도함수가 정확히 1, 대신 유닛이 죽을 수 있다 |
| **Leaky ReLU** | $\max(0.01x, x)$ | $(-\infty, \infty)$ | 불가능 — 꺾인다 | GAN (generative adversarial network) 판별자, 가끔 | 죽지는 않지만 ReLU를 이기는 일이 드물다 |
| **ELU** | $x$, 음수면 $\alpha(e^x - 1)$ | $(-\alpha, \infty)$ | $\alpha = 1$이면 가능 | 드물다 | 매끄럽고 0 중심인데 지수 연산 값을 치른다 |
| **GELU** | $x\,\Phi(x)$ | $\approx(-0.17, \infty)$ | 가능 | transformer — BERT, GPT | 매끄럽고 단조가 아니다. 상속으로 굳은 기본값 |
| **SiLU** | $x\,\sigma(x)$ | $\approx(-0.278, \infty)$ | 가능 | 요즘 비전 backbone과 LLM | GELU 모양에 더 싸다. Swish라고도 한다 |
| **softmax** | $e^{z_i} / \sum_j e^{z_j}$ | $(0, 1)$, 합이 1 | 가능 | 다중 분류 출력, 그리고 attention 내부 | 원소별이 아니라 벡터 전체에 작용한다 |

## softmax는 종류가 다르다

위 표에 softmax가 들어가 있지만, 나머지와 같은 종류의 연산이 아니다. 나머지 행은 전부 **원소별**이다. 유닛 하나하나가 옆을 전혀 모르는 채로 변환된다. softmax는 logit 벡터 전체를 받아 그 위의 분포를 돌려준다. 음수가 없고 합이 1이며, 따라서 출력 하나하나가 입력 전부에 의존한다. logit 하나를 올리면 나머지 확률이 전부 내려간다.

그래서 이건 다중 분류의 출력층이지 은닉층 activation이 아니다. 실무적으로 둘이 따라온다. PyTorch에서 `nn.CrossEntropyLoss`에는 **raw logit**을 넘긴다. 내부에서 log-softmax를 적용하기 때문이다. 직접 softmax를 걸고 나서 넘기면 연산이 두 번 들어가 gradient가 조용히 평평해진다. 그리고 이진 문제는 logit 둘에 softmax가 아니라 logit 하나에 sigmoid다.

신경망 중간에 나오는 자리가 하나 있고 그건 중요하다. **attention** 내부에서 쌍별 점수 위에 걸리며, 유사도를 합이 1인 가중치로 바꾸는 게 거기서 softmax가 하는 일이다. 거기서 softmax는 은닉층 비선형성이 아니라 가중치를 만드는 장치이고, [attention](../attention-ko/)에서 따로 다뤘다.

## 실제로 뭘 쓸까

- **평범한 feed-forward 신경망이나 CNN** — ReLU.
- **transformer 안** — GELU 아니면 SiLU. 베껴 오는 구조가 쓰던 걸 따라간다.
- **이진 출력** — logit 하나에 sigmoid, 손실 함수가 logit을 받는다면 아무것도 안 걸어도 된다.
- **다중 분류 출력** — softmax, 보통은 손실 함수가 대신 해 주니 명시적으로 안 적는다.

여기서 멈추면 된다. **모델의 문제가 activation에 있는 경우는 거의 없다.** 모델이 학습이 안 되면 원인은 비선형성 선택보다 learning rate·데이터·라벨·손실 함수 쪽일 때가 압도적으로 많고, 막힌 학습을 살리겠다고 ReLU를 GELU로 바꾸는 건 원인일 가능성이 가장 낮은 변수를 건드리는 것이다. 먼저 확인할 목록은 [학습 루프](../training-basics-ko/)에 있다.

## 정리

- 비선형성이 없으면 linear 층을 쌓아도 행렬 하나로 주저앉는다 — 위에서 부동소수점 정밀도까지 확인했다
- sigmoid의 도함수는 최대 0.25, tanh는 1.0. 깊이를 따라 곱해지면 20층 신경망의 첫 층에 $2 \times 10^{-14}$짜리 gradient가 도착한다
- sigmoid에 남은 하나의 일은 이진 분류기의 출력이다
- ReLU는 양수에서 도함수가 정확히 1이라 깊이를 학습 가능하게 만들었다. 대가는 영구히 죽는 유닛이고, 보통 learning rate가 너무 높아서 생긴다
- Leaky ReLU·PReLU·ELU가 각각 그걸 고치지만, 기본 ReLU를 안정적으로 이기는 건 없다
- GELU는 $x\,\Phi(x)$다. 매끄럽고 살짝 단조가 아니며, transformer 기본값이 된 건 대체로 상속이다
- SiLU는 같은 모양을 sigmoid로 만든 것이고, SwiGLU식 gate가 Llama 계열이 쓰는 것이다 — 파라미터 수를 고정하고 비교해야 한다
- softmax는 벡터에 작용하는 출력층이지 원소별 activation이 아니다

## 참고

- Nair & Hinton, [Rectified Linear Units Improve Restricted Boltzmann Machines](https://icml.cc/Conferences/2010/papers/432.pdf) (ICML 2010) — ReLU가 널리 쓰이기 시작한 지점
- Hendrycks & Gimpel, [Gaussian Error Linear Units (GELUs)](https://arxiv.org/abs/1606.08415) (2016) — $x\Phi(x)$ 형태와 tanh 근사
- Elfwing et al., [Sigmoid-Weighted Linear Units for Neural Network Function Approximation in Reinforcement Learning](https://arxiv.org/abs/1702.03118) (2017) — SiLU, 나중에 Swish로 다시 발견된다
- Shazeer, [GLU Variants Improve Transformer](https://arxiv.org/abs/2002.05202) (2020) — SwiGLU와 GeGLU를 파라미터 수를 맞춰 비교한다
