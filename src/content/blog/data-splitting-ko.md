---
title: "분자 데이터를 나누는 다섯 가지 방법, 그리고 각각이 가정하는 것"
date: 2026-10-19
description: "random·temporal·metadata·scaffold·표현 기반 split을 train–test 유사성에 대해 각각 어떤 가정을 품고 있는지로 정리하고, 조용히 실패하는 지점을 드물게 솔직하게 짚는다."
category: review
updated: 2026-11
lang: ko
topic: Cheminformatics
subtopic: Evaluation
venue: ChemRxiv
venueYear: 2026
group: data-splitting
tags: [review, evaluation, scaffold split, benchmark]
---

> Truong, Cao-Minh, et al. "Small-Molecule Data Splitting for Machine Learning in Drug Design." *ChemRxiv*, 2026, [doi.org/10.26434/chemrxiv.15009691/v1](https://doi.org/10.26434/chemrxiv.15009691/v1). Preprint.

## split이 왜 중요한가

<mark class="blue">split이 그 점수가 답하는 질문을 정한다.</mark> train / validation / test는 역할이 하나씩이다. 적합·선택·추정. 그런데 0.85가 "본 것의 유사체에서 작동한다"인지 "새 화학에서 작동한다"인지를 정하는 건 학습 분자와 테스트 분자의 관계다.

<figure>
<img src="/assets/fig/split-comparison.svg" alt="Test RMSE under random and scaffold splits on three datasets" loading="lazy" />
<figcaption><b>선택이 겉치레가 아닌 이유.</b> ECFP4 (extended-connectivity fingerprint) + 랜덤 포레스트, 3 seed. 이 논문에서 가져온 게 아니라 내 <a href="../mpp-ko/">성질 예측 글</a>을 쓰면서 직접 돌린 결과다. random split에서 scaffold split으로 바꾸면 Lipophilicity 20%, ESOL 46%, FreeSolv 125% 나빠진다. 모델을 바꿔서는 나오지 않는 변동 폭이다.</figcaption>
</figure>

## split 다섯 갈래

| 갈래 | 원리 | 쓸 곳 | 조용히 실패하는 지점 |
| --- | --- | --- | --- |
| random | 섞어서 나눈다. 필요하면 클래스 비율만 맞춤 | sanity check, 표현 비교, 튜닝 | 유사도 통제가 전혀 없다. 유사체가 양쪽에 함께 들어간다 |
| temporal | 측정 날짜순으로 과거로 학습 | 실제 과제의 후향적 평가 | 시간 순서 ≠ 구조적 분리 |
| metadata | 과제·assay·실험실·특허·출처로 묶는다 | 실험 맥락 간 전이 평가 | 출처가 달라도 같은 분자가 들어 있다 |
| scaffold | 코어로 묶고 그 그룹을 통째로 유지 | 구조 계열별 평가, 해석 가능 | 정의가 그룹을 만든다. 다른 scaffold가 거의 같을 수 있다 |
| 표현 기반 | 표현 공간의 유사도·거리로 나눔 | 두 집합이 얼마나 비슷할지 직접 통제 | 표현·지표·배분 규칙에 의존 |

논문은 갈래마다 같은 네 항목을 적는다. 그래서 서술이 아니라 같은 기준의 비교가 된다.

## 논문이 짚은 관찰

**시간 순서로 나눠도 전향적 검증이 되지 않는다.** 과거 데이터를 떼어 두는 것으로는 미래의 표본 추출 자체가 모델과 연구팀의 선택에 이끌렸다는 사실을 담을 수 없다. 그리고 데이터베이스의 날짜는 등재일이지 실험일도 출판일도 아니다. <mark>time split은 random split보다 정직하지만 여전히 전향적 시험이 아니다.</mark>

**출처가 다르다고 분자가 다른 게 아니다.** assay·특허·출처 데이터셋으로 나누면 분리된 것처럼 들리는데, 같은 화합물이 여러 출처에 흔히 들어 있다. 논문은 중복 제거에 정확한 SMILES (simplified molecular-input line-entry system) 일치만으로는 부족하다고 못 박는다. 먼저 구조를 표준화하고 동일성을 확인해야 한다.

**scaffold 그룹은 크기가 고르지 않고, 코어를 공유한다고 해서 역가까지 공유하는 것은 아니다.** 큰 scaffold 몇 개가 지배하고 나머지 대부분은 구성원이 하나뿐인 그룹 (singleton)이라, scaffold split은 불균형 split이기도 하다. 그리고 한 scaffold 안에서 [activity cliff](../activity-cliff-ko/)가 생긴다. 같은 코어인데 활성은 자릿수가 다르다. scaffold 분리는 구조에 대한 주장이지 활성에 대한 주장이 아니다.

**scaffold 라벨이 다르다고 구조적 분리가 보장되지는 않는다.** Bemis–Murcko scaffold는 곁사슬을 떼고 고리계와 그것들을 잇는 부분만 남긴 것인데, 그 둘이 원자 하나만 달라도 두 그룹이 되므로, split이 달성하지 못한 분리를 달성했다고 보고할 수 있다.

**표현 기반 split은 배분을 별도 결정으로 만든다.** 군집화가 한 선택이고 그 군집을 어떻게 쓸지가 또 한 선택인데, 두 번째가 질문을 바꾼다.

| | 하는 일 | 만들어지는 상황 |
| --- | --- | --- |
| cluster-stratified | 모든 군집에서 양쪽으로 뽑는다 | 커버리지 유지. 보간 (interpolative) |
| cluster-shuffle | 군집을 통째로 한쪽에 | 구조적 분리. 외삽 (extrapolative) |

이름 붙은 방법들: Kennard–Stone (커버리지를 위해 학습 화합물을 고르므로 남은 테스트셋이 보간적이 되고 따라서 낙관적), OptiSim (다양성과 대표성의 균형), 그리고 AVE (asymmetric validation embedding). AVE는 활성 화합물 (actives)과 decoy (비활성으로 가정한 화합물) 사이의 분할 간 최근접 이웃 거리 차이를 명시적으로 최소화하고, LIT-PCBA 벤치마크가 이것 위에 서 있다.

## 마지막 권고

마지막 절을 거의 그대로 옮기면,

- **split을 의도한 용도에 맞춘다.** 리드 최적화에는 가까운 화합물이 적절하고, scaffold hopping에는 진짜 구조적 분리가 필요하다.
- **train–test 유사도가 높다는 것만으로 데이터 누수는 아니다.** 서로 다른 문제이고, 뭉뚱그리면 과잉 교정으로 간다.
- **분할 배정은 변동한다.** 배정 절차를 통제하면 재현성이 좋아진다.
- **여러 유사도 수준에 걸쳐 평가한다.** SPECTRA 프로토콜로, 유사도 수준을 몇 개 고정해 각각 학습·평가하고 점 하나가 아니라 곡선 전체를 보고한다. 비용이 허락하는 한.
- **어떤 split 하나도 모델을 온전히 특징짓지 못한다.**

## 내가 물을 것

- **preprint이고 perspective다.** 새 실험이 없으므로 주장이 인용 문헌에 기댄다. perspective로서는 합당하지만, 각 실패 양식의 정량적 비중이 여기서 확립되지는 않는다.
- **scaffold split의 문제를 지적하고 거기서 멈춘다.** 고르지 않고, 정의에 의존하고, 샌다고 적은 뒤 권고는 "유사도 기반 대안을 고려하라"다. 어느 것을 어느 임계값으로 쓸지는 열려 있고, 실무자가 막히는 지점이 정확히 거기다.
- **비용을 언급만 하고 수치화하지 않는다.** SPECTRA식 평가가 더 낫고 더 비싸다는 건 분명한데, 얼마나 비싼지를 말하지 않는다. 그게 실제로 할지 말지를 정하는 수치다.

## 내가 읽은 이유

[평가 프로토콜 글](../evaluation-protocol-ko/)에서 같은 논증을 비교 하나로 적은 적이 있고, 이 논문은 그 분류 체계 전체다. [MoleculeNet](../mpp-ko/)과 [MoleculeACE](../activity-cliff-ko/)에서 보고하는 모든 것이 split 위에 서 있는데, 내가 가진 규칙은 하나뿐이었다. "random보다 scaffold, 그리고 어느 쪽인지 밝힌다." 이 논문이 그게 너무 거칠다는 걸 보여 준다. 특히 **"scaffold split"이 하나의 프로토콜이 아니다.** 코어 정의, singleton 처리, 클래스 균형이 전부 선택이고, 이 선택이 서로 다른 논문들은 둘 다 "scaffold"라고 적어도 비교할 수 없다.

실무적으로 바꾼 것 하나는, split 이름이 유사도를 함의한다고 믿는 대신 **분할 간 유사도**를 지표와 함께 보고하는 것이다. 시간 순서로 나누면 전향적 시험에 가깝다고 반쯤 믿고 있었는데 그 믿음도 여기서 깨졌다. 그리고 가장 오래 남는 권고는 마지막 줄이다. 엄격한 쪽이니까 scaffold split을 고르고 숫자 하나를 보고하는 흔한 관행도 결국 질문 하나를 골라 답한 것이다.

## 정리

- split이 그 점수가 답하는 질문을 정하므로, 의도한 용도에 맞춰야 한다
- 다섯 갈래: random · temporal · metadata · scaffold · 표현 기반
- 시간 순서로 나눠도 전향적 검증이 되지 않고, 데이터베이스 날짜는 실험 날짜가 아니다
- 출처가 달라도 분자는 겹친다. 정확한 SMILES 일치만으로는 중복 제거가 안 된다
- scaffold 그룹은 고르지 않고 정의에 의존하며, 코어 공유가 활성 공유를 뜻하지 않는다
- 표현 기반 split은 군집화와 배분을 분리한다. cluster-stratified는 보간, cluster-shuffle은 외삽
- 유사도가 높다고 자동으로 누수는 아니며, 어떤 split 하나도 모델을 온전히 특징짓지 못한다

## 참고

- Truong et al., [Small-molecule data splitting for machine learning in drug design](https://doi.org/10.26434/chemrxiv.15009691/v1), ChemRxiv (2026) — 여기서 리뷰한 preprint
- Sheridan, [Time-split cross-validation as a method for estimating the goodness of prospective prediction](https://doi.org/10.1021/ci400084k), *J. Chem. Inf. Model.* (2013)
- Wallach & Heifets, [Most ligand-based classification benchmarks reward memorization rather than generalization](https://doi.org/10.1021/acs.jcim.7b00403), *J. Chem. Inf. Model.* (2018) — AVE
