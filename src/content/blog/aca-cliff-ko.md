---
title: "activity cliff을 손실 함수 안으로: AC awareness"
date: 2026-11-07
description: "대부분의 모델은 activity cliff를 학습이 끝난 뒤 재는 대상으로 둔다. 이 논문은 학습 중에 cliff triplet을 캐내 contrastive 항으로 넣어서, 구조–활성 곡면이 끊기는 곳에서 잠재 공간을 직접 휜다."
category: review
updated: 2026-11
lang: ko
topic: Cheminformatics
subtopic: Prediction
venue: Nature Communications
venueYear: 2026
group: aca-cliff
tags: [review, activity cliff, contrastive learning, graph neural networks]
draft: true
---

> Cui, Chao, et al. "Activity-cliff awareness enables robust graph learning for molecular property prediction." *Nature Communications*, vol. 17, no. 1, 2026, article 9376, [doi.org/10.1038/s41467-026-75713-2](https://doi.org/10.1038/s41467-026-75713-2).
> [PMC13534492](https://pmc.ncbi.nlm.nih.gov/articles/PMC13534492/)

## activity cliff을 다루는 통상적인 방식

[activity cliff](../activity-cliff-ko/)은 보통 보고의 문제로 다뤄진다. 평범하게 학습한 뒤 test 오차를 cliff와 non-cliff로 나누고, cliff 쪽이 나쁘다는 걸 인정하는 식이다. 이 방식을 퍼뜨린 벤치마크인 [MoleculeACE](../activity-cliff-ko/)는 fingerprint + SVM (support vector machine)이 바로 그 쌍들에서 그래프 신경망(GNN)을 이긴다는 불편한 결론으로 끝난다.

<mark>이 논문은 다른 걸 한다. cliff를 손실 함수 안에 넣는다.</mark>

## 아이디어

회귀 손실만으로 학습한 모델은 **구조가 비슷한 분자를 가깝게** 두는 잠재 공간을 배운다. message passing의 귀납 편향이 그렇게 생겼기 때문이다. 논문의 출발점은 cliff에서 그 배치가 틀렸다는 것이고, 해법은 목적 함수에 activity-cliff awareness (ACA) 항을 더하는 것이다.

<figure>
<img src="/assets/fig/aca-fig3.png" alt="Latent space of a GNN trained without and with activity-cliff awareness" width="1980" height="2258">
<figcaption><b>Figure 3.</b> cliff가 만드는 뒤집힘과 그 교정. 기준 분자 <b>A</b>, 활성이 가까운 <b>P</b>, 구조는 가깝지만 활성이 먼 <b>N</b>을 생각한다. <b>(a)</b> awareness가 없으면 모델은 생김새가 닮았다는 이유로 <b>A</b>를 <b>N</b> 옆에 둔다. <b>(b)</b> ACA 항이 있으면 최적화가 <b>A</b>를 <b>P</b> 쪽으로 당기고 <b>N</b>에서 밀어내서, 잠재 공간의 거리가 구조가 아니라 활성을 따라간다.
<br><span class="credit">Cui et al., <a href="https://doi.org/10.1038/s41467-026-75713-2"><i>Nat. Commun.</i> <b>17</b> (2026)</a> &#183; 논문 그림, Figure 3</span></figcaption>
</figure>

장치는 **회귀 손실에 더하는 soft-margin triplet contrastive 항**이고, triplet은 미리 정해 두는 게 아니라 학습 중 배치에서 캐낸다.

$$
\mathcal{L} = \mathcal{L}_{\text{reg}} + \alpha \,\mathcal{L}_{\text{triplet}}
$$

매 학습 단계가 *가치 높은* cliff triplet — 기준 분자, 활성이 가까운 분자, 구조는 가깝지만 활성이 먼 분자 — 을 찾아서, 구조적 이웃이 곧 잠재 공간의 이웃이 되는 배치에 벌점을 준다. $\alpha$가 잠재 공간을 얼마나 세게 휠지를 정한다.

<figure>
<img src="/assets/fig/aca-fig1.png" alt="The ACA loss and the ACANET architecture" width="2003" height="1637">
<figcaption><b>Figure 1.</b> 손실과 모델. <b>(a)</b> 배치마다 cliff triplet을 온라인으로 캐내 회귀 항과 함께 ACA 손실을 계산한다. <b>(b)</b> ACANET 자체는 평범한 GNN이다. 기여는 구조가 아니라 목적 함수에 있고, 그래서 여러 backbone으로 옮겨 간다.
<br><span class="credit">Cui et al., <a href="https://doi.org/10.1038/s41467-026-75713-2"><i>Nat. Commun.</i> <b>17</b> (2026)</a> &#183; 논문 그림, Figure 1</span></figcaption>
</figure>

**mining은 온라인으로 한다.** cliff 쌍을 전부 나열하면 $O(n^2)$이고 대부분은 아무것도 가르쳐 주지 않는다. 배치마다 캐내면 비용이 낮게 유지되고, 학습이 진행돼도 triplet이 계속 어렵게 남는다.

## 잠재 공간에서 무슨 일이 일어나나

<figure>
<img src="/assets/fig/aca-fig6.png" alt="Chemical space and the latent spaces learned with and without ACA on the BRAF dataset" width="2000" height="2516">
<figcaption><b>Figure 6.</b> BRAF 저해제를 세 공간에서 본 것 — 원래 화학 공간, awareness 없이 배운 잠재 공간, awareness로 배운 잠재 공간. 주장은 시각적이지만 확인 가능하다. ACA로 학습한 뒤에는 함께 모여 있는 분자는 구조가 아니라 활성이 비슷한 분자다.
<br><span class="credit">Cui et al., <a href="https://doi.org/10.1038/s41467-026-75713-2"><i>Nat. Commun.</i> <b>17</b> (2026)</a> &#183; 논문 그림, Figure 6</span></figcaption>
</figure>

논문은 이 그림을 학습 중에 옳은 방향으로 움직이는 두 수치로 뒷받침한다. 캐내지는 cliff 위반의 개수가 줄고, **label-incoherence index** — 한 분자의 활성이 잠재 공간 이웃들과 얼마나 어긋나는가 — 가 떨어진다.

## 평가

논문은 **52개 데이터셋, 네 종류의 과제**로 평가한다.

| 과제 | 무엇을 시험하나 |
| --- | --- |
| 표본 적고 scaffold 좁은 계열 | 약화학 팀이 실제로 다루는 congeneric series |
| 큰 혼합 scaffold 벤치마크 | MoleculeACE 30개 타깃 |
| matched-pair cliff 분류 | 이 쌍이 cliff인가 — 역가 예측과는 다른 질문 |
| ADMET (absorption, distribution, metabolism, excretion, toxicity) | 생리활성 바깥에서도 아이디어가 버티는가 |

MoleculeACE 30개에서 ACANET은 전체 RMSE (root-mean-square error)와 cliff 한정 RMSE 양쪽에서 fingerprint 기반 모델을 **70~76%의 데이터셋에서** 이긴다. 원 벤치마크의 결론은 fingerprint가 이긴다는 것이었으니, 그래프 모델이 구조가 아니라 목적 함수를 바꿔서 그 데이터셋들을 되찾아온 셈이다.

cliff 분류에서는 비교 대상이 같은 구조에서 awareness 항만 뺀 모델이고, 지표는 MCC (Matthews correlation coefficient)다.

| MMP (matched molecular pair) 데이터셋 | cliff 비인지 | cliff 인지 |
| --- | --- | --- |
| Melanocortin receptor 4 | 0.373 | 0.462 |
| Mu opioid receptor | 0.451 | 0.550 |
| Thrombin | 0.487 | 0.510 |

같은 backbone, 같은 데이터, 손실만 다르다. <mark class="blue">이것이 의미 있는 ablation이고, 많은 논문이 다른 구조를 이기는 쪽을 택하며 건너뛰는 바로 그 실험이다.</mark>

## 내가 물을 것

- **cliff의 정의가 이제 하이퍼파라미터다.** cliff 임계값과 $\alpha$를 nested CV (cross-validation) 안에서 데이터셋마다 선형 탐색으로 맞춘다. nested로 한 건 옳지만, 그러면 이득의 일부는 더 나은 모델이 아니라 그 데이터셋에 더 잘 맞춘 "cliff"의 정의에서 온다. 얼마만큼인지는 논문이 분리해 주지 않는다.
- **ADMET 비교는 간접적이다.** ACANET은 절대값을 예측하고 delta를 유도하는데, DeepDelta는 쌍으로 직접 학습한다. 학습 대상이 다른데 "비슷한 성능"이라고 하면 두 과제의 차이를 과소평가하게 된다.
- **구조가 닮은 것을 밀어내는 항은 어딘가에서 대가를 치러야 한다.** cliff가 아닌 90%의 화학에서 모델을 작동하게 하는 바로 그 매끄러움을 무디게 할 것이기 때문이다. 논문은 전체 RMSE에서도 이득을 보고하므로 경험적으로는 그 교환이 유리하지만, 왜 그 대가를 피할 수 있는지는 설명되어 있지 않다.

## 내 작업과의 관계

[SJoINT](https://github.com/sslim-aidrug/SJoINT)에서도 같은 MoleculeACE 30개 타깃을 보고하는데, 거기서 cliff 부분집합은 **진단**이다. 분자의 두 view 사이 contrastive 목적으로 표현을 학습한 뒤, cliff RMSE가 나아졌는지 확인한다. 이 논문은 cliff를 contrastive 항의 부산물이 아니라 *표적* 으로 삼는다.

둘은 충돌하지 않고, 당연히 해 볼 만한 건 둘 다 쓰는 것이다. 표현은 view-contrastive 사전학습으로, fine-tuning에서는 cliff 인지 triplet으로. 내가 안 했던 이유는 이거다. triplet이 라벨에 의존하는 항을 넣으면 cliff 지표가 부분적으로 자기참조가 되고, cliff RMSE가 좋아졌다는 결과를 믿으려면 음성 대조가 필요해진다. 이 논문의 답이 위의 ablation이다. cliff가 재는 대상인지 맞서 학습하는 대상인지가 내 연구에서도 열려 있던 질문이었고, 지금까지 본 답 중에 이 ablation이 가장 납득할 만하다.

## 정리

- activity cliff는 보통 학습 뒤에 재는데, 이 논문은 **손실 함수 안에** 온라인으로 캐낸 soft-margin triplet 항으로 넣는다
- 구조는 평범한 GNN이다. 기여는 목적 함수이고, 그래서 여러 backbone으로 옮겨 간다
- cliff 위반 개수와 label-incoherence index가 학습 중에 떨어지는 것을 측정으로 보인다
- **52개 데이터셋, 네 종류의 과제** — 역가 회귀만이 아니라 cliff 분류와 ADMET까지
- 가장 강한 근거는 같은 구조에서 항만 뺀 비교다. MCC 0.373 → 0.462, 0.451 → 0.550, 0.487 → 0.510
- 약점은 cliff의 정의 자체를 데이터셋마다 맞춘다는 점이다. 이득의 일부는 더 잘 맞춘 임계값이다

## 참고

- Cui et al., [Activity-cliff awareness enables robust graph learning for molecular property prediction](https://doi.org/10.1038/s41467-026-75713-2), *Nat. Commun.* **17** (2026) — 여기서 리뷰한 논문
- van Tilborg, Alenicheva & Grisoni, [Exposing the limitations of molecular machine learning with activity cliffs](https://doi.org/10.1021/acs.jcim.2c01073), *J. Chem. Inf. Model.* (2022) — 성능을 재는 기준이 된 벤치마크
- Schroff, Kalenichenko & Philbin, [FaceNet](https://arxiv.org/abs/1503.03832) (CVPR 2015) — triplet loss와 온라인 mining의 출처
