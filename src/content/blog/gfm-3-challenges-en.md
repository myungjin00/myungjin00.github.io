---
title: "GFM #3 — Challenges: the three heterogeneities"
date: 2025-07-01
description: "Feature, structure and task heterogeneity, and why each one is hard · SVD projection, text encoders and projection layers · over-smoothing and over-squashing as the price of depth · explicit versus implicit task alignment · and the admission that closes all three sections."
category: review
updated: 2025-08
lang: en
topic: Graphs
venue: arXiv
venueYear: 2025
group: gfm-3-challenges
tags: [review, graph foundation models, heterogeneity, over-smoothing, transfer learning]
---

> Wang, Zehong, et al. "Graph Foundation Models: A Comprehensive Survey." *arXiv*, 21 May 2025, [arxiv.org/abs/2505.15116](https://arxiv.org/abs/2505.15116). Preprint.
> [paper list](https://github.com/Zehong-Wang/Awesome-Foundation-Models-on-Graphs)

**Series** · [#1 Introduction](../gfm-1-introduction-en/) · [#2 Background](../gfm-2-background-en/) · #3 Challenges · [#4 Framework](../gfm-4-framework-en/) · [#5 Universal](../gfm-5-universal-en/) · [#6 Task-specific](../gfm-6-task-specific-en/) · [#7 Domain-specific](../gfm-7-domain-specific-en/) · [#8 Theory](../gfm-8-theory-en/) · [#9 Datasets](../gfm-9-datasets-en/) · [#10 Unsolved](../gfm-10-open-questions-en/)

Chapter 3 is a thousand words, and it defers the remedies for all three problems it names to chapters 5, 6 and 7. The questions those three method censuses answer are set here.

<figure>
<img src="/assets/fig/gfm-challenges.png" alt="Feature, structure and task heterogeneity across graph domains" width="1880" height="1471" loading="lazy">
<figcaption><b>Three ways graphs refuse to be one thing.</b> <b>(a)</b> Node features are not even the same length across datasets &mdash; and the two citation networks disagree with each other, not just with the molecule. <b>(b)</b> A benzene ring and a triadic closure are both recurring motifs that mean completely different things. <b>(c)</b> Node, link and graph tasks each need knowledge the others do not. Text has none of these problems, which is why foundation models arrived there first.
<br><span class="credit">Wang et al., <a href="https://arxiv.org/abs/2505.15116">Graph Foundation Models: A Comprehensive Survey</a>, arXiv:2505.15116 &#183; paper figure, Fig. 3</span></figcaption>
</figure>

<mark>Graph data is heterogeneous across domains in three separate ways, and a single unified model has to survive all three.</mark> The chapter takes them one section at a time and ends each section with an admission.

## Feature heterogeneity

Differences in node, edge or graph-level features across datasets, from two sources.

**Domain-specific differences** are the obvious half: graphs from different fields encode different semantics. A citation network describes academic relationships through titles, authors and abstracts; a molecular graph describes a compound through atom types, bond orders and spatial configuration. Those are not the same kind of object and they do not have the same dimension.

**Preprocessing inconsistency** is the half that is easier to overlook. Different feature-extraction pipelines produce incompatible features *even within the same domain*, which is why two citation networks can disagree with each other as badly as either disagrees with a molecule.

Remedies in use: singular value decomposition (SVD) to project features into a shared latent space; large language models as **text encoders**, so that a node is described in words and the words are encoded; graph-specific **feature projection layers**. The chapter's verdict is that a general and adaptive solution for heterogeneous feature alignment **remains an open research direction**.

## Structure heterogeneity

Differences in topological patterns across datasets. Structure is not decoration here — it carries most of the signal in downstream reasoning, and structural patterns vary widely enough across domains that a GNN (graph neural network) which generalises across graph types is hard to design. Molecules contain recurring chemical motifs such as benzene rings; social networks emphasise relational structures such as triadic closures; the model has to be structurally adaptive rather than tuned to either.

The obvious response is to add depth or capacity, and the chapter says why that fails: **over-smoothing and over-squashing**. Over-smoothing is the older result — a graph convolution is a form of Laplacian smoothing, so stacking enough of them drives node representations towards each other until they stop being distinguishable. Over-squashing is the complementary failure: the receptive field grows exponentially with depth while the vector carrying it stays the same size, so long-range information is compressed past recovery. Depth buys reach and loses the information it was meant to reach for.

Remedies in use: structure-aware data augmentation, graph prompt tuning, discrete structural codebooks. The verdict: current approaches **still struggle to adapt to the full spectrum** of real-world graph structures.

## Task heterogeneity

Different learning objectives need different modelling strategies and different inductive biases.

| Level | What is predicted | What the model needs |
| --- | --- | --- |
| Node | a label per node | local neighbourhood information |
| Link | presence or type of an edge between a pair | pairwise and relational structure |
| Graph | a property of the whole graph | subgraph motifs and global dependencies |

A node classifier wants locality; a graph classifier wants a global summary. These are not the same inductive bias, and a model tuned for one is mis-specified for the other. Two families of remedy: **explicit alignment**, which rewrites every task into a single shared prediction format so one head serves all of them, and **implicit alignment**, which leaves task definitions alone and relies on architecture and invariance. [Part #5](../gfm-5-universal-en/) shows what each looks like in practice. The verdict here: a universal GFM (graph foundation model) that adapts seamlessly across task types **remains challenging and largely unsolved**.

<mark class="blue">All three sections end with the same admission, which is the most useful thing in the paper's first third.</mark> The remedies exist, they help, and the chapter states in each case that none of them closes the problem.

## What I would question

Of the three, the one that reaches ordinary practice soonest is the second half of feature heterogeneity. A pretraining corpus and a downstream benchmark featurised by different pipelines lose transfer for reasons that have nothing to do with the domain, and that is as true inside [molecular property prediction](../mpp-en/) as it is across domains.

## Summary

- Three sources of heterogeneity, all open: **feature**, **structure**, **task**
- Feature heterogeneity has two halves — domain semantics, and preprocessing differences inside one domain; remedies are SVD projection, text encoders, feature projection layers
- Structure heterogeneity is why depth does not help: over-smoothing collapses node representations, over-squashing crushes long-range information
- Task heterogeneity means node, link and graph levels want different inductive biases; explicit alignment rewrites the task, implicit alignment rewrites the model
- Every remedy named here is a mitigation, and the chapter says so in each case
- The fixes themselves are deferred to the three method chapters, which is what makes this the setup for the rest of the paper

## References

- Wang et al., [Graph Foundation Models: A Comprehensive Survey](https://arxiv.org/abs/2505.15116), *arXiv* (2025) — the paper reviewed here; chapter 3 is this part
- Li et al., [Deeper Insights into Graph Convolutional Networks for Semi-Supervised Learning](https://arxiv.org/abs/1801.07606), *AAAI* (2018) — graph convolution as Laplacian smoothing, the over-smoothing result
- Alon & Yahav, [On the Bottleneck of Graph Neural Networks and its Practical Implications](https://arxiv.org/abs/2006.05205), *ICLR* (2021) — over-squashing
- Liu et al., [One for All: Towards Training One Graph Model for All Classification Tasks](https://arxiv.org/abs/2310.00149), *ICLR* (2024) — text descriptions as the shared feature space, the main remedy for feature heterogeneity
