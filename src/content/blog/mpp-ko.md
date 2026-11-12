---
title: "분자 성질 예측 (molecular property prediction; MPP)"
date: 2025-07-18
description: "MPP가 푸는 문제의 모양 · MoleculeNet이 사실상 표준인 이유 · random split이 성능을 부풀리는 방식 · scaffold split과 activity cliff · 논문 숫자를 그대로 믿으면 안 되는 이유"
category: concept
updated: 2025-08
lang: ko
group: mpp
topic: Cheminformatics
subtopic: Prediction
tags: [molecular ML, ADMET, benchmark]
---

## 푸는 문제의 모양

분자 성질 예측 (molecular property prediction, MPP)은 구조 하나를 받아 숫자 하나를 내놓는 문제다.

$$
f(\text{molecule}) \rightarrow y
$$

$y$가 범주면 분류 (classification), 실수면 회귀 (regression)다. 신약 개발에서 가장 많이 다루는 속성군이 **ADMET** — 흡수 (Absorption), 분포 (Distribution), 대사 (Metabolism), 배설 (Excretion), 독성 (Toxicity)이다.

왜 중요한가. 임상에서 실패하는 후보의 상당수가 **효능이 아니라 ADMET 때문에** 떨어진다. 표적에 아무리 잘 결합하는 분자라도 흡수가 안 되거나 간독성이 있으면 약이 되지 못한다. 합성하기 **전에** 거를 수 있다면 비용이 크게 줄어든다.

## MoleculeNet

이 분야의 사실상 표준 벤치마크다. 실제로 가장 많이 쓰이는 것들만 추리면 이렇다.

| 데이터셋 | 과제 | 분자 수 | 무엇을 재나 |
| --- | --- | --- | --- |
| BBBP | 분류 | 2,039 | 혈뇌장벽 통과 |
| BACE | 분류 | 1,513 | BACE-1 저해 |
| ClinTox | 분류 | 1,478 | 임상 독성 |
| SIDER | 분류 | 1,427 | 27종 부작용 |
| Tox21 | 분류 | 7,831 | 12종 독성 경로 |
| ToxCast | 분류 | 8,575 | 617종 assay |
| ESOL | 회귀 | 1,128 | 수용해도 |
| FreeSolv | 회귀 | 642 | 수화 자유에너지 |
| Lipophilicity | 회귀 | 4,200 | logD |

**규모를 보면 문제가 보인다.** 가장 작은 FreeSolv는 642개다. 딥러닝이 편하게 일할 크기가 아니다. [사전학습](../transfer-learning-ko/)이 거의 필수인 이유가 이것이다.

<figure>
<img src="/assets/fig/moleculenet-sizes.svg" alt="Molecule counts for the nine MoleculeNet datasets on a log scale" loading="lazy" />
<figcaption><b>MoleculeNet의 실제 규모.</b> 배포된 파일에서 직접 센 수 &mdash; RDKit이 파싱하는 분자 기준이다. 위 표보다 몇 개 적은 이유는 공개 파이프라인이 정규화와 염 제거까지 하기 때문이다. 아홉 중 다섯이 2,000개 미만이고 가장 작은 것은 642개다. 분자 ML의 나머지 전부를 결정하는 사실이 이것이다. 사전학습이 사실상 필수인 이유도, 지문 베이스라인이 계속 이기는 이유도 여기서 나온다.</figcaption>
</figure>

## 평가에서 어긋나는 것들

성능표만 보고 모델을 고르면 거의 틀린다. 함정이 네 개 있다.

### 1. split (데이터 분할)이 숫자를 만든다

**random split**은 분자를 무작위로 나눈다. 그런데 데이터셋 안에는 서로 비슷한 분자가 많다. 같은 scaffold에 치환기만 바꾼 유사체가 train과 test에 나뉘어 들어가면, 모델은 일반화 (generalisation)가 아니라 **암기 (memorisation)** 로 맞힌다.

**scaffold split**은 Bemis–Murcko scaffold, 즉 곁사슬을 다 떼고 남는 고리와 그 사이 linker로 묶어서 나눈다. test에는 학습 때 보지 못한 scaffold가 들어간다. 실제 상황 — 새로운 화학종에 모델을 쓰는 상황 — 에 훨씬 가깝다.

같은 모델이라도 두 split의 점수 차이가 **10 포인트 이상** 나는 일이 흔하다. 그래서 <mark class="blue">어떤 split을 썼는지 밝히지 않은 숫자는 비교 대상이 아니다.</mark> split의 종류와 고르는 기준은 [모델 평가](../evaluation-protocol-ko/)에서 따로 다룬다.

### 2. activity cliff

구조가 비슷하면 활성도 비슷하다는 가정이 바탕에 깔려 있는데, 원자 하나 차이로 활성이 100배 바뀌는 쌍이 실제로 존재한다. [지문 기반 유사도](../descriptors-fingerprints-ko/)는 여기서 무력하고, 평균 성능이 좋은 모델도 이 구간에서는 틀린다. [MoleculeACE](https://github.com/molML/MoleculeACE)가 이런 경우만 모아둔 벤치마크다. 정의와 대응 방법은 [activity cliff](../activity-cliff-ko/)에서 따로 다룬다.

### 3. 불균형 (class imbalance)과 지표

독성 데이터는 보통 양성이 드물다. 이때 **ROC-AUC (area under the receiver operating characteristic curve)는 상황을 실제보다 좋게 보이게 한다.** 음성이 많으면 올라가기 때문이다. 양성 쪽이 중요한 상황에서는 **PR-AUC (area under the precision–recall curve, AUPR)** 가 실제 쓸모를 더 잘 반영한다. 논문이 ROC-AUC만 보고하면 의심해볼 만하다.

### 4. 분산 (variance)

데이터가 수천 개 규모라 **시드 (random seed)에 따라 점수가 흔들린다.** <mark>단일 시드의 0.5 포인트 차이는 아무 의미가 없다.</mark> 최소 3시드, 가능하면 10시드의 평균과 표준편차를 봐야 한다.

> 이 네 가지를 지키지 않은 비교는 대부분 재현되지 않는다. split 문제만 따로 다룬 글로는 Walters의 [Some Thoughts on Splitting Chemical Datasets](https://practicalcheminformatics.blogspot.com/2024/11/some-thoughts-on-splitting-chemical.html)가 좋다.

<figure>
<img src="/assets/fig/split-comparison.svg" alt="Test RMSE under a random split and a scaffold split, on three datasets" loading="lazy" />
<figcaption><b>같은 모델, 같은 데이터, 다른 split.</b> ECFP4 + 랜덤 포레스트, 3 seed 평균 &plusmn; 표준편차. 인용이 아니라 이 글을 쓰면서 직접 돌린 결과다. random split에서 scaffold split으로 바꾸면 Lipophilicity는 20%, ESOL은 46%, FreeSolv는 125% 나빠진다. 모델을 바꿔서 이만한 변동이 나오는 일은 없다. split을 밝히지 않은 점수가 점수가 아닌 이유다.</figcaption>
</figure>

## 베이스라인 (baseline)을 반드시 둘 것

새 모델이 ECFP4 (extended-connectivity fingerprint) + 랜덤 포레스트를 못 이기면 아직 쓸 만하지 않다. 30초면 돌아가는 베이스라인이다.

데이터가 수백~수천 개 규모일 때 **ECFP + 랜덤 포레스트가 그래프 신경망을 이기는 일은 드물지 않다.** 이 베이스라인 없이 보고된 개선은 믿기 어렵다.

## 해석 가능성 (interpretability)이 왜 따라붙는가

화학자는 점수만으로 움직이지 않는다. "이 분자는 독성 0.83"으로는 다음에 무엇을 바꿔야 할지 알 수 없다. **어느 부분 구조가 그 점수를 만들었는지**가 나와야 설계로 이어진다.

이것이 attention 기반 모델이 MPP에서 쓰이는 이유다. 예측과 함께 "어디를 봤는지"가 같이 나온다. <mark>다만 **attention이 높다 = 원인이다**는 보장된 명제가 아니라 검증이 필요한 가설이다.</mark>

## 정리

- MPP는 구조 → 숫자 하나. ADMET이 가장 큰 속성군이다
- MoleculeNet이 표준이지만 데이터가 작다 (642~8,575)
- **split을 밝히지 않은 숫자는 비교 대상이 아니다** — random과 scaffold는 10 포인트 이상 차이가 난다
- activity cliff, 불균형 지표, 시드 분산이 나머지 세 함정
- ECFP + 랜덤 포레스트를 베이스라인으로 반드시 둘 것
- 해석은 부가 기능이 아니라 설계로 이어지기 위한 요건이다

## 참고

- Wu et al., [MoleculeNet: A Benchmark for Molecular Machine Learning](https://doi.org/10.1039/C7SC02664A), *Chem. Sci.* (2018)
- van Tilborg et al., [Exposing the Limitations of Molecular Machine Learning with Activity Cliffs](https://doi.org/10.1021/acs.jcim.2c01073), *J. Chem. Inf. Model.* (2022) — MoleculeACE
- Deng et al., [A systematic study of key elements underlying molecular property prediction](https://doi.org/10.1038/s41467-023-41948-6), *Nat. Commun.* (2023)
