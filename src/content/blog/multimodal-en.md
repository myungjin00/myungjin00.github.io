---
title: "Multimodal models: what counts as a modality, and where they are joined"
date: 2026-06-12
description: "A modality is a second measurement of one object, not a second data type · complementary and redundant, and why you need both · early, intermediate and late fusion · cross-attention as the join · contrastive alignment without labels · and the five ways the multimodal number turns out to mean nothing"
category: concept
updated: 2026-07
lang: en
group: multimodal
topic: Machine learning
subtopic: Basics
tags: [multimodal, fusion, cross-attention, representation learning]
---

"Multimodal" is used loosely enough that it often means nothing more than "two input arrays". The useful definition is narrower, and it decides whether the whole exercise can work at all.

## What a modality actually is

Not a data type. A modality is a **different measurement of the same underlying thing.**

<mark>The test is whether the two views are of one object.</mark> An image and its caption describe one scene. A SMILES (simplified molecular-input line-entry system) string and a molecular graph are two serialisations of one molecule. A bulk RNA-seq (RNA sequencing) profile and a histology slide come from one tissue block. A patient's labs, clinical notes and imaging are three measurements of one patient.

What is *not* multimodal: two tables of unrelated features, or a feature matrix someone split in half. Those are just features. Alignment, the free positive pair and the claim that one view can fill in for another all depend on there being a single object underneath, so the distinction decides whether any of them is available.

| Domain | Views of one object |
| --- | --- |
| **molecules** | SMILES string, atom graph, 3D conformer, rendered image of the structure |
| **biology** | transcriptome, histology image, clinical variables |

## Why anyone bothers

Two properties have to hold at once, and they pull in opposite directions.

- **Complementary** — one view carries information the other cannot. A graph states ring topology explicitly; a conformer states distance in space. Neither is recoverable from the other. This is where the performance gain would come from.
- **Redundant** — the views overlap. This is what lets you learn an alignment *without labels*: if a histology slide and a transcriptome from the same block share signal, matching them is a supervisable task that needs no outcome label.

Pure complementarity with no overlap gives you nothing to align on. Pure redundancy gives you a second copy and no gain. Useful pairs sit in between, and <mark>the redundancy is the training signal while the complementarity is the payoff.</mark>

## Where they are joined

The question is at what depth the two streams meet.

| | What it is | Good | Bad |
| --- | --- | --- | --- |
| **early fusion** | concatenate the raw features into one vector, train one model | simple, one model, interactions available from layer 1 | the modality with the larger scale or dimension dominates; a missing modality breaks the input shape |
| **intermediate (joint) fusion** | encode each modality separately, fuse the representations, continue | each encoder suits its own data; this is where cross-attention lives | more parameters, and the fusion point is now a hyperparameter |
| **late fusion** | train separate models, combine the predictions (average, weighted vote, stacking) | a missing modality just drops out; encoders trainable independently, even on unpaired data | cannot learn any interaction — the modalities never see each other |

Most real systems are intermediate, for a plain reason: early fusion cannot cope with a 1024-dimensional image embedding sitting next to eight clinical variables, and late fusion gives up exactly the cross-modal interaction that was the motivation. Intermediate fusion lets each encoder do its job and still leaves a place for the two to talk.

## How the join is actually done

Four mechanisms, in increasing order of how much they can express.

**Concatenation.** Stack the two representation vectors, feed a multilayer perceptron. Works, and is the baseline every paper should report. Its limit is that interactions have to be learned from scratch by the layers above.

**Gating.** One modality produces a per-dimension multiplier for the other, so one view modulates the other's features rather than sitting beside them. Cheap, and often enough.

**Bilinear pooling.** Model every pairwise product between the two vectors. Maximally expressive and quadratic in dimension, so in practice it is always used in a factorised or compact approximation.

**Cross-attention.** Queries from one modality, keys and values from the other. It is literally the same operation as self-attention with two different inputs, and $Q$, $K$ and $V$ are derived exactly as in [attention](../attention-en/). What changes is only the source of each projection:

- $Q$ from modality A: *what does each element of A need to know*
- $K$, $V$ from modality B: *what B offers, and what it hands over*

The output has one row per query, so it keeps A's shape and length. That has two practical consequences. First, it is **asymmetric** — A reading B is a different operation from B reading A, and models that want both run two blocks. Second, it gives **element-level** interaction rather than whole-object interaction: an atom can query the substructure that contains it, a word can query an image patch. That granularity is the main reason to prefer it over concatenating two pooled vectors, where the only interaction left is between two summaries.

## Contrastive alignment

How do you place two modalities in one space when you have no labels? The CLIP (contrastive language–image pre-training) answer: take a batch of matched pairs, and train so that each view sits closer to its own partner than to any other view in the batch. Pull matched pairs together, push mismatched apart. The pairing itself is the supervision, so a shared embedding space falls out of data nobody annotated.

The catch is the positive pair. In images you build one by augmenting the same input twice, and in molecules that step is unsafe — deleting an atom gives a *different compound*, which is the whole argument in the [augmentation note](../augmentation-en/).

Dual-view molecular models avoid it by construction. [MoleSG](../molesg-en/) pairs a SMILES string with a graph; [SJoINT](https://github.com/sslim-aidrug/SJoINT) pairs an atom-level graph with a [junction tree](../fragmentation-en/) over its substructures. <mark class="blue">Both are two views of one molecule, which is exactly why no unsafe augmentation is needed — the positive pair was there before any transformation.</mark>

## Where it goes wrong

In the order I have actually hit them.

**(a) One modality dominates.** The model learns to read the strong view and ignore the other, and the number still goes up — because the strong view alone was good. Always train the single-modality baselines on the same split with the same tuning budget. Without them a multimodal score is uninterpretable, and "we added imaging and it improved" may just mean imaging was the only useful input.

**(b) Missing modalities at test time.** Common in clinical data, where the imaging exists for some patients. Early fusion breaks outright; intermediate fusion needs a learned or zero placeholder, which shifts the representation distribution; late fusion degrades gracefully, which is often why it is chosen despite being the weaker architecture.

**(c) Correlated but not complementary.** Two views can overlap heavily and add nothing. The alignment trains beautifully, the shared space looks clean, and the downstream gain is zero. Checking this costs one experiment: does modality B improve on the residual of a model using only A?

**(d) Alignment needs paired data, and pairs are the scarce thing.** Unpaired data of each modality is usually abundant; samples with both measured on the same object are not. This, not architecture, is what caps most biological multimodal work.

**(e) The baseline has to be trained properly.** A multimodal model beating a unimodal one is only interesting if the unimodal model got the same hyperparameter search, the same number of seeds, and the same split. An undertrained baseline makes any architecture look good, and a [sloppy split](../data-splitting-en/) makes both numbers meaningless.

## Summary

- A modality is **a different measurement of one object**, not a different data type; the test is whether there is one object underneath
- Pairs must be both **complementary** (the gain) and **redundant** (the alignment signal)
- Early fusion concatenates raw features, intermediate fuses representations, late combines predictions; most real systems are intermediate
- Early fusion lets the larger-scale modality dominate; late fusion survives a missing modality but cannot learn interactions
- Joining mechanisms: concatenation, gating, bilinear pooling, and **cross-attention** — $Q$ from one view, $K$ and $V$ from the other, the same operation as self-attention with two inputs
- Cross-attention is asymmetric and acts **element to element**, not summary to summary
- **Contrastive alignment** gives a shared space with no labels, and two views of one molecule make the positive pair free
- The failure modes: one modality dominating, missing modalities, correlated-but-not-complementary views, scarce paired data, and an undertrained unimodal baseline
- **Run the single-modality baselines, or the multimodal number means nothing**

## References

- Radford et al., [Learning transferable visual models from natural language supervision](https://arxiv.org/abs/2103.00020) (ICML 2021) — CLIP, contrastive alignment of two modalities
- Baltrušaitis et al., [Multimodal machine learning: a survey and taxonomy](https://arxiv.org/abs/1705.09406), *IEEE TPAMI* **41**(2) (2019) — where the fusion taxonomy comes from
- Shen et al., [Complementary multi-modality molecular self-supervised learning via non-overlapping masking](https://doi.org/10.1093/bib/bbae256), *Brief. Bioinform.* **25**(4) (2024) — MoleSG, reviewed [here](../molesg-en/)
