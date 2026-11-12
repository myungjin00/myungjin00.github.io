---
title: "Loss functions: what you are actually asking the model to do"
date: 2024-11-01
description: "The loss is the specification · squared, absolute and Huber error, and which one noisy labels want · cross-entropy rather than accuracy · triplet, InfoNCE and NT-Xent built up from the goal · what the temperature really changes · and the ways a loss quietly specifies the wrong thing"
category: concept
updated: 2024-11
lang: en
group: loss-functions
topic: Machine learning
subtopic: Basics
tags: [loss functions, contrastive learning, optimisation]
---

[One training step](../training-basics-en/) turns the loss into a gradient and the gradient into a weight update, so the loss is the only door the task comes in through. A model does not learn "the task" — it minimises a number. Anything you care about that is not inside that number will not be learned, and no amount of tuning elsewhere puts it back.

## Regression losses

Three losses, differing only in how the penalty grows with the size of the error.

| Loss | Form | Penalty shape | Right when |
| --- | --- | --- | --- |
| **MSE** (mean squared error) | $\frac{1}{n}\sum_i (y_i - \hat y_i)^2$ | quadratic — an error twice as large costs four times as much | errors are roughly symmetric and every label is trustworthy. The default |
| **MAE** (mean absolute error) | $\frac{1}{n}\sum_i \lvert y_i - \hat y_i \rvert$ | linear — every error costs in proportion to its size | the labels contain outliers you do not want the model chasing. Not differentiable at zero |
| **Huber** / smooth L1 | quadratic below $\delta$, linear above | quadratic near zero, linear far from it | you want MAE's robustness and MSE's smooth gradient near the optimum |

Huber is the explicit compromise:

$$
L_\delta(e) = \begin{cases}
\tfrac{1}{2}e^{2} & \lvert e \rvert \le \delta \\[2pt]
\delta\left(\lvert e \rvert - \tfrac{1}{2}\delta\right) & \text{otherwise}
\end{cases}
$$

MAE's problem is the kink: the gradient is $\pm 1$ everywhere and does not shrink as the error does, so the last stretch of convergence is a model stepping back and forth across the optimum at constant size. Huber keeps the quadratic region where that matters and switches to linear where the outliers are, with $\delta$ deciding where "outlier" starts.

This is not a detail in [molecular property prediction](../mpp-en/). A solubility or lipophilicity set is assembled from many papers and many labs, and a handful of labels are off by two log units because of an assay difference nobody recorded. Under MSE an error of 2 costs a hundred times an error of 0.2, so a few bad labels can take most of the gradient and the model spends its capacity fitting measurement noise. <mark>With a few thousand molecules and a handful of bad ones, the choice between squared and absolute error is a choice about which labels the model believes.</mark>

## Classification losses

For two classes the network emits one **logit** $z$ — an unbounded real number — and the sigmoid turns it into a probability:

$$
p = \sigma(z) = \frac{1}{1 + e^{-z}}, \qquad
L = -\frac{1}{n}\sum_i \Big[\, y_i \log p_i + (1 - y_i)\log(1 - p_i) \,\Big]
$$

For $C$ classes it emits $C$ logits and the softmax normalises them into a distribution, of which the loss keeps only the term for the true class:

$$
p_{i,c} = \frac{\exp(z_{i,c})}{\sum_k \exp(z_{i,k})}, \qquad
L = -\frac{1}{n}\sum_i \log p_{i,y_i}
$$

The exponential is what the softmax is for. It makes everything positive so it can be normalised, and it makes only the *differences* between logits matter — add 5 to every logit and the distribution is unchanged. The sigmoid is the two-class softmax written out.

**Why cross-entropy and not accuracy**, when accuracy is what gets reported: accuracy is a count of correct predictions, and a count is flat. Move a predicted probability from 0.4 to 0.49 and the prediction is still the same class, so accuracy does not move and its gradient is zero almost everywhere. Cross-entropy is continuous in the predicted probability, so every example contributes a direction — including the ones already classified correctly, which it keeps pushing toward confidence. The loss is what you optimise; accuracy is one of [the numbers you report](../metrics-en/), and the two are allowed to disagree.

**Label smoothing** softens the target: instead of 1 for the true class and 0 elsewhere, use $1 - \varepsilon$ and spread $\varepsilon$ over the rest, with $\varepsilon = 0.1$ typical. A hard target of exactly 1 is only reachable at an infinite logit, so the model keeps growing logits for loss it can never finish collecting. Smoothing removes that incentive and usually leaves the probabilities better calibrated.

## Contrastive losses

Now the case with no labels at all. What you have instead is a **positive pair** — two things that should land close together — and a pile of other items that should land apart. The loss is a statement about the geometry of the embedding space: pull the pair together, push everything else away. This is the objective behind [self-supervised pre-training](../learning-paradigms-en/).

### Triplet loss

The oldest form takes three items: an anchor $a$, a positive $p$, a negative $n$, and a distance $d$.

$$
L = \max\big(0,\; d(a,p) - d(a,n) + m \big)
$$

The loss is zero as soon as the negative is further away than the positive by at least the **margin** $m$, and positive otherwise. The margin is the entire mechanism. With $m = 0$ the loss is minimised perfectly by an encoder that maps every input to the same point: then $d(a,p) = d(a,n) = 0$, the difference is zero, and nothing is learned. That is the **trivial collapse**, and it is what a loss looks like when it is satisfiable without doing the task. Demanding a *gap* rather than an ordering is what a constant map cannot supply.

The practical cost is that most triplets are already satisfied and contribute no gradient, so triplet training needs mining — picking hard triplets per batch. A regression model can carry a triplet term for the same reason, which is what activity-cliff-aware models do with [cliff](../activity-cliff-en/) triplets.

### InfoNCE and NT-Xent

InfoNCE (information noise-contrastive estimation) replaces one negative with all of them. NT-Xent (normalised temperature-scaled cross-entropy) is SimCLR's name for the same loss applied to L2-normalised embeddings, so that the similarity is a cosine:

$$
\mathcal{L}_i = -\log
\frac{\exp\!\big(\mathrm{sim}(z_i,\, z_i^{+})/\tau\big)}
{\sum_{j \neq i}\exp\!\big(\mathrm{sim}(z_i,\, z_j)/\tau\big)}
$$

The numerator holds the positive. The denominator holds the positive *and* every negative, which is why the loss falls only when the positive's similarity grows relative to the rest.

<mark class="blue">Read the formula as cross-entropy and the whole thing becomes one classification problem: given the anchor, pick the positive out of the batch.</mark> The candidates are the classes, the similarities are the logits, and the index of the positive is the label. That is not an analogy — the implementation is literally cross-entropy on a similarity matrix:

```python
import torch, torch.nn.functional as F

def nt_xent(z, tau):
    z = F.normalize(z, dim=1)            # 2N embeddings: i and i+N are the two views of one molecule
    sim = z @ z.T / tau                  # cosine similarity, scaled by the temperature
    sim.fill_diagonal_(-torch.inf)       # a view is not its own negative
    N = z.shape[0] // 2
    target = torch.cat([torch.arange(N, 2 * N), torch.arange(0, N)])
    return F.cross_entropy(sim, target)  # "pick the positive out of the batch"

torch.manual_seed(43)
z = torch.randn(128, 64)                 # 64 molecules, 2 views each, untrained encoder
for tau in (0.07, 0.5):
    print(f"tau={tau}: loss = {nt_xent(z, tau).item():.3f}")
print("chance level = ln(127) =", round(torch.log(torch.tensor(127.0)).item(), 3))
# tau=0.07: loss = 6.242
# tau=0.5: loss = 4.856
# chance level = ln(127) = 4.844
```

With 64 molecules and two views each there are 127 candidates per anchor, so an encoder that knows nothing should score $\ln 127 = 4.844$ — and at $\tau = 0.5$ a random encoder scores 4.856, which is the sanity check worth running before any pre-training run. At $\tau = 0.07$ the same random embeddings score 6.242, *worse* than chance, because some negative is accidentally nearer than the positive and a small temperature charges full price for it.

### Temperature

$\tau$ divides every similarity before the softmax, so it sets how peaked the distribution over candidates is. What that does to the gradient, for one anchor with five negatives at fixed similarities:

```python
import torch
neg = torch.tensor([0.80, 0.40, 0.20, 0.00, -0.20])   # cosine similarity to five negatives
for tau in (0.05, 0.2, 1.0):
    w = torch.softmax(neg / tau, 0)
    print(f"tau={tau:<5} share of the gradient on each negative: "
          + " ".join(f"{x:.3f}" for x in w))
# tau=0.05  share of the gradient on each negative: 1.000 0.000 0.000 0.000 0.000
# tau=0.2   share of the gradient on each negative: 0.826 0.112 0.041 0.015 0.006
# tau=1.0   share of the gradient on each negative: 0.329 0.221 0.181 0.148 0.121
```

Those softmax weights are what each negative gets pushed by. At $\tau = 0.05$ the nearest negative takes essentially all of it and the other four are not trained on at all; at $\tau = 0.2$ it takes 0.826; at $\tau = 1.0$ the five are nearly uniform, from 0.329 down to 0.121.

So a **small $\tau$ makes the loss perform hard-negative mining by itself**, and a large one treats all negatives alike. Neither is free. A sharp temperature produces well-separated embeddings, but the hardest negative in a molecular batch is often a genuinely similar compound — an analogue, or the same structure written as another tautomer — and the model is being told at full strength to separate two things that belong together. A flat temperature is tolerant of those near-duplicates and gives a representation that is less evenly spread. Wang and Isola describe this as the trade-off between alignment of positive pairs and uniformity of the embeddings on the sphere.

$\tau$ is not a minor knob. It changes which negatives the model is trained on, and so what the representation ends up encoding.

### Negatives come from the batch

In the NT-Xent form there is no negative sampler: the negatives are simply the other items in the batch. Batch 256 gives 510 negatives per anchor, batch 32 gives 62, and a denominator with 62 candidates is an easy task — even a weak encoder picks the positive, the loss falls, and little is learned. **The loss and the batch size are not independent hyperparameters**, which is why contrastive methods ask for batches far larger than supervised training needs, and why variants that keep a queue of past embeddings exist at all. It also means the batch-size and learning-rate coupling from [the training loop](../training-basics-en/) is doing double duty here.

### Two views, not two augmentations

Where the positive pair comes from is the real design decision, and it is upstream of the loss. In images you augment the same image twice. In molecules augmentation is the unsafe step — delete an atom and you have a different compound — which is the [whole argument against augmentation-based positive pairs](../augmentation-en/).

A dual-view encoder makes the pair differently: one molecule is encoded both as an atom graph and as a [junction tree](../fragmentation-en/), and those two are already two descriptions of the same molecule. The positive pair is free, nothing was perturbed, and no label-preserving augmentation has to be assumed. That is the setup in my own pre-training work, and the loss itself is unmodified NT-Xent — only the source of the numerator changed.

It fixes the numerator and not the denominator. Two distinct molecules in the same batch can still be near-duplicates, and the loss will push them apart regardless, because nothing in it knows they are related.

## Multi-task and weighted losses

Several objectives at once means a weighted sum:

$$
\mathcal{L} = \sum_t \lambda_t \,\mathcal{L}_t
$$

With tasks of one kind this is mild — a 12-task toxicity set is the mean of 12 binary cross-entropies, with missing labels masked out rather than counted as negatives. With tasks of different kinds it is not. A regression term sitting around 0.6 and a contrastive term sitting around 4 do not share a scale, so an unweighted sum hands most of the gradient to whichever term happens to be numerically larger, and the other one is along for the ride.

$\lambda_t$ is a hyperparameter on the same footing as the learning rate and belongs in [the search](../hyperparameter-search-en/). The cheap starting point is to scale the terms so they are comparable at initialisation, then search an order of magnitude either side; reporting a multi-task result without saying what the weights were leaves out one of the two things that produced it.

## What goes wrong

- **The loss does not match the metric you report.** Trained on MSE, reported as Spearman correlation; trained on cross-entropy, selected on ROC-AUC (area under the receiver operating characteristic curve). Usually fine, occasionally not, and worth knowing which one picked your checkpoint.
- **Class imbalance.** At 5% positives, predicting "negative" for everything is a low loss, and the majority class supplies 95% of the gradient. Class weights or a focal loss change the specification; resampling changes the data instead.
- **The loss is minimisable trivially.** A zero-margin triplet loss, a contrastive loss with too few negatives, an autoencoder wide enough to copy its input. If a constant or degenerate encoder scores well, the loss is not specifying the task.
- **Numerical failure.** $\log 0$ is $-\infty$, and a probability that rounded to 0 or 1 produces exactly that. Pass logits to the loss rather than probabilities — `binary_cross_entropy_with_logits` instead of a sigmoid followed by `binary_cross_entropy` — because the fused form cancels the log against the exponential and never evaluates either at its limit.
- **Tuning the loss to the test set.** Trying MSE, then MAE, then Huber, then two $\lambda$ values, and keeping what scored best on test, is hyperparameter search with the test set as the validation set. The loss is a hyperparameter like any other and the choice belongs on [a validation split](../evaluation-protocol-en/).

## Summary

- The loss is the specification. What is not in that number is not learned
- MSE is the default; MAE resists outliers but has a constant gradient; Huber is quadratic near zero and linear beyond $\delta$
- A few mismeasured labels can take most of the gradient under MSE, which is the usual case in molecular property data
- Cross-entropy, not accuracy, because a count of correct answers has **no useful gradient**; label smoothing stops logits growing without end
- Triplet loss needs a **margin**, and the margin is what rules out mapping everything to one point
- InfoNCE and NT-Xent are **one classification problem: pick the positive out of the batch**, with the positive in the numerator and all negatives in the denominator
- The temperature decides how much of the gradient the hardest negative gets — at $\tau = 0.05$ essentially all of it, at $\tau = 1.0$ nearly none in particular
- Negatives come from the batch, so **batch size is part of the loss**
- Two views of one molecule give a positive pair with no augmentation; the denominator stays as problematic as before
- Loss weights in a multi-task sum are **a real hyperparameter**, and an unweighted sum is a decision too

## References

- Chen et al., [A simple framework for contrastive learning of visual representations](https://arxiv.org/abs/2002.05709) (ICML 2020) — SimCLR and the NT-Xent form, including the batch-size dependence
- van den Oord et al., [Representation learning with contrastive predictive coding](https://arxiv.org/abs/1807.03748) (2018) — where InfoNCE comes from
- Schroff et al., [FaceNet: a unified embedding for face recognition and clustering](https://arxiv.org/abs/1503.03832) (CVPR 2015) — triplet loss with a margin, and online mining
- Wang & Isola, [Understanding contrastive representation learning through alignment and uniformity on the hypersphere](https://arxiv.org/abs/2005.10242) (ICML 2020) — what the contrastive loss optimises, stated as two measurable properties
