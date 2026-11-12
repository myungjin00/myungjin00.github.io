---
title: "HierVAE: generating molecules a phrase at a time"
date: 2024-04-11
description: "JT-VAE's pieces are rings and bonds, so a polymer takes ~70 decoding steps · errors accumulate across steps · motifs mined from the data instead · coarse-to-fine decoding in three layers · a polymer in 11 steps"
category: review
updated: 2024-05
lang: en
topic: Cheminformatics
subtopic: Representation
venue: ICML
venueYear: 2020
group: hiervae
tags: [review, generative models, motifs, molecular representation]
---

> Jin, Wengong, et al. "Hierarchical Generation of Molecular Graphs using Structural Motifs." *arXiv*, 8 Feb. 2020, [arxiv.org/abs/2002.03230](https://arxiv.org/abs/2002.03230). Preprint.
> [code](https://github.com/wengong-jin/hgraph2graph)

Same authors as [JT-VAE (junction tree variational autoencoder)](../jtvae-en/), two years later, aimed at what JT-VAE could not do.

## Why the earlier models break on large molecules

The two existing families — build the molecule atom by atom, or build it out of ring-and-bond substructures — both work on small molecules and fall apart on large ones. The paper's argument is the step count, for a polymer of roughly eighty atoms:

| Method | Steps to build one large molecule |
| --- | --- |
| CG-VAE (constrained graph variational autoencoder, atom-based) | ~70 atom predictions + ~150 bond predictions |
| [JT-VAE](../jtvae-en/) (substructure-based) | ~35 substructure predictions + ~35 attachment predictions |
| **HierVAE** (motif-based) | **11** |

<mark class="blue">Each step is a chance to be wrong, and the errors do not cancel — they accumulate, and the gradient has to travel back through all of them.</mark> That is why reconstruction accuracy collapses on polymers and peptides while looking fine on drug-like molecules.

JT-VAE has a second, specific problem at scale. Its decoder assembles a substructure's whole neighbourhood **in one go**, so the number of candidate attachments grows combinatorially as the pieces get larger. Small rings make that tractable; anything bigger does not.

## The generation unit: atoms, substructures, motifs

The paper frames the generation unit by analogy with language:

| Generation unit | Language analogue |
| --- | --- |
| atom | character |
| substructure — a ring or a bond | word |
| **motif** — flexible, can span several rings | **phrase** |

In JT-VAE a piece is *by definition* a single ring or a single bond, rarely more than six atoms. A motif is whatever the data says recurs: a ring fused to another ring, a ring with its substituent, a repeating polymer unit.

<figure>
<img src="/assets/fig/hiervae-motif.png" alt="Extracting structural motifs from a molecule" width="870" height="392">
<figcaption><b>Motif extraction.</b> Motifs are mined from the training set rather than fixed by a rule, so the vocabulary adapts to the chemistry at hand — small rings for drug-like molecules, repeating units for polymers.
<br><span class="credit">Jin, Barzilay &amp; Jaakkola, <a href="https://arxiv.org/abs/2002.03230">Hierarchical Generation of Molecular Graphs using Structural Motifs</a>, ICML 2020 &#183; paper figure, Figure 2</span></figcaption>
</figure>

The paper's claim is that large molecules are **built from repeated motifs** — that is what makes a polymer a polymer — so matching the generation unit to that structure is what collapses seventy steps into eleven.

## Coarse to fine, in three layers

<figure>
<img src="/assets/fig/hiervae-encoder.png" alt="The hierarchical encoder: atom layer, attachment layer, motif layer" width="1134" height="1196">
<figcaption><b>The hierarchy.</b> A molecule is represented at three levels at once — motifs, the attachment configurations between them, and the atoms — and both encoding and decoding move between the levels rather than working at one.
<br><span class="credit">Jin, Barzilay &amp; Jaakkola, <a href="https://arxiv.org/abs/2002.03230">Hierarchical Generation of Molecular Graphs using Structural Motifs</a>, ICML 2020 &#183; paper figure, Figure 3</span></figcaption>
</figure>

Decoding splits into three layers:

1. **Motif layer** — which motif comes next.
2. **Attachment layer** — which atoms of that motif are the connection points.
3. **Atom layer** — the actual bonds that realise the attachment.

JT-VAE had two of these collapsed into one combinatorial assembly step. Splitting attachment out as its own prediction is what makes large motifs usable: the model no longer has to enumerate every way two big fragments could join, it predicts the attachment points and then the bonds.

This is also the hybrid the paper advertises — motifs give the speed of substructure methods, the atom layer gives the precision of atom-based ones.

## What it was tested on, and against what

Two tasks, chosen so the claim is tested at both ends of the size range.

**Polymers**, the case the motif argument is really about: 86K polymers from St. John et al.,
split 76K / 5K / 5K. Motif extraction on that corpus yields **436 motifs**, each with 5.24
attachment configurations on average — a vocabulary, built from data rather than from a ring rule.
Baselines are SMILES VAE, CG-VAE (atom by atom) and JT-VAE (rings and bonds).

| | reconstruction | validity | logP Frechet | MW Frechet |
| --- | --- | --- | --- | --- |
| SMILES VAE | 21.5% | 93.1% | 1.471 | 4963 |
| CG-VAE | 42.4% | 100% | 3.958 | 3944 |
| [JT-VAE](../jtvae-en/) | 58.5% | 100% | 2.645 | 10867 |
| **HierVAE** | **79.9%** | 100% | **0.525** | **1928** |
| · small motifs only | 71.0% | 100% | 0.872 | 5320 |

<mark>Reconstruction goes 58.5% → 79.9%, and the ablation is the row that carries the argument:
keep the whole architecture, swap the large motifs for rings and bonds, and it drops to 71.0%.</mark>
The gain is the vocabulary, not the hierarchy.

**Small molecules**, where the paper has to show it did not simply trade one regime for another.
On the four graph-translation tasks it is ahead but not dramatically — QED success 76.9% against
AtomG2G's 73.6%, DRD2 85.9% against the best baseline's 77.8% — and on logP at sim ≥ 0.4 it ties AtomG2G at 3.98.
Motifs stop paying when the molecule is small enough that rings and bonds were already a
reasonable unit.

## What I would question

- **The vocabulary problem is relocated, not solved.** JT-VAE's ceiling was a fixed set of rings; HierVAE's is a fixed set of motifs mined from the training set. Bigger pieces mean a *larger* and *sparser* vocabulary, so the long tail gets longer. The paper gains by matching the vocabulary to the domain, which also means the vocabulary is domain-specific — a polymer model's motifs are not a drug model's motifs.
- **Step count is the stated mechanism and it is reported on one example.** Eleven steps for one polymer is a striking number. The claim being made is general, and a distribution of step counts across the test set would support it better than an illustration.
- **Motif extraction is a preprocessing choice that carries real weight.** Where motifs come from determines what the model can express, and it sits outside the learned part of the system — it is tuned, not trained.

## How I read the pair

JT-VAE and HierVAE are the same idea at two granularities, and the sequence shows what the junction tree was really doing. The tree was never the point; **choosing a unit larger than the atom** was the point, and the tree was the bookkeeping that made it safe. Once you see that, the natural question is how large the unit should be, and HierVAE's answer is: large enough that the number of steps stays small, learned from the data rather than fixed by a rule.

For representation work the trade-off reverses, which is why I use JT-VAE's decomposition and not this one in [SJoINT](https://github.com/sslim-aidrug/SJoINT). A generator wants few, large units because each step risks an error. A representation wants units that recur across the corpus so the embedding of a unit means something — and small, rigid rings recur far more than large motifs do.

## Summary

- Atom-based and substructure-based generation both fail on large molecules because the step count is large and errors accumulate
- JT-VAE additionally cannot assemble a large substructure's neighbourhood: the candidate attachments grow combinatorially
- **Motifs** are flexible, data-mined pieces — atom : substructure : motif reads as character : word : **phrase**
- Decoding is **coarse to fine** in three layers: motif → attachment → atom, and splitting attachment out is what makes large motifs usable
- A polymer that took ~70 steps takes **11**
- The vocabulary ceiling moves rather than disappears, and motifs become domain-specific
- For generation, larger units win; for representation, units that recur win — which is why the small-ring decomposition is still the right one there

## References

- Jin, Barzilay & Jaakkola, [Hierarchical generation of molecular graphs using structural motifs](https://arxiv.org/abs/2002.03230) (ICML 2020) — the paper reviewed here
- Jin, Barzilay & Jaakkola, [Junction tree variational autoencoder](https://arxiv.org/abs/1802.04364) (ICML 2018) — the predecessor, reviewed [here](../jtvae-en/)
- Liu et al., [Constrained graph variational autoencoders for molecule design](https://arxiv.org/abs/1805.09076) (NeurIPS 2018) — CG-VAE, the atom-based baseline
