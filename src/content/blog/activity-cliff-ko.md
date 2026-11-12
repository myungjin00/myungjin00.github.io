---
title: "activity cliff"
date: 2025-08-22
description: "구조는 거의 같은데 활성이 크게 다른 쌍 · 유사성 원리가 하필 중요한 곳에서 깨지는 이유 · SALI와 MoleculeACE의 정의 · 디스크립터 기반 모델이 딥러닝을 이기는 지점 · cliff 성능을 정직하게 보고하는 법"
category: concept
updated: 2025-09
lang: ko
group: activity-cliff
topic: Cheminformatics
subtopic: Prediction
tags: [activity cliff, SAR, benchmark]
---

분자 머신러닝은 대부분 가정 하나 위에 서 있다. **구조가 비슷하면 성질도 비슷하다.** 이걸 <u>유사성 원리 (similarity principle)</u>라고 하고, [fingerprint](../descriptors-fingerprints-ko/)와 [GNN](../gnn-ko/) (graph neural network)이 애초에 작동하는 이유다.

**activity cliff**는 그 가정이 깨지는 쌍이다. 구조는 거의 같은데 활성이 자릿수 단위로 다르다.

<figure>
<svg viewBox="0 0 640 240" role="img" aria-label="Smooth structure-activity landscape versus a cliff">
<text x="36" y="20" font-family="ui-monospace,monospace" font-size="12" fill="#4a6b5c">similarity principle holds</text>
<text x="364" y="20" font-family="ui-monospace,monospace" font-size="12" fill="#8c4a32">activity cliff</text>
<line x1="36" y1="196" x2="300" y2="196" stroke="#c9cfca" stroke-width="1"/>
<line x1="36" y1="196" x2="36" y2="46" stroke="#c9cfca" stroke-width="1"/>
<text x="42" y="42" font-family="ui-monospace,monospace" font-size="10" fill="#8a918c">activity</text>
<text x="196" y="214" font-family="ui-monospace,monospace" font-size="10" fill="#8a918c">chemical space</text>
<path d="M46 186 C110 176 150 126 292 66" fill="none" stroke="#4a6b5c" stroke-width="2.5"/>
<circle cx="152" cy="131" r="4.5" fill="#4a6b5c"/>
<circle cx="180" cy="120" r="4.5" fill="#4a6b5c"/>
<line x1="152" y1="131" x2="180" y2="120" stroke="#4a6b5c" stroke-width="1" stroke-dasharray="3 3"/>
<text x="52" y="86" font-family="ui-monospace,monospace" font-size="10" fill="#4a6b5c">small step in structure</text>
<text x="52" y="100" font-family="ui-monospace,monospace" font-size="10" fill="#4a6b5c">small step in activity</text>
<line x1="364" y1="196" x2="628" y2="196" stroke="#c9cfca" stroke-width="1"/>
<line x1="364" y1="196" x2="364" y2="46" stroke="#c9cfca" stroke-width="1"/>
<text x="370" y="42" font-family="ui-monospace,monospace" font-size="10" fill="#8a918c">activity</text>
<text x="524" y="214" font-family="ui-monospace,monospace" font-size="10" fill="#8a918c">chemical space</text>
<path d="M374 184 C420 179 470 175 499 173 L503 78 C540 73 580 68 616 64" fill="none" stroke="#8c4a32" stroke-width="2.5"/>
<circle cx="492" cy="174" r="4.5" fill="#8c4a32"/>
<circle cx="512" cy="76" r="4.5" fill="#8c4a32"/>
<line x1="492" y1="174" x2="512" y2="76" stroke="#8c4a32" stroke-width="1" stroke-dasharray="3 3"/>
<text x="380" y="110" font-family="ui-monospace,monospace" font-size="10" fill="#8c4a32">same small step</text>
<text x="380" y="124" font-family="ui-monospace,monospace" font-size="10" fill="#8c4a32">100x in activity</text>
</svg>
<figcaption>구조–활성 지형 (structure–activity landscape). 매끄러운 지형에서는 모델이 사이를 메울 수 있지만, cliff에서는 이웃한 두 분자가 다른 층에 있어서 이웃값을 매끄럽게 뭉개는 모델은 그 중간에 떨어진다.</figcaption>
</figure>

<figure>
<img src="/assets/fig/activity-cliff-pair.svg" alt="Two near-identical molecules whose binding affinity differs 1200-fold" loading="lazy" />
<figcaption><b>실제 cliff 하나.</b> 둘 다 도파민 D3 수용체 MoleculeACE 세트에서 가져온 분자다. tetrahydroquinolinone, piperazine, <i>tert</i>-butyl trifluoromethylpyrimidine을 공유하고, 다른 곳은 강조된 linker뿐이다. methylene이 넷에서 다섯으로 하나 늘었다. ECFP4 Tanimoto는 0.98 — 지문 입장에서는 같은 분자다 — 그런데 결합 친화도는 약 1,200배 차이가 난다.</figcaption>
</figure>

## cliff를 어떻게 정의하나

"구조가 거의 같다"를 숫자로 만들어야 한다. 두 가지 정의가 쓰인다.

**SALI** (structure–activity landscape index)는 쌍마다 점수를 준다.

$$
\mathrm{SALI}_{ij} = \frac{|\,A_i - A_j\,|}{1 - \mathrm{sim}(i, j)}
$$

$A$는 로그 척도 활성이고 $\mathrm{sim}$은 보통 ECFP (extended-connectivity fingerprint) 기반 [Tanimoto 유사도](../descriptors-fingerprints-ko/)다. 쌍이 비슷해질수록 분모가 0으로 가므로, 거의 같은 구조에 활성 차이가 조금만 있어도 점수가 폭발한다.

**MoleculeACE**는 임계값 규칙을 쓴다. 감사하기 쉬워서 벤치마크가 이쪽을 택한다. 활성이 10배 (1 로그 단위) 이상 차이 나고, 동시에 ECFP Tanimoto ≥ 0.9 · scaffold (곁사슬을 떼고 남는 고리와 그 사이 linker) 유사도 ≥ 0.9 · 공통 부분구조 (substructure) 중 하나라도 만족하면 cliff 쌍이다. 그런 쌍에 한 번이라도 들어간 화합물이 <u>cliff 화합물</u>이 된다.

임계값 규칙이 쓰이는 이유는 따로 떼어 보고할 수 있는 부분집합이 나오기 때문이다.

## 왜 모델이 여기서 무너지나

모델은 학습하면서 화학 공간 위의 매끄러운 함수를 암묵적으로 배운다. 이웃한 두 분자를 넣으면 비슷한 숫자 두 개가 나온다. 그게 귀납 편향 (inductive bias)이고, 90%는 맞다.

cliff에서는 정답이 "거의 같은 입력 두 개에 아주 다른 숫자 두 개"다. 매끄러운 모델은 둘의 중간값을 내놓는다. 약한 쪽은 과대평가하고 센 쪽은 과소평가한다. <mark class="blue">둘 다 틀리고, 하필 약화학자가 가장 관심 있는 화합물에서 오차가 가장 크다. cliff야말로 구조–활성 관계 (structure–activity relationship; SAR)가 실제 정보를 담은 지점이기 때문이다.</mark>

MoleculeACE가 보인 불편한 결과가 이것이다. ChEMBL 생리활성 30개 세트에서, <mark>디스크립터·지문 기반 모델에 고전 회귀기 (support vector machine; SVM, gradient boosting)를 붙인 쪽이 cliff 부분집합에서 MPNN (message passing neural network)과 비슷하거나 더 나았다.</mark> 전체 테스트셋에서는 신경망이 이긴 경우에도 그랬다. 용량을 키운다고 작은 구조 변화에 민감해지지는 않았다.

## cliff는 왜 생기나

noise가 아니라 물리적 이유가 있다.

- **수소결합이 하나 생기거나 사라진다.** N–H를 N–CH₃로 바꾸면 핵심 상호작용을 만들던 수소결합 donor가 사라진다.
- **입체 충돌 (steric clash).** 메틸 하나가 결합 포켓에 안 들어간다.
- **이온화 (ionisation) 상태가 바뀐다.** 치환기가 pKa를 밀어서 생리적 pH에서 전하를 띠게 된다.
- **형태 (conformation)가 고정된다.** 고리나 플루오린 하나가 결합 자세에 필요한 비틀림각을 묶어 버린다.

넷 다 리간드 혼자가 아니라 복합체 (complex)에서 일어나는 일이다. 그래서 2D 표현은 원리적으로 이걸 볼 수 없다. 입력에 정보가 아예 없다.

## 그래서 어떻게 하나

완전히 푸는 방법은 없다. 정직한 선택지는 이 정도다.

| 접근 | 아이디어 | 한계 |
| --- | --- | --- |
| cliff를 따로 보고 | test RMSE (root-mean-square error)를 cliff / non-cliff로 분리 | 진단일 뿐, 해결은 아님 |
| scaffold split | 테스트셋을 구조적으로 새롭게 강제 | 문제를 옮길 뿐 없애지 못함 |
| 쌍 단위 (Siamese) 모델 | 값이 아니라 쌍의 *차이*를 예측 | 쌍 개수가 $n^2$로 늘어남 |
| 3D·구조 기반 특징 | 필요한 상호작용을 직접 넣어 줌 | 구조가 있어야 하고 비쌈 |
| 더 국소적인 모델 | 국소성을 키움 (k-nearest neighbours, 정규화 (regularization) 완화) | 나머지 전부에서 나빠짐 |

항상 도움이 되는 건 첫 줄 하나다. <mark>전체 RMSE 하나는 cliff 성능을 완전히 가리고</mark>, 모델은 바로 그 쌍에서 더 보수적으로 — 즉 더 나쁘게 — 굴어서 전체 점수를 올릴 수도 있다.

## 같이 기억할 것

- **가짜 cliff도 있다.** 서로 다른 assay·실험실·측정 방식에서 모은 활성값은 대략 0.5 로그 단위의 noise를 갖는다. 다른 assay 두 개로 만든 1 로그 "cliff"는 측정 오차일 수 있다.
- **활성 ≠ 결합.** 역가 (potency) 차이가 표적이 아니라 용해도나 투과성에서 올 수도 있다.
- **cliff 화합물은 소수다.** 보통 세트의 몇 퍼센트라서, 분자 20개로 계산한 cliff 지표는 오차막대가 넓다. 숫자 옆에 개수를 같이 적어야 한다.

## 정리

- activity cliff = 구조는 거의 같은데 활성 차이가 큰 쌍. 유사성 원리가 국소적으로 깨지는 지점
- SALI는 연속 점수, MoleculeACE의 임계값 규칙 (10배 이상 + 높은 유사도)이 벤치마크 표준
- 매끄러운 모델은 중간값을 내놓아 **두 분자 모두** 틀린다. 하필 SAR 정보가 있는 쌍에서
- cliff 부분집합에서는 디스크립터 + SVM이 딥러닝과 대등하다 — 부족한 건 모델 용량이 아니다
- 원인은 상호작용 수준 (수소결합·입체·pKa·형태)이라 2D 입력에는 대체로 보이지 않는다
- cliff / non-cliff 오차는 항상 분리해서, 화합물 개수와 함께 보고한다

## 참고

- Maggiora, [On outliers and activity cliffs — why QSAR often disappoints](https://doi.org/10.1021/ci060117s), *J. Chem. Inf. Model.* (2006)
- Guha & Van Drie, [Structure–activity landscape index: identifying and quantifying activity cliffs](https://doi.org/10.1021/ci7004093), *J. Chem. Inf. Model.* **48** (2008) — SALI
- Stumpfe & Bajorath, [Exploring activity cliffs in medicinal chemistry](https://doi.org/10.1021/jm201706b), *J. Med. Chem.* **55** (2012)
- van Tilborg, Alenicheva & Grisoni, [Exposing the limitations of molecular machine learning with activity cliffs](https://doi.org/10.1021/acs.jcim.2c01073), *J. Chem. Inf. Model.* (2022) — MoleculeACE
