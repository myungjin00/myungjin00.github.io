---
title: "Transfer learning: pre-training and fine-tuning"
date: 2025-01-17
description: "The two stages, pre-training and fine-tuning · why the pretext answers can be worthless · learning rate and catastrophic forgetting · negative transfer, and how to pick a backbone"
category: concept
updated: 2025-02
lang: en
group: transfer
topic: Machine learning
subtopic: Basics
tags: [transfer learning, pre-training, fine-tuning]
---

**Machine learning** · [#1 Machine learning and deep learning](../ml-and-dl-en/) · [#2 Supervised, unsupervised, self-supervised](../learning-paradigms-en/) · [#3 Clustering](../clustering-en/) · #4 Transfer learning

The imbalance from [the last part](../learning-paradigms-en/) is the starting point: hundreds of millions of unlabelled molecules, a few thousand with a toxicity label. **Transfer learning** is how you connect the two.

## In one sentence

> Learn a general representation on large data, then adapt it to a small task.

It splits into two stages.

<figure>
<svg viewBox="0 0 540 196" role="img" aria-label="Pre-training on a large unlabeled corpus, then fine-tuning the same encoder on small labeled tasks.">
  <g fill="none" stroke="#D3D8CE"><rect x="16" y="24" width="228" height="148" rx="6"/><rect x="296" y="24" width="228" height="148" rx="6"/></g>
  <g font-family="IBM Plex Mono, monospace" font-size="11.5" fill="#1E4A39"><text x="30" y="46">1. pre-training</text><text x="310" y="46">2. fine-tuning</text></g>
  <g font-family="IBM Plex Mono, monospace" font-size="10" fill="#6E7873">
    <text x="30" y="68">ZINC250k · no labels</text><text x="310" y="68">BBBP · 2,039 · labelled</text>
    <text x="30" y="162">self-supervised objective</text><text x="310" y="162">task loss, small steps</text>
  </g>
  <g fill="#DCE7DF" stroke="#1E4A39" stroke-width="1.5"><rect x="40" y="96" width="88" height="34" rx="5"/><rect x="320" y="96" width="88" height="34" rx="5"/></g>
  <g font-family="IBM Plex Mono, monospace" font-size="10.5" fill="#1E4A39"><text x="56" y="117">encoder</text><text x="336" y="117">encoder</text></g>
  <g fill="rgba(194,112,60,.18)" stroke="#C2703C" stroke-width="1.4"><rect x="152" y="96" width="66" height="34" rx="5"/><rect x="432" y="96" width="66" height="34" rx="5"/></g>
  <g font-family="IBM Plex Mono, monospace" font-size="10" fill="#C2703C"><text x="162" y="111">pretext</text><text x="166" y="124">head</text><text x="448" y="111">task</text><text x="448" y="124">head</text></g>
  <g stroke="#46524D" stroke-width="1.2" marker-end="url(#ar2)"><line x1="128" y1="113" x2="150" y2="113"/><line x1="408" y1="113" x2="430" y2="113"/></g>
  <defs><marker id="ar2" markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6 z" fill="#46524D"/></marker></defs>
  <path d="M84 138 C 84 180, 364 180, 364 138" fill="none" stroke="#1E4A39" stroke-width="1.4" stroke-dasharray="4 4"/>
  <text x="206" y="190" font-family="IBM Plex Mono, monospace" font-size="10" fill="#1E4A39">the weights carry over</text>
</svg>
<figcaption><b>Pre-train, then fine-tune.</b> Only the encoder transfers; the head is thrown away, because the problem it was solving is not the final task.</figcaption>
</figure>

## Stage 1 — pre-training

The model solves a **pretext task** on a large corpus. The answers to that task are worthless. What you want is the **representation** that forms while solving it.

Pretext tasks used on molecules:

- **Masking** — hide an atom type and predict it
- **Contrastive learning** — two views of one molecule close, different molecules far
- **Property prediction** — predict descriptors that RDKit can already compute

That last one looks odd. If logP can simply be calculated, why predict it? Because **getting it right is not the point.** To predict logP the model has to recognise the structures that drive hydrophobicity, and that recognition is what gets reused later.

Masking runs on SMILES strings as readily as on graphs, and that is what a [chemical language model](../chemical-language-models-en/) is.

## Stage 2 — fine-tuning

Take the pre-trained encoder — the **backbone**, the part that carries over — drop the pretext head, attach a head for the real task, and train on labelled data.

There are two ways to do it.

| approach | encoder | when |
| --- | --- | --- |
| **Linear probing** | frozen | a few hundred labels, or a target close to the pre-training domain — and the way to measure the representation itself |
| **Full fine-tuning** | trained along | a few thousand labels and up, or a target far from the pre-training domain — the usual choice, at a low learning rate |

Full fine-tuning usually wins, but too large a learning rate **overwrites** what pre-training produced. Starting around ten times lower than the pre-training rate is typical.

## Why it works

A pre-trained model gives you a better starting point. From random initialisation, the model has to learn what a molecule even is from 2,000 labels. A pre-trained model already knows about rings, functional groups and connectivity; it only has to learn **which of those matter for this task**.

The practical effects are three:

- better scores on small datasets
- faster convergence
- less variance across seeds

## Where it breaks

**1. The domains are too far apart.** A model pre-trained on ZINC (drug-like molecules) transfers well to similar molecules. It does not transfer to proteins or crystals. Transfer works **in proportion to how close source and target are.**

**2. Catastrophic forgetting.** With a high learning rate or too many epochs, the pre-trained weights get flattened by the task data until you are back where you started.

**3. A pretext task that does not fit.** Pre-training is not automatically a gain. If the pretext task builds features unrelated to the final task, you get **negative transfer** and worse results. <mark class="blue">This is why a low pre-training loss does not make a good backbone: the backbone has to be chosen on downstream performance.</mark>

**4. Contaminated evaluation.** If test molecules sit in the pre-training corpus, the scores are inflated. Overlap between pre-training data and benchmarks is worth checking explicitly.

## How the terms relate

The vocabulary gets used loosely. Sorted out:

- **Transfer learning** — using what was learned on one task for another, in general
- **Pre-training + fine-tuning** — the most common way to implement that transfer
- **Self-supervised pre-training** — pre-training whose labels come from the data itself

So they nest: transfer learning ⊃ pre-training and fine-tuning ⊃ self-supervised pre-training.

> **The general view.** Medical imaging is the clearest analogy. A labelled chest X-ray set runs to tens of thousands of images, not the millions a model is usually trained on, but a model pre-trained on 1.2M ImageNet photographs already knows edges, textures and shapes, so it only has to learn whether a given shadow is a lesion. That is exactly why we pre-train on unlabelled molecules.

## Summary

- Learn representations on large unlabelled data, finish on small labelled data
- Only the encoder transfers; the head is new
- Fine-tune with a low learning rate, or you erase what you gained
- Watch the domain gap, check for overlap, and pick the backbone on downstream results

## References

- Pan & Yang, [A Survey on Transfer Learning](https://doi.org/10.1109/TKDE.2009.191), *IEEE TKDE* (2010) — the survey that fixed the vocabulary
- Hu et al., [Strategies for Pre-training Graph Neural Networks](https://arxiv.org/abs/1905.12265) (ICLR 2020) — reports negative transfer on molecular graphs
- Kornblith et al., [Do Better ImageNet Models Transfer Better?](https://arxiv.org/abs/1805.08974) (CVPR 2019) — a strong correlation ($r = 0.99$ with fixed features, $0.96$ fine-tuned), with the caveat that regularisation which raises ImageNet accuracy can leave worse transfer features
