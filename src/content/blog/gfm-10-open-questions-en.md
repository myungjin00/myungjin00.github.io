---
title: "GFM #10 — What is still unsolved"
date: 2025-08-11
description: "Scalability named precisely: backbone, objective granularity, learning unit · graphs cannot be scraped · there is no GLUE for graphs · the application nobody can name · pattern conflict as the sharpest obstacle · and chapter 11 read as a plan rather than a result."
category: review
updated: 2025-09
lang: en
topic: Graphs
venue: arXiv
venueYear: 2025
group: gfm-10-open-questions
tags: [review, graph foundation models, evaluation, scaling, pattern conflict]
---

> Wang, Zehong, et al. "Graph Foundation Models: A Comprehensive Survey." *arXiv*, 21 May 2025, [arxiv.org/abs/2505.15116](https://arxiv.org/abs/2505.15116). Preprint.
> [paper list](https://github.com/Zehong-Wang/Awesome-Foundation-Models-on-Graphs)

**Series** · [#1 Introduction](../gfm-1-introduction-en/) · [#2 Background](../gfm-2-background-en/) · [#3 Challenges](../gfm-3-challenges-en/) · [#4 Framework](../gfm-4-framework-en/) · [#5 Universal](../gfm-5-universal-en/) · [#6 Task-specific](../gfm-6-task-specific-en/) · [#7 Domain-specific](../gfm-7-domain-specific-en/) · [#8 Theory](../gfm-8-theory-en/) · [#9 Datasets](../gfm-9-datasets-en/) · #10 Unsolved

Chapter 10 has five headings: scalability, data scarcity, evaluation, utilisation and theory. The abstract's "structural alignment" and "heterogeneity" are not among them. Heterogeneity is [chapter 3](../gfm-3-challenges-en/), and structural alignment appears as a column in every method table plus a theory subsection called pattern conflict.

## Scalability, named precisely

Chapter 10.1 identifies three requirements rather than calling for more compute.

**Backbones.** GNNs (graph neural networks) bring over-smoothing, over-squashing, inadequate long-range dependency modelling and limited substructure expressiveness, and the chapter says these hinder both model scalability and efficient multi-GPU training. Graph transformers are the obvious alternative: basic ones tokenise a graph into node sequences, which is quadratic and therefore confined to small graphs. The proposed route is to use substructures as the sequence unit instead of nodes, which cuts encoding cost — the same idea that reappears whenever anything in this paper has to be made to scale.

**Pretraining objectives.** NLP (natural language processing) and vision scaled on generative pretraining. Graph self-supervision is mostly contrastive, and where graph reconstruction objectives exist they target low-level semantics — individual nodes and edges — whereas a language model reconstructs word units and a vision model reconstructs image patches, both of which preserve higher-level semantics. The chapter's conclusion is that existing generative graph methods therefore fail to beat contrastive ones, and that the fix is to reconstruct high-level semantic structures.

**Learning instances.** It is not settled what should be scaled. Sentences are made of word units and images of patches; graphs could be scaled by nodes, edges or whole graphs, and different task levels point at different choices. Subgraphs and trees are proposed as unified instances, with the question left open of whether scaling them buys cross-task knowledge at all.

Those three are consistent with each other and with [chapter 8](../gfm-8-theory-en/): the backbone, the objective and the unit all come back to the same missing vocabulary.

## Data scarcity

Text and images are scrapeable; graphs generally are not, because an edge encodes a relationship somebody had to assert. Three directions are offered.

| Direction | What it proposes | The stated limitation |
| --- | --- | --- |
| Automated collection | pipelines driven by an LLM (large language model), extracting structured relations from academic, biomedical and knowledge-graph sources | graph construction normally needs human curation |
| Synthetic generation | graph diffusion for structural diversity, language models for text attributes on text-attributed graphs | preserving structural and semantic integrity is unsolved |
| Quality over volume | the LLM-pretraining finding that a small high-quality set can match a large low-quality one | graph datasets are typically incomplete, and no quality metric for graph data exists |

The last limitation is circular: data valuation techniques exist, but quality for graph data depends on the backbone and pretraining strategy you were going to choose using it.

## Evaluation: there is no GLUE for graphs

Chapter 10.3 lists three problems with existing benchmarks: they lack transformative real-world applications, they are built in ways that do not meaningfully reflect practical use, and the graph community's benchmarking culture has been criticised for inconsistency and reproducibility. [Chapter 9](../gfm-9-datasets-en/) catalogues datasets by domain and task and defines no protocol — no fixed splits, no fixed adaptation budget, no fixed metric per task.

The consequence is structural, not cosmetic. A universal GFM (graph foundation model), a task-specific graph-level GFM and a domain-specific molecular GFM can all report on partly overlapping datasets using different splits, different numbers of labelled examples at adaptation time, and different metrics. <mark>Cross-paper numbers in this review are not comparable, and no amount of care in reading them fixes that.</mark> The fields that have a GLUE (General Language Understanding Evaluation) have it because someone froze the splits and the metric and took submissions.

Six methods — GROVER, Mole-BERT, GraphsGPT, GIMLET, GALLON, UniMoT — appear in both the task-specific graph-level table and the domain-specific molecular table, and the axis that separates the two tables is each paper's framing of its own contribution.

Chapter 10.3 also asks for evaluation beyond accuracy — generalisation across domains, robustness to adversarial and noisy data, trustworthiness in high-stakes use, interpretability, ethics. None of it is measured anywhere in the paper; all of it is stated as a requirement for future benchmarks.

## Utilisation, and the application nobody can name

Chapter 10.4 announces three aspects and then gives four subheadings, the fourth being human-in-the-loop.

**Adaptation** is still not free: graph prompt learning exists but requires fine-tuning the prompt tokens to the downstream task, so the zero-update promise is not kept. The direction offered is the vision-model analogy — large visual models handle diverse tasks autoregressively with no language interface — extended to graphs.

**Applications** contains the most self-critical sentence in the paper. GFMs have shown success in social network analysis, drug property prediction and recommendation, and those tasks "can often be addressed effectively using traditional graph learning models, reducing the necessity for a GFM." The candidates offered for an application that would genuinely need one are chip design, combinatorial optimisation and relational databases. None is demonstrated. After 93 pages the killer application is a to-do item.

**Multimodal knowledge** is posed as a question rather than a plan: a molecule is a graph, a sequence, a text description and sometimes an image, and it is not settled whether one unified model should handle all modalities or whether modality-specific models should be kept.

**Human-in-the-loop** names drug discovery, recommendation and scientific workflows as the places where iterative expert feedback is needed for interpretability and control.

## Theory: pattern conflict is the sharpest obstacle

Chapter 10.5 has four items.

Transferability is restated from chapter 8: graphs encode complex, often manually defined relationships, so transferable knowledge is less intuitive than in text or images, and treating graphs purely as compositions of trees loses structural information.

<mark class="blue">Pattern conflict is the sharpest single obstacle in the paper: the same structural pattern carries different semantics in different domains, so pretraining across them teaches a representation that is wrong in one of them.</mark> The worked example is the triangle — stability in a social network, "the friend of my friend is my friend", against instability under chemical constraints in a molecular graph. On the fixes the chapter is blunt: existing methods "either fail to address or only partially mitigate" it.

Robustness and trustworthiness lists what real graphs actually look like — long-tail distributions, incompleteness, class imbalance, few labels, structural alterations — and asks for stability analysis under structural distribution shift. Generalisation notes that bounds have been established for subtree-based learning units and that an analysis beyond tree structures is needed.

The structural-alignment column sits alongside this. Its values across every method table are Data-Augment, Loss-Pretrain, Loss-Multi-task, Model-Projection, Model-Codebook, Model-Prompt-Learning, Model-Structure-Learning, and N/A — one taxonomy of interventions, reused across node, link, graph, molecular, knowledge-graph and temporal methods.

## Chapter 11: the conclusion is a programme

The conclusion is explicitly forward-looking. GFMs are described as "aspiring to replicate the success of foundation models in natural language processing and computer vision"; the open challenges named are scalability to massive graphs, multimodal integration, principled evaluation protocols and theoretical foundations; and the closing paragraph says the field "should focus on" scalable, interpretable and adaptable architectures, larger pretraining corpora and better theory, because GFMs "hold immense promise". Those are forward-looking verbs throughout, and the paper does not claim arrival.

## What I would question

Evaluation is the failure I would put first, because without frozen splits and metrics the other four claims cannot be falsified. The one line I would act on is in 10.1 — if generative pretraining underperforms because it reconstructs nodes and edges rather than high-level semantic units, that is an argument for masking substructures instead of atoms, a ring or a scaffold or a [junction-tree](../jtvae-en/) node.

## Summary

| Claim in the abstract | What chapters 10 and 11 actually show |
| --- | --- |
| Transferability has theoretical foundations | three candidate vocabularies, each with a disqualifying catch; pattern conflict unsolved |
| Scaling and emergence | the trend "has yet to emerge in existing GFMs", in the paper's own words |
| Evaluation is a challenge | no protocol exists, so cross-paper numbers cannot be compared |
| Scalability is a challenge | named precisely: backbone, reconstruction granularity, choice of learning unit |
| GFMs have real applications | existing wins "can often be addressed" by ordinary graph models |

- Scalability has three named requirements, and all three converge on the missing shared vocabulary
- Graphs cannot be scraped, there is no quality metric for graph data, and quality depends on the model you were going to pick with it
- The absence of a shared benchmark protocol is not a gap in the review; it is a gap in the field that the review faithfully reports
- Pattern conflict is the obstacle the paper treats most bluntly, and the methods barely touch it
- Chapter 11 is a programme statement, and says so in its verbs

## References

- Wang et al., [Graph Foundation Models: A Comprehensive Survey](https://arxiv.org/abs/2505.15116), *arXiv* (2025) — the paper reviewed here; chapters 10 and 11 are this part
- Ma et al., [Do Neural Scaling Laws Exist on Graph Self-Supervised Learning?](https://arxiv.org/abs/2408.11243), *arXiv* (2024) — the evidence behind the scalability section's doubts about graph self-supervised learning
- Wang et al., [Towards Graph Foundation Models: Learning Generalities Across Graphs via Task-Trees](https://arxiv.org/abs/2412.16441), *ICML* (2025) — task-trees as the unified learning instance the chapter proposes
- Sun et al., [All in One: Multi-task Prompting for Graph Neural Networks](https://arxiv.org/abs/2307.01504), *KDD* (2023) — the graph prompt learning that still needs its prompt tokens tuned
- Galkin et al., [Towards Foundation Models for Knowledge Graph Reasoning](https://arxiv.org/abs/2310.04562), *ICLR* (2024) — the one domain where the zero-shot promise is kept, and why
