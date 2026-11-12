---
title: "attention, cross-attention, 그리고 transformer 블록의 나머지"
date: 2025-04-18
description: "softmax가 곧 학습된 가중평균 · Q·K·V가 왜 셋인가 · self와 cross의 차이 · multi-head · 절반의 일을 하는 FFN · 집합에는 왜 위치가 필요 없나 · GAT는 이웃에 건 attention · attention 가중치가 설명이 아닌 이유"
category: concept
updated: 2025-05
lang: ko
group: attention
topic: Graphs
tags: [attention, transformer, cross-attention, interpretability]
---

[message passing](../gnn-ko/)은 node가 이웃에게서 정보를 모으게 하지만, 이웃을 전부 같은 방식으로 가중한다. attention은 쌍마다 얼마나 들을지를 모델이 정하게 하는 작은 변경이고, GAT부터 transformer까지가 전부 이 연산으로 만들어진다.

## attention을 한 줄로

<mark class="blue">attention은 모델이 가중치를 학습하되, 그 가중치가 지금 무엇을 묻고 있는지에 따라 달라지는 가중평균이다.</mark>

고정된 평균은 입력이 무엇이든 똑같다. attention은 query마다 가중치를 새로 계산하므로, 같은 위치라도 지금 필요한 것에 따라 다른 이웃을 본다.

## Q, K, V

같은 입력을 세 가지로 projection한 것이고, 역할이 다르다.

| | 어디서 오나 | 뜻 |
| --- | --- | --- |
| **query** $Q$ | 보려는 쪽 | 나는 무엇을 찾고 있나 |
| **key** $K$ | 보일 수 있는 모든 위치 | 나는 무엇을 제공하나 |
| **value** $V$ | 같은 위치들 | 실제로 건네주는 것 |

각 query를 모든 key와 비교하고, 비교 결과를 가중치로 바꾸고, 그 가중치로 value를 평균한다.

$$
\mathrm{Attention}(Q, K, V) = \mathrm{softmax}\!\left(\frac{QK^\top}{\sqrt{d_k}}\right)V
$$

<figure>
<img src="/assets/fig/attention-matrix.svg" alt="A raw score matrix and the same matrix after softmax, over eight atoms" loading="lazy" />
<figcaption><b>두 단계를 실제로 계산한 것.</b> 위치 8개, 16차원, 무작위 projection. 이 글을 쓰면서 PyTorch로 돌렸다. <b>(A)</b> 모든 query를 모든 key와 점수화한다. 부호가 있고 범위도 열려 있다. <b>(B)</b> 행마다 softmax를 걸면 음수가 없고 합이 1인 가중치가 된다. 그 한 행이 value를 섞는 배합표다.</figcaption>
</figure>

세부 두 가지.

- **$\sqrt{d_k}$.** 내적은 차원이 커질수록 커지고, softmax에 큰 값이 들어가면 거의 one-hot이 되어 gradient가 죽는다. 나눠서 스케일을 쓸 만하게 유지한다.
- **고르는 일은 softmax에서 일어난다.** 그래서 attention은 *재분배만* 할 수 있다. 가중치 합이 1이라 모든 곳을 동시에 세게 볼 수는 없다.

## self와 cross

<figure>
<img src="/assets/fig/attention-self-cross.svg" alt="Self-attention within one set of atoms, and cross-attention from atoms to junction-tree nodes" loading="lazy" />
<figcaption><b>차이는 K와 V가 어디서 오느냐뿐이다.</b> self-attention은 셋 다 같은 집합에서 온다. cross-attention은 query가 한 view에서, key와 value가 다른 view에서 와서 두 표현이 서로에게 질문할 수 있다.</figcaption>
</figure>

**self-attention**: $Q$, $K$, $V$가 모두 같은 집합에서 온다. 모든 원자가 멀리 있는 원자까지 포함해 서로를 본다. 평범한 message passing에 없는 지름길이 바로 이것이다. message passing에서는 정보가 결합을 하나씩 걸어가야 한다.

**cross-attention**: $Q$는 한쪽에서, $K$와 $V$는 다른 쪽에서. 디코더가 인코더를 읽는 방식이고, 이미지 모델이 캡션을 읽는 방식이고, [이중 view 분자 모델](../learning-paradigms-ko/)에서 원자 수준 그래프가 junction tree에 질문하는 방식이다. 비대칭이라는 점이 중요하다. 출력은 query마다 한 행이므로 cross-attention은 모양도 바꾼다.

## multi-head

attention 하나는 가중치 한 벌을 만들고, 그건 관련성의 기준이 하나라는 뜻이다. multi-head는 차원을 $h$조각으로 나눠 각각 독립적으로 attention을 돌린 뒤 이어붙인다.

$$
\mathrm{MultiHead} = \mathrm{Concat}(\mathrm{head}_1, \ldots, \mathrm{head}_h)\,W^O
$$

head마다 다른 역할을 맡을 수 있다. 분자 모델에서는 "같은 고리", "결합한 이웃", "멀지만 기능적으로 짝" 같은 식으로 갈라지는 경우가 흔하다. 추가 비용은 없다. 폭 $d/h$짜리 head $h$개는 폭 $d$짜리 head 하나와 파라미터 수가 같다.

## 나머지 절반: FFN

transformer 블록은 attention**만**이 아니다. attention이 위치 *사이*를 섞는다면, feed-forward network (FFN)는 *각 위치를 따로* 변환하고, 파라미터의 대부분을 들고 있다. 각 하위층은 **residual connection**으로 감싼다. 하위층의 출력이 입력을 대체하지 않고 입력에 더해진다는 뜻이고, 그래서 깊이 쌓아도 gradient가 앞쪽 층까지 닿는다.

<figure>
<img src="/assets/fig/transformer-block.svg" alt="A transformer block: multi-head attention, add and norm, feed-forward network, add and norm" loading="lazy" />
<figcaption><b>블록 하나.</b> 입력과 출력의 모양이 같고, 그 성질 덕분에 블록을 쌓을 수 있다. 각 하위층은 residual 연결과 정규화로 감싸여 있다. residual이 없으면 깊이 쌓은 것은 학습되지 않는다.</figcaption>
</figure>

$$
\mathrm{FFN}(x) = W_2\,\sigma(W_1 x + b_1) + b_2
$$

선형층 둘 사이에 비선형 하나를 넣은 것이고, 모든 위치에 똑같이 적용된다. 은닉 폭은 보통 모델 폭의 **네 배**다. 그래서 표준 블록에서 파라미터의 대략 3분의 2가 attention이 아니라 FFN에 있다. 둘의 관계를 읽는 방법 하나: **attention은 무엇을 볼지 정하고, FFN은 본 것을 어떻게 해석할지 정한다.** FFN을 빼면 가중평균을 쌓은 것이 되는데, 가중평균의 합성은 다시 가중평균이라 표현력이 전혀 늘지 않는다.

## 집합, 시퀀스, 그래프

지금 적은 attention에는 **순서 개념이 없다.** 입력을 섞으면 출력도 같이 섞인다. text에서는 이게 결함이고 위치 인코딩 (positional encoding)으로 메운다. 분자에서는 오히려 장점이다. 분자는 결합으로 이어진 원자의 집합이지 시퀀스가 아니고, [순열 불변성](../gnn-ko/)이 바로 원하는 성질이다.

그러면 결합 정보는 어떻게 넣는가. 세 가지가 쓰인다. attention을 결합한 이웃으로 제한하거나 (이게 **GAT** (graph attention network)다 — 전체가 아니라 이웃에 건 attention), 점수에 edge 항을 더하거나, 그래프 거리로 점수에 편향을 주거나.

| | 무엇을 섞나 | 비용 | 순서 |
| --- | --- | --- | --- |
| message passing | 이웃만 | $O(E)$ | 불변 |
| **GAT** | 이웃을, 가중해서 | $O(E)$ | 불변 |
| self-attention | 전부 | $O(n^2)$ | 위치를 넣기 전까지는 불변 |
| text transformer | 전부 | $O(n^2)$ | 위치 인코딩 필요 |

$O(n^2)$ 때문에 원자 40개짜리 분자에서는 전체 attention이 감당되고, node 10만 개짜리 지식 그래프에서는 비싸다.

## attention은 설명이 아니다

해석 가능성 주장이 걸리는 지점이고, 내 연구에서 하는 주장에도 똑같이 적용된다.

attention 가중치가 높다는 것은 모델이 그 위치를 **섞어 넣었다**는 뜻이다. <mark>그 위치가 예측을 일으켰다는 뜻이 아니다.</mark> 둘은 갈릴 수 있고, 실제로 갈린다.

- attention 가중치는 **유일하지 않다.** 다른 가중치 배분으로도 같은 출력이 나올 수 있어서, 읽어낸 값은 하나의 해일 뿐 그 해가 아니다.
- value 쪽도 똑같이 중요하다. 거의 0인 value에 큰 가중치가 걸리면 기여는 없다.
- residual이 있고 층이 많으면 한 층의 가중치가 최종 출력을 설명하는 몫이 점점 줄어든다. 한 층만 읽어서는 부족하기 때문에 attention rollout이 존재한다.

그러면 attention 주장은 어떻게 방어할 수 있나. 가중치를 **가설**로 두고 검증하는 것이다. 강조된 부분구조를 바꾸거나 떼고 예측이 실제로 움직이는지 보고, 모델이 신경 쓰지 않아야 할 음성 대조와 비교하고, 강조된 조각이 화학적으로 설명되는지 본다. 가중치는 들여다보기 시작하는 지점이지 근거 자체가 아니다.

방어 가능한 설명이 어떤 모양이고 어떤 방법이 그걸 내놓는지는 [따로 쓴 글](../interpretability-ko/)에 있다.

## 정리

- attention은 입력에서 계산된 가중치로, query마다 새로 만드는 가중평균이다
- $Q$가 묻고, $K$가 내걸고, $V$가 건네진다. $\sqrt{d_k}$는 softmax가 포화되지 않게 한다
- **self**는 $K$·$V$가 같은 집합에서, **cross**는 다른 view에서 온다
- multi-head는 같은 파라미터 예산으로 관련성의 기준을 여러 개 산다
- 블록은 attention **더하기 FFN**이고 각각 residual과 정규화로 감싼다. 파라미터 대부분은 FFN에 있고, FFN이 없으면 전체가 가중평균 하나로 주저앉는다
- attention에는 순서가 없다. text에는 문제, 분자에는 올바른 기본값
- GAT는 결합한 이웃으로 제한한 attention이고, 전체 self-attention은 $O(n^2)$다
- **가중치는 설명이 아니라 가설이다** — 강조된 부분을 건드려 예측이 움직이는지 본다

## 참고

- Vaswani et al., [Attention is all you need](https://arxiv.org/abs/1706.03762) (NeurIPS 2017) — FFN까지 포함한 원래의 블록
- Brody et al., [How attentive are graph attention networks?](https://arxiv.org/abs/2105.14491) (ICLR 2022) — GAT와 GATv2
- Jain & Wallace, [Attention is not explanation](https://arxiv.org/abs/1902.10186) (NAACL 2019) — 반론인 *Attention is not not explanation*과 같이 읽을 것
