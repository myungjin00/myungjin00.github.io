---
title: "Clustering"
date: 2024-12-13
description: "Grouping without labels · k-means, hierarchical, DBSCAN and Leiden, and what each assumes about shape · choosing k when there is no right answer · why the resolution parameter decides your conclusions · how to tell a real cluster from a drawn one"
category: concept
updated: 2025-01
lang: en
group: clustering
topic: Machine learning
subtopic: Basics
tags: [clustering, unsupervised, single-cell]
---

**Machine learning** · [#1 Machine learning and deep learning](../ml-and-dl-en/) · [#2 Supervised, unsupervised, self-supervised](../learning-paradigms-en/) · #3 Clustering · [#4 Transfer learning](../transfer-learning-en/)

Clustering splits data into groups without being told what the groups are. It is the [unsupervised](../learning-paradigms-en/) method whose output is easiest to over-read, because <mark class="blue">every algorithm will return clusters whether or not any exist.</mark>

## Four algorithms, four assumptions

Choosing between them is mostly choosing what shape you are willing to assume a cluster has, and that assumption is what decides the answer.

<figure>
<img src="/assets/fig/clustering.svg" alt="k-means, hierarchical and DBSCAN on blobs, k-means and DBSCAN on moons, and a silhouette curve" loading="lazy" />
<figcaption><b>The same data, different assumptions.</b> Top row: on round, well-separated blobs all three agree. Bottom row: on two interleaved crescents, <b>k-means fails</b> — it can only cut space with straight boundaries, so it slices both crescents in half — while DBSCAN (density-based spatial clustering of applications with noise) recovers them, because it follows density rather than distance to a centre. Run with scikit-learn.</figcaption>
</figure>

| Algorithm | What it assumes | Needs | Weakness |
| --- | --- | --- | --- |
| k-means | round, similar-sized groups | `k` up front | fails on anything non-convex; every point gets a label |
| hierarchical | a nesting, cut at some height | a linkage and a cut | O(n²) memory; the dendrogram tempts over-reading |
| DBSCAN / HDBSCAN | clusters are dense regions | a density scale | one `eps` for the whole dataset |
| Leiden / Louvain | clusters are communities in a kNN (k-nearest-neighbour) graph | a resolution | resolution is arbitrary; this is the single-cell default |

The last row is the one that matters in practice for transcriptomics. Scanpy and Seurat both build a kNN graph over cells and then run community detection on it, which is why neither asks you for `k` — and why both ask you for something worse.

## There is no right k

<figure>
<img src="/assets/fig/clustering-k.svg" alt="The same points clustered into 2, 4, 7 and 11 groups" loading="lazy" />
<figcaption><b>The same 420 points, four answers.</b> Nothing in the data says which of these is correct. Silhouette picks k = 4 here because the data was generated with four centres — on real data the curve is usually flat and the choice is yours.</figcaption>
</figure>

The standard aids all measure the same kind of thing — how tight groups are relative to how far apart they are — and none of them is a test:

- **silhouette** — per point, how much closer it is to its own cluster than to the next one. Ranges −1 to 1; above about 0.5 is a clear structure.
- **elbow on inertia** — where adding another cluster stops helping much. Reads as a judgement call because it is one.
- **gap statistic** — compares the inertia to what random data of the same shape would give. The closest thing here to a null.

For single-cell the dial is **resolution**, not `k`, and it behaves the same way: raise it and clusters split, lower it and they merge. <mark>There is no value that is correct, so the honest move is to report the one you used and show that the conclusion survives a couple of neighbouring values.</mark>

## Before you cluster

Most clustering problems are not clustering problems.

1. **Scale the features.** k-means and kNN graphs use distance, so a variable with a larger range dominates. For expression this means normalise, log-transform, and select variable genes first.
2. **Reduce dimensions first.** Distances become meaningless in thousands of dimensions. The standard single-cell path is PCA (principal component analysis) to ~50 components, then build the neighbour graph on those.
3. **Remove the batch effect first.** Otherwise the first and clearest clusters you find are your batches, and they will look biological.
4. **Decide what a cluster is supposed to be.** A cell type, a cell state, a doublet (two cells captured as one) and a dying cell all form clusters, and only one of them is usually what you wanted.

## Checking whether a cluster is real

> A UMAP (uniform manifold approximation and projection) with coloured blobs is a persuasive figure that concludes nothing. <mark>Distance between clusters on a UMAP means nothing</mark> — only membership does. Two clusters drawn far apart may be adjacent in the data, and the arrangement changes with the random seed.

Things worth doing before believing a cluster:

- **Check it has markers.** A cluster with no genes specifically enriched in it is probably a split of something else.
- **Check it is not a batch, a cell-cycle phase, or a quality artefact.** Colour the same embedding by sample, by cell-cycle score, by mitochondrial fraction and by detected-gene count. If the cluster lights up on one of those, that is what it is.
- **Check it survives a different resolution and a different seed.**
- **Check the size.** A "cluster" of twelve cells out of forty thousand is a hypothesis, not a finding.

And when the groups are then compared for differential expression, remember that the clusters were defined using the same data — which inflates every p-value in the comparison. That circularity is why [cluster markers are for exploration](../de-tools-en/) and condition comparisons are done on pseudobulk.

## Summary

- Every algorithm returns clusters, including on data with no structure — the algorithm never tells you whether they are real
- The choice is really a choice of **assumed shape**: k-means assumes round, DBSCAN assumes dense, Leiden assumes communities in a graph
- k-means cannot find non-convex groups; density-based methods can, at the cost of one density scale for everything
- **There is no correct k or resolution.** Report what you used and show the conclusion survives nearby values
- Scale, reduce dimensions and remove batch effects before clustering, or you will cluster those instead
- On a UMAP, membership is meaningful and distance is not
- Clusters defined on the data and then tested on the same data give inflated p-values

## References

- Luecken & Theis, [Current best practices in single-cell RNA-seq analysis: a tutorial](https://doi.org/10.15252/msb.20188746), *Mol. Syst. Biol.* (2019)
- Traag, Waltman & van Eck, [From Louvain to Leiden: guaranteeing well-connected communities](https://doi.org/10.1038/s41598-019-41695-z), *Sci. Rep.* (2019)
- Campello, Moulavi & Sander, [Density-based clustering based on hierarchical density estimates](https://doi.org/10.1007/978-3-642-37456-2_14), *PAKDD* (2013) — HDBSCAN
- Chari & Pachter, [The specious art of single-cell genomics](https://doi.org/10.1371/journal.pcbi.1011288), *PLoS Comput. Biol.* (2023) — on over-reading embeddings
