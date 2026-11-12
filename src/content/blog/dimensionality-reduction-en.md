---
title: "PCA, t-SNE and UMAP: what each one preserves"
date: 2026-05-29
description: "20,000 genes is not something you can look at · PCA keeps variance and distance, and is the only one you should compute on · t-SNE and UMAP keep neighbourhoods and throw away everything else · why cluster size and the gap between blobs mean nothing · where each one actually belongs in a pipeline"
category: concept
updated: 2026-06
lang: en
group: dimensionality-reduction
topic: Machine learning
subtopic: Basics
tags: [PCA, UMAP, t-SNE, dimensionality reduction]
---

A single-cell count matrix is about 20,000 genes wide. Most of those columns carry no signal for the question being asked: genes that are off everywhere, genes that are noise plus a mean, genes that differ only by sequencing depth. And even if every column mattered, **there is no way to look at 20,000 dimensions.** Dimensionality reduction solves two different problems with that one phrase — denoising for computation, and projecting to two axes for a figure — and most of the trouble in this area comes from using a tool built for the second job to do the first.

## PCA: the one you compute on

**PCA (principal component analysis)** finds orthogonal directions in the original space, ordered by how much variance each explains. The first **PC (principal component)** is the single direction along which cells differ most; the second is the direction of greatest remaining variance at right angles to the first, and so on.

Four properties follow from that definition:

- **Linear.** Each PC is a weighted sum of genes. The weights are the **loadings**, and you can read them — a PC whose top loadings are *HBB*, *HBA1*, *HBA2* is an erythrocyte axis, not an abstraction.
- **Deterministic.** Same input, same output, up to a sign flip on each axis. No seed.
- **Distances are meaningful.** The projection is a rotation plus a truncation, so distances in PC space approximate distances in the original space, globally as well as locally.
- **The explained-variance ratio tells you how many to keep.** Plot it and look for where it flattens; in practice 30–50 PCs is the standard range for single-cell data.

Two things decide whether PCA gives you anything. **Centring** is required — without it the first PC just points at the mean. **Scaling** is a real choice: scale each gene to unit variance and every gene gets an equal vote, including lowly expressed noisy ones; skip it and the highly expressed genes dominate. The usual compromise for expression data is to normalise, log-transform, select highly variable genes, then scale those with the extremes clipped.

<mark>PCA is run first, to about 50 PCs, in every single-cell pipeline — before t-SNE or UMAP, as the thing both of them are built on top of.</mark> It does two jobs there: it drops the directions that are mostly technical noise, and it takes the nearest-neighbour search from 20,000 dimensions to 50, which is the difference between tractable and not.

## t-SNE: local neighbourhoods and nothing else

**t-SNE (t-distributed stochastic neighbour embedding)** is non-linear and has a different goal. It converts distances into probabilities of being neighbours, then arranges points in two dimensions so that those neighbour probabilities match as closely as possible. There is no projection and no loadings, so nothing is interpretable the way a PCA component is.

The consequences matter more than the algorithm:

- It preserves **who is next to whom**, and deliberately sacrifices everything else.
- **Cluster sizes are not meaningful.** The embedding expands dense regions and compresses sparse ones, so a tight cell type can occupy a large blob.
- **Distances between clusters are not meaningful.** Two blobs drawn far apart may be adjacent in the data.
- **Perplexity** is the main knob: roughly how many neighbours each point is assumed to have. Small values fragment the picture, large values merge it.
- It is **stochastic**. A different seed gives a visibly different layout from the same data.

## The fast t-SNE implementations

`sklearn.manifold.TSNE` is the implementation most people reach for and the reason t-SNE has a reputation for being too slow to bother with. It is a Barnes–Hut approximation, and on a few hundred thousand cells it takes long enough that you stop re-running it — so the layout gets computed once and its seed-dependence never gets checked.

The fast implementations replace the Barnes–Hut step with interpolation on an **FFT (fast Fourier transform)** grid, which turns the per-iteration cost from $O(n \log n)$ into roughly $O(n)$. On a million cells that is minutes rather than hours, and nothing about the result changes — same objective, same caveats, same unreadable distances.

| | what it is | note |
| --- | --- | --- |
| `sklearn.manifold.TSNE` | Barnes–Hut | the default, and the slow one |
| openTSNE | FFT-accelerated, pip-installable with no external build | the one to use — and it can `transform()` new points into an existing embedding |
| FIt-SNE | the original FFT implementation, C++ | comparable speed; openTSNE wraps the same idea more conveniently |

```python
from openTSNE import TSNE

emb = TSNE(perplexity=30, n_jobs=-1, random_state=0).fit(X_pca)   # fit on the 50 PCs
emb_new = emb.transform(X_pca_new)                                # place new cells, no refit
```

`transform()` is the one thing t-SNE was always said not to do, and it makes a reference embedding you can project a new sample onto — the same move UMAP users get from `umap.transform`. It is still a local-structure drawing, so everything in the warnings below applies to the projected points too.

## UMAP: faster, same caveat

**UMAP (uniform manifold approximation and projection)** optimises a similar local objective with a different loss and a much cheaper neighbour graph, so it scales to millions of cells and has replaced t-SNE as the single-cell default. Its two knobs are `n_neighbors`, which trades local detail against broader structure, and `min_dist`, which controls how tightly points are allowed to pack — `min_dist` is purely cosmetic and changes nothing about the underlying graph.

UMAP is often said to preserve global structure better than t-SNE. **That claim is contested.** Chari and Pachter show that two-dimensional embeddings of this kind distort neighbour relationships so severely that the preserved fraction is small, and that the same data supports visually very different and equally "valid" layouts. The safe position is that UMAP's global arrangement is a little more stable than t-SNE's and still not something to build an argument on.

## Side by side

| | PCA | t-SNE | UMAP |
| --- | --- | --- | --- |
| linear | yes | no | no |
| deterministic | yes | no | no |
| distances meaningful | yes | no | no |
| global structure | preserved | lost | partly, contested |
| main knob | number of PCs | perplexity | `n_neighbors`, `min_dist` |
| what it is for | computing — denoising, neighbour graphs, regression inputs | looking at local structure | looking — the figure |

<figure>
<img src="/assets/fig/dimred-digits.svg" alt="PCA, t-SNE and UMAP of the handwritten digits dataset, with a bar panel scoring what each one preserves" loading="lazy" />
<figcaption><b>The ten digits stay ten groups in all three; where those groups sit does not.</b> Digit 0 sits at the bottom in PCA, at the bottom centre in t-SNE and far off to the right in UMAP, and the gaps between groups move with it. The fourth panel scores each embedding against the original 64 dimensions: PCA keeps the most of the pairwise distances (&rho; = 0.58, against 0.51 and 0.36), while t-SNE and UMAP keep far more of each point&rsquo;s neighbourhood (trustworthiness 0.99 and 0.98, against 0.83). Two PCs also lose the digit itself &mdash; 61% of points get the right label from a 10-NN vote, against 97% for the other two &mdash; which is why a pipeline computes on 50 PCs and never on two.</figcaption>
</figure>

## What you cannot read off an embedding

1. **Cluster separation on a UMAP is not evidence that clusters exist.** The clustering was done on the neighbour graph in PC space, and the embedding is a separate, lossy drawing of that same graph. Two clusters that overlap on the UMAP can be cleanly separated in 50 dimensions, and two that look separated can be one group that the layout happened to split. The embedding is where you *look* at a result, never where you obtain one.
2. **The gap between two blobs means nothing.** Not their distance, not their relative sizes, not which blob sits between two others. Only membership and immediate adjacency carry information, and adjacency only weakly.
3. **Change the seed or `n_neighbors` and the picture changes.** So any sentence that depends on the layout — "population A sits between B and C", "these two states form a continuum" — is a statement about the embedding, not the biology. Check it in PC space, or with a trajectory method, or not at all.
4. **t-SNE and UMAP are for looking; PCA is for computing.** Clustering, differential expression, trajectory inference, nearest-neighbour label transfer, batch correction: all of these run on PCs or on a corrected latent space — the low-dimensional coordinates a model learns, in the same role the PCs play — never on the two UMAP coordinates. Running k-means on UMAP coordinates is the usual version of this mistake.
5. **Batch effects look exactly like biology.** The most visually striking separation in an uncorrected embedding is usually the sample or the chemistry version. Before interpreting any split, colour the same embedding by batch, and then by the obvious technical covariates — detected genes, mitochondrial fraction, cell-cycle score.

<mark class="blue">A UMAP can show you that a result is implausible; it cannot show you that one is true.</mark>

## Where each belongs in a pipeline

The order is fixed, and only the last step is cosmetic:

**normalise and select genes → scale → PCA to ~50 PCs → kNN (k-nearest-neighbour) graph on the PCs → [Leiden clustering](../clustering-en/) → UMAP, for the figure only.**

```python
import scanpy as sc

adata = sc.datasets.pbmc3k()
sc.pp.filter_genes(adata, min_cells=3)
sc.pp.normalize_total(adata, target_sum=1e4)
sc.pp.log1p(adata)
sc.pp.highly_variable_genes(adata, n_top_genes=2000)
adata = adata[:, adata.var.highly_variable].copy()

sc.pp.scale(adata, max_value=10)            # centre and scale: PCA needs it
sc.tl.pca(adata, n_comps=50)                # 1. denoise, 20,000 dims -> 50

# how many PCs are worth keeping: look at where this flattens
sc.pl.pca_variance_ratio(adata, n_pcs=50)

sc.pp.neighbors(adata, n_neighbors=15, n_pcs=50)   # 2. graph in PC space
sc.tl.leiden(adata, resolution=1.0, flavor="igraph", n_iterations=2)  # 3. clusters
sc.tl.umap(adata, min_dist=0.5)             # 4. coordinates for the figure
```

`sc.tl.leiden` reads the graph built in step 2, so running it before or after `sc.tl.umap` gives identical labels. The UMAP is downstream of everything it appears to explain.

The same split applies to bulk data, where there is no UMAP step at all — a PCA of samples is the standard first look, and [bulk and single-cell differ](../bulk-vs-sc-en/) mainly in whether that PCA is over samples or over cells.

## PCA on molecules

The same decomposition shows up in cheminformatics, applied to a matrix of [descriptors](../descriptors-fingerprints-en/) over compounds. It is useful for the same reasons — descriptors are heavily correlated, and PCA collapses that redundancy before a regression or a similarity calculation.

The interpretation differs in one predictable way. Because most descriptor sets contain many quantities that grow with molecular size — heavy-atom count, ring count, surface area, polarisability — **the leading PCs of a descriptor matrix are usually just size.** PC1 correlates with molecular weight at *r* above 0.9 in most sets I have looked at. So a "chemical space" plot is not a map of chemistry on its first axis: that axis is often a scale axis, and the chemically interesting variation starts a few components in.

## Summary

- The problem is real: most of 20,000 gene dimensions are noise, and no one can look at 20,000 axes
- **PCA** is linear, deterministic and interpretable through its loadings; distances and global structure survive, and the explained-variance ratio tells you how many PCs to keep
- Centre before PCA always; scaling is a choice between giving every gene an equal vote and letting the loud ones dominate
- PCA to ~50 PCs comes **first** in every single-cell pipeline — it denoises and makes the neighbour search tractable
- **t-SNE** and **UMAP** preserve local neighbourhoods and discard cluster size and between-cluster distance; both are stochastic, so the picture changes with the seed
- UMAP's claimed advantage in global structure is **contested** — treat its layout as a drawing, not a measurement
- **Never make a claim that depends on the layout.** Cluster in PC space, look in two dimensions
- Uncorrected batch effects produce the most convincing separation in any embedding
- In cheminformatics the leading PCs of a descriptor matrix are usually molecular size

## References

- van der Maaten & Hinton, [Visualizing data using t-SNE](https://www.jmlr.org/papers/v9/vandermaaten08a.html), *JMLR* (2008)
- Linderman et al., [Fast interpolation-based t-SNE for improved visualization of single-cell RNA-seq data](https://doi.org/10.1038/s41592-018-0308-4), *Nat. Methods* **16**, 243–245 (2019) — FIt-SNE
- Poličar, Stražar & Zupan, [openTSNE: a modular Python library for t-SNE dimensionality reduction and embedding](https://doi.org/10.18637/jss.v109.i03), *J. Stat. Softw.* **109**(3) (2024)
- McInnes, Healy & Melville, [UMAP: uniform manifold approximation and projection for dimension reduction](https://arxiv.org/abs/1802.03426), *arXiv* (2018)
- Chari & Pachter, [The specious art of single-cell genomics](https://doi.org/10.1371/journal.pcbi.1011288), *PLoS Comput. Biol.* (2023) — the case against reading two-dimensional embeddings
