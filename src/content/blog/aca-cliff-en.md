---
title: "Activity-cliff awareness: putting the cliff into the loss function"
date: 2026-11-07
description: "Most models treat activity cliffs as a thing to measure afterwards. This one mines cliff triplets during training and adds a contrastive term, so the latent space is reshaped where the structure–activity surface is discontinuous."
category: review
updated: 2026-11
lang: en
topic: Cheminformatics
subtopic: Prediction
venue: Nature Communications
venueYear: 2026
group: aca-cliff
tags: [review, activity cliff, contrastive learning, graph neural networks]
draft: true
---

> Cui, Chao, et al. "Activity-cliff awareness enables robust graph learning for molecular property prediction." *Nature Communications*, vol. 17, no. 1, 2026, article 9376, [doi.org/10.1038/s41467-026-75713-2](https://doi.org/10.1038/s41467-026-75713-2).
> [PMC13534492](https://pmc.ncbi.nlm.nih.gov/articles/PMC13534492/)

## How cliffs are usually handled

[Activity cliffs](../activity-cliff-en/) are usually handled as a reporting problem: train normally, then split the test error into cliff and non-cliff and admit the cliff half is worse. The benchmark that popularised this, [MoleculeACE](../activity-cliff-en/), ends with the uncomfortable finding that fingerprints plus an SVM (support vector machine) beat graph neural networks (GNNs) on exactly those pairs.

<mark>This paper does something different: it puts the cliff into the loss.</mark>

## The idea

A model trained on regression loss alone learns a latent space where **structurally similar molecules end up close together**, because that is what the message-passing inductive bias does. The paper's starting point is that at a cliff this arrangement is wrong, and its fix is an activity-cliff awareness (ACA) term added to the objective.

<figure>
<img src="/assets/fig/aca-fig3.png" alt="Latent space of a GNN trained without and with activity-cliff awareness" width="1980" height="2258">
<figcaption><b>Figure 3.</b> The inversion a cliff causes, and the correction. Take an anchor <b>A</b>, a positive <b>P</b> (close in activity) and a negative <b>N</b> (close in structure, far in activity). <b>(a)</b> Without awareness the model places <b>A</b> near <b>N</b>, because they look alike. <b>(b)</b> With the ACA term the optimisation pulls <b>A</b> towards <b>P</b> and pushes it away from <b>N</b>, so distance in the latent space tracks activity rather than structure.
<br><span class="credit">Cui et al., <a href="https://doi.org/10.1038/s41467-026-75713-2"><i>Nat. Commun.</i> <b>17</b> (2026)</a> &#183; paper figure, Figure 3</span></figcaption>
</figure>

The mechanism is a **soft-margin triplet contrastive term added to the regression loss**, with the triplets mined from the batch during training rather than fixed in advance:

$$
\mathcal{L} = \mathcal{L}_{\text{reg}} + \alpha \,\mathcal{L}_{\text{triplet}}
$$

Each training step looks for *high-value* activity-cliff triplets — anchor, a molecule close in activity, and a molecule close in structure but far in activity — and penalises the arrangement where the structural neighbour is also the latent neighbour. The factor $\alpha$ sets how hard the latent space is bent.

<figure>
<img src="/assets/fig/aca-fig1.png" alt="The ACA loss and the ACANET architecture" width="2003" height="1637">
<figcaption><b>Figure 1.</b> The loss and the model. <b>(a)</b> Per batch, cliff triplets are mined online and the ACA loss is computed alongside the regression term. <b>(b)</b> ACANET itself is an ordinary GNN — the contribution is the objective, not the architecture, which is why it transfers across backbones.
<br><span class="credit">Cui et al., <a href="https://doi.org/10.1038/s41467-026-75713-2"><i>Nat. Commun.</i> <b>17</b> (2026)</a> &#183; paper figure, Figure 1</span></figcaption>
</figure>

**The mining is online.** Enumerating all cliff pairs is $O(n^2)$ and most of them teach nothing; mining per batch keeps the cost down and keeps the triplets hard as training moves.

## What it does to the latent space

<figure>
<img src="/assets/fig/aca-fig6.png" alt="Chemical space and the latent spaces learned with and without ACA on the BRAF dataset" width="2000" height="2516">
<figcaption><b>Figure 6.</b> BRAF inhibitors, in three spaces: the original chemical space, the latent space without awareness, and the latent space with it. The claim being made is visual but checkable &mdash; after training with ACA, molecules that sit together have similar activity, not just similar structure.
<br><span class="credit">Cui et al., <a href="https://doi.org/10.1038/s41467-026-75713-2"><i>Nat. Commun.</i> <b>17</b> (2026)</a> &#183; paper figure, Figure 6</span></figcaption>
</figure>

The paper backs the picture with two quantities that move in the right direction during training: the number of mined cliff violations falls, and a **label-incoherence index** — how much a molecule's activity disagrees with its latent neighbours — drops.

## Evaluation

The paper evaluates on **52 datasets across four task types**:

| Task | What it tests |
| --- | --- |
| low-sample, narrow-scaffold series | the congeneric series a med-chem team actually works on |
| large mixed-scaffold benchmarks | the 30 MoleculeACE targets |
| matched-pair cliff classification | is this pair a cliff — a different question from predicting potency |
| ADMET (absorption, distribution, metabolism, excretion, toxicity) | whether the idea survives outside bioactivity |

On the MoleculeACE 30, ACANET beats fingerprint-based models on **70–76%** of datasets, on both the overall and the cliff-restricted RMSE (root-mean-square error). The original benchmark's headline was that fingerprints win, so this is a graph model reclaiming those datasets by changing the objective rather than the architecture.

For cliff classification the comparison is against the same architecture with the awareness term removed, scored by MCC (Matthews correlation coefficient):

| MMP (matched molecular pair) dataset | cliff-agnostic | cliff-aware |
| --- | --- | --- |
| Melanocortin receptor 4 | 0.373 | 0.462 |
| Mu opioid receptor | 0.451 | 0.550 |
| Thrombin | 0.487 | 0.510 |

Same backbone, same data, only the loss differs. <mark class="blue">That is the ablation that matters, and it is the one many papers skip in favour of beating a different architecture.</mark>

## What I would question

- **The cliff definition is now a hyperparameter.** Cliff cut-offs and $\alpha$ are tuned per dataset by linear search under nested CV (cross-validation). The nesting is the right thing to do, but it means part of the gain is a better-tuned notion of "cliff" for that dataset, not only a better model. How much, the paper does not separate.
- **ADMET is an indirect comparison.** ACANET predicts absolute values and derives the deltas; DeepDelta is trained on pairs directly. Calling the results "comparable" across different training targets understates how different the two tasks are.
- **A contrastive term that pushes similar structures apart has a cost somewhere.** It should blunt exactly the smoothness that makes models work on the 90% of chemistry that is not a cliff. The paper reports gains on the overall RMSE too, so empirically the trade is favourable — but the mechanism by which it avoids that cost is not explained.

## How it sits next to what I do

In [SJoINT](https://github.com/sslim-aidrug/SJoINT) I report on the same 30 MoleculeACE targets and treat the cliff subset as a **diagnostic**: train the representation with a contrastive objective between two views of the molecule, then check whether cliff RMSE improved. This paper makes the cliff the *target* of the contrastive term instead of a side effect of it.

The two are not in conflict, and the obvious thing to try is both — view-contrastive pre-training for the representation, cliff-aware triplets during fine-tuning. The reason I had not: adding a term whose triplets depend on the labels makes the cliff metric partly self-referential, and a gain on cliff RMSE would need a negative control to be believable. This paper's answer is the ablation above. Whether a cliff is something you measure or something you train against was the open question in my own work, and that ablation is the most convincing answer I have seen to it.

## Summary

- Activity cliffs are usually measured after training; this puts them in the **loss**, as a soft-margin triplet term mined online
- The architecture is an ordinary GNN — the contribution is the objective, which is why it transfers across backbones
- Cliff violations and label incoherence are shown to fall during training, measured rather than asserted
- **52 datasets, four task types**, including cliff classification and ADMET, not only potency regression
- The strongest evidence is same-architecture-minus-the-term: MCC 0.373 → 0.462, 0.451 → 0.550, 0.487 → 0.510
- The weakness is that the cliff definition itself is tuned per dataset, so some of the gain is a better-fitted threshold

## References

- Cui et al., [Activity-cliff awareness enables robust graph learning for molecular property prediction](https://doi.org/10.1038/s41467-026-75713-2), *Nat. Commun.* **17** (2026) — the paper reviewed here
- van Tilborg, Alenicheva & Grisoni, [Exposing the limitations of molecular machine learning with activity cliffs](https://doi.org/10.1021/acs.jcim.2c01073), *J. Chem. Inf. Model.* (2022) — the benchmark it is measured on
- Schroff, Kalenichenko & Philbin, [FaceNet](https://arxiv.org/abs/1503.03832) (CVPR 2015) — triplet loss and online mining, where the mechanism comes from
