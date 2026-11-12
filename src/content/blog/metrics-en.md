---
title: "Metrics: which number, and what it hides"
date: 2025-02-07
description: "Accuracy lies under imbalance and ROC-AUC barely notices · precision, recall, F1 and MCC · why PR-AUC collapses where ROC does not · RMSE against MAE, Pearson against Spearman · and the convention each benchmark expects"
category: concept
updated: 2025-03
lang: en
group: metrics
topic: Machine learning
subtopic: Evaluation
tags: [evaluation, ROC-AUC, PR-AUC, RMSE]
---

A metric is what [splits](../evaluation-protocol-en/), [activity cliffs](../activity-cliff-en/) and [benchmarks](../mpp-en/) are all argued over, and it is usually quoted without saying what it measures.

The first question is not which metric. It is what an error costs. A false positive in a virtual screen wastes an assay; a false negative loses the compound. Those are not the same price, and no single number encodes both.

## Classification: everything comes from four counts

| | predicted positive | predicted negative |
| --- | --- | --- |
| **actually positive** | TP (true positive) | FN (false negative) |
| **actually negative** | FP (false positive) | TN (true negative) |

| Metric | Formula | Reads as |
| --- | --- | --- |
| accuracy | (TP+TN)/all | how often it is right |
| precision | TP/(TP+FP) | when it says yes, how often is it right |
| recall (sensitivity) | TP/(TP+FN) | of the real positives, how many did it find |
| specificity | TN/(TN+FP) | of the real negatives, how many did it reject |
| F1 | harmonic mean of precision and recall | one number, ignores TN entirely |
| **MCC** (Matthews correlation coefficient) | correlation of prediction and truth | uses all four cells, so imbalance does not inflate it |

<mark>Precision and recall trade against each other, and which you want is a property of your problem, not of your model.</mark> Screening a million compounds to pick a hundred for assay: precision. Screening for a safety liability you cannot afford to miss: recall.

## Accuracy under imbalance, and why ROC-AUC does not warn you

<figure>
<img src="/assets/fig/metrics-imbalance.svg" alt="ROC curves, precision-recall curves and the three numbers side by side as the positive rate falls" loading="lazy" />
<figcaption><b>The same classifier, three positive rates.</b> Computed for this note — the model's quality is held fixed and only the class balance changes. <b>(A)</b> the ROC curve barely moves. <b>(B)</b> precision–recall collapses. <b>(C)</b> and the grey bar is the accuracy of predicting "negative" every time.</figcaption>
</figure>

The numbers from that run. ROC-AUC is the area under the receiver operating characteristic curve; average precision summarises the precision–recall (PR) curve as a weighted mean of the precision at each threshold, using the increase in recall as the weight. It is not the trapezoidal area, which is why `average_precision_score` and `auc` on the same curve disagree.

| Positive rate | ROC-AUC | Average precision | Accuracy of "always negative" |
| --- | --- | --- | --- |
| 50% | 0.832 | 0.826 | 0.500 |
| 9% | 0.846 | 0.416 | 0.909 |
| 1% | **0.879** | **0.148** | **0.990** |

Three things follow.

**Accuracy becomes meaningless.** At 1% positives, a model that always says "no" is 99% accurate. Only the gap between a reported accuracy and the majority-class rate carries information.

**ROC-AUC does not drop.** It is built from TPR (true positive rate) and FPR (false positive rate), both of which are rates within one class, so changing the class ratio leaves it where it was — the small rise above is sampling noise on 50 positives. <mark class="blue">ROC-AUC is nearly invariant to class balance, which sounds like a virtue and means it cannot tell you the task got harder.</mark>

**Average precision collapses, 0.83 → 0.15.** Precision has FP in its denominator with no TN to dilute it, so it feels the shrinking positive class directly. That is the number that tracks what you would actually experience.

So: **report PR-AUC (area under the precision–recall curve) alongside ROC-AUC whenever positives are rare**, and remember the PR baseline is the positive rate (0.01 here) while the ROC baseline is always 0.5.

**MCC** is the one-number alternative. It uses all four cells and is only high when the model does well on both classes, which makes it the right single summary under imbalance.

## Threshold or no threshold

| Depends on a threshold | Does not |
| --- | --- |
| accuracy, precision, recall, F1, MCC | ROC-AUC, PR-AUC |

A threshold-free metric summarises the model's ranking across every cutoff, which is right when you have not chosen one. A thresholded metric answers what happens when you deploy. Reporting only the first and deploying the second is where a good ROC-AUC turns into a disappointing system.

And neither says whether the probabilities mean anything. A model can rank perfectly and still be badly **calibrated** — if "0.8" does not happen 80% of the time, the score is a ranking, not a probability. A [calibration curve](../plots/#domain) is how you check, and it matters when the number feeds a decision rather than a sort.

## Regression

<figure>
<img src="/assets/fig/metrics-regression.svg" alt="One outlier moving RMSE far more than MAE, and Pearson against Spearman on a monotone non-linear relationship" loading="lazy" />
<figcaption><b>Two choices that are not cosmetic.</b> <b>(A)</b> adding one bad prediction moves RMSE 0.36 → 0.65 and MAE 0.29 → 0.33. <b>(B)</b> on a monotone but non-linear relationship, Pearson reads 0.86 and Spearman 0.96. Computed for this note.</figcaption>
</figure>

| Metric | Property |
| --- | --- |
| **RMSE** (root mean squared error) | squares the error, so one bad prediction dominates — the molecular machine learning convention |
| **MAE** (mean absolute error) | linear in the error, robust to outliers; the convention in quantum chemistry |
| R² | fraction of variance explained; depends on the spread of your test set, so it is not comparable across datasets |
| Pearson | linear agreement |
| Spearman | rank agreement — the right one when you only need the ordering |

The RMSE/MAE choice is a statement about outliers. **If a single bad prediction is a catastrophe, RMSE is right; if it is one bad compound among many, MAE describes typical behaviour better.** Reporting both costs nothing and the gap between them tells the reader how heavy the tail is.

Pearson versus Spearman is the same kind of choice. In virtual screening you are going to take the top 100, so rank agreement is what matters and a non-linear but monotone model is fine. Panel B is that case: Pearson punishes it, Spearman does not.

## What each benchmark expects

Conventions exist so numbers are comparable, and deviating from one silently is how comparisons break.

| Benchmark | Metric | Why |
| --- | --- | --- |
| MoleculeNet classification (BBBP, BACE, Tox21, SIDER…) | **ROC-AUC** | the established convention, imbalance notwithstanding |
| MoleculeNet regression (ESOL, FreeSolv, Lipophilicity) | **RMSE** | |
| quantum-chemistry datasets (QM7/8/9) | **MAE** | |
| MoleculeACE | **RMSE**, reported separately on the cliff subset | see [activity cliffs](../activity-cliff-en/) |
| virtual screening | enrichment factor, BEDROC (Boltzmann-enhanced discrimination of ROC) | they weight the top of the ranking, which is all anyone looks at |
| multi-task sets (ToxCast, 617 tasks) | mean over tasks | **say whether it is the mean of per-task ROC-AUCs or one pooled ROC-AUC** — they differ |

That last row is a real source of incomparable numbers, and papers often do not say which they did.

Measuring under imbalance is one thing; [doing something about it](../class-imbalance-en/) is another, and the two are often confused.

## Summary

- Decide what an error **costs** before choosing a metric; precision and recall trade, and which you want is a property of the problem
- **Accuracy is meaningless under imbalance** — compare it to the majority-class rate before believing it
- **ROC-AUC is nearly invariant to class balance**: 0.83 → 0.88 while average precision went 0.83 → 0.15
- Report **PR-AUC with ROC-AUC** when positives are rare; the PR baseline is the positive rate, not 0.5
- **MCC** is the single number that imbalance does not inflate
- Threshold-free metrics summarise ranking; thresholded ones describe deployment; **calibration** is a third thing again
- **RMSE punishes outliers, MAE describes the typical case** — report both; **Spearman** when only the ordering matters
- Follow the benchmark's convention, and state whether a multi-task number is a mean of per-task ROC-AUCs or one pooled ROC-AUC

## References

- Saito & Rehmsmeier, [The precision-recall plot is more informative than the ROC plot when evaluating binary classifiers on imbalanced datasets](https://doi.org/10.1371/journal.pone.0118432), *PLoS ONE* (2015)
- Chicco & Jurman, [The advantages of the Matthews correlation coefficient (MCC) over F1 score and accuracy in binary classification evaluation](https://doi.org/10.1186/s12864-019-6413-7), *BMC Genomics* (2020)
- Wu et al., [MoleculeNet: a benchmark for molecular machine learning](https://doi.org/10.1039/C7SC02664A), *Chem. Sci.* (2018) — where the conventions come from
- Truchon & Bayly, [Evaluating virtual screening methods: good and bad metrics for the early recognition problem](https://doi.org/10.1021/ci600426e), *J. Chem. Inf. Model.* (2007) — BEDROC
