---
title: "노화세포와 SASP: 분열은 멈췄는데 신호는 계속 보내는 세포"
date: 2026-04-24
description: "영구히 멈추지만 죽지는 않고, 그다음 분비하기 시작하는 세포 · SASP가 세포노화를 세포의 문제가 아니라 조직의 문제로 만드는 이유 · 단일 marker가 없는 이유 · SenMayo와 유전자 집합들 · 그리고 지방간에서 하는 일"
category: concept
updated: 2026-05
lang: ko
group: sasp
topic: Bioinformatics
subtopic: Cell biology
tags: [senescence, SASP, aging, MASLD]
---

내 과제가 노화와 간질환인데, 둘이 만나는 지점이 하나의 세포 상태다.

손상을 충분히 받은 세포에는 선택지가 세 가지다. 고치거나, 죽거나, 영구히 분열을 멈추거나. 세 번째가 세포노화 (senescence)다. 안전한 결말처럼 들린다 — 손상된 세포가 종양이 되지 못하니까 — 한 가지만 빼면 실제로 그렇다. 멈춘 세포가 조용히 있지 않는다. 염증 신호 칵테일을 분비하기 시작하는데 이걸 SASP (senescence-associated secretory phenotype, 세포노화 연관 분비 표현형)라 하고, 그 신호가 주변 모든 것의 행동을 바꾼다. 소수의 노화세포가 조직 수준의 질환을 끌고 갈 수 있는 이유가 이것이다.

## 세포가 애초에 왜 이걸 하나

세포노화는 고장이 아니라 프로그램이다.

| 쓸모 있는 곳 | 하는 일 |
| --- | --- |
| 종양 억제 | DNA가 손상된 세포가 손상을 안은 채 분열하는 대신 멈춘다 |
| 상처 치유 | 일시적 노화세포가 면역세포를 불러 재구성을 돕고, 그다음 제거된다 |
| 발생 | 예정된 세포노화가 일부 배아 구조를 빚는다 |

세 경우 모두 그 멈춤이 **결과적으로는 일시적**이다. 면역계가 나중에 노화세포를 치운다. 병리는 그 청소가 실패할 때 생긴다. 나이가 들면 손상이 늘어나는 동시에 면역 감시가 떨어져서 노화세포가 쌓이고, 일시적이어야 할 신호가 상시적인 것이 된다.

## SASP: 노화세포가 이웃에 하는 일

<figure>
<img src="/assets/fig/masld-senescence-f2.jpg" alt="Senescent hepatocytes releasing SASP factors and the effects on surrounding cells" width="1504" height="1137">
<figcaption><b>왜 소수가 문제가 되는가.</b> 노화세포는 사이토카인·케모카인·단백질분해효소·성장인자를 분비한다. 그것들이 이웃에 작용한다. 면역세포를 부르고, 섬유모세포 같은 세포를 활성화하고, 가까운 건강한 세포를 노화로 밀어 넣는다.
<br><span class="credit">Sung et al., <a href="https://doi.org/10.1097/HC9.0000000000001055"><i>Hepatol. Commun.</i> <b>10</b>, e01055 (2026)</a> &#183; 논문 그림, Figure 2</span></figcaption>
</figure>

**SASP**는 노화세포가 내놓는 것들의 집합이다.

- 염증성 사이토카인 — IL-6, IL-1β, IL-8
- 케모카인 — CXCL1, CXCL2. 면역세포를 부른다
- 기질 단백질분해효소 — MMP (matrix metalloproteinase) 계열. 주변 조직을 재구성한다
- 성장인자 — 그중에는 이웃 세포를 세포노화 쪽으로 미는 것도 있다

<mark>이것이 세포노화를 세포의 문제가 아니라 조직의 문제로 만든다.</mark> 그냥 멈춰서 가만히 있는 세포라면 조직의 1%여도 무해하다. IL-6를 분비하고 대식세포를 불러들이는 세포는 그렇지 않다. 그리고 **방관자 효과 (bystander effect)** — 노화세포가 건강한 이웃을 노화시키는 것 — 때문에 새 손상 없이도 집단이 커진다.

이 분야가 "제거"를 말하는 이유이기도 하다. **senolytics**는 노화세포를 선택적으로 죽이고, **senomorphics**는 세포는 두고 SASP만 억누른다. 멈춤이 문제냐 분비가 문제냐에 대한 서로 다른 두 베팅이다.

## 단일 marker가 없다

분석에서 발목을 잡는 지점이다.

| Marker | 무엇인가 | 왜 부족한가 |
| --- | --- | --- |
| p16 (*CDKN2A*) | 세포주기 억제자 | 발현량이 낮고, 세포노화 없이도 유도된다 |
| p21 (*CDKN1A*) | 세포주기 억제자 | 평범한 스트레스 반응에서도 일시적으로 오른다 |
| SA-β-gal (senescence-associated β-galactosidase) | 리소좀 활성 염색 | 조직학 전용이고 특이적이지 않다 |
| lamin B1 감소 | 핵막 | 감소량이라 기준이 필요하다 |
| γH2AX | DNA 손상 focus | 멈춤이 아니라 손상을 표시한다 |

<mark class="blue">어느 하나로도 노화세포를 식별할 수 없어서, 세포노화는 **조합**으로 점수 매긴다. 즉 유전자 집합으로 매기고, 거기 딸려오는 문제를 전부 안는다.</mark>

쓰이는 집합들:

| 집합 | 무엇인가 |
| --- | --- |
| SenMayo | 125개 유전자. SASP 쪽에 가중. single-cell 데이터용으로 만들고 검증 |
| SHGS (senescent hepatocyte gene signature) | 100개 유전자. 문헌 큐레이션이 아니라 간세포에 세포노화를 직접 유도해서 뽑았다. 간 특이적이고, 논문은 bulk에서 [GSVA (gene set variation analysis)](../gene-sets-ko/)로 점수를 낸다 |
| CellAge | 조작했을 때 세포노화를 일으키거나 막는다고 확인된 사례 866건을 큐레이션한 것. 발현 signature가 아니라 인과 목록이다 |
| Reactome / MSigDB 세포노화 집합 | pathway에서 유도. 더 넓고 더 시끄럽다 |

이 일을 위해 설계된 건 SenMayo다. 멈춤 marker가 아니라 분비 인자에 비중을 둔 것이 의도적인데, SASP 유전자가 *CDKN2A*보다 발현이 높아서 dropout을 더 잘 견디기 때문이다.

## 이들은 같은 종류의 목록이 아니다

<mark>SenMayo와 SHGS는 **발현 signature**다. 노화세포에서 올라가는 유전자들이라 세포에 점수를 매길 수 있다. CellAge는 **인과 목록**이다. 조작하면 세포를 세포노화로 밀어 넣거나 빼내는 유전자들이다.</mark>

인과 유전자 중 상당수는 자기 발현이 변하지 않는다. 종양억제 유전자가 정지에 필요하면서도 자기 발현량은 그대로일 수 있다. 그래서 CellAge로 세포에 점수를 매기면 *이 세포가 노화세포인가*보다 *노화세포가 될 수 있는가*에 가까운 답이 나오고, 이걸 세 번째 점수 집합처럼 쓰는 것이 피해야 할 실수다. 점수 매기는 단계가 아니라 해석하는 단계에 쓸 목록이다.

**내 데이터에 가장 가까운 건 SHGS다.** 논문에서 가져온 목록이 아니라, 간세포에 in vitro·in vivo로 세포노화를 유도하고 거기서 살아남은 차등 발현 유전자 100개를 남긴 것이다. 그래서 작고, 간에 특화돼 있고, 세포노화 후기 상태로 치우쳐 있다. 그게 동시에 한계이기도 하다. 다른 조직으로는 그대로 옮겨 가지 않는다.

## 지방간에서는

<figure>
<img src="/assets/fig/masld-senescence-f1.jpg" alt="Metabolic stress driving hepatocyte senescence in MASLD" width="1600" height="738">
<figcaption><b>들어가는 경로.</b> 유리지방산이 쌓이고, 거기서 오는 스트레스가 간세포를 손상시키고, 손상된 간세포는 분열하는 대신 멈춘다. 지방간이 재생을 잘 못 하는 이유이기도 하다.
<br><span class="credit">Sung et al., <a href="https://doi.org/10.1097/HC9.0000000000001055"><i>Hepatol. Commun.</i> <b>10</b>, e01055 (2026)</a> &#183; 논문 그림, Figure 1</span></figcaption>
</figure>

MASLD (대사 이상 관련 지방간 질환)에서 이 순서가 [간은 무엇으로 이루어져 있나](../liver-cells-ko/), [질환 단계](../masld-staging-ko/)와 바로 이어진다.

1. 간세포에 지방이 쌓이고, 지질독성 스트레스가 손상을 준다.
2. 손상된 간세포가 분열 대신 멈춘다. 그래서 재생 능력이 가장 필요한 순간에 떨어진다.
3. 세포노화에 들어간 그 간세포들이 SASP를 분비한다.
4. SASP 인자가 면역세포를 부르고 성상세포를 활성화한다.
5. 활성화된 성상세포가 콜라겐을 깐다 — [섬유화](../masld-staging-ko/), 예후를 예측하는 바로 그 축.

그래서 세포노화는 노화 (aging)와 섬유화 진행 사이의 그럴듯한 기전적 연결이다.

## 데이터에서 발목을 잡는 것들

- **scRNA-seq (single-cell RNA sequencing)에서 세포 하나하나에 매긴 세포노화 점수는 믿을 게 못 된다.** *CDKN2A*는 발현이 낮아 dropout에 날아간다. 점수는 세포 유형별·샘플별로 묶어서 볼 때만 해석 가능하다.
- **SASP 가중 집합은 염증을 점수 매긴다.** SenMayo는 분비 염증 인자에 치우쳐 있고, 그게 검출 가능하게 만드는 동시에 다른 염증 상태와 구분하기 어렵게 만든다. 염증 조직에서 SenMayo 점수가 높다는 것만으로는 세포노화의 근거가 되지 않는다.
- **세포노화는 유형이 아니라 상태다.** 자기 군집으로 나오지 않는다. 간세포 안에서도, 성상세포 안에서도, 대식세포 안에서도 연속적인 정도 차이로 존재한다. 세포 유형 annotation 문제가 아니라 [군집화](../clustering-ko/) 문제다.
- **증식 marker가 당연한 음성 대조군인데 자주 빠진다.** 노화세포는 분열 중이면 안 된다. *MKI67* 확인은 공짜다.

## 정리

- 세포노화는 **죽지 않는 영구적 세포주기 정지**다. 종양 억제와 상처 치유에 쓸모 있고, 청소가 실패하면 병리가 된다
- **SASP**는 멈춘 세포가 분비하는 것 — 사이토카인·케모카인·단백질분해효소·성장인자
- SASP가 세포노화를 **비세포자율적**으로 만든다. 소수가 조직 전체를 바꾸고, 방관자 효과가 그 집단을 키운다
- **단일 marker로 확정할 수 없어서** 유전자 집합으로 점수 매긴다. SenMayo와 SHGS는 세포에 점수를 매길 수 있는 발현 signature이고, **CellAge는 인과 목록이라 점수용이 아니다**
- SenMayo가 분비 인자에 가중하는 건 의도적이다. *CDKN2A*와 달리 dropout을 견디기 때문
- MASLD에서: 지질독성 스트레스 → 간세포 정지 → SASP → 성상세포 활성화 → 섬유화
- 점수는 묶어서 보고, 증식을 음성 대조군으로 확인하고, SASP 점수가 부분적으로 염증 점수라는 것을 기억한다

## 참고

- Sung et al., [Hepatocyte senescence in metabolic dysfunction-associated steatotic liver disease](https://doi.org/10.1097/HC9.0000000000001055), *Hepatol. Commun.* **10** (2026) — 위 그림들의 출처
- Saul et al., [A new gene set identifies senescent cells and predicts senescence-associated pathways across tissues](https://doi.org/10.1038/s41467-022-32552-1), *Nat. Commun.* (2022) — SenMayo
- Du et al., [Targeting senescent hepatocytes for treatment of metabolic dysfunction-associated steatotic liver disease and multi-organ dysfunction](https://doi.org/10.1038/s41467-025-57616-w), *Nat. Commun.* **16**, 3038 (2025) — SHGS
- Avelar et al., [A multidimensional systems biology analysis of cellular senescence in aging and disease](https://doi.org/10.1186/s13059-020-01990-9), *Genome Biol.* **21**, 91 (2020) — CellAge
- Gorgoulis et al., [Cellular senescence: defining a path forward](https://doi.org/10.1016/j.cell.2019.10.005), *Cell* (2019) — 단일 marker가 왜 안 되는가
