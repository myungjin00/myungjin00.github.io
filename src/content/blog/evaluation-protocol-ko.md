---
title: "모델 평가: seed, 교차검증, split"
date: 2025-02-21
description: "숫자 하나는 결과가 아닌 이유 · random seed가 실제로 바꾸는 것과 몇 개를 돌려야 하는가 · hold-out과 k-fold와 nested CV · random split은 점수를 부풀리고 scaffold split은 그러지 않는다 · 데이터 누수 점검표"
category: concept
updated: 2025-03
lang: ko
group: evaluation
topic: Machine learning
subtopic: Evaluation
tags: [evaluation, cross-validation, scaffold split, leakage]
---

보고된 점수는 측정값이고, 절차 없는 측정값은 아무 의미가 없다. 숫자를 믿을 수 있는지는 세 가지가 결정한다. seed를 몇 개 돌렸는가, 데이터를 어떻게 나눴는가, 새어 나간 것이 있는가. <mark>이 분야에서 재현되지 않는 결과의 대부분은 모델이 아니라 이 셋 중 하나에서 무너진다.</mark>

## 숫자 하나는 결과가 아니다

같은 모델을 random seed만 바꿔 두 번 학습하면 점수가 다르게 나온다. 데이터가 작으면 seed 두 개 사이의 차이가 논문 두 편 사이의 차이보다 큰 일이 흔하다.

seed가 실제로 정하는 것:

| 원인 | 효과 |
| --- | --- |
| 가중치 초기화 | 출발점이 달라지고, 도달하는 국소 최적점도 달라진다 |
| 데이터 셔플 | mini-batch 구성이 달라진다 |
| split 자체 | split에 seed를 쓰면 train/test 구성이 통째로 바뀐다 |
| dropout, 데이터 증강 | 학습 중 noise가 달라진다 |
| GPU 비결정성 | 일부 CUDA kernel은 seed를 고정해도 비트 단위로 재현되지 않는다 |

GPU에서는 seed를 고정해도 deterministic kernel까지 켜지 않으면 완전히 같은 결과가 나오지 않고, 켜면 속도를 잃는다.

**그래서 seed를 여러 개 돌리고 평균 ± 표준편차로 보고한다.** 3개가 최소선이고 5~10개면 방어할 수 있다. 표준편차는 장식이 아니다. 0.005 차이가 진짜인지를 읽는 사람에게 알려 주는 수치다.

> 절대 하면 안 되는 것 하나. seed 10개를 돌려 그중 가장 좋은 것을 보고하는 것. 그건 test set을 보고 고른 것이고, 그 숫자는 더 이상 아무것도 추정하지 않는다. seed로 골랐다면 그렇게 밝히고 전부 보고해야 한다.

## hold-out, k-fold, nested

**hold-out** (한 번 떼어 두기)은 데이터를 한 번에 세 부분으로 나누는 것이고, 각 세트의 역할은 하나씩이다.

| 세트 | 쓰임 | 횟수 |
| --- | --- | --- |
| **train** | 파라미터 학습 | 매 에폭 (epoch) |
| **validation** | 하이퍼파라미터 선택, early stopping (조기 종료) | 여러 번 |
| **test** | 최종 추정 | **한 번** |

<mark class="blue">test set을 보고 무언가를 바꾸는 순간 test set은 두 번째 validation set이 되고, 더 이상 편향 없는 추정치가 아니다.</mark>

<figure>
<img src="/assets/fig/cv-sklearn.png" alt="All data split into training and test; the training part further split into five folds" loading="lazy" />
<figcaption>hold-out과 교차검증은 둘 중 하나를 고르는 것이 아니라 겹쳐 쓰는 것이다. test set을 맨 먼저 떼어 두고 건드리지 않으며, fold는 train <em>안쪽</em>에 있고 하이퍼파라미터는 거기서 고른다. test set은 마지막에 한 번만 쓴다.
<br><span class="credit"><a href="https://scikit-learn.org/stable/modules/cross_validation.html">scikit-learn 사용자 가이드</a> &#183; 공식 문서 그림</span></figcaption>
</figure>

**k-fold 교차검증 (cross-validation)** 은 데이터를 k조각으로 나눠 k번 학습하고, 각 조각을 한 번씩 test로 쓴다.

<figure>
<svg viewBox="0 0 640 170" role="img" aria-label="Five-fold cross-validation layout">
<text x="12" y="16" font-family="ui-monospace,monospace" font-size="11" fill="#8a918c">5-fold cross-validation</text>
<g font-family="ui-monospace,monospace" font-size="10" fill="#8a918c">
<text x="12" y="42">fold 1</text><text x="12" y="68">fold 2</text><text x="12" y="94">fold 3</text><text x="12" y="120">fold 4</text><text x="12" y="146">fold 5</text>
</g>
<g>
<rect x="60" y="30" width="104" height="16" fill="#8c4a32" opacity=".85"/><rect x="166" y="30" width="104" height="16" fill="#d9ddd8"/><rect x="272" y="30" width="104" height="16" fill="#d9ddd8"/><rect x="378" y="30" width="104" height="16" fill="#d9ddd8"/><rect x="484" y="30" width="104" height="16" fill="#d9ddd8"/>
<rect x="60" y="56" width="104" height="16" fill="#d9ddd8"/><rect x="166" y="56" width="104" height="16" fill="#8c4a32" opacity=".85"/><rect x="272" y="56" width="104" height="16" fill="#d9ddd8"/><rect x="378" y="56" width="104" height="16" fill="#d9ddd8"/><rect x="484" y="56" width="104" height="16" fill="#d9ddd8"/>
<rect x="60" y="82" width="104" height="16" fill="#d9ddd8"/><rect x="166" y="82" width="104" height="16" fill="#d9ddd8"/><rect x="272" y="82" width="104" height="16" fill="#8c4a32" opacity=".85"/><rect x="378" y="82" width="104" height="16" fill="#d9ddd8"/><rect x="484" y="82" width="104" height="16" fill="#d9ddd8"/>
<rect x="60" y="108" width="104" height="16" fill="#d9ddd8"/><rect x="166" y="108" width="104" height="16" fill="#d9ddd8"/><rect x="272" y="108" width="104" height="16" fill="#d9ddd8"/><rect x="378" y="108" width="104" height="16" fill="#8c4a32" opacity=".85"/><rect x="484" y="108" width="104" height="16" fill="#d9ddd8"/>
<rect x="60" y="134" width="104" height="16" fill="#d9ddd8"/><rect x="166" y="134" width="104" height="16" fill="#d9ddd8"/><rect x="272" y="134" width="104" height="16" fill="#d9ddd8"/><rect x="378" y="134" width="104" height="16" fill="#d9ddd8"/><rect x="484" y="134" width="104" height="16" fill="#8c4a32" opacity=".85"/>
</g>
<rect x="452" y="7" width="11" height="11" fill="#8c4a32" opacity=".85"/><text x="468" y="16" font-family="ui-monospace,monospace" font-size="10" fill="#8a918c">test</text>
<rect x="508" y="7" width="11" height="11" fill="#d9ddd8"/><text x="524" y="16" font-family="ui-monospace,monospace" font-size="10" fill="#8a918c">train</text>
</svg>
<figcaption>모든 표본이 정확히 한 번씩 test가 되고, 모델은 다섯 번 학습된다. 점수가 다섯 개 나오므로 표준편차는 덤으로 따라온다.</figcaption>
</figure>

| 변형 | 언제 |
| --- | --- |
| **k-fold** | 데이터가 작아 hold-out 한 번으로는 noise가 클 때 |
| **stratified k-fold** | 라벨이 불균형할 때 — fold마다 양성 비율을 맞춰 준다 |
| **group k-fold** | 표본이 묶여 있을 때 (같은 환자, 같은 assay, 같은 화합물 계열) |
| **nested CV** (중첩 교차검증) | 하이퍼파라미터를 튜닝할 때 — 안쪽 루프는 선택, 바깥 루프는 점수 |
| **repeated k-fold** | 분할을 여러 번 바꿔 k-fold를 반복, 추정치를 더 좁힌다 |

실제로 자주 빠뜨리는 게 **group k-fold**다. 같은 환자에서 나온 측정 10개가 split 양쪽에 나뉘어 들어가면, 모델은 생물학이 아니라 그 환자를 알아보는 법을 배울 수 있다. 같은 계열 (congeneric series) 분자들도 똑같다.

**nested CV**는 튜닝을 하는 순간 필요해진다. 최종 점수를 만드는 fold로 하이퍼파라미터까지 고르면 점수가 낙관적으로 나온다. 튜닝이 이미 그 데이터를 봤기 때문이다. 편향 없는 형태는 선택용 안쪽 루프와 보고용 바깥 루프를 따로 두는 것이다.

k-fold는 모델을 k번, nested CV는 k × m번 학습한다. 큰 딥러닝 모델에서 hold-out 한 번을 쓰는 이유가 대개 이것이고, 그렇게 했다고 밝히기만 하면 충분히 방어할 수 있는 선택이다.

## split을 어떻게 만드는가

분자에서는 이 선택이 모델보다 점수를 더 크게 움직인다.

<figure>
<svg viewBox="0 0 640 190" role="img" aria-label="Random split versus scaffold split">
<text x="12" y="16" font-family="ui-monospace,monospace" font-size="11" fill="#5b6b63">random split</text>
<text x="12" y="112" font-family="ui-monospace,monospace" font-size="11" fill="#8c4a32">scaffold split</text>
<g font-family="ui-monospace,monospace" font-size="9" fill="#8a918c">
<text x="60" y="38">train</text><text x="420" y="38">test</text>
<text x="60" y="134">train</text><text x="420" y="134">test</text>
</g>
<g>
<rect x="56" y="44" width="330" height="26" fill="none" stroke="#c9cfca"/><rect x="416" y="44" width="150" height="26" fill="none" stroke="#c9cfca"/>
<circle cx="76" cy="57" r="6" fill="#4a6b5c" opacity=".8"/><circle cx="100" cy="57" r="6" fill="#c08a4a" opacity=".8"/><circle cx="124" cy="57" r="6" fill="#4a6b5c" opacity=".8"/><circle cx="148" cy="57" r="6" fill="#4a7a9c" opacity=".8"/><circle cx="172" cy="57" r="6" fill="#c08a4a" opacity=".8"/><circle cx="196" cy="57" r="6" fill="#4a6b5c" opacity=".8"/><circle cx="220" cy="57" r="6" fill="#4a7a9c" opacity=".8"/><circle cx="244" cy="57" r="6" fill="#c08a4a" opacity=".8"/><circle cx="268" cy="57" r="6" fill="#4a6b5c" opacity=".8"/><circle cx="292" cy="57" r="6" fill="#4a7a9c" opacity=".8"/><circle cx="316" cy="57" r="6" fill="#c08a4a" opacity=".8"/><circle cx="340" cy="57" r="6" fill="#4a6b5c" opacity=".8"/>
<circle cx="436" cy="57" r="6" fill="#4a7a9c" opacity=".8"/><circle cx="460" cy="57" r="6" fill="#4a6b5c" opacity=".8"/><circle cx="484" cy="57" r="6" fill="#c08a4a" opacity=".8"/><circle cx="508" cy="57" r="6" fill="#4a7a9c" opacity=".8"/>
</g>
<text x="56" y="88" font-family="ui-monospace,monospace" font-size="10" fill="#5b6b63">every scaffold appears on both sides &mdash; the test set is not new chemistry</text>
<g>
<rect x="56" y="140" width="330" height="26" fill="none" stroke="#c9cfca"/><rect x="416" y="140" width="150" height="26" fill="none" stroke="#c9cfca"/>
<circle cx="76" cy="153" r="6" fill="#4a6b5c" opacity=".8"/><circle cx="100" cy="153" r="6" fill="#4a6b5c" opacity=".8"/><circle cx="124" cy="153" r="6" fill="#4a6b5c" opacity=".8"/><circle cx="148" cy="153" r="6" fill="#4a6b5c" opacity=".8"/><circle cx="172" cy="153" r="6" fill="#4a6b5c" opacity=".8"/><circle cx="196" cy="153" r="6" fill="#c08a4a" opacity=".8"/><circle cx="220" cy="153" r="6" fill="#c08a4a" opacity=".8"/><circle cx="244" cy="153" r="6" fill="#c08a4a" opacity=".8"/><circle cx="268" cy="153" r="6" fill="#c08a4a" opacity=".8"/><circle cx="292" cy="153" r="6" fill="#c08a4a" opacity=".8"/><circle cx="316" cy="153" r="6" fill="#c08a4a" opacity=".8"/><circle cx="340" cy="153" r="6" fill="#c08a4a" opacity=".8"/>
<circle cx="436" cy="153" r="6" fill="#4a7a9c" opacity=".8"/><circle cx="460" cy="153" r="6" fill="#4a7a9c" opacity=".8"/><circle cx="484" cy="153" r="6" fill="#4a7a9c" opacity=".8"/><circle cx="508" cy="153" r="6" fill="#4a7a9c" opacity=".8"/>
</g>
<text x="56" y="184" font-family="ui-monospace,monospace" font-size="10" fill="#8c4a32">a scaffold lives on one side only &mdash; the test set is genuinely unseen</text>
</svg>
<figcaption>색은 Bemis&ndash;Murcko scaffold. random split에서는 같은 scaffold가 train과 test 양쪽에 앉으므로, 모델은 일반화가 아니라 알아보기를 할 수 있다.</figcaption>
</figure>

| split | 규칙 | 무엇을 재는가 |
| --- | --- | --- |
| **random** | 섞은 뒤 자른다 | 이미 아는 화학 공간 안에서의 보간 (interpolation) |
| **scaffold** | Bemis–Murcko scaffold로 묶고, 한 scaffold는 한쪽에만 | 새 scaffold로의 일반화 |
| **time** | 특정 시점 이전 화합물로 학습, 이후를 test | 실제 전향적 (prospective) 상황 |
| **cluster** | fingerprint 유사도로 군집화 (Butina)한 뒤 군집 단위로 분할 | 강도를 조절할 수 있는 scaffold split 변형 |
| **stratified** | 라벨 분포를 유지 | 라벨이 드물면 반드시 필요 |

**Bemis–Murcko scaffold**는 측쇄 (side chain)를 전부 떼고 남는 것, 즉 고리 구조와 그것들을 잇는 linker다. 같은 계열의 유사체 둘은 같은 scaffold로 뭉쳐지는데, 그게 바로 원하는 그룹이다.

MoleculeNet 과제에서 같은 모델이 scaffold split보다 random split에서 **10 포인트쯤 더 잘 나오는 일이 흔하다.** 자기 random split 숫자를 남의 scaffold split 숫자와 비교하는 논문은 아무것도 비교하지 않은 것이다.

주의할 점 둘. scaffold split도 전향적 평가는 아니다. 실제 사용 상황에 더 가까운 건 time split이다. 그리고 구현이 제각각이다. scaffold를 그룹 크기로 정렬해 결정론적으로 나누는 구현, fold를 균형 맞추는 구현이 각각 같은 데이터에서 다른 test set을 만든다. "scaffold split"이라고만 쓰지 말고 어느 구현인지를 적어야 한다.

## 데이터 누수 점검표

<u>누수 (leakage)</u>는 test set의 정보가 학습으로 흘러드는 것이다. 점수를 부풀리고, 들여다보지 않으면 보이지 않는다.

- **중복.** 같은 분자가 다른 SMILES (simplified molecular-input line-entry system) 문자열로 두 번, 또는 같은 환자가 두 번. 표준화와 중복 제거는 **split 전에** 한다.
- **전처리를 전체 데이터에 fit.** 스케일러·PCA (principal component analysis)·특징 선택·정규화를 전체 데이터로 fit했다면 이미 test set을 본 것이다. train에 fit하고 test에 적용한다. 이걸 강제하려고 `sklearn`의 `Pipeline`이 존재한다.
- **test set으로 early stopping.** test가 epoch을 고르면 그건 validation set이다.
- **test set으로 하이퍼파라미터 튜닝.** 같은 문제인데 효과는 더 크다.
- **묶인 표본이 split을 가로지르는 경우.** 환자, 반복 측정, 같은 계열 분자.
- **라벨에서 나온 특징.** 라벨로 계산한 디스크립터, 또는 화합물이 어느 assay에서 왔는지를 암시하는 라벨.

> 쓸 만한 점검법 하나. 라벨을 무작위로 섞고 파이프라인을 그대로 다시 돌려 본다. 점수가 우연 수준보다 의미 있게 높게 남으면 어딘가에서 새고 있다.

## 정리

- **seed 여러 개의 평균 ± 표준편차**로 보고한다. 3개가 최소, 5~10개면 방어 가능
- 가장 좋은 seed만 보고하지 않는다 — test set을 보고 고른 것이다
- train / validation / test는 역할이 하나씩이고, test는 **한 번만** 본다
- 데이터가 작으면 k-fold. 불균형이면 **stratified**, 묶인 표본이면 **group**, 튜닝하면 **nested**
- 분자에서는 split이 지배한다. random split은 scaffold split보다 10 포인트쯤 부풀린다
- 실제 상황에 더 가까운 건 time split이고, scaffold split은 구현마다 다르니 어느 구현인지 적는다
- 중복 제거는 **split 전에**, 전처리 fit은 train에만. 라벨 섞기로 누수를 점검한다

## 참고

- Bemis & Murcko, [The properties of known drugs. 1. Molecular frameworks](https://doi.org/10.1021/jm9602928), *J. Med. Chem.* (1996)
- Sheridan, [Time-split cross-validation as a method for estimating the goodness of prospective prediction](https://doi.org/10.1021/ci400084k), *J. Chem. Inf. Model.* (2013)
- Wu et al., [MoleculeNet: a benchmark for molecular machine learning](https://doi.org/10.1039/C7SC02664A), *Chem. Sci.* (2018)
- Varma & Simon, [Bias in error estimation when using cross-validation for model selection](https://doi.org/10.1186/1471-2105-7-91), *BMC Bioinformatics* (2006) — nested CV
