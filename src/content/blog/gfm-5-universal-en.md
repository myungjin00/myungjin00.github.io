---
title: "GFM #5 — Universal GFMs and what is still missing"
date: 2025-08-11
description: "One latent space for every graph · explicit versus implicit unification, and the link, subgraph and tree granularities · LLMs alone as graph models · graph-language co-training · and the assumption underneath two of the three families: that the graph comes with text."
category: review
updated: 2025-09
lang: en
topic: Graphs
venue: arXiv
venueYear: 2025
group: gfm-5-universal
tags: [review, graph foundation models, pretraining, transfer learning, universal GFM, large language models]
---

> Wang, Zehong, et al. "Graph Foundation Models: A Comprehensive Survey." *arXiv*, 21 May 2025, [arxiv.org/abs/2505.15116](https://arxiv.org/abs/2505.15116). Preprint.
> [paper list](https://github.com/Zehong-Wang/Awesome-Foundation-Models-on-Graphs)

**Series** · [#1 Introduction](../gfm-1-introduction-en/) · [#2 Background](../gfm-2-background-en/) · [#3 Challenges](../gfm-3-challenges-en/) · [#4 Framework](../gfm-4-framework-en/) · #5 Universal · [#6 Task-specific](../gfm-6-task-specific-en/) · [#7 Domain-specific](../gfm-7-domain-specific-en/) · [#8 Theory](../gfm-8-theory-en/) · [#9 Datasets](../gfm-9-datasets-en/) · [#10 Unsolved](../gfm-10-open-questions-en/)

Chapter 5 is the first of three chapters organised by **generalisation scope**: universal, then task-specific, then domain-specific. Universal is the widest of the three — one model for every domain and every task.

## What "universal" means here

A universal GFM (graph foundation model) is meant to generalise across domains — molecules, social networks, transactions — and across tasks — node classification, graph classification. The analogy the paper draws is explicit: large language models unified natural-language tasks and vision-language models unified vision tasks, so a GFM should unify learning over graph-structured data. The one-line statement of the principle is to **embed diverse graph structures into a unified latent space**, aligning graphs from different domains while preserving what is specific to each task.

Three design challenges, each with the paper's proposed answer:

| Challenge | Why it is hard | Proposed answer |
| --- | --- | --- |
| **Heterogeneous graphs** | domains differ in size, connectivity, attributes, density | large-scale self-supervised pretraining to learn unified latent representations |
| **Task conflicts** | node classification wants local bias, graph classification wants global | shared inductive biases and multi-task learning |
| **Positive transfer** | domain shift blocks transfer even where topological patterns are common | task-aware objectives and domain-invariant strategies |

These are [chapter 3's](../gfm-3-challenges-en/) three heterogeneities restated as engineering targets. The implementation strategy is then stated at three levels — **model-level** (architectures that generalise across tasks and domains), **pretrain-level** (objectives that align diverse graph distributions), and **adaptation-level** (fine-tuning for downstream tasks). That is the same three-slot frame as [chapter 4](../gfm-4-framework-en/).

The three families are then split by what the backbone is.

## Graph-model-based universal GFMs

These follow a **pretrain-then-adapt** pipeline: pretrain a graph encoder on a large multi-domain corpus, then adapt it to unseen downstream tasks. The patterns it is supposed to learn have to generalise across tasks (node, edge, graph), domains (chemistry, social, financial) and topologies (sparse versus dense).

### Model-level: two kinds of unification

- **Explicit unification** rewrites tasks and inputs into a *shared prediction format*, so one mechanism serves every task.
- **Implicit unification** leaves task definitions alone and relies on architecture design and inductive invariance to generalise.

Explicit unification comes at three granularities:

| Granularity | The unified format | Representative | Catch |
| --- | --- | --- | --- |
| **Link-level** | add class nodes to the graph, turn every task into link prediction | GPPT (KDD 2022) | simple and general, but misses fine-grained structure |
| **Subgraph-level** | classify an ego-graph (a node together with its neighbourhood) or prompted subgraph per prediction target | OFA | needs a shared feature space for the subgraph to be comparable |
| **Tree-level** | virtual nodes as task-specific aggregators; task-trees as the shared unit | GIT | the tree construction is itself a design choice |

OFA is the clearest instance: every task becomes "classify one subgraph that has a prompt attached to it", class prototypes are built from a support set through graph prompting, and a new node is assigned to the nearest prototype. The task head disappears; the task is now in the input.

### Pretrain-level: domain alignment

GIT (*Graph Generality Identifier on Task-Trees*) is the example the paper uses: construct task-trees as a common unit across node, link and graph tasks, pretrain contrastively over them, and align domains in that space. The move is to put the unification at the level of the pretraining unit rather than the prediction head.

### Adaptation-level: downstream adaptation

HoloGNN uses holographic node representations so that one pretrained model can be pointed at different graph tasks directly, without a per-task retraining stage.

## Language-model-based universal GFMs

Here the LLM (large language model) is the whole model, and the pipeline has three steps:

1. **Graph tokenisation** — serialise the graph into text the model can read
2. **Post-training on graph data** — adapt a pretrained language model to graph-shaped input
3. **Downstream adaptation** — prompt or fine-tune for the specific task

LangGFM is the position taken to its limit: a graph foundation model that relies entirely on a language model, with graph textualisation principles in place of any graph-specific module, released together with GFMBench, a benchmark of 26 datasets assembled to stop every paper evaluating on its own selection. QueryRAG works on the adaptation step instead, strengthening in-context learning by writing the query node, the context from its graph neighbours, and the corresponding labels explicitly into a structured prompt. The non-i.i.d. problem from [chapter 4](../gfm-4-framework-en/) — graph samples are not independent and identically distributed — means the neighbours have to be chosen rather than sampled, and QueryRAG does the choosing in the prompt.

## Graph-language co-training universal GFMs

Hybrid models unify the structural reasoning of GNNs (graph neural networks) with the general-purpose reasoning of language models, in three steps: graph encoding, cross-modality projection, language-based inference.

- **GOFA** interleaves randomly initialised GNN layers into a *frozen* pretrained language model, so structural and semantic modelling are combined inside one stack rather than stitched at the output. It is pretrained with graph-level next-word prediction, question answering and structural tasks, and reports zero-shot results on unseen tasks.
- **GraphCLIP** pretrains contrastively between a graph and a textual summary of it, self-supervised, aiming at cross-domain zero- and few-shot transfer. It is the [attention](../attention-en/)-era recipe from vision-language models applied at the graph level, with the summary playing the role the caption plays.

## What is still missing

The paper's own discussion of the three families is three sentences:

| Family | Good at | Not good at |
| --- | --- | --- |
| Graph-model-based | efficient, structure-aware | semantically limited |
| Language-model-based | flexible, language-driven | graph topology |
| Co-training | aims at both | significant system complexity |

On the last row it is specific: hybrid models demand complex architecture design, more memory and compute, and careful pretraining or alignment to avoid modality collapse or overfitting.

<mark class="blue">Two of the three families assume the graph arrives with text.</mark> Node descriptions, textual summaries, natural-language templates — tokenisation, post-training and prompting all need something to read, and the evaluation sets are text-attributed graphs. For a graph whose nodes are not describable in words without inventing the description, two thirds of chapter 5 does not apply.

Explicit unification, meanwhile, solves task heterogeneity and leaves feature heterogeneity where it was. Turning every task into link prediction or subgraph classification gives you one output format; it does not give you one input space. The methods that do address the input space do it through text, which returns to the first point.

## What I would question

Universal is the widest claim in the paper and the one with the widest gap between design principle and reported result, mostly because the text channel is doing more of the work than the taxonomy admits. GraphCLIP's recipe — contrastive alignment between a graph and a second description of the same object — has the same shape as the dual-view pretraining I work on, except that both of my views are graphs rather than a graph and a summary, so the channel carrying the zero-shot results here carries nothing new in my case.

## Summary

- A universal GFM aims to **embed diverse graph structures into one latent space**, aligned across domains while keeping task-specific detail
- Three design challenges — heterogeneous graphs, task conflicts, positive transfer — answered at model, pretrain and adaptation level, the same three slots as chapter 4
- Graph-model-based: **explicit** unification rewrites the task into a shared format, **implicit** unification rewrites nothing and relies on architecture
- Explicit unification at three granularities: link-level (GPPT, add class nodes, predict links), subgraph-level (OFA, classify a prompted subgraph, nearest prototype), tree-level (GIT, task-trees as the shared pretraining unit)
- Language-model-based: tokenise the graph, post-train, adapt — LangGFM uses a language model alone, QueryRAG writes neighbours and labels into the prompt
- Co-training: GOFA interleaves GNN layers into a frozen language model; GraphCLIP aligns a graph with its textual summary contrastively
- Graph backbones are structure-aware but semantically thin, language backbones flexible but topologically weak, hybrids capable but complex — and two of the three families need the graph to come with text

## References

- Wang et al., [Graph Foundation Models: A Comprehensive Survey](https://arxiv.org/abs/2505.15116), *arXiv* (2025) — the paper reviewed here
- Liu et al., [One for All: Towards Training One Graph Model for All Classification Tasks](https://arxiv.org/abs/2310.00149), *ICLR* (2024) — subgraph-level explicit unification with prompted subgraphs and class prototypes
- Wang et al., [Towards Graph Foundation Models: Learning Generalities Across Graphs via Task-Trees](https://arxiv.org/abs/2412.16441), *ICML* (2025) — GIT, task-trees as the unit of domain alignment
- Lin et al., [LangGFM: A Large Language Model Alone Can be a Powerful Graph Foundation Model](https://arxiv.org/abs/2410.14961), *arXiv* (2024) — the language-model-only position, plus the GFMBench suite of 26 datasets
- Kong et al., [GOFA: A Generative One-For-All Model for Joint Graph Language Modeling](https://arxiv.org/abs/2407.09709), *arXiv* (2024) — GNN layers interleaved into a frozen language model
