---
title: "Molecular property prediction (MPP)"
date: 2025-07-18
description: "The shape of the task · why MoleculeNet became the default · how a random split inflates a score · scaffold splits and activity cliffs · why published numbers often do not transfer"
category: concept
updated: 2025-08
lang: en
group: mpp
topic: Cheminformatics
subtopic: Prediction
tags: [molecular ML, ADMET, benchmark]
---

## The shape of the task

Molecular property prediction (MPP) takes one structure and returns one number.

$$
f(\text{molecule}) \rightarrow y
$$

A category makes it classification, a real value makes it regression. The largest family of such properties in drug discovery is **ADMET** — absorption, distribution, metabolism, excretion, toxicity.

Why it matters: a large share of candidates that fail in the clinic fail **on ADMET rather than on efficacy**. A molecule that binds beautifully is still not a drug if it is not absorbed or if it damages the liver. Filtering those out **before** synthesis is a large saving.

## MoleculeNet

The de facto benchmark. The datasets that actually get used:

| dataset | task | molecules | what it measures |
| --- | --- | --- | --- |
| BBBP | classification | 2,039 | blood–brain barrier penetration |
| BACE | classification | 1,513 | BACE-1 inhibition |
| ClinTox | classification | 1,478 | clinical toxicity |
| SIDER | classification | 1,427 | 27 side-effect categories |
| Tox21 | classification | 7,831 | 12 toxicity pathways |
| ToxCast | classification | 8,575 | 617 assays |
| ESOL | regression | 1,128 | aqueous solubility |
| FreeSolv | regression | 642 | hydration free energy |
| Lipophilicity | regression | 4,200 | logD |

**The sizes tell you the problem.** FreeSolv has 642 molecules. That is not a comfortable size for deep learning, which is why [pre-training](../transfer-learning-en/) is close to mandatory here.

<figure>
<img src="/assets/fig/moleculenet-sizes.svg" alt="Molecule counts for the nine MoleculeNet datasets on a log scale" loading="lazy" />
<figcaption><b>MoleculeNet, to scale.</b> Counted from the released files &mdash; molecules RDKit parses, which is a few short of the table above because the published pipeline also canonicalises and strips salts. Five of the nine sit under 2,000 molecules, and the smallest is 642. This is the single fact that shapes everything else in molecular ML &mdash; it is why pre-training is close to mandatory, and why a fingerprint baseline keeps winning.</figcaption>
</figure>

## Where evaluation goes wrong

Picking a model from a results table will usually mislead you. There are four traps.

### 1. The split makes the number

A **random split** divides molecules at random. But these datasets contain many near-duplicates — analogues sharing a scaffold with one substituent changed. Split those across train and test and the model succeeds by **memorising**, not generalising.

A **scaffold split** groups by Bemis–Murcko scaffold — the ring systems and the linkers between them, left once every side chain is stripped — so the test set contains frameworks the model never saw. That is much closer to the real use: applying the model to new chemistry.

The same model routinely scores **ten points apart** on the two splits. <mark class="blue">A number reported without naming its split cannot be compared to anything.</mark> The kinds of split and how to choose between them are in [evaluating a model](../evaluation-protocol-en/).

### 2. Activity cliffs

The whole field rests on the assumption that similar structures have similar activity — and yet pairs exist where one atom changes activity a hundredfold. [Fingerprint similarity](../descriptors-fingerprints-en/) is helpless there, and a model with a good average fails on exactly those cases. [MoleculeACE](https://github.com/molML/MoleculeACE) is a benchmark built from them. The definitions and what can be done about them are in [activity cliffs](../activity-cliff-en/).

### 3. Imbalance and the choice of metric

Toxicity labels are usually sparse in positives, and **ROC-AUC (area under the receiver operating characteristic curve) flatters that situation** because abundant negatives push it up. When the positives are what you care about, **PR-AUC (area under the precision–recall curve, also AUPR)** reflects usefulness far better. A paper reporting only ROC-AUC is worth a second look.

### 4. Variance

At a few thousand molecules, **scores move with the seed.** <mark>A 0.5-point difference on a single seed means nothing.</mark> Three seeds minimum, ten if you can, reported as mean and standard deviation.

> Comparisons that ignore these four rarely reproduce. Walters' [Some Thoughts on Splitting Chemical Datasets](https://practicalcheminformatics.blogspot.com/2024/11/some-thoughts-on-splitting-chemical.html) is a good treatment of the split problem specifically.

<figure>
<img src="/assets/fig/split-comparison.svg" alt="Test RMSE under a random split and a scaffold split, on three datasets" loading="lazy" />
<figcaption><b>The same model, the same data, two splits.</b> ECFP4 + random forest, three seeds, mean &plusmn; sd &mdash; run for this note, not quoted. Moving from a random split to a scaffold split costs 20% on Lipophilicity, 46% on ESOL and 125% on FreeSolv. No modelling change produces a swing that size, which is why a score without its split is not a score.</figcaption>
</figure>

## Always run the baseline

If a new model cannot beat ECFP4 (extended-connectivity fingerprint) plus a random forest — thirty seconds to fit — it is not ready.

At a few hundred to a few thousand molecules, **ECFP with a random forest beating a graph neural network is not unusual.** An improvement reported without this baseline is hard to trust.

## Why interpretation keeps coming up

A chemist does not act on a score. "0.83 toxic" does not say what to change next. What turns a prediction into a design decision is knowing **which substructure produced it**.

That is why attention-based models are used here: the prediction arrives with a map of where the model looked. <mark>But **high attention equals cause** is a hypothesis that needs testing, not a guarantee.</mark>

## Summary

- MPP maps a structure to one number; ADMET is the largest family
- MoleculeNet is the standard, and it is small — 642 to 8,575 molecules
- **A number without its split is not comparable** — random and scaffold differ by ten points or more
- Activity cliffs, metric choice under imbalance, and seed variance are the other three traps
- Always include ECFP plus random forest as a baseline
- Interpretation is not a bonus feature; it is what connects a prediction to a design

## References

- Wu et al., [MoleculeNet: A Benchmark for Molecular Machine Learning](https://doi.org/10.1039/C7SC02664A), *Chem. Sci.* (2018)
- van Tilborg et al., [Exposing the Limitations of Molecular Machine Learning with Activity Cliffs](https://doi.org/10.1021/acs.jcim.2c01073), *J. Chem. Inf. Model.* (2022) — MoleculeACE
- Deng et al., [A systematic study of key elements underlying molecular property prediction](https://doi.org/10.1038/s41467-023-41948-6), *Nat. Commun.* (2023)
