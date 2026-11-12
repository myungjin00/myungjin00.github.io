---
title: "GFM #4 — 통합 프레임워크: backbone, pretraining, adaptation"
date: 2025-07-07
description: "이 논문의 실제 기여는 세 칸짜리 분해다 · GNN·graph transformer·LLM backbone · supervised·generative·contrastive pretraining과 pretext task가 사 주는 것 · 그리고 full 파인튜닝부터 graph prompting까지 여섯 가지 adaptation"
category: review
updated: 2025-08
lang: ko
topic: Graphs
venue: arXiv
venueYear: 2025
group: gfm-4-framework
tags: [review, graph foundation models, pretraining, transfer learning, backbone, adaptation]
---

> Wang, Zehong, et al. "Graph Foundation Models: A Comprehensive Survey." *arXiv*, 21 May 2025, [arxiv.org/abs/2505.15116](https://arxiv.org/abs/2505.15116). Preprint.
> [논문 목록](https://github.com/Zehong-Wang/Awesome-Foundation-Models-on-Graphs)

**시리즈** · [#1 서론](../gfm-1-introduction-ko/) · [#2 기초](../gfm-2-background-ko/) · [#3 난점](../gfm-3-challenges-ko/) · #4 프레임워크 · [#5 universal](../gfm-5-universal-ko/) · [#6 과제별](../gfm-6-task-specific-ko/) · [#7 도메인별](../gfm-7-domain-specific-ko/) · [#8 이론](../gfm-8-theory-ko/) · [#9 데이터셋](../gfm-9-datasets-ko/) · [#10 남은 문제](../gfm-10-open-questions-ko/)

4장은 논문의 나머지를 꿰는 틀을 세운다. **pretrain-then-adapt**이고, 발표된 모델을 전부 세 칸의 선택으로 읽는다.

## 분해 자체가 기여다

GFM (graph foundation model)은 성격이 다른 그래프 데이터셋 모음으로 pretraining한 다음 downstream task에 adaptation한다. end-to-end 학습이 아니다. 두 단계를 풀어 적으면 이렇다.

| | pretraining | adaptation |
| --- | --- | --- |
| 입력 | 대규모 그래프 데이터베이스 | task별 데이터 |
| 모델 | 파라미터를 가진 backbone | 초기화가 끝난 같은 backbone |
| 목표 | 범용 그래프 representation | task 성능 |
| 결과 | 구조와 의미를 담은, 옮겨지는 weight | 돌아가는 예측기 |

이 장의 주장은 문헌에 나온 모든 GFM이 **세 칸**의 선택으로 적힌다는 것이다.

| 구성 요소 | 결정하는 것 | 선택지 |
| --- | --- | --- |
| **backbone** | 구조와 feature를 어떻게 encoding할지 | 그래프 모델, 언어 모델, 혼합 |
| **pretraining** | task label 없이 무엇을 배울지 | supervised, generative, contrastive |
| **adaptation** | pretraining된 weight를 예측기로 바꾸는 방법 | 파인튜닝, distillation, test-time adaptation, prompting, in-context learning, prototype |

<mark class="blue">이 논문의 진짜 기여는 어느 한 절이 아니라, 새 약어를 달고 나온 논문을 세 개의 선택으로 읽고 같은 축에서 다른 전부와 비교할 수 있게 만든 것이다.</mark> 덤으로 비어 있는 칸이 보인다. 학회별로 정리한 분류에서는 절대 보이지 않는 것이다.

## backbone

<figure>
<img src="/assets/fig/gfm-backbone.png" alt="Three backbone paradigms: graph model, language model, and graph-language co-training" width="2400" height="454" loading="lazy">
<figcaption><b>encoder를 만드는 세 가지 방식.</b> 그래프 모델, 그래프를 문자열로 바꿔 읽는 언어 모델, 그리고 둘을 함께 학습하는 방식. 최근 연구는 세 번째에 몰려 있다.
<br><span class="credit">Wang et al., <a href="https://arxiv.org/abs/2505.15116">Graph Foundation Models: A Comprehensive Survey</a>, arXiv:2505.15116 &#183; 논문 그림, Figure 4</span></figcaption>
</figure>

목표는 구조 정보와 의미 정보를 모두 싣는 것이고, 방법은 GNN (graph neural network)과 LLM (large language model)이 각각 잘하는 것을 합치는 것이다.

| | 그래프 모델 (GNN, graph transformer) | LLM |
| --- | --- | --- |
| 입력 | 그래프 그 자체 | 텍스트 시퀀스로 펼친 그래프 |
| 강점 | message passing으로 관계 의존성 포착 | 일반화와 확장성 |
| 한계 | 먼 거리 의존성, 멀티모달 결합 | 그래프 inductive bias 없음, topology에 약함 |

### 그래프 모델이 예측기인 경우

기본은 [message passing](../gnn-ko/)이다. node embedding을 이웃 정보를 모아 갱신하고, 아키텍처들은 AGGREGATE와 UPDATE를 어떻게 구현하는지로 갈린다. GCN (graph convolutional network)은 정규화된 평균으로 모으고, GAT (graph attention network)는 [attention](../attention-ko/) 비중을 써서 이웃을 차등 반영하고, graph transformer는 모든 node에 대한 전역 attention을 쓴다.

갈래가 둘이다.

- **보조 모듈 없음** — GNN inductive bias만 쓰고 아무것도 덧붙이지 않는다. 공유 초기화를 쓰는 효율적 GNN인 MiniMol, 차수로 정규화한 계층적 갱신을 쓰는 JMP가 예다. 관계가 중심인 도메인에서 강하고, 구조화되지 않은 지식이 필요한 task에서는 약하다.
- **보조 언어 모델 있음** — GNN이 못 하는 부분을 LLM으로 메운다. 전략이 둘이고 그 구분이 중요하다. 하나는 *LLM으로 node feature를 보강* 하는 쪽이다. TAPE는 생성 모델로 node마다 task에 맞는 설명문을 만들고, 그 문장을 언어 모델이 벡터로 바꿔 GNN에 넣는다. LLM은 전처리고 구조 학습은 여전히 GNN이 한다. 다른 하나는 *LLM을 node 서술의 encoder로* 쓰는 쪽이다. 모든 node와 edge를 통일된 형식의 문장으로 적고 공통 embedding space로 encoding한다 (OFA). 도메인을 넘는 zero-shot을 사 주는 쪽은 두 번째다. 본 적 없는 도메인의 node도 문장 하나는 만들어 내기 때문이다.

### 언어 모델이 예측기인 경우

pretraining된 LLM은 — BERT는 가려진 부분을 맞히도록, GPT-3는 뒤에 올 것을 순서대로 맞히도록 학습했다 — in-context learning, chain-of-thought 추론, zero-shot 일반화를 들고 온다. 그래프에 쓸 때는 그래프를 텍스트 시퀀스로 바꾼다. LangGFM은 자연어 템플릿을 쓰고, BeyondText는 prompt로 그래프 구조를 복원하게 하고, GLM은 강화학습으로 prompt를 tuning한다. 한계는 뻔한 쪽이다. 복잡한 topology에 대한 inductive bias가 없으니 매번 인접 관계를 텍스트에서 다시 끌어내야 한다.

보조 모듈을 붙이는 경우에는 GNN이 뽑은 구조를 언어 모델 입력 공간에 맞춘다. GraphGPT는 instruction tuning에 contrastive alignment를 더하고, GraphTranslator는 구조를 고려한 regularization을 넣고, LLaGA는 task에 관련된 subgraph를 검색해 쓴다.

### graph-language co-training

여기서는 GNN과 LLM이 한쪽이 다른 쪽을 보조하는 관계가 아니라 **대등한** 학습자다. 방식이 둘이다.

*alignment* 는 dual encoder와 contrastive 목표로 구조 representation과 비구조 representation을 하나의 embedding space에 넣는다. GraphCLIP, ConGraT가 그렇다. *iterative update* 는 거기서 더 나아가, 공유 의미 기준점 역할을 하는 latent variable을 두고 EM (expectation-maximization) 방식으로 최적화한다. 예가 GLEM이다. 언어 모델이 node 텍스트에서 pseudo-label을 만들고, GNN이 구조를 따라 전파해 embedding을 다듬고, 둘이 번갈아 수렴까지 간다. 서로 부족한 쪽을 채우는 구성이다.

| backbone 종류 | 강점 | 한계 |
| --- | --- | --- |
| 그래프 | 구조 충실도, 효율 | 먼 거리·멀티모달 정보 |
| 언어 | 일반화, zero-shot, 멀티모달 | 구조 bias 없음 |
| 혼합 | 위 둘 다 | 복잡하고 계산 비용이 크다 |

## pretraining

<figure>
<img src="/assets/fig/gfm-pretrain.png" alt="Supervised, generative and contrastive pretraining strategies" width="2400" height="1092" loading="lazy">
<figcaption><b>학습 신호가 어디서 오는가.</b> supervised는 label을 쓰고, generative는 데이터를 복원하고, contrastive는 구분하면서 배운다. 규모를 키울 수 있는 건 뒤의 둘뿐이다. label이 필요 없기 때문이다.
<br><span class="credit">Wang et al., <a href="https://arxiv.org/abs/2505.15116">Graph Foundation Models: A Comprehensive Survey</a>, arXiv:2505.15116 &#183; 논문 그림, Figure 5</span></figcaption>
</figure>

pretraining은 label이 없거나 약한 대규모 데이터에서 옮겨 쓸 수 있는 지식을 얻는 단계다. 전략이 셋이다.

| 전략 | 하는 일 | 특징 |
| --- | --- | --- |
| supervised | 큰 그래프에서 떼어낸 label 있는 subgraph로 학습 | task 지향, 목표가 명시적 |
| generative | 가려지거나 망가진 node·구조를 복원 | auto-encoding 또는 auto-regressive |
| contrastive | view를 넘나들며 positive와 negative 쌍을 구분 | 불변적이고 옮겨지는 embedding |

**supervised pretraining**은 label 있는 그래프로 task에 관련된 representation을 배운다. pretraining이 downstream 목표와 정렬되고 수렴이 빠르다. 대가는 대규모 label이라서 보통 self-supervised와 섞어 쓴다. OFA는 *nodes-of-interest* 로 서로 다른 예측 task를 하나로 묶고, PRODIGY는 구조적·의미적 분해로 subgraph task를 만들어 낸다.

**generative pretraining**은 label 없이 데이터 분포 자체를 모델링한다. auto-regressive 계열은 결합 확률을 순차 조건부로 분해해 과거 문맥을 보면서 node와 edge를 한 단계씩 생성한다. GraphRNN, 분자 전용인 MolecularRNN, transformer 기반 auto-regressive 생성인 GraphGPT, edge를 하나씩 붙이는 변형들이 있다. auto-encoding 계열은 입력 일부를 가리고 보이는 문맥에서 복원한다. BERT 방식이다. node나 edge의 feature를 가리거나 구조를 가리고, GNN encoder로 latent를 계산한 뒤 전용 head가 가려진 부분을 맞힌다.

**contrastive pretraining**은 구분을 통해 배우고, 두 종류가 있다. *instance-instance* 는 같은 node의 두 view를 positive로, 다른 node를 negative로 두고 InfoNCE를 최적화한다. 약점은 positive 쌍 가정이다. homophily (이웃한 node끼리 서로 닮는 성질)가 약하거나 그래프에 noise가 많으면 "같은 node의 두 view"가 더 이상 안전한 동일성 개념이 아니다. *instance-context* 는 대신 국소 node embedding을 그래프 전역 요약과 맞춘다. DGI (Deep Graph Infomax)가 그렇다. 진짜 node-그래프 쌍과 망가뜨린 쌍 사이의 상호정보 기반 구분이고, 망가뜨리는 방법은 보통 node feature를 섞는 것이다. 그래프에서 [self-supervised learning](../learning-paradigms-ko/)이 실제로 일하는 자리가 여기다.

## pretext task가 사 주는 것

discussion 절은 승자를 선언하지 않는다.

- supervised — task와 정렬되고 빠르지만 크고 질 좋은 label이 필요하다. label이 많은 pretraining task가 downstream과 닮았을 때 가장 좋다.
- generative — 확장성 있고 label이 없어도 되지만 task 특이성이 약하다. <mark>복원을 잘하는 것은 downstream 성능이 아니다.</mark>
- contrastive — 구분력 있는 representation을 얻지만 augmentation 선택에 민감하고 계산이 무겁다.

## adaptation

<figure>
<img src="/assets/fig/gfm-adaptation.png" alt="Six adaptation strategies for a pretrained graph foundation model" width="2400" height="944" loading="lazy">
<figcaption><b>pretraining한 것을 쓰는 여섯 가지 방법.</b> 차이는 하나다. 모델을 어디까지 건드려도 되는가. 왼쪽에서 오른쪽으로 읽으면 예산을 읽는 것이다. 모든 parameter를 갱신하는 쪽에서 하나도 갱신하지 않는 쪽까지.
<br><span class="credit">Wang et al., <a href="https://arxiv.org/abs/2505.15116">Graph Foundation Models: A Comprehensive Survey</a>, arXiv:2505.15116 &#183; 논문 그림, Figure 6</span></figcaption>
</figure>

선택지가 여섯이고, 저자들이 직접 비교한 표가 아래와 같다.

| 전략 | 강점 | 한계 |
| --- | --- | --- |
| transfer learning | label을 덜 쓰고, pretraining된 초기값으로 빨리 수렴 | full 파인튜닝은 비용이 크고 작은 데이터셋에서 overfitting |
| distillation | 큰 모델을 압축, 추론이 싸다 | student가 teacher의 복잡한 그래프 패턴을 놓칠 수 있다 |
| test-time adaptation | 재학습 없이 추론 시점의 분포 변화에 대응 | 감독 신호가 없고, self-supervised 신호의 noise로 불안정 |
| graph prompting | parameter 갱신 없음, prompt가 모듈형이고 재사용 가능 | prompt 품질에 민감하고 task별 tuning이 필요할 수 있다 |
| in-context learning | 갱신 없이 zero-shot·few-shot | 좋은 예시가 필요하고, 그래프에서는 고르기 어렵다 |
| prototype learning | 해석 가능, parameter 효율적, few-shot에 강하다 | 군집이 깔끔하다고 가정하고, 복잡한 경계를 놓친다 |

몇 개는 풀어 적어 둘 만하다.

**transfer learning**은 무엇을 얼마나 갱신하는지로 등급이 나뉜다. 아무것도 갱신하지 않는 직접 적용 (zero-shot), 모든 parameter를 바꾸는 full 파인튜닝, task 관련성에 따라 일부 layer나 모듈만 고르는 adaptive 파인튜닝, 본체를 동결하고 adapter나 LoRA 같은 작은 모듈만 학습하는 PEFT (parameter-efficient fine-tuning)다.

**TTA** (test-time adaptation)는 추론 중에 label 없는 test 데이터로 적응한다. 학습 데이터나 label에는 접근하지 않는다. self-supervised TTA는 entropy 최소화나 pseudo-label 일관성으로 parameter를 온라인 갱신한다. GTRANS는 모델 대신 *입력 그래프* 를 고친다. node 속성을 더하거나 빼고, edge를 바꾸고, noise를 없앤다. LLM-TTT는 언어 모델로 node 서술에서 pseudo-label을 만든다. transfer learning과의 차이는 구분해 둘 필요가 있다.

| | transfer learning | test-time adaptation |
| --- | --- | --- |
| 시점 | pretraining 후, downstream task 학습 시 | 추론 중 |
| 입력 | label 있는 task별 데이터 | 보통 label 없는 test 데이터 |
| 바뀌는 것 | 대개 모델 | 일부는 모델, 일부는 입력 그래프 |

**graph prompting**은 동결된 모델을 학습 가능한 prompt 벡터로 유도한다. data-level prompting은 입력 그래프 자체를 바꿔서 모델이 읽는 것에 prompt 구조를 덧붙이고, representation-level prompting은 대신 모델 내부 representation에 작용해, 이미 계산된 벡터를 조절하거나 옮긴다. All in One과 IA-GPL이 여기 있다.

**ICL** (in-context learning)은 GPT-3처럼 입력에 예시를 넣고, parameter는 건드리지 않는다. 주로 node와 edge에 서술문이 달린 text-attributed graph에 적용되고, 어려운 부분은 그래프에 고유하다. 데이터가 non-i.i.d.(non-independent and identically distributed)이고 구조적으로 서로 의존하므로 예시를 그냥 뽑아서 쓸 수 없다. AskGNN은 GNN을 retriever로 써서 관련 예시를 찾고, RAG (retrieval-augmented generation)는 외부 메모리에서 예시를 가져오고, 일반적인 답은 의미 유사도와 구조 유사도를 함께 쓰는 선택이다.

**prototype learning**은 분류기를 클래스 중심 벡터로 대체하고 가장 가까운 prototype까지의 거리로 분류한다. prototype은 node representation에서 오거나 — label 있는 node들의 embedding 평균이고 parameter가 없다 — 그래프에 **학습 가능한 클래스 node**를 bipartite 구조로 덧붙여 message passing으로 계산한다. PRODIGY가 두 번째를 쓴다.

## 내가 물을 것

pretext task 비교에서 밑줄 칠 곳은 가운데 줄이다. pretext task를 잘 풀어도 downstream이 필요한 것을 하나도 담지 않은 encoder가 남을 수 있고 — 내 [transfer learning](../transfer-learning-ko/) 노트와 같은 이유다 — contrastive에서는 그 민감함이 augmentation으로 옮겨 갈 뿐인데, 분자에서는 그래프를 건드리는 순간 예측하려는 성질 자체가 바뀔 수 있다. 세 칸에 대고 보면 내가 쓰는 dual-view 분자 pretraining은 셋 다 보수적인 선택이어서, 어느 칸 하나만 바꿔 시험해 볼 자리를 짚는 데 쓰인다.

## 정리

- 모든 GFM은 **backbone × pretraining × adaptation**으로 분해되고, 그 분해가 이 논문의 기여다
- backbone은 그래프·언어·혼합이다. 그래프는 구조 충실도, 언어는 zero-shot과 멀티모달 범위, 혼합은 둘 다에 더 큰 비용
- GNN에 LLM을 붙이는 방식은 둘이다. encoding 전에 text feature를 만들어 주거나, 통일된 node 서술을 공통 공간에 encoding하거나. 도메인을 넘는 zero-shot을 사 주는 쪽은 두 번째뿐이다
- co-training은 둘을 대등하게 둔다. 공통 공간에서의 contrastive alignment, 또는 pseudo-label을 주고받는 EM 방식 교대 (GLEM)
- pretraining은 supervised·generative·contrastive이고, contrastive는 instance-instance (InfoNCE)와 instance-context (DGI)로 갈린다
- 지배적인 pretext task는 없다. supervised는 label이 필요하고, generative의 복원은 downstream 성능을 따라가지 않고, contrastive는 augmentation에 달려 있다
- adaptation은 full 파인튜닝부터 PEFT, distillation, test-time adaptation, graph prompting, in-context learning, prototype까지다. 뒤의 세 개는 대체로 text-attributed graph를 전제한다

## 참고

- Wang et al., [Graph Foundation Models: A Comprehensive Survey](https://arxiv.org/abs/2505.15116), *arXiv* (2025) — 여기서 리뷰한 논문
- Veličković et al., [Deep Graph Infomax](https://arxiv.org/abs/1809.10341), *ICLR* (2019) — 그래프에서의 instance-context contrastive pretraining
- Huang et al., [PRODIGY: Enabling In-context Learning Over Graphs](https://arxiv.org/abs/2305.12600), *arXiv* (2023) — in-context adaptation을 위한 prompt graph와 학습 가능한 클래스 node
- Sun et al., [All in One: Multi-task Prompting for Graph Neural Networks](https://arxiv.org/abs/2307.01504), *KDD* (2023) — 4.4절 전반에서 쓰는 graph prompting 정식화
- Zhao et al., [Learning on Large-scale Text-attributed Graphs via Variational Inference](https://arxiv.org/abs/2210.14709), *ICLR* (2023) — GLEM, EM 방식의 graph-language 교대 학습
