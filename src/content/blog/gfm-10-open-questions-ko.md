---
title: "GFM #10 — 아직 풀리지 않은 문제들"
date: 2025-08-11
description: "정확히 지목된 scalability: backbone, 복원 단위의 수준, 학습 단위 · graph는 긁어모을 수 없다 · graph에는 GLUE가 없다 · 아무도 지목하지 못하는 응용 · 가장 날카로운 장벽인 pattern conflict · 그리고 결과가 아니라 계획으로 읽는 11장"
category: review
updated: 2025-09
lang: ko
topic: Graphs
venue: arXiv
venueYear: 2025
group: gfm-10-open-questions
tags: [review, graph foundation models, evaluation, scaling, pattern conflict]
---

> Wang, Zehong, et al. "Graph Foundation Models: A Comprehensive Survey." *arXiv*, 21 May 2025, [arxiv.org/abs/2505.15116](https://arxiv.org/abs/2505.15116). Preprint.
> [논문 목록](https://github.com/Zehong-Wang/Awesome-Foundation-Models-on-Graphs)

**시리즈** · [#1 서론](../gfm-1-introduction-ko/) · [#2 기초](../gfm-2-background-ko/) · [#3 난점](../gfm-3-challenges-ko/) · [#4 프레임워크](../gfm-4-framework-ko/) · [#5 universal](../gfm-5-universal-ko/) · [#6 과제별](../gfm-6-task-specific-ko/) · [#7 도메인별](../gfm-7-domain-specific-ko/) · [#8 이론](../gfm-8-theory-ko/) · [#9 데이터셋](../gfm-9-datasets-ko/) · #10 남은 문제

10장의 제목은 다섯 개다. scalability, 데이터 부족, 평가, 활용, 이론이다. 초록에 나오는 "구조 정렬"과 "heterogeneity"는 여기 제목에 없다. heterogeneity는 [3장](../gfm-3-challenges-ko/)이고, 구조 정렬은 모든 방법 표의 한 칸과 pattern conflict라는 이론 소절로 나타난다.

## 정확히 지목된 scalability

10.1절은 연산을 더 달라고 하는 대신 요구 조건 셋을 지목한다.

**backbone.** GNN (graph neural network)에는 over-smoothing, over-squashing, 약한 장거리 의존성 모델링, 제한된 substructure 표현력이 따라온다. 이 장은 그것들이 모델 확장과 효율적인 multi-GPU 학습을 둘 다 가로막는다고 쓴다. 뻔한 대안인 graph transformer는 기본형이 graph를 node 서열로 쪼개 넣는데 비용이 서열 길이의 이차라서 작은 graph에 묶인다. 제안된 길은 서열 단위를 node 대신 substructure로 쓰는 것이고, 인코딩 비용을 줄인다. 이 논문에서 무엇이든 규모를 키워야 할 때마다 되돌아오는 바로 그 생각이다.

**pretraining 목적함수.** NLP (natural language processing)와 비전은 generative pretraining으로 규모를 키웠다. graph self-supervision은 대체로 contrastive이고, graph 복원 목적함수가 있는 경우엔 node와 edge 같은 낮은 수준의 의미를 겨눈다. 반면 언어 모델은 단어 단위를, 비전 모델은 image patch를 복원하는데 둘 다 더 높은 수준의 의미를 보존한다. 이 장의 결론은 그래서 기존 generative graph 방법이 contrastive를 못 이기고 있고, 고칠 길은 높은 수준의 의미 구조를 복원하는 것이라는 것이다.

**학습 단위.** 무엇을 키워야 하는지가 정해져 있지 않다. 문장은 단어 단위로, 그림은 patch로 이루어지지만 graph는 node로도 edge로도 graph 전체로도 키울 수 있고 과제 수준마다 다른 선택을 가리킨다. 통합 단위 후보로 subgraph와 tree가 제시되고, 그것들을 키우는 게 과제를 넘는 지식을 사 주기는 하는지가 열린 질문으로 남는다.

셋은 서로 일관되고 [8장](../gfm-8-theory-ko/)과도 일관된다. backbone도 목적함수도 단위도 모두 없는 vocabulary 하나로 되돌아온다.

## 데이터 부족

글과 그림은 긁어모을 수 있고 graph는 일반적으로 안 된다. edge가 누군가 주장해야 하는 관계를 담고 있기 때문이다. 방향이 셋 제시된다.

| 방향 | 제안 내용 | 명시된 한계 |
| --- | --- | --- |
| 자동 수집 | LLM (large language model)으로 학술·생의학·knowledge graph 출처에서 구조화된 관계를 뽑아내는 pipeline | graph 구성은 보통 사람 손을 필요로 한다 |
| 합성 생성 | 구조 다양성을 늘리는 graph diffusion, text-attributed graph의 글 속성을 만드는 언어 모델 | 구조와 의미의 온전함을 보존하는 문제가 미해결 |
| 양보다 질 | 질 좋은 소량이 질 낮은 대량과 맞먹는다는 LLM pretraining 쪽 발견 | graph 데이터셋은 보통 불완전하고 품질 지표가 없다 |

마지막 한계는 순환이다. data valuation 기법은 있지만, graph 데이터의 품질이 그걸로 고르려던 backbone과 pretraining 전략에 의존한다.

## 평가: graph에는 GLUE가 없다

10.3절은 기존 벤치마크의 문제를 셋 든다. 판을 바꿀 만한 실제 응용이 없고, 실제 사용 방식을 제대로 반영하지 않는 방식으로 만들어졌고, graph 공동체의 벤치마킹 문화가 일관성과 재현성 문제로 비판받아 왔다. [9장](../gfm-9-datasets-ko/)은 데이터셋을 도메인과 과제별로 모아 놓지만 프로토콜은 정하지 않는다. 고정 split도, 고정 적응 예산도, 과제별 고정 지표도 없다.

결과는 겉모양 문제가 아니라 구조적인 문제다. universal GFM (graph foundation model)과 과제별 graph 수준 GFM과 도메인별 분자 GFM이 전부 부분적으로 겹치는 데이터셋에, 서로 다른 split과 서로 다른 적응 시 label 개수와 서로 다른 지표로 보고할 수 있다. <mark>이 리뷰에 실린 논문 간 숫자는 비교 가능하지 않고, 아무리 조심해 읽어도 그건 고쳐지지 않는다.</mark> GLUE (General Language Understanding Evaluation)를 가진 분야가 그걸 가진 이유는 누군가 split과 지표를 고정하고 제출을 받았기 때문이다.

방법 여섯 개 — GROVER, Mole-BERT, GraphsGPT, GIMLET, GALLON, UniMoT — 가 과제별 graph 수준 표와 도메인별 분자 표에 동시에 올라 있고, 두 표를 가르는 축은 각 논문이 자기 기여를 어떻게 규정했는지다.

10.3절은 정확도를 넘어선 평가도 요구한다. 도메인 간 일반화, 적대적·잡음 데이터에 대한 robustness, 위험이 큰 쓰임에서의 신뢰성, 해석 가능성, 윤리다. 논문 어디에서도 측정되지 않고, 전부 앞으로 만들 벤치마크의 요구 조건으로 적혀 있다.

## 활용, 그리고 아무도 지목하지 못하는 응용

10.4절은 세 가지를 다룬다고 예고하고 소제목을 네 개 둔다. 네 번째가 human-in-the-loop다.

**adaptation**은 아직 공짜가 아니다. graph prompt learning은 있지만 prompt 벡터를 downstream 과제에 맞춰 파인튜닝해야 하므로 "갱신 없음"이라는 약속은 지켜지지 않는다. 내놓는 방향은 비전 모델 비유다. 대형 비전 모델이 언어 인터페이스 없이 여러 과제를 autoregressive하게 처리하는 방식을 graph로 확장하는 것이다.

**응용**에 이 논문에서 가장 자기비판적인 문장이 있다. GFM은 소셜 네트워크 분석, 약물 성질 예측, 추천에서 성과를 보였고 — 그 과제들은 "전통적인 graph 학습 모델로도 충분히 효과적으로 다룰 수 있어 GFM의 필요성을 줄인다". 정말로 GFM이 필요할 응용 후보로 내놓는 것은 칩 설계, 조합 최적화, 관계형 데이터베이스다. 어느 것도 시연되지 않았다. 93쪽 뒤에 killer application은 할 일 목록 항목이다.

**멀티모달 지식**은 계획이 아니라 질문으로 제시된다. 분자는 graph이기도 하고 서열이기도 하고 글 서술이기도 하고 때로는 그림이기도 한데, 모든 modality를 한 모델이 받아야 하는지 modality별 모델을 따로 두어야 하는지가 정해지지 않았다.

**human-in-the-loop**은 전문가 피드백이 반복적으로 필요한 자리로 신약 탐색, 추천, 과학 워크플로를 든다. 해석 가능성과 통제를 위한 것이다.

## 이론: pattern conflict가 가장 날카로운 장벽이다

10.5절에는 항목이 넷 있다.

전이성은 8장에서 한 말을 다시 적는다. graph는 복잡하고 종종 사람이 정의한 관계를 담고 있어서 옮겨지는 지식이 글이나 그림만큼 직관적이지 않고, graph를 tree의 조합으로만 보면 구조 정보를 잃는다.

<mark class="blue">pattern conflict가 이 논문에서 가장 날카로운 단일 장벽이다. 같은 구조 패턴이 도메인에 따라 다른 의미를 갖기 때문에, 그 둘에 함께 사전학습하면 한쪽에서 틀린 표현을 배운다.</mark> 예로 드는 것이 삼각형이다. 소셜 네트워크에서는 안정을 뜻한다. 내 친구의 친구는 내 친구다. 분자 graph에서는 화학적 제약 아래 불안정을 뜻할 수 있다. 해법에 대해 이 장은 직설적이다. 기존 방법들은 그것을 "다루지 못하거나 부분적으로만 완화한다".

robustness와 신뢰성 항목은 실제 graph의 모습을 열거한다. long-tail 분포, 불완전함, 클래스 불균형, 적은 label, 구조 변형이다. 그리고 구조 분포 이동 아래서의 안정성 분석을 요구한다. 일반화 항목은 subtree 기반 학습 단위에 대해 상한이 세워졌고 tree 구조를 넘어서는 분석이 필요하다고 적는다.

구조 정렬 칸이 이 항목 옆에 놓인다. 이 칸의 값은 무엇을 달성했는지가 아니라 어디에 손을 댔는지를 적는다. 데이터 쪽 augmentation이나 합성, pretraining 손실이나 보조 손실, codebook·prompt 벡터 같은 구조적 장치, 아니면 N/A다. node·link·graph·분자·knowledge graph·시간 graph 표가 전부 같은 어휘를 돌려 쓴다.

## 11장: 결론은 계획서다

결론은 분명하게 앞을 보는 글이다. GFM은 "자연어 처리와 컴퓨터 비전에서 foundation model이 이룬 성공을 재현하고자 한다"고 서술되고, 꼽는 미해결 과제는 거대 graph로의 확장, 멀티모달 결합, 원칙 있는 평가 프로토콜, 이론적 토대다. 마지막 문단은 이 분야가 확장 가능하고 해석 가능하고 적응력 있는 구조, 더 큰 pretraining 말뭉치, 더 나은 이론에 "집중해야 한다"고 쓰고, GFM이 "막대한 전망을 품고 있다"고 쓴다. 끝까지 앞을 보는 동사이고, 논문은 도착했다고 주장하지 않는다.

## 내가 물을 것

다섯 중 맨 앞에 놓을 것은 평가다. split과 지표가 고정되지 않으면 나머지 네 주장은 반증할 길이 없다. 손에 쥘 만한 한 줄은 10.1절에 있다. generative pretraining이 밀리는 이유가 높은 수준의 의미 단위가 아니라 node와 edge를 복원하기 때문이라면, 그건 원자 대신 substructure — 고리, scaffold, [junction tree](../jtvae-ko/) node — 를 masking하라는 논증이다.

## 정리

| 초록의 주장 | 10장과 11장이 실제로 보여 주는 것 |
| --- | --- |
| 전이성에 이론적 토대가 있다 | 후보 vocabulary 셋, 각각 결격 사유 하나씩. pattern conflict는 미해결 |
| scaling과 emergence | 논문 자신의 표현으로 그 흐름은 "기존 GFM에서 아직 나타나지 않았다" |
| 평가가 과제다 | 프로토콜이 없으므로 논문 간 숫자를 비교할 수 없다 |
| scalability가 과제다 | 정확히 지목된다. backbone, 복원 단위의 수준, 학습 단위 선택 |
| GFM에 실제 응용이 있다 | 기존 성과는 "보통의 graph 모델로도 충분히 다룰 수 있다" |

- scalability에는 지목된 요구 조건이 셋 있고, 셋 모두 없는 공유 vocabulary로 수렴한다
- graph는 긁어모을 수 없고, graph 데이터의 품질 지표도 없으며, 품질이 그걸로 고르려던 모델에 의존한다
- 공통 벤치마크 프로토콜의 부재는 이 리뷰의 빈틈이 아니라 이 분야의 빈틈이고, 리뷰는 그걸 충실히 보고한다
- pattern conflict는 논문이 가장 직설적으로 다루는 장벽이고, 방법들은 거의 손대지 못했다
- 11장은 계획서이고, 동사가 그걸 말해 준다

## 참고

- Wang et al., [Graph Foundation Models: A Comprehensive Survey](https://arxiv.org/abs/2505.15116), *arXiv* (2025) — 여기서 리뷰한 논문. 10장과 11장이 이 편이다
- Ma et al., [Do Neural Scaling Laws Exist on Graph Self-Supervised Learning?](https://arxiv.org/abs/2408.11243), *arXiv* (2024) — scalability 절이 graph self-supervised learning을 의심하는 근거
- Wang et al., [Towards Graph Foundation Models: Learning Generalities Across Graphs via Task-Trees](https://arxiv.org/abs/2412.16441), *ICML* (2025) — 이 장이 제안하는 통합 학습 단위로서의 task-tree
- Sun et al., [All in One: Multi-task Prompting for Graph Neural Networks](https://arxiv.org/abs/2307.01504), *KDD* (2023) — prompt 벡터를 여전히 파인튜닝해야 하는 graph prompt learning
- Galkin et al., [Towards Foundation Models for Knowledge Graph Reasoning](https://arxiv.org/abs/2310.04562), *ICLR* (2024) — zero-shot 약속이 지켜진 유일한 도메인, 그리고 그 이유
