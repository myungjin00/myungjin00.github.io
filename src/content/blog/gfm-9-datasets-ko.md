---
title: "GFM #9 — 데이터셋 목록: 무엇이 들어 있고 무엇이 빠졌는가"
date: 2025-08-11
description: "여덟 도메인에 걸친 데이터셋 45개와 과제별 분포 · 출처가 되는 여섯 개 벤치마크 모음 · 3D·양자 데이터셋 없음, 회귀 없음, 6장 과제 절반에 해당하는 줄 없음 · 그리고 두 가지 뜻으로 쓰인 node 개수 · 이 장은 데이터를 열거하고 프로토콜은 정하지 않는다."
category: review
updated: 2025-09
lang: ko
topic: Graphs
venue: arXiv
venueYear: 2025
group: gfm-9-datasets
tags: [review, graph foundation models, benchmarks, datasets, evaluation]
---

> Wang, Zehong, et al. "Graph Foundation Models: A Comprehensive Survey." *arXiv*, 21 May 2025, [arxiv.org/abs/2505.15116](https://arxiv.org/abs/2505.15116). Preprint.
> [논문 목록](https://github.com/Zehong-Wang/Awesome-Foundation-Models-on-Graphs)

**시리즈** · [#1 서론](../gfm-1-introduction-ko/) · [#2 기초](../gfm-2-background-ko/) · [#3 난점](../gfm-3-challenges-ko/) · [#4 프레임워크](../gfm-4-framework-ko/) · [#5 universal](../gfm-5-universal-ko/) · [#6 과제별](../gfm-6-task-specific-ko/) · [#7 도메인별](../gfm-7-domain-specific-ko/) · [#8 이론](../gfm-8-theory-ko/) · #9 데이터셋 · [#10 남은 문제](../gfm-10-open-questions-ko/)

9장에 **들어 있는 것과 빠진 것** 이 둘 다 [10장](../gfm-10-open-questions-ko/)의 평가 지적에 걸린다. 데이터셋 45개에 과제 칸과 출처 칸은 있고, split도 지표도 adaptation 예산도 칸이 없다.

## 표에 들어 있는 것

Table 14는 여덟 도메인에 걸쳐 데이터셋 45개쯤을 싣고, 칸은 도메인, 과제, node 수, edge 수, 클래스 수, graph 수, 글 속성 유무, 출처 모음이다.

| 도메인 | 줄 수 | 과제 수준 | 글 속성 | 대표 항목 |
| --- | --- | --- | --- | --- |
| e-commerce | 7 | node, link | 있음 | Products (node 316,513개 / edge 1,930만 개), Photo, Computer, Ratings |
| 학술 | 6 | node, link | 있음 | Arxiv, Cora, Citeseer, Pubmed, DBLP |
| knowledge base | 8 | link | 있음 | WN18RR, FB15K237, 크기별 Codex 셋, NELL995, ICEWS1819 |
| 분자 | 15 | graph | 섞임 | Chemblpre, PCBA, HIV, BBBP, BACE, Tox21, ToxCast, MUV, CYP450, ZINC, MUTAG, ENZYMES |
| 시계열 | 2 | link | 있음 | Enron, Googlemap CT |
| 소셜 네트워크 | 5 | node, link, graph | 섞임 | Reddit, Flickr, MovieLens, IMDB-BINARY, IMDB-MULTI |
| 뇌 연결망 | 1 | link | 없음 | ogbl-vessel (node 350만 개) |
| 이미지 | 1 | graph | 없음 | Fingerprint |

이 분포에서 드러나는 구조적 사실이 둘이다. 분자 줄이 가장 많고, knowledge base는 link 하나만 있는 유일한 도메인이다. 둘 다 7장이 전이 결과를 찾아낸 자리와 일치한다.

## 과제는 셋, 셋뿐이다

과제 절이 다루는 것은 **node classification**, **link prediction**, **graph classification** 이고 각각 한 문단이다.

node classification은 node feature와 이웃 구조를 둘 다 제대로 encoding해야 한다. link prediction은 구조적 근접성과 feature 적합성을 함께 보고 node 유사도를 모델링해야 하며, 고차 연결 패턴을 담는 embedding이 필요한 경우가 많다. 추천과 knowledge base 보완이 이 과제에 올라선다. graph classification은 국소 substructure와 전역 topology를 한꺼번에 보존하는 graph 수준 표현이 필요하고 보통 계층적 pooling을 쓰는데, 이 장은 더 큰 구조 안에서 판별력 있는 subgraph를 집어내는 능력에 성패가 달려 있다고 적는다.

<mark>과제 셋, 그것도 전부 분류 아니면 link prediction인 것이 데이터셋 장의 과제 어휘 전부다. 6장은 과제 여섯 개, 7장은 도메인 여덟 개의 방법을 훑었는데도 그렇다.</mark>

## 이 장이 서술하는 여덟 도메인

도메인 문단은 node가 무엇인지만 말하지 않고, 각 도메인을 어렵게 만드는 구조적 성질을 하나씩 짚는다.

| 도메인 | 이 장이 짚는 구조적 성질 |
| --- | --- |
| e-commerce | edge 종류가 여럿인 heterogeneous 구조. 동시 구매, 동시 열람, 의미 유사도 |
| 학술 | 인용이 쌓이고 연구 흐름이 바뀌므로 시간에 따라 변한다 |
| knowledge base | ontology 제약과 계층 구조. 추론에 유용한 inductive bias가 된다 |
| 분자 | 결합의 물리적 제약에서 오는 차수와 edge 형성의 강한 규칙성 |
| 시계열 graph | 시간을 따라가는 구조적 전이 |
| 소셜 네트워크 | 높은 clustering coefficient, small-world 성질, scale-free 차수 분포 |
| 뇌 연결망 | 신경 회로에서 백질로 이어진 영역까지, 여러 scale에 걸친 조직 |
| 이미지 | 공간 관계. 격자 데이터를 불규칙한 graph로 바꾼다 |

분자 줄이 [8장](../gfm-8-theory-ko/)과 이어진다. 결합 제약이 바로 분자 graph를 "well-structured"로 분류하게 하는 근거이고, graph scaling이 실제로 측정된 조건이 그것이다.

## 줄들의 출처

모음 여섯 개가 표의 거의 전부를 공급한다.

- **text-space graph foundation model** — text-attributed 벤치마크 13개. node 316K개인 Products에서 Cora까지, node·link prediction용
- **knowledge base 벤치마크** — 의미 기반 link prediction을 위한 WN18RR·FB15K237의 글 보강판
- **시간 graph 벤치마크** — ICEWS1819 같은 변화하는 데이터셋
- **TAGLAS** — Chemblpre, PCBA를 포함한 text-attributed 분자 데이터셋. graph가 수십만 개다
- **graph pattern recognition** — ENZYMES, MUTAG 같은 구조만 있는 벤치마크. 글 없이 topology 이해를 재려는 것이다
- **특수 목적 데이터셋** — 뇌 연결 (ogbl-vessel), 추천 (MovieLens), 소셜 네트워크 (Reddit, Flickr)

여섯 중 다섯이 글 속성을 중심에 두거나 그 부재를 명시적으로 겨냥한다. 5장·6장이 다룬 문헌에는 맞고 7장의 문헌에는 맞지 않는 구성이다.

## 목록이 빠뜨린 것

빈 자리는 무작위가 아니다.

**3D·양자 데이터셋이 없다.** QM9, OC20, ANI-1x, rMD17, SPICE, MD22, MatBench는 8장의 scaling 논증 전체와 7장의 atomic potential 절반을 떠받치는데, 여기에는 한 줄도 없다. scaling이 측정된 유일한 도메인이, 데이터 장에서 데이터가 빠진 도메인이다.

**회귀가 없다.** 표의 모든 과제가 node classification, link prediction, graph classification이다. 분자 줄도 전부 분류 데이터셋이라서 [분자 성질 예측](../mpp-ko/)의 상당 부분을 이루는 회귀 지표 — 용해도, lipophilicity, 자유에너지 — 가 없고 ClinTox와 SIDER도 없다.

**6장 과제의 절반에 데이터가 없다.** graph 생성, question answering, 이상 탐지는 줄이 아예 없고, 추천은 소셜 네트워크 아래 들어간 MovieLens 하나로만 나온다. 6장이 자세히 서술하는 GraphQA 벤치마크는 목록에 없다.

**7장 도메인 중 넷에 줄이 없다.** heterogeneous graph, 문서 네트워크, 알고리즘 graph, 인과 graph는 도메인으로 다뤄지면서 항목이 없다.

**node 개수가 두 가지 뜻으로 쓰인다.** TAGLAS에서 온 줄은 graph 모음 전체의 합계를 적는다. ToxCast는 graph 8,575개에 걸쳐 node 161,002개, edge 330,180개다. 반면 pattern recognition 벤치마크에서 온 줄은 graph당 평균을 물결표와 함께 적는다. ZINC는 graph 12,000개에 node 약 20개, edge 약 22개다. ToxCast는 실제로 두 번 나오는데 한 번은 각 방식으로 적혀 있다. 표를 세로로 읽으며 숫자를 비교하는 사람은 서로 다른 양을 비교하고 있는 것이다.

**ENZYMES가 분자 아래 있다.** 단백질 데이터셋이 화학 줄에 들어가 있다.

## 프로토콜은 없다

표에는 과제 칸이 있고 출처 칸이 있다. split 칸은 없고, 지표 칸도 없고, adaptation 때 label을 몇 개까지 쓸 수 있는지를 적은 칸도 없다.

그게 이 장의 결론이다. <mark class="blue">프로토콜 없는 데이터셋 목록은 논문 두 편을 비교 가능하게 만들지 못하고, 9장도 그걸 할 수 있다고 주장하지 않는다.</mark> 그리고 10장은 graph 공동체의 벤치마킹 문화를 일관성과 재현성 문제로 비판한다. 바로 앞 장이 무엇이든 고정해 두었다면 답이 됐을 비판이다.

## 내가 물을 것

dual-view 분자 모델 쪽에서 보면 실질적 결론은 좁지만 분명하다. 이 표에는 그대로 받아 쓸 줄이 없으니 프로토콜을 직접 고정하고 밝혀야 하고, 내 [평가 프로토콜](../evaluation-protocol-ko/) 노트가 그 이야기다.

## 정리

- 여덟 도메인에 데이터셋 45개쯤. 분자 줄이 가장 많고 knowledge base는 link만 있는 유일한 도메인이다
- 과제는 셋뿐이다. node classification, link prediction, graph classification. 6장의 과제 여섯 개, 7장의 도메인 여덟 개와 대비된다
- 출처 모음은 여섯 개이고 그중 다섯이 글 속성의 유무를 중심으로 짜여 있다
- 8장의 scaling 결과를 떠받치는 3D·양자 데이터셋이 목록에 없다
- 회귀 지표가 어디에도 없어서 분자 줄은 분류만 덮는다
- node·edge 칸이 전체 합계와 graph당 평균을 섞어 쓰고, ToxCast는 두 방식으로 각각 한 번씩 올라 있다
- split도 지표도 adaptation 예산도 없다. 이 장은 프로토콜을 정하지 않고, 그것이 [#10](../gfm-10-open-questions-ko/)의 평가 논증이 서는 전제다

## 참고

- Wang et al., [Graph Foundation Models: A Comprehensive Survey](https://arxiv.org/abs/2505.15116), *arXiv* (2025) — 여기서 리뷰한 논문. 9장이 이 편이다
- Chen et al., [Text-space Graph Foundation Models: Comprehensive Benchmarks and New Insights](https://arxiv.org/abs/2406.10727), *arXiv* (2024) — node·link 줄 대부분을 공급하는 text-attributed 벤치마크 13개
- Feng et al., [TAGLAS: An atlas of text-attributed graph datasets in the era of large graph and language models](https://arxiv.org/abs/2406.14683), *arXiv* (2024) — 분자 줄들, 그리고 합계로 적는 방식의 출처
- Galkin et al., [Towards Foundation Models for Knowledge Graph Reasoning](https://arxiv.org/abs/2310.04562), *ICLR* (2024) — 글 보강 knowledge base 항목의 출처
