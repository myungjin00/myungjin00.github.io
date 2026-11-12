---
title: "GFM #8 — Theory: scaling, emergence and transferability"
date: 2025-08-11
description: "Scaling measured on molecular, atomic and temporal graphs, and nowhere else · what the two direct attempts on general graphs found · emergence as an imported expectation · and the three candidate vocabularies for what transfers between graphs"
category: review
updated: 2025-09
lang: en
topic: Graphs
venue: arXiv
venueYear: 2025
group: gfm-8-theory
tags: [review, graph foundation models, scaling, transfer learning, expressiveness]
---

> Wang, Zehong, et al. "Graph Foundation Models: A Comprehensive Survey." *arXiv*, 21 May 2025, [arxiv.org/abs/2505.15116](https://arxiv.org/abs/2505.15116). Preprint.
> [paper list](https://github.com/Zehong-Wang/Awesome-Foundation-Models-on-Graphs)

In language the transferable unit is the word, and in vision it is something like an edge detector. For graphs, that sentence has no completion. There is no unit that recurs across a citation network and a molecule and means the same thing in both. The chapter works towards that question, and reaches it through scaling and emergence first.

The paper also says why the gap is structural rather than a matter of effort: graphs "encode complex, often manually defined relationships", which makes their transferable knowledge less intuitive than text or images. A word is a shared unit because a community agreed on it, and graph structure carries no such agreement.

## Scaling: measured where graphs look most like language

Scaling results exist for molecular and atomic systems and for temporal graphs, and nowhere else. The paper's own explanation for the restriction is that those graphs resemble language: a molecule has a fixed alphabet of atoms and bonds, and a temporal graph has a sequence.

In chemistry the fitted exponents are **0.17** and **0.26**, and the chapter attaches four caveats to them — modality, data regime, split strategy and capacity. An exponent measured under one combination of the four does not carry to another.

Two attempts on general graphs are reported. Supervised scaling appears when the axis is the number of **nodes or edges** rather than the number of graphs, which is a statement about what counts as more data. Self-supervised scaling behaves worse: the pretraining loss improves with scale and downstream performance does not follow.

## Emergence: assumed, not reported

Emergence enters through the definition. A graph foundation model is specified as a model that shows emergent ability, so the property is written into what the term means. The chapter reports no measurement of it on graphs, here or elsewhere in the survey.

## Single task: three tasks, three expressiveness ceilings

Before the cross-domain question, the chapter checks whether transfer works *within* one task type. It does not, and each level fails for its own reason.

| Level | What has to generalise | Why it stalls | What is bolted on |
| --- | --- | --- | --- |
| Node | homophily and heterophily — neighbours alike, or neighbours unalike | standard GNNs (graph neural networks) generalise poorly when asked to serve both jointly | textual descriptions for context; learnable prediction aggregation |
| Link | local and global proximity | message passing lacks the expressiveness to capture link isomorphism | labelling tricks, positional embeddings |
| Graph | motif distributions | motif sets differ across graphs, and 1-WL (one-dimensional Weisfeiler-Leman) bounds what a GNN can even encode | disentangled representation learning, invariance learning, expressive GNNs |

Three tasks, three ceilings, one backbone. The graph-level row carries into the next section: even if a shared motif vocabulary existed, the standard architecture could not learn it.

## Cross task: three candidate vocabularies

**Graphon.** A graphon is the continuous generative pattern a family of graphs can be read as samples from. If two graphs are drawn from the same one they share topological properties, and bounds on their embeddings follow; one line of work maps pretrained graphs into a graphon space and guarantees transfer when the target can be generated inside it. The chapter reports the catch twice: the assumptions are too strong for real graphs, and even when they hold, identifying a shared graphon across a large cross-domain collection is itself unsolved. Graphon theory explains transfer where transfer is already easy.

**Substructures.** Triangles, stars and k-cliques recur everywhere, which is the appeal, and subgraph-based frameworks encode sampled subgraphs with a GNN. The theoretical support comes through stability — effective transfer should be insensitive to small perturbations — and through the result that transfer is feasible when two graphs discretise the same underlying space, with the similarity of their ego-graph (a node with its neighbourhood) distributions correlating with transferability. The problem is that the same motif carries different meaning in different domains, which [chapter 10](../gfm-10-open-questions-en/) names *pattern conflict*.

**Subtrees.** Message-passing GNNs are bounded by the 1-WL test and cannot distinguish stars, conjoint cycles or k-cliques, so subtrees are chosen precisely because message passing captures them fully. Theoretical guarantees on stability, transferability and generalisation follow. The cost is structural, and the chapter states it: tree-based representations inherently discard certain structural dependencies.

<mark class="blue">The three candidates are one that works only where transfer was already easy, one the backbone cannot learn, and one that throws away the structure you wanted to transfer.</mark> That triangle is the actual content of chapter 8, and the paper says as much itself rather than presenting the three as complementary.

## What I would question

Three candidate vocabularies failing in three unrelated ways reads to me less like a search still in progress than like evidence that there is no shared unit to find: a word is a unit because a community agreed on one, and nobody ever agreed on what a subgraph means.

## Summary

- Graph scaling is measured on molecular and atomic systems and on temporal graphs, and the paper's own explanation for that restriction is that those graphs resemble language
- Exponents exist in chemistry — 0.17 and 0.26 — with four caveats attached: modality, data regime, split strategy and capacity
- On general graphs, supervised scaling needs node or edge counts rather than graph counts, and self-supervised scaling improves the pretraining loss without improving downstream performance
- Emergence on graphs is written into the definition of a GFM (graph foundation model) and is not reported as a result anywhere in the paper
- Transferability has no graph analogue of a word or an edge detector, and the paper attributes that to graph relations being manually defined
- Within a single task, node, link and graph levels each hit a different ceiling, and the graph-level one is an expressiveness bound
- Across tasks, the three candidate vocabularies are graphons, substructures and subtrees, each with a disqualifying catch

## References

- Wang et al., [Graph Foundation Models: A Comprehensive Survey](https://arxiv.org/abs/2505.15116), *arXiv* (2025) — the paper reviewed here; chapter 8 is this part
- Frey et al., [Neural scaling of deep chemical models](https://doi.org/10.1038/s42256-023-00740-3), *Nat. Mach. Intell.* (2023) — the fitted scaling exponents quoted above
- Chen et al., [Uncovering Neural Scaling Laws in Molecular Representation Learning](https://arxiv.org/abs/2309.15123), *NeurIPS* (2023) — where the modality, regime, split and capacity caveats come from
- Ma et al., [Do Neural Scaling Laws Exist on Graph Self-Supervised Learning?](https://arxiv.org/abs/2408.11243), *arXiv* (2024) — the self-supervised loss improves with scale, downstream performance does not follow
- Wang et al., [GFT: Graph Foundation Model with Transferable Tree Vocabulary](https://arxiv.org/abs/2411.06070), *NeurIPS* (2024) — the subtree-vocabulary answer, and its built-in information loss
