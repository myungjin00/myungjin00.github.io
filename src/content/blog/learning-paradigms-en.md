---
title: "Supervised, unsupervised and self-supervised learning"
date: 2024-11-15
description: "Three paradigms split by where the label comes from · supervised, unsupervised, self-supervised · masking and contrastive learning · why augmentation is risky on molecules"
category: concept
updated: 2024-12
lang: en
group: paradigms
topic: Machine learning
subtopic: Basics
tags: [machine learning, self-supervised learning]
---

**Machine learning** · [#1 Machine learning and deep learning](../ml-and-dl-en/) · #2 Supervised, unsupervised, self-supervised · [#3 Clustering](../clustering-en/) · [#4 Transfer learning](../transfer-learning-en/)

<mark class="blue">What separates these is not the algorithm. It is **where the label comes from.**</mark>

<figure>
<svg viewBox="0 0 540 190" role="img" aria-label="Three paradigms compared by where the label comes from.">
  <g fill="none" stroke="#D3D8CE"><rect x="16" y="16" width="162" height="158" rx="6"/><rect x="190" y="16" width="162" height="158" rx="6"/><rect x="364" y="16" width="160" height="158" rx="6"/></g>
  <g font-family="IBM Plex Mono, monospace" font-size="11.5" fill="#1E4A39">
    <text x="30" y="38">supervised</text><text x="204" y="38">unsupervised</text><text x="378" y="38">self-supervised</text>
  </g>
  <g font-family="IBM Plex Mono, monospace" font-size="10.5" fill="#6E7873">
    <text x="30" y="160">a person labels it</text><text x="204" y="160">there is no label</text><text x="378" y="160">the data labels itself</text>
  </g>
  <g fill="#F3DCCB" stroke="#C2703C" stroke-width="1.2">
    <circle cx="48" cy="72" r="7"/><circle cx="48" cy="104" r="7"/><circle cx="48" cy="130" r="7"/>
    <circle cx="222" cy="72" r="7"/><circle cx="246" cy="96" r="7"/><circle cx="214" cy="112" r="7"/><circle cx="252" cy="130" r="7"/><circle cx="286" cy="78" r="7"/><circle cx="300" cy="116" r="7"/>
    <circle cx="396" cy="72" r="7"/><circle cx="396" cy="110" r="7"/>
  </g>
  <g stroke="#1E4A39" stroke-width="1.2"><line x1="60" y1="72" x2="104" y2="72"/><line x1="60" y1="104" x2="104" y2="104"/><line x1="60" y1="130" x2="104" y2="130"/></g>
  <g font-family="IBM Plex Mono, monospace" font-size="10" fill="#1E4A39">
    <text x="110" y="76">toxic</text><text x="110" y="108">safe</text><text x="110" y="134">toxic</text>
  </g>
  <g stroke="#2E5878" stroke-width="1.1" stroke-dasharray="3 3" fill="none">
    <ellipse cx="236" cy="92" rx="38" ry="32"/><ellipse cx="294" cy="98" rx="26" ry="28"/>
  </g>
  <g stroke="#1E4A39" stroke-width="1.2"><path d="M408 72 C 440 72, 440 110, 412 110" fill="none"/></g>
  <g fill="#DCE7DF" stroke="#1E4A39" stroke-width="1.2"><rect x="438" y="62" width="18" height="18" rx="3"/></g>
  <g font-family="IBM Plex Mono, monospace" font-size="10" fill="#1E4A39"><text x="462" y="76">?</text><text x="420" y="134">the hidden piece</text><text x="420" y="148">is the answer</text></g>
</svg>
<figcaption><b>Three paradigms.</b> Supervised learning uses labels a person attached; unsupervised learning looks for structure without them; self-supervised learning hides part of the data and predicts it from the rest.</figcaption>
</figure>

## Supervised

Inputs come paired with answers, and the model learns the mapping.

$$
\mathcal{D} = \{(x_i, y_i)\}_{i=1}^{N}
$$

| task | shape of $y$ | example |
| --- | --- | --- |
| classification | a category | does this molecule cross the blood–brain barrier |
| regression | a number | what is its solubility |

The MoleculeNet benchmarks are typical: BBBP is binary classification, ESOL is regression.

**The labels are the bottleneck.** One toxicity label for one molecule means running an experiment, which is why ADMET (absorption, distribution, metabolism, excretion, toxicity) datasets stop at a few thousand compounds. Meanwhile ZINC alone holds hundreds of millions of unlabelled molecules. That imbalance is the reason the next two paradigms matter.

## Unsupervised

No answers at all. The goal is to find structure in the data itself.

- **Clustering** — group similar things (k-means, hierarchical clustering)
- **Dimensionality reduction** — make high-dimensional data visible (principal component analysis, t-distributed stochastic neighbour embedding, UMAP)
- **Density estimation** — model the distribution the data came from

Single-cell RNA-seq (scRNA-seq) analysis is a good example. You cluster tens of thousands of cells, look at the result on a UMAP, and only then label each cluster with a cell type. The clustering itself had no answers to learn from.

> Evaluation is the fundamental weakness here. With nothing to predict, "did it work" has no clean definition.

## Self-supervised

**The labels are manufactured from the data.** Nobody annotates anything, yet the model trains as if supervised.

The usual recipe is to hide part of the input and predict it from the rest.

| field | what is hidden | what is predicted |
| --- | --- | --- |
| language | a word in a sentence | that word |
| images | a patch | that patch |
| molecular graphs | an atom or bond | that atom's type |

The other large family is **contrastive learning**: place two views of the same thing close together in the embedding space, and different things far apart.

$$
\mathcal{L} = -\log \frac{\exp(\mathrm{sim}(z_i, z_i^+)/\tau)}{\sum_{j}\exp(\mathrm{sim}(z_i, z_j)/\tau)}
$$

- $z_i$ and $z_i^+$ — the two views of the same thing, after encoding
- $\mathrm{sim}$ — a similarity between two vectors, usually cosine
- $\tau$ — the **temperature**, which sets how sharply the matching pair has to beat every other pair

The design question is how to produce "two views of the same thing". The usual answer is **augmentation** — deleting an atom, dropping a subgraph. For molecules that is risky: <mark>change one atom and it is a different molecule.</mark>

<figure>
<img src="/assets/fig/dual-view-paracetamol.svg" alt="The atom graph and the junction tree of paracetamol, side by side" loading="lazy" />
<figcaption><b>One molecule, two graphs.</b> On the left every atom is a node. On the right each node is a whole ring or a single bond, so the six-membered ring collapses from six nodes to one and the graph loses its cycles entirely. Computed with RDKit and the decomposition of Jin et al. (2018).</figcaption>
</figure>

> There is a way around it. Represent a molecule both as an **atom graph** and as a **junction tree**, and the two are already two views of the same thing — a positive pair for free, with no augmentation. That is the approach I took in [SJoINT](../../projects/sjoint/).

## Supervised, unsupervised and self-supervised compared

| | label comes from | data size | mostly used for |
| --- | --- | --- | --- |
| supervised | a person | small | the final task |
| unsupervised | nothing | large | exploration, visualisation |
| self-supervised | the data itself | very large | **pre-training** |

In practice the pipeline runs **self-supervised → supervised**: learn representations from hundreds of thousands of unlabelled molecules, then finish on a few thousand labelled ones. That link is the subject of [the next part](../transfer-learning-en/).

> **The general view.** BERT is the clearest example: hiding 15% of a sentence and predicting it teaches a model language without a single human annotation. Masking an atom and predicting it is the same idea moved to molecules, and SimCLR does it for images.

## Summary

- The dividing question is **where the label comes from**, not which algorithm
- Supervised: a person labels it — accurate but expensive
- Unsupervised: no labels — structure is visible, evaluation is not
- Self-supervised: the data labels itself — which unlocks unlabelled data
- For molecules, self-supervised pre-training followed by supervised fine-tuning is the standard

## References

- Devlin et al., [BERT](https://arxiv.org/abs/1810.04805) (2018) — the canonical masking objective
- Chen et al., [SimCLR](https://arxiv.org/abs/2002.05709) (2020) — the standard contrastive setup
- Hu et al., [Strategies for Pre-training Graph Neural Networks](https://arxiv.org/abs/1905.12265) (ICLR 2020) — the first systematic treatment for molecular graphs
