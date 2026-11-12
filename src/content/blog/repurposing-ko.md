---
title: "약물 재창출 (drug repurposing)"
date: 2025-09-19
description: "이미 있는 약에서 새 적응증을 찾는 일 · 세 가지 접근과 지식 그래프 · link prediction으로 바꿔 푸는 법 · 음성 데이터가 없다는 근본 문제 · 벤치마크가 왜 서로 비교되지 않는가"
category: concept
updated: 2025-10
lang: ko
group: repurposing
topic: Graphs
tags: [drug repurposing, knowledge graph, link prediction]
---

## 왜 하는가

새 약 하나를 시장에 내놓는 데 10년이 넘고 비용은 수십억 달러에 이른다. 그런데 **이미 승인된 약은 안전성 자료가 쌓여 있다.** 그 약이 다른 병에도 듣는다면 임상 1상을 건너뛰거나 대폭 줄일 수 있다.

가장 유명한 예가 실데나필이다. 협심증 약으로 개발됐다가 다른 적응증으로 쓰이게 됐고, 탈리도마이드는 오명을 뒤집고 다발골수종 치료제로 돌아왔다. 둘 다 **우연히** 발견됐다. 재창출 연구의 목표는 이걸 **체계적으로** 하는 것이다.

## 세 가지 접근

| 접근 | 쓰는 데이터 | 묻는 질문 |
| --- | --- | --- |
| **구조 기반** | 분자 구조, 단백질 구조 | 이 약이 저 표적에 붙을까 |
| **시그니처 기반** | 전사체 (LINCS 등) | 이 약이 만드는 발현 변화가 질병 발현 변화를 **뒤집는가** |
| **지식 그래프 기반** | 약·유전자·질병 관계망 | 이 약과 저 질병 사이에 빠진 연결이 있는가 |

시그니처 기반의 논리는 단순하다. 질병이 유전자 A를 올리고 B를 내린다면, A를 내리고 B를 올리는 약을 찾는다. connectivity score가 이 아이디어다.

세 번째가 지금 가장 활발하고, 내가 [플랫폼 과제](../../projects/repurposing/)에서 다룬 쪽이다.

## 지식 그래프로 바꿔 놓기

생의학 지식을 하나의 그래프로 둔다. node는 약·단백질·유전자·질병·부작용이고, edge는 알려진 관계 (relation)다.

```
drug ──inhibits──▶ protein ──associated──▶ disease
  └──indicated_for──────────────────────────▶ disease
```

<figure>
<img src="/assets/fig/knowledge-graph.svg" alt="A biomedical knowledge graph with one missing drug-disease edge" loading="lazy" />
<figcaption><b>재창출을 그래프 문제로 옮기면.</b> 약·단백질·질병이 node이고, 알려진 관계가 종류를 가진 edge다. 메트포민에는 이미 2형 당뇨로 가는 <code>indicated_for</code> edge가 있다. 점선이 질문이다 — PCOS (polycystic ovary syndrome)로 가는 edge가 있어야 하는가? 근거는 약 자체의 성질이 아니라 PRKAB1을 지나는 경로다.</figcaption>
</figure>

그러면 재창출은 **link prediction** 문제가 된다. *"이 약과 저 질병 사이에 `indicated_for` edge가 있어야 하는가?"*

[PrimeKG](https://doi.org/10.1038/s41597-023-01960-3)가 대표적인 공개 그래프다. 데이터베이스 20개를 합쳐 node 약 13만 개, edge 400만 개 규모이고, 질병 1만 7천 종을 다룬다.

모델은 [GNN](../gnn-ko/) (graph neural network) 계열이 쓰인다. 다만 분자 그래프와 성격이 다르다.

| | 분자 그래프 | 지식 그래프 |
| --- | --- | --- |
| 크기 | 작은 그래프 수백만 개 | 큰 그래프 하나 |
| 예측 단위 | 그래프 전체 | **edge** |
| node 종류 | 원자 한 종류 | 약·단백질·질병… (heterogeneous) |
| edge 종류 | 결합 차수 | 수십 종의 관계 |

node와 edge에 종류가 여럿이라 **이종 그래프** (heterogeneous graph)를 다루는 구조가 필요하다. R-GCN (relational graph convolutional network)이나 관계별 메시지 함수를 두는 식이다.

## 근본적인 문제: 음성이 없다

지식 그래프에는 **"이 약은 이 병에 안 듣는다"는 edge가 없다.** 있는 건 알려진 양성뿐이다. 그래서 학습할 때 음성을 임의로 만들어낸다 — 약과 질병을 무작위로 짝지어 음성이라고 친다.

문제는 그 쌍이 진짜 음성이 아니라 **아직 아무도 시험하지 않은 쌍**일 수 있다는 것이다. 그리고 바로 그런 쌍이 우리가 찾으려는 답이다. 즉 **찾으려는 정답을 음성으로 학습시키고 있을 수 있다.**

<mark class="blue">결과적으로 보고되는 ROC-AUC (area under the receiver operating characteristic curve) 0.95 같은 숫자는 "무작위 쌍과 알려진 양성을 구분하는 능력"에 가깝고, "새 적응증을 제안하는 능력"과는 다르다.</mark>

## 점수를 부풀리지 않는 평가 설계

- **시간 분할 (temporal split).** 특정 연도 이전 데이터로 학습하고, 이후에 승인된 적응증을 맞히는지 본다. 가장 현실에 가깝다.
- **질병 단위 분할 (disease-level split).** 특정 질병을 통째로 빼서, 그 질병에 대해 아무것도 모르는 상태에서 예측하게 한다.
- **음성 샘플링 (negative sampling) 방식을 명시.** 무작위인지, 화학적으로 먼 쌍인지, 임상 실패 기록인지에 따라 난이도가 전혀 다르다.
- **상위 K개 (top-K)를 사람이 본다.** 결국 실험으로 검증할 건 상위 몇십 개다. 전체 ROC-AUC보다 상위 구간의 정밀도 (precision)가 중요하다.

> 벤치마크가 서로 비교되지 않는 가장 큰 이유가 음성 샘플링 방식과 split 방식이다. 같은 PrimeKG를 쓴 두 논문이 서로 다른 것을 뜻하는 숫자를 보고할 수 있다. 그래서 과제에서 **다섯 모델을 동일 조건에 올리는 표준 환경**부터 만들어야 했다.

## 정리

- 승인된 약은 안전성 자료가 있어서 재창출이 빠르고 싸다
- 구조 기반 · 시그니처 기반 · 지식 그래프 기반, 셋 중 마지막이 가장 활발하다
- 지식 그래프에서는 재창출이 **link prediction**이 된다
- node와 edge 종류가 여럿이라 이종 그래프 구조가 필요하다
- **음성 데이터가 없다는 것이 근본 문제** — 무작위 음성은 찾으려는 답을 음성으로 학습시킬 수 있다
- 시간 분할·질병 분할·상위 K 검토가 점수를 부풀리지 않는 설계다

## 참고

- Chandak, Huang & Zitnik, [Building a knowledge graph to enable precision medicine](https://doi.org/10.1038/s41597-023-01960-3), *Sci. Data* (2023) — PrimeKG
- Huang et al., [A foundation model for clinician-centered drug repurposing](https://doi.org/10.1038/s41591-024-03233-x), *Nat. Med.* (2024) — TxGNN
- Pushpakom et al., [Drug repurposing: progress, challenges and recommendations](https://doi.org/10.1038/nrd.2018.168), *Nat. Rev. Drug Discov.* (2019)
