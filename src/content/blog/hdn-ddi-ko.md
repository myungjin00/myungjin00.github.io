---
title: "HDN-DDI: 계층적 분자 그래프로 약물–약물 상호작용 예측"
date: 2025-01-18
description: "원자·부분구조·분자 전체를 하나의 그래프에 · 이분 그래프를 원자가 아니라 부분구조 사이에 · 가져올 값어치가 있는 cold-start split (S1 / S2) · warm-start 정확도 97%가 별것 아닌 이유"
category: review
updated: 2025-01
lang: ko
topic: Cheminformatics
subtopic: Prediction
venue: BMC Bioinformatics
venueYear: 2025
group: hdn-ddi
tags: [review, DDI, graph neural networks]
---

> Sun, Jinchen, and Haoran Zheng. "HDN-DDI: a novel framework for predicting drug-drug interactions using hierarchical molecular graphs and enhanced dual-view representation learning." *BMC Bioinformatics*, vol. 26, no. 1, 2025, article 28, [doi.org/10.1186/s12859-025-06052-0](https://doi.org/10.1186/s12859-025-06052-0).
> [PMC11765940](https://pmc.ncbi.nlm.nih.gov/articles/PMC11765940/) &#183; [code](https://github.com/F1am-e/HDN-DDI)

## 왜 약물–약물 상호작용인가

환자가 약을 하나만 먹는 경우는 드물다. 병용은 의도적일 수도 있다 — 여러 생물학적 과정을 동시에 건드려 더 나은 치료 효과를 내려는 것이다. 하지만 같은 체내에 들어간 두 약은 서로를 방해하기도 하고, 결과는 효과가 사라지는 정도에서 위험한 수준까지 걸친다. 이것이 <u>약물–약물 상호작용 (drug–drug interaction; DDI)</u>이다.

실험으로 찾는 일은 느리고 비싸며, 쌍의 수는 약물 수의 제곱으로 늘어나므로 전수 시험은 선택지가 아니다. 그래서 DDI 예측은 자연스러운 머신러닝 문제가 된다. 약 둘과 상호작용 유형이 주어졌을 때, 그 상호작용이 일어나는가?

형식적으로는, 약물 집합 $D$와 상호작용 유형 $R$에 대해 다음을 근사하는 문제다.

$$
f(D_x, r, D_y) \in \{0, 1\}
$$

1이면 $(D_x, r, D_y)$가 실제 상호작용이라는 뜻이다.

## 이 논문이 겨누는 틈

여기서 표준 도구는 [그래프 신경망 (graph neural network; GNN)](../gnn-ko/)이다. 약을 분자 그래프로 — 원자를 node, 결합을 edge로 — 놓고 구조에서 배운다.

문제는 *어느* 구조냐다. 약의 거동은 작용기가 크게 좌우하므로, 원자가 아니라 부분구조에서 DDI를 예측하는 흐름이 있다. 그런데 그 방법들은 두 갈래로 나뉘고 각각 무언가를 포기한다.

- **학습된 부분구조.** SSI-DDI나 SA-DDI처럼 무엇을 부분구조로 볼지 신경망이 정하게 한다. 유연하지만 나온 조각이 화학자가 이름 붙일 만한 것과 대응하지 않는 경우가 많아 설명을 믿기 어렵다.
- **화학적으로 정의된 부분구조.** BRICS (breaking of retrosynthetically interesting chemical substructures) 같은 분해 알고리즘은 합성적으로 의미 있는 결합을 끊어서 *해석 가능한* 조각을 준다. 대가는 고립이다. 일단 자르고 나면 각 조각이 따로 다뤄지고 분자 전체에 대한 정보가 사라진다.

<mark>HDN-DDI는 두 번째 갈래의 해석 가능성을 유지하면서 고립의 대가는 치르지 않으려 한다.</mark>

## 계층적 분자 그래프

<figure>
<img src="/assets/fig/hdn-ddi-fig1.png" alt="HDN-DDI framework: substructure extraction, six HDN blocks, and a co-attention decoder" width="1418" height="1324">
<figcaption><b>Figure 1.</b> 전체 구조. <b>(A)</b> 약 둘을 부분구조로 분해해 계층적 분자 그래프로 만들고, HDN 블록 6개를 통과시킨 뒤 co-attention 디코더로 합쳐 DDI 확률을 낸다. <b>(B)</b> 블록 하나의 내부. 약마다 하나씩 도는 hierarchical-view layer, 두 약의 부분구조 node 사이 이분 그래프 위의 interactive-view layer, 그리고 둘을 합치는 update layer.
<br><span class="credit">Sun &amp; Zheng, <a href="https://doi.org/10.1186/s12859-025-06052-0"><i>BMC Bioinformatics</i> <b>26</b>, 28 (2025)</a> &#183; 논문 그림, Figure 1</span></figcaption>
</figure>

핵심 아이디어는 말하기 간단하다. 원자 그래프를 부분구조 그래프로 바꾸는 대신, 둘 다 두고 거기에 분자 자체를 가리키는 node를 하나 더해 세 층짜리 그래프 하나로 만든다.

| 층 | node가 무엇인가 | 무엇을 모으나 |
| --- | --- | --- |
| 원자 (atomic) | 중원자(수소를 뺀 원자) 하나 | 국소 이웃 정보 |
| 부분구조 (substructure) | BRICS 조각 하나 | 작용기의 거동 |
| 분자 (molecular) | 약 전체 | 분자의 전역 요약 |

부분구조 node는 자기가 품은 원자들과, 그리고 분자 node와 연결된다. 그래서 중간에 위치해 양쪽 층 사이로 정보를 중계한다. message passing은 층으로 제한되지 않는다. 원자 node는 같은 단계에서 이웃한 부분구조 node와 인접 원자 양쪽에서 정보를 받을 수 있다.

실무적인 결과가 하나 따라온다. 인코딩 중에 분자 node가 모든 부분구조 node에서 정보를 모으므로, 약의 전역 표현이 그냥 그 node의 embedding이 된다. 별도의 pooling 단계가 필요 없고, 계층 없는 단층 그래프에 통상적인 readout을 돌리는 것보다 연산이 적다.

<figure>
<img src="/assets/fig/hdn-ddi-fig2.png" alt="Substructure extraction: BRICS decomposition, ring splitting, and the resulting three-level graph" width="1415" height="1075">
<figcaption><b>Figure 2.</b> 부분구조 추출. <b>(A)</b> SMILES 문자열이 분자 그래프가 되고, BRICS가 자르고, BRICS가 그대로 둔 고리 조각은 한 번 더 쪼개진다. <b>(B)</b> 결과는 세 층짜리 그래프 — 원자, 부분구조, 그리고 분자 전체를 가리키는 node 하나.
<br><span class="credit">Sun &amp; Zheng, <a href="https://doi.org/10.1186/s12859-025-06052-0"><i>BMC Bioinformatics</i> <b>26</b>, 28 (2025)</a> &#183; 논문 그림, Figure 2</span></figcaption>
</figure>

**부분구조 추출.** RDKit으로 SMILES (simplified molecular-input line-entry system)를 분자 그래프로 파싱하고, BRICS를 적용하고, BRICS가 통째로 남긴 큰 고리 조각은 추가 규칙으로 더 작은 고리 조각으로 쪼갠다. 이 단계가 필요한 이유는 BRICS가 일부러 고리를 끊지 않는다는 데 있다. 이 단계가 없으면 융합 다고리 약물이 거대한 조각 하나로 나온다.

## 인코더: 두 개의 view, 여섯 번 반복

인코더는 HDN 블록 6개를 쌓은 것이다. HDN 블록은 논문이 자기 계층형 dual-view 블록에 붙인 이름이다. 블록마다 층이 세 개다.

1. **Hierarchical-view layer** — 약을 하나씩 처리하며 자기 계층 위아래로 정보를 전달한다.
2. **Interactive-view layer** — *쌍*을 처리해서 두 약이 서로를 보게 한다.
3. **Update layer** — 두 view의 결과를 합쳐 새 node 표현으로 갱신한다.

모든 message passing은 multi-head graph attention (head 2개)을 쓴다.

논문이 말하는 "enhanced" dual view의 핵심이 interactive-view layer다. 기존 dual-view 모델들은 두 약의 *원자* 사이에 이분 그래프를 만든다. HDN-DDI는 **부분구조 node** 사이에 만든다. 근거는 두 가지다.

- 상호작용은 작용기가 매개하므로 부분구조 수준의 edge가 신호를 나르고, 원자 수준 edge는 대체로 noise를 더한다.
- 약의 조각 수가 원자 수보다 훨씬 적으므로 이분 그래프가 훨씬 작아진다.

여기에 더해, 학습 중에 이분 그래프의 연결을 **무작위로 끊는다.** 부분구조 표현이 균질해지는 것을 막기 위한 것이라고 적혀 있다. 모든 조각이 모든 층에서 모든 조각을 본다면 embedding이 수렴하고 뒤쪽 블록은 정보를 더하지 못한다.

## 디코더

블록 6개를 지나면 각 약은 블록마다 전역 표현을 하나씩, 모두 여섯 개를 갖는다. 디코더는 **co-attention**으로 이들을 압축한다. 두 약의 전역 표현을 학습된 가중치 행렬과 tanh 비선형을 통해 서로 점수화해 깊이마다 관련도 점수를 만든다. 그 점수로 표현을 가중하고, 상호작용 유형 $r$의 학습된 embedding과 합쳐 최종 확률을 낸다.

학습은 binary cross-entropy다. 두 벤치마크에는 모두 양성 상호작용만 들어 있어서, 알려진 triple에서 약 하나를 무작위로 바꿔 음성을 만든다. 이 분야의 표준적인 방법이고, 동시에 고질적인 약점이다. 그렇게 만든 "음성"이 사실은 아직 아무도 기록하지 않은 상호작용일 수 있기 때문이다.

## 실험

**데이터.**

| | 약물 | 상호작용 유형 | 양성 DDI |
| --- | --- | --- | --- |
| DrugBank | 1,706 | 86 | 191,808 |
| Twosides | 645 | 963 | 4,576,287 |

둘은 합치지 않고 따로 평가한다. 라벨의 뜻이 다르기 때문이다. DrugBank는 한 약이 다른 약의 대사에 미치는 영향을 기술하고, Twosides는 두 약을 함께 먹었을 때 관찰된 부작용을 기술한다.

**두 가지 설정으로 평가한다.**

- **Warm-start** — 상호작용 triple을 6:2:2로 나누는 통상적인 방식. 같은 약이 학습셋과 테스트셋 양쪽에 나올 수 있다.
- **Cold-start** — *약물*의 20%를 통째로 빼 둔다. 테스트 triple은 다시 둘로 나뉜다. 둘 다 새 약이면 **S1**, 하나만 새 약이면 **S2**.

<mark class="blue">warm-start 정확도 97% 이상은 인상적으로 들리지만, 모델이 화학을 배우지 않고 약물 신원을 외우는 것만으로도 도달할 수 있는 수치다.</mark> 표현이 일반화되는지를 시험하는 건 cold-start이고, 실제 쓰임새와 모양이 같은 것도 cold-start다. 알고 싶은 대상은 방금 승인된 약이니까.

**결과.** warm-start, 논문 보고 기준. ACC는 정확도, AUPR은 PR-AUC (precision–recall 곡선 아래 면적)를 가리키는 논문 쪽 표기, ROC-AUC는 receiver operating characteristic (ROC) 곡선 아래 면적이다.

| Table 2 · 모델 | DrugBank ACC | AUPR | F1 | Twosides ACC | AUPR | F1 |
| --- | --- | --- | --- | --- | --- | --- |
| SSI-DDI | 96.33 | 98.57 | 96.38 | 78.20 | 82.71 | 79.81 |
| GMPNN-CS | 95.30 | 97.94 | 95.39 | 82.83 | 87.24 | 84.08 |
| SA-DDI | 96.23 | 98.36 | 96.29 | 87.45 | 90.57 | 88.35 |
| DSN-DDI | 96.94 | 99.37 | 96.93 | 98.83 | 99.89 | 98.83 |
| BDN-DDI | 96.33 | 99.28 | 94.40 | 99.07 | 99.90 | 99.07 |
| **HDN-DDI** | 97.93 | 99.72 | 98.03 | 99.38 | 99.97 | 99.38 |

논문 Table 2의 수치다. 직전 최고 대비 차이는 DrugBank에서 정확도 1 포인트쯤, Twosides에서 0.3 포인트쯤이다. 전부 이미 천장 근처라서 작다. 갈리는 곳은 cold-start다. 정확도 약 4.96 포인트, F1 약 7.08 포인트 향상.

**cold-start, DrugBank.**

| Table 3 · 모델 | S1 ACC | ROC-AUC | AUPR | F1 | S2 ACC | ROC-AUC | AUPR | F1 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| MHCADDI | 66.50 | 72.53 | 71.06 | 67.21 | 70.58 | 77.84 | 76.16 | 72.74 |
| SSI-DDI | 65.40 | 73.43 | 75.03 | 54.12 | 76.38 | 84.23 | 84.94 | 73.54 |
| GMPNN-CS | 68.57 | 74.96 | 75.44 | 65.32 | 77.72 | 84.84 | 84.87 | 78.29 |
| SA-DDI | 67.15 | 73.62 | 73.39 | 63.40 | 75.55 | 82.95 | 84.11 | 71.94 |
| DSN-DDI | 73.42 | 81.79 | 81.82 | 70.34 | 81.92 | 91.01 | 91.09 | 80.18 |
| BDN-DDI | 74.88 | 86.10 | 85.84 | 70.21 | 85.35 | 93.68 | 93.64 | 84.34 |
| **HDN-DDI** | 79.84 | 89.48 | 89.65 | 77.42 | 89.43 | 95.92 | 95.95 | 89.34 |
| *향상폭* | *+4.96* | *+3.38* | *+3.81* | *+7.08* | *+4.08* | *+2.24* | *+2.31* | *+5.00* |

S1은 두 약 모두 처음 보는 경우, S2는 하나만 처음 보는 경우다. 위 warm-start 표와 비교해 보면 모든 모델이 20~30 포인트씩 잃고, 순위도 바뀐다. SSI-DDI는 warm-start에서 중간인데 S1 F1에서는 꼴찌다.

**Ablation**은 cold-start에서 돌렸다.

| Table 4 · 변형 | 무엇을 뺐나 | S1 ACC | S1 F1 | S2 ACC | S2 F1 |
| --- | --- | --- | --- | --- | --- |
| wo-SEM | 부분구조 추출 — 평범한 분자 그래프로 | 69.96 | 66.83 | 78.01 | 78.15 |
| wo-EDV | enhanced dual view를 기존 방식으로 되돌림 | 76.15 | 74.00 | 84.98 | 84.97 |
| with-pool | 분자 node 대신 부분구조 합 | 78.56 | 76.89 | 87.18 | 87.24 |
| with-SAG | 분자 node 대신 SAGPooling (self-attention graph pooling) | 78.20 | 75.41 | 87.67 | 87.60 |
| **전체 모델** | — | 79.84 | 77.42 | 89.43 | 89.34 |

부분구조 추출을 빼면 약 **10 포인트**, dual view를 되돌리면 **3.7**, 분자 수준 node를 어느 pooling으로 바꾸든 **1.3~1.6** 떨어진다. 즉 계층 구조가 일의 대부분을 하고, 이분 그래프 변경은 작지만 실재하는 이득이며, 분자 node는 연산을 아끼는 정도가 아니라 서로 다른 두 pooling 대안 모두보다 일관되게 조금씩 낫다.

<figure>
<img src="/assets/fig/hdn-ddi-fig3.png" alt="ROC and precision-recall curves for HDN-DDI and baselines on newly approved drugs" width="1419" height="583">
<figcaption><b>Figure 3.</b> 전향적 검증. 특정 시점 이전에 승인된 약으로 학습하고 이후 승인된 약으로 시험한다. <b>(A)</b> ROC, <b>(B)</b> precision&ndash;recall. 실제 사용과 모양이 같은 유일한 split이라 이것이 중요한 split이다.
<br><span class="credit">Sun &amp; Zheng, <a href="https://doi.org/10.1186/s12859-025-06052-0"><i>BMC Bioinformatics</i> <b>26</b>, 28 (2025)</a> &#183; 논문 그림, Figure 3</span>
</figcaption>
</figure>

**현실 검증.** 2015년 이전 승인 약으로 학습하고 이후 승인 약으로 시험한다. random split보다 어려운 프로토콜이고, HDN-DDI는 ROC-AUC와 PR-AUC 양쪽에서 우위를 유지한다.

<figure>
<img src="/assets/fig/hdn-ddi-fig4.png" alt="Attention over substructures for five drug pairs, with the top-contributing fragments shaded" width="1416" height="1932">
<figcaption><b>Figure 4.</b> 상호작용하는 쌍 다섯 개. attention 기여 상위 40%에 해당하는 부분구조를 음영으로 표시했고, 진할수록 기여가 크다. 논문의 해석 가능성 주장이 여기에 전부 들어 있다. 모델이 가리키는 것은 원자도 분자 전체도 아닌 조각이다.
<br><span class="credit">Sun &amp; Zheng, <a href="https://doi.org/10.1186/s12859-025-06052-0"><i>BMC Bioinformatics</i> <b>26</b>, 28 (2025)</a> &#183; 논문 그림, Figure 4</span>
</figcaption>
</figure>

**사례 연구.** 혈압을 급격히 떨어뜨릴 수 있는 아밀 나이트라이트–바데나필 쌍에서, attention이 논문이 지목한 작용기에 모인다. 한쪽의 나이트로소기, 다른 쪽의 피리딘 고리와 아마이드 결합이다. 두 번째 사례는 아모바르비탈–디쿠마롤이다.

## 저자가 인정한 것, 그리고 내가 덧붙일 것

논문이 밝힌 한계는 두 가지다. 분해 규칙이 일부 약을 덜 쪼갠다는 것, 그리고 대사 경로 같은 외부 지식에 접근하지 못한다는 것. 둘 다 타당하다.

세 가지를 더 짚겠다.

- **음성 샘플링.** 약을 무작위로 바꾸는 방식은 기록되지 않은 쌍이 곧 상호작용하지 않는 쌍이라고 가정한다. 지표가 90대 후반인 상황에서는 측정값이 뽑힌 음성이 얼마나 쉬웠는가에 지배될 수 있다.
- **연결 무작위 제거.** 균질화를 피한다는 동기는 그럴듯하고 깊은 그래프 신경망에서 실제로 일어나는 일과도 맞지만, 보인 것이 아니라 주장된 것이다. 제거 비율에 대한 ablation이 있으면 확인될 것이다.
- **해석 가능성을 평가로.** attention 지도는 Figure 4의 손으로 고른 다섯 쌍에서 그럴듯해 보이는데, 그것만으로는 얇은 근거다. 높은 attention을 받은 부분구조가 실제로 예측을 끌고 가는지에 대한 정량적 확인은 없다.

## 내가 이 논문을 읽은 이유

여기의 계층 구조가 내가 하는 일과 가깝다. [SJoINT](https://github.com/sslim-aidrug/SJoINT)에서도 분자를 두 층 — 원자와 그것들이 이루는 부분구조 — 으로 읽고 attention으로 잇는다. 차이는 제약이 어디에 걸리느냐다. HDN-DDI는 층들을 한 그래프에 넣고 attention이 경로를 찾게 두지만, SJoINT는 인코더를 둘로 유지하고 포함 관계로 attention을 masking한다. 그래서 원자는 자기를 품은 부분구조와만 정보를 주고받을 수 있다.

이 논문에서 가져온 설계 결정은 cold-start 프로토콜이다. warm-start 수치만 보고하면 부분구조 모델이 실제보다 좋아 보이고, 새 화학종으로의 일반화를 보이기에는 [scaffold split](../data-splitting-ko/) 하나보다 S1/S2가 더 깔끔하다.

## 정리

- 부분구조는 학습된 조각보다 해석하기 좋지만, 분자를 자르면 조각이 고립된다
- HDN-DDI는 원자·부분구조·분자 전체를 **하나의 그래프**에 두어 층들이 서로 이야기하게 한다
- 두 약 사이의 이분 그래프를 원자가 아니라 **부분구조** 수준에서 만든다
- 분자 수준 node 덕분에 별도의 pooling 없이 전역 표현이 나온다
- 가져올 값어치가 있는 건 cold-start split (S1 / S2)이다. warm-start 97%는 외운 것일 수 있다

## 참고

- Sun & Zheng, [HDN-DDI](https://doi.org/10.1186/s12859-025-06052-0), *BMC Bioinformatics* **26**, 28 (2025) — 여기서 리뷰한 논문
- Nyamabo et al., [SSI-DDI](https://doi.org/10.1093/bib/bbab133), *Brief. Bioinform.* (2021) — 부분구조 수준 DDI 예측
- Degen et al., [On the Art of Compiling and Using 'Drug-Like' Chemical Fragment Spaces](https://doi.org/10.1002/cmdc.200800178), *ChemMedChem* (2008) — BRICS
- Zitnik, Agrawal & Leskovec, [Modeling polypharmacy side effects with graph convolutional networks](https://doi.org/10.1093/bioinformatics/bty294), *Bioinformatics* (2018) — Twosides 쪽 부작용 예측
- Tatonetti et al., [Data-driven prediction of drug effects and interactions](https://doi.org/10.1126/scitranslmed.3003377), *Sci. Transl. Med.* **4** (2012) — Twosides의 출처
