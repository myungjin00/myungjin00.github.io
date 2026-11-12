---
title: "무엇을 설명이라고 부를 수 있나"
date: 2025-03-28
description: "local attribution과 global 주장의 혼동 · attention 논쟁에서 살아남는 것 · gradient·Integrated Gradients·SHAP·LIME·GNNExplainer 비교 · 해석 주장을 검증 가능하게 만드는 네 가지 점검 · 그럴듯함은 faithfulness가 아니다"
category: concept
updated: 2025-04
lang: ko
group: interpretability
topic: Machine learning
subtopic: Evaluation
tags: [interpretability, attribution, attention, SHAP]
---

[attention 글](../attention-ko/)은 attention 가중치가 설명이 아니라는 데서 끝난다. 그러면 무엇이 설명인지는 말하지 않는다. 해석 가능성을 내세우는 모델이라면 — 원자 그래프와 junction tree 사이에 cross-attention을 둔 이중 view 분자 모델 같은 것 — 그건 하나의 주장이고, 주장에는 틀릴 수 있는 방법이 있어야 한다.

## 섞여 쓰이는 두 질문

| | 질문 | 답할 수 있는 것 |
| --- | --- | --- |
| **local** | 이 입력에 왜 이 예측이 나왔나 | 이 입력의 feature에 대한 attribution |
| **global** | 모델이 대체로 무엇을 배웠나 | 입력 여러 개에 걸쳐 측정한 거동 |

실제로 쓰이는 도구는 거의 다 앞의 질문에 답한다. 그 도구를 인용하는 문장은 거의 다 뒤의 주장을 한다. "모델이 sulfonamide를 알아보도록 배웠다"는 global 주장이고, 예시 분자 열두 개에서 sulfonamide가 강조된 그림은 글쓴이가 골라 온 local 근거다. 앞에서 뒤로 건너가려면 테스트셋 전체에 걸친 집계와 그 집계가 seed를 바꿔도 유지되는지에 대한 확인이 필요하다. 예시 모음으로는 안 된다.

## attention 논쟁의 실제 내용

Jain & Wallace의 *Attention is not Explanation* (NAACL 2019)은 text 분류기에서 두 가지를 측정했다. attention 가중치는 gradient 기반 중요도나 하나씩 빼 보는 (leave-one-out) 중요도와 상관이 **낮다.** 가중치와 통상적인 중요도가 같은 순위가 아니라는 뜻이다. 그리고 **적대적 attention 분포** (adversarial attention distribution)를 만들 수 있다. 같은 입력에 대해 전혀 다른 가중치 분포를 주면서 예측은 사실상 그대로인 것이다. 그래서 가중치는 출력만으로 유일하게 정해지지 않는다. 학습이 내놓은 분포는 들어맞는 여러 분포 중 하나다.

Wiegreffe & Pinter의 *Attention is not not Explanation* (EMNLP 2019)은 세 가지로 반박했다. 적대적 분포는 그걸 직접 목표로 최적화할 수 있는 공격자가 찾아낸 것이라, 학습된 모델이 실제로 하는 일이 아니라 가중치 공간에서 가능한 범위를 보여 준다. 모델과 같은 제약 아래 처음부터 학습시킨 적대 모델은 만들기가 훨씬 어렵다. 또 attention은 **baseline**과 견줘 판단해야 한다. 균일하게 고정한 가중치나 샘플마다 섞어 버린 가중치가 그 baseline인데, 그보다 나은 가중 방식이라면 뭔가를 하고 있는 것이고, "gradient와 상관이 낮다"는 말 자체는 둘 중 어느 쪽이 모델에 더 가까운지 알려 주지 않는다. 그리고 "설명"은 애초에 한 가지가 아니었다. 두 논문은 부분적으로 서로 다른 성질을 재고 있고, 부분적으로 서로 비켜서 논쟁한다.

양쪽을 다 지나고 남는 것은 어느 제목보다도 좁다. <mark class="blue">attention은 모델이 무엇을 썼는지 말해 주고, 왜 그것이 중요했는지는 말해 주지 않는다. 둘이 같아지는 건 같은 신호를 실어 줄 다른 후보가 없을 때뿐이다.</mark> 치환기와 그 치환기가 붙은 고리, 그리고 둘 다와 상관이 있는 디스크립터가 한 분자 안에 같이 있는 상황에서는 보통 다른 후보가 있다.

## attribution 방법들

| 방법 | 계산하는 것 | 비용 | 깔고 가는 가정 |
| --- | --- | --- | --- |
| **gradient / saliency** | ∂출력/∂입력 | backward 한 번 | 국소 gradient가 정보가 된다는 것. 잡음이 많고, 출력이 포화된 구간에서는 거의 0으로 읽힌다 |
| **Integrated Gradients (IG)** | baseline에서 입력까지 경로를 따라 gradient를 적분한 값 | 수십~수백 번의 통과 | "없음"을 뜻하는 baseline이 있다는 것. attribution의 합이 $f(x) - f(\text{baseline})$ 가 되므로 (completeness) baseline은 **실제 모델링 선택이다** — 0 벡터는 중립적인 분자가 아니다 |
| **SHAP (SHapley Additive exPlanations)** | Shapley value. 모든 순서에 걸친 feature의 평균 한계 기여 | feature 수에 지수적이라 쓸 만한 구현은 전부 근사한다 | efficiency·symmetry·dummy·additivity. 여기서 공리적 근거가 가장 단단하고, 근사는 그걸 느슨하게만 물려받는다 |
| **LIME (local interpretable model-agnostic explanations)** | 입력 주변을 흔들어 만든 데이터에 맞춘 희소 선형 대리 모델 | forward 수백 번 | 결정 경계가 국소적으로 선형이고 흔드는 분포가 뜻이 있다는 것. 불안정해서 두 번 돌리면 결과가 갈린다 |
| **GNNExplainer / SubgraphX** | edge와 node feature에 거는 mask. 예측은 유지하면서 작게 남도록 학습한다 | 설명할 그래프마다 최적화 한 번 | 작은 부분 그래프로 충분하다는 것. GNN (graph neural network)에서 화학자가 읽을 수 있는 결과를 내놓는 건 이쪽이다 |
| **attention 가중치** | 섞는 가중치. 이미 있다 | 무료 | 섞는 비중이 곧 중요도라는 것. 위에서 다룬 그 논쟁거리 |

오른쪽 열에서 두 가지가 눈에 띈다. 싼 방법이 가장 많이 가정하고, 공리에서 출발한 두 방법은 그 공리를 계산량으로 사 온 다음 공리를 더 이상 정확히 만족하지 않는 근사치를 건네준다.

## 해석 주장을 검증 가능하게 만드는 것

**흔들어 보고 재기.** 강조된 부분을 떼거나 바꾸고 예측이 실제로 움직이는지 본다. 그 변화를 같은 크기의 무작위 부분에 같은 조작을 했을 때와 비교해 보고한다. 결과는 절대적인 하락폭이 아니라 그 비교다. 예측이 움직이지 않으면 그 강조는 장식이었다.

**음성 대조.** 모델이 신경 쓰지 않아야 할 것을 고른다. 라벨을 실을 수 없는 feature, 해당 endpoint와 무관한 부분구조 같은 것. 거기에 똑같은 절차를 돌린다. 그것까지 강조된다면 문제는 방법 쪽이고, 그 방법이 진짜 feature에 대해 한 말도 쓸 수 없다.

**안정성.** seed를 바꿔 다시 돌리거나, 성능이 같은 모델 두 개를 가져온다. 성능은 그대로인데 설명이 바뀌면 그건 과제에 대한 설명이 아니라 그 실행 한 번에 대한 설명이다. 가장 자주 실패하는 점검이면서 가장 싼 점검이다.

**방법 간 일치.** 필요조건이지 충분조건이 아니다. 가정을 공유하는 두 방법은 같이 틀린 채로 일치할 수 있다. IG와 맨 saliency는 둘 다 국소 gradient를 읽으므로 둘의 일치는 거의 공짜다. 서로 다른 것을 가정하는 방법들끼리의 일치라면 값이 있다.

**그럴듯함은 faithfulness가 아니다.** <mark>화학자가 보기에 타당한 설명이라도 모델이 계산한 내용이 아닐 수 있다.</mark> 충실성(faithfulness)은 모델의 성질이라 모델에서 측정할 수 있고, 그럴듯함은 읽는 사람의 성질이라 그림을 설득력 있게 만드는 쪽이다. 이 둘을 하나로 보고하는 일이 흔하다. 근거는 뒤쪽에서 가져오고 이름은 앞쪽에서 가져온다.

## 분자에서는

부분구조 수준의 attention은 원자 수준 gradient와 달리 읽을 수 있다. 원자 40개에 걸친 원자별 saliency는 누군가 해석해 줘야 하는 heatmap이지만, junction tree node에 걸린 가중치는 고리나 작용기 하나를 지목하고, 그건 화학자가 동의하거나 반대할 수 있는 대상이다. 그 부분구조가 어디서 나오고 분해 규칙이 사람 대신 무엇을 결정해 버리는지는 [분자를 쪼개는 방법들](../fragmentation-ko/)에 있다. 애초에 부분구조 view를 둘 이유는 그 거친 node가 먼 거리를 잇는 지름길이 되어 [GNN](../gnn-ko/)의 over-squashing 문제를 덜어 준다는 데 있다.

이 읽히는 성질은 장점이 아니라 위험이다. <mark>읽을 수 있는 설명은 맞는 설명보다 설득력이 있다.</mark> 그리고 설득은 근거가 아니다. 위의 점검들은 분자에서 특히 싸다. 모델이 이미 쓰는 분해를 따라 떼어 내면 유효한 분자가 남고, endpoint와 아무 관계가 없는 부분구조는 쉽게 고를 수 있고, seed는 공짜다.

[activity cliff](../activity-cliff-ko/)는 쓸 수 있는 가장 날카로운 시험대다. cliff 쌍은 작은 변화 하나로 갈리면서 활성은 10배 단위로 차이 나므로, 두 분자에 대한 설명도 그 변화 근처에서 갈려야 한다. 갈리지 않으면 그 방법은 라벨을 결정한 것이 아니라 두 분자의 공통점을 따라가고 있는 것이다. 그리고 두 view 사이에 cross-attention을 둔 모델에는 그 기준을 통과시켜야 할 가중치가 한 벌이 아니라 두 벌 있다.

## 정리

- **local** attribution과 **global** 거동은 다른 질문이다. 도구는 대부분 앞을 답하는데 인용은 뒤로 된다
- Jain & Wallace: attention은 gradient 중요도와 상관이 낮고, **적대적 attention 분포**는 전혀 다른 가중치로 같은 예측을 낸다
- Wiegreffe & Pinter: 그 적대 분포는 직접 최적화해서 얻은 것이고, attention은 학습된 **baseline**과 견줘 판단해야 하며, "설명"은 애초에 한 가지 성질이 아니었다
- **attention은 무엇을 썼는지 말하고 왜 중요했는지는 말하지 않는다**
- 싼 방법이 가장 많이 가정한다. **SHAP**과 **IG**가 공리에서 출발한 쪽인데 근사가 그걸 약화시키고, **IG**의 baseline은 모델링 선택이고, **GNNExplainer**는 화학적으로 읽히는 것을 내놓는다
- **흔들기·음성 대조·seed 변경·가정이 다른 방법들**을 통과하면 검증 가능한 주장이 된다
- **그럴듯함은 faithfulness가 아니다** — 가장 자주 건너뛰는 구분이고, 읽히는 분자 설명일수록 건너뛰고 싶어지는 구분이다

## 참고

- Jain & Wallace, [Attention is not Explanation](https://arxiv.org/abs/1902.10186) (NAACL 2019) — 적대적 분포와 상관 측정
- Wiegreffe & Pinter, [Attention is not not Explanation](https://arxiv.org/abs/1908.04626) (EMNLP 2019) — 반론, 그리고 attention을 견줘야 할 baseline
- Sundararajan et al., [Axiomatic Attribution for Deep Networks](https://arxiv.org/abs/1703.01365) (ICML 2017) — Integrated Gradients와 completeness
- Lundberg & Lee, [A Unified Approach to Interpreting Model Predictions](https://arxiv.org/abs/1705.07874) (NeurIPS 2017) — SHAP과 그 공리
- Ying et al., [GNNExplainer: Generating Explanations for Graph Neural Networks](https://arxiv.org/abs/1903.03894) (NeurIPS 2019) — edge와 feature에 거는 mask
