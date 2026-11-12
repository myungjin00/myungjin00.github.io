---
title: "R and Python: which, when"
date: 2026-03-20
description: "Statistics and bioinformatics in R, machine learning and pipelines in Python · how Seurat and Scanpy differ · moving between them inside one analysis · what switching languages actually costs"
category: tutorial
updated: 2026-04
lang: en
group: r-python
topic: Bioinformatics
subtopic: Transcriptomics
tags: [R, Python, Seurat, Scanpy]
---

"Which is better" has no answer. In bioinformatics the two have different ecosystems, and the choice is usually settled by **where the thing you need already lives.**

## What lives where

| what you are doing | where it is |
| --- | --- |
| differential expression, statistical models | **R** — DESeq2, edgeR, limma |
| annotation and reference data | **R** — Bioconductor, 2,000+ packages |
| statistical graphics | **R** — ggplot2 |
| single-cell analysis | **both** — Seurat (R) / Scanpy (Python) |
| machine learning, deep learning | **Python** — scikit-learn, PyTorch |
| cheminformatics | **Python** — RDKit |
| pipelines and automation | **Python** |
| very large data | **Python** (or R's data.table) |

The line is clear. <mark class="blue">Statistics and bioinformatics resources accumulated in R; machine learning and general programming belong to Python.</mark>

That is also why molecular work drifts toward Python — RDKit, PyTorch Geometric and DeepChem are all Python. And in the other direction, it is hard to justify not using DESeq2 for RNA-seq.

## Seurat and Scanpy

Single-cell is almost the only place where the two overlap head-on.

| | Seurat (R) | Scanpy (Python) |
| --- | --- | --- |
| data structure | a `Seurat` object | `AnnData` |
| style | each step returns an object | the object is modified in place |
| plots | ggplot2-based, easy to adjust | matplotlib-based |
| large data | held in memory | can leave the matrix on disk (`backed` mode) |
| batch integration | Seurat anchors, Harmony | Harmony, scVI, BBKNN |
| ecosystem | connects naturally to Bioconductor | connects naturally to deep learning |

The standard single-cell pipeline — normalise, keep the variable genes, PCA (principal component analysis), build a neighbour graph, cluster — reads almost the same on both sides:

```r
# Seurat
obj <- NormalizeData(obj) |> FindVariableFeatures() |> ScaleData() |> RunPCA()
obj <- FindNeighbors(obj, dims = 1:30) |> FindClusters(resolution = 0.5)
```

```python
# Scanpy — the same sequence
sc.pp.normalize_total(ad); sc.pp.log1p(ad)
sc.pp.highly_variable_genes(ad); sc.pp.pca(ad)
sc.pp.neighbors(ad, n_pcs=30); sc.tl.leiden(ad, resolution=0.5)
```

## What is actually inside the object

Both objects hold the same thing under different names. Printing an `AnnData`:

```python
import anndata as ad
adata = ad.read_h5ad("pbmc.h5ad")
print(adata)
```

```
AnnData object with n_obs × n_vars = 2700 × 1838
    obs: 'sample_id', 'cell_type', 'n_genes'
    var: 'gene_ids'
    obsm: 'X_pca'
    layers: 'counts'
```

**Rows are cells, columns are genes**, and everything else is annotation hanging off those two axes.

| Slot | Shape | What it holds |
| --- | --- | --- |
| `.X` | 2700 × 1838 | the expression matrix (usually normalised) |
| `.layers["counts"]` | 2700 × 1838 | another version of the same matrix — raw counts |
| `.obs` | 2700 × 3 | per-cell metadata (`sample_id`, `cell_type`, …) |
| `.var` | 1838 × 1 | per-gene metadata |
| `.obsm["X_pca"]` | 2700 × 50 | a vector per cell — PCA, UMAP (uniform manifold approximation and projection) |
| `.uns` | dict | everything else (palettes, recorded parameters) |

```python
>>> adata.obs.head(3)
       sample_id cell_type  n_genes
cell_0    ctrl_2    B cell      633
cell_1      tx_1        NK      614
cell_2      tx_1        NK      585
```

The useful part is that `.obs` is a plain `DataFrame`, so pandas habits transfer directly. Slicing with `adata[adata.obs.cell_type == "T cell"]` carries the matrix, the metadata and the embeddings along together.

A Seurat object stores the same content with different names:

| Seurat | AnnData | Note |
| --- | --- | --- |
| `pbmc[["RNA"]]$counts` | `.layers["counts"]` | Seurat is **genes × cells** — transposed |
| `pbmc[["RNA"]]$data` | `.X` | normalised values |
| `pbmc@meta.data` | `.obs` | a data.frame on both sides |
| `Embeddings(pbmc, "pca")` | `.obsm["X_pca"]` | |
| `Idents(pbmc)` | `.obs["leiden"]` | the active cluster label |
| multiple assays | `.obsm` / `MuData` | multi-modal, e.g. RNA + ADT (antibody-derived tags) |

> The orientation is the usual trap: Seurat is genes × cells, AnnData is cells × genes. Conversion tools handle it, but when pulling a matrix out by hand, print `dim()` once rather than assume.

The steps are effectively identical. <mark>The results are not quite, because defaults and implementation details differ — which is why you should not mix results from both inside one paper.</mark>

<figure>
<img src="/assets/fig/seurat-anndata.svg" alt="A slot-by-slot mapping between a Seurat object and an AnnData object" loading="lazy" />
<figcaption><b>The same experiment, two objects.</b> Slot for slot, they hold the same thing under different names. The orientation is the trap: Seurat stores genes &times; cells, AnnData stores cells &times; genes.</figcaption>
</figure>

## Moving between them

Real analyses do not stay on one side. Clustering in Scanpy and testing with DESeq2 is routine. Three ways to do it:

**1. Exchange files (most robust)**

```python
adata.write_h5ad("data.h5ad")
# R: zellkonverter::readH5AD("data.h5ad")
```

Each language runs in its own environment, so nothing conflicts. The intermediate file is an asset for reproducibility rather than clutter.

**2. Call across in one session**

```r
library(reticulate)
sc <- import("scanpy")
```

R can call Python and Python can call R (`rpy2`). Convenient, but **environments tangle easily** — especially mixed with conda, where debugging is unpleasant.

**3. Use a reimplementation**

Where one exists, like PyDESeq2, you never cross languages. But as [the previous note](../de-tools-en/) said, it is not feature-identical.

> The longer a pipeline gets, the safer the first option is: every intermediate file says plainly which stage produced it.

## What switching costs

When "let's just move everything to Python" comes up, the real price is:

- **Giving up tools that exist only in R.** Bioconductor annotation resources and certain statistical models often have no equivalent.
- **Breaking reproducibility.** Old analyses stop running.
- **Taking on validation.** You now have to show the reimplementation agrees with the original.

What you gain is **pipeline integration**: preprocessing, model and evaluation in one language makes automation and reproduction far easier.

Both are real. The workable compromise is to **decide per analysis, and not mix within one.**

## Summary

- R for **statistics and bioinformatics**, Python for **machine learning and pipelines** — the ecosystems decide
- Seurat and Scanpy overlap on single-cell, but results differ slightly, so **do not mix them**
- Exchanging an `h5ad` file is the most robust way across
- `reticulate` and `rpy2` are convenient and invite environment problems
- Standardising costs you **tools and reproducibility**, and buys you **pipeline integration**

## References

- [Scanpy docs](https://scanpy.readthedocs.io/) · [Seurat docs](https://satijalab.org/seurat/)
- [zellkonverter](https://bioconductor.org/packages/zellkonverter/) — `AnnData` ↔ `SingleCellExperiment`
- [reticulate](https://rstudio.github.io/reticulate/) · [rpy2](https://rpy2.github.io/)
- Heumos et al., [Best practices for single-cell analysis across modalities](https://doi.org/10.1038/s41576-023-00586-w), *Nat. Rev. Genet.* (2023)
