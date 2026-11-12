---
title: "간은 무엇으로 이루어져 있나"
date: 2026-02-20
description: "간은 한 종류의 세포가 아니다 · 소엽, 그리고 피가 한 방향으로 흐른다는 것 · 알아 둘 다섯 가지 세포와 각각이 하는 일 · 위치가 하는 일을 바꾸는 구역화 · 지방간에서 무엇이 어느 세포에서 잘못되나"
category: concept
updated: 2026-03
lang: ko
group: liver-cells
topic: Bioinformatics
subtopic: Cell biology
tags: [liver, MASLD, cell types, single-cell]
---

나는 계산 쪽에서 이 주제로 들어왔다. 노화와 지방간 질환 과제를 하면서 분석할 간 RNA-seq가 잔뜩 쌓여 있었다. 간에 어떤 세포들이 있고 각각 무슨 일을 하는지 모르면 차등 발현 결과를 해석할 수가 없다.

## 간이 세포 여러 종류의 혼합물이라는 점

간 조직 샘플은 섞인 것이다. [bulk RNA-seq](../bulk-vs-sc-ko/)는 그 혼합물의 평균을 재므로, 어떤 유전자가 두 배 올랐을 때 설명이 둘로 갈린다. **모든 세포가 조금씩 더 만들었거나, 작은 집단 하나가 훨씬 많이 만들었거나.** 간에서는 보통 이 구분이 결과의 전부다. 질병을 끌고 가는 세포 유형이 대개 소수이기 때문이다.

## 구조

간의 반복 단위는 **소엽 (lobule)** 이다. 피가 모서리로 들어와 가운데 정맥으로 빠져나가고, 모든 것이 그 흐름을 중심으로 배치돼 있다.

<figure>
<img src="/assets/fig/liver-atlas-fig10.png" alt="Map of the human liver: the lobule, the portal triad, the central vein, and every cell type with its marker genes" width="1971" height="2399">
<figcaption><b>간직할 만한 지도.</b> 위: 간, 소엽 하나, 그리고 그것을 자른 단면. 아래: 그 단면에 모든 세포 유형이 이름과 함께 표시돼 있고, 범례에는 각각을 식별하는 marker 유전자가 들어 있다. 왼쪽이 <b>portal triad</b> (들어오는 피와 담관), 오른쪽이 <b>central vein</b>이고, 그 사이를 sinusoid라는 좁은 통로로 피가 지난다.
<br><span class="credit">MacParland et al., <a href="https://doi.org/10.1038/s41467-018-06318-7"><i>Nat. Commun.</i> <b>9</b>, 4383 (2018)</a> &#183; 논문 그림, Figure 10</span></figcaption>
</figure>

이 그림에서 가져갈 것 둘. 피가 portal triad에서 central vein으로 **한 방향으로** 흐르므로, 입구 쪽 세포와 출구 쪽 세포는 전혀 다른 화학적 환경에 놓인다. 그리고 그 통로는 보통의 혈관이 아니다. 일부러 새는 내피로 둘러싸여 있어서 혈장이 간세포에 직접 닿는다.

## 다섯 가지 세포와 각각이 하는 일

| 세포 | 비율 | 하는 일 | marker |
| --- | --- | --- | --- |
| 간세포 (hepatocyte) | 약 60~80% | 실제 일 — 대사, 해독, 단백질과 담즙 생산 | *ALB*, *APOA1*, *CYP* 계열 |
| LSEC (liver sinusoidal endothelial cell, sinusoid 내피세포) | 약 15~20% | sinusoid를 덮는다. 일부러 새게 해서 혈장이 간세포에 닿게 한다 | *CLEC4G*, *STAB2*, *LYVE1* |
| Kupffer 세포 (상주 대식세포) | 약 10~15% | 간 자체의 면역세포. 장에서 온 찌꺼기와 세균을 먹는다 | *CD68*, *MARCO*, *CD5L* |
| 성상세포 (hepatic stellate cell, HSC) | 약 1~5% | 평소엔 비타민 A를 저장. 활성화되면 흉터 조직을 만든다 | *ACTA2*, *COL1A1*, *RBP1* |
| 담관세포 (cholangiocyte) | 약 1~3% | 담관을 덮고 담즙을 실어 나른다 | *KRT7*, *KRT19*, *EPCAM* |

여기에 얹혀 가는 세포들이 더 있다. T 세포, NK (natural killer) 세포, B 세포, 형질세포, 그리고 혈액에서 불려 온 단핵구. 간에는 상주 면역세포가 유난히 많은데, 장에서 흡수된 것이 전부 간을 먼저 지나기 때문이다.

<mark class="blue">기억할 세포는 성상세포다.</mark> 전체의 몇 퍼센트뿐이고 건강한 간에서는 눈에 띄는 일을 거의 안 하는데, 섬유화를 만드는 세포가 바로 이것이다. 그리고 만성 간질환에서 예후를 결정하는 것이 섬유화다.

## 구역화: 같은 세포, 다른 일

간세포는 서로 바꿔 끼울 수 있는 게 아니다. 혈류를 따라 어디에 앉아 있느냐가 어떤 유전자를 켜고 어떤 반응을 돌릴지를 바꾼다. 이것이 **구역화 (zonation)** 다.

| | Zone 1 (periportal, 피가 들어오는 쪽) | Zone 3 (pericentral, 피가 나가는 쪽) |
| --- | --- | --- |
| 산소 | 많음 | 적음 |
| 포도당을 만든다 (당신생) | 함 | 안 함 |
| 포도당을 저장한다 (해당·지질생성) | 안 함 | 함 |
| 약물 대사 (*CYP* 효소) | 적음 | 많음 |
| 먼저 상하는 원인 | 피로 들어온 독성물질 | 저산소, 아세트아미노펜, 지방 |

실질적인 결과가 두 가지다. 약물 대사 효소 대부분이 Zone 3에 있어서 **아세트아미노펜 손상이 거기서 먼저 나타난다.** 그리고 지방도 Zone 3에 먼저 쌓여서, 초기 지방간을 pericentral이라고 기술한다.

분석할 때는 이렇다. 데이터에서 간세포 군집이 둘로 갈렸다면 세포 유형 둘이 아니라 zone 1과 zone 3일 수 있고, 그걸 "간세포 아형"이라고 부르면 틀린 것이다.

## 데이터로는 이렇게 보인다

<figure>
<img src="/assets/fig/liver-atlas-fig2.png" alt="Quality filtering, clusters and the annotated t-SNE of 8,444 human liver cells" width="2014" height="2341">
<figcaption><b>세포에서 이름표까지.</b> <b>(a)</b> 먼저 품질 필터링 — 전사체가 너무 적거나 미토콘드리아 RNA가 너무 많은 세포를 버린다. <b>(c)</b> 군집 20개, 아직 이름이 없다. <b>(d)</b> 군집별 marker 유전자. 이름은 여기서 붙는다. <b>(f)</b> 이름을 붙인 같은 지도. 간세포 군집이 여섯 개로 나뉘는데, 이건 대부분 구역화이지 세포 유형이 여섯 가지라는 뜻이 아니다.
<br><span class="credit">MacParland et al., <a href="https://doi.org/10.1038/s41467-018-06318-7"><i>Nat. Commun.</i> <b>9</b>, 4383 (2018)</a> &#183; 논문 그림, Figure 2</span></figcaption>
</figure>

실제 조직에 적용한 [군집화](../clustering-ko/) 흐름 그대로다. 거르고, 군집으로 묶고, marker 유전자로 이름을 붙인다. 위의 생물학이 필요한 단계가 바로 이름 붙이기다. 알고리즘은 11번 집단과 13번 집단을 내놓을 뿐이고, 하나가 periportal LSEC이고 다른 하나가 portal 내피라는 건 marker만이 알려 준다.

> 질환 명칭과 두 축의 단계 — 지방증 등급과 섬유화 단계 — 는 [따로 쓴 글](../masld-staging-ko/)에서 다룬다.

## 지방간 질환에서 무엇이 잘못되나

MASLD (metabolic dysfunction-associated steatotic liver disease, 대사 이상 관련 지방간 질환. 예전 명칭 NAFLD — non-alcoholic fatty liver disease)는 이제 가장 흔한 만성 간질환이다. 순서대로 진행하고, 각 단계가 서로 다른 세포의 일이다.

1. **간세포에 지방이 쌓인다.** 들어오는 양이 나가는 양보다 많아서다. 여기까지는 되돌릴 수 있고 대개 해롭지 않다.
2. **스트레스받은 간세포가 신호를 보내고** 일부는 죽는다. Zone 3이 먼저다.
3. **Kupffer 세포가 반응하고**, 혈액에서 단핵구가 불려 온다. 지방간에서 지방간염으로 넘어가는 전환점이다. 지방 + 염증.
4. **성상세포가 활성화된다.** 비타민 A 저장을 그만두고 근섬유모세포 비슷한 세포로 변해 콜라겐을 깔기 시작한다.
5. **섬유화가 쌓이고**, 계속되면 간경변이 된다.

<mark>예후를 예측하는 것은 지방의 양이 아니라 섬유화 단계다.</mark> MASLD 연구가 성상세포에 그렇게 집중하는 이유가 이것이다. 샘플의 몇 퍼센트에 불과하고 bulk 데이터에서는 사실상 보이지 않는 세포인데도.

분석에서도 이 단계 구분이 중요하다. 질환 간과 정상 간을 bulk로 비교하면 염증과 콜라겐 유전자가 나온다. 맞는 결과지만 알려 주는 게 거의 없다. 성상세포가 행동을 바꾼 것인지, 그냥 수가 늘어난 것인지 구분할 수 없기 때문이다. 그 둘을 나누려면 [single-cell 데이터](../bulk-vs-sc-ko/)가 필요하고, 거기서 조건을 비교하려면 [pseudobulk](../de-tools-ko/)가 필요하다.

## 간 데이터에서 발목을 잡는 것들

- **간세포는 크고 약하다.** 해리 과정에서 깨지기 때문에, 방울 기반 scRNA-seq (single-cell RNA-seq)로 간을 찍으면 조직의 대부분을 차지하는 바로 그 세포가 빠진다. 간 연구가 점점 single-nucleus RNA-seq로 옮겨 가는 이유다.
- **ambient RNA가 알부민이다.** 터진 간세포가 *ALB*를 엄청나게 쏟아내고, 그게 다른 모든 세포를 오염시킨다. 알부민을 발현하는 것처럼 보이는 면역세포는 거의 항상 생물학이 아니라 오염이다.
- **성상세포는 드물어서 놓친다.** 그 세포만 따로 분리해 모으거나 깊게 시퀀싱하지 않으면 안 잡힌다.
- **구역화가 세포 유형처럼 보인다.** 간세포 군집이 zone으로 갈릴 것을 예상하고, 이름 붙이기 전에 *CYP2E1* (zone 3)과 *PCK1* (zone 1)을 확인한다.

## 정리

- 간은 혼합물이고, 질환에서 이야기를 끌고 가는 세포 유형은 대개 **소수**다
- 반복 단위는 소엽. 피는 **portal triad**에서 **central vein**으로 한 방향으로 흐른다
- 이야기를 나르는 다섯 세포: 간세포, LSEC, Kupffer 세포, **성상세포**, 담관세포
- **구역화** — 위치가 간세포의 일을 바꾼다. zone 1은 포도당을 만들고, zone 3은 약을 대사하며 지방이 먼저 쌓인다
- MASLD는 지방 → 스트레스 → 염증 → 성상세포 활성화 → 섬유화. 단계마다 세포가 다르다
- **예후를 정하는 건 섬유화 단계**이고, 섬유화는 샘플의 몇 퍼센트짜리 세포에서 나온다
- 간 데이터 특유의 함정: 간세포가 깨지고 (핵을 쓴다), 알부민이 전부를 오염시키고, 구역화가 세포 유형 행세를 한다

## 참고

- MacParland et al., [Single cell RNA sequencing of human liver reveals distinct intrahepatic macrophage populations](https://doi.org/10.1038/s41467-018-06318-7), *Nat. Commun.* **9**, 4383 (2018) — 위 두 그림의 출처인 아틀라스
- Ben-Moshe & Itzkovitz, [Spatial heterogeneity in the mammalian liver](https://doi.org/10.1038/s41575-019-0134-x), *Nat. Rev. Gastroenterol. Hepatol.* (2019) — 구역화
- Loomba, Friedman & Shulman, [Mechanisms and disease consequences of nonalcoholic fatty liver disease](https://doi.org/10.1016/j.cell.2021.04.015), *Cell* (2021)
