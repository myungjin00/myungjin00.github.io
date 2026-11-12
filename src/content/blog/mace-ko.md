---
title: "MACE: 원자 쌍을 넘어선 메시지"
date: 2024-08-16
description: "대부분의 message passing potential은 메시지 하나가 원자 쌍만 보므로 도달 범위를 깊이로 사야 한다. MACE는 곱 기저로 원자 여러 개를 한 번에 보는 메시지를 만들어 두 층으로 충분하게 만들고, 학습 곡선의 절편이 아니라 지수를 바꾼다."
category: review
updated: 2024-09
lang: ko
topic: Graphs
venue: NeurIPS
venueYear: 2022
group: mace
tags: [review, equivariance, message passing, force fields]
---

> Batatia, Ilyes, et al. "MACE: Higher Order Equivariant Message Passing Neural Networks for Fast and Accurate Force Fields." *arXiv*, 15 June 2022, [arxiv.org/abs/2206.07697](https://arxiv.org/abs/2206.07697). Preprint.
> [code](https://github.com/ACEsuit/mace)

MACE는 message passing 기반 interatomic potential이고, 논문의 논지는 메시지 하나가 무엇에 의존할 수 있어야 하는가다.

## 메시지가 원자 쌍만 볼 때

머신러닝 interatomic potential은 원자 위치에서 에너지와 힘을 예측한다. 양자 계산을 대신할 만큼 빠르게. [message passing](../gnn-ko/)이 당연한 도구다. 원자가 node, 가까운 원자가 이웃, 사이트 에너지가 readout.

초기 시도들은 손으로 만든 원자 디스크립터를 못 이겼다. 논문의 진단은 구체적이다.

<mark class="blue">거의 모든 **MPNN (message-passing neural network)** potential이 **쌍 메시지** (two-body message)를 보낸다. 메시지 하나가 이웃 하나에만 의존한다는 뜻이고, 원자 쌍 단위의 항을 아무리 많이 더해도 근사 능력에는 한계가 있다.</mark>

물리는 그렇게 생기지 않았다. 한 원자의 에너지는 이웃들의 *배치* 에 의존하지 이웃 각각에 따로 의존하지 않는다. 120°로 벌어진 원자 셋과 일직선으로 늘어선 원자 셋은 원자 쌍 사이 거리가 같은 서로 다른 상태다.

통상의 우회로는 깊이다. 층을 충분히 쌓으면 원자 셋이 어떻게 놓였는지가 중간 node들을 거쳐 간접적으로 도달한다. 대신 그 대가를 층으로 치러야 하고, GNN에서 깊이는 [over-smoothing](../gnn-ko/)을 끌고 온다.

## 아이디어

<figure>
<img src="/assets/fig/mace-messages.png" alt="Many-body message construction from a product basis" width="2967" height="1707">
<figcaption><b>원자 여러 개를 한 번에 보는 메시지.</b> 이웃을 하나씩 더하는 대신 이웃 기저의 곱을 만든다. 그래서 메시지 하나가 여러 이웃에 함께 의존할 수 있다. atomic cluster expansion에서 빌려 온 구성이다.
<br><span class="credit">Batatia et al., <a href="https://arxiv.org/abs/2206.07697">MACE: Higher Order Equivariant Message Passing Neural Networks for Fast and Accurate Force Fields</a>, NeurIPS 2022 &#183; 논문 그림, Figure 1</span></figcaption>
</figure>

MACE는 메시지를 atomic cluster expansion (ACE) 방식의 **곱 기저** (product basis)로 만든다. 먼저 이웃 하나하나를 정해진 기저 함수들로 펼쳐 쓰고, 그중 $\nu$개를 곱하면 메시지 하나가 원자 $\nu+1$개를 한꺼번에 보게 된다. 원자 넷을 보는 메시지는 이웃 셋을 따로따로가 아니라 한꺼번에 본다.

전부 **등변** (equivariant)으로 유지된다. 분자를 회전시키면 내부 특징이 같이 회전한다. 뒤섞이거나 버려지지 않는다. 에너지 같은 scalar뿐이라면 불변 (invariant)으로도 되겠지만 힘은 벡터이고, 등변 특징은 불변 특징이 버리는 방향 정보를 실어 나른다.

<figure>
<img src="/assets/fig/mace-layers.png" alt="Reach as a function of layers and message body order" width="1098" height="558">
<figcaption><b>깊이 없이 얻는 도달 범위.</b> 원자 넷을 보는 메시지를 쓰면 <b>두 층</b>으로, 쌍 메시지 모델이 여러 층을 쌓아야 닿는 상관 차수를 덮는다. 이 모델이 빠르고 병렬화가 잘 되는 이유이기도 하다.
<br><span class="credit">Batatia et al., <a href="https://arxiv.org/abs/2206.07697">MACE</a>, NeurIPS 2022 &#183; 논문 그림, Figure 2</span></figcaption>
</figure>

## 학습 분포 밖에서의 결과

벤치마크 표가 아니다. 학습 곡선 — 학습 데이터 양에 대해 시험 오차를 그린 것으로, 이 모델들에서는 거듭제곱 법칙으로 떨어진다 — 에 대한 주장이다.

| 바꾼 것 | 학습 곡선에 대한 효과 |
| --- | --- |
| **원자 여러 개를 보는 메시지** | 거듭제곱 법칙의 **지수**가 바뀐다 |
| **등변성** | 다체 메시지가 있는 상태에서는 곡선이 **평행이동**할 뿐 지수는 그대로 |

<mark>서로 다른 종류의 개선인데, 이 분야가 흔히 뭉뚱그린다.</mark> 평행이동은 상수배다. 필요한 표본이 어떤 비율만큼 줄고, 그 비율은 데이터가 늘어도 변하지 않는다. 지수가 바뀐다는 건 데이터가 늘수록 격차가 *벌어진다* 는 뜻이다.

그러니 "등변 구조가 낫다"와 "원자를 여러 개 보는 메시지가 낫다"는 같은 진술이 아니고, 논문은 둘을 함께 주장하는 대신 실험으로 분리한다. 벤치마크는 작은 분자동역학 데이터셋인 rMD17·3BPA·AcAc이고, 그중 일부 시험 세트는 학습 분포 밖에 있어서 보간이 아니라 외삽을 해야 한다.

## 주장을 받치는 수치

데이터셋 셋이고, 외삽 주장을 단언이 아니라 시험할 수 있게 고른 조합이다.

**rMD17**은 분자동역학 궤적에서 뽑은 작은 유기분자 열 개이고 각각 배치 1,000개다. MACE가 모든
분자에서 최고이거나 그 언저리인데, 오차가 큰 쪽에서 격차가 벌어진다. 아스피린 힘 오차가
6.6 meV/Å이고 Allegro 7.3, BOTNet 8.5, NequIP 8.2다. 논문은 **배치 50개**로 다시 학습시켜
난이도를 올리기도 하는데, 그쪽이 더 많은 걸 말해 준다.

**3BPA**가 정작 중요한 쪽이다. 300 K에서 뽑은 기하 500개로 학습한 뒤 300 K·600 K·1200 K에서
시험한다. 뒤의 둘은 학습 분포 밖이다. 거기에 더해 이면각 절단면 — 모델이 본 적 없는 에너지면
영역을 가로지르는 — 까지 시험한다.

| RMSE (meV / meV·Å⁻¹) | NequIP | BOTNet | **MACE (L=2)** |
| --- | --- | --- | --- |
| 300 K — 에너지 / 힘 | 3.1 / 11.3 | 3.1 / 11.0 | **3.0 / 8.8** |
| 1200 K — 에너지 / 힘 | 40.8 / 86.4 | 39.1 / 81.1 | **29.8 / 62.0** |
| 이면각 절단면 | 23.2 / 23.1 | 16.3 / 20.0 | **7.8 / 16.5** |
| 평가 시간 | 103.5 ms | 101.2 ms | **24.3 ms** |

<mark>시험이 학습 데이터에서 멀어질수록 격차가 벌어진다. 300 K에서는 비슷하고, 1200 K에서 4분의 1쯤
낫고, 이면각 절단면에서는 에너지 오차가 절반 아래다.</mark> 곱 기저가 샘플링된 영역을 맞춘 게 아니라 물리의
무언가를 담았다면 나올 법한 모양이고, 대표 정확도 수치보다 이쪽이 더 강한 논거다.

속도 열이 나머지 절반이다. 불변 MACE(L=0)는 비슷한 정확도에서 BOTNet·NequIP보다 열 배쯤 빠르고,
L=2조차 네 배 빠르다. 층을 여러 개가 아니라 두 개만 쌓아도 되는 데서 오는 결과다.

## 내가 물을 것

- **곱 기저가 두 가지 일을 한다.** 표현력을 사면서 동시에 층 수를 줄인다. ablation (한 요소만 빼고 다시 학습해 보는 것)이 등변성과 "메시지가 보는 원자 수"는 분리하지만 그 원자 수와 깊이는 분리하지 않는다. 깊이를 맞춘 쌍 메시지 모델과 비교하면 더 깨끗해진다.
- **벤치마크가 작고 깨끗하다.** rMD17과 3BPA는 ACE식 기저가 빛날 수밖에 없는 영역이다. 지수 주장이 크고 화학적으로 다양한 데이터에서도 남는지가 질문인데, 이 논문은 답하지 않는다.
- **곱 기저는 강한 prior다.** 3차원 공간의 원자에는 좋은 prior다. 실제 물리가 원자 여러 개로 함께 결정되고 국소적이니까. 그게 edge가 다른 것을 뜻하는 도메인으로 얼마나 옮겨 가는지는 자명하지 않고, 논문도 그렇게 주장하지는 않는다.

## 내가 읽은 이유

force field 때문이 아니다. **메시지에 무엇이 담겨도 되는가**라는 질문 때문이고, 그건 어떤 message passing 모델에서도 같은 질문이다. 그 질문에 대해 내가 아는 가장 분명한 진술이 이 논문이다.

내 분자 그래프에서도 메시지는 쌍 단위다. 원자가 이웃 각각에서 모으고 학습된 함수가 합친다. 더 먼 구조를 보려면 보통 깊이로 해결하고, 그 대가도 보통 그대로 치른다. MACE의 답 — 메시지 하나가 여러 이웃에 동시에 의존하게 만들라 — 은 내가 이름을 갖고 있지 않던 대안이었다.

그리고 내 작업의 무언가를 다시 보게 만든다. 고리 하나를 통째로 담은 [junction tree](../jtvae-ko/) node는 사실상 원자 여러 개를 한꺼번에 담은 항이다. 원자 여섯 개의 배치를 쌍 상호작용 여섯 개로 흩어 두고 모델이 다시 조립하기를 기대하는 대신, 하나의 객체로 실어 나른다. 기제는 다르고 직관은 같다. **깊이가 복원해 주기를 바라지 말고 원자 여러 개를 메시지에 담아라.**

## 정리

- 대부분의 MPNN potential은 쌍 메시지를 보내고, 원자 쌍 항을 합치는 것만으로는 근사 능력에 한계가 있다
- 물리는 원자 여러 개가 함께 결정한다. 120°로 벌어진 원자 셋과 일직선 원자 셋은 원자 쌍 사이 거리가 같다
- MACE는 곱 기저 (ACE 방식)로 메시지를 만들어 하나의 메시지가 여러 이웃에 동시에 의존하게 한다
- 원자 넷을 보는 메시지면 **두 층으로 충분하다.** 깊이 없이 도달 범위를 얻고, 그래서 빠르다
- 전부 등변으로 유지된다. 힘이 벡터라서 중요하다
- **원자를 여러 개 보는 메시지는 학습 곡선의 지수를 바꾸고, 등변성은 그 메시지가 있는 상태에서 평행이동만 시킨다** — 흔히 뭉뚱그려지는 서로 다른 개선
- 같은 직관이 다른 데서도 나타난다. 고리를 담은 junction tree node는 이름만 다른 "원자 여러 개를 한꺼번에" 항이다

## 참고

- Batatia et al., [MACE: higher order equivariant message passing neural networks for fast and accurate force fields](https://arxiv.org/abs/2206.07697) (NeurIPS 2022) — 여기서 리뷰한 논문
- Drautz, [Atomic cluster expansion for accurate and transferable interatomic potentials](https://doi.org/10.1103/PhysRevB.99.014104), *Phys. Rev. B* (2019) — 곱 기저
- Batzner et al., [E(3)-equivariant graph neural networks for data-efficient and accurate interatomic potentials](https://doi.org/10.1038/s41467-022-29939-5), *Nat. Commun.* (2022) — 등변 baseline NequIP
