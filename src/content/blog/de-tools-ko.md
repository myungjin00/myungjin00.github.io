---
title: "차등 발현 도구: DESeq2, PyDESeq2, MAST"
date: 2026-01-23
description: "왜 t-검정이 아니라 음이항 분포인가 · DESeq2와 PyDESeq2의 관계 · MAST의 hurdle 모델이 푸는 문제 · single-cell에서 거짓 양성이 쏟아지는 이유와 pseudobulk라는 답"
category: tutorial
updated: 2026-02
lang: ko
group: de-tools
topic: Bioinformatics
subtopic: Transcriptomics
tags: [DESeq2, MAST, differential expression]
---

[앞 글](../bulk-vs-sc-ko/)에서 bulk와 single-cell의 차이를 봤다. 그 차이가 **차등 발현 분석** (differential expression; DE)의 도구 선택을 결정한다.

## 왜 t-검정이 아닌가

RNA-seq의 측정값은 **read count**다. 연속값이 아니라 0 이상의 정수다. 여기에 t-검정을 쓰면 세 가지가 어긋난다.

1. **분산이 평균에 딸려 간다 (mean–variance relationship).** 발현이 높은 유전자는 분산도 크다. 등분산 가정이 깨진다.
2. **과분산 (overdispersion).** read가 순전히 무작위로 쌓이기만 한다면 푸아송 분포를 따라야 하는데, 생물학적 반복 사이의 변동 때문에 분산이 평균보다 훨씬 크다.
3. **반복 (replicate)이 적다.** 조건당 3개가 흔하다. 유전자마다 따로 분산을 추정하기에는 턱없이 부족하다.

그래서 RNA-seq 도구들은 **음이항 분포 (negative binomial)** 를 쓴다. 푸아송에 분산 모수를 하나 더 붙여 과분산을 흡수한다.

$$
K_{ij} \sim \mathrm{NB}(\mu_{ij},\ \alpha_i)
$$

$K_{ij}$는 유전자 $i$, 샘플 $j$의 count, $\alpha_i$가 유전자별 과분산 모수 (dispersion)다.

<figure>
<img src="/assets/fig/de-dispersion.svg" alt="Mean against variance for Poisson and negative binomial counts, and dispersion before and after shrinkage" loading="lazy" />
<figcaption><b>왜 음이항이고, 왜 축소인가.</b> 반복 3개로 모사한 count이고, 유전자는 <b>(A)</b>가 4,000개, <b>(B)</b>가 900개다. <b>(A)</b> counting noise만 있는 count(파랑)는 분산 = 평균인 점선 주위에 흩어진다. 반복 간 변동이 더해지면(주황) 점선보다 훨씬 위로 올라가고, 그 간격이 과분산이다. <b>(B)</b> 반복이 3개면 유전자별 dispersion 추정치는 거의 쓸 수 없다(회색). 적합된 평균&ndash;dispersion 곡선 쪽으로 당기면 흩어짐이 3분의 1 가까이 줄어든다.</figcaption>
</figure>

## DESeq2

bulk RNA-seq의 사실상 표준이다. 핵심 아이디어 둘이 그 성능의 대부분을 설명한다.

**dispersion 축소 (shrinkage).** 반복이 3개면 유전자 하나의 dispersion 추정이 매우 불안정하다. DESeq2는 전체 유전자의 "평균-분산 관계"를 먼저 적합한 뒤, 개별 유전자 추정치를 그 곡선 쪽으로 당겨온다. 혼자 튀는 추정을 막는다.

**log2 fold change 축소.** fold change는 두 조건 사이 발현량의 비이고 log2로 적는다. 발현이 낮은 유전자는 이 값이 과장되기 쉽다(0에 가까운 값으로 나누니까). 이쪽도 당겨서, 낮은 발현 유전자가 상위권을 차지하는 일을 막는다.

```r
library(DESeq2)
dds <- DESeqDataSetFromMatrix(counts, colData, design = ~ condition)
dds <- DESeq(dds)
res <- results(dds, contrast = c("condition", "treated", "control"))
```

> **`design` 공식이 분석의 절반이다.** 배치 효과 (batch effect)가 있다면 `~ batch + condition`으로 넣어야 한다. 넣지 않으면 배치 차이가 조건 차이로 둔갑한다.

## PyDESeq2

DESeq2를 파이썬으로 다시 구현한 것이다. 같은 음이항 모델, 같은 축소 전략이고, 결과도 대체로 일치한다.

```python
from pydeseq2.dds import DeseqDataSet
from pydeseq2.ds import DeseqStats
dds = DeseqDataSet(counts=counts, metadata=meta, design="~condition")
dds.deseq2()
res = DeseqStats(dds, contrast=["condition", "treated", "control"]).summary()
```

쓰는 이유는 하나다. **나머지 분석이 파이썬에 있을 때.** Scanpy로 single-cell을 다루다가 DE만 R로 넘어가는 건 번거롭고 재현도 어렵다.

다만 알아둘 것이 있다. PyDESeq2는 **DESeq2의 모든 기능을 담고 있지 않다.** 복잡한 설계나 일부 축소 옵션은 아직 R 쪽에만 있다. 수치가 미세하게 다를 수도 있다. 논문에 쓸 거라면 어느 구현을 썼는지 밝혀야 한다.

## MAST

single-cell을 겨냥해 만들어진 도구다. 출발점은 [앞 글](../bulk-vs-sc-ko/)에서 본 **0의 문제**다. single-cell 카운트 행렬은 값 대부분이 0인데, 유전자가 꺼져 있어서인 경우와 그냥 검출되지 않은 경우가 섞여 있다.

MAST는 발현을 두 부분으로 나눠 모델링한다 (**hurdle model**).

1. **발현되는가 안 되는가** — 로지스틱 회귀 (0인지 아닌지)
2. **발현된다면 얼마나** — 0이 아닌 값들에 대한 가우시안 회귀

두 부분을 함께 검정한다. 그리고 세포마다 검출된 유전자 수 (<u>cellular detection rate; CDR</u>)를 공변량으로 넣는데, 이것이 기술적 변동을 상당 부분 흡수한다.

```r
library(MAST)
sca <- FromMatrix(log2(tpm + 1), cData, fData)   # MAST는 raw count가 아니라 log2(TPM+1)을 받는다
colData(sca)$cngeneson <- scale(colSums(assay(sca) > 0))   # CDR
zlm_fit <- zlm(~ condition + cngeneson, sca)
```

## 그런데 — single-cell DE의 함정

MAST든 Wilcoxon이든 **세포를 독립 표본으로 보는 모든 검정**은 같은 문제를 안고 있다.

Squair et al. (2021)이 체계적으로 보인 내용이다. 세포 1만 개를 표본 1만 개로 치면 통계적 검정력 (statistical power)이 터무니없이 높아져서, <mark class="blue">**생물학적으로 의미 없는 차이도 p < 10⁻¹⁰⁰으로 나온다.**</mark> 그런데 그 세포들은 같은 개체에서 왔으므로 독립이 아니다. 진짜 반복 단위는 개체다.

저자들은 샘플 라벨을 **뒤섞은** 데이터에서도 기존 도구들이 수천 개의 "유의한" 유전자를 찾아낸다는 걸 보였다. 있을 수 없는 결과다.

**답은 pseudobulk다.** 샘플별·세포유형별로 count를 합친 뒤 DESeq2로 검정한다.

```python
# 세포 × 유전자  →  (샘플 × 세포유형) × 유전자
pb = adata.to_df().groupby([adata.obs.sample_id, adata.obs.cell_type]).sum()
```

반복 수가 세포 수에서 샘플 수로 줄어든다. <mark>숫자는 초라해지지만 **그게 실제로 가진 정보량**이다.</mark>

<figure>
<img src="/assets/fig/pseudobulk-fpr.svg" alt="False positive rate against cells per subject, for cell-level testing and for pseudobulk" loading="lazy" />
<figcaption><b>세포를 표본으로 보면 실제로 치르는 대가.</b> 두 조건 사이에 진짜 차이가 <em>없는</em> 데이터로 모사했으므로 검출된 것은 전부 거짓 양성이다. 집단당 개체 6명, 한 개체 안의 세포는 공통 offset을 공유한다. 세포 단위로 검정하면 개체당 5,000세포에서 거짓 양성이 98%까지 올라가고, pseudobulk는 검정이 약속한 5% 근처에 머문다. 세포를 늘릴수록 세포 단위 검정은 <em>더 나빠진다.</em> 근거는 늘지 않는데 확신만 커지기 때문이다.</figcaption>
</figure>

## 그래서 뭘 쓰나

| 상황 | 도구 |
| --- | --- |
| bulk RNA-seq | DESeq2 (R) 또는 PyDESeq2 (Python) |
| single-cell, 조건 간 비교, 샘플이 여럿 | **pseudobulk + DESeq2** ← 기본값으로 삼을 것 |
| single-cell, 클러스터 marker 유전자 찾기 | Wilcoxon (Scanpy `rank_genes_groups`) — 탐색용 |
| single-cell, 샘플이 하나뿐 | MAST 또는 Wilcoxon, 단 결론은 조심해서 |
| 반복이 없다 | 통계적 결론을 내지 않는다 |

마지막 줄을 넘기기 쉽다. 조건당 샘플이 하나면 조건 차이와 개체 차이를 분리할 방법이 없다.

## 정리

- count 데이터라서 t-검정이 아니라 **음이항 분포**를 쓴다
- DESeq2의 힘은 분산과 fold change를 전체 쪽으로 당기는 축소에 있다
- PyDESeq2는 파이썬 재구현 — 기능이 완전히 같지는 않으니 어느 쪽을 썼는지 밝힐 것
- MAST는 0 문제를 hurdle 모델로 다루고 CDR을 공변량으로 넣는다
- **세포를 표본으로 보면 거짓 양성이 쏟아진다** — 기본값은 pseudobulk
- `design` 공식에 배치를 넣지 않으면 배치가 조건으로 둔갑한다

## 참고

- Love, Huber & Anders, [Moderated estimation of fold change and dispersion for RNA-seq data with DESeq2](https://doi.org/10.1186/s13059-014-0550-8), *Genome Biol.* (2014)
- Finak et al., [MAST: a flexible statistical framework for assessing transcriptional changes and characterizing heterogeneity in single-cell RNA sequencing data](https://doi.org/10.1186/s13059-015-0844-5), *Genome Biol.* (2015)
- Squair et al., [Confronting false discoveries in single-cell differential expression](https://doi.org/10.1038/s41467-021-25960-2), *Nat. Commun.* (2021)
- Muzellec et al., [PyDESeq2](https://doi.org/10.1093/bioinformatics/btad547), *Bioinformatics* (2023)
