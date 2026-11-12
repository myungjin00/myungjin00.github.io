---
title: "hyperparameter 고르기: grid search, random search, 베이지안 최적화"
date: 2026-02-27
description: "이 설정값들을 gradient descent로 배울 수 없는 이유 · 진짜 제약은 budget이다 · grid search가 budget을 낭비하는 방식 · surrogate와 acquisition function이 실제로 하는 일 · 탐색은 validation set에서만"
category: concept
updated: 2026-03
lang: ko
group: hyperparameter-search
topic: Machine learning
subtopic: Evaluation
tags: [hyperparameter search, Bayesian optimisation, Gaussian process, grid search]
---

[분자 성질 예측](../mpp-ko/) 모델을 튜닝할 때 설정값은 한 번 정하고 잊는 것이 아니다. [MoleculeACE](../activity-cliff-ko/) 벤치마크에서는 데이터셋마다 Gaussian process 기반 베이지안 최적화를 trial 50개 정도의 budget으로 돌린다. 이 한 줄에 방법의 대부분이 숨어 있다.

## 이건 학습이 아니다

**파라미터** (parameter)는 학습으로 정해진다. **hyperparameter** (HP)는 학습을 시작하기 전에 사람이 넘겨주는 설정값이고, 같은 방식으로 배울 수 없는 이유는 구조적이다. 최대화하고 싶은 값은 validation 점수인데, validation 점수는 학습률이나 층 수에 대해 미분되지 않는다. 따라갈 gradient가 없다.

| | parameter | hyperparameter |
| --- | --- | --- |
| 예 | 가중치, 편향 | 학습률, 깊이, weight decay, batch 크기 |
| 정하는 방법 | 학습 손실에 대한 gradient descent | validation 점수를 보고 탐색 |
| 한 번 갱신하는 비용 | mini-batch 한 개 | **학습 한 판 전체** |
| 개수 | 수백만 개 | 몇 개 |

표의 마지막 두 줄이 문제의 전부다. 후보 설정 하나를 평가하려면 학습을 끝까지 한 번 돌려야 하므로, 진짜 제약은 막연한 연산량이 아니라 감당할 수 있는 **trial** 개수다. trial *n* 개가 주어졌을 때, 어디에 쓸 것인가.

## grid search, 그리고 budget을 낭비하는 방식

grid search는 knob마다 값 목록을 받아 모든 조합을 돌린다. knob 4개에 값 5개씩이면 $5^4 = 625$ 번이다. knob을 하나 더 얹으면 3,125번이 된다. 한 번 돌리는 데 20분이면 625번은 GPU 한 장으로 9일쯤이다.

조합이 폭발한다는 건 바로 떠오르는 반박인데, 격자를 거칠게 잡으면 피할 수 있다. 거칠게 잡아도 남는 문제는 이쪽이다.

<mark class="blue">hyperparameter의 대부분은 성능을 바꾸지 않는데, grid는 바꾸지 않는 쪽에 바꾸는 쪽과 똑같은 수의 trial을 쓴다.</mark>

625번 격자에서 학습률만 점수를 실제로 움직인다고 해 보자. 격자가 시도한 학습률은 정확히 **5개** 고, 나머지 620번은 아무 차이도 없는 설정 아래에서 같은 5개 값을 다시 확인한 것이다. trial 625개를 쓰고 정작 중요한 축은 5개 지점만 훑었다.

## random search가 grid search보다 낫다

Bergstra & Bengio의 결과는 흔히 "random이 운이 좋다"로 요약되는데 그게 아니다. 핵심은 축마다의 커버리지다. hyperparameter를 각각 독립적으로 뽑아 trial *n* 개를 돌리면, **개별 파라미터마다** 서로 다른 값 *n* 개를 보게 된다. 각 축에 $n^{1/4}$ 개가 아니다.

| budget | grid (knob 4개) | random |
| --- | --- | --- |
| trial 625개 | 서로 다른 학습률 5개 | 서로 다른 학습률 625개 |
| trial 16개 | 서로 다른 학습률 2개 | 서로 다른 학습률 16개 |

<figure>
<img src="/assets/fig/random-vs-grid.svg" alt="가로축만 점수에 영향을 주는 점수 지형 위에 4x4 격자와 random 16점을 찍은 그림" loading="lazy" />
<figcaption><b>격자는 중요한 축의 값을 네 개 시도하고, random은 열여섯 개를 시도한다.</b> 색이 점수이고, 점수를 움직이는 건 가로축뿐이다. 이 seed에서는 둘이 비긴다. random 0.986, 격자 0.985인데, 격자의 한 열이 우연히 최적점에서 0.015 떨어진 자리에 놓였기 때문이다. 최적점 위치를 무작위로 바꿔 가며 2,000번 반복하면 random이 74% 이기고, 최고 점수 평균은 random 0.92 대 격자 0.76이다. 격자의 네 열은 미리 고정되어 있어서 최적점이 열 사이에 떨어지면 budget을 아무리 늘려도 찾지 못한다.</figcaption>
</figure>

점수가 축 한두 개에 주로 좌우된다면 — 보통 그렇다 — random search는 중요한 축의 좋은 값을 찾아낸다. 게다가 격자가 거의 무의미해지는 작은 budget에서도 그렇다. 실무적으로 두 가지가 더 있다. random search는 미리 모양을 정해 둘 필요가 없어서 중간에 끊어도 그때까지가 그대로 유효한 탐색이고, 준비 비용이 0이다. **따로 뭘 준비할 시간이 없으면 random search가 맞는 기본값이다.**

## 베이지안 최적화

random search는 자기 결과를 버린다. 40번째 trial은 1~39번 trial을 전혀 기억하지 않고 뽑힌다. 베이지안 최적화는 자기 이력을 읽는 버전이고, 부품이 딱 두 개다.

### surrogate

비싼 것을 대신하는 값싼 모델이다. 비싼 것은 "이 설정으로 학습을 돌려 validation 점수를 내놓기"이고, surrogate는 그 점수를 hyperparameter의 함수로 예측하는 회귀 모델이며 지금까지 돌린 trial들로 학습된다. 값이 싸니까 후보 설정 수천 개에서 공짜로 평가해 볼 수 있다. 예측값 옆에 **불확실성**을 함께 내놓고, 그게 다음 단계를 가능하게 한다.

### acquisition function

surrogate가 있을 때 다음 trial은 어디서 돌려야 하나. 서로 반대로 당기는 답이 둘 있다. **exploitation** (활용)은 surrogate가 가장 좋은 점수를 예측하는 곳으로 가라고 한다. **exploration** (탐색)은 surrogate가 확신하지 못하는 곳으로 가라고 한다. 거기가 예측이 틀렸을 수 있는 곳이고, 아직 뜻밖의 결과가 남아 있는 곳이니까. exploitation만 하면 지금까지의 최고 trial 옆에 갇히고, exploration만 하면 random search가 된다.

**acquisition function**은 이 절충을 하나의 숫자로 정리한다. 후보 설정마다 예측값과 불확실성을 함께 써서 점수를 매기고, 다음 trial은 그 점수가 가장 높은 곳으로 간다. 가장 많이 쓰는 것이 **expected improvement** (EI, 기대 개선량)인데, 어떤 후보가 지금까지의 최고 점수보다 얼마나 더 좋을 것으로 기대되는지를 surrogate의 예측 분포 위에서 평균해 계산하고, 개선이 없는 경우는 0으로 센다. EI에게 매력적인 설정은 예측 점수가 높은 곳이거나, 오차 범위가 넓어서 현재 최고치를 넘어설 여지가 있는 곳이다.

### Gaussian process surrogate

**Gaussian process** (GP)가 표준 surrogate다. trial들을 지나는 함수 하나를 맞추는 대신, 그 trial들과 어긋나지 않는 함수들의 분포를 맞춘다. 그래서 아직 안 돌려 본 설정마다 평균과 표준편차를 돌려주는데, 이미 돌려 본 설정 근처에서는 좁고 멀어지면 넓어진다. 이 오차 범위는 덤이 아니다. EI가 필요로 하는 바로 그 값이고, 그래서 GP와 EI가 자연스럽게 한 쌍이 된다.

GP에 대해 알아야 할 것이 두 가지다. 연속적인 파라미터를 잘 다룬다. 학습률이나 dropout 비율이 바로 그런 값이다. 그리고 규모가 커지면 약하다. GP를 한 번 맞추는 비용이 trial 수의 3제곱이라서, 수백 trial을 넘기면 그쪽이 병목이 된다. budget이 trial 50개쯤이면 이 한계는 아무 의미가 없고, 그래서 trial 하나가 fine-tuning 한 판인 벤치마크에서 GP는 합리적인 선택이 된다.

### TPE

**TPE** (tree-structured Parzen estimator)는 Optuna의 기본값이자 실무적인 대안이다. hyperparameter를 받아 점수를 예측하는 대신 방향을 뒤집는다. 지난 trial들을 좋은 쪽과 나머지로 가른 뒤 각각에 밀도를 맞추고, 좋은 쪽 밀도에서는 나올 법하고 나머지 쪽에서는 나오기 어려운 설정을 선호한다. TPE를 쓰는 이유는 구조에 있다. **범주형** (어떤 optimiser, 어떤 pooling)과 **조건부** (attention 블록일 때만 head 수가 존재한다) 파라미터를 GP보다 훨씬 매끄럽게 다룬다. GP의 공분산 함수는 거리 개념을 요구하는데 범주에는 거리가 없다.

## 어느 것을 언제

| 방법 | 고르는 방식 | 맞는 budget | 범주형 | 언제 맞나 |
| --- | --- | --- | --- | --- |
| **grid** | 고정 목록의 모든 조합 | 작게, knob 2개까지 | 가능 | 전수 탐색을 보고해야 할 때, 또는 값이 3개뿐인 knob 하나만 움직일 때 |
| **random** | 각 범위에서 독립적으로 뽑기 | 아무 크기, 중간에 끊어도 됨 | 가능 | 기본값. 준비가 필요 없고 중요한 축이 적을 때 강하다 |
| **베이지안, GP** | surrogate + acquisition function, 연속형 | 20~200 | 약하다 | trial이 비싸고 knob이 대체로 연속형일 때 — trial 50개짜리 내 경우 |
| **베이지안, TPE** | 좋은 trial과 나머지의 밀도 | 50~1,000 | 가능 | 범주형·조건부가 섞인 탐색 공간. Optuna의 무난한 기본값 |
| **Hyperband / successive halving** | 많이 시작해 약한 것을 일찍 끊기 | 크게, 부분 평가 비용이 낮을 때 | 가능 | 나쁜 설정이 몇 에폭 (epoch) 만에 드러나서 대부분의 trial을 끝까지 안 돌릴 때 |

Hyperband는 경쟁자가 아니라 축이 다르다. 다음에 어떤 trial을 돌릴지가 아니라 각 trial을 **얼마나 오래** 돌릴지를 정하고, 설정을 고르는 TPE나 GP와 같이 쓸 수 있다.

## 스스로를 속이지 않는 방법

탐색은 선택 절차이므로 [모델 평가](../evaluation-protocol-ko/)와 같은 규율이 그대로 적용된다.

**탐색은 validation set에서 돌린다. test set은 맨 마지막에 한 번만 본다.** hyperparameter 탐색은 선택 절차이고, 선택에 쓰인 세트는 편향 없는 추정치이기를 그만둔다. test set에서 탐색하면 그건 두 번째 validation set이 된 것이고, 보고된 점수는 열심히 탐색한 만큼 부풀어 있다. 부풀어 오르는 정도는 budget과 함께 커지므로, test set으로 점수를 매긴 trial 200개는 20개보다 나은 게 아니라 더 나쁘다. 교차검증 (cross-validation, CV)에서는 이 규칙의 모양이 구체적이다. 탐색은 fold 안쪽 루프에 들어가고, 바깥 루프는 점수만 낸다.

**탐색 공간과 budget을 같이 적는다.** trial 500개에서 나온 결과는 20개에서 나온 결과와 비교할 수 없고, 애초에 좋은 설정 근처에 잡혀 있던 공간에서 나온 결과와도 비교할 수 없다. 공간과 trial 수가 없으면 그 표는 성능 표가 아니라 탐색량 표다.

**고른 설정을 여러 seed로 다시 돌린다.** <mark>탐색의 최고 trial은 운 좋은 seed의 몫이 섞여 있고, 그래서 그 점수는 noise가 섞인 값들의 최댓값이 늘 그렇듯 위로 치우쳐 있다.</mark> 설정을 고정한 뒤 여러 seed로 다시 돌려 평균 ± 표준편차로 보고한다. [seed 이야기](../evaluation-protocol-ko/)는 다른 어디보다 여기서 더 강하게 적용된다. 최댓값을 고르는 행위 자체가 치우침을 만들기 때문이다.

## 무엇을 탐색하고 무엇을 그냥 두는가

| knob | 탐색하나 | 어떻게 |
| --- | --- | --- |
| [학습률](../training-basics-ko/) | **항상** | log 스케일, 예를 들어 $10^{-5}$~$10^{-2}$ — 선형 범위는 뽑은 값 대부분을 너무 큰 쪽에 버린다 |
| weight decay, dropout | 대개 | decay는 log 스케일, dropout은 선형 |
| batch 크기 | 뒤로 | 생각보다 영향이 작고, 영향이 있어도 주로 학습률과의 상호작용으로 나타난다 |
| 너비, 깊이 | 뒤로 | 몇 개 후보면 충분하다. 표현력이 학습률보다 크게 작용하는 일은 드물다 |
| 에폭 수 | **아니다** | validation 손실에 대한 [early stopping](../training-basics-ko/)으로 처리한다. 설정마다 알아서 맞춰 주므로 하나의 숫자를 전부에 강요하지 않는다 |

에폭 수를 탐색하는 것이 흔한 낭비다. early stopping이 공짜로 정해 주는 양을 trial을 쓰는 축으로 바꿔 놓고, 학습률과의 상호작용이 심해서 그 결과가 다음 설정으로 옮겨가지도 않는다.

어떤 알고리즘도 못 고치는 실패가 하나 있다. **잘못 잡은 공간에서의 탐색은 나쁜 공간의 최적점을 찾아낸다.** 학습률 범위가 $10^{-1}$~$1$ 이면 여기 나온 모든 방법이 자신 있게 $10^{-1}$ 을 돌려줄 것이다. 고른 값이 범위의 끝에 붙어 있다면, 범위가 틀렸다고 탐색이 알려 주는 것이다.

## 직접 돌려 보기

`optuna`는 이 전부를 함수 하나와 sampler 교체로 해 준다. 아래 목적 함수는 5-fold CV 점수를 돌려주므로 trial 하나가 모델 다섯 개를 학습하고, sampler 세 개에 똑같이 trial 50개의 budget을 준다.

```python
import optuna
from sklearn.datasets import load_breast_cancer
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.model_selection import StratifiedKFold, cross_val_score

X, y = load_breast_cancer(return_X_y=True)
cv = StratifiedKFold(5, shuffle=True, random_state=0)

def objective(trial):
    model = HistGradientBoostingClassifier(
        learning_rate=trial.suggest_float("learning_rate", 1e-3, 3e-1, log=True),
        max_leaf_nodes=trial.suggest_int("max_leaf_nodes", 4, 64),
        min_samples_leaf=trial.suggest_int("min_samples_leaf", 5, 50),
        early_stopping=True, random_state=0)
    return cross_val_score(model, X, y, cv=cv, scoring="roc_auc").mean()

optuna.logging.set_verbosity(optuna.logging.WARNING)
for name, sampler in [("TPE", optuna.samplers.TPESampler(seed=0)),
                      ("GP", optuna.samplers.GPSampler(seed=0)),
                      ("random", optuna.samplers.RandomSampler(seed=0))]:
    study = optuna.create_study(direction="maximize", sampler=sampler)
    study.optimize(objective, n_trials=50)
    print(name, round(study.best_value, 4), study.best_params)
```

```
TPE 0.9956 {'learning_rate': 0.28405152738900497, 'max_leaf_nodes': 60, 'min_samples_leaf': 36}
GP 0.9957 {'learning_rate': 0.17122461323998883, 'max_leaf_nodes': 33, 'min_samples_leaf': 50}
random 0.9949 {'learning_rate': 0.1895264927209976, 'max_leaf_nodes': 47, 'min_samples_leaf': 50}
```

sampler 세 개가 0.001 안쪽에 몰려 있다. 이 데이터셋이 쉬워서 어지간한 설정이면 0.99를 넘기기 때문이고, sampler는 표면이 평평하지 않을 때나 제값을 한다. 최고 설정 셋은 `max_leaf_nodes`에서는 서로 완전히 어긋나면서 학습률이 0.2 근처라는 데는 일치하는데, 이게 "hyperparameter의 대부분은 성능을 바꾸지 않는다"가 실제 실행에서 드러난 모습이다. 그리고 CV 점수 한 번에서 sampler 사이 0.0008 차이는 seed noise 안쪽이라 결과가 아니다. sampler 순위를 말하려면 이쪽도 여러 seed로 돌려야 한다. 스크립트 전체가 CPU로 5분쯤 걸리고, Optuna 4.7에서 `GPSampler`는 아직 실험적 API 경고를 띄운다.

## 정리

- hyperparameter는 validation 점수가 그에 대해 미분되지 않아 gradient descent로 배울 수 없다. 평가 한 번이 학습 한 판이므로 제약은 trial 단위의 budget이다
- grid search는 조합이 폭발하고 — knob 4개 × 값 5개 = 625번 — 더 나쁘게는 중요하지 않은 knob에 중요한 knob과 같은 수의 trial을 쓴다
- random search는 trial *n* 개로 **각** 파라미터의 서로 다른 값 *n* 개를 본다. 같은 budget에서 grid를 이기는 이유이고, 준비도 필요 없다
- 베이지안 최적화 = 점수와 불확실성을 함께 예측하는 **surrogate** + exploitation과 exploration을 절충하는 **acquisition function** (예: expected improvement)
- Gaussian process surrogate는 연속형 knob에 강하고 수백 trial까지 쓸 수 있어 trial 50개 budget에 맞는다. 범주형·조건부 공간은 TPE가 낫다
- validation set에서 탐색하고 test set은 한 번만 보며, 탐색 공간과 budget을 적고, 뽑힌 설정은 여러 seed로 다시 돌린다
- 학습률은 log 스케일로 탐색하고, batch 크기와 너비는 뒤로 미루고, 에폭 수는 early stopping에 맡긴다

## 참고

- Bergstra & Bengio, [Random search for hyper-parameter optimization](https://jmlr.org/papers/v13/bergstra12a.html), *JMLR* (2012) — 같은 budget에서 random이 grid를 이기는 이유
- Snoek et al., [Practical Bayesian optimization of machine learning algorithms](https://arxiv.org/abs/1206.2944), *NeurIPS* (2012) — Gaussian process + expected improvement 조합
- Akiba et al., [Optuna: a next-generation hyperparameter optimization framework](https://arxiv.org/abs/1907.10902), *KDD* (2019) — 위에서 쓴 라이브러리, 기본 sampler가 TPE
- Li et al., [Hyperband: a novel bandit-based approach to hyperparameter optimization](https://jmlr.org/papers/v18/16-558.html), *JMLR* (2018) — 약한 trial을 일찍 끊어 budget을 배분하는 방법
