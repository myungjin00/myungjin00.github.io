---
title: "bulk RNA-seq와 single-cell RNA-seq"
date: 2025-11-21
description: "평균을 재는 것과 한 세포씩 재는 것의 차이 · dropout과 희소성이 분석을 어떻게 바꾸는가 · 언제 bulk로 충분한가 · pseudobulk가 왜 다시 등장하는가"
category: concept
updated: 2025-12
lang: ko
group: bulk-sc
topic: Bioinformatics
subtopic: Transcriptomics
tags: [RNA-seq, single-cell, transcriptomics]
---

조직은 여러 세포 유형이 섞인 것이고, RNA-seq는 그 혼합물의 평균을 재거나 세포를 하나씩 잴 수 있다. 둘 중 어느 쪽을 돌렸느냐가 그 데이터로 물을 수 있는 질문을 정하고, 그 뒤의 거의 모든 단계 — 정규화, 군집화, 통계 — 가 둘 사이에서 갈린다.

## 무엇을 재는가

둘 다 전사체 (transcriptome), 즉 "어떤 유전자가 얼마나 발현되고 있는가"를 잰다. 차이는 **무엇을 하나의 단위로 재느냐**다.

| | bulk RNA-seq | single-cell RNA-seq |
| --- | --- | --- |
| 측정 단위 | 조직 조각 전체 | 세포 하나 |
| 얻는 값 | 세포 1만~100만 개의 평균 | 세포마다 하나씩, 수천~수백만 개 |
| 유전자당 read count | 많다 (수백~수천) | 적다 (0~수십) |
| 0의 비율 | 낮다 | 매우 높다 (80~95%) |
| 비용 | 싸다 | 비싸다 |
| 알 수 있는 것 | 조직 수준의 변화 | 어느 세포가 변했는가 |

핵심은 마지막 줄이다. <mark class="blue">bulk에서 어떤 유전자가 2배 올랐다면 해석이 둘로 갈린다. 모든 세포에서 조금씩 올랐거나, 일부 세포에서 크게 올랐거나.</mark> bulk는 이 둘을 구분하지 못한다.

간 조직에서 염증 유전자가 올랐다고 하자 ([간은 무엇으로 이루어져 있나](../liver-cells-ko/)에서 그 세포들이 무엇인지 다룬다). 간세포 전체가 조금씩 염증 상태인 것과, Kupffer 세포만 크게 활성화된 것은 생물학적으로 전혀 다른 이야기인데 bulk로는 같아 보인다.

## 0이 많다는 것의 의미

single-cell에서 발현값 행렬의 80~95%가 0이다. 이유는 두 가지가 섞여 있다.

- **생물학적 0 (biological zero)** — 그 세포가 그 유전자를 정말 안 쓴다
- **기술적 0 (technical zero, dropout)** — 쓰고 있는데 잡히지 않았다. 세포 하나에 든 mRNA가 워낙 적어서 포획되지 않는 일이 흔하다

이 둘을 구분할 방법이 없다는 점이 single-cell 분석의 거의 모든 난점을 만든다. 정규화 (normalisation), 차원 축소 (dimensionality reduction), [차등 발현 검정](../de-tools-ko/)이 bulk와 달라지는 이유가 전부 여기서 나온다.

## 분석 흐름이 갈리는 지점

**bulk**는 비교적 단순하다.

```
reads → 정렬/정량 → 유전자×샘플 행렬 → 정규화 → DEG(differentially expressed gene) → enrichment 분석
```

샘플이 보통 수십 개 수준이고, 각 샘플이 조건 (처리군/대조군)에 속한다. 통계가 명확하다.

<figure class="narrow">
<img src="/assets/fig/scrnaseq-workflow-haque2017.png" alt="Nine-step single-cell RNA-seq workflow from cell isolation to interpretation" loading="lazy" />
<figcaption>single-cell RNA-seq의 실험–분석 전 과정. 세포 분리 (1)부터 cDNA 라이브러리 (2–7), 품질 관리 (QC, 8), 해석 (9)까지. 1–7은 bulk에 없는 단계이고, 세포 하나에서 시작하는 데서 오는 <em>dropout</em>이 전부 여기서 만들어진다.
<br><span class="credit">Haque et al., <a href="https://doi.org/10.1186/s13073-017-0467-4"><em>Genome Med.</em> <b>9</b>, 75 (2017)</a> &#183; 논문 그림, Figure 1</span></figcaption>
</figure>

**single-cell**은 한 단계가 더 있다.

```
reads → 세포×유전자 행렬 → QC → 정규화 → 차원 축소 → 군집화
      → 세포 유형 annotation → 그다음에야 비교
```

**군집화 (clustering)와 annotation이 먼저**라는 게 결정적이다. 어떤 세포가 무엇인지 모르면 비교할 대상 자체가 정해지지 않는다. 그리고 이 단계는 [비지도 학습](../learning-paradigms-ko/)이라 정답이 없다. <mark>resolution 파라미터 하나만 바꾸면 군집 개수가 달라지고, 뒤따르는 결론도 달라진다.</mark>

## 언제 bulk로 충분한가

single-cell이 항상 낫지는 않다.

| 상황 | 선택 |
| --- | --- |
| 조직 전체의 반응을 보고 싶다 | bulk. 싸고 통계가 튼튼하다 |
| 샘플 수가 많아야 한다 (환자 코호트) | bulk |
| 세포 유형 구성 (cell type composition)이 바뀌는지 알고 싶다 | single-cell |
| 희귀 세포 집단 (rare population)이 궁금하다 | single-cell |
| 세포 상태의 연속적 변화 (분화, 세포노화) | single-cell |
| 예산이 빠듯하다 | bulk |

노화 간 조직을 볼 때 "노화세포가 늘었는가"는 single-cell이어야 답할 수 있다. 반면 "이 처리로 지질 대사 경로가 바뀌었는가"는 bulk로 충분하고, 오히려 샘플을 늘릴 수 있어 낫다.

## pseudobulk — 다시 평균으로

**single-cell 데이터를 다시 bulk처럼 합치는** 방법이 표준이 되고 있다.

<mark>세포 하나하나를 독립 표본으로 보고 검정하면, 수만 개 세포가 전부 표본이 되어 p값이 터무니없이 작아진다.</mark> 그런데 그 세포들은 독립이 아니다. 같은 개체, 같은 배양 접시에서 왔다. 진짜 반복 단위 (unit of replication)는 **세포가 아니라 샘플**이다.

그래서 <u>pseudobulk</u>는 샘플별·세포유형별로 발현을 합친 뒤, bulk 도구로 검정한다.

```
세포 × 유전자  →  (샘플 × 세포유형) × 유전자  →  DESeq2
```

Squair et al. (2021)이 이걸 체계적으로 보였다. 세포 단위 검정은 거짓 양성 (false positive)을 대량으로 만들고, pseudobulk가 훨씬 정직하다는 것이다. 자세한 내용은 [다음 글](../de-tools-ko/)에서 다룬다.

## 정리

- bulk는 조직의 평균, single-cell은 세포마다 하나씩
- bulk는 "모두 조금"과 "일부만 크게"를 구분하지 못한다
- single-cell은 0이 80~95%이고, 생물학적 0과 dropout을 구분할 수 없다
- single-cell은 **군집화·annotation이 먼저**라서 비지도 단계의 선택이 결론을 좌우한다
- 조직 수준 반응이나 많은 샘플에는 bulk가 여전히 낫다
- 세포를 독립 표본으로 보면 p값이 망가진다 — **pseudobulk**로 샘플 단위로 되돌린다

## 참고

- Luecken & Theis, [Current best practices in single-cell RNA-seq analysis: a tutorial](https://doi.org/10.15252/msb.20188746), *Mol. Syst. Biol.* (2019)
- Squair et al., [Confronting false discoveries in single-cell differential expression](https://doi.org/10.1038/s41467-021-25960-2), *Nat. Commun.* (2021)
- Heumos et al., [Best practices for single-cell analysis across modalities](https://doi.org/10.1038/s41576-023-00586-w), *Nat. Rev. Genet.* (2023)
- Haque et al., [A practical guide to single-cell RNA-sequencing for biomedical research and clinical applications](https://doi.org/10.1186/s13073-017-0467-4), *Genome Med.* (2017)
