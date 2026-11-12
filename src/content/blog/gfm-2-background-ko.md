---
title: "GFM #2 — 기초: 그래프 학습의 네 시대와 정의들"
date: 2025-06-25
description: "graph kernel에서 graph embedding으로, GNN으로, 그리고 pretraining된 그래프 모델로 · foundation model의 정의와 규모에서 나타난다는 것 · GFM이 갖춰야 한다는 다섯 가지 성질 · 그리고 8장이 보여 주지 못하는 것을 전제로 깔아 둔 정의"
category: review
updated: 2025-07
lang: ko
topic: Graphs
venue: arXiv
venueYear: 2025
group: gfm-2-background
tags: [review, graph foundation models, graph embeddings, pretraining]
---

> Wang, Zehong, et al. "Graph Foundation Models: A Comprehensive Survey." *arXiv*, 21 May 2025, [arxiv.org/abs/2505.15116](https://arxiv.org/abs/2505.15116). Preprint.
> [논문 목록](https://github.com/Zehong-Wang/Awesome-Foundation-Models-on-Graphs)

**시리즈** · [#1 서론](../gfm-1-introduction-ko/) · #2 기초 · [#3 난점](../gfm-3-challenges-ko/) · [#4 프레임워크](../gfm-4-framework-ko/) · [#5 universal](../gfm-5-universal-ko/) · [#6 과제별](../gfm-6-task-specific-ko/) · [#7 도메인별](../gfm-7-domain-specific-ko/) · [#8 이론](../gfm-8-theory-ko/) · [#9 데이터셋](../gfm-9-datasets-ko/) · [#10 남은 문제](../gfm-10-open-questions-ko/)

2장은 그래프 학습의 역사를 네 개의 패러다임으로 정리하고, foundation model이 무엇인지 다시 짚고, 표기법을 정한다. 그 정의 중 하나에는 이 논문의 이론 장이 받쳐 주지 못하는 주장이 들어 있다.

## 그래프 학습의 네 시대

<figure>
<img src="/assets/fig/gfm-development.png" alt="The evolution of graph learning paradigms, from graph kernels to graph foundation models" width="2400" height="1011" loading="lazy">
<figcaption><b>그래프 학습이 여기까지 온 과정.</b> 사람이 설계한 kernel에서 학습된 node embedding으로, 다시 end-to-end GNN으로, 그리고 큰 그래프 말뭉치에 pretraining한 뒤 downstream에 적응시키는 모델로 왔다. 매 단계가 사람의 일을 데이터로 넘긴 것인데, <b>도메인을 넘어간다고 주장하는 건 마지막 단계뿐이다.</b>
<br><span class="credit">Wang et al., <a href="https://arxiv.org/abs/2505.15116">Graph Foundation Models: A Comprehensive Survey</a>, arXiv:2505.15116 &#183; 논문 그림, Figure 2</span></figcaption>
</figure>

**통계적 방법** (2010년대 이전)은 고전 그래프 이론과 조합 최적화에서 나왔다. 최단 경로 계산, spectral clustering, graph kernel이다. 네트워크 분석, 커뮤니티 탐지, 그래프 매칭을 받쳐 줬고, 한계는 사람이 손으로 만든 feature, 규모를 키우기 어렵다는 점, 그리고 재사용할 수 있는 representation을 학습할 능력이 없다는 점이었다.

**graph embedding** (2010년 무렵)이 representation learning을 들여왔다. DeepWalk, node2vec, LINE은 random walk나 이웃 표집으로 node를 낮은 차원의 연속 공간에 대응시키고, 그렇게 나온 벡터가 node classification, clustering, link prediction에 통했다. 뒤에서 계속 걸리는 한계가 둘이다. 대체로 transductive라서 학습 때 못 본 node에는 embedding이 없고, 구조는 담지만 node·edge 속성은 받지 못한다.

**graph neural network** (GNN, 2016년 이후)는 [message passing](../gnn-ko/)으로 딥러닝을 비유클리드 구조에 적용했고, 기준점은 GCN (graph convolutional network), GAT (graph attention network), GraphSAGE다. embedding 시대의 두 한계를 둘 다 풀었다. 학습 때 못 본 node에도 추론이 되고, 속성을 입력으로 바로 받는다. 그리고 자기 한계를 새로 들여왔다. over-smoothing, 좁은 receptive field, 그리고 과제마다 구조를 많이 손봐야 한다는 점이다.

**graph foundation model** (2023년 이후)은 self-supervised 목적함수로 큰 그래프에 pretraining해서 과제와 도메인을 넘어 옮겨지는 범용 representation을 겨눈다. 내세우는 이득은 모델 학습을 특정 과제에서 떼어 놓으면 label과 도메인 전용 heuristic에 덜 의지하게 된다는 것이다.

순서대로 읽으면 각 시대가 앞 시대의 병목을 풀고 새 병목을 물려받는다. <mark>네 번째 시대만 자기 병목이 아직 지목되지 않았는데, 그걸 알아낼 만큼 오래 돌려 본 사람이 없기 때문이다.</mark>

## 이 장이 쓰는 foundation model의 정의

용어는 스탠퍼드의 human-centered AI 연구소에서 퍼뜨렸고, 구조적인 답은 거의 항상 transformer다. 먼 거리 의존성을 담는 self-attention을 파라미터 수십억 규모까지 키운 것이다. 언어 쪽으로 GPT, BERT, PaLM, LLaMA가, vision-language로 CLIP과 DALL·E가 예로 나온다.

능력에 대한 주장은 세 갈래다. 크고 다양한 데이터로 pretraining하면 의미·구문·구조 지식이 쌓이고 그것이 파인튜닝·prompting·instruction tuning으로 옮겨진다. in-context learning은 gradient 갱신 없이 입력 prompt만으로 새 과제를 받게 해 준다. 그리고 모델과 데이터가 커지면 작은 모델에서는 프로그래밍되지도 관찰되지도 않던 능력, 즉 **emergent behavior**가 나타난다. 예로 드는 것은 논리적 추론, chain-of-thought 생성, 도구 사용이다.

이 장은 거기 따라오는 것도 열거하는데, 논문 전체에서 그 말이 나오는 유일한 자리다. 데이터와 사회적 편향, 해석 가능성, 안전성, 환경 비용이다. 넷 중 어느 것도 남은 90쪽에서 다시 나오지 않는다.

## GFM (graph foundation model)이 갖춰야 한다는 다섯 가지 성질

논문은 이것들을 이미 있는 모델에 대한 보고가 아니라 GFM이 갖춰야 할 성질로 적는다.

- **대규모 그래프 데이터 pretraining** — 생물, 소셜 네트워크, knowledge graph에 걸친 다양한 데이터셋
- **범용 representation** — node·edge·graph 수준의 범용 embedding. 최소한의 파인튜닝이나 prompting으로 쓸 수 있어야 한다
- **구조 인식** — 연결성, 이웃 구조, 그래프 전역 성질
- **전이 가능성** — 과제 사이로도, 도메인 사이로도 옮겨지는 지식. 과제별 데이터가 적어도 쓸 만해야 한다
- **few-shot·zero-shot** — label이 거의 또는 전혀 없는 새 과제 수행

3번과 4번은 서로 당기고, 그 긴장이 [3장](../gfm-3-challenges-ko/)이 다루는 주제다.

## 정의들, 그리고 결론을 전제로 깐 하나

정의가 여섯 개 나온다. 그래프는 node 집합과 edge 집합에 adjacency matrix가 딸린 것, attributed graph는 거기에 node feature 행렬이 붙은 것, GNN은 국소 이웃 위에서 재귀적으로 정보를 모으는 구조, LLM (large language model)은 글 말뭉치로 pretraining한 transformer이며 그래프에 딸린 글 정보를 통해 그래프 위에서도 돌 수 있다는 것이다. 그리고 멈춰 볼 만한 것이 둘이다.

**text-attributed graph** (TAG)는 node, edge, 또는 그래프 전체에 서술문이 붙은 그래프로 정의된다. 글이 형식적 정의의 일부가 되는 순간, 5장과 6장의 방법 상당수가 예외가 아니라 정의 안쪽에 들어온다.

그리고 마지막 하나. graph foundation model은 도메인과 과제를 넘나드는 방대한 그래프 데이터로 pretraining한 모델로 정의되고, pretraining을 통해 옮겨지는 지식과 범용 능력을 얻으며 "여러 그래프 응용에 걸쳐 emergent 성질과 적응성을 보인다"고 적혀 있다.

<mark class="blue">emergence가 대상의 정의 안에 들어가 있는데, [8장](../gfm-8-theory-ko/)은 그걸 보여 주는 그래프 결과를 하나도 보고하지 않는다.</mark> 저자들이 숨긴 모순은 아니다. 10장은 그 scaling 흐름이 기존 GFM에서 아직 나타나지 않았다고 분명히 쓴다. 그래서 이 정의는 관찰된 모델 부류가 아니라 의도된 모델 부류를 가리킨다.

## 내가 물을 것

구조 인식과 전이 가능성을 함께 요구하는데, 나는 그 둘이 함께 오지 않는다고 본다. 한 도메인의 구조를 충실히 담은 representation은 바로 그 이유로 그 도메인의 모양을 한다. GFM의 정의를 사실 보고가 아니라 의도 선언으로 놓고 읽으면 남은 90쪽이 훨씬 똑바로 읽힌다.

## 정리

- 패러다임 넷이다. 통계적 방법, 얕은 graph embedding, end-to-end GNN, pretraining된 graph foundation model
- graph embedding은 transductive였고 속성을 받지 못했다. GNN이 둘 다 풀고 대신 over-smoothing과 구조 손보기를 들여왔다
- foundation model은 규모 + 범용 pretraining + adaptation이고, transformer 위에 서며, in-context learning이 값싼 인터페이스다
- emergent behavior는 언어와 비전에서 성공의 예상 형태이고, 이 장은 편향·해석 가능성·안전성·연산 비용을 그 짝으로 열거한다
- GFM의 요구 성질 다섯: 대규모 pretraining, 범용 representation, 구조 인식, 전이 가능성, few-shot·zero-shot
- text-attributed graph가 일찍 형식적으로 정의되고, 뒤의 방대한 방법 목록이 그 덕에 가능해진다
- GFM의 정의에 emergent 성질이 들어 있는데, 이 논문의 이론 장은 그래프에서 그걸 보여 주지 못한다

## 참고

- Wang et al., [Graph Foundation Models: A Comprehensive Survey](https://arxiv.org/abs/2505.15116), *arXiv* (2025) — 여기서 리뷰한 논문. 2장이 이 편이다
- Perozzi et al., [DeepWalk: Online Learning of Social Representations](https://arxiv.org/abs/1403.6652), *KDD* (2014) — graph embedding 시대. random walk로 공통 벡터 공간에 넣기
- Kipf & Welling, [Semi-Supervised Classification with Graph Convolutional Networks](https://arxiv.org/abs/1609.02907), *ICLR* (2017) — GCN. message passing 시대의 기준점
- Vaswani et al., [Attention Is All You Need](https://arxiv.org/abs/1706.03762), *NeurIPS* (2017) — 이 장의 모든 foundation model이 올라서 있는 구조
- Wei et al., [Emergent Abilities of Large Language Models](https://arxiv.org/abs/2206.07682), *TMLR* (2022) — GFM 정의가 빌려 온 emergence 결과
