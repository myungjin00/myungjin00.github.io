---
title: "Bulk and single-cell RNA-seq"
date: 2025-11-21
description: "Measuring an average versus measuring one cell at a time · how dropout and sparsity change the analysis · when bulk is still the right choice · why pseudobulk brings the average back"
category: concept
updated: 2025-12
lang: en
group: bulk-sc
topic: Bioinformatics
subtopic: Transcriptomics
tags: [RNA-seq, single-cell, transcriptomics]
---

A tissue is a mixture of cell types, and an RNA-seq experiment can either average over that mixture or measure one cell at a time. Which of the two you ran decides what questions the data can answer, and almost every step after it — normalisation, clustering, the statistics — differs between them.

## What each measures

Both measure the transcriptome — which genes are expressed and how much. The difference is **what one measurement covers**.

| | bulk RNA-seq | single-cell RNA-seq |
| --- | --- | --- |
| unit of measurement | a piece of tissue | one cell |
| what you get | an average over 10⁴–10⁶ cells | one profile per cell, thousands to millions |
| reads per gene | many (hundreds to thousands) | few (0 to tens) |
| proportion of zeros | low | very high, 80–95% |
| cost | cheap | expensive |
| what it can tell you | how the tissue changed | which cells changed |

That last row is the whole point. <mark class="blue">If a gene doubles in bulk, two stories fit equally well: every cell went up a little, or a few cells went up a lot.</mark> Bulk cannot separate them.

Say an inflammatory gene rises in liver tissue ([what the liver is made of](../liver-cells-en/) covers which cells those are). Every hepatocyte becoming slightly inflamed and the Kupffer cells alone becoming strongly activated are different biology — and identical in bulk.

## What all those zeros mean

In single-cell data, 80–95% of the matrix is zero, and two different things are mixed together:

- **Biological zeros** — the cell genuinely is not expressing that gene
- **Technical zeros (dropout)** — it is, but the transcript was not captured. One cell holds so little mRNA that misses are routine

Nothing distinguishes them, and that single fact generates most of the difficulty in single-cell analysis. It is why normalisation, dimensionality reduction and [differential expression](../de-tools-en/) all work differently here than in bulk.

## Where the pipelines diverge

**Bulk** is comparatively simple:

```
reads → align/quantify → gene × sample matrix → normalise → DEGs (differentially expressed genes) → enrichment
```

There are usually tens of samples, each belonging to a condition. The statistics are well-posed.

<figure class="narrow">
<img src="/assets/fig/scrnaseq-workflow-haque2017.png" alt="Nine-step single-cell RNA-seq workflow from cell isolation to interpretation" loading="lazy"  width="567" height="799" />
<figcaption>The full single-cell RNA-seq path: cell isolation (1), library construction (2&ndash;7), quality control (8), interpretation (9). Steps 1&ndash;7 have no bulk counterpart, and every bit of <em>dropout</em> is produced there, by starting from the mRNA of a single cell.
<br><span class="credit">Haque et al., <a href="https://doi.org/10.1186/s13073-017-0467-4"><em>Genome Med.</em> <b>9</b>, 75 (2017)</a> &#183; paper figure, Figure 1</span></figcaption>
</figure>

**Single-cell** has an extra stage:

```
reads → cell × gene matrix → QC → normalise → reduce → cluster
      → annotate cell types → only then compare
```

That **clustering and annotation come first** is the decisive difference. Until you know what the cells are, there is nothing defined to compare. And that stage is [unsupervised](../learning-paradigms-en/) — there is no ground truth. <mark>Change the resolution parameter and the number of clusters changes, and so do the conclusions that follow.</mark>

## When bulk is still right

Single-cell is not automatically better.

| situation | choice |
| --- | --- |
| the response of the tissue as a whole | bulk — cheap and statistically solid |
| you need many samples (a patient cohort) | bulk |
| whether cell-type composition shifts | single-cell |
| a rare population | single-cell |
| continuous change in cell state (differentiation, senescence) | single-cell |
| a tight budget | bulk |

For aging liver, "are there more senescent cells" requires single-cell. But "did this treatment change lipid metabolism" is answerable in bulk — and bulk lets you afford more samples, which is often worth more.

## Pseudobulk — the average returns

**Collapsing single-cell data back into something bulk-like** has become standard practice.

<mark>If you treat each cell as an independent sample, tens of thousands of cells all count as samples and p-values become absurdly small.</mark> But those cells are not independent — they came from the same animal, the same dish. The real unit of replication is **the sample, not the cell.**

So <u>pseudobulk</u> sums expression per sample per cell type, then runs a bulk tool on the result.

```
cell × gene  →  (sample × cell type) × gene  →  DESeq2
```

Squair et al. (2021) demonstrated this systematically: cell-level tests generate false positives at scale, and pseudobulk is far more honest. [The next note](../de-tools-en/) goes into the tools.

And when the samples come from more than one study, what separates them may be the study rather than the biology — [batch effects](../batch-effects-en/) are the next thing in the way.

## Summary

- Bulk measures the tissue average; single-cell measures one cell at a time
- Bulk cannot separate "everything a little" from "a few cells a lot"
- Single-cell is 80–95% zeros, and biological zeros are indistinguishable from dropout
- Single-cell requires **clustering and annotation first**, so unsupervised choices drive the conclusions
- For tissue-level responses and large cohorts, bulk is still the better instrument
- Treating cells as independent samples breaks the statistics — **pseudobulk** returns to the sample as the unit

## References

- Luecken & Theis, [Current best practices in single-cell RNA-seq analysis: a tutorial](https://doi.org/10.15252/msb.20188746), *Mol. Syst. Biol.* (2019)
- Squair et al., [Confronting false discoveries in single-cell differential expression](https://doi.org/10.1038/s41467-021-25960-2), *Nat. Commun.* (2021)
- Heumos et al., [Best practices for single-cell analysis across modalities](https://doi.org/10.1038/s41576-023-00586-w), *Nat. Rev. Genet.* (2023)
- Haque et al., [A practical guide to single-cell RNA-sequencing for biomedical research and clinical applications](https://doi.org/10.1186/s13073-017-0467-4), *Genome Med.* (2017)
