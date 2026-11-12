---
title: "HierVAE: 분자를 한 구절씩 만들기"
date: 2024-04-11
description: "JT-VAE의 조각은 고리와 결합이라서 폴리머 하나에 디코딩 약 70단계가 걸린다 · 단계마다 오류가 누적된다 · 대신 데이터에서 캐낸 motif를 쓴다 · 거친 것에서 세밀한 것으로 세 층 디코딩 · 폴리머 하나를 11단계로"
category: review
updated: 2024-05
lang: ko
topic: Cheminformatics
subtopic: Representation
venue: ICML
venueYear: 2020
group: hiervae
tags: [review, generative models, motifs, molecular representation]
---

> Jin, Wengong, et al. "Hierarchical Generation of Molecular Graphs using Structural Motifs." *arXiv*, 8 Feb. 2020, [arxiv.org/abs/2002.03230](https://arxiv.org/abs/2002.03230). Preprint.
> [code](https://github.com/wengong-jin/hgraph2graph)

[JT-VAE (junction tree variational autoencoder)](../jtvae-ko/)와 저자가 같고 2년 뒤에 나온 논문으로, JT-VAE가 하지 못한 것을 겨눈다.

## 큰 분자에서 무너지는 이유

기존 두 계열 — 원자를 하나씩 붙여 만드는 쪽과 고리·결합 단위 부분구조로 만드는 쪽 — 모두 소분자에서는 되고 큰 분자에서 무너진다. 논문이 드는 근거는 단계 수다. 다만 논문은 이걸 표가 아니라 글로 논증하므로, 아래 숫자는 **원자 80개쯤인 폴리머를 놓고 내가 계산해 본 것**이다. 논문이 기존 모델들이 무너진다고 보고하는 크기가 그 언저리다.

| 방법 | 큰 분자 하나를 만드는 데 드는 단계 |
| --- | --- |
| CG-VAE (constrained graph variational autoencoder, 원자 기반) | 원자 예측 약 70회 + 결합 예측 약 150회 |
| [JT-VAE](../jtvae-ko/) (부분구조 기반) | 부분구조 예측 약 35회 + 붙임 예측 약 35회 |
| **HierVAE** (motif 기반) | **11회** |

<mark class="blue">단계마다 틀릴 기회가 있고, 오류는 상쇄되지 않고 누적된다. 그리고 gradient는 그 전부를 거슬러 가야 한다.</mark> 약물 같은 분자에서는 멀쩡해 보이는 재구성 정확도가 폴리머와 펩타이드에서 무너지는 이유다.

JT-VAE에는 규모에서 생기는 문제가 하나 더 있다. 디코더가 한 부분구조의 이웃 전체를 *한 번에* 조립하므로, 조각이 커질수록 후보 붙임의 수가 조합적으로 늘어난다. 작은 고리라서 감당됐던 것이고, 그보다 커지면 감당이 안 된다.

## 생성 단위: 원자, 부분구조, motif

논문은 생성 단위를 자연어에 견준다.

| 생성 단위 | 자연어 대응 |
| --- | --- |
| 원자 | 글자 |
| 부분구조 — 고리 하나 또는 결합 하나 | 단어 |
| **motif** — 유연하고, 고리 여럿에 걸칠 수 있음 | **구절** |

JT-VAE에서 조각은 *정의상* 고리 하나 아니면 결합 하나이고, 원자 여섯 개를 넘는 일이 드물다. motif는 데이터가 반복된다고 말하는 것이면 무엇이든 된다. 고리에 융합된 고리, 치환기까지 붙은 고리, 폴리머의 반복 단위.

<figure>
<img src="/assets/fig/hiervae-motif.png" alt="Extracting structural motifs from a molecule" width="870" height="392">
<figcaption><b>motif 예시.</b> motif를 규칙으로 고정하지 않고 학습 데이터에서 캐낸다. 그래서 vocabulary가 다루는 화학에 맞춰진다. 약물 같은 분자에는 작은 고리들이, 폴리머에는 반복 단위가 나온다.
<br><span class="credit">Jin, Barzilay &amp; Jaakkola, <a href="https://arxiv.org/abs/2002.03230">Hierarchical Generation of Molecular Graphs using Structural Motifs</a>, ICML 2020 &#183; 논문 그림, Figure 4</span></figcaption>
</figure>

논문의 논지는 큰 분자가 **반복되는 motif로 지어진다**는 것이다. 폴리머를 폴리머이게 하는 게 그것이고, 생성 단위를 그 구조에 맞추면 70단계가 11단계로 줄어든다.

## 거친 것에서 세밀한 것으로, 세 층

<figure>
<img src="/assets/fig/hiervae-encoder.png" alt="The hierarchical encoder: atom layer, attachment layer, motif layer" width="1134" height="1196">
<figcaption><b>계층.</b> 분자를 motif, 그들 사이의 붙임 구성, 원자 — 세 수준에서 동시에 표현하고, 인코딩과 디코딩이 한 수준에 머물지 않고 수준 사이를 오간다.
<br><span class="credit">Jin, Barzilay &amp; Jaakkola, <a href="https://arxiv.org/abs/2002.03230">Hierarchical Generation of Molecular Graphs using Structural Motifs</a>, ICML 2020 &#183; 논문 그림, Figure 2</span></figcaption>
</figure>

디코딩은 세 층으로 나뉜다.

1. **motif 층** — 다음에 어떤 motif가 오는가.
2. **붙임 (attachment) 층** — 그 motif의 어느 원자가 연결점인가.
3. **원자 층** — 그 붙임을 실현하는 실제 결합.

JT-VAE는 이 중 둘이 하나의 조합적 조립 단계로 뭉쳐 있었다. 붙임을 독립된 예측으로 떼어낸 것이 큰 motif를 쓸 수 있게 만든 장치다. 두 큰 조각이 붙을 수 있는 모든 방법을 열거할 필요 없이, 연결점을 예측하고 그다음 결합을 예측한다.

논문이 내세우는 하이브리드가 이것이기도 하다. motif가 부분구조 방법의 속도를, 원자 층이 원자 기반 방법의 정밀도를 준다.

## 무엇으로, 무엇과 비교해 시험했나

과제 둘이다. 크기 양 끝에서 주장을 시험하도록 고른 조합이다.

**폴리머.** motif 논증이 정작 겨냥하는 경우다. St. John et al.의 폴리머 86K를 76K / 5K / 5K로
나눠 쓴다. 이 말뭉치에서 motif를 뽑으면 **436개**가 나오고, 각각 평균 5.24가지 붙임 구성을 가진다.
고리 규칙이 아니라 데이터에서 만든 vocabulary다. 비교 대상은 SMILES VAE, CG-VAE(원자 단위),
그리고 [JT-VAE](../jtvae-ko/)(고리와 결합)다.

| | 재구성 | 유효성 | logP Frechet | 분자량 Frechet |
| --- | --- | --- | --- | --- |
| SMILES VAE | 21.5% | 93.1% | 1.471 | 4963 |
| CG-VAE | 42.4% | 100% | 3.958 | 3944 |
| [JT-VAE](../jtvae-ko/) | 58.5% | 100% | 2.645 | 10867 |
| **HierVAE** | **79.9%** | 100% | **0.525** | **1928** |
| · 작은 motif만 | 71.0% | 100% | 0.872 | 5320 |

<mark>재구성이 58.5%에서 79.9%로 간다. 그리고 논증을 지탱하는 줄은 ablation이다. 구조는 그대로 두고
큰 motif만 고리·결합으로 바꾸면 71.0%로 떨어진다.</mark> 이득의 출처는 계층이 아니라 vocabulary다.

**작은 분자.** 한쪽을 얻고 다른 쪽을 잃은 게 아님을 보여야 하는 자리다. graph translation 네 과제에서
격차는 과제마다 다르다. QED (quantitative estimate of drug-likeness) 성공률은 76.9% 대 AtomG2G 73.6%이고
sim ≥ 0.4의 logP에서는 AtomG2G와 3.98로 같다. 반면 DRD2는 85.9% 대 가장 좋은 베이스라인 77.8%이고, 논문의 ablation은 그 격차의 상당 부분을 motif decoder 몫으로 돌린다.
그러니 motif가 제값을 못 하는 건 고리와 결합이 이미 쓸 만한 단위였던 구간이고, 어디서나 그런 것은 아니다.

## 내가 물을 것

- **vocabulary 문제가 해결된 게 아니라 옮겨졌다.** JT-VAE의 천장은 고정된 고리 집합이었고, HierVAE의 천장은 학습 데이터에서 캐낸 고정된 motif 집합이다. 조각이 커지면 vocabulary는 더 크고 더 희소해지므로 long tail이 더 길어진다. 논문의 이득은 vocabulary를 도메인에 맞춘 데서 오는데, 그 말은 vocabulary가 도메인 특이적이라는 뜻이기도 하다. 폴리머 모델의 motif는 약물 모델의 motif가 아니다.
- **단계 수가 핵심 기전인데 논문이 수치로 제시하지 않는다.** 폴리머 하나에 11단계는 인상적인 숫자지만 주장은 일반적이다. 테스트셋 전체의 단계 수 분포가 있으면 결판이 나는데, "생성 단계가 많다"는 서술만으로는 안 된다.
- **motif 추출은 전처리 선택인데 비중이 크다.** motif가 어디서 오느냐가 모델이 표현할 수 있는 것을 결정하는데, 그 부분은 학습되는 영역 *바깥* 에 있다. 학습되는 게 아니라 조정되는 것이다.

## 두 논문을 함께 읽으면

JT-VAE와 HierVAE는 같은 아이디어를 두 가지 크기 단위로 구현한 것이고, 순서대로 보면 junction tree가 실제로 하던 일이 드러난다. 트리 자체는 요점이 아니었다. **원자보다 큰 단위를 고르는 것**이 요점이었고, 트리는 그걸 안전하게 만들어 주는 기록 장치였다. 그걸 보고 나면 자연스러운 질문은 "단위가 얼마나 커야 하나"이고, HierVAE의 답은 단계 수가 작게 유지될 만큼 크게, 규칙으로 정하지 말고 데이터에서 배워서 정한다는 것이다.

표현 (representation) 작업에서는 이 절충이 뒤집힌다. [SJoINT](https://github.com/sslim-aidrug/SJoINT)에서 이쪽이 아니라 JT-VAE의 분해를 쓰는 이유다. 생성기는 단계마다 틀릴 위험이 있으니 적고 큰 단위를 원한다. 표현은 코퍼스 전반에서 반복되는 단위를 원한다. 그래야 그 단위의 embedding이 의미를 갖는다. 그리고 작고 구조가 고정된 고리가 큰 motif보다 훨씬 자주 반복된다.

## 정리

- 원자 기반도 부분구조 기반도 큰 분자에서 실패한다. 단계가 많고 오류가 누적되기 때문이다
- JT-VAE에는 문제가 하나 더 있다. 큰 부분구조의 이웃을 한 번에 조립해야 해서 후보 붙임이 조합적으로 늘어난다
- **motif**는 데이터에서 캐낸 유연한 조각이다. 원자 : 부분구조 : motif = 글자 : 단어 : **구절**
- 디코딩은 **거친 것에서 세밀한 것으로** 세 층 — motif → 붙임 → 원자. 붙임을 떼어낸 것이 큰 motif를 쓸 수 있게 한다
- 70단계가 걸리던 폴리머가 **11단계**
- vocabulary 천장은 사라지지 않고 옮겨지며, motif는 도메인 특이적이 된다
- 생성에는 큰 단위가, 표현에는 반복되는 단위가 이긴다. 표현 쪽에서 작은 고리 분해가 여전히 맞는 이유다

## 참고

- Jin, Barzilay & Jaakkola, [Hierarchical generation of molecular graphs using structural motifs](https://arxiv.org/abs/2002.03230) (ICML 2020) — 여기서 리뷰한 논문
- Jin, Barzilay & Jaakkola, [Junction tree variational autoencoder](https://arxiv.org/abs/1802.04364) (ICML 2018) — 이전 논문. [리뷰](../jtvae-ko/)
- Liu et al., [Constrained graph variational autoencoders for molecule design](https://arxiv.org/abs/1805.09076) (NeurIPS 2018) — 원자 기반 베이스라인 CG-VAE
