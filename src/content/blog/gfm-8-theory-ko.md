---
title: "GFM #8 — 이론: scaling, emergence, 전이성"
date: 2025-08-11
description: "분자·원자 계와 시간 graph에서만 측정된 scaling · 일반 graph를 직접 겨눈 두 시도의 결과 · 들여온 기대로 남아 있는 emergence · 그리고 graph 사이에서 무엇이 옮겨지는지에 대한 후보 vocabulary 셋."
category: review
updated: 2025-09
lang: ko
topic: Graphs
venue: arXiv
venueYear: 2025
group: gfm-8-theory
tags: [review, graph foundation models, scaling, transfer learning, expressiveness]
---

> Wang, Zehong, et al. "Graph Foundation Models: A Comprehensive Survey." *arXiv*, 21 May 2025, [arxiv.org/abs/2505.15116](https://arxiv.org/abs/2505.15116). Preprint.
> [논문 목록](https://github.com/Zehong-Wang/Awesome-Foundation-Models-on-Graphs)

언어에서 옮겨지는 단위는 단어이고, 비전에서는 경계 검출기 같은 것이다. graph에 대해서는 이 문장이 끝나지 않는다. 인용 네트워크와 분자를 가로질러 반복되면서 둘에서 같은 뜻을 갖는 단위가 없다. 이 장은 그 질문으로 가되, scaling과 emergence를 먼저 지난다.

논문은 이 공백이 노력 부족이 아니라 구조적인 것이라고도 적는다. graph는 "복잡하고 종종 사람이 정의한 관계를 담고" 있어서 옮겨지는 지식이 글이나 그림만큼 직관적이지 않다는 것이다. 단어가 공유 단위인 것은 공동체가 그렇게 합의했기 때문이고, graph 구조에는 그런 합의가 없다.

## Scaling: graph가 언어와 가장 닮은 곳에서만 측정된다

scaling 결과가 있는 곳은 분자와 원자 계, 그리고 시간에 따라 변하는 graph뿐이다. 논문이 드는 이유는 그 graph들이 언어를 닮았다는 것이다. 분자는 원자와 결합이라는 고정된 자모를 갖고, 시간 graph에는 순서가 있다.

화학에서 적합된 지수는 **0.17**과 **0.26**이고, 이 장은 여기에 네 가지 단서를 붙인다. modality, 데이터 구간, split 전략, 그리고 capacity다. 넷 중 한 조합에서 측정한 지수는 다른 조합으로 넘어가지 않는다.

일반 graph에 대한 직접적인 시도는 둘이 보고된다. 지도 학습에서는 축을 graph 개수가 아니라 **node나 edge의 개수**로 잡을 때 scaling이 나타난다. 무엇을 데이터가 늘어난 것으로 셀지에 대한 이야기다. 자기지도 학습 쪽은 더 나쁘다. 규모를 키우면 pretraining loss는 좋아지지만 downstream 성능은 따라오지 않는다.

## Emergence: 측정이 아니라 전제

emergence는 정의를 통해 들어온다. graph foundation model을 emergent ability를 보이는 모델로 규정하므로, 그 성질이 용어의 뜻 안에 들어가 있다. 이 장도, 이 survey의 다른 어디에서도 graph에서 그것을 측정한 결과는 보고하지 않는다.

## 단일 과제: 과제 셋, 표현력 천장 셋

도메인을 넘는 질문에 앞서 이 장은 *같은* 과제 종류 안에서 전이가 되는지를 확인한다. 되지 않고, 각 수준이 저마다 다른 이유로 막힌다.

| 수준 | 일반화되어야 하는 것 | 막히는 이유 | 덧대는 것 |
| --- | --- | --- | --- |
| node | homophily와 heterophily — 이웃이 닮는 경우와 닮지 않는 경우 | 표준 GNN (graph neural network)은 둘을 한꺼번에 처리하게 하면 일반화가 나빠진다 | 문맥용 서술문, 학습 가능한 예측 aggregation |
| link | 국소 proximity와 전역 proximity | message passing에 link isomorphism을 담을 표현력이 없다 | labeling trick, positional embedding |
| graph | motif 분포 | graph마다 motif 집합이 다르고, 1-WL (one-dimensional Weisfeiler-Leman)이 GNN이 담을 수 있는 범위를 제한한다 | disentangled representation learning, invariance learning, 표현력 높은 GNN |

과제 셋, 천장 셋, backbone 하나다. graph 수준 줄은 다음 절로 이어진다. 공유 motif vocabulary가 있다 해도 표준 아키텍처가 그걸 배울 수 없다는 뜻이기 때문이다.

## 과제를 넘어: 후보 vocabulary 셋

**graphon.** graphon은 그래프 한 묶음을 표본으로 읽게 해 주는 연속적인 생성 패턴이다. 두 graph가 같은 graphon에서 나왔다면 topology 성질을 공유하고, 그 embedding에 대한 상한이 따라 나온다. pretraining한 graph를 graphon 공간에 보내고 target이 그 안에서 생성될 수 있으면 전이를 보장하는 계열도 있다. 이 장은 단점을 두 번 적는다. 실제 graph에 대해 가정이 너무 강하고, 가정이 성립해도 도메인을 넘는 큰 집합에서 공유 graphon을 찾아내는 것 자체가 미해결이다. graphon 이론은 전이가 이미 쉬운 곳에서 전이를 설명한다.

**substructure.** 삼각형·별·k-clique는 어디에나 반복되고, 그게 매력이다. subgraph 기반 틀은 표집한 subgraph를 GNN으로 encoding한다. 이론적 뒷받침은 안정성 쪽에서 온다. 제대로 된 전이라면 작은 교란에 민감하지 않아야 한다는 것, 그리고 두 graph가 같은 바탕 공간을 이산화할 때 전이가 가능하다는 결과, ego-graph (node 하나와 그 이웃) 분포가 비슷할수록 전이가 잘된다는 관찰이다. 문제는 같은 motif가 도메인에 따라 다른 뜻을 갖는다는 것이고, [10장](../gfm-10-open-questions-ko/)이 그걸 *pattern conflict* 로 부른다.

**subtree.** message passing GNN은 1-WL test에 제한되어 별·맞붙은 고리·k-clique를 구별하지 못한다. subtree가 선택되는 이유는 정확히 message passing이 그것을 온전히 담아내기 때문이고, 안정성·전이성·일반화에 대한 이론적 보장도 따라 나온다. 대가는 구조적이고, 이 장도 그렇게 쓴다. tree 기반 표현은 구성상 어떤 구조적 의존성을 버린다.

<mark class="blue">후보 셋은 전이가 이미 쉬운 곳에서만 되는 것, backbone이 배울 수 없는 것, 그리고 전이하고 싶었던 구조를 버리는 것이다.</mark> 이 삼각 구도가 8장의 실제 내용이고, 논문도 셋을 서로 보완하는 선택지처럼 내놓지 않고 그렇게 적는다.

## 내가 물을 것

후보 vocabulary 셋이 서로 다른 이유로 각각 실패한다는 건, 아직 못 찾은 것이라기보다 찾을 단위가 없다는 쪽에 가깝다고 본다. 단어가 단위가 된 것은 공동체가 합의했기 때문이고, subgraph가 무슨 뜻인지에 대해서는 아무도 합의한 적이 없다.

## 정리

- graph scaling은 분자·원자 계와 시간 graph에서 측정됐고, 그렇게 한정되는 이유를 논문 자신이 "그 graph들이 언어를 닮았다"로 설명한다
- 화학에서는 지수가 나온다. 0.17과 0.26이고, modality·데이터 구간·split 전략·capacity라는 조건 네 개가 붙는다
- 일반 graph에서는 supervised scaling이 graph 개수 대신 node·edge 수를 세야 하고, self-supervised scaling은 pretraining loss만 좋아지고 downstream은 따라오지 않는다
- graph에서의 emergence는 GFM (graph foundation model)의 정의에 적혀 있고, 논문 어디에서도 결과로 보고되지 않는다
- 전이성에는 단어나 경계 검출기에 해당하는 graph 쪽 단위가 없고, 논문은 그 원인을 graph의 관계가 사람이 정의한 것이라는 데서 찾는다
- 한 과제 안에서도 node·link·graph 수준이 각각 다른 천장에 부딪히고, graph 수준의 천장은 표현력 한계다
- 과제를 넘는 후보 vocabulary는 graphon, substructure, subtree 셋이고 각각 결격 사유가 하나씩 있다

## 참고

- Wang et al., [Graph Foundation Models: A Comprehensive Survey](https://arxiv.org/abs/2505.15116), *arXiv* (2025) — 여기서 리뷰한 논문. 8장이 이 편이다
- Frey et al., [Neural scaling of deep chemical models](https://doi.org/10.1038/s42256-023-00740-3), *Nat. Mach. Intell.* (2023) — 위에 인용한 scaling 지수의 출처
- Chen et al., [Uncovering Neural Scaling Laws in Molecular Representation Learning](https://arxiv.org/abs/2309.15123), *NeurIPS* (2023) — modality·구간·split·capacity 조건의 출처
- Ma et al., [Do Neural Scaling Laws Exist on Graph Self-Supervised Learning?](https://arxiv.org/abs/2408.11243), *arXiv* (2024) — 자기지도 loss는 규모에 따라 좋아지는데 downstream 성능은 따라오지 않는다
- Wang et al., [GFT: Graph Foundation Model with Transferable Tree Vocabulary](https://arxiv.org/abs/2411.06070), *NeurIPS* (2024) — subtree vocabulary 답안, 그리고 그 안에 내장된 정보 손실
