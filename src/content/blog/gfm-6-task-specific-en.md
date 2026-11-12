---
title: "GFM #6 — Task-specific models: node, link and graph level"
date: 2025-08-11
description: "One task, many domains · the relation vocabulary trick that makes link-level GFMs work · why the graph-level table is mostly molecules · QA, anomaly detection and recommendation"
category: review
updated: 2025-09
lang: en
group: gfm-6-task-specific
topic: Graphs
venue: arXiv
venueYear: 2025
tags: [review, graph foundation models, link prediction, pretraining]
---

> Wang, Zehong, et al. "Graph Foundation Models: A Comprehensive Survey." *arXiv*, 21 May 2025, [arxiv.org/abs/2505.15116](https://arxiv.org/abs/2505.15116). Preprint.
> [paper list](https://github.com/Zehong-Wang/Awesome-Foundation-Models-on-Graphs)

**Series** · [#1 Introduction](../gfm-1-introduction-en/) · [#2 Background](../gfm-2-background-en/) · [#3 Challenges](../gfm-3-challenges-en/) · [#4 Framework](../gfm-4-framework-en/) · [#5 Universal](../gfm-5-universal-en/) · #6 Task-specific · [#7 Domain-specific](../gfm-7-domain-specific-en/) · [#8 Theory](../gfm-8-theory-en/) · [#9 Datasets](../gfm-9-datasets-en/) · [#10 Unsolved](../gfm-10-open-questions-en/)

A universal GFM (graph foundation model) tries to cross both domains and tasks at once. A task-specific GFM gives up one of those axes: it still crosses domains, but it solves exactly one task. The trade is that you get to keep the task's inductive bias instead of averaging it away.

Chapter 6 does not stop at node, link and graph level: it covers **six** tasks, adding question answering, anomaly detection and recommendation. Recommendation is filed here as a task, not as a domain, so it does not appear in the domain-specific chapter at all.

## The design principle

Section 6.1 states three requirements, as constraints on any design:

- **Task-specific inductive bias.** Node classification leans on homophily and heterophily — whether neighbouring nodes tend to share a label or not — link prediction on local and global connectivity, graph classification on recognising substructures. The claim is that these biases survive the change of domain even when the structures do not.
- **Cross-domain alignment.** Node types, feature distributions and connectivity patterns all differ between domains, so the representation has to be stable across them without retraining.
- **Balancing generalisation against adaptation.** Push domain invariance too hard and you lose the domain-specific patterns that carry the signal; push adaptation too hard and you overfit one domain. The paper offers domain regularisation, normalisation and adversarial training as the knobs.

<mark>The third requirement is the one every method in the chapter is actually negotiating, and none of them resolves it.</mark>

## Node level

The node-level work splits cleanly by which heterogeneity it attacks.

**Feature space.** The default move is an MLP (multilayer perceptron) that projects each dataset's features into a shared latent space, which fails as soon as features are missing or the feature set itself changes. GCNmf models missing features with a Gaussian mixture and computes the expected activation of the first GNN (graph neural network) layer; PCFI extends this to high missing rates using a channel-wise shortest-path distance to the nearest node with a known feature. GRAFENNE decouples nodes from their attributes through a bipartite encoding, which keeps the parameter count independent of the feature dimension. GraphAny goes furthest: it computes fully inductive features from graph-kernel interactions, so a model trained on one small dataset can be run on graphs with new structures, new features and new label spaces. FUG instead learns an encoder under contrastive constraints that emulates the kind of basis transformation PCA (principal component analysis) performs, so features from different spaces are adapted rather than re-embedded.

**Structure.** GPT-GNN factorises generative pretraining into node-attribute generation and edge generation. GPPT adds a prompt mechanism that rewrites input nodes as pairs fed to a frozen pretrained GNN. SimMLP aligns a context-aware GNN with a neighbourhood-free MLP so that structure ends up inside the MLP — useful when inference latency matters.

**Cross-domain alignment.** GCOPE trains one model on diverse datasets ("all in one and one for all"). GraphControl treats the target graph's own characteristics as conditional inputs in the manner of ControlNet. GraphLoRA aligns source and target feature distributions with a structure-aware maximum mean discrepancy (MMD) and injects a second small GNN during fine-tuning to bridge the structural gap without catastrophic forgetting. MDGFM refines each source domain with graph structure learning before alignment.

**LLMs in the loop.** A separate line uses an LLM (large language model) not as the predictor but as a labeller or a feature source: LLM-GNN annotates a small fraction of nodes and trains a GNN on the rest, LOGIN consults the LLM only on low-confidence nodes, Cella selects representative nodes by label inharmonicity and entropy. The benchmark the paper cites reports the division of labour plainly — LLMs generalise across domains better, GNNs adapt to the task better — which is why LangTopo and Dr.E spend their effort on vector-quantised alignment between the two rather than on either alone. [Attention](../attention-en/) and [message passing](../gnn-en/) are being asked to do different jobs here.

## Link level

The link-level work rests on a vocabulary argument.

Two knowledge graphs share no entities and no relation names. A model whose parameters are indexed by relation identity therefore cannot be run on a new graph at all. ULTRA's answer is to lift the graph into a *graph of relations*, where the nodes are the original relation types and the edges record how those relations interact, then build relation representations as a function of that structure. Nothing in the model refers to a relation by name, so a single pretrained model runs zero-shot on unseen graphs; the paper reports link prediction over 57 different knowledge graphs. UltraQuery carries the same vocabulary independence into complex logical query answering with non-parametric fuzzy logical operators.

The double-equivariance line formalises the same idea — equivariance to node permutation and to relation-type permutation. MTDEA partitions relations into clusters of mutually exchangeable types and trains one model per cluster, assigning new relation types to a cluster at test time. A later theoretical treatment shows that ULTRA and InGram both fall out of one double-equivariant framework, and gives a recipe (ISDEA+) for converting a homogeneous-graph GNN into a double-equivariant one. A parallel analysis of expressive power finds that the ceiling depends on which motifs are used to compute relation representations, and that richer-than-binary motifs raise it.

Elsewhere: KG-ICL builds a query-specific prompt graph and maps its entities and relations through a unifier tokeniser; UniLP learns a universal link predictor that identifies connectivity patterns in an unseen dataset by in-context learning; GraphFormers and Edgeformers interleave GNN layers with transformer blocks so that text on nodes and on edges is read in context.

<mark class="blue">The link-level chapter works because knowledge graphs handed it a clean definition of "the thing that has to transfer" — the relation, not the entity — and nothing else in the paper has an equivalent.</mark>

## Graph level

Here the chapter covers classification, regression and generation.

**Pretraining.** L2P-GNN simulates the fine-tuning process during pretraining, with dual adaptation at node and graph level. Mole-BERT combines masked atom modelling with triplet masked contrastive learning. GROVER puts node-, edge- and graph-level self-supervised tasks on a GNN-plus-self-attention backbone, pretrained with 100 million parameters on 10 million unlabelled molecules. GraphsGPT trains a pure transformer encoder to produce "graph words" and a decoder to rebuild the structure, on 100 million molecules, which makes the same model a classifier and a generator.

**Fine-tuning.** G-Tuning preserves the downstream graph's generative pattern — its graphon — rather than the pretrained weights. GTOT-Tuning poses local knowledge transfer as an optimal transport problem with a structural prior. On the parameter-efficient side, AdapterGNN and G-Adapter insert adapter modules, and GPF injects one learnable prompt vector added to every node feature, with a universality argument attached. All of these report beating full fine-tuning on molecular classification and regression.

**LLM-incorporated and generative.** An early entry simply serialised graphs to text and fine-tuned GPT-2 and GPT-3. GALLON prompts a multimodal LLM for prior knowledge and distils both the GNN and the LLM into a single MLP. GIMLET handles graph and instruction text in one decoupled-attention transformer and decodes every task as a label string, which is what gives it zero-shot reach. UniMoT adds a molecule tokeniser for LLMs. The generation row is DiGress, GraphVAE, GDSS, UniAug and LGGM.

**Few-shot and OOD.** CDFSGC attends to one contextual and two topological views for cross-domain few-shot graph classification; CDTC coordinates source meta-tasks against target prompt tasks with reinforcement learning. AAGOD adds OOD (out-of-distribution) detection to a trained GNN without touching its parameters.

Six of those methods — GROVER, Mole-BERT, GraphsGPT, GIMLET, GALLON and UniMoT — are filed in the domain-specific chapter as well. What puts a model in one chapter rather than the other is how its authors framed the contribution, not a property you could measure from the model.

## The other three tasks

**Question answering (QA).** The pattern is a GNN or a graph index as retriever feeding an LLM as generator. GFM-RAG builds a knowledge-graph index over documents and trains the retriever at scale so it transfers to unseen datasets without fine-tuning; G-Retriever adds a subgraph construction step and ships the GraphQA benchmark (ExplaGraphs, SceneGraphs, WebQSP); GITA renders the graph as an image for a vision-language model; GT2Vec projects graph embeddings into the text embedding space and aligns them contrastively.

**Anomaly detection.** Early work is domain adaptation: Commander uses a domain discriminator, an anomaly classifier and an attribute decoder; ACT jointly optimises contrastive learning over target-graph normal nodes and one-class alignment to labelled source normals. The newer entries are zero- and few-shot. ARC extracts dataset-specific patterns in context from a few normal samples at inference time. AnomalyGFM aligns learnable normal and abnormal prototypes with node-representation residuals, which is what lets it score anomalies in a shared space across datasets.

**Recommendation.** PCRec pretrains a GNN contrastively and fine-tunes with a BPR (Bayesian personalised ranking) loss on the target domain. LLMRec uses an LLM to augment interaction edges, item attributes and user profiles. RLMRec aligns collaborative-filtering embeddings with LLM-side semantic representations. The 2T work pairs a heterogeneous GNN producing general-purpose embeddings with a two-tower component that absorbs the sheer size of the interaction data. The constraints named are scale (platform graphs with billions of nodes), domain-specific interaction semantics, and drifting user interest.

## What I would question

Strip the molecular methods out of the graph-level section and very little is left, so for [molecular property prediction](../mpp-en/) this chapter is not a separate literature to benchmark against — it is the same one with a larger pretraining corpus.

## Summary

| Task | What has to transfer | Representative | The mechanism |
| --- | --- | --- | --- |
| Node | homophily / heterophily patterns | GraphAny, GCOPE, GraphLoRA | inductive features, shared projection, MMD alignment |
| Link | the relation, not the entity | ULTRA, UltraQuery, KG-ICL | relations re-encoded as a graph of relations |
| Graph | a substructure vocabulary | GROVER, Mole-BERT, GraphsGPT | masked atom/edge modelling, codebooks, graph-to-sequence |
| QA | a text interface | GFM-RAG, G-Retriever | trained retriever over a graph index, LLM generator |
| Anomaly | what "normal" looks like | ARC, UNPrompt, AnomalyGFM | prototypes over representation residuals |
| Recommendation | interaction semantics | PCRec, RLMRec, 2T | contrastive pretraining, LLM-side alignment |

- Chapter 6 covers **six** tasks, not three, and recommendation is treated as a task rather than as a domain
- The link-level work has a concrete answer to what has to transfer — the relation, not the entity — and the relation vocabulary is what supplies it
- Six of the headline graph-level methods also appear in the domain-specific chapter, under molecules
- Node-level work still projects features into a shared space and hopes, except for the fully inductive attempts
- The LLM's role across all six tasks is semantic generalisation; the GNN's role is task adaptation. Nothing here merges the two

## References

- Wang et al., [Graph Foundation Models: A Comprehensive Survey](https://arxiv.org/abs/2505.15116), *arXiv* (2025) — the paper reviewed here; chapter 6 is this part
- Galkin et al., [Towards Foundation Models for Knowledge Graph Reasoning](https://arxiv.org/abs/2310.04562), *ICLR* (2024) — ULTRA, the relation-graph lift and zero-shot inference over 57 knowledge graphs
- Zhao et al., [Fully-inductive Node Classification on Arbitrary Graphs](https://arxiv.org/abs/2405.20445), *arXiv* (2024) — GraphAny; new structures, features and label spaces at once
- Rong et al., [Self-Supervised Graph Transformer on Large-Scale Molecular Data](https://arxiv.org/abs/2007.02835), *NeurIPS* (2020) — GROVER, the graph-level entry that is also a molecular model
