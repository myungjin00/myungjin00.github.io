---
title: "그래프 신경망 (GNN)"
date: 2025-03-21
description: "분자가 행렬로 바뀌는 모습 · message passing 한 층의 구조 · GCN·GraphSAGE·GAT·GATv2·GIN의 차이 · over-smoothing과 edge feature 함정"
category: concept
updated: 2025-04
lang: ko
group: gnn
topic: Graphs
tags: [graph neural networks, molecular ML]
---

## 왜 그래프인가

분자를 머신러닝에 넣으려면 먼저 모양을 정해야 한다.

| 표현 | 생긴 것 | 잃는 것 |
| --- | --- | --- |
| SMILES (simplified molecular-input line-entry system) 문자열 | `CC(=O)Oc1ccccc1C(=O)O` | 연결 관계가 글자 순서에 숨음 |
| 분자 지문 (fingerprint) | bit 벡터 | 어떤 부분 구조를 셀지 사람이 정함 |
| 그래프 | 원자 = node, 결합 = edge | 3차원 좌표 (2D 그래프의 경우) |

그래프가 분자의 생김새와 가장 가깝다. 표기는 $G = (V, E)$로 쓴다. $V$는 원자 집합, $E$는 결합 집합, 각 node $v$는 특징 벡터 $h_v$를 갖는다. 원자에 번호를 어떻게 매기든 같은 분자이므로 모델의 출력도 달라지면 안 된다. 이것이 **순열 불변성 (permutation invariance)** 이고, GNN은 이 성질을 구조에 내장하고 있다. 왜 이 조건이 강제되는지, 그래프를 어떻게 저장하고 batch로 묶는지는 [무엇이 그래프가 되는가](../graph-data-ko/)에서 따로 다룬다.

<figure>
<img src="/assets/fig/molecule-as-graph-david2020.jpg" alt="아세트산의 그래프 표현: 인접 행렬, node 특징 행렬, edge 특징 행렬" width="1600" height="408">
<figcaption><b>분자가 모델에 들어가는 실제 모습.</b> 아세트산 (a)이 인접 행렬 <i>A</i> (b), node 특징 행렬 <i>X</i> (c), edge 특징 행렬 <i>E</i> (d)로 적힌다. <i>X</i>의 열은 원자 종류·형식 전하·암시적 수소 개수를 one-hot으로 담는다. 뒤에서 말할 "node에 무엇을 넣을지는 사람이 정한다"가 바로 이 행렬이고, <i>E</i>를 쓰지 않는 모델은 결합 차수를 통째로 버리는 셈이다.
<br><span class="credit">David et al., <a href="https://doi.org/10.1186/s13321-020-00460-5"><i>J. Cheminform.</i> <b>12</b>, 56 (2020)</a> &#183; 논문 그림, Figure 2</span></figcaption>
</figure>

## message passing

<mark class="blue">GNN의 한 층이 하는 일은 하나다. **모든 node가 이웃에게서 정보를 받아 자신을 갱신한다.**</mark>

<figure>
<svg viewBox="0 0 540 200" role="img" aria-label="One round of message passing: a node collects vectors from its neighbours, aggregates them, and updates itself.">
  <g font-family="IBM Plex Mono, monospace" font-size="11" fill="#1E4A39">
    <text x="28" y="26">1. neighbours send</text><text x="212" y="26">2. aggregate</text><text x="372" y="26">3. update</text>
  </g>
  <g stroke="#C2703C" stroke-width="1.3" marker-end="url(#b2)">
    <line x1="52" y1="70" x2="96" y2="100"/><line x1="46" y1="130" x2="94" y2="112"/><line x1="112" y1="160" x2="106" y2="124"/>
  </g>
  <defs><marker id="b2" markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6 z" fill="#C2703C"/></marker></defs>
  <g fill="#F3DCCB" stroke="#C2703C" stroke-width="1.3"><circle cx="44" cy="64" r="9"/><circle cx="38" cy="134" r="9"/><circle cx="116" cy="166" r="9"/></g>
  <circle cx="104" cy="110" r="12" fill="#DCE7DF" stroke="#1E4A39" stroke-width="1.6"/>
  <text x="99" y="114" font-family="IBM Plex Mono, monospace" font-size="10" fill="#1E4A39">v</text>
  <g font-family="IBM Plex Mono, monospace" font-size="10.5" fill="#46524D">
    <text x="212" y="86">Σ  or  mean</text><text x="212" y="104">or  max</text>
    <text x="212" y="136">must not depend</text><text x="212" y="150">on the order</text>
  </g>
  <rect x="200" y="62" width="124" height="60" rx="5" fill="none" stroke="#D3D8CE"/>
  <g stroke="#46524D" stroke-width="1.2" marker-end="url(#b3)"><line x1="330" y1="92" x2="364" y2="92"/></g>
  <defs><marker id="b3" markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6 z" fill="#46524D"/></marker></defs>
  <circle cx="404" cy="92" r="14" fill="#1E4A39"/>
  <text x="398" y="96" font-family="IBM Plex Mono, monospace" font-size="10" fill="#F5F5EF">v'</text>
  <g font-family="IBM Plex Mono, monospace" font-size="10" fill="#6E7873">
    <text x="372" y="134">now carries its</text><text x="372" y="148">neighbourhood</text>
  </g>
</svg>
<figcaption><b>한 층.</b> 이웃이 벡터를 보내고, 순서에 영향받지 않는 방식으로 모으고, 그 결과로 자신을 갱신한다. 이 과정을 <i>L</i>번 반복하면 각 node는 <i>L</i>-홉 이웃까지 알게 된다.</figcaption>
</figure>

**홉** (hop)은 edge 하나를 건너는 것이다. 어떤 node의 $L$-홉 이웃은 edge를 $L$개 이하로 건너서 닿을 수 있는 모든 node다. 층 하나가 한 홉이니 두 층이면 두 홉이고, 층 수가 곧 그 node가 볼 수 있는 거리다.

식으로 쓰면 이렇다.

$$
h_v^{(l+1)} = \phi\Big(h_v^{(l)},\ \bigoplus_{u \in \mathcal{N}(v)} \psi\big(h_v^{(l)}, h_u^{(l)}, e_{uv}\big)\Big)
$$

- $h_v^{(l)}$ — $l$번째 층에서 node $v$의 벡터. 한 층이 내놓는 것이 $h_v^{(l+1)}$이다
- $\mathcal{N}(v)$ — $v$의 이웃, 한 홉 거리에 있는 node들
- $\psi$ — 이웃이 보낼 메시지를 만든다
- $\bigoplus$ — 모은다. **합·평균·최대처럼 순서에 영향받지 않는 연산**이어야 한다
- $\phi$ — 모은 것과 원래 자신을 합쳐 갱신한다

$\bigoplus$가 순서에 영향받지 않아야 순열 불변성이 성립한다. 이웃을 리스트로 이어붙이면 번호 매기기에 따라 답이 달라져 버린다.

## 대표적인 변형

차이는 전부 $\bigoplus$, 즉 **이웃을 어떻게 모으느냐**에 있다.

| | 모으는 방식 | 얻는 것 |
| --- | --- | --- |
| **GCN** | 차수 (degree)로 정규화한 합 $\frac{1}{\sqrt{d_i d_j}}$ | 가장 단순한 베이스라인 |
| **GraphSAGE** | 이웃을 샘플링한 뒤 평균·최대, 자기 자신과 이어붙임 | 큰 그래프, 처음 보는 node |
| **GAT** | attention 가중합 | 이웃마다 다른 비중을 학습 |
| **GATv2** | $a$를 비선형 뒤에 적용 | GAT의 정적 attention 문제 해결 |
| **GIN** | 합 + MLP (multilayer perceptron) | 이론상 최대 표현력 |

### GCN (graph convolutional network)

$$
h_v^{(l+1)} = \sigma\Big(\sum_{u \in \mathcal{N}(v) \cup \{v\}} \frac{1}{\sqrt{d_v d_u}} W h_u^{(l)}\Big)
$$

이웃을 차수로 정규화해 더한다. 사실상 가중 평균이라 **"이웃이 몇 개인지"가 지워진다.** 구현이 가볍고 빨라 베이스라인으로 늘 쓰이지만, 분자처럼 원자가 (valence)가 의미를 갖는 데이터에서는 이 손실이 아프다.

### GraphSAGE (sample and aggregate)

$$
h_v^{(l+1)} = \sigma\Big(W \cdot \big[\, h_v^{(l)} \;\|\; \mathrm{AGG}(\{h_u^{(l)} : u \in \mathcal{S}(v)\}) \,\big]\Big)
$$

두 가지가 다르다. 첫째, 이웃 전부가 아니라 **고정 개수만 샘플링** ($\mathcal{S}$)해서 node 수억 개짜리 그래프에서도 돌아간다. 둘째, 자기 자신과 이웃 요약을 더하지 않고 이어붙인다 ($\|$). 덕분에 "나"와 "주변"이 섞이지 않는다.

그리고 학습 때 보지 못한 node에도 쓸 수 있다 (**inductive**). 분자는 애초에 매번 새 그래프라 이 성질이 기본으로 필요하지만, 분자 그래프는 작아서 샘플링은 보통 하지 않는다.

### GAT와 GATv2 (graph attention network)

GAT는 이웃마다 가중치를 학습한다. transformer와 똑같은 연산을, 결합으로 이어진 이웃에만 한정한 것이다. query·key·value, cross-attention, FFN (feed-forward network)은 [attention 글](../attention-ko/)에서 따로 다룬다.

$$
\alpha_{vu} = \mathrm{softmax}_u\big(\mathrm{LeakyReLU}(a^\top [W h_v \,\|\, W h_u])\big)
$$

문제는 $a$가 비선형 **안쪽**에 있다는 점이다. 이 때문에 어떤 node에서 보든 이웃의 순위가 똑같아진다. 이를 <u>정적 (static) attention</u>이라 하고, "query에 따라 다른 이웃을 보는" attention 본래의 목적이 사라진다.

GATv2는 순서만 바꾼다.

$$
\alpha_{vu} = \mathrm{softmax}_u\big(a^\top \mathrm{LeakyReLU}(W [h_v \,\|\, h_u])\big)
$$

$a$를 비선형 **바깥쪽**으로 옮기면 node마다 다른 순위가 가능해진다 (dynamic attention). 구현 차이는 한 줄이고 비용도 비슷하므로, **새로 쓴다면 GATv2 쪽이 맞다.**

### GIN (graph isomorphism network)

$$
h_v^{(l+1)} = \mathrm{MLP}\Big((1 + \epsilon)\, h_v^{(l)} + \sum_{u \in \mathcal{N}(v)} h_u^{(l)}\Big)
$$

**합**은 평균·최대와 달리 이웃의 개수와 중복을 보존한다. 그래서 GIN은 1차원 Weisfeiler-Lehman (1-WL) 테스트와 같은 표현력 (expressive power)을 갖고, 이는 message passing 방식의 이론적 상한이다. GCN과 GraphSAGE-평균은 이보다 엄밀하게 더 약하다.

분자 사전학습의 표준 백본이 GIN인 이유가 이것이다. 탄소에 수소가 둘 붙었는지 셋 붙었는지를 평균은 같게 보지만 합은 구분한다.

### 분자에서 실제로 고르는 법

| 상황 | 쓸 만한 것 |
| --- | --- |
| 베이스라인 | GCN 또는 GraphSAGE |
| 사전학습 백본 | GIN (+edge feature 버전) |
| attention을 해석에 쓸 것 | GATv2 |
| 아주 큰 지식 그래프 | GraphSAGE (샘플링) |

중요한 함정이 하나 있다. <mark>GCN·GAT·GIN의 원래 정의는 **edge feature를 쓰지 않는다.**</mark> 분자에서 결합 차수 (단일·이중·방향족)는 핵심 정보이므로 그냥 쓰면 버려진다. PyTorch Geometric의 `GINEConv`, `NNConv`, 또는 MPNN (message passing neural network) 계열처럼 edge feature를 받는 변형을 써야 한다.

## 분자 전체를 하나의 벡터로

node 벡터가 아니라 분자 하나의 성질을 예측하려면 전부 모아야 한다. 이것을 **readout** (pooling)이라고 한다.

$$
h_G = \mathrm{READOUT}\big(\{h_v^{(L)} : v \in V\}\big)
$$

가장 단순하게는 합이나 평균이고, 정교하게는 attention 가중합이나 계층적 pooling을 쓴다. 여기서도 순서에 영향받지 않아야 한다.

## 깊게 쌓을 때 생기는 문제

CNN (convolutional neural network)은 수십 층을 쌓지만 GNN은 보통 **2~5층**에서 멈춘다. 이유는 두 가지다.

**over-smoothing.** 층을 거듭할수록 각 node가 더 넓은 이웃을 섞는다. 충분히 반복하면 모든 node가 비슷해지고, 결국 node 구분이 사라진다. 분자처럼 작은 그래프에서는 몇 층 만에 일어난다.

**over-squashing.** $L$-홉 이웃의 정보가 고정 크기 벡터 하나에 눌려 들어간다. 멀리 있는 node의 정보는 사실상 전달되지 않는다.

<mark>그래서 분자 그래프에서 멀리 떨어진 두 작용기의 상호작용을 포착하려면, 층을 더 쌓는 것이 답이 아니다.</mark> **지름길을 만들어주는 쪽**이 보통 답이 된다. 가상 node를 넣거나, 부분 구조 수준의 그래프를 따로 두거나 (이것이 junction tree가 하는 일이다), 전역 attention을 쓰는 식이다.

## 분자에 쓸 때의 실제 문제

- **feature 선택.** node에 무엇을 넣을지는 여전히 사람이 정한다. 원자 번호, 차수, 형식 전하, 방향족 여부, 수소 개수 등. 결합에는 결합 차수와 고리 포함 여부 등.
- **고리.** BRICS 같은 분해 규칙은 고리를 자르지 않는다. 그래서 융합 고리 하나가 거대한 조각으로 남을 수 있다.
- **입체화학 (stereochemistry).** 2D 그래프는 거울상 이성질체 (enantiomer)를 구분하지 못한다. 약리 활성이 달라지는 경우가 있으므로, 중요하다면 3D 정보나 별도 특징이 필요하다.
- **데이터 규모.** 라벨 데이터는 보통 수천 개다. 그래서 [사전학습](../transfer-learning-ko/)이 거의 필수다.

> **일반적으로 보면.** 그래프는 분자만의 것이 아니다. 소셜 네트워크, 추천, 지식 그래프, 교통망이 모두 그래프다. 다른 점은 **규모**다. 분자는 node 20~50개짜리 작은 그래프가 수백만 개인 반면 소셜 네트워크는 node가 수억 개인 그래프 하나라서, 분자 쪽은 그래프 단위 예측과 readout이 중심이고 저쪽은 node 단위 예측과 샘플링이 중심이다.


<figure>
<img src="/assets/fig/gnn-applications-reiser2022.jpg" alt="GNN이 쓰이는 분야들: 성질 예측, 스크리닝, 역설계, 원자 단위 시뮬레이션, 합성 예측" width="1400" height="1302">
<figcaption><b>GNN이 실제로 쓰이는 곳.</b> 위쪽은 분자다. ADMET (absorption, distribution, metabolism, excretion, toxicity) 성질, 역설계, 설명 가능한 ML. 아래쪽은 재료로 MOF, 결함 분류, 표면 반응. 가운데 화살표가 과제의 범위다 — 성질 예측부터 과학적 이해까지.
<br><span class="credit">Reiser et al., <a href="https://doi.org/10.1038/s43246-022-00315-6"><i>Commun. Mater.</i> <b>3</b>, 93 (2022)</a> &#183; 논문 그림, Figure 2</span></figcaption>
</figure>

## 정리

- 분자는 그래프이고, GNN은 순열 불변성을 구조에 갖고 있다
- 한 층 = 메시지 만들기 → 순서 무관하게 모으기 → 갱신
- GCN 평균 · GAT attention · GIN 합 (표현력이 가장 높음)
- 분자 수준 예측에는 readout이 필요하다
- 깊게 쌓으면 over-smoothing과 over-squashing — 보통 2~5층에서 멈춘다

## 참고

- Kipf & Welling, [GCN](https://arxiv.org/abs/1609.02907) (ICLR 2017) · Hamilton et al., [GraphSAGE](https://arxiv.org/abs/1706.02216) (NeurIPS 2017)
- Veličković et al., [GAT](https://arxiv.org/abs/1710.10903) (ICLR 2018) · Brody et al., [GATv2](https://arxiv.org/abs/2105.14491) (ICLR 2022)
- Xu et al., [How Powerful are Graph Neural Networks?](https://arxiv.org/abs/1810.00826) (ICLR 2019) — GIN과 WL 테스트의 관계
- [A Gentle Introduction to Graph Neural Networks](https://distill.pub/2021/gnn-intro/) — Distill. 인터랙티브해서 감을 잡기 좋다
