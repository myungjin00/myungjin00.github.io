---
title: "클래스 불균형: 모델이 다수 클래스만 배우고 끝날 때"
date: 2025-02-14
description: "양성 비율 3.5%가 모델에 하는 일 · 손댈 수 있는 세 곳과 그것들이 서로 대체재가 아닌 이유 · resampling, class weight, focal loss · SMOTE가 분자에 안 맞는 이유 · 아무도 안 건드리는 threshold · 그리고 불균형 자체가 목적인 경우"
category: concept
updated: 2025-03
lang: ko
group: class-imbalance
topic: Machine learning
subtopic: Evaluation
tags: [class imbalance, metrics, molecular property prediction]
---

불균형에서 무엇을 *재는가*는 [성능지표](../metrics-ko/)에서 다뤘다. ROC-AUC (area under the receiver operating characteristic curve)는 양성이 드물어진 것을 거의 눈치채지 못하고 PR-AUC (area under the precision–recall curve)는 알아차린다. 이 글은 나머지 절반이다. 재고 나서 무엇을 하는가.

## 문제의 모양

배포된 MoleculeNet 파일에서 직접 센 수다. 표준 예시 둘.

| 데이터셋 | 분자 수 | 양성 수 | 양성 비율 |
| --- | --- | --- | --- |
| HIV | 41,127 | 1,443 | **3.5%** |
| Tox21, 12개 과제 | 7,831 | 과제별 186–942 | 과제별 **2.9%에서 16.2%**, 통합 7.5% |

HIV에서 모든 분자에 "비활성"이라고 답하는 모델은 정확도 96.5%이고 아무것도 찾지 못했다. Tox21은 보이는 것보다 더 나쁜데, 라벨 칸의 17%가 비어 있기 때문이다. 양성이 가장 적은 과제 (NR-PPAR-gamma, 라벨이 있는 6,450개 중 양성 186개)는 불균형하면서 동시에 작다.

loss 곡선은 이걸 알려 주지 않는다. 학습은 잘 수렴하고 정확도는 높은데, 모델이 배운 것은 prior다.

## 손댈 수 있는 세 곳

| 어디 | 수단 | 무엇을 바꾸나 | 대가 |
| --- | --- | --- | --- |
| **데이터** | oversampling, undersampling, SMOTE | 모델이 학습하는 분포 | 표본을 복제하거나 지어내거나, 실제 데이터를 버린다 |
| **loss** | class weight, weighted cross-entropy, focal loss | 각 표본이 gradient에 기여하는 정도 | 출력 확률이 calibration을 잃는다 |
| **결정** | validation에서 고른 threshold | 점수를 읽는 방식만 | 모델 쪽 비용은 없다. validation 데이터와 운용 지점이 필요하다 |

<mark>이 셋은 같은 일을 하는 세 가지 방법이 아니다.</mark> 앞의 둘은 모델이 배우는 내용을 바꾸고, 세 번째는 모델을 전혀 건드리지 않고 출력을 어디서 자를지만 옮긴다. 그래서 겹쳐 쓸 수 있고, 사람들이 빠뜨리는 쪽은 세 번째다. 공짜인 것도 그쪽뿐이다.

## 데이터

**random oversampling**은 클래스가 같아질 때까지 소수 클래스 표본을 복사한다. 복사본이 원본과 똑같으니 자유도가 큰 모델은 그걸 외워 버리고, 학습 점수는 올라가는데 validation 점수는 내려간다.

**random undersampling**은 반대로 다수 클래스를 버린다. HIV라면 실제 측정 39,684개 중 대부분을 버리고 1,443개에 맞추는 것인데, 이 정도 크기의 데이터셋에서는 버리는 데이터가 얻는 균형보다 비싸다.

**SMOTE** (synthetic minority over-sampling technique)는 보간해서 만든다. 소수 클래스 점 하나를 잡고 가장 가까운 소수 클래스 이웃 중 하나를 골라, 둘을 잇는 선분 위 어딘가에 새 점을 만든다. 표 형태 feature에서는 잘 작동하고, **분자에는 잘 맞지 않는다.** [fingerprint](../descriptors-fingerprints-ko/)는 부분구조가 있는지를 담은 비트 벡터인데, 두 fingerprint의 중간점은 비트가 소수로 나오고 어떤 분자에도 대응하지 않는다. 학습된 embedding도 마찬가지다. 보간된 벡터는 feature 공간 안에 있지만 화학 공간 안에는 없고, 결국 합성 자체가 불가능한 점들로 활성과 비활성을 가르는 법을 모델에 가르친 셈이 된다. feature가 연속적인 물리화학 디스크립터라면 이 반론이 약해지지만, 그래도 약물 두 개의 중간점은 약물이 아니다.

셋 모두에 걸리는 규칙 하나. **resampling은 fold 안에서 한다. split 전에는 절대 하지 않는다.** 먼저 oversampling하면 같은 분자의 복사본이 train과 test에 나뉘어 들어가는데, [모델 평가](../evaluation-protocol-ko/)에서 다룬 중복 누수가 바로 이것이고 표본 수까지 부풀려져 점수가 안정적으로까지 보인다. `sklearn`으로 말하면 resampler를 pipeline에 넣고 그 pipeline을 CV (cross-validation) 루프 안에 넣는다.

## loss

더 싸고 보통 더 낫다. 데이터는 그대로 두고 오류 하나의 대가를 바꾼다.

**class weight**는 각 클래스의 loss 항에 상수를 곱한다. 관례적으로 빈도의 역수를 쓴다. `sklearn`의 `class_weight='balanced'`와 `BCEWithLogitsLoss`의 `pos_weight`가 이것이다. 인자 하나로 끝나고, MoleculeNet 분류 데이터셋에서는 제일 먼저 해 볼 만한 것이다.

**focal loss**는 질문을 다르게 잡는다. 클래스 단위 가중은 모든 양성을 똑같이 중요하게 보지만, 불균형한 batch에서 loss의 대부분은 모델이 이미 맞히고 있는 쉬운 음성 다수에서 나온다. focal loss는 그쪽의 비중을 낮춘다.

$$
\mathrm{FL}(p_t) = -(1 - p_t)^{\gamma} \log p_t
$$

$p_t$는 정답 클래스에 대한 예측 확률이다. $\gamma = 0$이면 평범한 cross-entropy다. $\gamma > 0$이면 $(1-p_t)^\gamma$가 $p_t$가 이미 1에 가까운 곳에서 0으로 줄어들어, 모델이 확신하며 맞히는 표본은 거의 기여하지 않고 gradient가 어려운 쪽으로 몰린다. 출발점으로는 보통 $\gamma = 2$를 쓴다.

두 수단이 공유하는 부작용을 여기서 미리 적어 둔다. 양성이 얼마나 흔한지에 대한 모델의 감각을 바꾸므로, 모델이 내놓는 확률은 내가 가진 데이터의 확률이 아니게 된다.

## 결정 — 가장 과소평가된 곳

분류기가 내놓는 것은 클래스가 아니다. 점수를 내놓고, 0.5는 누군가 거기서 자르기로 정한 값이다. 균형 잡힌 문제에서는 이 관례가 무해하지만, 양성 비율 3.5%에서는 precision과 recall을 말없이 정해 버리는 임의의 선택이다.

<mark class="blue">실제로 필요한 운용 지점에 맞춰 validation set에서 threshold를 고르는 것이 어떤 resampling 기법보다 나은 경우가 흔하고, 비용은 이미 가진 데이터를 한 번 더 통과시키는 것뿐이다.</mark>

감당할 수 있는 recall을 정하고, 그 recall에서 가능한 가장 좋은 precision을 가져온다.

```python
import numpy as np
from sklearn.datasets import make_classification
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import precision_recall_curve, precision_score, recall_score

X, y = make_classification(n_samples=20000, weights=[0.97], flip_y=0.01, random_state=0)
Xtr, Xtmp, ytr, ytmp = train_test_split(X, y, test_size=0.4, stratify=y, random_state=0)
Xva, Xte, yva, yte = train_test_split(Xtmp, ytmp, test_size=0.5, stratify=ytmp, random_state=0)
m = LogisticRegression(max_iter=1000).fit(Xtr, ytr)

# threshold는 validation에서, 감당할 수 있는 recall에 맞춰 고른다
p, r, t = precision_recall_curve(yva, m.predict_proba(Xva)[:, 1])
ok = r[:-1] >= 0.50
thr = t[ok][np.argmax(p[:-1][ok])]

s = m.predict_proba(Xte)[:, 1]
for name, cut in (("default", 0.5), ("tuned", thr)):
    yh = s >= cut
    print(name, round(cut, 3), round(precision_score(yte, yh), 3), round(recall_score(yte, yh), 3))

# default 0.5   precision 0.911  recall 0.295
# tuned   0.162 precision 0.425  recall 0.532
```

같은 모델, 같은 점수, 그 점수를 읽는 방식만 둘이다. 기본 threshold가 조용히 recall 0.295를 골랐다. 양성의 3분의 1도 못 찾는다는 뜻이고, 스크리닝에서는 아무도 보고하지 않은 실패다. 절단점을 0.162로 옮기면 recall이 거의 두 배가 되고 그 값을 precision으로 치른다. 둘 중 어느 줄이 그냥 더 좋은 것은 아니다. 요점은 0.5가 애초에 결과가 아니었다는 것, 그리고 이 선택을 의도적으로 해야 한다는 것이다.

threshold도 파라미터이므로 validation 데이터에서 고르고 test에서는 절대 고르지 않는다. test에서 threshold를 맞추는 것은 test로 early stopping하는 것과 같은 잘못이다.

## 대가

resampling과 가중은 둘 다 양성이 얼마나 흔한지를 모델에게 거짓으로 알려 주는 방식으로 작동하고, 모델은 그걸 믿는다. 어느 쪽이든 쓰고 나면 예측값 0.8은 80%를 뜻하지 않는다. 점수가 적용한 배수만큼 소수 클래스 쪽으로 밀려 있다.

순위를 쓸 거라면 이건 전혀 문제가 안 된다. 화합물을 정렬해 상위를 가져갈 것이고, 단조 왜곡은 순서를 건드리지 않는다. 문제가 되는 건 그 숫자가 의사결정에 들어갈 때다. 위험도 추정, 비용을 반영한 선별, 출력을 다른 확률과 결합하는 모든 경우. **순위가 아니라 확률이 필요하다면 따로 떼어 둔 데이터에서 다시 calibration해야 한다.** 아니면 resampling을 건너뛰고 원래 prior를 유지한 채 threshold만 옮긴다.

## 불균형 자체가 목적인 경우

가상 스크리닝에서 양성이 드문 것은 데이터셋의 결함이 아니다. 그게 과제다. 화합물 10만 개 중에 활성이 정말로 몇 개뿐이고, 균형을 맞춘 데이터로 학습한 모델은 존재하지 않는 세계에 맞춰 학습한 것이다. confusion matrix가 깔끔해 보일 때까지 균형을 맞추는 것은 배포되지 않을 분포에 최적화하는 일이다.

그래서 스크리닝에서는 평범한 쪽이 보통 맞다. 데이터를 그대로 두고, 정확도 대신 PR-AUC와 enrichment를 보고하고, 실제로 assay할 수 있는 화합물 개수에 맞춰 threshold를 고른다. 소수 클래스의 gradient가 정말로 묻히고 있다면 class weight를 꺼내고, 분자에 SMOTE는 사실상 쓰지 않는다.

## 정리

- HIV는 양성 3.5%, Tox21은 과제별 2.9%에서 16.2%다. HIV에서 "항상 비활성"이 96.5%를 받는다
- 재는 쪽은 [성능지표](../metrics-ko/)의 몫이다. **ROC-AUC는 경고하지 않고 PR-AUC는 한다**
- 수단은 셋이고 서로 대체재가 아니다. **데이터, loss, 결정** — 그리고 겹쳐 쓸 수 있다
- oversampling은 복제하고 undersampling은 버리며, **SMOTE는 분자가 아닌 점으로 보간한다**
- resampling은 split 뒤, **fold 안에서** 한다. 아니면 누수를 직접 만든 것이다
- **class weight는 인자 하나**이고, focal loss는 $(1-p_t)^\gamma$를 붙여 gradient를 어려운 표본에 모은다
- **threshold가 빠뜨리는 수단이다.** validation에서, 필요한 운용 지점에 맞춰 고르고, test에서는 절대 고르지 않는다
- resampling과 가중은 **calibration을 깨뜨린다.** 순위에는 괜찮고 확률에는 안 괜찮다
- 가상 스크리닝에서는 불균형이 곧 과제다. 데이터를 그대로 두고 PR-AUC와 enrichment를 보고하고 threshold를 고른다

## 참고

- Chawla et al., [SMOTE: synthetic minority over-sampling technique](https://doi.org/10.1613/jair.953), *J. Artif. Intell. Res.* (2002) — 원 논문, 표 형태 데이터 기준
- Lin et al., [Focal loss for dense object detection](https://arxiv.org/abs/1708.02002), *arXiv:1708.02002* (2017) — $(1-p_t)^\gamma$의 출처
- Saito & Rehmsmeier, [The precision-recall plot is more informative than the ROC plot when evaluating binary classifiers on imbalanced datasets](https://doi.org/10.1371/journal.pone.0118432), *PLoS ONE* (2015)
- Wu et al., [MoleculeNet: a benchmark for molecular machine learning](https://doi.org/10.1039/C7SC02664A), *Chem. Sci.* (2018) — HIV·Tox21 라벨 파일의 출처
