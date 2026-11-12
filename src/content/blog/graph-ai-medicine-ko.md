---
title: "의료에서의 Graph AI: 그래프가 임상에서 주는 것"
date: 2024-02-14
description: "임상 데이터가 격자를 거부하고 그래프에 맞는 이유 · 모델 계열과 각각이 맞는 데이터 모양 · 생물학을 귀납 편향으로 넣는 법 · 모달리티를 합칠 세 지점 · 그리고 아직 풀리지 않은 문제들"
category: review
updated: 2024-03
lang: ko
topic: Graphs
venue: Annual Review of Biomedical Data Science
venueYear: 2024
group: graph-ai-medicine
tags: [review, graph neural networks, knowledge graph, multimodal, clinical]
---

> Johnson, Ruth, et al. "Graph Artificial Intelligence in Medicine." *Annual Review of Biomedical Data Science*, vol. 7, no. 1, 2024, pp. 345–368, [doi.org/10.1146/annurev-biodatasci-110723-024625](https://doi.org/10.1146/annurev-biodatasci-110723-024625).
> [PMC11344018](https://pmc.ncbi.nlm.nih.gov/articles/PMC11344018/)

이 survey는 구조를 고르기 한 단계 앞에서 시작한다. 임상 데이터를 *왜* 그래프로 두는가에 대한 논거다.

## 임상 데이터가 격자를 거부하는 이유

전자건강기록은 구조화된 필드, 반구조화된 기록, 구조화되지 않은 자유 텍스트가 섞인 것이고, 결측률 자체가 정보를 담고 있다. 이미지·텍스트·동영상·검사 수치가 서로 다른 시간 축과 서로 다른 세분성 (granularity)으로 들어온다.

격자는 모든 표본이 같은 모양이라고 가정한다. 임상 데이터는 그렇지 않고, 억지로 맞추는 과정에서 정보 대부분이 사라진다. 그래프는 그런 가정을 하지 않는다. node도 edge도 종류가 여럿일 수 있고, 방문 세 번인 환자와 마흔 번인 환자를 padding 없이 둘 다 표현한다.

두 번째 논거는 지식에 관한 것이다. 생의학의 관계는 **이미 알려져 있다.** 유전자는 pathway 안에 있고, 약은 표적에 작용하고, 질병에는 계층이 있다. 격자는 그걸 적을 수 없다. <mark class="blue">그래프는 사전 지식을 적어 넣을 수 있는 구조다.</mark>

## 모델 계열

데이터를 그래프로 두기로 했으면 다음 질문은 어느 그래프 모델을 올릴 것인가다. 논문은 그 답을 모델의 최신성이 아니라 데이터 모양에서 찾는다.

<figure>
<img src="/assets/fig/graphai-f1.jpg" alt="Message passing, graph transformers, temporal graphs, hypergraphs and subgraph GNNs" width="1050" height="558">
<figcaption><b>Figure 1.</b> 그래프 신경망의 변형들과 각각이 맞는 데이터 모양. <b>(a)</b> message passing, <b>(b)</b> graph transformer, <b>(c)</b> 시간 그래프, <b>(d, e)</b> hypergraph와 subgraph 모델.
<br><span class="credit">Johnson et al., <a href="https://doi.org/10.1146/annurev-biodatasci-110723-024625"><i>Annu. Rev. Biomed. Data Sci.</i> <b>7</b>, 345&ndash;368 (2024)</a> &#183; 논문 그림, Figure 1</span></figcaption>
</figure>

| 계열 | 무엇을 더하나 | 맞는 임상 데이터 모양 |
| --- | --- | --- |
| MPNN (message passing neural network) | 이웃을 층층이 모은다 | 기본 graph neural network (GNN) — [GNN](../gnn-ko/) 참고 |
| GAT (graph attention network) | [attention](../attention-ko/)이 어느 edge로 정보를 보낼지 정한다 | edge마다 중요도가 다를 때 |
| Graph transformer | message passing 없이 전역 attention | 표현력이 크다. 대신 구조를 따로 넣어 줘야 한다 |
| Temporal GNN | 시간 단계마다 node·edge 표현 | 환자의 경과 — 응급실 방문 기록 |
| Hypergraph | edge 하나가 node *n*개를 동시에 잇는다 | 약·용량·진단을 한 번에 묶는 처방 |
| Subgraph GNN | node가 아니라 영역을 학습 | 환자 주변 영역을 보고 하는 질병 분류 |

hypergraph 줄은 두 번 읽어 둘 만하다. 보통의 edge는 쌍인데, 임상 구조의 상당 부분은 쌍이 아니다. 한 번의 방문에 환자·의료진·진단·처방이 동시에 얽히는데, 이걸 쌍들로 쪼개면 "함께 일어났다"는 사실이 사라진다.

**얕은 (shallow) embedding과 깊은 (deep) embedding**의 구분도 짚는다. 얕은 쪽은 고정된 거리 개념에 맞춰 lookup table을 최적화하므로 학습 때 보지 못한 node는 embedding을 받지 못한다. GNN은 특징과 이웃에서 embedding을 계산하므로 내일 입원한 환자에게도 embedding이 나온다.

## 생물학을 구조 안에 넣기

그래프가 사전 지식을 담을 수 *있다* 는 것과 실제로 담았다는 것은 다르다. 논문은 담는 경로를 셋으로 나누고, 그렇게 해서 얻는 것은 내부가 생물학자가 이름을 댈 수 있는 것들을 가리키는 모델이다.

<figure>
<img src="/assets/fig/graphai-f2.jpg" alt="Biologically informed architectures, patient graphs on knowledge graphs, and fine-tuning pretrained models" width="965" height="1050">
<figcaption><b>Figure 2.</b> 사전 지식이 들어오는 세 경로. 층 자체가 생물학인 구조 (P-NET, BINN), 생의학 지식 그래프에 환자 데이터를 붙이는 방식, 그리고 큰 사전학습 모델을 임상 과제로 fine-tuning하는 방식.
<br><span class="credit">Johnson et al., <a href="https://doi.org/10.1146/annurev-biodatasci-110723-024625"><i>Annu. Rev. Biomed. Data Sci.</i> <b>7</b>, 345&ndash;368 (2024)</a> &#183; 논문 그림, Figure 2</span></figcaption>
</figure>

**P-NET**과 **BINN**에서는 은닉층이 임의의 것이 아니다. 입력층이 단백질, 은닉층이 pathway 그 자체, 출력층이 생물학적 과정이다. 그러면 가중치를 읽을 수 있다. pathway node에 큰 가중치가 걸렸다는 것은 그 pathway에 대한 진술이지 412번 뉴런에 대한 진술이 아니다.

두 번째 경로는 기존 지식 그래프에 환자를 붙이는 것이고, 논문은 이걸 세 가지로 나눈다.

1. **기본 그래프를 수정** — 환자마다 node를 추가하고 연결한다.
2. **환자 서브그래프를 추출** — 기본 그래프에서 해당 영역을 떼어낸다.
3. **환자별 개인화 그래프** — 기본 그래프와 독립적으로 처리한다.

무엇이 공유되느냐가 다르다. (1)에서는 환자들이 서로의 표현에 영향을 주고, (3)에서는 줄 수 없다. 어느 쪽을 원하는지는 "비슷한 환자가 서로에게 정보를 줘야 하는가"를 어떻게 보느냐에 달려 있고, 프라이버시 제약이 무엇을 허용하는가에도 달려 있다.

## 모달리티를 어디서 합칠 것인가

환자는 이미지·기록·검사 수치로 한꺼번에 들어오니 모달리티를 어디선가는 합쳐야 하고, 어디서 합치느냐가 모델이 무엇을 배울 수 있고 무엇이 없어도 버티는지를 결정한다. 논문은 세 선택지에 각각 이름을 붙인다.

| | 어디서 | 대가 |
| --- | --- | --- |
| Early | 모델 이전에 입력을 합친다 | 도메인 지식으로 합치는 방식을 설계할 수 있다. 대신 모달리티 간 상호작용은 학습되지 않는다 |
| Intermediate | 모달리티별 인코더를 모델 안에서 합친다 | 상호작용이 학습된다. 대신 모든 모달리티가 있어야 한다 |
| Late | 따로 학습하고 출력을 합친다 | 모달리티가 빠져도 견딘다. 대신 모달리티끼리 만나지 않는다 |

<mark>선택은 보통 무엇이 가장 잘 될지가 아니라 데이터가 무엇을 허용하는지로 정해진다.</mark> 임상에서 late fusion이 기본값이 되는 이유는 그게 더 나은 모델이어서가 아니라 환자마다 빠진 모달리티가 있기 때문이다.

## 설명 가능성: survey가 갈라놓은 두 가지 설명

아무도 근거를 댈 수 없는 임상 예측은 실제로 쓰이지 않으니, 설명은 덧붙이는 게 아니라 결과물의 일부다. 이 survey의 기여는 그 한 단어가 서로 다른 두 일을 가리킨다고 짚은 것이다.

<figure>
<img src="/assets/fig/graphai-f4.jpg" alt="Mathematical versus user-centred explainability and the stakeholders each serves" width="1050" height="459">
<figcaption><b>Figure 4.</b> 둘 다 "설명"이라 불리지만 서로 다른 것. 모델이 무엇을 했는지에 대한 <b>수학적</b> 설명과, 그 결과로 행동해야 하는 사람을 향한 <b>사용자 중심</b> 설명. 이해관계자가 다르고, 무엇이 좋은 답인지도 다르다.
<br><span class="credit">Johnson et al., <a href="https://doi.org/10.1146/annurev-biodatasci-110723-024625"><i>Annu. Rev. Biomed. Data Sci.</i> <b>7</b>, 345&ndash;368 (2024)</a> &#183; 논문 그림, Figure 4</span></figcaption>
</figure>

어떤 귀속 점수를 최대화하는 subgraph는 수학적 질문에 답한 것이다. 임상의가 그것으로 행동할 수 있는가는 다른 질문이고 성공 기준도 다르다. 이 survey는 설명을 한 가지로 뭉뚱그리지 않고 둘을 따로 적는다.

## 풀지 못한 문제들

논문이 끝에 꼽는 미해결 문제는 다섯 개이고, 다섯 개 다 아직 열려 있다.

- **multimodal 통합** — 그래프가 아무거나 담을 수 있다는 것과 잘 표현한다는 것은 다르다.
- **불규칙한 수집과 결측** — 임상 데이터의 결측은 무작위가 아니고, 결측 패턴 자체가 신호인데 모델은 대개 무시한다.
- **모달리티 붕괴** — 가장 예측력 있는 모달리티 하나에 기대고 나머지를 무시하는 것. 지표상으로는 성공처럼 보인다.
- **규모** — 생의학 그래프는 크고 고차원이다.
- **신뢰** — 충실하지 않은 설명은 없는 것보다 나쁘다는 것이 논문의 입장이다. 그걸 근거로 행동하기 때문이다.

## 내가 읽은 이유

수학적 설명과 사용자 중심 설명을 갈라놓은 대목이 계속 돌아오게 되는 부분이고, 이 구분은 분자 쪽에 그대로 옮겨진다. "이 원자들의 attention이 가장 높았다"는 수학적 설명이고, "이 부분구조 때문에 독성이다"는 화학자에게 필요한 주장인데, 그 사이의 간격이 바로 [attention 가중치가 혼자서는 건너지 못하는](../attention-ko/) 지점이다. 그리고 이 논문은 내 두 갈래를 두 분야가 아니라 하나의 주제로 보이게 해 준다. 분자는 원자의 그래프이고 환자는 지식 그래프 위 사건들의 그래프인데, 작동 기제 — message passing, edge에 거는 attention, 이종 node, 어디서 합칠 것인가 — 는 같은 기제다. [지식 그래프 기반 재창출](../repurposing-ko/) 작업과 분자 작업은 보이는 것보다 더 많이 겹친다.

survey라서 확인할 결과는 없다. 대신 어휘가 있고, 어휘가 정리되어 있으면 지금 막힌 문제가 다른 곳에서는 이름이 붙어 있다는 걸 알아챌 수 있다.

## 정리

- 임상 데이터는 표본마다 모양이 달라 격자를 거부한다. 그래프는 그 가정을 하지 않고, 사전 지식을 적어 넣을 수 있다
- 모델 계열이 데이터 모양에 대응한다. MPNN · GAT · graph transformer · 시간 · hypergraph · subgraph
- **hypergraph**가 존재하는 이유는 임상 구조의 상당 부분이 쌍이 아니라 *n*항이기 때문이다
- 얕은 embedding은 내일 입원한 환자를 다루지 못하고, GNN은 다룬다
- 생물학은 구조 (P-NET, BINN)로 들어오거나, 환자를 지식 그래프에 붙이는 세 방식으로 들어온다. 셋은 환자끼리 무엇을 공유하는가가 다르다
- 융합은 early / intermediate / late이고, 선택은 보통 결측 때문에 강제된다
- **수학적 설명과 사용자 중심 설명은 다른 것**이고, 둘을 뭉뚱그리는 것이 충실하지 않은 설명을 근거로 행동하게 되는 경로다

## 참고

- Johnson, Li, Noori, Queen & Zitnik, [Graph artificial intelligence in medicine](https://doi.org/10.1146/annurev-biodatasci-110723-024625), *Annu. Rev. Biomed. Data Sci.* **7** (2024) — 여기서 리뷰한 논문
- Elmarakeby et al., [Biologically informed deep neural network for prostate cancer discovery](https://doi.org/10.1038/s41586-021-03922-4), *Nature* (2021) — P-NET
- Chandak, Huang & Zitnik, [Building a knowledge graph to enable precision medicine](https://doi.org/10.1038/s41597-023-01960-3), *Sci. Data* (2023) — PrimeKG
