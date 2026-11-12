---
title: "Class imbalance: when the majority class is the whole model"
date: 2025-02-14
description: "What a 3.5% positive rate does to a model · the three places you can intervene and why they are not interchangeable · resampling, class weights and focal loss · why SMOTE does not fit molecules · the threshold nobody tunes · and when the imbalance is the point"
category: concept
updated: 2025-03
lang: en
group: class-imbalance
topic: Machine learning
subtopic: Evaluation
tags: [class imbalance, metrics, molecular property prediction]
---

[Metrics](../metrics-en/) covers how to *measure* under imbalance: ROC-AUC (area under the receiver operating characteristic curve) barely notices that positives got rare, and PR-AUC (area under the precision–recall curve) does. This note is the other half — what to do once you have measured it.

## The shape of the problem

Counted from the released MoleculeNet files, the two standard examples:

| Dataset | Molecules | Positives | Positive rate |
| --- | --- | --- | --- |
| HIV | 41,127 | 1,443 | **3.5%** |
| Tox21, 12 tasks | 7,831 | 186–942 per task | **2.9% to 16.2%**, 7.5% pooled |

A model that answers "inactive" for every molecule in HIV is 96.5% accurate and has found nothing. Tox21 is worse than it looks, because 17% of its label cells are missing — the scarce task (NR-PPAR-gamma, 186 positives in 6,450 labelled molecules) is both imbalanced and small.

Loss curves do not announce this. Training converges, the accuracy is high, and what the model learned is the prior.

## Three places you can intervene

| Where | Lever | What it changes | What it costs |
| --- | --- | --- | --- |
| **the data** | oversampling, undersampling, SMOTE | the distribution the model is trained on | duplicated or invented samples, or discarded real ones |
| **the loss** | class weights, weighted cross-entropy, focal loss | how much each example contributes to the gradient | the output probabilities stop being calibrated |
| **the decision** | the threshold, chosen on validation | only how the score is read | nothing in the model — you need validation data and an operating point |

<mark>These are not three ways of doing the same thing.</mark> The first two change what the model learns; the third changes nothing about the model and only moves where you cut its output. So they compose, and the third is the one people forget — it is also the only one that is free.

## The data

**Random oversampling** copies minority examples until the classes are even. The copies are identical, so a flexible model memorises them and the validation score drops while the training score climbs.

**Random undersampling** deletes majority examples instead. On HIV that means throwing away most of 39,684 real measurements to keep 1,443 — on datasets this small, the data you discard costs more than the balance you gain.

**SMOTE** (synthetic minority over-sampling technique) interpolates: it takes a minority point, picks one of its nearest minority neighbours, and creates a new point somewhere on the segment between them. It works on tabular features, and **it is a poor fit for molecules.** A [fingerprint](../descriptors-fingerprints-en/) is a bit vector of substructure presence; the midpoint between two fingerprints has fractional bits and corresponds to no molecule at all. The same holds for a learned embedding — the interpolated vector is in the feature space but not in chemical space, and you have taught the model to separate actives from inactives using points that cannot be synthesised. If the features were continuous physicochemical descriptors the objection is weaker, but still: a point halfway between two drugs is not a drug.

One rule that applies to all three: **resampling happens inside the fold, never before splitting.** Oversample first and copies of the same molecule land in train and test, which is the duplicate leakage from [evaluating a model](../evaluation-protocol-en/) — with the sample count inflated so the score looks stable too. In `sklearn` terms the resampler goes in the pipeline, and the pipeline goes inside the CV (cross-validation) loop.

## The loss

Cheaper and usually better: leave the data alone and change what an error costs.

**Class weights** multiply each class's loss term by a constant, conventionally inversely proportional to its frequency. `class_weight='balanced'` in `sklearn` and `pos_weight` in `BCEWithLogitsLoss` are this. It is one argument, and on the MoleculeNet classification sets it is the first thing worth trying.

**Focal loss** asks a different question. Weighting by class treats every positive as equally important, but most of the loss in an imbalanced batch comes from the many easy negatives the model already gets right. Focal loss down-weights those:

$$
\mathrm{FL}(p_t) = -(1 - p_t)^{\gamma} \log p_t
$$

where $p_t$ is the predicted probability of the true class. At $\gamma = 0$ this is ordinary cross-entropy. For $\gamma > 0$ the factor $(1-p_t)^\gamma$ shrinks toward zero exactly where $p_t$ is already near 1, so an example the model is confident and correct about contributes almost nothing and the gradient concentrates on the hard ones. $\gamma = 2$ is the usual starting point.

Both levers share a side effect worth stating now: they change the model's notion of how common a positive is, so the probabilities it reports are no longer the probabilities of the data you have.

## The decision — the most underrated

A classifier does not output a class. It outputs a score, and 0.5 is where someone decided to cut it. On a balanced problem that convention is harmless; at a 3.5% positive rate it is an arbitrary choice that silently sets your precision and recall.

<mark class="blue">Choosing the threshold on a validation set for the operating point you actually need often beats every resampling trick, and it costs one pass over data you already have.</mark>

Pick the recall you can live with and take the best precision available at that recall:

```python
import numpy as np
from sklearn.datasets import make_classification
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import precision_recall_curve, precision_score, recall_score

X, y = make_classification(n_samples=20000, weights=[0.97], flip_y=0.01, random_state=0)
Xtr, Xtmp, ytr, ytmp = train_test_split(X, y, test_size=0.4, stratify=y, random_state=0)
Xva, Xte, yva, yte = train_test_split(Xtmp, ytmp, test_size=0.5, stratify=ytmp, random_state=0)
m = LogisticRegression(max_iter=1000).fit(Xtr, ytr)

# the threshold is chosen on validation, for the recall I can live with
p, r, t = precision_recall_curve(yva, m.predict_proba(Xva)[:, 1])
ok = r[:-1] >= 0.50
thr = t[ok][np.argmax(p[:-1][ok])]

s = m.predict_proba(Xte)[:, 1]
for name, cut in (("default", 0.5), ("tuned", thr)):
    yh = s >= cut
    print(name, round(cut, 3), round(precision_score(yte, yh), 3), round(recall_score(yte, yh), 3))

# default 0.5   precision 0.911  recall 0.295
# tuned   0.162 precision 0.425  recall 0.532
```

Same model, same scores, two readings of them. The default threshold quietly chose recall 0.295 — it finds fewer than a third of the positives, which for a screen is a failure nobody reported. Moving the cut to 0.162 nearly doubles recall and gives up precision to pay for it. Neither row is better in the abstract; the point is that 0.5 was never a result, and the choice should be made on purpose.

The threshold is a parameter, so it is chosen on validation data and never on test. Tuning it on the test set is the same mistake as early stopping there.

## What it costs

Resampling and weighting both work by lying to the model about how common a positive is, and the model believes it. After either, a predicted 0.8 does not mean 80% — the scores are shifted toward the minority class by roughly the factor you applied.

For a ranking that does not matter at all. You are going to sort compounds and take the top of the list, and a monotone distortion leaves the order intact. It matters when the number feeds a decision: a risk estimate, a cost-weighted triage, anything that combines the output with other probabilities. **If you need probabilities rather than a ranking, recalibrate afterwards on held-out data** — or skip resampling, keep the original prior, and move the threshold instead.

## When the imbalance is the point

In virtual screening the rarity is not a defect in the dataset. It is the task: there really are a few actives among a hundred thousand compounds, and a model trained on a rebalanced set has been trained for a world that does not exist. Rebalancing until the confusion matrix looks tidy optimises for a distribution you will never deploy on.

So for a screen the usual move is the plain one — keep the data as it is, report PR-AUC and enrichment instead of accuracy, and choose a threshold for the number of compounds you can actually assay. Reach for class weights if the minority gradient is genuinely being drowned, and for SMOTE on molecules, essentially never.

## Summary

- HIV is 3.5% active and Tox21 runs 2.9% to 16.2% per task; "always inactive" scores 96.5% on HIV
- Measurement belongs to [metrics](../metrics-en/) — **ROC-AUC does not warn you, PR-AUC does**
- Three levers, not interchangeable: **the data, the loss, the decision** — and they compose
- Oversampling duplicates, undersampling discards, and **SMOTE interpolates to points that are not molecules**
- Resampling goes **inside the fold**, after the split, or you have manufactured leakage
- **Class weights are one argument**; focal loss adds $(1-p_t)^\gamma$ to concentrate the gradient on hard examples
- **The threshold is the forgotten lever** — chosen on validation, for the operating point you need, never on test
- Resampling and weighting **break calibration**; fine for a ranking, not for a probability
- In virtual screening the imbalance is the task: keep the data, report PR-AUC and enrichment, choose a threshold

## References

- Chawla et al., [SMOTE: synthetic minority over-sampling technique](https://doi.org/10.1613/jair.953), *J. Artif. Intell. Res.* (2002) — the original method, on tabular data
- Lin et al., [Focal loss for dense object detection](https://arxiv.org/abs/1708.02002), *arXiv:1708.02002* (2017) — where $(1-p_t)^\gamma$ comes from
- Saito & Rehmsmeier, [The precision-recall plot is more informative than the ROC plot when evaluating binary classifiers on imbalanced datasets](https://doi.org/10.1371/journal.pone.0118432), *PLoS ONE* (2015)
- Wu et al., [MoleculeNet: a benchmark for molecular machine learning](https://doi.org/10.1039/C7SC02664A), *Chem. Sci.* (2018) — the source of the HIV and Tox21 label files
