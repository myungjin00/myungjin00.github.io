---
title: "Differential expression tools: DESeq2, PyDESeq2, MAST"
date: 2026-01-23
description: "Why a negative binomial rather than a t-test · how PyDESeq2 relates to DESeq2 · what MAST's hurdle model is for · why single-cell DE produces false positives, and why pseudobulk is the answer"
category: tutorial
updated: 2026-02
lang: en
group: de-tools
topic: Bioinformatics
subtopic: Transcriptomics
tags: [DESeq2, MAST, differential expression]
---

[The previous note](../bulk-vs-sc-en/) covered how bulk and single-cell differ. That difference decides which **differential expression (DE)** tool you reach for.

## Why not a t-test

RNA-seq measurements are **counts** — non-negative integers, not continuous values. A t-test breaks on three things:

1. **Variance tracks the mean.** Highly expressed genes vary more. Equal variance does not hold.
2. **Overdispersion.** Pure counting would be Poisson, but biological variation between replicates makes the variance far exceed the mean.
3. **Few replicates.** Three per condition is normal — nowhere near enough to estimate each gene's variance on its own.

So RNA-seq tools use the **negative binomial**: Poisson plus one dispersion parameter to absorb the excess.

$$
K_{ij} \sim \mathrm{NB}(\mu_{ij},\ \alpha_i)
$$

where $K_{ij}$ is the count for gene $i$ in sample $j$ and $\alpha_i$ is that gene's dispersion.

<figure>
<img src="/assets/fig/de-dispersion.svg" alt="Mean against variance for Poisson and negative binomial counts, and dispersion before and after shrinkage" loading="lazy" />
<figcaption><b>Why a negative binomial, and why shrinkage.</b> Simulated counts, three replicates; 4,000 genes in <b>(A)</b> and 900 in <b>(B)</b>. <b>(A)</b> Counts carrying nothing but counting noise (blue) scatter around the dashed variance = mean line; replicate-to-replicate variation (orange) lifts them far above it, and that gap is the overdispersion. <b>(B)</b> With n = 3 the per-gene dispersion estimate is almost unusable (grey). Pulling it onto the fitted mean&ndash;dispersion trend cuts its spread by about a third.</figcaption>
</figure>

## DESeq2

The standard for bulk. Two ideas account for most of why it works.

**Dispersion shrinkage.** With three replicates, a per-gene variance estimate is wildly unstable. DESeq2 first fits the overall mean–variance relationship across all genes, then pulls each gene's estimate toward that curve, so no single gene's noise runs away with the result.

**Log2 fold change shrinkage.** The fold change is the ratio of a gene's expression between the two conditions, reported as a log2. Low-expression genes produce exaggerated ones, because you are dividing by something near zero. Shrinking those too stops the top of the list filling up with barely expressed genes.

```r
library(DESeq2)
dds <- DESeqDataSetFromMatrix(counts, colData, design = ~ condition)
dds <- DESeq(dds)
res <- results(dds, contrast = c("condition", "treated", "control"))
```

> **The `design` formula is half the analysis.** If there is a batch effect, write `~ batch + condition`. Leave it out and the batch difference becomes your condition difference.

## PyDESeq2

A Python reimplementation of DESeq2 — the same negative binomial model, the same shrinkage, and results that agree closely.

```python
from pydeseq2.dds import DeseqDataSet
from pydeseq2.ds import DeseqStats
dds = DeseqDataSet(counts=counts, metadata=meta, design="~condition")
dds.deseq2()
res = DeseqStats(dds, contrast=["condition", "treated", "control"]).summary()
```

The reason to use it is simple: **the rest of your analysis is already in Python.** Handing single-cell work from Scanpy over to R just for the DE step is awkward and hurts reproducibility.

One caveat: PyDESeq2 **does not cover everything DESeq2 does.** Some complex designs and shrinkage options remain R-only, and numbers can differ slightly. For a paper, say which implementation you used.

## MAST

Built for single-cell, and its starting point is the **zero problem** from [the previous note](../bulk-vs-sc-en/): most entries in a single-cell count matrix are zero, some because the gene is off and some because it was simply not detected.

MAST models expression in two parts (a **hurdle model**):

1. **Is it expressed at all** — logistic regression on zero versus non-zero
2. **If expressed, how much** — Gaussian regression on the non-zero values

The two are tested jointly. It also includes the number of genes detected per cell (<u>the cellular detection rate, CDR</u>) as a covariate, which absorbs a good deal of technical variation.

```r
library(MAST)
sca <- FromMatrix(log2(tpm + 1), cData, fData)   # MAST expects log2(TPM+1), not raw counts
colData(sca)$cngeneson <- scale(colSums(assay(sca) > 0))   # CDR
zlm_fit <- zlm(~ condition + cngeneson, sca)
```

## But — the single-cell DE trap

MAST, Wilcoxon, and **every test that treats cells as independent samples** share one problem.

Squair et al. (2021) showed it systematically. Call 10,000 cells 10,000 samples and statistical power becomes absurd: <mark class="blue">**differences of no biological consequence come out at p < 10⁻¹⁰⁰.**</mark> But those cells came from the same animal, so they are not independent. The real unit of replication is the individual.

The authors showed that with the sample labels **shuffled**, existing tools still returned thousands of "significant" genes. That result is impossible.

**The answer is pseudobulk**: sum counts per sample per cell type, then test with DESeq2.

```python
# cell × gene  →  (sample × cell type) × gene
pb = adata.to_df().groupby([adata.obs.sample_id, adata.obs.cell_type]).sum()
```

Your replicate count drops from cells to samples. <mark>The numbers get less impressive — and that is **the amount of information you actually had.**</mark>

<figure>
<img src="/assets/fig/pseudobulk-fpr.svg" alt="False positive rate against cells per subject, for cell-level testing and for pseudobulk" loading="lazy" />
<figcaption><b>What treating cells as samples actually costs.</b> Simulated, with no real difference between the two conditions &mdash; every hit is a false positive. Six subjects per group, cells within a subject sharing an offset. Testing cells directly reaches 98% false positives at 5,000 cells each; pseudobulk stays near the 5% the test promises. More cells make the cell-level test <em>worse</em>, because they add confidence without adding evidence.</figcaption>
</figure>

## So what do you use

| situation | tool |
| --- | --- |
| bulk RNA-seq | DESeq2 (R) or PyDESeq2 (Python) |
| single-cell, comparing conditions, several samples | **pseudobulk + DESeq2** ← make this the default |
| single-cell, finding cluster markers | Wilcoxon (Scanpy `rank_genes_groups`) — exploratory |
| single-cell with a single sample | MAST or Wilcoxon, and be careful what you conclude |
| no replicates | do not draw a statistical conclusion |

That last row is the one that gets ignored: with one sample per condition, nothing separates the condition from the individual.

## Summary

- Counts call for a **negative binomial**, not a t-test
- DESeq2's power comes from shrinking dispersion and fold change toward the global trend
- PyDESeq2 is the Python reimplementation — not feature-identical, so state which you used
- MAST handles the zeros with a hurdle model and conditions on detection rate
- **Treating cells as samples floods you with false positives** — default to pseudobulk
- A `design` formula missing the batch turns batch into your result

## References

- Love, Huber & Anders, [Moderated estimation of fold change and dispersion for RNA-seq data with DESeq2](https://doi.org/10.1186/s13059-014-0550-8), *Genome Biol.* (2014)
- Finak et al., [MAST: a flexible statistical framework for assessing transcriptional changes and characterizing heterogeneity in single-cell RNA sequencing data](https://doi.org/10.1186/s13059-015-0844-5), *Genome Biol.* (2015)
- Squair et al., [Confronting false discoveries in single-cell differential expression](https://doi.org/10.1038/s41467-021-25960-2), *Nat. Commun.* (2021)
- Muzellec et al., [PyDESeq2](https://doi.org/10.1093/bioinformatics/btad547), *Bioinformatics* (2023)
