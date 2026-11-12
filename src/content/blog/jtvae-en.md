---
title: "JT-VAE: generating molecules that are valid by construction"
date: 2024-02-22
description: "Why character-level SMILES generation breaks · why atom-by-atom graph generation passes through invalid states · tree decomposition and the junction tree · two latents and two decoders · the vocabulary ceiling"
category: review
updated: 2024-03
lang: en
topic: Cheminformatics
subtopic: Representation
venue: ICML
venueYear: 2018
group: jtvae
tags: [review, generative models, junction tree, molecular representation]
---

> Jin, Wengong, et al. "Junction Tree Variational Autoencoder for Molecular Graph Generation." *arXiv*, 12 Feb. 2018, [arxiv.org/abs/1802.04364](https://arxiv.org/abs/1802.04364). Preprint.
> [code](https://github.com/wengong-jin/icml18-jtnn)

## The problem with generating a molecule

Drug discovery needs molecules with particular properties, and the search is mostly done by people. The automated version splits into two halves: encode a molecule into a continuous vector where properties can be optimised, and decode that vector back into a molecule.

The decoding half is where it falls apart. The dominant approach in 2018 was to generate **SMILES** (simplified molecular-input line-entry system) strings character by character, which has two problems the paper names directly:

- **Most strings are not molecules.** Parentheses and ring-closure digits have to balance; a character-level model gets them wrong often, and early SMILES VAE (variational autoencoder) models reported validity rates well below 100%.
- **Similar strings are not similar molecules.** Two molecules that differ by one atom can have very different SMILES, so distance in string space does not correspond to distance in chemistry — which defeats the point of having a continuous latent space to optimise in.

Generating the graph directly, atom by atom, fixes the second problem and keeps a version of the first: a partially built molecule passes through states that are not chemically valid, so validity can only be checked at the end.

## Rewriting the molecule as a tree

<figure>
<img src="/assets/fig/jtvae-treedecomp.png" alt="A molecule decomposed into clusters and the junction tree over them" width="2362" height="700">
<figcaption><b>Tree decomposition.</b> Rings and bonds become clusters; clusters that share atoms are joined; a spanning tree over that cluster graph is the junction tree. The molecule is unchanged — it has been rewritten into a form with no cycles.
<br><span class="credit">Jin, Barzilay &amp; Jaakkola, <a href="https://arxiv.org/abs/1802.04364">Junction Tree Variational Autoencoder for Molecular Graph Generation</a>, ICML 2018 &#183; paper figure, Figure 2</span></figcaption>
</figure>

The construction, as the paper states it:

1. **Find the clusters.** Every simple cycle (ring) and every bond not in a ring.
2. **Merge bridged rings.** Two rings sharing more than two atoms become one cluster — otherwise a bridged bicyclic would be split in a way that cannot be reassembled.
3. **Build the cluster graph.** Connect clusters that share an atom.
4. **Take a spanning tree.** That is the junction tree.

Two formal conditions have to hold: the clusters must cover the whole molecule, and the **running intersection property** — if cluster $C_k$ lies on the path from $C_i$ to $C_j$, then $V_i \cap V_j \subseteq V_k$. That second one says any atom two clusters share also sits in every cluster between them, which is what makes it safe to attach a piece using only its neighbours in the tree.

<mark class="blue">The point is that a tree can be generated one node at a time, and a graph with rings cannot.</mark> The cycles are not deleted; they are moved inside the node labels, where they are atomic and always valid.

## Two latent vectors, two decoders

<figure>
<img src="/assets/fig/jtvae-paradigm.png" alt="The JT-VAE pipeline: decompose, encode tree and graph, decode tree, assemble" width="1146" height="1300">
<figcaption><b>The pipeline.</b> A molecule is decomposed into its junction tree; tree and graph are encoded into separate latent vectors $z_T$ and $z_G$; decoding reconstructs the tree from $z_T$ and then assembles its nodes back into a molecule using $z_G$.
<br><span class="credit">Jin, Barzilay &amp; Jaakkola, <a href="https://arxiv.org/abs/1802.04364">Junction Tree Variational Autoencoder for Molecular Graph Generation</a>, ICML 2018 &#183; paper figure, Figure 1</span></figcaption>
</figure>

**$z_T$** says *which pieces, in what arrangement*; **$z_G$** says *how they are actually fused* — which atom of the ring the substituent attaches to. Those are different kinds of information, and keeping them separate is what lets the decoder work in two stages.

**Stage 1, tree decoding.** Generate the junction tree node by node, each node a label from a fixed vocabulary of chemically valid components (rings, bonds, atoms) extracted from the training set.

**Stage 2, assembly.** For each pair of adjacent tree nodes there are several ways the two fragments could actually be joined. A scoring network ranks the candidate attachments and the best is chosen.

The validity guarantee comes from stage 1: every vocabulary entry is a real chemical substructure, so the model is never assembling something invalid. Reported validity is **100%**, against SMILES-based baselines well below it.

## What it is used for

Beyond generation, the paper does Bayesian optimisation in the latent space on penalised logP — the field's standard toy objective, lipophilicity penalised for being hard to synthesise — and constrained optimisation: take a molecule, move it in latent space while staying within a bound on Tanimoto similarity (the fingerprint overlap between two molecules), decode. That second task is the one shaped like medicinal chemistry in practice: *improve this molecule without changing it beyond recognition*.

## What it was tested on, and against what

**ZINC**, roughly 250,000 drug-like molecules — the standard corpus for this task, which is what
makes the comparison readable. The baselines are the SMILES-string VAEs it is arguing against:
CVAE generates characters, GVAE adds a grammar, SD-VAE adds syntax-directed constraints.

| | reconstruction | prior validity |
| --- | --- | --- |
| CVAE | 44.6% | 0.7% |
| GVAE | 53.7% | 7.2% |
| SD-VAE | 76.2% | 43.5% |
| GraphVAE | — | 13.5% |
| Atom-by-atom LSTM | — | 89.2% |
| **JT-VAE** | 76.7% | **100.0%** |

<mark>Look at the two columns separately. On reconstruction JT-VAE ties SD-VAE at
roughly 76%; on validity it is the only model at 100%, because validity here is not learned but
guaranteed by construction.</mark> Every tree node is a chemically valid fragment and the assembly
step only accepts valid combinations, so an invalid molecule cannot be produced. The grammar-based
models were climbing toward the same property by learning it; the tree makes it unnecessary.

The optimisation results follow from that. Bayesian optimisation over the latent space finds
molecules scoring 5.30 / 4.93 / 4.49 on penalised logP against SD-VAE's 4.04, and the Gaussian
process fits the JT-VAE latent space better than the others (RMSE, root-mean-square error: 1.290 against 1.366). Under a
similarity constraint the trade is visible and honest: at sim ≥ 0.4 success is 83.6% with a mean
improvement of 0.84, and at sim ≥ 0.6 success falls to 46.4%.

## What I would question

- **It depends on the vocabulary.** The component set is extracted from the training data, so a ring system that never appeared is not generable at all. The vocabulary is not a modelling choice you can tune away; it is a hard ceiling on the output space, and the molecules outside it are the novel ones.
- **A junction tree is not guaranteed for an arbitrary molecule.** The decomposition assumes the overlap structure behaves; heavily bridged and fused systems are where the merging rule has to intervene, and that rule is a heuristic.

I would add a third now. **The assembly step is where the hard chemistry lives, and it gets the least attention.** The tree decoder is the part everyone remembers, but deciding *which atom* a fragment attaches to is the step that determines whether the output is the molecule you wanted, and it is handled by a ranking network over enumerated candidates.

## Why it matters to me

The junction tree is one of the two views in [SJoINT](https://github.com/sslim-aidrug/SJoINT), and the decomposition I use is this one, unchanged — the `tree_decomp` in my preprocessing is Jin et al.'s algorithm. The difference is the purpose. Here the tree exists so that **generation** can proceed node by node; in my work it exists so that a molecule has a **second description** that can be contrasted against the atom graph.

That turns out to matter for the vocabulary problem. A generative model is crippled by an unseen ring because it cannot emit it. A representation model only needs the ring to land in `<UNK>` and be carried by the atom view instead. Same decomposition, and the hard ceiling becomes a soft one.

## Summary

- SMILES generation produces invalid strings and a latent space where distance means little; atom-by-atom graph generation passes through invalid intermediates
- A **junction tree** rewrites the molecule with no cycles — rings move inside node labels, where they are always valid
- Construction: rings and bonds as clusters, merge bridged rings, connect clusters sharing atoms, take a spanning tree
- Two latents: **$z_T$** for which pieces and how arranged, **$z_G$** for how they fuse
- Decode the tree first, then assemble — **100% validity**, because every vocabulary entry is a real substructure
- Limits: the vocabulary is a hard ceiling on what can be generated, and the decomposition is not guaranteed for every molecule
- For representation rather than generation, that ceiling softens — an unseen ring can fall back on the atom view

## References

- Jin, Barzilay & Jaakkola, [Junction tree variational autoencoder for molecular graph generation](https://arxiv.org/abs/1802.04364) (ICML 2018) — the paper reviewed here
- Gómez-Bombarelli et al., [Automatic chemical design using a data-driven continuous representation of molecules](https://doi.org/10.1021/acscentsci.7b00572), *ACS Cent. Sci.* (2018) — the SMILES VAE it is measured against
- Jin, Barzilay & Jaakkola, [Hierarchical generation of molecular graphs using structural motifs](https://arxiv.org/abs/2002.03230) (ICML 2020) — the successor, reviewed [here](../hiervae-en/)
