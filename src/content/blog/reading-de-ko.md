---
title: "차등 발현 결과를 그림으로 읽기"
date: 2026-02-06
description: "log2 fold change·p·보정 p는 서로 다른 질문이다 · volcano에 축이 둘인 이유는 유의성과 효과 크기가 다른 것이기 때문 · pathway를 칠해서 보기 · 행 z-score가 드러내는 것과 지우는 것 · 그리고 그림을 믿기 전에 확인할 것"
category: concept
updated: 2026-02
lang: ko
group: reading-de
topic: Bioinformatics
subtopic: Transcriptomics
tags: [differential expression, volcano plot, heatmap, visualisation]
---

[검정을 돌리면](../de-tools-ko/) 2만 행짜리 표가 나온다. 그 표를 읽는 사람은 없다. 실제로 읽히는 건 그림 두 개이고, 둘 다 무언가를 가린다.

## 숫자 셋, 질문 셋

| | 무엇에 답하나 |
| --- | --- |
| log$_2$ fold change | **얼마나** 변했나, 어느 방향으로 |
| $p$ | 아무 일도 없었다면 이 변화가 얼마나 놀라운가 |
| 보정 $p$ | 같은 질문을 2만 번 물었다는 걸 감안하면 |

셋은 따로 움직인다. read가 수천 개인 유전자는 변화가 작아도 아주 믿을 만할 수 있고, 수십 개인 유전자는 두 배가 되어도 아무 뜻이 없을 수 있다. <mark>유의성은 크기가 아니라 확신에 대한 진술이고</mark>, 사람들이 이 둘을 자꾸 섞어서 volcano가 생겼다.

## volcano

<figure>
<img src="/assets/fig/volcano.svg" alt="Volcano plot of a simulated young-versus-old comparison, with one pathway marked in a second colour" loading="lazy" />
<figcaption><b>같은 비교를 두 번.</b> 유전자 4,000개, 군마다 샘플 6개를 모사한 것이라 정답을 알고 있다. 두 기준을 다 넘는 건 128개다. <b>왼쪽</b>은 전체 유전자. <b>오른쪽</b>은 pathway 하나를 칠한 것으로, 지질 대사 유전자 60개의 log$_2$ fold change 중앙값이 <b>0.79</b>인데 임계값을 넘는 건 <b>15개</b>뿐이다. <mark class="blue">집합이 함께 움직여도 유전자별 검정은 대부분 놓친다.</mark> 이 글을 쓰면서 모사 데이터로 계산했다.</figcaption>
</figure>

x는 효과 크기, y는 확신이다. 점선은 관례적인 기준 — 보정 $p$ 0.05, fold change 2배 — 이고, 발견이 아니라 관례다.

네 귀퉁이가 각각 다른 말을 한다.

- **위쪽 양 끝** — 크게 변했고 확실하다. 사람들이 인용하는 유전자들.
- **위쪽 가운데** — 작지만 믿을 수 있는 변화. 발현이 높은 유전자의 진짜 생물학적 효과인 경우가 많은데, fold change 필터에 일상적으로 잘려 나간다.
- **아래쪽 양 끝** — 크게 변했는데 믿을 수 없다. 보통 count가 낮은 유전자에 샘플 하나가 튄 경우다.
- **아래쪽 가운데** — 아무 일도 없다. 유전체의 대부분.

오해를 부르는 축은 y다. $-\log_{10}$이라 위쪽은 늘어나고 나머지는 띠 하나로 눌린다. $10^{-100}$인 유전자가 $10^{-10}$인 유전자보다 유의미하게 더 진짜인 것이 아니다. 둘 다 이 데이터로 말할 수 있는 만큼 확실하다.

## 집합을 칠해서 보기

pathway를 칠하면 volcano가 다른 도구가 된다. *어떤 유전자가 변했나*가 아니라 **내가 보러 온 생물학이 이 분포의 어디에 있나**에 답한다.

그림에서 지질 대사 유전자들은 오른쪽에 모여 있다. 반응이 한 방향으로 일관된 모양이다. 그런데 대부분이 선을 넘지 못한다. 유의한 목록만 읽으면 여럿 중에 지질 유전자 몇 개를 보고할 뿐, 집합 전체가 움직였다는 건 놓친다.

이 간격이 [유전자 집합 enrichment](../gene-sets-ko/)가 존재하는 이유를 그림으로 보여 준다. 임계값 검정은 유전자를 하나씩 따로 묻기 때문에, 조금씩 함께 움직이는 집합은 보이지 않는다. 집합을 먼저 칠해 보고 그다음 검정하는 순서도 괜찮다. 단, 집합을 보기 전에 정했어야 한다.

## heatmap

<figure>
<img src="/assets/fig/heatmap-zscore.svg" alt="The same 40 genes drawn as raw log expression and as row z-scores" loading="lazy" />
<figcaption><b>스케일링이 하는 일.</b> 가장 유의한 유전자 40개, 같은 행, 같은 순서. <b>왼쪽</b>은 raw log$_2$ 발현이다. 행끼리 전체 발현량이 최대 <b>6.7</b> log$_2$ 차이라, 그 편차가 young–old 차이를 덮는다. <b>오른쪽</b>은 행마다 중심을 맞추고 스케일한 것으로, 블록 구조가 드러난다. 위쪽은 old에서 내려간 것, 아래쪽은 올라간 것. 이 글을 쓰면서 모사 데이터로 계산했다.</figcaption>
</figure>

눈에 띄는 발현 heatmap은 거의 전부 행 단위 z-score인데, 그 사실이 적혀 있는 경우는 거의 없다. 옳은 선택이고, 대가가 있다.

- **드러내는 것** — 각 유전자의 발현량이 얼마든 상관없이, 샘플에 걸친 패턴을 한 번에 보여 준다
- **지우는 것** — 발현량. 스케일링 뒤에는 count 20인 유전자와 2만인 유전자가 똑같아 보인다. 그림 어디에도 어느 쪽인지 적혀 있지 않다
- **만들어 내는 것** — 전혀 변하지 않은 행도 색 범위를 꽉 채우도록 늘어난다. <mark>순수한 noise 행을 스케일하면 패턴처럼 보인다.</mark>

그림의 모양을 결정하는 게 둘 더 있는데, 둘 다 결과가 아니다.

**행 순서.** 군집화한 순서가 기본값이고, 그 dendrogram은 고른 거리 척도와 linkage에 달려 있다. 위처럼 fold change로 정렬하는 쪽이 더 정직할 때가 많다. 한 구절로 밝힐 수 있는 선택이기 때문이다.

**어떤 유전자를 넣었나.** $p$ 기준 상위 40개로 그린 heatmap은 *언제나* 설득력 있어 보인다. 두 군을 가르도록 뽑힌 유전자들이니까. 그 그림이 보여 주는 건 선별이 작동했다는 것이지 두 군이 다르다는 것이 아니다. 전체 데이터로 유전자를 고르고 그걸 그리는 건 검정 점수를 무효로 만드는 [누출](../evaluation-protocol-ko/)과 같은 일이다.

## 그림을 믿기 전에

- **값에 부호가 있으면 색 중심이 0인지 확인한다.** diverging 색에서 흰색이 0이 아니면 없던 차이가 생긴다.
- **샘플 수를 센다.** 군당 6개는 작은 연구이고 3개는 예비 실험이다. 그림은 그 말을 하지 않는다.
- **무엇을 걸러냈는지 묻는다.** count가 낮은 유전자는 검정 전에 보통 제거하고 그게 맞지만, 기준값이 그림을 바꾼다.
- **혼자 일하는 샘플 하나를 찾는다.** raw heatmap에서는 튀는 열 하나가 보이는데, z-score 쪽에서는 훨씬 안 보인다.
- **그림과 주장을 분리한다.** volcano는 유전자가 변했다는 것까지만 보여 준다. 그게 어느 pathway를 가리키는지는 별개의 주장이고 [따로 검정](../gene-sets-ko/)해야 한다.

single-cell은 이 지점 앞쪽 파이프라인이 다르다 — 품질 관리, 정규화, 변이 큰 유전자 선별, 군집화, 세포 유형 라벨. 하지만 한 세포 유형 안에서 비교하는 단계에 오면 그림과 그 실패 양식은 같다. 중요한 차이는 [거기까지 오는 데 어떤 검정을 썼는가](../de-tools-ko/)다.

## 정리

- log$_2$ fold change, $p$, 보정 $p$는 서로 다른 질문에 답하고 따로 움직인다
- volcano는 효과 크기와 확신을 맞세운 그림이고, 거기 그어진 선은 관례다
- y축이 로그라 위쪽만 늘어나고 나머지는 거의 다 눌린다
- **pathway를 칠하면** 내 생물학이 분포의 어디에 있나로 질문이 바뀐다. 함께 움직이는 집합은 유전자별 검정에서 대부분 탈락하고, enrichment 방법이 존재하는 이유가 그것이다
- heatmap은 거의 항상 행 z-score인데 그 사실을 거의 밝히지 않는다
- 스케일링은 패턴을 드러내고 발현량을 지우며 noise를 구조처럼 만든다
- **상위 $n$개 유전자는 언제나 두 군을 가른다.** 그러라고 뽑은 것이다
- 색 중심, 샘플 수, 필터, 그리고 결과를 혼자 떠받치는 샘플을 확인한다

## 참고

- Love et al., [Moderated estimation of fold change and dispersion for RNA-seq data with DESeq2](https://doi.org/10.1186/s13059-014-0550-8), *Genome Biol.* (2014) — 숫자 셋의 출처
- Benjamini & Hochberg, [Controlling the false discovery rate](https://doi.org/10.1111/j.2517-6161.1995.tb02031.x), *J. R. Stat. Soc. B* (1995) — 보정 방법
- Gehlenborg & Wong, [Heat maps](https://doi.org/10.1038/nmeth.1902), *Nat. Methods* **9** (2012) — 스케일링과 순서 선택이 하는 일
- Gehlenborg & Wong, [Mapping quantitative data to color](https://doi.org/10.1038/nmeth.2134), *Nat. Methods* **9** (2012) — diverging 색의 중심이 왜 중요한가
