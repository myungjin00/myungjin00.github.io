---
title: "GFM #4 — The unified framework: backbone, pretraining, adaptation"
date: 2025-07-07
description: "The paper's actual contribution is a three-slot decomposition · GNN, graph transformer and LLM backbones · supervised, generative and contrastive pretraining and what the pretext task buys · and six ways to adapt, from full fine-tuning to graph prompting."
category: review
updated: 2025-08
lang: en
topic: Graphs
venue: arXiv
venueYear: 2025
group: gfm-4-framework
tags: [review, graph foundation models, pretraining, transfer learning, backbone, adaptation]
---

> Wang, Zehong, et al. "Graph Foundation Models: A Comprehensive Survey." *arXiv*, 21 May 2025, [arxiv.org/abs/2505.15116](https://arxiv.org/abs/2505.15116). Preprint.
> [paper list](https://github.com/Zehong-Wang/Awesome-Foundation-Models-on-Graphs)

**Series** · [#1 Introduction](../gfm-1-introduction-en/) · [#2 Background](../gfm-2-background-en/) · [#3 Challenges](../gfm-3-challenges-en/) · #4 Framework · [#5 Universal](../gfm-5-universal-en/) · [#6 Task-specific](../gfm-6-task-specific-en/) · [#7 Domain-specific](../gfm-7-domain-specific-en/) · [#8 Theory](../gfm-8-theory-en/) · [#9 Datasets](../gfm-9-datasets-en/) · [#10 Unsolved](../gfm-10-open-questions-en/)

Chapter 4 defines the frame the rest of the paper is organised by: **pretrain-then-adapt**, with every published model read as a choice in three slots.

## The decomposition is the contribution

A GFM (graph foundation model) is pretrained on a diverse collection of graph datasets and then adapted to downstream tasks instead of trained end to end. The two phases, written out:

| | Pretraining | Adaptation |
| --- | --- | --- |
| Input | large-scale graph database | task-specific data |
| Model | a parameterised backbone | the same backbone, now initialised |
| Objective | general graph representations | task performance |
| Result | weights encoding transferable structure and semantics | a working predictor |

The chapter's claim is that every GFM in the literature is a choice in **three slots**:

| Component | What it decides | Options |
| --- | --- | --- |
| **Backbone** | how structure and features are encoded | graph model, language model, hybrid |
| **Pretraining** | what the model learns without task labels | supervised, generative, contrastive |
| **Adaptation** | how pretrained weights become a predictor | fine-tuning, distillation, test-time adaptation, prompting, in-context learning, prototypes |

<mark class="blue">This is the paper's real contribution: not any one of its sections, but the fact that a new paper with a new acronym can be read as three choices and compared to everything else on the same axes.</mark> It also makes the empty cells visible, which a taxonomy organised by publication venue never does.

## Backbone

<figure>
<img src="/assets/fig/gfm-backbone.png" alt="Three backbone paradigms: graph model, language model, and graph-language co-training" width="2400" height="454" loading="lazy">
<figcaption><b>Three ways to build the encoder.</b> A graph model, a language model reading a serialised graph, or the two trained together. The third column is where most recent work sits.
<br><span class="credit">Wang et al., <a href="https://arxiv.org/abs/2505.15116">Graph Foundation Models: A Comprehensive Survey</a>, arXiv:2505.15116 &#183; paper figure, Fig. 4</span></figcaption>
</figure>

The goal is to carry both structural and semantic information, by combining what graph neural networks (GNNs) and large language models (LLMs) are respectively good at.

| | Graph model (GNN, graph transformer) | Large language model |
| --- | --- | --- |
| Input | the native graph | the graph serialised as a sequence |
| Strength | relational dependencies via message passing | generalisation and scalability |
| Limitation | long-range dependencies, multimodal integration | no graph inductive bias; weak on topology |

### Graph model as predictor

The base is [message passing](../gnn-en/): node embeddings are updated by aggregating neighbour information, and architectures differ in how they implement AGGREGATE and UPDATE. GCN (graph convolutional network) aggregates by a normalised mean, GAT (graph attention network) by [attention](../attention-en/) weights so some neighbours count more, and a graph transformer by global attention across all nodes.

Two sub-families:

- **Without auxiliary modules** — pure GNN inductive bias, nothing bolted on. MiniMol, an efficient GNN with shared initialisation, and JMP, with degree-normalised hierarchical updates. Strong in relational domains, weak when the task needs unstructured knowledge.
- **With auxiliary language models** — an LLM is attached to fix what the GNN cannot do. Two strategies, and the distinction matters: *LLM-enhanced node features*, where the LLM generates text for each node before encoding (TAPE generates a task-specific description per node with a generative model, then a language model turns it into a vector that the GNN consumes — the LLM is preprocessing, and the GNN still does all the structural learning); and *LLM as encoder of node descriptions*, where every node and edge is written into one uniform template and encoded into a shared embedding space (OFA). The second is what buys zero-shot across domains, because a node from an unseen domain still produces a sentence.

### Language model as predictor

Pretrained LLMs — BERT with masked prediction, GPT-3 with next-token prediction — bring in-context learning, chain-of-thought reasoning and zero-shot generalisation. Applied to graphs, the graph is turned into a text sequence: LangGFM uses natural-language templates, BeyondText asks the model to recover graph structure through prompts, GLM tunes prompts with reinforcement learning. The limitation is the obvious one — there is no inductive bias for complex topology, so the model has to re-derive adjacency from text every time.

With auxiliary modules, GNN-encoded structure is aligned to the language model's input space: GraphGPT uses instruction tuning plus contrastive alignment, GraphTranslator adds structure-aware regularisation, LLaGA retrieves task-relevant subgraphs.

### Graph-language co-training

Here the GNN and the LLM are **co-equal** learners rather than one serving the other, with two paradigms.

*Alignment* maps structured and unstructured representations into one embedding space with a dual encoder and a contrastive objective — GraphCLIP, ConGraT. *Iterative update* goes further, with a latent variable as a shared semantic anchor and expectation-maximisation-style optimisation. GLEM is the example: the language model produces pseudo-labels from node text, the GNN propagates over structure and refines its embeddings, and the two alternate until convergence, each supplying what the other lacks.

| Backbone type | Strengths | Limitations |
| --- | --- | --- |
| Graph | structural fidelity, efficiency | long-range and multimodal information |
| Language | generalisation, zero-shot, multimodal | no structural bias |
| Hybrid | both of the above | complex, resource-intensive |

## Pretraining

<figure>
<img src="/assets/fig/gfm-pretrain.png" alt="Supervised, generative and contrastive pretraining strategies" width="2400" height="1092" loading="lazy">
<figcaption><b>Where the training signal comes from.</b> Supervised pretraining uses labels; generative pretraining reconstructs the data; contrastive pretraining learns by telling things apart. Only the last two scale, because only they need no labels.
<br><span class="credit">Wang et al., <a href="https://arxiv.org/abs/2505.15116">Graph Foundation Models: A Comprehensive Survey</a>, arXiv:2505.15116 &#183; paper figure, Fig. 5</span></figcaption>
</figure>

Pretraining is what lets the model acquire transferable knowledge from large-scale unlabelled or weakly-labelled data. Three strategies:

| Strategy | Description | Key features |
| --- | --- | --- |
| Supervised | train on labelled subgraphs drawn from large graphs | task-specific, explicit objectives |
| Generative | reconstruct masked or corrupted nodes and structure | auto-encoding or auto-regressive |
| Contrastive | separate positive from negative pairs across views | invariant, transferable embeddings |

**Supervised pretraining** uses labelled graphs to learn task-relevant representations, which aligns pretraining with downstream objectives and converges faster. The cost is labels at scale, so it is usually mixed with self-supervision. OFA unifies diverse prediction tasks through *nodes-of-interest*; PRODIGY generates subgraph tasks by structural and semantic decomposition.

**Generative pretraining** models the data distribution itself, with no labels. Auto-regressive methods factor the joint probability into sequential conditionals and generate nodes and edges step by step with history — GraphRNN, MolecularRNN for molecules, a transformer-based auto-regressive GraphGPT, and edge-by-edge variants. Auto-encoding methods instead mask part of the input and reconstruct it from visible context, BERT-style: mask node or edge features, or mask structure, encode with a GNN, and let specialised heads predict what was hidden.

**Contrastive pretraining** learns by discrimination, in two flavours. *Instance-instance* treats two views of the same node as a positive pair and other nodes as negatives, optimising InfoNCE; its weakness is the positive-pair assumption, which breaks under weak homophily — neighbouring nodes not tending to be alike — or noisy graphs, because "two views of the same node" stops being a safe notion of sameness. *Instance-context* aligns a local node embedding with a global graph summary instead, which is Deep Graph Infomax (DGI) — mutual-information discrimination between a real node-graph pair and a corrupted one, typically built by shuffling node features. This is where [self-supervised learning](../learning-paradigms-en/) on graphs does its work.

## What the pretext task actually buys

The discussion subsection declares no winner:

- Supervised — task-aligned and fast, but needs large, high-quality labels. Best when the label-rich pretraining task resembles the downstream one.
- Generative — scalable and label-free, but weak task specificity. <mark>Reconstruction quality is not downstream performance.</mark>
- Contrastive — strong discriminative representations, but sensitive to the choice of augmentation and computationally heavy.

## Adaptation

<figure>
<img src="/assets/fig/gfm-adaptation.png" alt="Six adaptation strategies for a pretrained graph foundation model" width="2400" height="944" loading="lazy">
<figcaption><b>Six ways to use what was pretrained.</b> They differ in one thing: how much of the model you are still allowed to change. Reading left to right is reading a budget &mdash; from updating every parameter down to updating none at all.
<br><span class="credit">Wang et al., <a href="https://arxiv.org/abs/2505.15116">Graph Foundation Models: A Comprehensive Survey</a>, arXiv:2505.15116 &#183; paper figure, Fig. 6</span></figcaption>
</figure>

Six options, with the paper's own comparison across them:

| Strategy | Strengths | Limitations |
| --- | --- | --- |
| Transfer learning | fewer labels needed, fast convergence from a pretrained initialisation | full fine-tuning is costly; overfitting risk on small datasets |
| Distillation | compresses a large model, cheap at inference | the student can miss the teacher's complex graph patterns |
| Test-time adaptation | no retraining, handles distribution shift at inference | no supervision; noisy self-supervised signals destabilise it |
| Graph prompting | no parameter updates, modular and reusable prompts | sensitive to prompt quality, often needs task-specific tuning |
| In-context learning | zero-/few-shot with no updates | needs good demonstrations, which are hard to choose on graphs |
| Prototype learning | interpretable, parameter-efficient, good few-shot | assumes clean clusters; misses complex class boundaries |

A few of these need unpacking.

**Transfer learning** is graded by how much gets updated: direct adaptation with no update at all (zero-shot), full fine-tuning of every parameter, adaptive fine-tuning of selected layers or modules by task relevance, and parameter-efficient fine-tuning (PEFT) which freezes the backbone and trains small added modules such as adapters or LoRA.

**Test-time adaptation (TTA)** adapts during inference using unlabelled test data, with no access to training data or labels. Self-supervised TTA updates parameters online through entropy minimisation or pseudo-label consistency; GTRANS instead refines the *input graph* rather than the model, adding or removing node attributes, changing edges, removing noise; LLM-TTT uses a language model to generate pseudo-labels from node descriptions. The contrast with transfer learning is worth keeping straight:

| | Transfer learning | Test-time adaptation |
| --- | --- | --- |
| When | after pretraining, while training on the downstream task | during inference |
| Input | labelled task-specific data | usually unlabelled test data |
| What changes | the model, in most cases | the model in some methods, the input graph in others |

**Graph prompting** steers a frozen model with learnable prompt vectors. Data-level prompting changes the input graph itself — appending a prompt structure to what the model reads; representation-level prompting acts on the internal representation instead, gating or shifting the vector the model has already computed. All in One and IA-GPL sit here.

**In-context learning (ICL)** puts demonstration examples in the input, as with GPT-3, and needs no parameter update. It is mostly applied to text-attributed graphs, where nodes and edges carry descriptions, and the hard part is specific to graphs: data points are non-i.i.d. (non-independent and identically distributed) and structurally dependent, so you cannot pick demonstrations by sampling. AskGNN uses a GNN as a retriever for relevant demonstrations; retrieval-augmented generation pulls examples from external memory; selection by combined semantic and structural similarity is the general answer.

**Prototype learning** replaces the classifier with class centroids and classifies by distance to the nearest prototype. Prototypes either come from node representations — the average of the labelled nodes' embeddings, which is parameter-free — or from extra **learnable class nodes** added to the graph as a bipartite structure, so message passing computes the prototype. PRODIGY uses the second.

## What I would question

The middle row of the pretext-task comparison is the one I would underline, for the same reason as in my [transfer learning](../transfer-learning-en/) note: a pretext task can be solved well and still leave an encoder carrying nothing the downstream task needs, and for contrastive objectives the sensitivity only moves into the augmentation — which on molecules means perturbing a graph can change the property being predicted. Read against the three slots my own dual-view molecular pretraining is conservative in all three, which makes the frame useful mainly for locating the one substitution worth testing.

## Summary

- Every GFM decomposes into **backbone × pretraining × adaptation**, and that decomposition is the paper's contribution
- Backbones are graph, language or hybrid; graph gives structural fidelity, language gives zero-shot and multimodal reach, hybrid gives both and costs more
- Attaching an LLM to a GNN comes in two forms: generate text features before encoding, or encode uniform node descriptions into a shared space — only the second buys cross-domain zero-shot
- Co-training treats the two as equals: contrastive alignment in a shared space, or EM-style alternation with pseudo-labels (GLEM)
- Pretraining is supervised, generative or contrastive; contrastive splits into instance-instance (InfoNCE) and instance-context (DGI)
- No pretext task dominates: supervised needs labels, generative reconstruction does not track downstream performance, contrastive depends on the augmentation
- Adaptation runs from full fine-tuning through PEFT, distillation, test-time adaptation, graph prompting, in-context learning and prototypes — the last three mostly assume text-attributed graphs

## References

- Wang et al., [Graph Foundation Models: A Comprehensive Survey](https://arxiv.org/abs/2505.15116), *arXiv* (2025) — the paper reviewed here
- Veličković et al., [Deep Graph Infomax](https://arxiv.org/abs/1809.10341), *ICLR* (2019) — instance-context contrastive pretraining on graphs
- Huang et al., [PRODIGY: Enabling In-context Learning Over Graphs](https://arxiv.org/abs/2305.12600), *arXiv* (2023) — prompt graphs for in-context adaptation, and learnable class nodes
- Sun et al., [All in One: Multi-task Prompting for Graph Neural Networks](https://arxiv.org/abs/2307.01504), *KDD* (2023) — the graph prompting formulation used throughout section 4.4
- Zhao et al., [Learning on Large-scale Text-attributed Graphs via Variational Inference](https://arxiv.org/abs/2210.14709), *ICLR* (2023) — GLEM, the EM-style graph-language alternation
