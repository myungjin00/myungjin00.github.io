---
title: "성능지표: 어느 숫자를 쓸 것이고, 그 숫자가 가리는 것"
date: 2025-02-07
description: "불균형에서 정확도는 거짓말하고 ROC-AUC는 거의 눈치채지 못한다 · precision·recall·F1·MCC · PR-AUC는 무너지는데 ROC는 그러지 않는 이유 · RMSE와 MAE, Pearson과 Spearman · 그리고 벤치마크마다 기대하는 관례"
category: concept
updated: 2025-03
lang: ko
group: metrics
topic: Machine learning
subtopic: Evaluation
tags: [evaluation, ROC-AUC, PR-AUC, RMSE]
---

[split](../evaluation-protocol-ko/), [activity cliff](../activity-cliff-ko/), [벤치마크](../mpp-ko/)를 두고 벌이는 논쟁은 전부 지표 위에서 벌어지는데, 그 지표가 무엇을 재는지는 대개 말하지 않고 넘어간다.

첫 질문은 어느 지표냐가 아니다. 오류 하나의 대가가 얼마냐다. 가상 스크리닝에서 거짓 양성은 assay 한 번을 낭비하고, 거짓 음성은 화합물을 잃는다. 두 오류의 값이 다르고, 어떤 숫자 하나도 둘을 같이 담지 못한다.

## 분류: 모든 것이 네 칸에서 나온다

| | 양성으로 예측 | 음성으로 예측 |
| --- | --- | --- |
| **실제 양성** | TP (true positive) | FN (false negative) |
| **실제 음성** | FP (false positive) | TN (true negative) |

| 지표 | 식 | 읽는 법 |
| --- | --- | --- |
| 정확도 (accuracy) | (TP+TN)/전체 | 얼마나 자주 맞히나 |
| 정밀도 (precision) | TP/(TP+FP) | 양성이라 했을 때 그게 맞을 확률 |
| 재현율 (recall)·민감도 | TP/(TP+FN) | 실제 양성 중 몇 개를 찾았나 |
| 특이도 (specificity) | TN/(TN+FP) | 실제 음성 중 몇 개를 걸러냈나 |
| F1 | precision과 recall의 조화평균 | 숫자 하나. TN을 아예 무시한다 |
| **MCC** (Matthews correlation coefficient) | 예측과 정답의 상관 | 네 칸을 다 쓰므로 불균형이 값을 부풀리지 않는다 |

<mark>precision과 recall은 서로 맞바꾸는 관계이고, 어느 쪽을 원하는지는 모델의 성질이 아니라 문제의 성질이다.</mark> 화합물 100만 개에서 assay할 100개를 고르는 상황이면 precision, 놓치면 안 되는 안전성 문제를 걸러내는 상황이면 recall.

## 불균형에서의 정확도, 그리고 ROC-AUC가 경고하지 않는 이유

<figure>
<img src="/assets/fig/metrics-imbalance.svg" alt="ROC curves, precision-recall curves and the three numbers side by side as the positive rate falls" loading="lazy" />
<figcaption><b>같은 분류기, 양성 비율만 셋.</b> 이 글을 쓰면서 계산했다. 모델의 성능은 고정하고 클래스 균형만 바꿨다. <b>(A)</b> ROC 곡선은 거의 움직이지 않는다. <b>(B)</b> precision–recall은 무너진다. <b>(C)</b> 회색 막대는 매번 "음성"이라고 답했을 때의 정확도.</figcaption>
</figure>

그 실행에서 나온 수치다. ROC-AUC는 receiver operating characteristic 곡선 아래 면적이고, 평균 정밀도는 precision–recall (PR) 곡선을 임계값마다의 precision을 recall 증가분으로 가중 평균해 요약한 값이다. 사다리꼴 면적이 아니며, 그래서 같은 곡선에 `average_precision_score`와 `auc`를 쓰면 값이 다르게 나온다.

| 양성 비율 | ROC-AUC | 평균 정밀도 | "항상 음성"의 정확도 |
| --- | --- | --- | --- |
| 50% | 0.832 | 0.826 | 0.500 |
| 9% | 0.846 | 0.416 | 0.909 |
| 1% | **0.879** | **0.148** | **0.990** |

여기서 세 가지가 따라온다.

**정확도가 의미를 잃는다.** 양성이 1%면 무조건 "아니요"라고 답하는 모델이 99% 정확하다. 보고된 정확도에서 정보가 되는 부분은 다수 클래스 비율과의 차이뿐이다.

**ROC-AUC는 떨어지지 않는다. 오히려 올라간다.** TPR (true positive rate)과 FPR (false positive rate)로 만들어지는데 FPR의 분모에 큰 음성 집단이 들어가 있어서, 음성을 더해도 거의 움직이지 않는다. <mark class="blue">ROC-AUC는 클래스 균형에 거의 불변인데, 장점처럼 들리지만 과제가 어려워졌다는 걸 알려 주지 못한다는 뜻이다.</mark>

**평균 정밀도는 0.83 → 0.15로 무너진다.** precision의 분모에는 FP가 있고 희석해 줄 TN이 없어서, 더해지는 음성을 전부 느낀다. 실제로 겪게 될 상황을 따라가는 숫자가 이쪽이다.

그래서 — **양성이 드물면 ROC-AUC와 함께 PR-AUC (precision–recall 곡선 아래 면적)를 보고한다.** 그리고 PR의 기준선은 양성 비율 (여기서는 0.01)이고 ROC의 기준선은 항상 0.5라는 걸 기억한다.

**MCC**가 숫자 하나로 가는 대안이다. 네 칸을 다 쓰고 양쪽 클래스 모두에서 잘해야 높아지므로, 불균형에서 올바른 단일 요약이다.

## 임계값에 의존하느냐 아니냐

| 임계값에 의존 | 의존하지 않음 |
| --- | --- |
| 정확도, precision, recall, F1, MCC | ROC-AUC, PR-AUC |

임계값 없는 지표는 모든 절단점에 걸친 모델의 순위 능력을 요약한다. 아직 임계값을 고르지 않았다면 그게 맞다. 임계값 있는 지표는 배포했을 때 무슨 일이 일어나는지를 답한다. 앞의 것만 보고하고 뒤의 것으로 배포하는 것이 좋은 ROC-AUC가 실망스러운 시스템이 되는 경로다.

그리고 둘 다 확률이 뜻이 있는지는 말해 주지 않는다. 순위는 완벽한데 **보정 (calibration)** 이 엉망일 수 있다. "0.8"이 80%의 빈도로 일어나지 않는다면 그 점수는 확률이 아니라 순위다. 확인은 [calibration curve](../plots/#domain)로 하고, 숫자가 정렬이 아니라 의사결정에 들어간다면 반드시 봐야 한다.

## 회귀

<figure>
<img src="/assets/fig/metrics-regression.svg" alt="One outlier moving RMSE far more than MAE, and Pearson against Spearman on a monotone non-linear relationship" loading="lazy" />
<figcaption><b>겉치레가 아닌 두 선택.</b> <b>(A)</b> 나쁜 예측 하나를 더하면 RMSE는 0.36 → 0.65, MAE는 0.29 → 0.33. <b>(B)</b> 단조이지만 비선형인 관계에서 Pearson은 0.86, Spearman은 0.96. 이 글을 쓰면서 계산했다.</figcaption>
</figure>

| 지표 | 성질 |
| --- | --- |
| **RMSE** (root mean squared error) | 오차를 제곱하므로 나쁜 예측 하나가 지배한다. 분자 머신러닝 쪽 관례 |
| **MAE** (mean absolute error) | 오차에 선형. 이상치에 강하다. 양자화학 쪽의 관례 |
| R² | 설명된 분산 비율. 테스트셋의 퍼짐에 의존하므로 데이터셋 간 비교 불가 |
| Pearson | 선형 일치 |
| Spearman | 순위 일치 — 순서만 필요할 때 맞는 것 |

RMSE냐 MAE냐는 이상치를 어떻게 볼 것인가의 선택이다. **나쁜 예측 하나가 재앙이면 RMSE가 맞고, 여러 화합물 중 하나가 틀린 정도라면 MAE가 전형적인 양상을 더 잘 기술한다.** 둘 다 보고하는 건 공짜이고, 그 둘의 간격이 꼬리가 얼마나 두꺼운지를 읽는 사람에게 알려 준다.

Pearson과 Spearman도 같은 종류의 선택이다. 가상 스크리닝에서는 상위 100개를 가져갈 것이므로 중요한 건 순위 일치이고, 비선형이지만 단조인 모델은 괜찮다. 패널 B가 그 경우다. Pearson은 벌점을 주고 Spearman은 주지 않는다.

## 벤치마크마다 기대하는 것

관례가 존재하는 이유는 숫자를 비교 가능하게 하기 위해서이고, 말없이 관례를 벗어나면 비교가 깨진다.

| 벤치마크 | 지표 | 이유 |
| --- | --- | --- |
| MoleculeNet 분류 (BBBP, BACE, Tox21, SIDER…) | **ROC-AUC** | 불균형에도 불구하고 굳어진 관례 |
| MoleculeNet 회귀 (ESOL, FreeSolv, Lipophilicity) | **RMSE** | |
| 양자화학 데이터셋 (QM7/8/9) | **MAE** | |
| MoleculeACE | **RMSE**, cliff 부분집합 따로 | [activity cliff](../activity-cliff-ko/) 참고 |
| 가상 스크리닝 | enrichment factor, BEDROC (Boltzmann-enhanced discrimination of ROC) | 순위 상단에 가중한다. 사람들이 보는 곳이 거기뿐이라서 |
| 다중 과제 (ToxCast, 617개) | 과제 평균 | **과제별 ROC-AUC의 평균인지 통합 ROC-AUC 하나인지 밝혀야 한다** — 다르다 |

마지막 줄이 비교 불가능한 숫자가 생기는 실제 원인이고, 논문이 어느 쪽인지 안 밝히는 경우가 흔하다.

## 정리

- 지표를 고르기 전에 **오류의 대가**를 정한다. precision과 recall은 맞바꾸는 관계이고, 어느 쪽인지는 문제의 성질이다
- **불균형에서 정확도는 의미가 없다.** 믿기 전에 다수 클래스 비율과 비교한다
- **ROC-AUC는 클래스 균형에 거의 불변이다.** 0.83 → 0.88로 올라가는 동안 평균 정밀도는 0.83 → 0.15
- 양성이 드물면 **PR-AUC를 ROC-AUC와 함께** 보고한다. PR의 기준선은 0.5가 아니라 양성 비율이다
- **MCC**는 불균형이 값을 부풀리지 않는 단일 숫자다
- 임계값 없는 지표는 순위를, 있는 지표는 배포를 기술한다. **보정**은 또 다른 세 번째다
- **RMSE는 이상치를 벌하고 MAE는 전형을 기술한다.** 둘 다 보고한다. 순서만 중요하면 **Spearman**
- 벤치마크 관례를 따르고, 다중 과제 숫자가 과제별 ROC-AUC의 평균인지 통합 ROC-AUC 하나인지 밝힌다

## 참고

- Saito & Rehmsmeier, [The precision-recall plot is more informative than the ROC plot when evaluating binary classifiers on imbalanced datasets](https://doi.org/10.1371/journal.pone.0118432), *PLoS ONE* (2015)
- Chicco & Jurman, [The advantages of the Matthews correlation coefficient (MCC) over F1 score and accuracy in binary classification evaluation](https://doi.org/10.1186/s12864-019-6413-7), *BMC Genomics* (2020)
- Wu et al., [MoleculeNet: a benchmark for molecular machine learning](https://doi.org/10.1039/C7SC02664A), *Chem. Sci.* (2018) — 관례의 출처
- Truchon & Bayly, [Evaluating virtual screening methods: good and bad metrics for the early recognition problem](https://doi.org/10.1021/ci600426e), *J. Chem. Inf. Model.* (2007) — BEDROC
