---
title: "MoleSG: 분자의 두 view가 서로를 정말 필요하게 만들기"
date: 2025-05-21
description: "SMILES+graph 사전학습은 보통 두 view를 전역에서만 정렬한다 · MoleSG는 두 view의 마스크를 서로소로 만든다 · 그러면 한쪽을 복원하려면 다른 쪽을 읽어야 한다"
category: review
updated: 2025-06
lang: ko
topic: Cheminformatics
subtopic: Representation
venue: Briefings in Bioinformatics
venueYear: 2024
group: molesg
tags: [review, self-supervised, multimodal, molecular representation]
---

> Shen, Ao, et al. "Complementary multi-modality molecular self-supervised learning via non-overlapping masking for property prediction." *Briefings in Bioinformatics*, vol. 25, no. 4, 2024, article bbae256, [doi.org/10.1093/bib/bbae256](https://doi.org/10.1093/bib/bbae256).
> [PMC11129775](https://pmc.ncbi.nlm.nih.gov/articles/PMC11129775/)

## 기존 dual-view 사전학습의 한계

분자 라벨은 비싸다. 그래서 이 분야 대부분이 라벨 몇천 개뿐인 상황을 [자기지도 사전학습](../transfer-learning-ko/)으로 메운다. 문제는 무엇으로 사전학습하느냐다.

<figure>
<img src="/assets/fig/molesg-f1.jpg" alt="SMILES as an implicit linear string versus a molecular graph, and their different receptive fields" width="660" height="196">
<figcaption><b>Figure 1.</b> 두 view와 각각이 잘하는 것. SMILES (simplified molecular-input line-entry system) 문자열은 짧고 순차적이라 그 위의 Transformer가 <b>전역</b> 맥락을 싸게 본다. 대신 고리 닫힘과 입체화학이 암묵적이다. 그래프는 위상을 명시하므로 그 위의 GNN (graph neural network)이 <b>국소</b> 이웃에는 정확하지만, 깊어질수록 전역 맥락을 잃는다.
<br><span class="credit">Shen et al., <a href="https://doi.org/10.1093/bib/bbae256"><i>Brief. Bioinform.</i> <b>25</b>(4), bbae256 (2024)</a> &#183; 논문 그림, Figure 1</span></figcaption>
</figure>

이 상보성이 둘을 합치자는 통상적인 논거이고, 이미 여러 모델이 그렇게 한다. GraphMVP(2D+3D), MoleculeSTM(그래프+텍스트), MOCO와 DVMP(SMILES+그래프).

<mark>논문이 이들 전부에 대해 하는 불평은 같다. 두 view를 **전역에서만** 정렬한다는 것이다.</mark> 같은 분자의 두 view는 당기고 다른 분자는 밀어내는 분자 전체 embedding 사이의 contrastive 손실뿐이고, 원자 수준에서 정보를 주고받게 강제하는 것이 없다. 논문의 지적대로라면 인코더 둘이 각자 괜찮은 표현을 독립적으로 배우면서도 전역 contrastive 목적은 만족시킬 수 있다. "상호작용"이 마지막의 내적 하나인 셈이다.

## 아이디어

<figure>
<img src="/assets/fig/molesg-f2.jpg" alt="MoleSG: masked SMILES and graph encoders, a shared Transformer backbone, and two decoders" width="666" height="256">
<figcaption><b>Figure 2.</b> 전체 구조. 각 view를 따로 마스킹하고 인코딩한 뒤, 두 토큰 열이 <b>공유 Transformer backbone</b>에서 만나고, 모달리티별 디코더 둘이 원래 입력을 복원한다. 목적함수는 contrast가 아니라 복원이다.
<br><span class="credit">Shen et al., <a href="https://doi.org/10.1093/bib/bbae256"><i>Brief. Bioinform.</i> <b>25</b>(4), bbae256 (2024)</a> &#183; 논문 그림, Figure 2</span></figcaption>
</figure>

통상적인 조리법에서 바뀐 것이 두 가지다. 목적이 contrastive 정렬이 아니라 **마스크 복원**이고, 두 view가 **공유** backbone을 지나며 거기서 [self-attention](../attention-ko/)이 둘을 섞을 수 있다.

논문은 복원만으로는 협력이 강제되지 않는다고 적는다. 가려진 SMILES 토큰은 주변 SMILES만 보고도 채울 수 있기 때문이다. 두 view가 서로를 필요로 하게 만드는 장치는 **마스킹**이다.

## 겹치지 않는 마스킹

<figure>
<img src="/assets/fig/molesg-f3.jpg" alt="Atom-index alignment between SMILES tokens and graph nodes, then disjoint masks" width="666" height="217">
<figcaption><b>Figure 3.</b> 마스킹은 두 단계다. 먼저 SMILES 토큰을 원자·결합·문법 기호로 나누고, <b>원자</b> 토큰에만 색인을 붙여 그래프 node와 맞춘다. 그다음 두 마스크를 <b>서로소</b>로 고른다. SMILES에서 가려진 원자는 그래프에서는 보이고, 그 반대도 마찬가지다.
<br><span class="credit">Shen et al., <a href="https://doi.org/10.1093/bib/bbae256"><i>Brief. Bioinform.</i> <b>25</b>(4), bbae256 (2024)</a> &#183; 논문 그림, Figure 3</span></figcaption>
</figure>

정렬 단계는 말처럼 간단하지 않다. SMILES에는 토큰이 세 종류다. 원자(`C`, `N`, `[Cl-]`), 결합(`=`, `#`), 문법 기호(괄호, 고리 닫힘 숫자). 그리고 단일 결합은 대개 아예 생략되므로 문자열과 그래프가 위치별로 대응하지 않는다. 그래프 node와 색인을 맞출 수 있는 건 **원자 토큰뿐**이고, 정렬이 뽑아내는 게 그것이다.

맞추고 나면 두 마스크를 서로소로 만든다. <mark class="blue">이제 한쪽에서 가려진 원자를 복원하려면 다른 쪽을 읽는 수밖에 없다. 자기 쪽에서는 그 정보를 일부러 없앴기 때문이다.</mark> 교차 모달 상호작용이 선택이 아니게 된다.

마스크 비율은 SMILES 15%, 그래프 25%. 둘 다 튜닝한 값이고, 그 sweep은 ablation에 보고되어 있다.

## 평가

| | |
| --- | --- |
| 사전학습 | ZINC15에서 라벨 없는 분자 25만 개 |
| downstream | MoleculeNet 14종 — 분류 과제 678개, 회귀 19개 |
| split | [scaffold](../data-splitting-ko/), 8:1:1 (QM9만 random), 3 seed |
| 지표 | 분류는 ROC-AUC (receiver operating characteristic area under the curve), 회귀는 RMSE (root mean squared error) 또는 MAE (mean absolute error) |
| 비교군 | 지도학습 (MPNN, DMPNN, CMPNN, CoMPT)과 사전학습 (GROVER, GraphMVP, MolCLR, GEM, DVMP, SMICLR) |

14개 과제에서 최고 또는 그에 준하는 성능을 보고하고, ablation으로 기전을 직접 시험한다. SMILES 마스크 비율, 그래프 마스크 비율, 그리고 **두 마스크의 겹침 비율**에 따른 성능이다. 겹치지 않음이 기전이라면 겹침을 허용할수록 성능이 나빠져야 하고, ablation이 그걸 보인다.

MolCLR과 DVMP를 자기들 인코더 안에서 다시 구현해 비교하므로, "backbone이 좋아서 이긴 것 아니냐"는 통상적인 반론은 지워진다.

## 내가 물을 것

**fine-tuning에서 모달리티 하나만 쓰고 backbone을 버린다.** 논문에 그대로 적혀 있고, 내가 계속 곱씹게 되는 부분이다. fine-tuning하는 건 사전학습된 그래프 인코더뿐이고, SMILES 가지와 공유 Transformer는 그 시점에 버려진다. 이유는 공정성이라고 적혀 있다. 비교 모델들이 테스트 시점에 그래프만 쓰기 때문이다.

방어 가능한 선택이고, 동시에 검증되는 주장이 처음 보이는 것보다 좁다는 뜻이기도 하다. "multimodal 모델이 더 잘 맞힌다"가 아니다. **"두 번째 view가 있는 환경에서 학습된 그래프 인코더가 혼자 학습된 것보다 낫다"** 이다. 두 번째 모달리티는 사전학습 동안의 발판이고, 쓰기 전에 치워진다. 어쩌면 더 흥미로운 주장인데, 논문은 그렇게 틀을 잡지 않는다.

**겹침 ablation이 논증 전부인데 그림 하나로 끝난다.** 모든 것이 "겹치지 않음이 유효 성분"이라는 데 걸려 있다. 데이터셋 한둘에서의 sweep은 시사적일 뿐이고, 14개 전부에서 같은 sweep을 돌리면 결론이 난다.

**정렬이 SMILES에 특화돼 있다.** 원자 토큰 색인은 SMILES 문법의 특이점에 기댄다. 논문은 단백질 서열+구조로의 확장을 제안하는데, 거기서는 잔기가 깔끔하게 색인되므로 정렬이 오히려 쉽다. 그쪽이 더 유망해 보인다.

## 내가 읽은 이유

이중 view라는 틀이 내가 하는 일과 같다. [SJoINT](https://github.com/sslim-aidrug/SJoINT)도 한 분자의 두 view로 사전학습하고, 분자 전체보다 아래 수준에서의 상호작용을 원한다. 차이는 제약이 어디 걸리느냐다. MoleSG는 **마스크**를 제약해서 두 view가 서로를 참조하게 만들고, 나는 **attention**을 포함 관계로 제약해서 원자가 자기를 품은 부분구조와만 정보를 주고받게 한다.

둘 다 전역 contrastive 학습에 대한 같은 불평의 답이다. MoleSG 쪽이 더 싸고 — 구조적 제약 없이 데이터 쪽 장치만으로 된다 — 내 쪽은 어떤 쌍이 상호작용해도 되는지에 더 구체적이다. 어느 쪽이 나은지는 두 논문 모두 묻지 않은 경험적 질문이다.

## 정리

- SMILES는 전역 맥락을, 그래프는 국소 구조를 나르는데, 기존 multimodal 연구는 둘을 분자 전체 수준에서만 정렬했다
- MoleSG는 contrastive 정렬을 **마스크 복원**으로 바꾸고 공유 Transformer를 둔다
- 기전은 **겹치지 않는 마스킹**이다. 원자 토큰을 그래프 node와 색인한 뒤 두 마스크를 서로소로 만든다
- 그래서 한 view를 복원하려면 다른 view를 읽어야 한다. 교차 모달 상호작용이 선택이 아니라 필수가 된다
- 사전학습 ZINC15 25만 개, downstream MoleculeNet 14종 scaffold split, 3 seed
- 실제로 검증되는 주장은 "multimodal이 낫다"보다 좁다. **두 번째 view는 사전학습의 발판이고 fine-tuning 전에 버려진다**

## 참고

- Shen et al., [Complementary multi-modality molecular self-supervised learning via non-overlapping masking](https://doi.org/10.1093/bib/bbae256), *Brief. Bioinform.* **25**(4) (2024) — 여기서 리뷰한 논문
- Liu et al., [Pre-training molecular graph representation with 3D geometry](https://arxiv.org/abs/2110.07728) (ICLR 2022) — GraphMVP
- Wang et al., [MolCLR: molecular contrastive learning of representations via graph neural networks](https://doi.org/10.1038/s42256-022-00447-x), *Nat. Mach. Intell.* (2022)
