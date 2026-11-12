---
title: "AgreementPred: 학습할 수 없으면 투표한다"
date: 2025-06-24
description: "천연물에는 약리 분류 라벨이 거의 없다 · 분자 표현 29가지 중 22가지의 유사도를 합친다 · 표현들이 얼마나 일치하는지를 신뢰도로 쓴다 · 라벨은 어디서 오나 · 그리고 precision에서는 여전히 이기는 기준 모델"
category: review
updated: 2025-07
lang: ko
topic: Cheminformatics
subtopic: Prediction
venue: Digital Discovery
venueYear: 2025
group: agreementpred
tags: [review, molecular representation, similarity, natural products]
---

> Sutcharitchan, Chayanis, et al. "AgreementPred: a cheminformatic framework for drug and natural product category recommendation based on multi-representation structural similarity data fusion." *Digital Discovery*, vol. 4, no. 11, 2025, pp. 3304–3319, [doi.org/10.1039/d5dd00329f](https://doi.org/10.1039/d5dd00329f).

## 문제: 배울 라벨이 없다

천연물은 실제 약의 원천이다. 에페드린, 아르테미시닌, 파클리탁셀. 그리고 연구의 초점이 단일 성분에서 여러 성분이 함께 내는 효과로 옮겨 가고 있다. 그걸 이해하려면 각 구성 성분이 약리적으로 무엇을 하는지 알아야 한다.

<mark>그런데 바로 그 데이터가 없다.</mark> 합성 의약품에는 표준 분류 체계가 따라온다. ATC (anatomical therapeutic chemical) 코드, MeSH (medical subject headings) 용어, 정리된 부작용 목록. 천연물에는 없다. ChEMBL과 NPASS가 표적 수준 활성 — IC₅₀, Kᵢ — 을 제공하지만, "이 표적에 붙는다"에서 "임상적으로 이렇게 쓰인다"로 가는 건 데이터가 받쳐 주지 못하는 도약이다. 데이터가 적은 게 아니라 불완전하기 때문이다.

그래서 통상적인 방법, 즉 라벨된 예시로 분류기를 학습하는 방식은 발 디딜 곳이 없다. 이 일을 하는 기존 프레임워크 대부분은 기존 의약품을 염두에 두고 만들어졌고 그 라벨 분포를 물려받았다.

## 라벨은 어디서 오나

추천 방식이라 라벨이 붙은 쪽이 자산 전부다. PubChem CID를 끌어올 수 있는 공개 데이터베이스
여섯 곳에서 모았다. **DrugBank**, **SIDER**, **LOTUS**, **NPASS**, **HERB 2.0**, **TM-MC 2.0**.
이렇게 PubChem 레코드 331,326건을 받았는데 그중 **분류 annotation이 붙어 있는 것은 9,721개**뿐이다.
이 비율 자체가 논문의 전제를 숫자로 다시 적은 것이다.

annotation은 PubChem의 ATC·MeSH 문자열이고, 온톨로지 사슬 형태로 들어온다
(`Enzyme Inhibitors > HMG-CoA Reductase Inhibitors|…`). 코드를 떼고 소문자로 바꾸고 중복을 지워
정리하되 **사람 손으로 합치지는 않는다.** *antiparkinsonian agent*와 *antiparkinson agents*는
서로 다른 온톨로지 사슬에 있어서, 묶어 버리면 출처까지 되짚어 갈 수 없게 되기 때문이다.
라벨 공간이 계속 큰 채로 남는 이유가 이 선택이다.

| 데이터셋 | 무엇인가 | 쌍 | 고유 라벨 |
| --- | --- | --- | --- |
| **Annotated-Compound** | annotation이 붙은 9,721개. 모든 검색이 상대하는 풀 | 54,675 | **1,520** |
| **AnnoCom1000** | 거기서 1,000개를 뽑은 개발용 | 5,612 | 872 |
| **DrugBank1000** | 약물 1,000개. 약물 쪽 성능 확인용 | 6,978 | 971 |
| **NP1000** | 천연물 1,000개. 정작 중요한 쪽 확인용 | 3,995 | 544 |
| **Annotated-SE** | SIDER 부작용에 대응시킨 약물 1,376개 | 139,516 | 4,216 |

마지막 열을 보라. 천연물 쪽 고유 라벨이 544개인데 약물 쪽은 971개다. 이 방법이 해결하려는
라벨 부족이 자기 학습 데이터에서 이미 보인다. 부작용 데이터셋은 정반대 극단이다. 약물 하나당
annotation이 평균 101개인데 범주 쪽은 5.6개이고, headache·nausea 같은 몇몇 용어가 너무 흔해서
무작위 화합물로 예측해도 점수가 잘 나온다. 논문도 그렇게 적고 있고, 그래서 부작용 수치를 범주
수치와 나란히 읽으면 안 된다.

## 아이디어

라벨 예측기를 학습하는 걸 포기하고 **유사도로 추천한다.** 단, 최근접 이웃 조회를 넘어서게 만드는 장치가 둘 있다.

<figure>
<img src="/assets/fig/agreementpred-f1.jpg" alt="The AgreementPred framework: similarity under many molecular representations, fused, then filtered by an agreement-score threshold" width="2012" height="874" loading="lazy">
<figcaption><b>프레임워크 전체를 한 줄로.</b> 라벨이 붙은 화합물과 라벨이 없는 천연물을 각각 여러 표현으로 인코딩한다. 유사도 검색 결과를 모아 한 표현만으로는 놓쳤을 라벨을 되찾고, 그다음 <b>일치도 점수 임계값</b>으로 소수의 표현만 지지한 것을 버린다. <mark>합치는 단계가 recall을 사고, 임계값이 precision을 되산다.</mark>
<br><span class="credit">Sutcharitchan et al., <a href="https://doi.org/10.1039/d5dd00329f"><i>Digital Discovery</i> <b>4</b>, 3304&ndash;3319 (2025)</a>, Fig. 1 &#183; <a href="https://creativecommons.org/licenses/by-nc/4.0/">CC BY-NC 4.0</a></span></figcaption>
</figure>

**첫째, 여러 표현을 함께 합친다.** 논문은 **분자 표현 29가지** — [지문](../descriptors-fingerprints-ko/) 28개 + 비지도로 학습한 embedding인 InfoGraph 1개 — 를 평가한 다음, 중복되는 것을 덜어내고 남은 **22가지**를 합친다. 덜어내는 기준이 명시돼 있다. 같은 계열 안에서 Pearson **r = 0.75**를 넘게 상관된 표현은 하나로 합치고, 그 결과 지문 일곱 개(TT, ASP, Daylight, CDKFP, EC2048, MHFP, PH2)가 빠진다. 거의 같은 표현들이 일치도를 부풀리는 것을 막으려는 조치다. 이 집합이 담은 "비슷하다"의 뜻은 서로 실질적으로 다르다.

| 계열 | 무엇을 담나 |
| --- | --- |
| ECFP (extended-connectivity fingerprint) | 각 원자 주변의 원형 환경 |
| Atom pair, AP2D, SPFP | 위상 거리로 색인한 원자쌍 |
| Pharmacophore (PHFP, PH2, PH3) | pharmacophore 특징을 쌍과 삼중항으로 |
| EState | 전자-위상 상태 |
| Graph FP | 경로와 부분그래프 패턴 |

이들은 설계상 서로 다른 답을 낸다. ECFP는 국소 이웃이 맞으면 비슷하다고 하고, pharmacophore 지문은 *단백질에 닿는 특징들* 의 배치가 닮으면 비슷하다고 한다. 한쪽에서 가깝고 다른 쪽에서 먼 두 분자가 있을 수 있다.

**둘째, 얼마나 일치하는지가 신호다.** 표현들을 평균 내어 점수 하나로 만드는 대신 따로 두고 **agreement score** — 몇 개의 표현이 독립적으로 같은 범주를 추천했는가 — 를 계산한다. 임계값 아래 예측은 버린다.

두 가지를 따로 두는 근거는 이렇다. *서로 다른* 유사도 개념을 담은 표현들의 합의는, 그중 하나에서 점수가 높은 것보다 훨씬 강한 근거다. 그리고 답할 수 없는 질문("어느 지문이 옳은가")을 쓸 수 있는 질문("표현들이 서로 일치하는가")으로 바꾼다.

## 규모, 그리고 근거 제시

**annotation 없는 화합물 321,605개**에 적용했고, 그중 **321,596개**가 무언가를 받아 전체 약 **289만 건**의 범주 예측이 나왔다. 예측마다 **가장 유사한 화합물 (MSC)** 이 함께 나온다. 그 예측을 끌어낸, annotation이 붙은 분자다. 사람이 점수를 믿는 대신 근거를 확인할 수 있다.

## 무엇과 비교했나

기준 모델 셋, 과제 셋이다. **SD-ATC**는 커널 지문에서 network 기반 추론으로 ATC 분류를 예측하고,
**iSEA**는 지문 세 개의 유사도를 평균 낸다. **EC1024**는 지문 하나로 하는 최근접 이웃 조회인데,
사실 가장 중요한 대조군이 이쪽이다. ATC 벤치마크는 iSEA 논문이 쓴 승인 약물 1,151개이고 그중
CID를 쓸 수 있는 1,107개를 썼다.

| | AgreementPred | EC1024 (MSC = 1) | EC1024 (MSC = 2) | iSEA | SD-ATC |
| --- | --- | --- | --- | --- | --- |
| ATC 2단계 — recall | 0.670 | 0.523 | 0.601 | **0.748** | 0.671 |
| ATC 2단계 — precision | 0.322 | **0.491** | 0.363 | 0.098 | 0.085 |
| ATC 4단계 — recall | **0.529** | 0.369 | 0.459 | — | 0.478 |
| ATC 4단계 — precision | 0.311 | **0.365** | 0.307 | — | 0.060 |
| AnnoCom1000 — recall | **0.772** | 0.607 | 0.685 | — | 0.374 |
| AnnoCom1000 — precision | 0.487 | **0.574** | 0.510 | — | 0.173 |

기존 발표 방법들과의 차이는 크다. recall이 비슷한 수준에서 **precision이 iSEA·SD-ATC의 서너 배**다.
특히 SD-ATC는 AnnoCom1000에서 무너지는데(0.374 / 0.173), 이건 공정한 결과다. ATC를 위해 만든
모델이고 이 과제는 ATC가 아니다.

<mark class="blue">정작 봐야 할 열은 EC1024 (MSC = 1)이다. 세 과제 모두에서 precision 1위다.
표현 22가지를 합치는 것은 recall을 사는 것이지, 좋은 지문 하나를 precision에서 이기지는 못한다.</mark>
논문은 둘의 *균형*에서 우위라고 주장하고 그건 정확한 서술이다. 다만 "합치는 쪽이 낫다"보다
좁은 주장이고, 논문 자신의 표에서 굵게 표시된 칸들이 그렇게 말하고 있다.

비교 자체에 단서 둘. iSEA는 어려운 두 과제에 값이 없다. 화합물–분류 쌍마다 유사도 계산을 천 번씩
해야 해서 이 정도 라벨 공간에는 못 돌린다. 그래서 있는 값 하나도 **다시 돌린 게 아니라 원 논문에서
인용한 것**이다. 그리고 단일 표현 대조군은 EC1024의 가장 좋은 설정을 썼다. 그게 정직한 방식이다.

## 내가 물을 것

- **일치도에 가중이 없다.** r > 0.75 가지치기가 거의 같은 표현들을 걸러내므로, 떠오르는 반론은 이미 답이 돼 있다. 남는 문제는 살아남은 22가지가 *똑같은 한 표씩*을 던진다는 것이다. pharmacophore 지문과 path 지문은 서로 훨씬 많이 어긋나는데도, 원형 지문 두 개가 서로 일치하는 것과 같은 무게로 센다. 멀리 떨어진 표현들 사이의 일치가 더 값져야 하는데 점수에는 그 말이 없다.
- **임계값은 recall을 내주고 precision을 사는데, 정작 목적이 recall이다.** 필터링은 precision을 올린다. 그런데 이 도구의 목적은 아무도 기록하지 않은 약리작용을 찾는 것이다. 걸러지는 예측 쪽에 새로운 것이 들어 있다.
- **검증이 유사도 방법 특유의 방식으로 순환적이다.** annotation이 붙은 화합물에서 평가하므로 이미 존재하는 라벨을 복원하는 능력으로 점수를 받는다. 정작 겨누는 321,605개에는 구성상 정답이 없다. 저자가 고칠 수 있는 결함은 아니지만, 그 숫자가 뜻하는 범위를 한정한다.

## 내가 읽은 이유

같은 문제에 대한 정반대 접근이다. 나는 손으로 만든 표현이 옳지 않다고 보고 사전학습으로 **표현을 학습**한다. AgreementPred는 어느 표현도 옳지 않다는 걸 받아들이고 대신 **여럿에게 투표시킨다.**

둘 다 "어느 표현이냐"에 대한 답이다. 하나는 질문을 넘어서 학습으로, 하나는 답하기를 거부함으로. 정직하게 비교하면, 내 방식은 학습할 게 없는 데이터에서도 투표 방식은 지금 작동한다. 약리 라벨 없는 천연물 몇천 개는 사전학습 코퍼스가 아니다.

[지문](../descriptors-fingerprints-ko/)에 대한 생각도 한 가지 분명해졌다. 나는 지문 선택을 sweep으로 처리할 성가신 파라미터로 봤다. **지문들 사이의 흩어짐 자체를 하나의 양으로 다룬다**는 건 떠올려 본 적이 없었고, 유사도에 기댄 어떤 주장에든 싸게 붙일 수 있다. 기전 연구의 씨앗을 뿌리는 추천 시스템이라면, 예측마다 근거 분자가 붙는 쪽을 정확도 1 포인트보다 값지게 본다.

## 정리

- 천연물에는 표적 수준 활성 데이터는 있어도 약리 범주 라벨이 거의 없어서 지도학습이 발 디딜 곳이 없다
- AgreementPred는 평가한 29가지 중 **표현 22가지에 걸친 유사도를 합쳐** 추천한다. 지문 28개 + 학습된 embedding 1개
- 그 지문들은 서로 다른 유사도 개념을 담아서 설계상 다른 답을 낸다
- **agreement score** — 몇 개가 독립적으로 일치했는가 — 로 걸러 recall을 내주고 precision을 산다
- 규모로 적용: 화합물 321,605개를 넣어 321,596개가 추천을 받았고 약 289만 건. 각 예측에 근거가 되는, annotation이 붙은 가장 유사한 화합물이 따라붙는다
- 라벨은 데이터베이스 여섯 곳에서 왔고, PubChem 레코드 **331,326건 중 9,721건**에만 붙어 있다. 전제를 숫자로 적으면 이것이다
- iSEA·SD-ATC 대비 비슷한 recall에서 **precision이 서너 배**다. 반면 좋은 지문 하나와 비교하면 recall은 이기고 **precision은 진다**
- 거의 같은 표현은 r > 0.75로 쳐내므로, 남는 문제는 살아남은 것들이 같은 무게로 투표한다는 것
- 훔칠 만한 생각: **표현들 사이의 흩어짐 자체가 측정 가능한 양이다**

## 참고

- Sutcharitchan et al., [AgreementPred](https://doi.org/10.1039/d5dd00329f), *Digital Discovery* **4**(11) (2025) — 여기서 리뷰한 논문
- Zhu et al., [NPASS: natural product activity and species source database](https://doi.org/10.1093/nar/gkx1026), *Nucleic Acids Res.* (2018)
- Bajusz, Rácz & Héberger, [Why is Tanimoto index an appropriate choice for fingerprint-based similarity calculations?](https://doi.org/10.1186/s13321-015-0069-3), *J. Cheminform.* (2015)
