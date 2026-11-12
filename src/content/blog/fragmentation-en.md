---
title: "Taking a molecule apart: scaffolds, BRICS, functional groups, junction trees"
date: 2025-06-20
description: "Why break a molecule up at all · Murcko scaffolds, BRICS, RECAP, functional groups and junction trees on one molecule · the distinction that matters — cutting versus rewriting · which scheme each downstream task needs · why the fragment vocabulary explodes"
category: concept
updated: 2025-07
lang: en
group: fragmentation
topic: Cheminformatics
subtopic: Representation
tags: [BRICS, Murcko scaffold, junction tree, molecular representation]
---

A molecule is a graph of atoms, and a model can read it that way. But atoms are the wrong unit for several jobs: a chemist thinks in **groups**, a synthesis plan is written in **fragments**, and a model that reports "atom 14 mattered" has explained nothing. So most of cheminformatics has some scheme for chopping a molecule into larger pieces — and the schemes are not interchangeable.

## Five schemes on one molecule

<figure>
<img src="/assets/fig/fragmentation.svg" alt="One molecule and the real output of all five schemes: Murcko scaffold, BRICS, RECAP, functional groups and a junction tree" loading="lazy" />
<figcaption><b>What each one hands back.</b> All five schemes run with RDKit on the same 28-atom molecule. The Murcko scaffold is one piece of 27 atoms; BRICS returns six fragments, RECAP four — the numbered <code>*</code> on the BRICS pieces is its attachment-point type, which records what each cut was so the fragments can be recombined legally. The functional-group row highlights rather than cuts. Only the junction tree keeps the whole molecule: 17 nodes, 16 edges, every ring collapsed to one node and every atom shared by three or more cliques given a node of its own.</figcaption>
</figure>

| Scheme | Returns | Rule | Keeps the whole? |
| --- | --- | --- | --- |
| Murcko scaffold | 1 piece, 27 of 28 atoms | strip side chains, keep rings and the linkers between them | no |
| BRICS (breaking of retrosynthetically interesting chemical substructures) | 6 fragments, 6 bonds cut | cut only at bonds a chemist could re-form | no |
| RECAP (retrosynthetic combinatorial analysis procedure) | 4 fragments | the same idea, 11 simpler rules | no |
| functional groups | amide ×1, sulfonamide ×1, benzene ×3 | the groups that carry the chemistry | no |
| junction tree | 17 nodes, 16 edges | every ring and every non-ring bond becomes a node | **yes** |

## Cutting versus rewriting

Read the last column again. <mark class="blue">Four of these **cut** the molecule; the junction tree **rewrites** it.</mark>

After BRICS you hold six disconnected fragments, and whatever the whole molecule was doing is gone — a model given the pieces cannot recover how they were arranged. That is the cost [HDN-DDI](../hdn-ddi-en/) is written against, and its answer is to keep the levels in one graph.

A junction tree does something different: each ring and each bond becomes a node, overlapping atoms become the edges, and the result is a **tree covering the same molecule**. Nothing is thrown away, and the cycles are gone — which is the point, because a tree is far easier to generate one node at a time than a graph with rings in it.

## What each is actually used for

| Task | Scheme | Why |
| --- | --- | --- |
| scaffold split for a benchmark | Murcko | groups analogues so the test set is new chemistry — see [evaluation](../evaluation-protocol-en/) |
| fragment-based library design | BRICS / RECAP | the fragments can be recombined into synthesisable molecules |
| generative models over graphs | junction tree | generate a tree, then expand each node back into its ring |
| interpretability at a chemist's level | functional groups | "the sulfonamide mattered" is a sentence; "atom 14 mattered" is not |
| a second view for contrastive learning | junction tree | two views of the same molecule, so a positive pair comes for free |

The last row is what I use in [SJoINT](https://github.com/sslim-aidrug/SJoINT): the atom graph and the junction tree are the two views, and because they are two descriptions of one molecule rather than two augmentations, the positive pair involves no perturbation at all.

**RelMole** is worth knowing as the scheme between those last two rows: it builds a two-level graph where the upper level is **functional groups** rather than ring/bond cliques, and learns by comparing molecules at both levels. Same instinct as a junction tree, different choice of what a node should be.

## Where it gets awkward

- **BRICS refuses to break rings, on purpose.** A fused polycyclic drug comes out as one enormous fragment. Anyone using BRICS for a model has to add a ring-splitting step afterwards — which is exactly what HDN-DDI does.
- **The vocabulary explodes.** Junction-tree models need a fixed vocabulary of node types, and a corpus of a few hundred thousand molecules produces a long tail of rings seen once. ZINC250k gives roughly 1,750 entries at a sensible cut-off; everything rarer becomes `<UNK>`, and those are the interesting molecules.
- **Attachment points carry information.** `[16*]c1ccccc1` and a bare benzene are not the same fragment. Dropping the `*` labels loses what the cut was.
- **Scaffold is not one definition.** Murcko, generic Murcko (atom types erased), and "scaffold" as a medicinal chemist uses it are three different things, and benchmark splits disagree about which they mean.
- **Functional-group detection is a rule set, not a fact.** Different implementations disagree on the edges, so two papers reporting "the sulfonamide" may be using different definitions of one.

## Summary

- Atoms are the wrong unit for synthesis, interpretation and generation, so most pipelines chop molecules into larger pieces
- **Murcko** keeps rings and linkers; **BRICS/RECAP** cut at re-formable bonds; **functional groups** take chemically meaningful units
- The real split is **cutting versus rewriting**: a junction tree keeps the whole molecule and removes the cycles instead
- Scaffold → benchmark splits · BRICS → fragment libraries · junction tree → generation and dual-view learning · functional groups → interpretation
- BRICS leaves rings intact by design, so a ring-splitting step is usually needed after it
- A junction-tree vocabulary has a long tail; rare rings become `<UNK>` and those are often the molecules you care about

## References

- Bemis & Murcko, [The properties of known drugs. 1. Molecular frameworks](https://doi.org/10.1021/jm9602928), *J. Med. Chem.* (1996)
- Degen et al., [On the art of compiling and using drug-like chemical fragment spaces](https://doi.org/10.1002/cmdc.200800178), *ChemMedChem* (2008) — BRICS
- Jin, Barzilay & Jaakkola, [Junction tree variational autoencoder for molecular graph generation](https://arxiv.org/abs/1802.04364) (ICML 2018)
- Ertl, [An algorithm to identify functional groups in organic molecules](https://doi.org/10.1186/s13321-017-0225-z), *J. Cheminform.* (2017)
