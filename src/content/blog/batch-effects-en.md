---
title: "Batch effects, and what integration actually removes"
date: 2025-12-12
description: "Where a batch effect comes from · why a shift is not noise · spotting it before correcting it · what ComBat, Harmony, Seurat anchors, scVI and fastMNN each return · why a corrected embedding is not corrected counts · over-correction, and why a mixing score alone is not success"
category: concept
updated: 2026-01
lang: en
group: batch-effects
topic: Bioinformatics
subtopic: Transcriptomics
tags: [batch effects, data integration, scRNA-seq, Harmony]
---

Most of my work is pulling public bulk and scRNA-seq (single-cell RNA sequencing) series out of GEO (Gene Expression Omnibus) and stacking them into one resource for aging-related [MASLD (metabolic dysfunction-associated steatotic liver disease)](../masld-staging-en/). None of those datasets was collected with the others in mind. So the question is never whether there is a batch effect — there is — but what a correction does to the data, and which later steps are allowed to use its output.

## What a batch effect is

A batch effect is systematic variation that tracks **when, where and how** a sample was processed rather than what the sample is. It is reproducible: run the same material through the same two pipelines and you get the same offset again.

The sources, roughly in the order they cause me trouble:

- **Different labs entirely.** In public data this is by far the biggest one, and it is not one variable — it is every variable below, all different at once, with no record of which.
- **Library prep kit chemistry.** 10x Genomics v2 and v3 differ in capture efficiency, so the same cell type comes back with a different number of detected genes and a different fraction of zeros.
- **Dissociation protocol.** Enzyme, temperature and how long the tissue sat in it. Dissociation induces stress-response genes, and warm protocols induce more of them — so the "activation signature" can belong to the protocol.
- **Sequencing run.** Flow cell, instrument, kit lot, depth.
- **Tissue handling time.** Minutes between resection and freezing; for liver, ischaemia time shows up in metabolic genes.
- **Operator.** Pipetting, timing, judgement calls at every step that has one.
- **Pipeline and annotation version.** Two reference annotations do not have the same gene set, so the batch effect ends up in which genes exist at all — [the GEO-to-counts note](../geo-fastq-en/) has more on that.

## Why it is not just noise

Noise and batch are not the same shape of problem. Noise is symmetric and averages out: add replicates and the group mean converges. A batch effect is a **shift** — it moves a whole group of samples in one direction, so adding samples from that batch makes the shift better estimated, not smaller.

The worse property is that the shift is often **confounded with the biology** you care about. The decisive case is concrete: suppose every MASLD sample in my collection came from one study and every control from another. Then "study" and "disease" are the same column of the design matrix, and every differential gene is explained equally well by either.

That is a design problem, not an analysis problem. `ComBat`, Harmony and scVI will each return a tidy result from it anyway, and [which designs are repairable](../experimental-design-en/) is a separate note — this one assumes you checked and the answer was yes.

## Spotting it before correcting it

Look before you reach for a method. Two plots cover most of it: a [PCA (principal component analysis)](../dimensionality-reduction-en/) coloured by batch, and a [clustering](../clustering-en/) run on the uncorrected data with clusters cross-tabulated against sample.

| what you see | what it usually means |
| --- | --- |
| PC (principal component) 1 or 2 separates studies, not conditions | batch accounts for more total variance than the biology |
| clusters map almost one-to-one onto samples | you clustered the batches |
| every cell type appears once per study rather than once | a shift large enough to split real populations |
| a cluster present in exactly one dataset | either a population only that study sampled, or an artefact — this plot cannot tell you which |
| detected genes per cell differ several-fold between datasets | chemistry or depth, not biology |
| batch separates on the UMAP (uniform manifold approximation and projection) but the neighbour graph mixes | often cosmetic; check the graph before correcting |

The cross-tabulation of cluster against sample is the cheapest diagnostic I know, and it is the one most often skipped.

## The methods, and what each returns

| method | what it does | what it returns | what the output may be used for |
| --- | --- | --- | --- |
| **ComBat** / limma `removeBatchEffect` | per-gene linear model; shifts each batch's mean — and for ComBat its variance — towards a pooled estimate, with empirical Bayes shrinkage across genes | a **corrected expression matrix** | bulk visualisation, clustering, correlation. Not as input to a test |
| **Harmony** | iterates between soft clustering in PC space and correcting each cell by a cluster-specific, batch-specific offset | **corrected embeddings, not a corrected count matrix** | neighbour graph, clustering, UMAP |
| **Seurat CCA (canonical correlation analysis) / RPCA (reciprocal PCA) anchors** | projects datasets into a shared space, finds mutual nearest-neighbour cell pairs across them as **anchors**, and derives a correction from those pairs | an integrated assay plus the anchor set | clustering, visualisation, label transfer |
| **scVI (single-cell variational inference) / scANVI** | a VAE (variational autoencoder) with batch as an explicit covariate on the decoder, so the encoder has to describe the cell without it | a **latent space**, and optionally denoised expression | clustering, visualisation; scANVI also transfers cell-type labels |
| **MNN (mutual nearest neighbours) / fastMNN** | treats each pair of cells that are mutual nearest neighbours across two batches as the same biological state, then averages those difference vectors into a correction | corrected low-dimensional coordinates (fastMNN), or a corrected matrix (original `mnnCorrect`) | clustering, visualisation |

Those rows differ in one way that matters more than the algorithms do.

<mark class="blue">Most single-cell integration methods correct the embedding, not the counts — so clustering and visualisation use corrected values, while DE (differential expression) goes back to the raw counts with batch as a covariate in the model.</mark>

That mistake is extremely common, and it is easy to make by accident, because Harmony writes a new representation next to the old one and everything downstream still runs:

```python
import scanpy as sc
import scanpy.external as sce

sc.pp.pca(adata)
sce.pp.harmony_integrate(adata, key='batch')   # adds adata.obsm['X_pca_harmony']
sc.pp.neighbors(adata, use_rep='X_pca_harmony')
sc.tl.leiden(adata)
```

`adata.X` is untouched here, which is correct — the counts are what the [DE tools](../de-tools-en/) need. The failure is the other direction: feed a batch-corrected matrix to a test and the significance comes back inflated. Batch belongs in the model, not in a pre-cleaning step.

## Over-correction

Residual batch effect is the risk everyone worries about. Over-correction is the one that has cost me more.

Integration's objective is to make batches overlap. If one study sampled a population nobody else did — a rare immune subset, a fibrotic state present only in an advanced-disease cohort, a cell type another lab's dissociation destroyed — then "make the batches overlap" and "delete that population" are the same instruction, and the method cannot distinguish them. The same applies to a genuine disease effect when disease and study are even partially aligned: some of the biology goes out with the batch, quietly.

This is why integration benchmarking reports two numbers rather than one. kBET (k-nearest-neighbour batch effect test) and LISI (local inverse Simpson's index) measure how well batches mix in a neighbourhood; separate metrics ask whether known cell-type labels, rare populations and trajectories survived. Luecken et al. (2022) built the scIB (single-cell integration benchmarking) suite around exactly this split, scoring batch correction and biological conservation as separate aggregates before combining them — and methods that win on one axis routinely lose on the other.

<mark>A high mixing score on its own is not success: perfect mixing is what you get by deleting the biology.</mark>

In practice I decide by stronger evidence than a score — whether a cell type I can name is still separable afterwards, and whether the integrated clusters still have the markers they had before.

## In practice

- **Record batch metadata before you need it.** One column per sample for study, run, kit chemistry, dissociation protocol, operator and date. Reconstructing this after the fact means re-reading GEO records, and some of it is simply not recorded.
- **Never correct before looking.** If you have not seen the batch effect, you cannot tell whether the correction helped or how much it took with it.
- **Keep the uncorrected object.** Corrected values are for the neighbour graph and the figures. Every comparison and every gene-level number comes from the original counts, so both have to stay in reach.
- **Put batch in the design matrix**, `~ batch + condition`, rather than testing a corrected matrix.
- **Check a known marker still separates.** For liver, [hepatocytes against immune cells](../liver-cells-en/) is the sanity check: if those two no longer separate after integration, the correction was too strong, whatever the mixing score says.
- **Try the weakest method that works.** If batch is a nuisance covariate in a balanced bulk design, a term in the model beats correcting the matrix. Reach for a deep model when the datasets genuinely need a shared latent space.

## Summary

- A batch effect tracks **when, where and how** a sample was processed — run, kit chemistry, dissociation, operator, handling time, and in public data the different lab behind all of them
- It is a **shift**, not noise: more samples from a batch estimate the shift better, they do not shrink it
- Confounded with the biology, it is a **design problem** and correction cannot rescue it, though every tool will still return a result
- Diagnose first: PCA coloured by batch, and clusters cross-tabulated against sample
- **Most single-cell methods correct the embedding, not the counts** — cluster and plot on corrected values, test on raw counts with `~ batch + condition`
- **Over-correction deletes real biology**, including a population only one study sampled
- Mixing metrics and biological-conservation metrics trade off; a mixing score alone proves nothing
- Keep the uncorrected object, and check a known marker still separates after integration

## References

- Haghverdi et al., [Batch effects in single-cell RNA-sequencing data are corrected by matching mutual nearest neighbors](https://doi.org/10.1038/nbt.4091), *Nat. Biotechnol.* (2018) — the MNN idea the anchor-based methods build on
- Korsunsky et al., [Fast, sensitive and accurate integration of single-cell data with Harmony](https://doi.org/10.1038/s41592-019-0619-0), *Nat. Methods* (2019) — iterative correction in PC space, returning embeddings
- Lopez et al., [Deep generative modeling for single-cell transcriptomics](https://doi.org/10.1038/s41592-018-0229-2), *Nat. Methods* (2018) — scVI, batch as a covariate in a VAE
- Luecken et al., [Benchmarking atlas-level data integration in single-cell genomics](https://doi.org/10.1038/s41592-021-01336-8), *Nat. Methods* (2022) — mixing against biological conservation, scored separately
