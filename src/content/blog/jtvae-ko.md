---
title: "JT-VAE: 만들어지는 순간 이미 유효한 분자"
date: 2024-02-22
description: "SMILES를 한 글자씩 만들면 깨지는 이유 · 원자 단위 그래프 생성이 유효하지 않은 중간 상태를 지나는 이유 · 트리 분해와 junction tree · 잠재 벡터 둘과 디코더 둘 · vocabulary라는 천장"
category: review
updated: 2024-03
lang: ko
topic: Cheminformatics
subtopic: Representation
venue: ICML
venueYear: 2018
group: jtvae
tags: [review, generative models, junction tree, molecular representation]
---

> Jin, Wengong, et al. "Junction Tree Variational Autoencoder for Molecular Graph Generation." *arXiv*, 12 Feb. 2018, [arxiv.org/abs/1802.04364](https://arxiv.org/abs/1802.04364). Preprint.
> [code](https://github.com/wengong-jin/icml18-jtnn)

## 분자를 생성한다는 것의 문제

신약 개발은 원하는 성질을 가진 분자를 찾는 일이고, 그 탐색을 대부분 사람이 한다. 자동화하면 둘로 나뉜다. 성질을 최적화할 수 있는 연속 벡터로 분자를 인코딩하고, 그 벡터를 다시 분자로 디코딩하는 것.

무너지는 쪽은 디코딩이다. 2018년 당시 주류는 **SMILES (simplified molecular-input line-entry system) 문자열을 한 글자씩** 생성하는 것이었고, 논문이 짚는 문제가 두 가지다.

- **대부분의 문자열은 분자가 아니다.** 괄호와 고리 닫힘 숫자가 맞아떨어져야 하는데 글자 단위 모델은 자주 틀린다. 초기 SMILES VAE (variational autoencoder)들의 유효율은 100%에 한참 못 미쳤다.
- **문자열이 비슷하다고 분자가 비슷한 게 아니다.** 원자 하나 다른 두 분자의 SMILES가 크게 다를 수 있어서, 문자열 공간의 거리가 화학적 거리와 대응하지 않는다. 연속 잠재 공간에서 최적화하겠다는 목적 자체가 무너진다.

그래프를 원자 단위로 직접 생성하면 두 번째는 해결되지만 첫 번째가 형태를 바꿔 남는다. 짓다 만 분자는 화학적으로 성립하지 않는 상태를 지나므로 유효성은 끝에 가서야 확인할 수 있다.

## 분자를 트리로 다시 쓰기

<figure>
<img src="/assets/fig/jtvae-treedecomp.png" alt="A molecule decomposed into clusters and the junction tree over them" width="2362" height="700">
<figcaption><b>트리 분해.</b> 고리와 결합이 클러스터가 되고, 원자를 공유하는 클러스터끼리 잇고, 그 클러스터 그래프의 spanning tree가 junction tree다. 분자는 바뀌지 않았다. <b>고리가 없는 형태로 다시 쓰였을 뿐이다.</b>
<br><span class="credit">Jin, Barzilay &amp; Jaakkola, <a href="https://arxiv.org/abs/1802.04364">Junction Tree Variational Autoencoder for Molecular Graph Generation</a>, ICML 2018 &#183; 논문 그림, Figure 2</span></figcaption>
</figure>

논문이 적은 구성 절차는 이렇다.

1. **클러스터를 찾는다.** 모든 단순 고리, 그리고 고리에 속하지 않는 모든 결합.
2. **가교 고리 (bridged ring)를 병합한다.** 원자를 둘 넘게 공유하는 두 고리는 한 클러스터로 묶는다. 안 그러면 bridged bicyclic이 다시 조립할 수 없는 방식으로 쪼개진다.
3. **클러스터 그래프를 만든다.** 원자를 공유하는 클러스터끼리 잇는다.
4. **spanning tree를 고른다.** 그게 junction tree다.

형식 조건이 둘 있다. 클러스터들의 합집합이 분자 전체를 덮어야 하고, **running intersection property** — $C_i$에서 $C_j$로 가는 경로에 $C_k$가 있으면 $V_i \cap V_j \subseteq V_k$ — 가 성립해야 한다. 두 번째 조건은 두 클러스터가 공유하는 원자가 그 사이의 모든 클러스터에도 들어 있다는 뜻이고, 그래서 트리에서 이웃만 보고 조각을 붙여도 안전하다.

<mark class="blue">요점은 트리는 한 node씩 생성할 수 있고 고리 있는 그래프는 그럴 수 없다는 것이다.</mark> 고리가 삭제된 게 아니라 node 라벨 안으로 들어갔고, 거기서는 더 쪼개지지 않으며 항상 유효하다.

## 잠재 벡터 둘, 디코더 둘

<figure>
<img src="/assets/fig/jtvae-paradigm.png" alt="The JT-VAE pipeline: decompose, encode tree and graph, decode tree, assemble" width="1146" height="1300">
<figcaption><b>전체 흐름.</b> 분자를 junction tree로 분해하고, 트리와 그래프를 각각 잠재 벡터 $z_T$·$z_G$로 인코딩한다. 디코딩은 $z_T$에서 트리를 복원한 뒤 $z_G$를 써서 node들을 다시 분자로 조립한다.
<br><span class="credit">Jin, Barzilay &amp; Jaakkola, <a href="https://arxiv.org/abs/1802.04364">Junction Tree Variational Autoencoder for Molecular Graph Generation</a>, ICML 2018 &#183; 논문 그림, Figure 1</span></figcaption>
</figure>

**$z_T$는** *어떤 조각들이 어떻게 배치되는지*를 말하고, **$z_G$는** *실제로 어떻게 융합되는지* — 치환기가 고리의 *어느 원자*에 붙는지 — 를 말한다. 성격이 다른 정보이고, 둘을 분리해 둔 덕분에 디코더가 두 단계로 작동할 수 있다.

**1단계, 트리 디코딩.** junction tree를 node 하나씩 생성한다. 각 node의 라벨은 학습 데이터에서 추출한 화학적으로 유효한 구성 요소(고리·결합·원자)의 고정된 vocabulary에서 고른다.

**2단계, 조립.** 인접한 두 트리 node에 대해 실제로 붙는 방법이 여럿이다. 점수 네트워크가 후보 붙임을 순위 매기고 가장 좋은 것을 고른다.

유효성 보장은 1단계에서 나온다. vocabulary의 모든 항목이 실재하는 화학 부분구조이므로 모델이 유효하지 않은 것을 조립할 일이 없다. 보고된 유효율은 **100%이고**, SMILES 기반 기준선들은 한참 아래다.

## 무엇에 쓰나

생성 외에, 벌점 logP에 대한 잠재 공간 Bayesian 최적화와 제약 최적화를 한다. 벌점 logP는 이 분야의 표준 연습용 목표값으로, 친유성에서 합성 난이도만큼을 깎은 값이다. 제약 최적화는 분자를 받아 Tanimoto 유사도(두 분자의 지문이 겹치는 정도) 한계 안에 머물면서 잠재 공간에서 움직인 뒤 디코딩하는 것이다. 두 번째가 실제 약화학의 작업과 모양이 같다. *알아볼 수 없을 만큼 바꾸지는 말고 이 분자를 개선하라.*

## 무엇으로, 무엇과 비교해 시험했나

**ZINC**, 약물 유사 분자 약 25만 개다. 이 과제의 표준 말뭉치라서 비교가 읽힌다. 비교 대상은 이 논문이
논박하려는 SMILES 문자열 기반 VAE들이다. CVAE는 문자를 생성하고, GVAE는 문법을 더하고, SD-VAE는
구문 지향 제약을 더한다.

| | 재구성 | prior 유효성 |
| --- | --- | --- |
| CVAE | 44.6% | 0.7% |
| GVAE | 53.7% | 7.2% |
| SD-VAE | 76.2% | 43.5% |
| GraphVAE | — | 13.5% |
| 원자 단위 LSTM | — | 89.2% |
| **JT-VAE** | 76.7% | **100.0%** |

<mark>두 열을 따로 보라. 재구성에서는 JT-VAE가 SD-VAE와 76% 언저리로 비슷하다. 유효성에서는
혼자 100%인데, 여기서 유효성은 학습한 것이 아니라 구성으로 보장된 것이다.</mark> 트리의 모든 node가
화학적으로 유효한 조각이고 조립 단계가 유효한 조합만 받으므로, 유효하지 않은 분자는 나올 수가 없다.
문법 기반 모델들은 같은 성질을 *배워서* 올라가고 있었는데, 트리는 그걸 배울 필요가 없게 만든다.

최적화 결과도 거기서 따라온다. 잠재 공간에서 Bayesian 최적화를 돌리면 penalised logP 기준 5.30 /
4.93 / 4.49짜리 분자를 찾는다. SD-VAE는 4.04다. Gaussian process도 JT-VAE 잠재 공간에 더 잘 맞는다
(RMSE, root-mean-square error: 1.290 대 1.366). 유사도 제약을 걸면 맞바꿈이 눈에 보이고, 그 서술이 정직하다. sim ≥ 0.4에서
성공률 83.6%에 평균 개선 0.84이고, sim ≥ 0.6에서는 성공률이 46.4%로 떨어진다.

## 내가 물을 것

- **vocabulary에 의존한다.** 구성 요소 집합을 학습 데이터에서 뽑으므로 한 번도 나오지 않은 고리계는 아예 생성할 수 없다. 튜닝으로 비켜갈 수 있는 모델링 선택이 아니라 출력 공간에 걸린 단단한 천장이고, 그 바깥에 있는 분자가 바로 새로운 분자다.
- **임의의 분자에 junction tree가 보장되지 않는다.** 분해는 겹침 구조가 얌전하다고 가정한다. 가교와 융합이 심한 계에서 병합 규칙이 개입해야 하는데, 그 규칙은 휴리스틱이다.

지금이라면 하나 더 붙이겠다. **어려운 화학은 조립 단계에 있는데 거기에 가장 관심이 적게 간다.** 다들 기억하는 건 트리 디코더지만, 조각이 *어느 원자에* 붙느냐가 출력이 원하던 분자인지를 결정한다. 그리고 그 일은 열거된 후보에 대한 순위 네트워크가 한다.

## 나에게 왜 중요한가

junction tree는 [SJoINT](https://github.com/sslim-aidrug/SJoINT)의 두 view 중 하나이고, 내가 쓰는 분해가 이것 그대로다. 전처리의 `tree_decomp`가 Jin et al.의 알고리즘이다. 다른 건 목적이다. 여기서 트리는 **생성**을 node 단위로 진행하려고 존재하고, 내 작업에서는 분자에 원자 그래프와 대조할 **두 번째 서술**을 주려고 존재한다.

그 차이가 vocabulary 문제에서 드러난다. 생성 모델은 못 본 고리에 무력하다. 내놓을 방법이 없기 때문이다. 표현 모델은 그 고리가 `<UNK>`로 떨어지고 원자 view가 대신 지고 가면 된다. 같은 분해인데 단단한 천장이 무른 천장이 된다.

## 정리

- SMILES 생성은 유효하지 않은 문자열과 거리가 의미 없는 잠재 공간을 만들고, 원자 단위 그래프 생성은 유효하지 않은 중간 상태를 지난다
- **junction tree**는 분자를 고리 없는 형태로 다시 쓴다. 고리는 node 라벨 안으로 들어가 항상 유효하다
- 구성: 고리와 결합을 클러스터로, 가교 고리는 병합, 원자를 공유하면 연결, spanning tree를 선택
- 잠재 둘: **$z_T$는** 어떤 조각이 어떻게 배치되는지, **$z_G$는** 어떻게 융합되는지
- 트리를 먼저 디코딩하고 조립한다. vocabulary의 모든 항목이 실재 부분구조라 **유효율 100%**
- 한계: vocabulary가 생성 가능 범위에 걸린 단단한 천장이고, 분해가 모든 분자에 보장되지 않는다
- 생성이 아니라 표현이 목적이면 그 천장이 무뎌진다. 못 본 고리는 원자 view로 받으면 된다

## 참고

- Jin, Barzilay & Jaakkola, [Junction tree variational autoencoder for molecular graph generation](https://arxiv.org/abs/1802.04364) (ICML 2018) — 여기서 리뷰한 논문
- Gómez-Bombarelli et al., [Automatic chemical design using a data-driven continuous representation of molecules](https://doi.org/10.1021/acscentsci.7b00572), *ACS Cent. Sci.* (2018) — 비교 대상이 된 SMILES VAE
- Jin, Barzilay & Jaakkola, [Hierarchical generation of molecular graphs using structural motifs](https://arxiv.org/abs/2002.03230) (ICML 2020) — 후속 논문. [리뷰](../hiervae-ko/)
