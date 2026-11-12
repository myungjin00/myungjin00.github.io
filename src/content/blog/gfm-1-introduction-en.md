---
title: "GFM #1 — Introduction: the one-model-fits-all ambition on graphs"
date: 2025-06-19
description: "The one-model-fits-all goal and the road to it through transfer learning and self-supervision · what a foundation model is · why graphs are a different modality · OFA and GFT as the two opening examples · what the earlier reviews left out."
category: review
updated: 2025-07
lang: en
topic: Graphs
venue: arXiv
venueYear: 2025
group: gfm-1-introduction
tags: [review, graph foundation models, pretraining, transfer learning]
---

> Wang, Zehong, et al. "Graph Foundation Models: A Comprehensive Survey." *arXiv*, 21 May 2025, [arxiv.org/abs/2505.15116](https://arxiv.org/abs/2505.15116). Preprint.
> [paper list](https://github.com/Zehong-Wang/Awesome-Foundation-Models-on-Graphs)

**Series** · #1 Introduction · [#2 Background](../gfm-2-background-en/) · [#3 Challenges](../gfm-3-challenges-en/) · [#4 Framework](../gfm-4-framework-en/) · [#5 Universal](../gfm-5-universal-en/) · [#6 Task-specific](../gfm-6-task-specific-en/) · [#7 Domain-specific](../gfm-7-domain-specific-en/) · [#8 Theory](../gfm-8-theory-en/) · [#9 Datasets](../gfm-9-datasets-en/) · [#10 Unsolved](../gfm-10-open-questions-en/)

Ninety-three pages, eleven chapters, 438 references. Chapter 1 states what the authors are after, why they say no existing review covers it, and what the remaining ten chapters will deliver.

## One model for all graphs

The opening claim is an ambition, not a result: the **one-model-fits-all** paradigm, a model general enough to perform a wide spectrum of tasks across diverse domains without task-specific architecture design or training.

The history leading up to it is compressed into a single paragraph, and it places graph learning at a specific point on a curve the authors say other fields have already travelled. Classical models — decision trees, support vector machines, k-nearest neighbours — worked in low-dimensional, structured settings and struggled on high-dimensional, unstructured or multimodal data. Deep learning moved perceptual performance forward, convolutional networks for vision and recurrent networks for sequences, while still demanding task-specific tuning, architecture adjustment and large labelled datasets. The turn came with **transfer learning** and **self-supervised learning**, which let a model acquire broadly transferable representations from large-scale unlabelled data. Foundation models are what those two made possible.

A foundation model, by this chapter's definition, is trained on massive datasets to acquire universal knowledge that can be adapted to a wide array of downstream tasks, and is characterised by three things: scale, general-purpose nature, and pretraining across heterogeneous data sources. Large language models tokenise text and cast translation, summarisation and reasoning as next-token prediction. Large vision models treat images as sequences of tokens and run the same transformer machinery for visual question answering, captioning and generation. Both report zero-shot and few-shot generalisation — a new task from no labelled examples, or from a handful — which is what makes adaptation cheap enough to be the point.

## Why graphs are treated as a separate problem

<figure>
<img src="/assets/fig/gfm-intro.png" alt="Task-specific graph models contrasted with general-purpose graph foundation models" width="1913" height="1159" loading="lazy">
<figcaption><b>The shift the paper is about.</b> <b>(a)</b> A GFM is pretrained once on graph corpora from several domains and then adapted &mdash; by fine-tuning, distillation, prompting or zero-shot inference &mdash; to node classification, link prediction, graph classification and graph-to-text generation alike. <b>(b)</b> A conventional GNN is trained end to end on one dataset for one task. <mark>The second column is the whole claim: adaptation replaces retraining.</mark>
<br><span class="credit">Wang et al., <a href="https://arxiv.org/abs/2505.15116">Graph Foundation Models: A Comprehensive Survey</a>, arXiv:2505.15116 &#183; paper figure, Fig. 1</span></figcaption>
</figure>

A graph foundation model (GFM) extends the recipe to graph-structured data, described here as an essential yet fundamentally different modality characterised by relational dependencies, permutation invariance and non-Euclidean geometry. Those three properties are why this is not simply a port of the language recipe, and they are the reason chapters 3 and 8 exist at all.

| | Task-specific graph model | Graph foundation model |
| --- | --- | --- |
| Input | one graph dataset | a diverse collection of graph datasets |
| Model | a [GNN](../gnn-en/) (graph neural network) built for that dataset | a pretrained backbone |
| Output | one task | many tasks, via adaptation |
| Training | fully end-to-end | pretrain, then adapt |
| What is reused | nothing | the backbone |

The paper's criticism of the left column is not that it performs badly. It is that end-to-end training ties the model to the dataset and the objective it was trained on, so every new problem starts from scratch, and the chapter calls out the missing scalability and generalisation that open-world settings would need. The application range the authors have in mind is deliberately wide: [molecular property prediction](../mpp-en/), knowledge graph reasoning, social network analysis, recommender systems.

## Two opening examples

Chapter 1 names two models before any taxonomy exists, and the pair sets up the division the rest of the paper returns to.

**OFA** operates on eight text-attributed graphs spanning citation networks, Wikipedia networks, knowledge graphs and molecular graphs, where every node carries a textual description. A shared text encoder projects those descriptions into one embedding space, which is what makes node features from unrelated graphs comparable at all, and a *prompt graph* mechanism closes the gap between pretraining and the downstream task.

**GFT** takes the other route. It identifies transferable patterns by modelling graph data as computation trees, aligns node representations across graphs through a tree reconstruction task, and builds a transferable **tree vocabulary** of structural patterns shared across domains.

Text as the shared space, or structure as the shared space. <mark class="blue">Those are the two answers the field has, and much of the rest of the paper is an inventory of variations on them.</mark>

## What the earlier reviews left out

The case for a new review is made by naming the existing ones and what each one does not cover.

| Earlier review | Organising axis | What chapter 1 says it omits |
| --- | --- | --- |
| Liu et al. | backbone: GNN, LLM (large language model), hybrid | applications and theoretical understanding |
| Zhao et al. | pretraining objectives | broader system design, theory |
| Mao et al. | transferability theory | concrete methods, empirical systematisation |
| Wang et al. | transferability and emergent ability | the architectural and application spectrum |
| Zhao et al. | cross-domain graph learning | cross-task generalisation, structural alignment |
| Wu et al. and the GNN-plus-LLM reviews | one domain, or one subfield | GNN + LLM treated as a subfield, not as part of a GFM framework |

## What the paper promises

The six stated contributions map onto chapters one for one:

- **Chapter 3** — the challenges, sorted into feature, structure and task heterogeneity
- **Chapter 4** — a unified framework decomposing a GFM into backbone, pretraining and adaptation
- **Chapters 5 to 7** — a taxonomy by scope: universal, task-specific, domain-specific, with the literature reviewed as of 1 April 2025
- **Chapter 8** — theory: scaling laws, transferability, generalisation
- **Chapter 9** — dataset resources, plus a maintained GitHub collection
- **Chapter 10** — open questions: alignment, scalable adaptation, evaluation protocols, theory

The chapter then closes with a forward-looking summary that concedes the field "remains in its infancy", with open problems spanning scalability, data availability, evaluation, utilisation and theoretical understanding. <mark>An introduction that concedes its own subject is in its infancy is making a programme statement, and reading the paper that way is more useful than reading it as a report of results.</mark>

## What I would question

The two opening examples are the real taxonomy, and everything in chapters 5 to 7 lands on one side of them or tries to straddle both. I would rather the paper had said so at the front than arrived at it through nine chapters of inventory.

## Summary

- The goal is **one-model-fits-all** for graphs: pretrain on diverse graph data, adapt to node, link and graph tasks without redesigning the model
- The lineage runs classical models → deep learning → transfer learning and self-supervision → foundation models, with GFMs as the graph instalment
- Graphs are treated as a separate problem because of relational dependencies, permutation invariance and non-Euclidean geometry
- The two opening examples set the two strategies: **OFA** aligns through shared text, **GFT** aligns through a shared tree vocabulary
- Six earlier reviews are credited and placed, each organised around a single axis the authors say is too narrow
- Chapter 1 closes by calling the field immature and lists scalability, data availability, evaluation, utilisation and theory as open

## References

- Wang et al., [Graph Foundation Models: A Comprehensive Survey](https://arxiv.org/abs/2505.15116), *arXiv* (2025) — the paper reviewed here; chapter 1 is this part
- Bommasani et al., [On the Opportunities and Risks of Foundation Models](https://arxiv.org/abs/2108.07258), *arXiv* (2021) — where the term and the scale-plus-adaptation definition come from
- Liu et al., [One for All: Towards Training One Graph Model for All Classification Tasks](https://arxiv.org/abs/2310.00149), *ICLR* (2024) — OFA, the text-as-shared-space example
- Wang et al., [GFT: Graph Foundation Model with Transferable Tree Vocabulary](https://arxiv.org/abs/2411.06070), *NeurIPS* (2024) — GFT, the structure-as-shared-space example
