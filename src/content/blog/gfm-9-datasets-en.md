---
title: "GFM #9 — Dataset resources: what the catalogue contains and what it leaves out"
date: 2025-08-11
description: "Forty-five datasets across eight domains, sorted by task · the six benchmark collections they come from · no 3D or quantum sets, no regression, no rows for half of chapter 6's tasks · and a node count that means two different things · the chapter lists data and fixes no protocol."
category: review
updated: 2025-09
lang: en
topic: Graphs
venue: arXiv
venueYear: 2025
group: gfm-9-datasets
tags: [review, graph foundation models, benchmarks, datasets, evaluation]
---

> Wang, Zehong, et al. "Graph Foundation Models: A Comprehensive Survey." *arXiv*, 21 May 2025, [arxiv.org/abs/2505.15116](https://arxiv.org/abs/2505.15116). Preprint.
> [paper list](https://github.com/Zehong-Wang/Awesome-Foundation-Models-on-Graphs)

**Series** · [#1 Introduction](../gfm-1-introduction-en/) · [#2 Background](../gfm-2-background-en/) · [#3 Challenges](../gfm-3-challenges-en/) · [#4 Framework](../gfm-4-framework-en/) · [#5 Universal](../gfm-5-universal-en/) · [#6 Task-specific](../gfm-6-task-specific-en/) · [#7 Domain-specific](../gfm-7-domain-specific-en/) · [#8 Theory](../gfm-8-theory-en/) · #9 Datasets · [#10 Unsolved](../gfm-10-open-questions-en/)

**What chapter 9 contains and what it omits** both bear on [chapter 10's](../gfm-10-open-questions-en/) complaint about evaluation: 45 datasets with a task column and a source column, and no column for a split, a metric or an adaptation budget.

## What is in the table

Table 14 lists roughly forty-five datasets across eight domains, with columns for domain, task, node count, edge count, class count, graph count, whether text attributes are present, and the source collection.

| Domain | Rows | Task levels | Text attributes | Representative entries |
| --- | --- | --- | --- | --- |
| E-commerce | 7 | node, link | yes | Products (316,513 nodes / 19.3M edges), Photo, Computer, Ratings |
| Academia | 6 | node, link | yes | Arxiv, Cora, Citeseer, Pubmed, DBLP |
| Knowledge base | 8 | link | yes | WN18RR, FB15K237, Codex at three sizes, NELL995, ICEWS1819 |
| Molecule | 15 | graph | mixed | Chemblpre, PCBA, HIV, BBBP, BACE, Tox21, ToxCast, MUV, CYP450, ZINC, MUTAG, ENZYMES |
| Temporal | 2 | link | yes | Enron, Googlemap CT |
| Social network | 5 | node, link, graph | mixed | Reddit, Flickr, MovieLens, IMDB-BINARY, IMDB-MULTI |
| Brain graph | 1 | link | no | ogbl-vessel (3.5M nodes) |
| Images | 1 | graph | no | Fingerprint |

Two structural facts stand out in that distribution. Molecules are the largest block, and knowledge bases are the only domain that is link-only. Both match where chapter 7 found transfer results.

## Three tasks, and only three

The chapter's task section covers **node classification**, **link prediction** and **graph classification**, with one paragraph each.

Node classification needs effective encoding of both node features and neighbourhood structure. Link prediction has to model node similarity from structural proximity and feature compatibility together, often through embeddings that capture higher-order connectivity, and is the task behind recommendation and knowledge-base completion. Graph classification needs graph-level representations that preserve local substructure and global topology at once, usually through hierarchical pooling, and the chapter notes that how well it works depends on identifying the discriminative subgraphs inside a larger structure.

<mark>Three tasks, all classification or link prediction, is the entire task vocabulary of the dataset chapter — while chapter 6 reviewed methods for six tasks and chapter 7 for eight domains.</mark>

## The eight domains, as the chapter characterises them

Each domain paragraph names the structural property that makes the domain hard rather than only saying what the nodes are.

| Domain | The structural property the chapter names |
| --- | --- |
| E-commerce | heterogeneous, with multiple edge types: co-purchase, co-view, semantic similarity |
| Academia | temporal evolution, since citations accumulate and research trajectories shift |
| Knowledge bases | ontological constraints and hierarchy, which are useful inductive biases for reasoning |
| Molecular science | strong regularity in degree and edge formation, from the physical constraints of bonding |
| Temporal graphs | longitudinal structural transitions |
| Social networks | high clustering coefficients, small-world behaviour, scale-free degree distributions |
| Brain graphs | multi-scale organisation, from neuronal circuits to regions linked by white-matter tracts |
| Images | spatial relationships, turning grid-structured data into irregular graphs |

The molecular line is the one that connects back to [chapter 8](../gfm-8-theory-en/): bonding constraints are exactly why molecular graphs count as "well-structured", which is the condition under which graph scaling has actually been measured.

## The source collections

Six collections supply almost everything in the table.

- **Text-space graph foundation models** — 13 text-attributed benchmarks, from Products at 316K nodes down to Cora, for node and link prediction
- **Knowledge base benchmarks** — text-enhanced versions of WN18RR and FB15K237 for semantic link prediction
- **Temporal graph benchmarks** — evolving datasets such as ICEWS1819
- **TAGLAS** — text-attributed molecular datasets, Chemblpre and PCBA among them, with hundreds of thousands of graphs
- **Graph pattern recognition** — structure-only benchmarks such as ENZYMES and MUTAG, for topology comprehension without text
- **Special-purpose sets** — brain connectivity (ogbl-vessel), recommendation (MovieLens), social networks (Reddit, Flickr)

Five of the six are built around text attributes or explicitly about their absence, which matches the literature reviewed in chapters 5 and 6 rather than the literature in chapter 7.

## What the catalogue leaves out

The gaps are not random.

**No 3D or quantum datasets.** QM9, OC20, ANI-1x, rMD17, SPICE, MD22 and MatBench carry the entire scaling argument of chapter 8 and the whole atomic-potential half of chapter 7. None of them has a row here. The one domain where scaling was measured is the one whose data is missing from the data chapter.

**No regression.** Every task in the table is node classification, link prediction or graph classification. The molecular rows are all classification sets, so the regression endpoints that much of [molecular property prediction](../mpp-en/) actually consists of — solubility, lipophilicity, free energy — are absent, along with ClinTox and SIDER.

**Half of chapter 6's tasks have no data.** Graph generation, question answering and anomaly detection get no rows at all, and recommendation appears only as MovieLens, filed under social networks. The GraphQA benchmark that chapter 6 describes in detail is not listed.

**Four of chapter 7's domains have no rows.** Heterogeneous graphs, document networks, algorithmic graphs and causal graphs are reviewed as domains and have no entries.

**The node count means two different things.** Rows from TAGLAS report aggregate totals across a whole collection of graphs — ToxCast at 161,002 nodes and 330,180 edges over 8,575 graphs — while rows from the pattern-recognition benchmark report per-graph averages, marked with a tilde: ZINC at about 20 nodes and 22 edges over 12,000 graphs. ToxCast in fact appears twice, once each way. A reader comparing column values down the table is comparing two different quantities.

**ENZYMES is filed under Molecule**, which is a protein dataset in a chemistry row.

## No protocol

The table has a column for the task and a column for the source. It has no column for the split, none for the metric, and none for how many labelled examples a model is allowed at adaptation time.

That is the finding. <mark class="blue">A dataset catalogue without a protocol cannot make two papers comparable, and chapter 9 does not claim to.</mark> Chapter 10 then criticises the graph community's benchmarking culture for inconsistency and reproducibility problems — a criticism the preceding chapter would have answered had it frozen anything.

## What I would question

For a dual-view molecular model the practical consequence is narrow but real: there is no row here I could adopt as given, so the protocol has to be fixed locally and reported, which is what my own [evaluation protocol](../evaluation-protocol-en/) note is about.

## Summary

- About 45 datasets across 8 domains; molecules are the largest block and knowledge bases the only link-only domain
- Three tasks only — node classification, link prediction, graph classification — against chapter 6's six tasks and chapter 7's eight domains
- Six source collections, five of which are organised around the presence or absence of text attributes
- The 3D and quantum datasets that carry chapter 8's scaling result are not in the catalogue
- No regression targets anywhere, so the molecular rows cover only classification
- The node and edge columns mix aggregate totals with per-graph averages, and ToxCast appears once in each convention
- No split, no metric, no adaptation budget: the chapter fixes no protocol, which is the premise of the evaluation argument in [part #10](../gfm-10-open-questions-en/)

## References

- Wang et al., [Graph Foundation Models: A Comprehensive Survey](https://arxiv.org/abs/2505.15116), *arXiv* (2025) — the paper reviewed here; chapter 9 is this part
- Chen et al., [Text-space Graph Foundation Models: Comprehensive Benchmarks and New Insights](https://arxiv.org/abs/2406.10727), *arXiv* (2024) — the 13 text-attributed benchmarks that supply most of the node and link rows
- Feng et al., [TAGLAS: An atlas of text-attributed graph datasets in the era of large graph and language models](https://arxiv.org/abs/2406.14683), *arXiv* (2024) — the molecular rows, and the aggregate-count convention
- Galkin et al., [Towards Foundation Models for Knowledge Graph Reasoning](https://arxiv.org/abs/2310.04562), *ICLR* (2024) — the source of the text-enhanced knowledge-base entries
