---
title: "Evaluating a model: seeds, cross-validation, splits"
date: 2025-02-21
description: "Why one number is never the result · what a random seed actually changes and how many to run · hold-out versus k-fold versus nested CV · random split flatters a model and scaffold split does not · the leakage checklist"
category: concept
updated: 2025-03
lang: en
group: evaluation
topic: Machine learning
subtopic: Evaluation
tags: [evaluation, cross-validation, scaffold split, leakage]
---

A reported score is a measurement, and a measurement without a procedure behind it means nothing. Three choices decide whether a number is believable: how many seeds, how the data was split, and whether anything leaked. <mark>Most irreproducible results in this field fail on one of those three, not on the model.</mark>

## One number is not a result

Train the same model twice, changing nothing but the random seed, and the scores differ. On a small dataset the gap between two seeds is routinely larger than the gap between two published methods.

What the seed actually controls:

| Source | Effect |
| --- | --- |
| weight initialisation | a different starting point, a different local optimum |
| data shuffling | different mini-batch composition |
| the split itself | a different train/test partition, if the split is seeded |
| dropout, augmentation | different noise during training |
| GPU non-determinism | some CUDA kernels are not bit-reproducible even at a fixed seed |

Fixing the seed does not guarantee identical runs on a GPU unless you also set deterministic kernels, and doing so costs speed.

**So: run several seeds and report mean ± standard deviation.** Three is the floor, five to ten is defensible. The standard deviation is not decoration — it is what tells a reader whether a 0.005 improvement is real.

> The one thing you must not do is run ten seeds and report the best. That is selecting on the test set, and the reported number no longer estimates anything. If seeds were used to choose, say so and report all of them.

## Hold-out, k-fold, nested

**Hold-out** is one split into three parts, and each part has exactly one job:

| Part | Used for | How often |
| --- | --- | --- |
| **train** | fitting parameters | every epoch |
| **validation** | choosing hyperparameters, early stopping | many times |
| **test** | the final estimate | **once** |

<mark class="blue">Every time you look at the test set and then change something, it becomes a second validation set and stops being an unbiased estimate.</mark>

<figure>
<img src="/assets/fig/cv-sklearn.png" alt="All data split into training and test; the training part further split into five folds" loading="lazy" />
<figcaption>Hold-out and cross-validation are not alternatives — they compose. The test set is cut off first and left alone; the folds live <em>inside</em> the training part and are what hyperparameters are chosen on. The test set is touched once, at the end.
<br><span class="credit"><a href="https://scikit-learn.org/stable/modules/cross_validation.html">scikit-learn user guide</a> &#183; documentation figure</span></figcaption>
</figure>

**k-fold cross-validation** splits the data into k parts, trains k times, and tests each part once.

<figure>
<svg viewBox="0 0 640 170" role="img" aria-label="Five-fold cross-validation layout">
<text x="12" y="16" font-family="ui-monospace,monospace" font-size="11" fill="#8a918c">5-fold cross-validation</text>
<g font-family="ui-monospace,monospace" font-size="10" fill="#8a918c">
<text x="12" y="42">fold 1</text><text x="12" y="68">fold 2</text><text x="12" y="94">fold 3</text><text x="12" y="120">fold 4</text><text x="12" y="146">fold 5</text>
</g>
<g>
<rect x="60" y="30" width="104" height="16" fill="#8c4a32" opacity=".85"/><rect x="166" y="30" width="104" height="16" fill="#d9ddd8"/><rect x="272" y="30" width="104" height="16" fill="#d9ddd8"/><rect x="378" y="30" width="104" height="16" fill="#d9ddd8"/><rect x="484" y="30" width="104" height="16" fill="#d9ddd8"/>
<rect x="60" y="56" width="104" height="16" fill="#d9ddd8"/><rect x="166" y="56" width="104" height="16" fill="#8c4a32" opacity=".85"/><rect x="272" y="56" width="104" height="16" fill="#d9ddd8"/><rect x="378" y="56" width="104" height="16" fill="#d9ddd8"/><rect x="484" y="56" width="104" height="16" fill="#d9ddd8"/>
<rect x="60" y="82" width="104" height="16" fill="#d9ddd8"/><rect x="166" y="82" width="104" height="16" fill="#d9ddd8"/><rect x="272" y="82" width="104" height="16" fill="#8c4a32" opacity=".85"/><rect x="378" y="82" width="104" height="16" fill="#d9ddd8"/><rect x="484" y="82" width="104" height="16" fill="#d9ddd8"/>
<rect x="60" y="108" width="104" height="16" fill="#d9ddd8"/><rect x="166" y="108" width="104" height="16" fill="#d9ddd8"/><rect x="272" y="108" width="104" height="16" fill="#d9ddd8"/><rect x="378" y="108" width="104" height="16" fill="#8c4a32" opacity=".85"/><rect x="484" y="108" width="104" height="16" fill="#d9ddd8"/>
<rect x="60" y="134" width="104" height="16" fill="#d9ddd8"/><rect x="166" y="134" width="104" height="16" fill="#d9ddd8"/><rect x="272" y="134" width="104" height="16" fill="#d9ddd8"/><rect x="378" y="134" width="104" height="16" fill="#d9ddd8"/><rect x="484" y="134" width="104" height="16" fill="#8c4a32" opacity=".85"/>
</g>
<rect x="452" y="7" width="11" height="11" fill="#8c4a32" opacity=".85"/><text x="468" y="16" font-family="ui-monospace,monospace" font-size="10" fill="#8a918c">test</text>
<rect x="508" y="7" width="11" height="11" fill="#d9ddd8"/><text x="524" y="16" font-family="ui-monospace,monospace" font-size="10" fill="#8a918c">train</text>
</svg>
<figcaption>Every sample is tested exactly once, and the model is trained five times. The result is five scores, so a standard deviation comes for free.</figcaption>
</figure>

| Variant | Use when |
| --- | --- |
| **k-fold** | the dataset is small and one hold-out would be noisy |
| **stratified k-fold** | labels are imbalanced — keeps the positive rate equal in each fold |
| **group k-fold** | samples cluster (same patient, same assay, same compound series) |
| **nested CV** (nested cross-validation) | hyperparameters are tuned — an inner loop tunes, an outer loop scores |
| **repeated k-fold** | k-fold with several different partitions, for a tighter estimate |

**Group k-fold** is the one that gets skipped. If ten measurements come from the same patient and they land on both sides of the split, the model can recognise the patient rather than the biology. The same applies to a congeneric series of molecules.

**Nested CV** matters whenever you tune. If hyperparameters are chosen using the same folds that produce the final score, the score is optimistic — the tuning already saw that data. The unbiased form is an inner loop for selection and an outer loop for reporting.

The cost: k-fold trains k models, nested CV trains k × m. For large deep models that is often why a single hold-out is used instead, which is a defensible choice as long as it is stated.

## How the split is made

For molecules, this choice moves the number more than the model does.

<figure>
<svg viewBox="0 0 640 190" role="img" aria-label="Random split versus scaffold split">
<text x="12" y="16" font-family="ui-monospace,monospace" font-size="11" fill="#5b6b63">random split</text>
<text x="12" y="112" font-family="ui-monospace,monospace" font-size="11" fill="#8c4a32">scaffold split</text>
<g font-family="ui-monospace,monospace" font-size="9" fill="#8a918c">
<text x="60" y="38">train</text><text x="420" y="38">test</text>
<text x="60" y="134">train</text><text x="420" y="134">test</text>
</g>
<g>
<rect x="56" y="44" width="330" height="26" fill="none" stroke="#c9cfca"/><rect x="416" y="44" width="150" height="26" fill="none" stroke="#c9cfca"/>
<circle cx="76" cy="57" r="6" fill="#4a6b5c" opacity=".8"/><circle cx="100" cy="57" r="6" fill="#c08a4a" opacity=".8"/><circle cx="124" cy="57" r="6" fill="#4a6b5c" opacity=".8"/><circle cx="148" cy="57" r="6" fill="#4a7a9c" opacity=".8"/><circle cx="172" cy="57" r="6" fill="#c08a4a" opacity=".8"/><circle cx="196" cy="57" r="6" fill="#4a6b5c" opacity=".8"/><circle cx="220" cy="57" r="6" fill="#4a7a9c" opacity=".8"/><circle cx="244" cy="57" r="6" fill="#c08a4a" opacity=".8"/><circle cx="268" cy="57" r="6" fill="#4a6b5c" opacity=".8"/><circle cx="292" cy="57" r="6" fill="#4a7a9c" opacity=".8"/><circle cx="316" cy="57" r="6" fill="#c08a4a" opacity=".8"/><circle cx="340" cy="57" r="6" fill="#4a6b5c" opacity=".8"/>
<circle cx="436" cy="57" r="6" fill="#4a7a9c" opacity=".8"/><circle cx="460" cy="57" r="6" fill="#4a6b5c" opacity=".8"/><circle cx="484" cy="57" r="6" fill="#c08a4a" opacity=".8"/><circle cx="508" cy="57" r="6" fill="#4a7a9c" opacity=".8"/>
</g>
<text x="56" y="88" font-family="ui-monospace,monospace" font-size="10" fill="#5b6b63">every scaffold appears on both sides &mdash; the test set is not new chemistry</text>
<g>
<rect x="56" y="140" width="330" height="26" fill="none" stroke="#c9cfca"/><rect x="416" y="140" width="150" height="26" fill="none" stroke="#c9cfca"/>
<circle cx="76" cy="153" r="6" fill="#4a6b5c" opacity=".8"/><circle cx="100" cy="153" r="6" fill="#4a6b5c" opacity=".8"/><circle cx="124" cy="153" r="6" fill="#4a6b5c" opacity=".8"/><circle cx="148" cy="153" r="6" fill="#4a6b5c" opacity=".8"/><circle cx="172" cy="153" r="6" fill="#4a6b5c" opacity=".8"/><circle cx="196" cy="153" r="6" fill="#c08a4a" opacity=".8"/><circle cx="220" cy="153" r="6" fill="#c08a4a" opacity=".8"/><circle cx="244" cy="153" r="6" fill="#c08a4a" opacity=".8"/><circle cx="268" cy="153" r="6" fill="#c08a4a" opacity=".8"/><circle cx="292" cy="153" r="6" fill="#c08a4a" opacity=".8"/><circle cx="316" cy="153" r="6" fill="#c08a4a" opacity=".8"/><circle cx="340" cy="153" r="6" fill="#c08a4a" opacity=".8"/>
<circle cx="436" cy="153" r="6" fill="#4a7a9c" opacity=".8"/><circle cx="460" cy="153" r="6" fill="#4a7a9c" opacity=".8"/><circle cx="484" cy="153" r="6" fill="#4a7a9c" opacity=".8"/><circle cx="508" cy="153" r="6" fill="#4a7a9c" opacity=".8"/>
</g>
<text x="56" y="184" font-family="ui-monospace,monospace" font-size="10" fill="#8c4a32">a scaffold lives on one side only &mdash; the test set is genuinely unseen</text>
</svg>
<figcaption>Colour is the Bemis&ndash;Murcko scaffold. Under a random split the same scaffold sits in train and test, so the model can recognise rather than generalise.</figcaption>
</figure>

| Split | Rule | What it measures |
| --- | --- | --- |
| **random** | shuffle, then cut | interpolation inside known chemistry |
| **scaffold** | group by Bemis–Murcko scaffold, keep a scaffold on one side | generalisation to new scaffolds |
| **time** | train on compounds made before a date, test on later ones | the real prospective setting |
| **cluster** | cluster by fingerprint similarity (Butina), split by cluster | a tunable version of scaffold split |
| **stratified** | preserve the label distribution | needed whenever labels are rare |

A **Bemis–Murcko scaffold** is what remains after stripping every side chain: the ring systems plus the linkers between them. Two analogues in the same series collapse to the same scaffold, which is exactly the grouping you want.

On MoleculeNet tasks the same model routinely scores **ten points better** under a random split than under a scaffold split. A paper comparing its random-split number against another paper's scaffold-split number is not comparing anything.

Two cautions. Scaffold split is still not prospective — a time split is closer to how a model is actually used. And implementations differ: some sort scaffolds by group size for a deterministic split, some balance the folds, and these produce different test sets from the same data. Name the implementation, not just "scaffold split".

## The leakage checklist

<u>Leakage</u> is information from the test set reaching training. It inflates the score and is invisible unless you look.

- **Duplicates.** The same molecule written as two SMILES (simplified molecular-input line-entry system) strings, or the same patient sampled twice. Standardise and deduplicate **before** splitting.
- **Preprocessing fitted on everything.** A scaler, a PCA (principal component analysis), a feature selection or a normalisation fitted on the full dataset has already seen the test set. Fit on train, apply to test — this is what `sklearn`'s `Pipeline` exists to enforce.
- **Early stopping on the test set.** If the test set chooses the epoch, it is a validation set.
- **Hyperparameters tuned on the test set.** Same problem, bigger effect.
- **Grouped samples spread across the split.** Patients, replicates, congeneric series.
- **Features derived from the target.** A descriptor computed from the label, or a label that encodes the assay the compound came from.

> A useful sanity check: shuffle the labels and rerun the whole pipeline. If the score stays meaningfully above chance, something is leaking.

## Summary

- Report **mean ± standard deviation over several seeds**; three is the floor, five to ten is defensible
- Never report the best seed — that is selecting on the test set
- train / validation / test have one job each, and the test set is looked at **once**
- k-fold when data is small; **stratified** for imbalance, **group** for clustered samples, **nested** whenever you tune
- For molecules the split dominates: a random split overstates by around ten points versus a scaffold split
- A time split is closer still to the real setting, and scaffold-split implementations differ — name yours
- Deduplicate **before** splitting, and fit preprocessing on the training part only; shuffle the labels as a leakage check

## References

- Bemis & Murcko, [The properties of known drugs. 1. Molecular frameworks](https://doi.org/10.1021/jm9602928), *J. Med. Chem.* (1996)
- Sheridan, [Time-split cross-validation as a method for estimating the goodness of prospective prediction](https://doi.org/10.1021/ci400084k), *J. Chem. Inf. Model.* (2013)
- Wu et al., [MoleculeNet: a benchmark for molecular machine learning](https://doi.org/10.1039/C7SC02664A), *Chem. Sci.* (2018)
- Varma & Simon, [Bias in error estimation when using cross-validation for model selection](https://doi.org/10.1186/1471-2105-7-91), *BMC Bioinformatics* (2006) — nested CV
