---
title: "분자를 쪼개는 방법들: scaffold, BRICS, 작용기, junction tree"
date: 2025-06-20
description: "분자를 왜 쪼개는가 · 같은 분자에 Murcko·BRICS·RECAP·작용기·junction tree를 전부 돌려 본 결과 · 중요한 구분은 자르느냐 다시 쓰느냐 · 어떤 작업에 어떤 방식이 필요한가 · 조각 vocabulary가 터지는 이유"
category: concept
updated: 2025-07
lang: ko
group: fragmentation
topic: Cheminformatics
subtopic: Representation
tags: [BRICS, Murcko scaffold, junction tree, molecular representation]
---

분자는 원자의 그래프이고, 모델은 그대로 읽을 수 있다. 그런데 몇몇 일에는 원자가 잘못된 단위다. 화학자는 **작용기**로 생각하고, 합성 계획은 **조각** 단위로 쓰이며, "14번 원자가 중요했다"고 말하는 모델은 아무것도 설명하지 않은 것이다. 그래서 화학정보학에는 분자를 원자보다 큰 조각으로 자르는 방식이 여럿 있고, 서로 바꿔 쓸 수 있는 것이 아니다.

## 같은 분자, 다섯 가지 방식

<figure>
<img src="/assets/fig/fragmentation.svg" alt="One molecule and the real output of all five schemes: Murcko scaffold, BRICS, RECAP, functional groups and a junction tree" loading="lazy" />
<figcaption><b>각각이 돌려주는 것.</b> 원자 28개짜리 같은 분자에 다섯 가지를 전부 RDKit으로 돌린 결과다. Murcko는 원자 27개짜리 조각 하나, BRICS는 여섯 조각, RECAP은 네 조각이다. BRICS 조각에 붙은 <code>*</code> 번호는 <b>붙임점 (attachment point) 종류</b>로, 어떤 절단이었는지를 기록해 둬서 조각을 규칙대로 다시 붙일 수 있게 한다. 작용기 줄은 자르지 않고 표시만 한다. 분자를 통째로 남기는 건 junction tree뿐이다. node 17개에 edge 16개. 고리는 전부 node 하나로 접히고, 세 개 이상의 clique에 걸친 원자는 자기 node를 받는다.</figcaption>
</figure>

| 방식 | 결과 | 규칙 | 전체가 남나 |
| --- | --- | --- | --- |
| Murcko scaffold | 1개, 28원자 중 27개 | 곁사슬을 떼고 고리와 그 사이 linker만 | 아니오 |
| BRICS (breaking of retrosynthetically interesting chemical substructures) | 조각 6개, 결합 6곳 절단 | 화학자가 다시 붙일 수 있는 결합에서만 자름 | 아니오 |
| RECAP (retrosynthetic combinatorial analysis procedure) | 조각 4개 | 같은 생각, 더 단순한 규칙 11개 | 아니오 |
| 작용기 (functional group) | amide 1 · sulfonamide 1 · 벤젠 3 | 화학적 성질을 담는 단위 | 아니오 |
| junction tree | node 17 · edge 16 | 모든 고리와 모든 비고리 결합이 node | **예** |

## 자르기와 다시 쓰기

표에서 봐야 할 건 마지막 열이다. <mark class="blue">넷은 분자를 **자르고**, junction tree는 **다시 쓴다.**</mark>

BRICS를 돌리고 나면 손에 남는 건 서로 떨어진 조각 여섯 개이고, 분자 전체가 하던 일은 사라진다. 조각만 받은 모델은 그것들이 어떻게 배치돼 있었는지 복원할 수 없다. [HDN-DDI](../hdn-ddi-ko/)가 겨냥한 대가가 이것이고, 그 논문의 답은 층들을 한 그래프에 두는 것이었다.

junction tree는 다른 일을 한다. 고리 하나하나와 결합 하나하나가 node가 되고, 겹치는 원자가 edge가 되어, **같은 분자를 덮는 트리**가 나온다. 버려지는 것이 없고 고리가 사라진다. 그게 요점이다. 고리가 있는 그래프보다 트리가 한 node씩 생성하기 훨씬 쉽기 때문이다.

## 어디에 쓰나

| 작업 | 방식 | 이유 |
| --- | --- | --- |
| 벤치마크 scaffold split | Murcko | 유사체를 묶어 test set이 새 화학이 되게 한다 — [모델 평가](../evaluation-protocol-ko/) 참고 |
| 조각 기반 라이브러리 설계 | BRICS / RECAP | 조각을 합성 가능한 분자로 다시 조립할 수 있다 |
| 그래프 생성 모델 | junction tree | 트리를 생성한 뒤 각 node를 고리로 펼친다 |
| 화학자 수준의 해석 | 작용기 | "sulfonamide가 중요했다"는 문장이 되고, "14번 원자"는 안 된다 |
| contrastive 학습의 두 번째 view | junction tree | 같은 분자의 두 모습이라 positive pair가 공짜 |

마지막 줄이 [SJoINT](https://github.com/sslim-aidrug/SJoINT)에서 쓰는 방식이다. 원자 그래프와 junction tree가 두 view이고, 증강 두 개가 아니라 한 분자를 달리 적은 두 가지 서술이라서 positive pair에 변형이 전혀 들어가지 않는다.

**RelMole**은 마지막 두 줄 사이에 있는 방식으로 알아 둘 만하다. 위층을 고리/결합 clique이 아니라 **작용기**로 둔 두 층짜리 그래프를 만들고, 두 수준 모두에서 분자를 비교하며 학습한다. junction tree와 같은 직관인데 node를 무엇으로 볼지를 다르게 고른 것이다.

## 까다로워지는 지점

- **BRICS는 일부러 고리를 끊지 않는다.** 융합 다고리 약물은 거대한 조각 하나로 나온다. BRICS를 모델에 쓰려면 뒤에 고리 분할 단계를 덧붙여야 하고, HDN-DDI가 하는 일이 정확히 그것이다.
- **vocabulary가 터진다.** junction tree 모델은 node 종류의 고정된 vocabulary가 필요한데, 분자 수십만 개짜리 코퍼스는 한 번만 등장하는 고리의 긴 꼬리를 만든다. ZINC250k에서 적당한 기준으로 자르면 약 1,750개가 나오고, 그보다 드문 것은 전부 `<UNK>`가 되고, 그게 보통 관심 있는 분자들이다.
- **붙임점이 정보를 담고 있다.** `[16*]c1ccccc1`과 맨 벤젠은 같은 조각이 아니다. `*` 표시를 버리면 어떤 절단이었는지가 사라진다.
- **scaffold의 정의가 하나가 아니다.** Murcko, generic Murcko (원자 종류를 지운 것), 그리고 약화학자가 말하는 scaffold는 서로 다른 세 가지이고, 벤치마크 split들이 어느 쪽인지 합의하지 않았다.
- **작용기 탐지는 사실이 아니라 규칙 집합이다.** 구현마다 경계가 달라서, "sulfonamide"를 보고한 논문 둘이 서로 다른 정의를 쓰고 있을 수 있다.

## 정리

- 합성·해석·생성에는 원자가 잘못된 단위라서, 대부분의 파이프라인이 분자를 원자보다 큰 조각으로 쪼갠다
- **Murcko**는 고리와 linker를 남기고, **BRICS/RECAP**은 다시 붙일 수 있는 결합에서 자르고, **작용기**는 화학적 의미 단위를 취한다
- 진짜 구분은 **자르느냐 다시 쓰느냐**다. junction tree는 분자 전체를 남기고 대신 고리를 없앤다
- scaffold → 벤치마크 split · BRICS → 조각 라이브러리 · junction tree → 생성과 이중 view 학습 · 작용기 → 해석
- BRICS는 설계상 고리를 남기므로 뒤에 고리 분할 단계가 보통 필요하다
- junction tree vocabulary에는 긴 꼬리가 있고, 드문 고리는 `<UNK>`가 된다. 대개 그게 관심 있는 분자다

## 참고

- Bemis & Murcko, [The properties of known drugs. 1. Molecular frameworks](https://doi.org/10.1021/jm9602928), *J. Med. Chem.* (1996)
- Degen et al., [On the art of compiling and using drug-like chemical fragment spaces](https://doi.org/10.1002/cmdc.200800178), *ChemMedChem* (2008) — BRICS
- Jin, Barzilay & Jaakkola, [Junction tree variational autoencoder for molecular graph generation](https://arxiv.org/abs/1802.04364) (ICML 2018)
- Ertl, [An algorithm to identify functional groups in organic molecules](https://doi.org/10.1186/s13321-017-0225-z), *J. Cheminform.* (2017)
