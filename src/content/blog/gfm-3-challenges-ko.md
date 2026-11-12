---
title: "GFM #3 — 난점: 세 가지 이질성"
date: 2025-07-01
description: "feature·structure·task 이질성과 각각이 어려운 이유 · SVD 투영, text encoder, projection layer · 깊이의 대가인 over-smoothing과 over-squashing · explicit과 implicit task alignment · 그리고 세 절을 똑같이 닫는 인정."
category: review
updated: 2025-08
lang: ko
topic: Graphs
venue: arXiv
venueYear: 2025
group: gfm-3-challenges
tags: [review, graph foundation models, heterogeneity, over-smoothing, transfer learning]
---

> Wang, Zehong, et al. "Graph Foundation Models: A Comprehensive Survey." *arXiv*, 21 May 2025, [arxiv.org/abs/2505.15116](https://arxiv.org/abs/2505.15116). Preprint.
> [논문 목록](https://github.com/Zehong-Wang/Awesome-Foundation-Models-on-Graphs)

**시리즈** · [#1 서론](../gfm-1-introduction-ko/) · [#2 기초](../gfm-2-background-ko/) · #3 난점 · [#4 프레임워크](../gfm-4-framework-ko/) · [#5 universal](../gfm-5-universal-ko/) · [#6 과제별](../gfm-6-task-specific-ko/) · [#7 도메인별](../gfm-7-domain-specific-ko/) · [#8 이론](../gfm-8-theory-ko/) · [#9 데이터셋](../gfm-9-datasets-ko/) · [#10 남은 문제](../gfm-10-open-questions-ko/)

3장은 천 단어쯤이고, 여기서 지목하는 세 문제의 해법을 전부 5·6·7장으로 넘긴다. 뒤의 세 방법 목록이 답하려는 질문이 이 장에서 세워진다.

<figure>
<img src="/assets/fig/gfm-challenges.png" alt="Feature, structure and task heterogeneity across graph domains" width="1880" height="1471" loading="lazy">
<figcaption><b>그래프가 하나로 묶이지 않는 세 가지 방식.</b> <b>(a)</b> node feature는 데이터셋마다 길이조차 다르다. 분자와 인용 네트워크가 다른 건 물론이고 <b>인용 네트워크 둘끼리도 다르다</b>. <b>(b)</b> 벤젠 고리와 triadic closure는 둘 다 반복되는 motif지만 뜻이 전혀 다르다. <b>(c)</b> node·link·graph task는 각각 다른 지식을 요구한다. 글에는 이런 문제가 없고, 그래서 foundation model이 거기서 먼저 나왔다.
<br><span class="credit">Wang et al., <a href="https://arxiv.org/abs/2505.15116">Graph Foundation Models: A Comprehensive Survey</a>, arXiv:2505.15116 &#183; 논문 그림, Figure 3</span></figcaption>
</figure>

<mark>그래프 데이터는 도메인마다 서로 다른 세 가지 방식으로 이질적이고, 통합 모델 하나는 그 셋을 모두 견뎌야 한다.</mark> 이 장은 셋을 한 절씩 나눠 다루고, 각 절을 같은 식의 인정으로 끝낸다.

## feature 이질성

데이터셋마다 node·edge·graph 수준 feature가 다르다는 것인데, 원인이 둘이다.

**도메인 차이** 는 눈에 바로 보이는 쪽이다. 분야가 다르면 그래프가 담는 의미가 다르다. 인용 네트워크는 제목·저자·초록으로 학술 관계를 서술하고, 분자 그래프는 원자 종류·결합 차수·공간 배치로 화합물을 서술한다. 같은 종류의 물건이 아니고 차원도 같지 않다.

**전처리 불일치** 는 놓치기 쉬운 쪽이다. feature 추출 pipeline이 다르면 서로 맞지 않는 feature가 나오는데, *같은 도메인 안에서도* 그렇다. 인용 네트워크 둘끼리의 불일치가 그중 하나와 분자 사이의 불일치만큼 심할 수 있는 이유가 이것이다.

쓰이는 해법은 SVD (singular value decomposition)로 공통 latent space에 투영하기, 대형 언어 모델을 **text encoder** 로 써서 node를 말로 서술하고 그 말을 encoding하기, 그래프 전용 **feature projection layer** 를 두기다. 이 장의 결론은 이질적인 feature를 정렬하는 범용적이고 적응적인 해법이 **아직 열린 연구 방향** 이라는 것이다.

## structure 이질성

데이터셋마다 topology 패턴이 다르다는 것이다. 여기서 구조는 장식이 아니다. downstream 추론에서 신호의 상당 부분을 구조가 들고 있고, 도메인에 따라 구조 패턴이 충분히 많이 달라서 그래프 종류를 넘나들며 일반화하는 GNN (graph neural network)을 설계하기가 어렵다. 분자에는 벤젠 고리 같은 화학적 motif가 반복되고, 소셜 네트워크는 triadic closure 같은 관계 구조가 중심이다. 모델은 어느 한쪽에 맞춰지는 대신 구조에 적응할 수 있어야 한다.

여기서 바로 떠오르는 대응이 층을 더 쌓거나 capacity를 늘리는 것인데, 이 장은 그게 왜 실패하는지 적어 둔다. **over-smoothing과 over-squashing** 이다. over-smoothing은 더 오래된 결과다. graph convolution은 Laplacian smoothing의 한 형태라서 충분히 쌓으면 node representation들이 서로 가까워지다가 구별되지 않는 지점까지 간다. over-squashing은 그 짝이 되는 실패다. 깊이에 따라 receptive field는 지수로 커지는데 그걸 실어 나르는 벡터 크기는 그대로라서, 먼 거리 정보가 복원 불가능하게 압축된다. 깊이는 도달 범위를 늘려 주면서, 그 범위로 보려던 정보를 잃는다.

쓰이는 해법은 구조를 고려한 data augmentation, graph prompt tuning, 이산 구조 codebook이다. 결론은 현재 방법들이 실제 데이터에 나타나는 **구조 전체 범위를 감당하지 못한다** 는 것이다.

## task 이질성

학습 목표가 다르면 필요한 모델링 전략과 inductive bias가 다르다.

| 수준 | 예측 대상 | 모델에 필요한 것 |
| --- | --- | --- |
| node | node별 label | 국소 이웃 정보 |
| link | node 쌍 사이 edge의 존재나 종류 | 쌍 단위 관계 구조 |
| graph | 그래프 전체의 성질 | subgraph motif와 전역 의존성 |

node classifier는 국소성을 원하고 graph classifier는 전역 요약을 원한다. 같은 inductive bias가 아니고, 한쪽에 맞춘 모델은 다른 쪽에 잘못 맞춰진 모델이다. 해법은 두 계열이다. 모든 task를 하나의 공통 예측 형식으로 다시 쓰고 head 하나로 다 받는 **explicit alignment**, task 정의는 그대로 두고 아키텍처와 불변성에 맡기는 **implicit alignment** 다. 각각이 실제로 어떤 모습인지는 [#5](../gfm-5-universal-ko/)에서 본다. 여기 결론은 task 종류를 자유롭게 넘나드는 universal GFM (graph foundation model)이 **여전히 어렵고 대체로 안 풀린 목표** 라는 것이다.

<mark class="blue">세 절이 모두 같은 인정으로 끝난다. 논문 전반부에서 건질 게 가장 많은 부분이 이것이다.</mark> 해법은 있고 도움이 되지만, 어느 것도 문제를 닫지 못한다고 이 장은 매 절에서 적는다.

## 내가 물을 것

셋 중 평범한 실무에 가장 빨리 닿는 것은 feature 이질성의 뒤쪽 절반이다. pretraining 말뭉치와 downstream 벤치마크를 서로 다른 pipeline으로 featurization하면 도메인과 아무 상관 없는 이유로 전이가 깎이고, 이건 도메인을 넘을 때만큼이나 [분자 성질 예측](../mpp-ko/) 안에서도 그대로 성립한다.

## 정리

- 이질성의 출처가 셋이고 전부 열려 있다. **feature**, **structure**, **task**
- feature 이질성은 원인이 둘이다. 도메인 사이의 의미 차이, 그리고 한 도메인 안의 전처리 차이. 해법은 SVD 투영, text encoder, feature projection layer
- structure 이질성이 깊이를 늘려도 안 되는 이유다. over-smoothing은 node representation을 뭉개고, over-squashing은 먼 거리 정보를 짓누른다
- task 이질성은 node·link·graph 수준이 서로 다른 inductive bias를 원한다는 뜻이다. explicit alignment는 task를 고쳐 쓰고 implicit alignment는 모델을 고쳐 쓴다
- 여기 나오는 해법은 전부 완화책이고, 이 장도 매번 그렇게 적는다
- 실제 수선은 세 개의 방법 장으로 넘겨진다. 그래서 이 장이 논문 나머지의 판을 깐다

## 참고

- Wang et al., [Graph Foundation Models: A Comprehensive Survey](https://arxiv.org/abs/2505.15116), *arXiv* (2025) — 여기서 리뷰한 논문. 3장이 이 편이다
- Li et al., [Deeper Insights into Graph Convolutional Networks for Semi-Supervised Learning](https://arxiv.org/abs/1801.07606), *AAAI* (2018) — graph convolution이 Laplacian smoothing이라는 over-smoothing 결과
- Alon & Yahav, [On the Bottleneck of Graph Neural Networks and its Practical Implications](https://arxiv.org/abs/2006.05205), *ICLR* (2021) — over-squashing
- Liu et al., [One for All: Towards Training One Graph Model for All Classification Tasks](https://arxiv.org/abs/2310.00149), *ICLR* (2024) — 글 서술을 공통 feature space로 쓰는, feature 이질성의 대표 해법
