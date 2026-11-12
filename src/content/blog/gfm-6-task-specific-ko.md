---
title: "GFM #6 — 과제별 모델: node·link·graph 수준"
date: 2025-08-11
description: "과제 하나를 여러 도메인에서 · link 수준 GFM을 가능하게 한 relation vocabulary · graph 수준 표가 사실상 분자인 이유 · QA·이상 탐지·추천"
category: review
updated: 2025-09
lang: ko
group: gfm-6-task-specific
topic: Graphs
venue: arXiv
venueYear: 2025
tags: [review, graph foundation models, link prediction, pretraining]
---

> Wang, Zehong, et al. "Graph Foundation Models: A Comprehensive Survey." *arXiv*, 21 May 2025, [arxiv.org/abs/2505.15116](https://arxiv.org/abs/2505.15116). Preprint.
> [자료 목록](https://github.com/Zehong-Wang/Awesome-Foundation-Models-on-Graphs)

**시리즈** · [#1 서론](../gfm-1-introduction-ko/) · [#2 기초](../gfm-2-background-ko/) · [#3 난점](../gfm-3-challenges-ko/) · [#4 프레임워크](../gfm-4-framework-ko/) · [#5 universal](../gfm-5-universal-ko/) · #6 과제별 · [#7 도메인별](../gfm-7-domain-specific-ko/) · [#8 이론](../gfm-8-theory-ko/) · [#9 데이터셋](../gfm-9-datasets-ko/) · [#10 남은 문제](../gfm-10-open-questions-ko/)

universal GFM (graph foundation model)은 도메인과 과제를 한꺼번에 넘으려 한다. 과제별 GFM은 둘 중 하나를 포기한다. 도메인은 여전히 넘지만 푸는 과제는 딱 하나다. 대신 과제가 가진 inductive bias를 평균으로 뭉개지 않고 그대로 들고 갈 수 있다.

6장은 node·link·graph 수준에서 끝나지 않고 **여섯 가지** 과제를 다룬다. question answering (질의응답), 이상 탐지, 추천이 더 붙는다. 추천은 도메인이 아니라 과제로 분류되어 있어서 도메인별 장에는 아예 나오지 않는다.

## 설계 원칙

6.1절은 설계가 지켜야 할 제약으로 요구 조건 세 개를 든다.

- **과제별 inductive bias.** node 분류는 homophily·heterophily (이웃한 node가 같은 label을 가지는 경향이 있는지 없는지)에, link 예측은 국소·전역 연결 패턴에, graph 분류는 substructure 인식에 기댄다. 구조가 달라도 이 bias는 도메인을 건너 살아남는다는 주장이다.
- **도메인 간 정렬.** node 타입, feature 분포, 연결 패턴이 도메인마다 다르므로 재학습 없이도 표현이 안정적이어야 한다.
- **일반화와 적응의 절충.** 도메인 불변성을 너무 밀면 신호를 싣고 있는 도메인 고유 패턴을 잃고, 적응을 너무 밀면 한 도메인에 과적합된다. 논문은 조절 수단으로 domain regularization, normalization, adversarial training을 든다.

<mark>세 번째 조건이 이 장의 모든 방법이 실제로 절충하고 있는 지점이고, 어느 것도 해결하지는 못했다.</mark>

## node 수준

node 수준 연구는 어떤 heterogeneity를 공격하는지에 따라 깔끔하게 갈린다.

**feature 공간.** 기본 방식은 각 데이터셋의 feature를 공유 latent 공간으로 보내는 MLP (multilayer perceptron)인데, feature가 빠져 있거나 feature 집합 자체가 바뀌면 바로 무너진다. GCNmf는 빠진 feature를 Gaussian mixture로 모델링하고 GNN (graph neural network) 첫 층의 기대 활성값을 계산한다. PCFI는 feature가 아는 값을 가진 가장 가까운 node까지의 channel별 최단거리를 써서 결손율이 높은 상황까지 끌고 간다. GRAFENNE는 bipartite 인코딩으로 node와 그 속성을 떼어내 파라미터 수가 feature 차원과 무관하게 만든다. GraphAny는 가장 멀리 간다. graph kernel 사이의 상호작용에서 완전 inductive feature를 계산하므로, 작은 데이터셋 하나로 학습한 모델을 구조도 feature도 label 공간도 새로운 graph에 그대로 돌릴 수 있다. FUG는 대신 contrastive 제약 아래 PCA (principal component analysis)식 기저 변환을 그대로 재현하는 encoder를 학습해서, 다른 공간의 feature를 다시 embedding하지 않고 적응시킨다.

**구조.** GPT-GNN은 generative pretraining을 node 속성 생성과 edge 생성으로 분해한다. GPPT는 입력 node를 쌍으로 바꿔 고정된 pretraining GNN에 넣는 prompt 기제를 붙인다. SimMLP는 맥락을 보는 GNN과 이웃을 보지 않는 MLP의 표현을 정렬해 구조 정보를 MLP 안으로 넣는다. 추론 지연이 중요한 상황에 쓸 만하다.

**도메인 간 정렬.** GCOPE는 여러 데이터셋에 모델 하나를 학습시킨다("all in one and one for all"). GraphControl은 ControlNet 방식으로 target graph 자체의 특성을 조건 입력으로 쓴다. GraphLoRA는 structure-aware maximum mean discrepancy (MMD)로 source와 target의 feature 분포를 맞추고, fine-tuning 단계에 작은 GNN을 하나 더 넣어 catastrophic forgetting 없이 구조 차이를 메운다. MDGFM은 정렬 전에 graph structure learning으로 각 source 도메인을 다듬는다.

**LLM을 끼우는 쪽.** LLM (large language model)을 예측기가 아니라 labeler나 feature 공급원으로 쓰는 계열이 따로 있다. LLM-GNN은 일부 node만 annotation하고 나머지는 GNN으로 예측하며, LOGIN은 확신이 낮은 node에만 LLM에 물어보고, Cella는 label 불일치도와 entropy로 대표 node를 골라낸다. 논문이 인용한 벤치마크는 역할 분담을 그대로 말한다. 도메인 일반화는 LLM이 낫고 과제 적응은 GNN이 낫다. LangTopo와 Dr.E가 둘 중 하나를 키우는 대신 vector quantization 기반 정렬에 공을 들이는 이유다. 여기서 [attention](../attention-ko/)과 [message passing](../gnn-ko/)은 서로 다른 일을 맡고 있다.

## link 수준

link 수준 연구는 vocabulary 논리 위에 서 있다.

knowledge graph 두 개는 entity도 relation 이름도 공유하지 않는다. 따라서 파라미터가 relation 정체성으로 색인되는 모델은 새 graph에서 아예 돌아가지 않는다. ULTRA의 답은 graph를 *relation의 graph*로 들어올리는 것이다. 원래의 relation 타입이 node가 되고 그 relation들이 어떻게 맞물리는지가 edge가 되며, relation 표현은 그 구조의 함수로 만들어진다. 모델 안의 어떤 것도 relation을 이름으로 지칭하지 않으므로 pretraining한 모델 하나가 처음 보는 graph에서 zero-shot으로 돈다. 논문은 서로 다른 knowledge graph 57개에서의 link 예측 결과를 보고한다. UltraQuery는 같은 vocabulary 독립성을 비모수 fuzzy 논리 연산자와 함께 복합 논리 질의 응답으로 끌고 간다.

double equivariance 계열은 같은 생각을 형식화한다. node 치환에 대한 equivariance와 relation 타입 치환에 대한 equivariance다. MTDEA는 relation을 서로 교환 가능한 타입끼리 묶어 cluster로 나누고 cluster마다 모델을 하나씩 학습한 뒤, test 때 새 relation 타입을 적절한 cluster에 배정한다. 이후의 이론 연구는 ULTRA와 InGram이 둘 다 하나의 double equivariant 틀에서 나온다는 것을 보이고, 동질 graph용 GNN을 double equivariant 모델로 바꾸는 방법 (ISDEA+)을 제시한다. 표현력을 따로 분석한 연구는 그 상한이 relation 표현을 계산할 때 쓰는 motif에 달려 있고, 이항보다 풍부한 motif를 쓰면 상한이 올라간다고 본다.

나머지는 이렇다. KG-ICL은 질의별 prompt graph를 만들고 그 안의 entity·relation을 통합 tokenizer로 보낸다. UniLP는 처음 보는 데이터셋의 연결 패턴을 in-context learning으로 짚어내는 보편 link 예측기를 학습한다. GraphFormers와 Edgeformers는 GNN 층과 transformer block을 교대로 끼워 node와 edge에 붙은 글을 맥락 속에서 읽는다.

<mark class="blue">link 수준이 잘 돌아가는 이유는 knowledge graph가 "무엇이 전이되어야 하는가"에 대한 깔끔한 정의 — entity가 아니라 relation — 를 공짜로 줬기 때문이고, 이 논문의 다른 어디에도 이에 상당하는 것이 없다.</mark>

## graph 수준

분류·회귀·생성을 다룬다.

**pretraining.** L2P-GNN은 pretraining 중에 fine-tuning 과정을 그대로 따라 하며 node·graph 두 수준에서 적응한다. Mole-BERT는 masked atom modeling과 triplet masked contrastive learning을 함께 쓴다. GROVER는 GNN에 self-attention을 얹은 backbone에 node·edge·graph 수준 self-supervised 과제를 올리고, 파라미터 1억 개로 label 없는 분자 1천만 개에 pretraining한다. GraphsGPT는 순수 transformer encoder로 "graph word"를 만들고 decoder로 구조를 복원하도록 분자 1억 개에 학습해서, 같은 모델이 분류기이자 생성기가 된다.

**fine-tuning.** G-Tuning은 사전학습 가중치가 아니라 downstream graph의 생성 패턴, 즉 graphon을 보존한다. GTOT-Tuning은 국소 지식 전이를 구조 prior가 붙은 optimal transport 문제로 세운다. 파라미터 효율 쪽에서는 AdapterGNN과 G-Adapter가 adapter module을 끼우고, GPF는 학습 가능한 prompt 벡터 하나를 모든 node feature에 더하며 보편성 논증까지 붙인다. 모두 분자 분류·회귀에서 전체 fine-tuning을 이겼다고 보고한다.

**LLM 결합과 생성.** 초기 연구 하나는 graph를 그냥 글로 바꿔 GPT-2와 GPT-3를 fine-tuning했다. GALLON은 multimodal LLM에서 prior 지식을 prompt로 뽑아내고 GNN과 LLM을 MLP 하나로 distillation한다. GIMLET은 graph와 지시문을 decoupled attention transformer 하나로 처리하고 모든 과제를 label 문자열로 디코딩하는데, 이 설계가 zero-shot 범위를 만들어 준다. UniMoT는 LLM용 분자 tokenizer를 더한다. 생성 줄은 DiGress, GraphVAE, GDSS, UniAug, LGGM이다.

**few-shot과 OOD.** CDFSGC는 맥락 view 하나와 topology view 둘에 attention해 도메인을 넘는 few-shot graph 분류를 한다. CDTC는 강화학습으로 source meta-task와 target prompt task를 맞붙인다. AAGOD는 학습된 GNN의 파라미터를 건드리지 않고 OOD (out-of-distribution) 탐지 능력을 얹는다.

이 중 여섯 개 — GROVER, Mole-BERT, GraphsGPT, GIMLET, GALLON, UniMoT — 는 도메인별 장의 분자 항목에도 그대로 올라 있다. 어떤 모델이 이 장에 들어가고 어떤 모델이 저 장에 들어가는지는 모델에서 측정할 수 있는 성질이 아니라 저자들이 자기 기여를 어떻게 규정했는지로 갈린다.

## 나머지 세 과제

**question answering (QA).** 패턴은 GNN 또는 graph 색인이 검색을 맡고 LLM이 생성을 맡는 구조다. GFM-RAG는 문서에서 knowledge graph 색인을 만들고 retriever를 대규모로 학습해 fine-tuning 없이 처음 보는 데이터셋에 전이시킨다. G-Retriever는 subgraph 구성 단계를 더하고 GraphQA 벤치마크 (ExplaGraphs, SceneGraphs, WebQSP)를 함께 낸다. GITA는 graph를 그림으로 렌더링해 vision-language model에 넣는다. GT2Vec은 graph embedding을 글 embedding 공간으로 보내 contrastive로 정렬한다.

**이상 탐지.** 초기 연구는 domain adaptation이다. Commander는 domain discriminator, 이상 분류기, 속성 decoder를 쓰고, ACT는 target graph 정상 node에 대한 contrastive learning과 label된 source 정상 node에 대한 one-class 정렬을 함께 최적화한다. 최근 것은 zero-shot·few-shot이다. ARC는 추론 시점에 정상 표본 몇 개로 데이터셋 고유 패턴을 in-context로 뽑는다. AnomalyGFM은 학습 가능한 정상·이상 prototype을 node 표현의 잔차와 정렬해서, 데이터셋이 달라도 같은 공간에서 이상도를 잴 수 있게 한다.

**추천.** PCRec은 GNN을 contrastive로 pretraining하고 target 도메인에서 BPR (Bayesian personalised ranking) loss로 fine-tuning한다. LLMRec은 LLM으로 상호작용 edge, 아이템 속성, 사용자 프로필을 늘린다. RLMRec은 collaborative filtering 쪽 embedding과 LLM 쪽 의미 표현을 정렬한다. 2T 연구는 범용 embedding을 만드는 heterogeneous GNN과 상호작용 데이터의 규모를 흡수하는 two-tower 구성을 짝짓는다. 제약으로 꼽히는 것은 규모 (node가 수십억인 플랫폼 graph), 도메인마다 다른 상호작용 의미, 그리고 변하는 사용자 관심이다.

## 내가 물을 것

graph 수준 절에서 분자 방법을 빼면 남는 게 거의 없다. [분자 성질 예측](../mpp-ko/) 쪽에서 보면 이 장은 따로 비교해야 할 별도 문헌이 아니라, pretraining 말뭉치가 더 큰 같은 문헌이다.

## 정리

| 과제 | 전이되어야 하는 것 | 대표 모델 | 기제 |
| --- | --- | --- | --- |
| node | homophily / heterophily 패턴 | GraphAny, GCOPE, GraphLoRA | inductive feature, 공유 projection, MMD 정렬 |
| link | entity가 아니라 relation | ULTRA, UltraQuery, KG-ICL | relation을 relation의 graph로 재인코딩 |
| graph | substructure vocabulary | GROVER, Mole-BERT, GraphsGPT | masked atom·edge modeling, codebook, graph-to-sequence |
| QA | 글 인터페이스 | GFM-RAG, G-Retriever | graph 색인 위 학습된 retriever + LLM 생성기 |
| 이상 탐지 | "정상"의 모양 | ARC, UNPrompt, AnomalyGFM | 표현 잔차 위의 prototype |
| 추천 | 상호작용 의미 | PCRec, RLMRec, 2T | contrastive pretraining, LLM 쪽 정렬 |

- 6장은 과제를 세 개가 아니라 **여섯 개** 다루며, 추천은 도메인이 아니라 과제로 취급된다
- link 수준 연구에는 "무엇이 전이되어야 하는가"에 대한 구체적인 답이 있다. entity가 아니라 relation이고, 그 답을 주는 것이 relation vocabulary다
- graph 수준의 대표 방법 여섯 개가 도메인별 장의 분자 항목에도 그대로 나온다
- node 수준은 완전 inductive 시도를 빼면 여전히 feature를 공유 공간으로 보내고 잘되길 바라는 구조다
- 여섯 과제 전체에서 LLM의 역할은 의미 일반화, GNN의 역할은 과제 적응이다. 이 둘을 합친 것은 아직 없다

## 참고

- Wang et al., [Graph Foundation Models: A Comprehensive Survey](https://arxiv.org/abs/2505.15116), *arXiv* (2025) — 여기서 리뷰한 논문. 6장이 이 편이다
- Galkin et al., [Towards Foundation Models for Knowledge Graph Reasoning](https://arxiv.org/abs/2310.04562), *ICLR* (2024) — ULTRA. relation graph로 들어올리기, knowledge graph 57개 zero-shot
- Zhao et al., [Fully-inductive Node Classification on Arbitrary Graphs](https://arxiv.org/abs/2405.20445), *arXiv* (2024) — GraphAny. 구조·feature·label 공간이 동시에 새로운 설정
- Rong et al., [Self-Supervised Graph Transformer on Large-Scale Molecular Data](https://arxiv.org/abs/2007.02835), *NeurIPS* (2020) — GROVER. graph 수준 항목이면서 동시에 분자 모델
