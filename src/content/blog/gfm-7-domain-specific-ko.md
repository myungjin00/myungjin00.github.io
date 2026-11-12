---
title: "GFM #7 — 도메인별 모델, 그리고 분자가 가장 앞선 이유"
date: 2025-08-11
description: "여덟 개 도메인, 성숙한 건 하나 · 무엇이 분자 foundation model인가 · 원자 구조 1억 2천만 개 또는 SMILES 1억 개로 사전학습 · 분자 GFM이 아직 못 하는 것 · knowledge graph·시간 graph·학술·인과"
category: review
updated: 2025-09
lang: ko
group: gfm-7-domain-specific
topic: Graphs
venue: arXiv
venueYear: 2025
tags: [review, graph foundation models, molecular ML, pretraining]
---

> Wang, Zehong, et al. "Graph Foundation Models: A Comprehensive Survey." *arXiv*, 21 May 2025, [arxiv.org/abs/2505.15116](https://arxiv.org/abs/2505.15116). Preprint.
> [자료 목록](https://github.com/Zehong-Wang/Awesome-Foundation-Models-on-Graphs)

<mark class="blue">논문 자신의 입장은 분자에서 의미의 단위가 원자가 아니라 subgraph라는 것인데, 정작 그 분자 표에는 그렇게 만들어진 방법이 하나도 없다.</mark>

나머지 두 조건은 과제에 중립적인 표현 (multi-task learning, 비용으로는 과제 간 간섭과 negative transfer, 완화 수단으로는 과제별 출력 head)과 해석 가능성이다. 해석 가능성에서 내건 목표는 분자 GFM (graph foundation model)이 새로운 작용기나 반응 기제, 물리화학적 성질을 발견하는 데 도움이 될 수 있다는 것이다. 이 장의 어떤 연구도 그걸 보이지는 않는다. 결과가 아니라 방향이다.

## 분자: 이 도메인이 다른 이유

논문은 전용 모델을 요구한다고 보는 성질들을 열거한다.

- **대칭.** 분자 표현은 회전·평행이동·원자 치환에 대해 불변이어야 한다.
- **여러 scale.** 성질은 국소 작용기에서 전역 topology까지 걸친 상호작용에서 나온다.
- **양자 효과와 conformer.** 유연한 3D 기하는 2D 연결 정보만으로 복원되지 않는다.
- **공간의 크기.** 분자 공간은 천문학적으로 크므로 전체를 덮는다는 선택지는 없다.
- **label 비용.** label은 실험에서 나온다. 결정적인 항목이다. label 없는 분자는 거의 공짜고 label 붙은 분자는 그렇지 않다.

## 분자 foundation model로 분류된 것들

논문의 Table 9에는 항목이 28개 있다. backbone 계열 셋으로 나뉘고, 계열끼리 벤치마크를 거의 공유하지 않는다.

### graph 모델 계열

**3D·equivariant.** [MACE](../mace-ko/)는 원자 단위 재료화학용 equivariant foundation model로 올라 있고 회전·평행이동 대칭을 보존한다. JMP (Joint Multi-domain Pre-training)는 GemNet-OC backbone을 쓰고 네 출처에서 모은 **원자 구조 약 1억 2천만 개** — OC20 (1억), OC22 (800만), ANI-1x (200만), Transition-1x (1000만) — 에 에너지와 힘을 supervision으로 pretraining한 뒤 downstream 원자 단위 과제로 파인튜닝한다. DPA-2는 대칭 보존 GNN (graph neural network) 층에 transformer attention을 얹어 원자 구조 1000만 개로 multi-task pretraining을 한다.

**2D·multi-task.** Mole-BERT는 GIN (graph isomorphism network) 위에 masked atom modeling과 contrastive 목적함수를 올린다. Graphium은 양자역학 데이터셋과 bioassay 데이터셋을 걸쳐 multi-task learning을 한다. GROVER는 message passing과 전역 self-attention을 합쳐 파라미터 1억 개로 label 없는 분자 1000만 개에 pretraining하고 성질 예측 벤치마크 11개에서 개선을 보고한다.

**효율.** MiniMol은 작은 GNN을 유지한 채 양자·생물 assay에 multi-task pretraining을 한다. 정확도 마지막 한 점보다 실제로 배포 가능한 foundation model 꼴이 더 중요하다는 입장이다.

### 언어 모델 계열

분자는 선형화되므로 — SMILES (simplified molecular-input line-entry system)가 뻔한 경로다 — transformer 문헌이 바로 들어온다. GROVER가 경계에 있다. Graphormer식 설계 위에 올린 DiG는 한 지점이 아니라 평형 conformer 분포 전체를 모델링한다. GraphsGPT는 node와 edge 하나하나를 단위로 보고 분자 1억 개에 학습한다. GTFM은 ADMET (absorption, distribution, metabolism, excretion, toxicity)에 특화한다. 그 다음이 순수 글 쪽이다. MolecularGPT는 SMILES prompt에 구조적 이웃 예시를 붙이고, ESMFold는 단백질 언어 모델로 원자 수준 구조를 내며, GP-GPT는 Llama 기반 모델로 유전체 서열을 표현형에 대응시킨다. LLM (large language model) 혼자서 zero-shot·few-shot 성질 예측이 되는지를 그냥 물어보는 항목도 있다. Text2Mol은 글 질의와 [fingerprint](../descriptors-fingerprints-ko/) 같은 화학 표현을 공유 공간에 embedding한다.

### hybrid 계열

표에서 가장 큰 계열이다. MolCA와 UniMoT는 GNN embedding을 Q-Former로 통과시켜 고정된 LLM에 넣고, 글과 나란히 놓이는 이산적인 분자 단위를 만든다. GIT-Mol은 graph·글·그림 셋으로 늘린다. GIMLET은 graph와 지시문을 한 모델에서 처리한다. InstructMol과 MoleculeSTM은 분자–글 contrastive pretraining을 쓰는데, MoleculeSTM은 구조–글 쌍 28만 개 이상으로 학습하고 zero-shot 구조–글 검색과 글 지시 기반 분자 편집으로 평가했다. CLAMP는 분자 encoder를 bioassay 서술과 정렬해 zero-shot 탐색에 쓴다. ReLM은 GNN으로 후보 생성물을 만들고 LLM으로 순위를 매긴다. MolGPS는 규모를 위해 MPNN (message-passing neural network)과 transformer module을 합친다. GALLON은 GNN과 LLM을 MLP (multilayer perceptron) 하나로 distillation해 성질 예측에 쓴다. Hybrid-LLM-GNN은 결정을 다룬다. 전반적으로 [multimodal 표현](../multimodal-ko/) 연구와 같은 땅이다.

## 분자가 가장 성숙한 도메인인 이유

이 장과 논문의 나머지가 그 이유로 다섯 가지를 준다.

1. **vocabulary 문제가 애초에 생기지 않는다.** universal GFM을 막는 장벽은 도메인이 다른 두 graph가 vocabulary를 공유하지 않는다는 것이다. <mark>분자는 구성상 공유한다. 원자 타입과 결합 타입은 분자가 바뀌어도 영원히 같다.</mark> knowledge graph 연구가 설계해서 얻어야 했던 것을 분자 GFM은 공짜로 받는다.
2. **label 없는 데이터가 많고 균일하다.** 분자 1000만 개, 1억 개는 curation 없이 구할 수 있고 전부 같은 종류의 대상이다. 10.2절이 대비를 분명히 한다. graph 일반은 사람 손이 들어가야 만들어지므로 글이나 그림처럼 긁어모을 수 없다.
3. **부족한 건 label이고, 그게 바로 pretraining이 듣는 구간이다.**
4. **여기서는 supervised multi-task pretraining이 실제로 된다.** JMP는 처음부터 학습하는 것보다 평균 59% 개선, downstream 과제 40개 중 34개에서 state of the art 달성 또는 동급을 보고한다.
5. **scaling이 측정된 유일한 도메인이다.** 8.1.1절은 graph scaling 증거를 분자·원자 계와 시간 graph로 한정한다. 논문이 내놓는 설명은 이 graph들이 "구성 요소 하나하나가 고유한 의미를 지닌, 자연스럽게 미리 정해진 구조를 갖고 있어서 문법 규칙을 가진 언어의 구조적 성격과 비슷하다"는 것이다. 다시 말해 graph scaling은 graph가 마침 언어처럼 행동하는 곳에서만 확인됐다.

## 분자 GFM이 아직 못 하는 것

아래 단점들은 대부분 이 장이 직접 인용한 연구에서 나온다.

**pretraining 이득은 구간에 달려 있다.** 논문이 인용한 데이터 중심 scaling 분석은 pretraining이 데이터가 적은 구간에서는 크게 돕지만 많은 구간에서는 수익이 줄고 negative transfer가 나타날 수 있다고 본다. 그래서 pretraining한 backbone은 공짜 이득이 아니고, [transfer learning](../transfer-learning-ko/) 문헌이 보고하는 내용도 같다.

**modality 순위는 SMILES 계열에 불리하다.** 같은 분석에서 graph 기반과 fingerprint 기반 인코딩이 데이터 효율이 가장 높고, SMILES 기반 표현은 데이터가 늘어날 때 개선 폭이 가장 작다. 분자 표의 절반이 SMILES 꼴이다.

**측정된 scaling의 일부는 쉬운 split에서 나왔다.** random split이 데이터 효율이 가장 높고, scaffold 기반과 불균형 split은 분포 이동을 만들어 효율을 떨어뜨린다. 즉 깔끔한 power law는 일반화가 가장 덜 시험되는 곳에서 보고된다.

**capacity는 데이터 크기를 따라가지 않는다.** 같은 연구가 데이터셋 크기와 최적 모델 capacity 사이에 단순한 관계가 없다고 본다. 어떤 경우엔 데이터셋이 작을수록 더 큰 모델이 필요했다.

**두 절반은 벤치마크를 공유하지 않는다.** atomic potential 쪽 (JMP, MACE, DPA-2)은 원자 구조의 에너지와 힘으로 평가한다. 성질 예측 쪽 (GROVER, Mole-BERT, MiniMol, GALLON)은 MoleculeNet 계열 분류와 ADMET으로 평가한다. 서로를 이웃으로 인용하지만 baseline으로는 비교가 안 된다.

**LLM 계열 항목은 회귀로 평가되지 않는다.** 분자 표의 task align 칸에서 graph 모델 줄은 대부분 "N/A"이고 LLM 줄은 대부분 "Explicit - QA", 즉 question answering이다. 그 모델들은 글 생성으로 채점된다. zero-shot 검색이나 captioning 결과와 독성 데이터셋의 ROC-AUC (area under the receiver operating characteristic curve)는 같은 주장이 아닌데, 표는 둘을 한 칸에 넣는다.

**해석 가능성은 희망에 머문다.** 새 작용기 발견이 설계 원칙으로 적혀 있다. 표의 어떤 줄도 그걸 하지 않는다.

## 나머지 일곱 도메인, 짧게

| 도메인 | 무엇을 pretraining하는가 | 보고된 상태 |
| --- | --- | --- |
| 알고리즘 graph | 추론 흔적에 학습한 LLM, GNN solver 하나 (Triplet-GMPNN) | 대체로 prompting과 벤치마킹. GraphArena는 hallucination을 집계한다 |
| 문서 네트워크 | 글 encoder + 구조 (PATTON, ConGraT, GLEM, TAPE, METAG) | 작동하지만 foundation model보다는 text-attributed graph 학습에 가깝다 |
| heterogeneous graph | SELAR, PT-HGNN, HetGPT, hybrid Heterformer·THLM·HiGPT | schema 단위. schema를 넘어 zero-shot으로 가는 것은 없다 |
| knowledge graph | ULTRA, UltraQuery, KG-ICL, 고차 MOTIF | 분자 외에서 가장 단단한 사례. 실제 zero-shot inductive 전이 |
| 시간 graph | 네트워크 84개에 학습한 MiNT | 64개로 pretraining, 처음 보는 20개로 평가. zero-shot이 데이터셋별 학습을 이긴다 |
| 학술 네트워크 | LitFM. 인용 retriever + instruction tuning | 모델 하나. 인용 hallucination을 겨냥한다 |
| 인과 graph | Causal-LLM의 zero-shot 쌍별 질의 | 간접 연쇄에서 실패. CLEAR는 표현 방식과 node 차수에 민감함을 보인다 |

**알고리즘 graph**는 LLM을 graph 추론기로 쓰는 문헌이 사는 곳이다. GraphWiz는 단계별 추론 흔적을 내고, GCoder는 컴파일러 피드백을 보상으로 실행 가능한 프로그램을 합성하며, PIE는 이해–설계–실행으로 단계를 나눈다. 이론 결과 하나는 깊이가 log인 transformer가 특정 문제에서 고정 깊이 transformer나 GNN보다 장거리 graph 의존성을 더 잘 잡는다는 것을 보인다. **시간 graph**는 논문의 두 번째 scaling 결과를 준다. MiNT의 성능은 학습 네트워크 개수가 늘수록 일관되게 좋아지는데, 화학 밖에서 "데이터가 많으면 좋아진다"가 가장 깔끔하게 나온 곡선이다. **인과 graph**는 단서가 가장 많이 붙은 항목이다. 벤치마크는 차수 높은 node와 긴 경로에서 성능이 떨어지고, 표현 방식과 맥락 순서에 따라 결과가 흔들리는 것을 보인다.

## 내가 물을 것

맨 위에 옮긴 설계 원칙 — 방향족 고리와 작용기가 subgraph 수준에서 보존되므로 분자의 의미도 그 수준에 있고 원자 수준 조작은 그것을 깨뜨린다 — 은 [junction tree](../jtvae-ko/) view의 논거를 이해관계 없는 쪽이 적어 둔 것인데, 정작 분자 표의 28개 항목 중 그렇게 만들어진 것은 하나도 없다. scaling 곡선은 [scaffold split](../data-splitting-ko/)에서 다시 그려지기 전까지는 크게 믿지 않는 쪽이다.

## 정리

- 도메인 여덟 개 중 **실제 zero-shot 또는 데이터셋 간 전이 결과가 있는 것은 분자와 knowledge graph 둘뿐이다**
- 분자 GFM은 에너지·힘 label이 붙은 원자 구조 약 1억 2천만 개에, 또는 label 없는 2D 분자 약 1000만~1억 개에 pretraining한다. 서로 다른 문헌이고 벤치마크도 다르다
- 분자가 성숙한 건 방법이 다른 데보다 나아서가 아니라 화학이 공유 vocabulary를 공짜로 주기 때문이다
- scaling·전이 숫자에는 논문이 보고한 뒤 넘어가는 조건들이 붙어 있다. 데이터 구간 의존, modality 의존, 그리고 random split
- 논문은 분자의 의미가 subgraph 수준에 있다고 쓰고, 정작 분자 표의 어떤 항목도 subgraph 수준 view로 만들어지지 않았다

## 참고

- Wang et al., [Graph Foundation Models: A Comprehensive Survey](https://arxiv.org/abs/2505.15116), *arXiv* (2025) — 여기서 리뷰한 논문. 7장이 이 편이다
- Shoghi et al., [From Molecules to Materials: Pre-training Large Generalizable Models for Atomic Property Prediction](https://arxiv.org/abs/2310.16802), *ICLR* (2024) — JMP. 약 1억 2천만 구조, 처음부터 학습 대비 평균 59% 개선, 40개 중 34개
- Liu et al., [Multi-modal Molecule Structure-text Model for Text-based Retrieval and Editing](https://arxiv.org/abs/2212.10789), *Nat. Mach. Intell.* (2023) — MoleculeSTM. 구조–글 쌍 28만 개, zero-shot 검색과 편집
- Rong et al., [Self-Supervised Graph Transformer on Large-Scale Molecular Data](https://arxiv.org/abs/2007.02835), *NeurIPS* (2020) — GROVER. 파라미터 1억 개, label 없는 분자 1000만 개
- Chen et al., [Uncovering Neural Scaling Laws in Molecular Representation Learning](https://arxiv.org/abs/2309.15123), *NeurIPS* (2023) — 위에서 인용한 modality·split·capacity 조건들
