---
title: "GFM #1 — 서론: 그래프판 one-model-fits-all 구상"
date: 2025-06-19
description: "one-model-fits-all 목표와 transfer learning·self-supervised learning을 거쳐 온 길 · foundation model의 정의 · 그래프가 다른 modality인 이유 · 서론에 먼저 나오는 OFA와 GFT · 기존 리뷰들이 빠뜨린 것"
category: review
updated: 2025-07
lang: ko
topic: Graphs
venue: arXiv
venueYear: 2025
group: gfm-1-introduction
tags: [review, graph foundation models, pretraining, transfer learning]
---

> Wang, Zehong, et al. "Graph Foundation Models: A Comprehensive Survey." *arXiv*, 21 May 2025, [arxiv.org/abs/2505.15116](https://arxiv.org/abs/2505.15116). Preprint.
> [논문 목록](https://github.com/Zehong-Wang/Awesome-Foundation-Models-on-Graphs)

**시리즈** · #1 서론 · [#2 기초](../gfm-2-background-ko/) · [#3 난점](../gfm-3-challenges-ko/) · [#4 프레임워크](../gfm-4-framework-ko/) · [#5 universal](../gfm-5-universal-ko/) · [#6 과제별](../gfm-6-task-specific-ko/) · [#7 도메인별](../gfm-7-domain-specific-ko/) · [#8 이론](../gfm-8-theory-ko/) · [#9 데이터셋](../gfm-9-datasets-ko/) · [#10 남은 문제](../gfm-10-open-questions-ko/)

93쪽, 11개 장, 참고문헌 438편이다. 1장에는 저자들이 무엇을 원하는지, 왜 기존 리뷰로는 부족하다고 보는지, 남은 열 개 장이 무엇을 내놓겠다는 건지가 적혀 있다.

## 모든 그래프를 하나의 모델로

첫 주장은 결과가 아니라 목표다. **one-model-fits-all**, 즉 과제마다 구조를 설계하거나 따로 학습시키지 않고도 여러 도메인의 넓은 범위의 과제를 수행할 만큼 범용적인 모델이다.

거기까지 온 역사는 한 문단으로 압축되어 있고, 저자들은 그 곡선에서 그래프 학습이 놓인 지점을 다른 분야가 이미 지나간 자리로 잡는다. 결정 트리, support vector machine, k-최근접 이웃 같은 고전 모델은 차원이 낮고 정형화된 상황에서 잘 돌았고 고차원·비정형·멀티모달 데이터에서 막혔다. 딥러닝은 지각 과제의 성능을 끌어올렸다. 비전에는 convolutional network, 서열에는 recurrent network였다. 그래도 과제별 tuning, 구조 조정, 대규모 label은 여전히 필요했다. 전환은 **transfer learning**과 **self-supervised learning**에서 왔다. 대규모 unlabeled 데이터에서 널리 옮겨 쓸 수 있는 representation을 얻는 길이 열린 것이다. foundation model은 그 둘이 가능하게 만든 결과다.

이 장이 쓰는 정의로 foundation model은 거대한 데이터로 학습해 범용 지식을 얻고 그것을 여러 downstream task에 맞춰 쓰는 모델이고, 특징은 세 가지다. 규모, 범용성, 그리고 성격이 다른 데이터를 한꺼번에 쓰는 pretraining이다. 대형 언어 모델은 글을 잘게 쪼개 넣고 번역·요약·추론을 다음 단위 예측 문제로 세운다. 대형 비전 모델은 그림을 서열로 보고 같은 transformer 기제로 시각 질의응답, captioning, 생성을 한다. 둘 다 zero-shot·few-shot 일반화를 보고한다. label 예시가 하나도 없거나 몇 개뿐인 상태에서 새 task를 해내는 것이고, 이것이 adaptation을 충분히 싸게 만들어서 그 자체가 요점이 된다.

## 그래프를 따로 떼어 다루는 이유

<figure>
<img src="/assets/fig/gfm-intro.png" alt="Task-specific graph models contrasted with general-purpose graph foundation models" width="1913" height="1159" loading="lazy">
<figcaption><b>이 논문이 말하는 전환.</b> <b>(a)</b> GFM은 여러 도메인의 그래프 말뭉치로 한 번 pretraining한 뒤, 파인튜닝·distillation·prompting·zero-shot 추론으로 node 분류, link 예측, graph 분류, graph-to-text 생성에 모두 적응시킨다. <b>(b)</b> 기존 GNN은 데이터셋 하나로 task 하나를 end-to-end로 학습한다. <mark>오른쪽 칸이 주장의 전부다. 재학습 대신 adaptation을 한다는 것.</mark>
<br><span class="credit">Wang et al., <a href="https://arxiv.org/abs/2505.15116">Graph Foundation Models: A Comprehensive Survey</a>, arXiv:2505.15116 &#183; 논문 그림, Figure 1</span></figcaption>
</figure>

GFM (graph foundation model)은 같은 레시피를 그래프 데이터로 확장한 것이다. 이 장은 그래프를 중요하지만 근본적으로 다른 modality라고 쓰고, 그 근거로 관계 의존성, 치환 불변성, 비유클리드 기하를 든다. 이 세 성질 때문에 언어 쪽 레시피를 그대로 옮겨 올 수 없고, 그래서 3장과 8장이 따로 있다.

| | task별 그래프 모델 | graph foundation model |
| --- | --- | --- |
| 입력 | 데이터셋 하나 | 성격이 다른 그래프 데이터셋 모음 |
| 모델 | 그 데이터셋에 맞춘 [GNN](../gnn-ko/) (graph neural network) | pretraining된 backbone |
| 출력 | task 하나 | adaptation으로 여러 task |
| 학습 | 전부 end-to-end | pretrain 후 adapt |
| 재사용되는 것 | 없음 | backbone |

논문이 왼쪽 열을 비판하는 근거는 성능이 나쁘다는 게 아니다. end-to-end로 학습하면 모델이 학습에 쓴 데이터셋과 목적함수에 묶여서 새 문제마다 처음부터 다시 시작해야 한다는 것이고, 이 장은 열린 환경에 필요한 확장성과 일반화가 거기서 빠진다고 지적한다. 저자들이 염두에 둔 적용 범위는 일부러 넓다. [분자 성질 예측](../mpp-ko/), knowledge graph 추론, 소셜 네트워크 분석, 추천 시스템이다.

## 서론에 먼저 나오는 두 모델

1장은 분류 체계가 나오기 전에 모델 두 개를 이름으로 든다. 이 한 쌍이 논문이 계속 되돌아오는 두 갈래다.

**OFA**는 인용 네트워크, 위키 네트워크, knowledge graph, 분자 graph에 걸친 text-attributed graph 여덟 개를 다루는데, 모든 node에 서술문이 달려 있다. 공유 text encoder가 그 서술문들을 하나의 embedding space로 보내고, 그래서 서로 무관한 그래프의 node feature가 비교 가능해진다. 그리고 *prompt graph* 기제가 pretraining과 downstream task 사이의 간격을 메운다.

**GFT**는 다른 길을 간다. 그래프 데이터를 computation tree로 모델링해 옮겨 쓸 수 있는 패턴을 찾고, tree 복원 과제로 그래프 사이의 node representation을 정렬하며, 도메인을 가로질러 공유되는 구조 패턴의 **tree vocabulary**를 만든다.

공유 공간을 글로 잡느냐 구조로 잡느냐다. <mark class="blue">이 분야가 가진 답은 이 둘이고, 논문의 나머지 상당 부분은 그 변형들의 목록이다.</mark>

## 기존 리뷰들이 빠뜨린 것

새 리뷰가 필요하다는 논거는 기존 리뷰를 하나씩 호명하고 각각이 다루지 않은 것을 지적하는 방식으로 세워진다.

| 기존 리뷰 | 정리 축 | 1장이 지적한 누락 |
| --- | --- | --- |
| Liu et al. | backbone: GNN, LLM (large language model), 혼합 | 응용과 이론적 이해 |
| Zhao et al. | pretraining 목적함수 | 전체 시스템 설계, 이론 |
| Mao et al. | 전이성 이론 | 구체적 방법론, 실증적 체계화 |
| Wang et al. | 전이성과 emergent ability | 구조·알고리즘·응용 전반 |
| Zhao et al. | 도메인을 넘는 그래프 학습 | 과제를 넘는 일반화, 구조 정렬 |
| Wu et al. 및 GNN+LLM 리뷰들 | 도메인 하나, 또는 하위 분야 하나 | GNN+LLM을 GFM 틀의 일부가 아니라 별도 하위 분야로 취급 |

## 논문이 약속하는 것

내세우는 기여 여섯 개가 장 번호에 하나씩 대응한다.

- **3장** — 난점을 feature·structure·task 이질성으로 분류
- **4장** — GFM을 backbone·pretraining·adaptation으로 분해하는 통합 프레임워크
- **5~7장** — 범위에 따른 분류: universal, task-specific, domain-specific. 문헌은 2025년 4월 1일 기준
- **8장** — 이론: scaling law, 전이성, 일반화
- **9장** — 데이터셋 목록과 관리되는 GitHub 모음
- **10장** — 열린 질문: 정렬, 확장 가능한 adaptation, 평가 프로토콜, 이론

그리고 이 장은 앞을 보는 요약으로 끝나는데, 거기서 이 분야가 "아직 초기 단계"라고 인정하고 확장성·데이터 확보·평가·활용·이론적 이해에 걸친 미해결 문제를 열거한다. <mark>서론에서 자기 주제가 초기 단계라고 인정하는 글은 계획서를 쓰고 있는 것이고, 결과 보고로 읽기보다 그렇게 읽는 편이 유용하다.</mark>

## 내가 물을 것

서론에 먼저 나오는 두 모델이 사실상 분류 체계 전부다. 5~7장에 나오는 방법은 결국 글 쪽이나 구조 쪽에 붙거나 둘을 겹치려는 시도다. 그렇다면 아홉 장의 목록을 지나 도달하는 대신 앞에서 그렇게 말해 주는 편이 나았다고 본다.

## 정리

- 목표는 그래프판 **one-model-fits-all**이다. 다양한 그래프로 pretraining하고, 모델을 다시 설계하지 않고 node·link·graph task에 adaptation한다
- 계보는 고전 모델 → 딥러닝 → transfer learning과 self-supervised learning → foundation model이고, GFM이 그 그래프 편이다
- 그래프를 따로 다루는 근거는 관계 의존성, 치환 불변성, 비유클리드 기하다
- 서론의 두 예가 두 전략을 정해 준다. **OFA**는 공유된 글로 정렬하고, **GFT**는 공유된 tree vocabulary로 정렬한다
- 기존 리뷰 여섯 편을 인정하고 자리를 잡아 주는데, 각각 축 하나로 정리되어 있어 좁다는 평이다
- 1장은 이 분야가 아직 초기 단계라고 적으며 끝나고, 확장성·데이터 확보·평가·활용·이론을 미해결로 꼽는다

## 참고

- Wang et al., [Graph Foundation Models: A Comprehensive Survey](https://arxiv.org/abs/2505.15116), *arXiv* (2025) — 여기서 리뷰한 논문. 1장이 이 편이다
- Bommasani et al., [On the Opportunities and Risks of Foundation Models](https://arxiv.org/abs/2108.07258), *arXiv* (2021) — 용어와 "규모 + adaptation" 정의의 출처
- Liu et al., [One for All: Towards Training One Graph Model for All Classification Tasks](https://arxiv.org/abs/2310.00149), *ICLR* (2024) — OFA. 글을 공유 공간으로 쓰는 예
- Wang et al., [GFT: Graph Foundation Model with Transferable Tree Vocabulary](https://arxiv.org/abs/2411.06070), *NeurIPS* (2024) — GFT. 구조를 공유 공간으로 쓰는 예
