---
title: "GFM #7 — Domain-specific models, and why molecules got there first"
date: 2025-08-11
description: "Eight domains, one mature case · what counts as a molecular foundation model · pretrained on 120M atomic systems or 100M SMILES · where the molecular GFMs still fall short · knowledge graphs, temporal, academic, causal"
category: review
updated: 2025-09
lang: en
group: gfm-7-domain-specific
topic: Graphs
venue: arXiv
venueYear: 2025
tags: [review, graph foundation models, molecular ML, pretraining]
---

> Wang, Zehong, et al. "Graph Foundation Models: A Comprehensive Survey." *arXiv*, 21 May 2025, [arxiv.org/abs/2505.15116](https://arxiv.org/abs/2505.15116). Preprint.
> [paper list](https://github.com/Zehong-Wang/Awesome-Foundation-Models-on-Graphs)

<mark class="blue">The paper's own position is that in molecules the unit of meaning is the subgraph, not the atom — stated as a design principle, with no method in its molecular table built that way.</mark>

The other two requirements are task-agnostic representations (multi-task learning, with task interference and negative transfer named as the cost, and task-aware output heads as the mitigation) and interpretability. On interpretability the stated ambition is that a molecular GFM (graph foundation model) might help discover novel functional groups, reaction mechanisms or physicochemical properties. Nothing in the chapter demonstrates this; it is the direction, not a result.

## Molecules: what makes the domain different

The paper lists the properties it says force specialised models.

- **Symmetry.** Molecular representations have to be invariant to rotation, translation and atom permutation.
- **Multiple scales.** Properties come from interactions spanning local functional groups up to global topology.
- **Quantum effects and conformers.** Flexible 3D geometry is not recoverable from 2D connectivity.
- **Scale of the space.** The molecular space is astronomically large, so coverage is never an option.
- **Label cost.** Labels come from experiments. This is the pivotal one: unlabelled molecules are nearly free, labelled ones are not.

## What counts as a molecular foundation model

Table 9 of the paper has 29 entries. They fall into three backbone families, and the families barely share a benchmark.

### Graph-model approaches

**3D and equivariant.** [MACE](../mace-en/) is listed as an equivariant foundation model for atomistic materials chemistry, preserving rotational and translational symmetry. JMP (Joint Multi-domain Pre-training) uses a GemNet-OC backbone and pretrains on roughly **120 million atomic systems** drawn from four sources — OC20 (100M), OC22 (8M), ANI-1x (2M) and Transition-1x (10M) — with energies and forces as the supervision, then fine-tunes across QM9, rMD17, MatBench, QMOF, SPICE and MD22. DPA-2 does multi-task pretraining over 10 million atomic structures with symmetry-preserving GNN (graph neural network) layers plus transformer attention.

**2D and multi-task.** Mole-BERT puts masked-atom modelling and contrastive objectives on a GIN (graph isomorphism network). Graphium runs multi-task learning across quantum-mechanical and bioassay datasets. GROVER merges message passing with global self-attention, pretrained with 100 million parameters on 10 million unlabelled molecules, and reports gains on 11 property-prediction benchmarks.

**Efficiency.** MiniMol keeps a compact GNN with multi-task pretraining over quantum and biological assays, on the argument that a deployable foundation-like model matters more than the last point of accuracy.

### Language-model approaches

Because a molecule linearises — SMILES (simplified molecular-input line-entry system) being the obvious route — the transformer literature arrives directly. GROVER sits on the boundary. DiG, built on a Graphormer-style design, models whole equilibrium conformer distributions rather than a single endpoint. GraphsGPT treats each node and edge as a unit and trains on 100 million molecules. GTFM specialises in ADMET (absorption, distribution, metabolism, excretion and toxicity). Then the pure-text branch: MolecularGPT enriches SMILES prompts with structural neighbour demonstrations, ESMFold runs a protein language model to atomic-resolution structure, GP-GPT maps genomic sequence to phenotype through a Llama-based model, and one entry simply asks whether an LLM (large language model) alone can do zero- and few-shot property prediction. Text2Mol embeds textual queries and chemical representations such as [fingerprints](../descriptors-fingerprints-en/) into a shared space.

### Hybrid approaches

This is the largest group in the table. MolCA and UniMoT push GNN embeddings through a Q-Former into a frozen LLM, producing discrete molecule units that sit alongside text. GIT-Mol goes three-way with graph, text and image. GIMLET handles graph plus instruction in one model. InstructMol and MoleculeSTM use molecule–text contrastive pretraining; MoleculeSTM was trained on a corpus of over 280,000 structure–text pairs and evaluated on zero-shot structure–text retrieval and text-guided molecule editing. CLAMP aligns molecular encoders with bioassay descriptions for zero-shot discovery. ReLM generates candidate products with a GNN and ranks them with an LLM. MolGPS merges an MPNN (message-passing neural network) with transformer modules for scale. GALLON distils a GNN and an LLM into a single MLP (multilayer perceptron) for property prediction. Hybrid-LLM-GNN does crystals. This is the same territory as [multimodal representation](../multimodal-en/) work generally.

## Why molecules are the most mature domain-specific case

The chapter and the rest of the paper give five reasons for it.

1. **The vocabulary problem never arises.** The obstacle that blocks universal GFMs is that two graphs from different domains share no vocabulary. <mark>Molecules share one by construction: the atom types and bond types are the same from molecule to molecule, forever.</mark> A molecular GFM gets for free what the knowledge-graph work had to engineer.
2. **Unlabelled data is abundant and uniform.** Ten million, a hundred million molecules are available without curation, and they are all the same kind of object. Chapter 10.2 of the paper makes the contrast explicit: graphs in general cannot be scraped the way text and images can, because they need human curation.
3. **The scarce thing is labels, which is exactly the regime pretraining helps.**
4. **Supervised multi-task pretraining works here, with numbers.** JMP reports an average 59% improvement over training from scratch and matches or sets state of the art on 34 of 40 downstream tasks.
5. **It is the only domain where scaling has been measured.** Section 8.1.1 confines graph scaling evidence to molecular and atomic systems plus temporal graphs. The paper's own explanation is that these graphs have "naturally predefined structures where individual components carry intrinsic semantics, akin to the structured nature of language with its grammatical rules" — so the condition under which graph scaling has been shown is that the graphs behave like language.

## Where molecular GFMs still fall short

The shortfalls below are mostly reported by way of work the chapter itself cites.

**Pretraining gains are regime-dependent.** The data-centric scaling analysis it cites finds that pretraining helps substantially in low-data regimes and shows diminishing returns in high-data ones, where negative transfer can appear. A pretrained backbone is therefore not free upside, which is what the [transfer learning](../transfer-learning-en/) literature reports as well.

**The modality ranking cuts against the SMILES branch.** In the same analysis, graph-based and fingerprint-based encodings are the most data-efficient, while SMILES-based representations improve least as the dataset grows. Half the molecular table is SMILES-shaped.

**The measured scaling partly comes from the easy split.** Random splits yield the highest data efficiency; scaffold-based and imbalanced splits introduce distribution shift and lower it. The clean power laws are therefore reported where generalisation is least tested.

**Capacity does not follow data size.** The same work finds no straightforward relationship between dataset size and optimal model capacity — in some cases smaller datasets needed larger models.

**The two halves do not share a benchmark.** The atomic-potential half (JMP, MACE, DPA-2) evaluates on QM9, rMD17, MatBench, SPICE, MD22. The property-prediction half (GROVER, Mole-BERT, MiniMol, GALLON) evaluates on MoleculeNet-style classification and ADMET. They cite each other as neighbours and are not comparable as baselines.

**The LLM-based entries are not evaluated as regression.** In the task-alignment column of the molecular table the graph-model rows are mostly "N/A" and the LLM rows are mostly "Explicit - QA", meaning question answering. Those models are scored as text generation. A zero-shot retrieval or captioning result and an ROC-AUC (receiver operating characteristic area under the curve) on a toxicity set are not the same claim, and the table puts them in one column.

**Interpretability is an aspiration.** Discovering new functional groups is stated as a design principle. No row in the table does it.

## The other seven domains, briefly

| Domain | What is pretrained | Status as reported |
| --- | --- | --- |
| Algorithmic graphs | LLMs on reasoning traces; one GNN solver (Triplet-GMPNN) | mostly prompting and benchmarking; GraphArena tracks hallucination |
| Document networks | text encoder + structure (PATTON, ConGraT, GLEM, TAPE, METAG) | works, but it is text-attributed-graph learning more than a foundation model |
| Heterogeneous graphs | SELAR, PT-HGNN, HetGPT; hybrid Heterformer, THLM, HiGPT | per-schema; nothing crosses schemas zero-shot |
| Knowledge graphs | ULTRA, UltraQuery, KG-ICL, higher-order MOTIF | the strongest non-molecular case; genuine zero-shot inductive transfer |
| Temporal graphs | MiNT over 84 networks | pretrain on 64, test on 20 unseen, zero-shot beats per-dataset training |
| Academic networks | LitFM: citation retriever + instruction tuning | one model; targets citation hallucination |
| Causal graphs | Causal-LLM zero-shot pairwise queries | fails on indirect chains; CLEAR shows sensitivity to phrasing and to node degree |

**Algorithmic graphs** are where the LLM-as-graph-reasoner literature lives: GraphWiz produces step-by-step traces, GCoder synthesises executable programs with compiler feedback as reward, PIE stages understand–design–execute, and a theoretical result shows logarithmic-depth transformers capture long-range graph dependencies better than fixed-depth transformers or GNNs on certain problems. **Temporal graphs** give the second scaling result in the paper: MiNT's performance improves consistently with the number of training networks, which is the cleanest "more data helps" curve here outside chemistry. **Causal graphs** carry the most qualified claims: the benchmark shows performance dropping on high-degree nodes and long paths, and results shifting with phrasing and context order.

## What I would question

The design principle quoted at the top — that molecular semantics live at the subgraph level, because aromatic rings and functional groups are preserved there and atom-level operations break them — is the argument for a [junction-tree](../jtvae-en/) view written down by people with no stake in it, and not one of the 29 entries in the molecular table is built that way. I would also not spend much on the scaling curves until they are rerun on a [scaffold split](../data-splitting-en/).

## Summary

- Eight domains; **molecules and knowledge graphs are the only two with real zero-shot or cross-dataset transfer results**
- Molecular GFMs pretrain on either ~120M atomic systems with energy/force labels or ~10–100M unlabelled 2D molecules; these are different literatures with different benchmarks
- Molecules are mature because chemistry supplies a shared vocabulary for free, not because the methods are better than elsewhere
- The scaling and transfer numbers come with caveats the paper reports and then sets aside: regime dependence, modality dependence, and random splits
- The paper states that molecular semantics live at the subgraph level, and no entry in its molecular table is built on a subgraph-level view

## References

- Wang et al., [Graph Foundation Models: A Comprehensive Survey](https://arxiv.org/abs/2505.15116), *arXiv* (2025) — the paper reviewed here; chapter 7 is this part
- Shoghi et al., [From Molecules to Materials: Pre-training Large Generalizable Models for Atomic Property Prediction](https://arxiv.org/abs/2310.16802), *ICLR* (2024) — JMP; ~120M systems, 59% average improvement over scratch, 34/40 tasks
- Liu et al., [Multi-modal Molecule Structure-text Model for Text-based Retrieval and Editing](https://arxiv.org/abs/2212.10789), *Nat. Mach. Intell.* (2023) — MoleculeSTM; 280k structure–text pairs, zero-shot retrieval and editing
- Rong et al., [Self-Supervised Graph Transformer on Large-Scale Molecular Data](https://arxiv.org/abs/2007.02835), *NeurIPS* (2020) — GROVER; 100M parameters on 10M unlabelled molecules
- Chen et al., [Uncovering Neural Scaling Laws in Molecular Representation Learning](https://arxiv.org/abs/2309.15123), *NeurIPS* (2023) — the modality, split and capacity caveats cited above
