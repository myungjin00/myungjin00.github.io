---
title: "GFM #2 — Background: four eras of graph learning, and the definitions"
date: 2025-06-25
description: "From graph kernels to graph embeddings to GNNs to pretrained graph models · what a foundation model is and what emerges at scale · the five properties a GFM is supposed to have · and the definition that assumes the thing chapter 8 cannot demonstrate."
category: review
updated: 2025-07
lang: en
topic: Graphs
venue: arXiv
venueYear: 2025
group: gfm-2-background
tags: [review, graph foundation models, graph embeddings, pretraining]
---

> Wang, Zehong, et al. "Graph Foundation Models: A Comprehensive Survey." *arXiv*, 21 May 2025, [arxiv.org/abs/2505.15116](https://arxiv.org/abs/2505.15116). Preprint.
> [paper list](https://github.com/Zehong-Wang/Awesome-Foundation-Models-on-Graphs)

**Series** · [#1 Introduction](../gfm-1-introduction-en/) · #2 Background · [#3 Challenges](../gfm-3-challenges-en/) · [#4 Framework](../gfm-4-framework-en/) · [#5 Universal](../gfm-5-universal-en/) · [#6 Task-specific](../gfm-6-task-specific-en/) · [#7 Domain-specific](../gfm-7-domain-specific-en/) · [#8 Theory](../gfm-8-theory-en/) · [#9 Datasets](../gfm-9-datasets-en/) · [#10 Unsolved](../gfm-10-open-questions-en/)

Chapter 2 tells the history of graph learning as a sequence of four paradigms, recaps what a foundation model is, and sets the notation. One of those definitions carries a claim the paper's own theory chapter does not support.

## Four eras of graph learning

<figure>
<img src="/assets/fig/gfm-development.png" alt="The evolution of graph learning paradigms, from graph kernels to graph foundation models" width="2400" height="1011" loading="lazy">
<figcaption><b>How graph learning got here.</b> Hand-designed kernels gave way to learned node embeddings, then to end-to-end GNNs, then to models pretrained on large graph corpora and adapted downstream. Each step moved work from the human to the data; the last one is the only step that also claims to move across <i>domains</i>.
<br><span class="credit">Wang et al., <a href="https://arxiv.org/abs/2505.15116">Graph Foundation Models: A Comprehensive Survey</a>, arXiv:2505.15116 &#183; paper figure, Fig. 2</span></figcaption>
</figure>

**Statistical methods** (pre-2010s) came out of classical graph theory and combinatorial optimisation: shortest-path computation, spectral clustering, graph kernels. They supported network analysis, community detection and graph matching, and their limits were handcrafted features, poor scalability, and no capacity to learn a representation that could be reused.

**Graph embeddings** (around 2010) brought representation learning in. DeepWalk, node2vec and LINE map nodes into a low-dimensional continuous space through random walks or neighbourhood sampling, and the resulting vectors worked for node classification, clustering and link prediction. Two limits matter for the rest of the paper: these methods are largely transductive, so a node unseen at training time has no embedding, and they capture structure without accommodating node or edge attributes.

**Graph neural networks** (GNNs, 2016 onward) applied deep learning to non-Euclidean structure through [message passing](../gnn-en/), with GCN (graph convolutional network), GAT (graph attention network) and GraphSAGE as the reference points. They fixed both of the embedding-era limits — inductive inference, and attributes as first-class input — and introduced their own: over-smoothing, limited receptive fields, and the need for extensive task-specific architecture tuning.

**Graph foundation models** (post-2023) pretrain on large-scale graphs with self-supervised objectives, aiming at universal representations that transfer across tasks and domains. The stated payoff is that decoupling model training from any specific task reduces reliance on labelled data and on domain-specific heuristics.

Read as a sequence, each era solves the previous era's bottleneck and inherits a new one. <mark>The fourth era is the only one whose defining bottleneck has not been named yet, because nobody has run it long enough to find out.</mark>

## What a foundation model is, as this chapter defines it

The term was popularised by Stanford's institute for human-centred artificial intelligence, and the architectural answer is almost always the transformer: self-attention to capture long-range dependencies, scaled to billions of parameters. GPT, BERT, PaLM and LLaMA on the language side; CLIP and DALL·E for vision-language.

The capability claim has three parts. Pretraining on large, diverse data yields semantic, syntactic and structural knowledge that transfers through fine-tuning, prompting or instruction tuning. In-context learning lets a model take on a new task from the input prompt alone, with no gradient update. And as models scale in size and data, they begin to show **emergent behaviours** — capabilities neither programmed nor visible in smaller models, with logical reasoning, chain-of-thought generation and tool use given as the examples.

The chapter also lists what comes with that, in the only place in the paper where it appears: data and societal bias, interpretability, safety, and environmental cost. None of the four is revisited in the remaining ninety pages.

## The five properties a GFM (graph foundation model) is supposed to have

The chapter states these as properties a GFM should have, not as properties it reports in any existing model.

- **Pretraining on large-scale graph data** — diverse graph datasets across biology, social networks, knowledge graphs
- **General-purpose representations** — universal node, edge and graph-level embeddings, usable with minimal fine-tuning or prompting
- **Structural awareness** — connectivity, neighbourhood structure, global graph properties
- **Transferability** — knowledge that moves across tasks *and* domains, so limited task-specific data still suffices
- **Few-shot and zero-shot capability** — new tasks from few or no labelled examples

Properties 3 and 4 sit in tension, and that tension is what [chapter 3](../gfm-3-challenges-en/) is about.

## The definitions, and one that assumes its conclusion

Six definitions are given: a graph as node and edge sets with an adjacency matrix; an attributed graph as that plus a node-feature matrix; a GNN as an architecture that recursively aggregates over local neighbourhoods; an LLM (large language model) as a transformer pretrained on text corpora, able to run over graphs by way of their textual information; and two that are worth pausing on.

A **text-attributed graph** (TAG) is defined as a graph carrying textual descriptions attached to nodes, to edges, or to the whole graph. Once text is part of the formal object, a large fraction of the methods in chapters 5 and 6 fall inside the definition rather than beside it.

Then the last one. A graph foundation model is defined as a model pretrained on extensive cross-domain and cross-task graph datasets that, through pretraining, acquires transferable knowledge and general-purpose capabilities, "demonstrating emergent properties and adaptability across diverse graph-based applications."

<mark class="blue">Emergence is written into the definition of the object, and [chapter 8](../gfm-8-theory-en/) reports no graph result demonstrating it.</mark> The authors do not hide it: chapter 10 says plainly that the scaling trend has not yet appeared in existing GFMs. The definition therefore describes an intended class of models rather than an observed one.

## What I would question

Structural awareness and transferability are asked for together, and I do not think they come together: a representation that captures one domain's structure faithfully is, for that reason, shaped by that domain. Taking the GFM definition as a statement of intent rather than of fact is what makes the remaining ninety pages read straight.

## Summary

- Four paradigms: statistical methods, shallow graph embeddings, end-to-end GNNs, pretrained graph foundation models
- Graph embeddings were transductive and attribute-blind; GNNs fixed both and brought over-smoothing and architecture tuning instead
- A foundation model is scale plus general-purpose pretraining plus adaptation, built on the transformer, with in-context learning as the cheap interface
- Emergent behaviour is the expected shape of success in language and vision, and the chapter lists bias, interpretability, safety and compute cost as its companions
- Five target properties for a GFM: large-scale pretraining, general-purpose representations, structural awareness, transferability, few-/zero-shot capability
- Text-attributed graphs get a formal definition early, which is how much of the later method census becomes possible
- The definition of a GFM includes emergent properties, which the paper's own theory chapter does not demonstrate on graphs

## References

- Wang et al., [Graph Foundation Models: A Comprehensive Survey](https://arxiv.org/abs/2505.15116), *arXiv* (2025) — the paper reviewed here; chapter 2 is this part
- Perozzi et al., [DeepWalk: Online Learning of Social Representations](https://arxiv.org/abs/1403.6652), *KDD* (2014) — the graph-embedding era, random walks into a shared vector space
- Kipf & Welling, [Semi-Supervised Classification with Graph Convolutional Networks](https://arxiv.org/abs/1609.02907), *ICLR* (2017) — GCN, the reference point for the message-passing era
- Vaswani et al., [Attention Is All You Need](https://arxiv.org/abs/1706.03762), *NeurIPS* (2017) — the architecture every foundation model in this chapter is built on
- Wei et al., [Emergent Abilities of Large Language Models](https://arxiv.org/abs/2206.07682), *TMLR* (2022) — the emergence result that the GFM definition borrows
