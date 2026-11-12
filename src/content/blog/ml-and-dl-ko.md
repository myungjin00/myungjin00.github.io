---
title: "머신러닝과 딥러닝"
date: 2024-09-13
description: "규칙을 적는 것과 찾는 것의 차이 · 모델·손실·최적화 · 특징 공학이 왜 병목이었나 · 딥러닝이 이기는 조건과 그 대가"
category: concept
updated: 2024-09
lang: ko
group: ml-dl
topic: Machine learning
subtopic: Basics
tags: [machine learning, deep learning]
---

**Machine learning** · #1 머신러닝과 딥러닝 · [#2 지도·비지도·자기지도](../learning-paradigms-ko/) · [#3 군집화](../clustering-ko/) · [#4 전이학습](../transfer-learning-ko/)

## 프로그래밍과 무엇이 다른가

보통의 프로그래밍은 **규칙을 사람이 적는다.**

```
입력 + 규칙  →  답
```

분자가 독성인지 판정하는 규칙을 직접 적는다고 해보자. "벤젠 고리가 있고 나이트로기가 붙어 있으면…" 같은 조건을 수백 개 쌓아도 예외가 끝없이 나온다. 화학은 그렇게 단순하지 않다.

머신러닝은 방향을 뒤집는다.

```
입력 + 답  →  규칙
```

정답이 붙은 예시를 충분히 주면, 모델이 입력에서 답으로 가는 **함수를 스스로 맞춰간다.** 규칙을 적는 대신 규칙을 찾게 하는 것이다.

<figure>
<svg viewBox="0 0 540 170" role="img" aria-label="Three nested sets: artificial intelligence contains machine learning, which contains deep learning.">
  <rect x="20" y="20" width="500" height="130" rx="8" fill="none" stroke="#D3D8CE"/>
  <rect x="50" y="42" width="440" height="92" rx="7" fill="rgba(30,74,57,.05)" stroke="#1E4A39" stroke-opacity=".4"/>
  <rect x="86" y="64" width="368" height="50" rx="6" fill="rgba(30,74,57,.1)" stroke="#1E4A39" stroke-opacity=".7"/>
  <g font-family="IBM Plex Mono, monospace" font-size="11.5">
    <text x="32" y="38" fill="#6E7873">artificial intelligence</text>
    <text x="62" y="60" fill="#46524D">machine learning — finds the rules in data</text>
    <text x="98" y="93" fill="#1E4A39">deep learning — finds the representation too</text>
  </g>
</svg>
<figcaption><b>포함 관계.</b> 딥러닝은 머신러닝의 한 종류이고, 머신러닝은 AI (artificial intelligence)의 한 접근이다. 규칙 기반 전문가 시스템도 AI지만 머신러닝은 아니다.</figcaption>
</figure>

## 머신러닝이 실제로 하는 일

세 가지만 있으면 된다.

1. **모델 (model)** — 조절 가능한 손잡이 (파라미터)가 달린 함수 $f_\theta$
2. **손실 함수 (loss function)** — 예측이 정답에서 얼마나 멀었는지를 재는 수 $L$
3. **최적화 (optimisation)** — 손실이 줄어드는 쪽으로 손잡이를 돌리는 절차

학습은 이 반복이다.

$$
\theta \leftarrow \theta - \eta \, \nabla_\theta L
$$

$\nabla_\theta L$은 "손잡이를 어느 쪽으로 돌리면 손실이 커지는가"이고, 그 **반대로** 조금씩($\eta$만큼) 움직인다. 이것이 <u>경사하강법 (gradient descent)</u>이다.

## 특징 공학이라는 병목

전통적인 머신러닝의 성능은 대부분 **입력을 무엇으로 주느냐**에 달려 있었다.

분자를 랜덤 포레스트에 넣으려면 먼저 숫자 벡터로 바꿔야 한다. 분자량, logP, 수소결합 공여체 수, 그리고 **분자 지문 (fingerprint)** 같은 것들이다. 이 과정을 **특징 공학** (feature engineering)이라고 한다.

문제는 여기에 사람의 판단이 들어간다는 점이다. 지문은 부분 구조가 있는지 없는지를 bit로 적는데, 애초에 **어떤 부분 구조를 셀지는 사람이 정한다.** 중요한 무언가를 빠뜨렸다면 모델은 그걸 볼 방법이 없다.

## 딥러닝이 바꾼 것

딥러닝은 단순한 변환을 **여러 층으로 쌓는다.** 각 층은 앞 층의 출력을 받아 조금 더 쓸모 있는 형태로 바꾼다.

```
원자와 결합  →  층  →  층  →  층  →  "독성일 확률 0.83"
             └─ 중간 표현(representation) ─┘
```

중요한 점은 중간 표현도 **학습 대상**이라는 것이다. 사람이 "이 부분 구조를 세라"고 지정하지 않아도, 모델이 과제를 푸는 데 유용한 특징을 스스로 만들어낸다. <mark class="blue">이것이 **표현 학습** (representation learning)이고, 딥러닝이 실제로 파는 물건이다.</mark>

| | 전통적 머신러닝 | 딥러닝 |
| --- | --- | --- |
| 입력 | 사람이 설계한 특징 | 비교적 날것 (그래프, 서열, 이미지) |
| 표현 | 고정 | 학습됨 |
| 데이터 요구량 | 적어도 됨 | 많이 필요 |
| 해석 | 비교적 쉬움 | 어려움 |
| 잘 맞는 곳 | 표 형식 (tabular), 작은 데이터 | 구조가 있는 큰 데이터 |

## 과적합과 과소적합

학습 데이터에 완벽히 들어맞는 모델이 무언가를 배웠다는 뜻은 아니다. 원하는 것은 처음 보는 데이터에서 잘하는 모델이고, 그 둘은 같은 목표가 아니다.

<figure>
<img src="/assets/fig/overfitting.svg" alt="A straight line, a good fit and a wild curve through the same 22 points, with training and test error against model capacity" loading="lazy" />
<figcaption><b>같은 22개 점에 세 가지로 맞춰 본 결과, 그리고 오차의 움직임.</b> 회색 점선이 데이터가 실제로 나온 함수다. 1차 모델은 충분히 휘지 못해서 따라가지 못한다. <b>과소적합 (underfitting)</b> 이고, 학습 데이터에서도 틀린다. 20차 모델은 학습 점마다 아주 가까이 지나가면서 그 사이를 터무니없이 출렁인다. <b>과적합 (overfitting)</b> 이다. scikit-learn으로 직접 돌린 결과다.</figcaption>
</figure>

모델의 표현력이 커질수록,

- **training loss는 떨어지고, 계속 떨어진다.** 파라미터가 충분하면 학습셋을 통째로 외울 수 있다. 20차에서 training RMSE (root mean square error)는 0.03, 사실상 0이다.
- **test loss는 떨어지다가 바닥을 치고 다시 올라간다.** 여기서는 7차가 가장 낮고, 그 뒤로 폭발해서 test RMSE가 수천 단위가 된다.

실제로 관리하는 대상은 두 곡선 사이의 간격이다.

| 보이는 것 | 뜻 | 할 일 |
| --- | --- | --- |
| 둘 다 높다 | **과소적합** — 모델이 패턴을 표현하지 못한다 | 표현력 키우기, 특징 개선, 더 오래 학습 |
| training은 낮고 test는 높다 | **과적합** — 외웠다 | 데이터 늘리기, 정규화 (regularization), early stopping, 표현력 줄이기 |
| 둘 다 낮고 가깝다 | 적당하다 | 멈춘다 |
| training loss가 올라간다 | 뭔가 고장났다 — 학습률·데이터·버그 | 튜닝하기 전에 그것부터 고친다 |

**데이터를 늘리는 것이 어떤 정규화보다 곡선을 오른쪽으로 많이 민다.** [분자 성질 예측](../mpp-ko/)에서 데이터 크기가 그만큼 많은 것을 좌우하는 이유다. **early stopping**은 가장 손이 덜 가는 정규화다. validation loss를 보다가 돌아서는 지점에서 멈춘다. 그리고 그 지점은 반드시 validation set에서 찾아야 한다. test set이 epoch을 고르는 순간 그것은 더 이상 test set이 아니다.

> 분자 쪽에서는 과적합이 보이는 자리에 있지 않을 때가 많다. 모델이 화학을 배운 게 아니라 학습 때 본 scaffold를 알아보는 것만으로도 점수가 잘 나올 수 있고, random split은 그걸 기꺼이 가려 준다. [split](../evaluation-protocol-ko/)은 진단의 일부다.

## 그래서 늘 딥러닝이 낫나

아니다. <mark>데이터가 수백 개뿐인 표 형식 과제라면 gradient boosting이 신경망을 이기는 일이 흔하다.</mark> 딥러닝이 이기는 조건은 대체로 이렇다.

- 데이터가 충분히 많다
- 입력에 **구조**가 있다 (분자의 그래프 구조, 문장의 순서, 이미지의 공간 구조)
- 그 구조를 모델 구조에 반영할 수 있다

세 번째 조건을 채워 주는 것이 모델 구조다. CNN (convolutional neural network)이 이미지에서 잘 되는 이유는 "근처 픽셀끼리 관계가 있다"는 가정이 구조에 박혀 있기 때문이고, 같은 이유로 분자에는 [그래프 신경망](../gnn-ko/)이 맞다.

## 해석 가능성 (interpretability)이라는 대가

딥러닝은 표현을 알아서 찾아주지만, **그 표현이 무엇인지 설명해주지는 않는다.** 층이 수백만 개의 가중치를 거쳐 0.83을 내놓았을 때 "왜"를 묻기가 어렵다.

이것이 분자 성질 예측에서 실제로 문제가 되는 지점이다. 화학자는 점수만으로는 움직이지 않는다. **어느 부분이 그 점수를 만들었는지**를 알아야 다음 분자를 설계할 수 있다. attention 기반 모델이 쓰이는 이유가 여기에 있다. 예측과 함께 "어디를 봤는지"가 같이 나오기 때문이다.

> **일반적으로 보면.** 같은 이야기가 다른 분야에도 있다. 이미지에서는 SIFT·HOG 같은 수작업 특징 (hand-crafted feature)이 CNN으로, text에서는 TF-IDF (term frequency–inverse document frequency)가 Transformer로 대체됐다. 다만 **표 형식 데이터에서는 여전히 gradient boosting이 강하다.** 입력에 구조가 없으면 딥러닝의 이점이 사라지기 때문이다.

## 정리

- 프로그래밍은 규칙을 적고, 머신러닝은 규칙을 찾는다
- 모델 + 손실 함수 + 최적화, 이 셋이 학습의 전부
- 전통적 머신러닝의 병목은 사람이 설계하는 특징
- 딥러닝은 표현까지 학습한다 — 대신 데이터가 많이 필요하고 설명이 어렵다
- 구조가 있는 데이터일수록 딥러닝이 유리하다

다음 편은 [정답을 어디서 얻느냐에 따라 학습이 어떻게 나뉘는지](../learning-paradigms-ko/)이다.

## 참고

- Goodfellow, Bengio & Courville, [Deep Learning](https://www.deeplearningbook.org/) (MIT Press, 2016) — 무료 공개
- LeCun, Bengio & Hinton, [Deep learning](https://doi.org/10.1038/nature14539), *Nature* (2015)
- Grinsztajn et al., [Why do tree-based models still outperform deep learning on typical tabular data?](https://arxiv.org/abs/2207.08815) (NeurIPS 2022) — 표 데이터에서 부스팅이 이기는 이유
