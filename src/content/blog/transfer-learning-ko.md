---
title: "전이학습: pre-training과 fine-tuning"
date: 2025-01-17
description: "사전학습과 fine-tuning의 두 단계 · pretext task의 답이 왜 쓸모없어도 되는가 · 학습률과 치명적 망각 · negative transfer와 백본 고르는 기준"
category: concept
updated: 2025-02
lang: ko
group: transfer
topic: Machine learning
subtopic: Basics
tags: [transfer learning, pre-training, fine-tuning]
---

**Machine learning** · [#1 머신러닝과 딥러닝](../ml-and-dl-ko/) · [#2 지도·비지도·자기지도](../learning-paradigms-ko/) · [#3 군집화](../clustering-ko/) · #4 전이학습

[앞 편](../learning-paradigms-ko/)에서 본 불균형이 출발점이다. 라벨 없는 분자는 수억 개인데, 독성 라벨이 붙은 분자는 수천 개뿐이다. **전이학습 (transfer learning)** 은 그 둘을 잇는 방법이다.

## 한 문장 요약

> 큰 데이터에서 일반적인 표현을 배운 다음, 그 표현을 작은 과제에 맞게 조정한다.

두 단계로 나뉜다.

<figure>
<svg viewBox="0 0 540 196" role="img" aria-label="Pre-training on a large unlabeled corpus, then fine-tuning the same encoder on small labeled tasks.">
  <g fill="none" stroke="#D3D8CE"><rect x="16" y="24" width="228" height="148" rx="6"/><rect x="296" y="24" width="228" height="148" rx="6"/></g>
  <g font-family="IBM Plex Mono, monospace" font-size="11.5" fill="#1E4A39"><text x="30" y="46">1. pre-training</text><text x="310" y="46">2. fine-tuning</text></g>
  <g font-family="IBM Plex Mono, monospace" font-size="10" fill="#6E7873">
    <text x="30" y="68">ZINC250k · no labels</text><text x="310" y="68">BBBP · 2,039 · labelled</text>
    <text x="30" y="162">self-supervised objective</text><text x="310" y="162">task loss, small steps</text>
  </g>
  <g fill="#DCE7DF" stroke="#1E4A39" stroke-width="1.5"><rect x="40" y="96" width="88" height="34" rx="5"/><rect x="320" y="96" width="88" height="34" rx="5"/></g>
  <g font-family="IBM Plex Mono, monospace" font-size="10.5" fill="#1E4A39"><text x="56" y="117">encoder</text><text x="336" y="117">encoder</text></g>
  <g fill="rgba(194,112,60,.18)" stroke="#C2703C" stroke-width="1.4"><rect x="152" y="96" width="66" height="34" rx="5"/><rect x="432" y="96" width="66" height="34" rx="5"/></g>
  <g font-family="IBM Plex Mono, monospace" font-size="10" fill="#C2703C"><text x="162" y="111">pretext</text><text x="166" y="124">head</text><text x="448" y="111">task</text><text x="448" y="124">head</text></g>
  <g stroke="#46524D" stroke-width="1.2" marker-end="url(#ar2)"><line x1="128" y1="113" x2="150" y2="113"/><line x1="408" y1="113" x2="430" y2="113"/></g>
  <defs><marker id="ar2" markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6 z" fill="#46524D"/></marker></defs>
  <path d="M84 138 C 84 180, 364 180, 364 138" fill="none" stroke="#1E4A39" stroke-width="1.4" stroke-dasharray="4 4"/>
  <text x="206" y="190" font-family="IBM Plex Mono, monospace" font-size="10" fill="#1E4A39">the weights carry over</text>
</svg>
<figcaption><b>사전학습 다음 fine-tuning.</b> encoder만 넘어가고 head는 버린다. 사전학습에서 풀던 문제와 최종 과제가 다르기 때문이다.</figcaption>
</figure>

## 1단계 — pre-training

큰 데이터에서 **pretext task**를 풀게 한다. 그 과제의 답 자체는 쓸모없다. 과제를 푸는 과정에서 생기는 **표현**이 목적이다.

분자 쪽에서 쓰는 pretext task들이다.

- **masking** — 원자 종류를 가리고 맞히기
- **대조 학습 (contrastive learning)** — 같은 분자의 두 view는 가깝게, 다른 분자는 멀게
- **속성 예측 (property prediction)** — RDKit으로 바로 계산되는 디스크립터 (descriptor) 맞히기

세 번째가 조금 이상해 보일 수 있다. logP는 계산하면 나오는데 왜 예측을 시키는가. 답은 **맞히는 게 목적이 아니기 때문**이다. logP를 맞히려면 모델이 소수성과 관련된 구조를 알아야 하고, 그 과정에서 생긴 표현이 나중에 다른 과제에 쓰인다.

## 2단계 — fine-tuning

사전학습된 encoder, 즉 다음 단계로 넘어가는 부분인 **백본** (backbone)을 가져와 pretext task용 head를 떼고 실제 과제용 head를 붙인 뒤 라벨 데이터로 학습한다.

선택지가 두 가지 있다.

| 방식 | encoder | 언제 |
| --- | --- | --- |
| **linear probing** | 고정 | 라벨이 수백 개 수준일 때, 또는 도착지가 사전학습 도메인과 가까울 때 — 표현 자체를 평가하는 방법이기도 하다 |
| **전체 fine-tuning** | 함께 학습 | 라벨이 수천 개 이상일 때, 또는 도착지가 사전학습 도메인과 멀 때 — 보통의 경우이고, 학습률은 낮게 |

전체 fine-tuning이 보통 더 좋지만, 학습률이 크면 사전학습으로 얻은 것을 **덮어써 버린다**. 사전학습 때보다 10배쯤 작은 학습률에서 시작하는 것이 보통이다.

## 왜 되는가

사전학습된 모델은 좋은 출발점을 준다. 무작위 초기화에서 시작하면 모델은 "분자가 무엇인지"부터 라벨 2,000개로 배워야 한다. 사전학습된 모델은 이미 고리와 작용기와 연결성을 알고 있고, **그중 무엇이 이 과제에 중요한지**만 배우면 된다.

실질적인 효과는 세 가지다.

- 작은 데이터셋에서 성능이 오른다
- 수렴이 빨라진다
- seed에 따른 변동이 줄어든다

## 어디서 망가지는가

**1. 도메인이 너무 멀 때.** ZINC (약물 유사 분자)로 사전학습한 모델은 비슷한 분자에 잘 통한다. 단백질이나 결정 (crystal)에는 그렇지 않다. 전이는 **출발지와 도착지가 가까울수록** 잘 된다.

**2. 치명적 망각 (catastrophic forgetting).** 학습률이 높거나 에폭 (epoch)이 많으면 사전학습된 가중치가 과제 데이터에 눌려 사라진다. 결국 무작위 초기화와 다를 바 없어진다.

**3. 과제에 전혀 맞지 않는 pretext task.** 사전학습이 항상 이득은 아니다. pretext task가 최종 과제와 무관한 특징만 키우면 **negative transfer**가 일어나 오히려 나빠진다. <mark class="blue">그래서 사전학습 손실이 낮다는 것만으로 좋은 백본이라고 할 수 없고, downstream 성능으로 골라야 한다.</mark>

**4. 평가가 오염될 때.** 사전학습 데이터에 테스트 분자가 들어 있으면 점수가 부풀려진다. 사전학습 데이터와 벤치마크의 겹침은 반드시 확인해야 한다.

## 용어들의 관계

용어가 섞여 쓰이는데 정리하면 이렇다.

- **전이학습 (transfer learning)** — 한 과제에서 얻은 것을 다른 과제에 쓰는 것 전반
- **사전학습 + fine-tuning** — 그 전이를 구현하는 가장 흔한 방식
- **자기지도 사전학습** — 사전학습의 라벨을 데이터 자신에게서 얻는 방식

즉 포함 관계다. 전이학습 ⊃ 사전학습·fine-tuning ⊃ 자기지도 사전학습.

> **일반적으로 보면.** 의료 영상이 좋은 비유다. 흉부 X-ray 라벨은 수천 장 규모인데, ImageNet 120만 장으로 사전학습한 모델은 이미 모서리·질감·형태를 알고 있어서 "이 음영이 병변인가"만 배우면 된다. 라벨 없는 분자로 먼저 학습시키는 이유와 정확히 같다.

## 정리

- 라벨 없는 큰 데이터로 표현을 배우고, 라벨 있는 작은 데이터로 마무리한다
- encoder만 옮기고 head는 새로 붙인다
- fine-tuning은 학습률을 낮게 — 높으면 배운 걸 지운다
- 도메인이 멀면 안 되고, 겹침은 확인해야 하고, 백본은 downstream 성능으로 고른다

## 참고

- Pan & Yang, [A Survey on Transfer Learning](https://doi.org/10.1109/TKDE.2009.191), *IEEE TKDE* (2010) — 용어 정리의 기준이 된 서베이
- Hu et al., [Strategies for Pre-training Graph Neural Networks](https://arxiv.org/abs/1905.12265) (ICLR 2020) — negative transfer를 분자 그래프에서 보고한 논문
- Kornblith et al., [Do Better ImageNet Models Transfer Better?](https://arxiv.org/abs/1805.08974) (CVPR 2019) — 사전학습 성능과 전이 성능이 어긋나는 경우
