---
title: "지도 · 비지도 · 자기지도 학습"
date: 2024-11-15
description: "정답이 어디서 오는가로 셋을 가른다 · 지도·비지도·자기지도 · 마스킹과 대조 학습 · 분자에서 증강이 위험한 이유"
category: concept
updated: 2024-12
lang: ko
group: paradigms
topic: Machine learning
subtopic: Basics
tags: [machine learning, self-supervised learning]
---

**Machine learning** · [#1 머신러닝과 딥러닝](../ml-and-dl-ko/) · #2 지도·비지도·자기지도 · [#3 군집화](../clustering-ko/) · [#4 전이학습](../transfer-learning-ko/)

<mark class="blue">학습 방식을 나누는 기준은 알고리즘이 아니라 **정답 (label)이 어디서 오느냐**이다.</mark>

<figure>
<svg viewBox="0 0 540 190" role="img" aria-label="Three paradigms compared by where the label comes from.">
  <g fill="none" stroke="#D3D8CE"><rect x="16" y="16" width="162" height="158" rx="6"/><rect x="190" y="16" width="162" height="158" rx="6"/><rect x="364" y="16" width="160" height="158" rx="6"/></g>
  <g font-family="IBM Plex Mono, monospace" font-size="11.5" fill="#1E4A39">
    <text x="30" y="38">supervised</text><text x="204" y="38">unsupervised</text><text x="378" y="38">self-supervised</text>
  </g>
  <g font-family="IBM Plex Mono, monospace" font-size="10.5" fill="#6E7873">
    <text x="30" y="160">a person labels it</text><text x="204" y="160">there is no label</text><text x="378" y="160">the data labels itself</text>
  </g>
  <g fill="#F3DCCB" stroke="#C2703C" stroke-width="1.2">
    <circle cx="48" cy="72" r="7"/><circle cx="48" cy="104" r="7"/><circle cx="48" cy="130" r="7"/>
    <circle cx="222" cy="72" r="7"/><circle cx="246" cy="96" r="7"/><circle cx="214" cy="112" r="7"/><circle cx="252" cy="130" r="7"/><circle cx="286" cy="78" r="7"/><circle cx="300" cy="116" r="7"/>
    <circle cx="396" cy="72" r="7"/><circle cx="396" cy="110" r="7"/>
  </g>
  <g stroke="#1E4A39" stroke-width="1.2"><line x1="60" y1="72" x2="104" y2="72"/><line x1="60" y1="104" x2="104" y2="104"/><line x1="60" y1="130" x2="104" y2="130"/></g>
  <g font-family="IBM Plex Mono, monospace" font-size="10" fill="#1E4A39">
    <text x="110" y="76">toxic</text><text x="110" y="108">safe</text><text x="110" y="134">toxic</text>
  </g>
  <g stroke="#2E5878" stroke-width="1.1" stroke-dasharray="3 3" fill="none">
    <ellipse cx="236" cy="92" rx="38" ry="32"/><ellipse cx="294" cy="98" rx="26" ry="28"/>
  </g>
  <g stroke="#1E4A39" stroke-width="1.2"><path d="M408 72 C 440 72, 440 110, 412 110" fill="none"/></g>
  <g fill="#DCE7DF" stroke="#1E4A39" stroke-width="1.2"><rect x="438" y="62" width="18" height="18" rx="3"/></g>
  <g font-family="IBM Plex Mono, monospace" font-size="10" fill="#1E4A39"><text x="462" y="76">?</text><text x="420" y="134">the hidden piece</text><text x="420" y="148">is the answer</text></g>
</svg>
<figcaption><b>세 가지 방식.</b> 지도학습은 사람이 붙인 정답을 쓰고, 비지도학습은 정답 없이 구조를 찾고, 자기지도학습은 데이터의 일부를 가려 나머지로 맞히게 한다.</figcaption>
</figure>

## 지도학습 (supervised)

입력과 정답이 짝지어 있다. 모델은 그 대응을 배운다.

$$
\mathcal{D} = \{(x_i, y_i)\}_{i=1}^{N}
$$

| 과제 | $y$의 형태 | 예 |
| --- | --- | --- |
| 분류 (classification) | 범주 | 이 분자가 혈액-뇌 장벽을 통과하는가 |
| 회귀 (regression) | 실수 | 이 분자의 용해도는 얼마인가 |

MoleculeNet 벤치마크가 전형적이다. BBBP는 이진 분류, ESOL은 회귀다.

**병목은 정답이다.** 분자 하나의 독성 라벨 하나를 얻으려면 실험을 해야 한다. 그래서 ADMET (absorption, distribution, metabolism, excretion, toxicity) 데이터셋은 보통 수천 개 규모에서 멈춘다. 한편 라벨이 없는 분자는 ZINC에만 수억 개가 있다. 이 불균형이 다음 두 방식이 필요한 이유다.

## 비지도학습 (unsupervised)

정답이 전혀 없다. 데이터 자체의 구조를 찾는 것이 목적이다.

- **군집화 (clustering)** — 비슷한 것끼리 모으기 (k-means, 계층적 군집화)
- **차원 축소 (dimensionality reduction)** — 고차원을 사람이 볼 수 있게 (principal component analysis, t-distributed stochastic neighbour embedding, UMAP)
- **밀도 추정 (density estimation)** — 데이터가 어떤 분포에서 나왔는지

single-cell RNA-seq (scRNA-seq) 분석이 좋은 예다. 세포 수만 개를 군집으로 나누고 그 결과를 UMAP으로 들여다본 뒤, 그제야 각 군집이 어떤 세포 유형인지 붙인다. 군집을 나눌 때는 정답이 없었다.

> 평가가 어렵다는 게 비지도학습의 근본적인 약점이다. 맞혀야 할 정답이 없으니 "잘했다"의 기준도 모호하다.

## 자기지도학습 (self-supervised)

**데이터에서 정답을 만들어낸다.** 사람은 라벨을 붙이지 않지만, 모델은 지도학습처럼 학습한다.

방법은 데이터의 일부를 가리고 나머지로 맞히게 하는 것이다.

| 분야 | 가리는 것 | 맞히는 것 |
| --- | --- | --- |
| 언어 | 문장의 단어 | 그 단어 |
| 이미지 | 패치 | 그 패치 |
| 분자 그래프 | 원자나 결합 | 그 원자의 종류 |

또 하나의 큰 갈래는 **대조 학습 (contrastive learning)** 이다. 같은 것의 두 모습은 가깝게, 다른 것은 멀게 embedding 공간에 배치한다.

$$
\mathcal{L} = -\log \frac{\exp(\mathrm{sim}(z_i, z_i^+)/\tau)}{\sum_{j}\exp(\mathrm{sim}(z_i, z_j)/\tau)}
$$

- $z_i$와 $z_i^+$ — 같은 것의 두 모습을 encoding한 벡터
- $\mathrm{sim}$ — 두 벡터 사이의 유사도. 보통 cosine
- $\tau$ — **temperature**. 짝이 맞는 쌍이 나머지 쌍들을 얼마나 큰 차이로 이겨야 하는지를 정한다

분자에서 "같은 것의 두 모습"을 어떻게 만드느냐가 설계의 핵심이다. 보통은 원자를 지우거나 부분 그래프를 떼는 **증강 (augmentation)** 을 쓴다. 다만 분자에서는 위험하다. <mark>원자 하나를 바꾸면 다른 분자가 되기 때문이다.</mark>

<figure>
<img src="/assets/fig/dual-view-paracetamol.svg" alt="The atom graph and the junction tree of paracetamol, side by side" loading="lazy" />
<figcaption><b>한 분자, 두 개의 그래프.</b> 왼쪽은 원자 하나가 node다. 오른쪽은 고리 하나 또는 결합 하나가 통째로 node라서, 6원 고리가 node 여섯 개에서 하나로 줄고 그래프에서 고리가 아예 사라진다. RDKit과 Jin et al.(2018)의 분해 방식으로 계산했다.</figcaption>
</figure>

> 증강 없이 하는 방법도 있다. 한 분자를 **원자 그래프**와 **junction tree** 두 가지로 표현하면, 둘은 애초에 같은 분자의 두 모습이므로 양성 쌍 (positive pair)이 공짜로 생긴다. 내가 [SJoINT](../../projects/sjoint/)에서 쓴 방식이다.

## 지도·비지도·자기지도 비교

| | 정답의 출처 | 데이터 규모 | 주로 쓰는 곳 |
| --- | --- | --- | --- |
| 지도 | 사람 | 작음 | 최종 과제 |
| 비지도 | 없음 | 큼 | 탐색, 시각화 |
| 자기지도 | 데이터 자신 | 매우 큼 | **사전학습 (pre-training)** |

실제 pipeline은 보통 **자기지도 → 지도** 순서다. 라벨 없는 분자 수십만 개로 먼저 표현을 배우고, 라벨이 있는 수천 개로 마무리한다. 그 연결 고리가 [다음 편](../transfer-learning-ko/)의 주제다.

> **일반적으로 보면.** BERT가 가장 알기 쉬운 예다. 문장의 15%를 가리고 맞히게 하는 것만으로, 사람이 라벨 하나 붙이지 않고 언어 표현을 배운다. 분자에서 원자를 가리고 맞히게 하는 것은 이 아이디어를 그대로 옮긴 것이다. 이미지 쪽의 SimCLR도 같은 계열이다.

## 정리

- 기준은 알고리즘이 아니라 **정답이 어디서 오는가**
- 지도: 사람이 붙임 — 정확하지만 비쌈
- 비지도: 없음 — 구조는 보이지만 평가가 어려움
- 자기지도: 데이터가 만듦 — 라벨 없는 데이터를 쓸 수 있음
- 분자 쪽에서는 자기지도로 사전학습하고 지도로 fine-tuning하는 것이 표준

## 참고

- Devlin et al., [BERT](https://arxiv.org/abs/1810.04805) (2018) — masking 기반 자기지도의 대표
- Chen et al., [SimCLR](https://arxiv.org/abs/2002.05709) (2020) — 대조 학습의 표준 형태
- Hu et al., [Strategies for Pre-training Graph Neural Networks](https://arxiv.org/abs/1905.12265) (ICLR 2020) — 분자 그래프에 처음 체계적으로 적용
