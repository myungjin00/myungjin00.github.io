---
title: "Hyperparameter search: grid, random and Bayesian optimisation"
date: 2026-02-27
description: "Why these settings cannot be learned by gradient descent · the budget is the real constraint · how grid search wastes it · what a surrogate and an acquisition function actually do · searching on the validation set and nowhere else"
category: concept
updated: 2026-03
lang: en
group: hyperparameter-search
topic: Machine learning
subtopic: Evaluation
tags: [hyperparameter search, Bayesian optimisation, Gaussian process, grid search]
---

When I tune a model for [molecular property prediction](../mpp-en/), the configuration is not something I pick once and forget. On the [MoleculeACE](../activity-cliff-en/) benchmark I run Gaussian process Bayesian optimisation with a budget of about 50 trials per dataset, and that one line hides most of the method.

## This is not training

A **parameter** is learned. A **hyperparameter** (HP) is a setting you hand the training run before it starts, and the reason you cannot learn it the same way is mechanical: the thing you want to maximise is the validation score, and the validation score is not differentiable with respect to the learning rate or the number of layers. There is no gradient to follow.

| | parameter | hyperparameter |
| --- | --- | --- |
| examples | weights, biases | learning rate, depth, weight decay, batch size |
| fitted by | gradient descent on the training loss | search over the validation score |
| cost of one update | one mini-batch | **one entire training run** |
| how many | millions | a handful |

The last two rows are the whole problem. Every candidate configuration costs a full training run to evaluate, so the real constraint is not compute in the abstract — it is the number of **trials** you can afford. Given a budget of *n* trials, where do you spend them?

## Grid search, and why it wastes the budget

Grid search takes a list of values per knob and tries every combination. Four knobs with five values each is $5^4 = 625$ runs. Add a fifth knob and it is 3,125. If one run takes twenty minutes, 625 runs is around nine days on one GPU.

The combinatorial blow-up is the obvious objection, and coarsening the grid avoids it. What coarsening does not avoid:

<mark class="blue">Most hyperparameters do not matter, and a grid spends the same number of trials on the ones that do not as on the ones that do.</mark>

In that 625-run grid, suppose only the learning rate really moves the score. The grid tried exactly **five** learning rates and spent 620 runs re-confirming the same five values under settings that made no difference. You paid for 625 trials and got a five-point sweep of the one axis you cared about.

## Random search beats grid search

Bergstra & Bengio's result is often repeated as "random is luckier", which is not it. The argument is about coverage per axis. Draw each hyperparameter independently from its range and run *n* trials: you get *n* distinct values of **every individual** parameter, not $n^{1/4}$ of each.

| budget | grid (4 knobs) | random |
| --- | --- | --- |
| 625 trials | 5 distinct learning rates | 625 distinct learning rates |
| 16 trials | 2 distinct learning rates | 16 distinct learning rates |

<figure>
<img src="/assets/fig/random-vs-grid.svg" alt="A 4 by 4 grid and 16 random draws over a score surface where only the horizontal axis matters" loading="lazy" />
<figcaption><b>The grid tries four values of the axis that matters; random tries sixteen.</b> Colour is the score, and only the horizontal axis moves it. On this seed the two finish level &mdash; 0.986 for random against 0.985 for grid &mdash; because one grid column happened to land 0.015 away from the optimum. Put the optimum in a random position and repeat 2,000 times and random wins 74% of them, with a mean best of 0.92 against the grid&rsquo;s 0.76: the four columns are fixed in advance, so when the optimum falls between them no amount of budget finds it.</figcaption>
</figure>

So if the score depends mostly on one or two axes — which is the usual case — random search finds a good value of the axis that matters, and it does so at small budgets where a grid is degenerate. Two more practical points: a random search has no shape to commit to in advance, so any prefix of it is still a valid search and you can stop when you run out of time; and it costs nothing to set up. **Random search is the right default when you have no time to set anything else up.**

## Bayesian optimisation

Random search throws away its own results — trial 40 is drawn with no memory of trials 1 to 39. Bayesian optimisation is the version that reads its own history, and it has exactly two pieces.

### The surrogate

A cheap model of the expensive thing. The expensive thing is "train the network at this configuration and report the validation score"; the surrogate is a regression model that predicts that score as a function of the hyperparameters, fitted on the trials run so far. Because it is cheap, you can evaluate it at thousands of candidate settings for free. It reports **an uncertainty** alongside each prediction, which is what makes the next step possible.

### The acquisition function

Given the surrogate, where do you actually run the next trial? Two answers pull in opposite directions. **Exploitation** says go where the surrogate predicts the best score. **Exploration** says go where the surrogate is unsure, because that is where it might be wrong and where a surprise is still possible. Pure exploitation gets stuck next to the best trial so far; pure exploration is random search.

The **acquisition function** is the scalar that resolves the trade-off: it scores every candidate setting using both the prediction and its uncertainty, and the next trial goes to the argmax. The common choice is **expected improvement** (EI), which computes how much better than the best score so far a candidate is expected to be, averaging over the surrogate's predictive distribution and counting no improvement as zero. A setting is attractive to EI either because its predicted score is high or because its error bar is wide enough to reach past the current best.

### The Gaussian process surrogate

A **Gaussian process** (GP) is the standard surrogate. Instead of fitting one function through the trials, it fits a distribution over functions consistent with them: at every untried setting it returns a mean and a standard deviation, tight near settings you have already run and wide far away from them. That error bar is not an add-on — it is the same object EI needs, which is why the GP and EI pair up so naturally.

Two things to know about GPs. They handle continuous parameters well, which is what a learning rate or a dropout rate is. And they scale badly: fitting one is cubic in the number of trials, so past a few hundred trials it becomes the bottleneck. With a budget of ~50 trials that limit is irrelevant, which is exactly why a GP is a reasonable choice for a benchmark where every trial is a full fine-tuning run.

### TPE

**TPE** (tree-structured Parzen estimator) is Optuna's default and the practical alternative. Rather than modelling the score given the hyperparameters, it models the hyperparameters given the score: it splits past trials into a good group and the rest, fits a density to each, and prefers settings that are likely under the good density and unlikely under the other. The reason to reach for it is structural — it handles **categorical** parameters (which optimiser, which pooling) and **conditional** ones (the number of attention heads only exists if the block is an attention block) far more gracefully than a GP, whose covariance function needs a notion of distance that categories do not have.

## Which one when

| method | how it chooses | budget it suits | categorical | when it is the right choice |
| --- | --- | --- | --- | --- |
| **grid** | every combination of fixed lists | small, 2 knobs at most | yes | when you must report an exhaustive sweep, or when a knob has three legitimate values and nothing else varies |
| **random** | independent draws from each range | any, and interruptible | yes | the default; no setup, and strong when few axes matter |
| **Bayesian, GP** | surrogate + acquisition function, continuous | 20–200 | poorly | expensive trials, mostly continuous knobs — my ~50-trial case |
| **Bayesian, TPE** | density of good vs. other trials | 50–1,000 | yes | mixed and conditional search spaces; the sane default in Optuna |
| **Hyperband / successive halving** | start many trials, kill the weak ones early | large, with cheap partial evaluation | yes | when a bad configuration is visible after a few epochs, so most trials never finish |

Hyperband is orthogonal to the others rather than a competitor: it decides **how long** to run each trial, not which trial to run next, and it composes with TPE or a GP choosing the settings.

## Doing it without fooling yourself

A search is a selection procedure, so it is governed by the same discipline as [evaluating a model](../evaluation-protocol-en/).

**The search runs on the validation set. The test set is touched once, at the end.** A hyperparameter search is a selection procedure, and whatever set it selects on stops being an unbiased estimate: search on the test set and it has become a second validation set, with the reported score optimistic by however hard you searched. The amount of optimism grows with the budget, so 200 trials scored on the test set is worse than 20, not better. Under cross-validation (CV) the same rule has a specific shape — the search belongs in an inner loop, inside the folds, with the outer loop only scoring.

**Report the search space and the budget.** A result from 500 trials is not comparable to one from 20, and neither is comparable to a result from a space that happened to be centred on a good configuration. Without the space and the trial count, a table of numbers is a table of search efforts.

**Re-run the chosen configuration over several seeds.** <mark>The best trial of a search is partly a lucky seed, so its score is biased upward exactly as the maximum of noisy draws is.</mark> Fix the configuration, re-run it over several seeds, and report mean ± standard deviation — the [seed argument](../evaluation-protocol-en/) applies with more force here than anywhere else, because selecting the maximum is what creates the bias.

## What to search and what to leave alone

| knob | search it? | how |
| --- | --- | --- |
| [learning rate](../training-basics-en/) | **always** | log scale, e.g. $10^{-5}$ to $10^{-2}$ — a linear range wastes most of its draws on values that are all too large |
| weight decay, dropout | usually | log scale for decay, linear for dropout |
| batch size | low priority | matters less than people expect, and mostly through its interaction with the learning rate |
| width, depth | low priority | a few discrete options is enough; capacity rarely out-ranks the learning rate |
| number of epochs | **no** | handle it with [early stopping](../training-basics-en/) on the validation loss, which adapts per run instead of forcing one number on every configuration |

Searching the number of epochs is the common waste: it turns a quantity that early stopping can determine for free into an axis that costs trials, and it interacts with the learning rate so badly that the result does not transfer to the next configuration.

The failure mode no algorithm fixes: **a search over a badly chosen space finds the best point in a bad space.** If the learning rate range is $10^{-1}$ to $1$, every method here will confidently return $10^{-1}$. When a chosen value sits at the edge of its range, that is the search telling you the range was wrong.

## In practice

`optuna` gives all of this with one function and a sampler swap. The objective below returns a 5-fold CV score, so each trial trains five models, and the three samplers get an identical budget of 50 trials.

```python
import optuna
from sklearn.datasets import load_breast_cancer
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.model_selection import StratifiedKFold, cross_val_score

X, y = load_breast_cancer(return_X_y=True)
cv = StratifiedKFold(5, shuffle=True, random_state=0)

def objective(trial):
    model = HistGradientBoostingClassifier(
        learning_rate=trial.suggest_float("learning_rate", 1e-3, 3e-1, log=True),
        max_leaf_nodes=trial.suggest_int("max_leaf_nodes", 4, 64),
        min_samples_leaf=trial.suggest_int("min_samples_leaf", 5, 50),
        early_stopping=True, random_state=0)
    return cross_val_score(model, X, y, cv=cv, scoring="roc_auc").mean()

optuna.logging.set_verbosity(optuna.logging.WARNING)
for name, sampler in [("TPE", optuna.samplers.TPESampler(seed=0)),
                      ("GP", optuna.samplers.GPSampler(seed=0)),
                      ("random", optuna.samplers.RandomSampler(seed=0))]:
    study = optuna.create_study(direction="maximize", sampler=sampler)
    study.optimize(objective, n_trials=50)
    print(name, round(study.best_value, 4), study.best_params)
```

```
TPE 0.9956 {'learning_rate': 0.28405152738900497, 'max_leaf_nodes': 60, 'min_samples_leaf': 36}
GP 0.9957 {'learning_rate': 0.17122461323998883, 'max_leaf_nodes': 33, 'min_samples_leaf': 50}
random 0.9949 {'learning_rate': 0.1895264927209976, 'max_leaf_nodes': 47, 'min_samples_leaf': 50}
```

The three samplers land within 0.001 of each other, because this dataset is easy and almost any reasonable configuration scores above 0.99 — the sampler only earns its keep when the surface is not flat. The three best configurations disagree wildly on `max_leaf_nodes` while agreeing that the learning rate belongs around 0.2, which is the "most hyperparameters do not matter" point appearing in a real run. And a 0.0008 gap between samplers on a single CV score is well inside seed noise, so it is not a result: the ranking of samplers would need the multi-seed treatment too. The whole script takes about five minutes on CPU, and `GPSampler` still prints an experimental-API warning in Optuna 4.7.

## Summary

- Hyperparameters cannot be learned by gradient descent because the validation score is not differentiable in them; each evaluation costs one full training run, so the budget in trials is the constraint
- Grid search blows up combinatorially — 4 knobs × 5 values is 625 runs — and worse, it spends as many trials on the knobs that do not matter as on the ones that do
- Random search gives *n* distinct values of **each** parameter for *n* trials, which is why it beats a grid at the same budget, and it needs no setup
- Bayesian optimisation = a **surrogate** predicting the score with an uncertainty + an **acquisition function** such as expected improvement trading exploitation against exploration
- A Gaussian process surrogate is strong on continuous knobs and scales to a few hundred trials, which fits a ~50-trial budget; TPE handles categorical and conditional spaces better
- Search on the validation set, touch the test set once, report the space and the budget, and re-run the winner over several seeds
- Search the learning rate on a log scale, deprioritise batch size and width, and leave the epoch count to early stopping

## References

- Bergstra & Bengio, [Random search for hyper-parameter optimization](https://jmlr.org/papers/v13/bergstra12a.html), *JMLR* (2012) — why random beats grid at equal budget
- Snoek et al., [Practical Bayesian optimization of machine learning algorithms](https://arxiv.org/abs/1206.2944), *NeurIPS* (2012) — the Gaussian process + expected improvement recipe
- Akiba et al., [Optuna: a next-generation hyperparameter optimization framework](https://arxiv.org/abs/1907.10902), *KDD* (2019) — the library used above, TPE by default
- Li et al., [Hyperband: a novel bandit-based approach to hyperparameter optimization](https://jmlr.org/papers/v18/16-558.html), *JMLR* (2018) — budget allocation by early stopping of weak trials
