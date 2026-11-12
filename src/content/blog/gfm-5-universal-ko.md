---
title: "GFM #5 — universal GFM 세 갈래와 아직 안 되는 것"
date: 2025-08-11
description: "모든 그래프를 하나의 latent space로 · explicit과 implicit unification, 그리고 link·subgraph·tree 단위 · 언어 모델 하나로 그래프를 다루기 · graph-language co-training · 그리고 세 갈래 중 둘이 깔고 있는 전제, 그래프에 텍스트가 붙어 온다는 것"
category: review
updated: 2025-09
lang: ko
topic: Graphs
venue: arXiv
venueYear: 2025
group: gfm-5-universal
tags: [review, graph foundation models, pretraining, transfer learning, universal GFM, large language models]
---

> Wang, Zehong, et al. "Graph Foundation Models: A Comprehensive Survey." *arXiv*, 21 May 2025, [arxiv.org/abs/2505.15116](https://arxiv.org/abs/2505.15116). Preprint.
> [논문 목록](https://github.com/Zehong-Wang/Awesome-Foundation-Models-on-Graphs)

**시리즈** · [#1 서론](../gfm-1-introduction-ko/) · [#2 기초](../gfm-2-background-ko/) · [#3 난점](../gfm-3-challenges-ko/) · [#4 프레임워크](../gfm-4-framework-ko/) · #5 universal · [#6 과제별](../gfm-6-task-specific-ko/) · [#7 도메인별](../gfm-7-domain-specific-ko/) · [#8 이론](../gfm-8-theory-ko/) · [#9 데이터셋](../gfm-9-datasets-ko/) · [#10 남은 문제](../gfm-10-open-questions-ko/)

5장은 **일반화 범위**로 나눈 세 장 중 첫 번째다. universal, 그다음 task-specific, 그다음 domain-specific으로 간다. universal은 셋 중 범위가 가장 넓다. 모든 도메인, 모든 task를 모델 하나로 받겠다는 쪽이다.

## 여기서 universal이 뜻하는 것

universal GFM (graph foundation model)은 도메인을 넘고 — 분자, 소셜 네트워크, 거래 네트워크 — task를 넘어 — node classification, graph classification — 일반화하는 것을 목표로 한다. 논문이 드는 비유는 분명하다. 대형 언어 모델이 자연어 task를 통합했고 vision-language 모델이 비전 task를 통합했으니, GFM이 그래프 데이터 학습을 통합해야 한다는 것이다. 원칙을 한 줄로 적으면 **서로 다른 그래프 구조를 하나의 통합된 latent space에 넣는 것**이다. 도메인이 다른 그래프를 정렬하면서 task마다 고유한 부분은 남겨 둔다.

설계 난점이 셋이고, 각각에 저자들이 내놓는 답이 붙어 있다.

| 난점 | 왜 어려운지 | 제시된 답 |
| --- | --- | --- |
| **이질적인 그래프** | 도메인마다 크기·연결성·속성·밀도가 다르다 | 대규모 self-supervised pretraining으로 통합 latent representation 학습 |
| **task 충돌** | node classification은 국소 bias를, graph classification은 전역 bias를 원한다 | 공유 inductive bias와 multi-task learning |
| **positive transfer** | topology 패턴이 겹쳐도 도메인 변화가 전이를 막는다 | task를 고려한 목표 함수와 도메인 불변 전략 |

[3장](../gfm-3-challenges-ko/)의 세 가지 이질성을 엔지니어링 목표로 다시 적은 것이다. 구현 전략은 세 수준으로 제시된다. **model 수준** (task와 도메인을 넘어 일반화하는 아키텍처), **pretrain 수준** (서로 다른 그래프 분포를 정렬하는 목표 함수), **adaptation 수준** (downstream task용 파인튜닝)이다. [4장](../gfm-4-framework-ko/)의 세 칸과 같은 틀이다.

세 갈래는 backbone이 무엇인지로 갈린다.

## 그래프 모델 기반 universal GFM

**pretrain-then-adapt**를 따른다. 여러 도메인이 섞인 큰 말뭉치로 graph encoder를 pretraining하고, 본 적 없는 downstream task에 adaptation한다. 배워야 하는 패턴은 task (node·edge·graph), 도메인 (화학·소셜·금융), topology (희소 대 조밀)를 모두 넘어 일반화해야 한다.

### model 수준: 통합의 두 방식

- **explicit unification**은 task와 입력을 *공통 예측 형식* 으로 다시 쓴다. 하나의 기제가 모든 task를 받는다.
- **implicit unification**은 task 정의를 그대로 두고 아키텍처 설계와 inductive 불변성에 일반화를 맡긴다. 논문이 드는 예는 HoloGNN이다. holographic node representation에 expansion·reduction 연산을 걸어, 순열 대칭이 서로 다른 task들을 task를 고쳐 쓰지 않고 한 아키텍처로 덮는다.

explicit unification은 세 단위로 나온다.

| 단위 | 통합 형식 | 대표 | 단점 |
| --- | --- | --- | --- |
| **link 수준** | 그래프에 클래스 node를 더해 모든 task를 link prediction으로 | GPPT (KDD 2022) | 단순하고 범용적이지만 세밀한 구조를 놓친다 |
| **subgraph 수준** | 예측 대상마다 ego-graph (node 하나와 그 이웃)나 prompt 붙은 subgraph를 분류 | OFA | subgraph가 비교 가능하려면 공통 feature space가 필요하다 |
| **tree 수준** | virtual node를 task별 aggregator로, task-tree를 공통 단위로 | GIT | tree를 어떻게 짜느냐가 그 자체로 설계 선택이다 |

OFA가 가장 또렷한 예다. 모든 task가 "prompt가 붙은 subgraph 하나를 분류하는 문제"가 되고, 클래스별 support set에서 graph prompting으로 prototype 벡터를 만들고, 새 node는 가장 가까운 prototype에 배정된다. task head가 사라지고 task가 입력 쪽으로 옮겨 간다.

### pretrain 수준: 도메인 정렬

논문이 드는 예는 GIT(*Graph Generality Identifier on Task-Trees*)다. node·link·graph task에 공통되는 단위로 task-tree를 구성하고, 그 위에서 contrastive로 pretraining하고, 그 공간에서 도메인을 정렬한다. 통합을 예측 head가 아니라 pretraining 단위 수준에 두는 수가 핵심이다.

### adaptation 수준: downstream 적응

조정하는 양이 적은 순으로 네 가지다. 전체 파인튜닝 또는 linear probing, pretext 목적과 downstream 목적의 간극을 보조 task로 메우는 transfer learning, backbone은 그대로 두고 prompt 벡터만 조정하는 graph prompt learning, 그리고 아무것도 조정하지 않고 가장 가까운 클래스 prototype으로 예측하는 prototype learning.

## 언어 모델 기반 universal GFM

여기서는 LLM (large language model)이 모델 전부이고, 절차가 세 단계다.

1. **graph tokenization** — 모델이 읽을 수 있는 텍스트 시퀀스로 그래프를 펼친다
2. **그래프 데이터로 post-training** — pretraining된 언어 모델을 그래프 형태의 입력에 맞춘다
3. **downstream adaptation** — 해당 task에 맞춰 prompt를 주거나 파인튜닝한다

LangGFM이 이 입장을 끝까지 밀어붙인 쪽이다. 그래프 전용 모듈 없이 graph textualization 원칙만으로 언어 모델에 전적으로 의지하는 graph foundation model이고, 논문마다 자기 입맛대로 평가하는 것을 막기 위해 데이터셋 26개를 모은 벤치마크 GFMBench를 함께 냈다. QueryRAG는 대신 adaptation 단계를 건드린다. query node, 그래프 이웃에서 온 문맥, 그에 대응하는 label을 구조화된 prompt에 명시적으로 적어 넣어 in-context learning을 강화한다. [4장](../gfm-4-framework-ko/)의 non-i.i.d. 문제 — 그래프 표본은 독립이고 동일한 분포에서 나오지 않는다 — 때문에 이웃은 그냥 뽑는 게 아니라 골라야 하는데, QueryRAG는 그 고르는 일을 prompt 안에서 한다.

## graph-language co-training universal GFM

혼합 모델은 GNN (graph neural network)의 구조 추론과 언어 모델의 범용 추론을 합치고, 단계는 셋이다. graph encoding, cross-modality projection, 언어 기반 추론이다.

- **GOFA**는 *동결된* pretraining 언어 모델 안에 무작위 초기화된 GNN layer를 끼워 넣는다. 구조 모델링과 의미 모델링을 출력단에서 꿰매는 대신 한 스택 안에서 결합한다. graph 수준의 다음 단어 예측, 질의응답, 구조 task로 pretraining하고 본 적 없는 task에서의 zero-shot 결과를 보고한다.
- **GraphCLIP**은 그래프와 그 그래프의 텍스트 요약 사이를 self-supervised contrastive로 pretraining하고, 도메인을 넘는 zero-shot·few-shot 전이를 겨눈다. vision-language 모델의 [attention](../attention-ko/) 시대 레시피를 그래프 수준에 옮긴 것이고, 캡션이 하던 역할을 요약문이 한다.

## 아직 안 되는 것

세 갈래를 논문이 한 문장으로 요약한 것이 이것이다.

| 갈래 | 잘하는 것 | 못하는 것 |
| --- | --- | --- |
| 그래프 모델 기반 | 효율적이고 구조를 안다 | 의미 쪽이 얇다 |
| 언어 모델 기반 | 유연하고 언어로 끌고 간다 | 그래프 topology |
| co-training | 둘 다 노린다 | 시스템 복잡도가 상당하다 |

마지막 줄의 한계는 구체적으로 적혀 있다. 아키텍처가 복잡해 계산과 메모리 요구가 크고, graph embedding과 언어 모델 쪽 표현 사이의 alignment를 세심하게 맞춰야 하고, 두 modality의 supervision 신호를 합치는 문제는 아직 풀려 있지 않다.

<mark class="blue">세 갈래 중 둘은 그래프에 텍스트가 붙어 온다고 전제한다.</mark> node 서술문, 텍스트 요약, 자연어 템플릿 — tokenization도 post-training도 prompting도 읽을 것이 있어야 하고, 평가 데이터는 text-attributed graph다. 서술문을 지어내지 않고는 node를 말로 적을 수 없는 그래프라면 5장의 3분의 2는 적용되지 않는다.

한편 explicit unification은 task 이질성을 풀고 feature 이질성은 있던 자리에 둔다. 모든 task를 link prediction이나 subgraph classification으로 바꾸면 출력 형식이 하나가 되지만 입력 공간이 하나가 되지는 않는다. 입력 공간을 실제로 건드리는 방법들은 텍스트를 통해 그렇게 하고, 그러면 첫 번째 지적으로 돌아온다.

## 내가 물을 것

universal은 논문에서 가장 넓은 주장이면서 설계 원칙과 보고된 결과 사이의 간격도 가장 넓다. 분류 체계가 인정하는 것보다 텍스트 채널이 더 많은 일을 하고 있기 때문이라고 본다. GraphCLIP의 착상 — 같은 대상에 대한 그래프와 또 하나의 서술을 contrastive로 정렬하는 것 — 은 내가 쓰는 dual-view pretraining과 구조가 같은데, 내 쪽은 그래프와 요약문이 아니라 양쪽이 다 그래프라서 여기서 zero-shot 결과를 싣고 있는 그 채널이 내 경우엔 새 정보를 싣지 않는다.

## 정리

- universal GFM은 **서로 다른 그래프 구조를 하나의 latent space에 넣는 것**을 목표로 한다. 도메인을 정렬하면서 task별 세부는 남긴다
- 설계 난점 셋 — 이질적인 그래프, task 충돌, positive transfer — 을 model·pretrain·adaptation 세 수준에서 다루고, 4장의 세 칸과 같은 틀이다
- 그래프 모델 기반: **explicit** 통합은 task를 공통 형식으로 다시 쓰고, **implicit** 통합은 아무것도 고쳐 쓰지 않고 아키텍처에 맡긴다
- explicit 통합의 세 단위: link 수준 (GPPT, 클래스 node를 더해 link 예측), subgraph 수준 (OFA, prompt 붙은 subgraph 분류 후 최근접 prototype), tree 수준 (GIT, task-tree를 공통 pretraining 단위로)
- 언어 모델 기반: 그래프를 텍스트 시퀀스로 펼치고, post-training하고, adaptation한다 — LangGFM은 언어 모델만 쓰고, QueryRAG는 이웃과 label을 prompt에 적어 넣는다
- co-training: GOFA는 동결된 언어 모델 안에 GNN layer를 끼워 넣고, GraphCLIP은 그래프와 그 텍스트 요약을 contrastive로 정렬한다
- 그래프 backbone은 구조를 알지만 의미가 얇고, 언어 backbone은 유연하지만 topology에 약하고, 혼합은 둘 다 되지만 복잡하다. 그리고 세 갈래 중 둘은 그래프에 텍스트가 붙어 와야 한다

## 참고

- Wang et al., [Graph Foundation Models: A Comprehensive Survey](https://arxiv.org/abs/2505.15116), *arXiv* (2025) — 여기서 리뷰한 논문
- Liu et al., [One for All: Towards Training One Graph Model for All Classification Tasks](https://arxiv.org/abs/2310.00149), *ICLR* (2024) — prompt 붙은 subgraph와 클래스 prototype을 쓰는 subgraph 수준 explicit 통합
- Wang et al., [Towards Graph Foundation Models: Learning Generalities Across Graphs via Task-Trees](https://arxiv.org/abs/2412.16441), *ICML* (2025) — GIT, 도메인 정렬의 단위로서의 task-tree
- Lin et al., [LangGFM: A Large Language Model Alone Can be a Powerful Graph Foundation Model](https://arxiv.org/abs/2410.14961), *arXiv* (2024) — 언어 모델만 쓰는 입장과 데이터셋 26개로 구성한 GFMBench
- Kong et al., [GOFA: A Generative One-For-All Model for Joint Graph Language Modeling](https://arxiv.org/abs/2407.09709), *arXiv* (2024) — 동결된 언어 모델 안에 끼워 넣은 GNN layer
