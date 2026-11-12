---
title: "Machine learning and deep learning"
date: 2024-09-13
description: "Writing rules versus finding them · model, loss, optimiser · why feature engineering was the bottleneck · when deep learning wins, and what it costs"
category: concept
updated: 2024-09
lang: en
group: ml-dl
topic: Machine learning
subtopic: Basics
tags: [machine learning, deep learning]
---

**Machine learning** · #1 Machine learning and deep learning · [#2 Supervised, unsupervised, self-supervised](../learning-paradigms-en/) · [#3 Clustering](../clustering-en/) · [#4 Transfer learning](../transfer-learning-en/)

## How it differs from programming

In ordinary programming, **a person writes the rules.**

```
input + rules  →  answer
```

Suppose you had to write rules for whether a molecule is toxic. "If there is a benzene ring with a nitro group attached, then…" — you can stack hundreds of such conditions and the exceptions never stop. Chemistry is not that tidy.

Machine learning turns it around.

```
input + answers  →  rules
```

Give it enough examples with answers attached and the model **fits a function** from input to answer. Instead of writing the rules, you have them found.

<figure>
<svg viewBox="0 0 540 170" role="img" aria-label="Three nested sets: artificial intelligence contains machine learning, which contains deep learning.">
  <rect x="20" y="20" width="500" height="130" rx="8" fill="none" stroke="#D3D8CE"/>
  <rect x="50" y="42" width="440" height="92" rx="7" fill="rgba(30,74,57,.05)" stroke="#1E4A39" stroke-opacity=".4"/>
  <rect x="86" y="64" width="368" height="50" rx="6" fill="rgba(30,74,57,.1)" stroke="#1E4A39" stroke-opacity=".7"/>
  <g font-family="IBM Plex Mono, monospace" font-size="11.5">
    <text x="32" y="38" fill="#6E7873">artificial intelligence</text>
    <text x="62" y="60" fill="#46524D">machine learning — finds the rules in data</text>
    <text x="98" y="93" fill="#1E4A39">deep learning — finds the representation too</text>
  </g>
</svg>
<figcaption><b>How they nest.</b> Deep learning is a kind of machine learning, which is one approach to artificial intelligence (AI). A rule-based expert system is AI but not machine learning.</figcaption>
</figure>

## What machine learning actually does

Three things are enough.

1. **A model** — a function $f_\theta$ with adjustable knobs (parameters)
2. **A loss** — a number $L$ measuring how far a prediction is from the answer
3. **Optimisation** — a procedure that turns the knobs so the loss goes down

Training is this, repeated:

$$
\theta \leftarrow \theta - \eta \, \nabla_\theta L
$$

$\nabla_\theta L$ says which way to turn the knobs to make the loss *worse*, so you move a little ($\eta$) in the **opposite** direction. That is <u>gradient descent</u>.

## Feature engineering as the bottleneck

In traditional machine learning, performance mostly came down to **what you fed the model.**

To put a molecule into a random forest you must first turn it into a vector of numbers: molecular weight, logP, number of hydrogen-bond donors, and **fingerprints**. This step is **feature engineering**.

The problem is the human judgement inside it. A fingerprint records whether certain substructures are present — and **a person decides which substructures to count**. If something important is not on that list, the model has no way to see it.

## What deep learning changed

Deep learning **stacks** simple transformations in layers. Each layer takes the previous one's output and turns it into something a little more useful.

```
atoms and bonds  →  layer  →  layer  →  layer  →  "0.83 toxic"
                 └─ intermediate representations ─┘
```

The key point is that those intermediate representations are **learned too**. Nobody tells the model which substructure to count; it builds whatever features help it solve the task. <mark class="blue">That is **representation learning**, and it is what deep learning actually sells.</mark>

| | traditional machine learning | deep learning |
| --- | --- | --- |
| input | human-designed features | fairly raw (graphs, sequences, images) |
| representation | fixed | learned |
| data needed | less | more |
| interpretation | easier | harder |
| suits | tabular, small data | structured, large data |

## Overfitting and underfitting

A model that fits the training data perfectly has not necessarily learned anything. What you want is a model that does well on data it has never seen, and those two are not the same goal.

<figure>
<img src="/assets/fig/overfitting.svg" alt="A straight line, a good fit and a wild curve through the same 22 points, with training and test error against model capacity" loading="lazy" />
<figcaption><b>Three fits to the same 22 points, and what the error does.</b> The dashed grey line is the function the data really came from. A degree-1 model cannot bend enough to follow it &mdash; it is <b>underfitting</b>, and it is wrong on the training data too. A degree-20 model passes through every training point exactly and invents enormous swings in between &mdash; it is <b>overfitting</b>. Run for this note with scikit-learn.</figcaption>
</figure>

As capacity grows:

- **training loss falls, and keeps falling.** A model with enough parameters can memorise the training set outright. At degree 20 the training RMSE (root mean square error) is 0.03 — essentially zero.
- **test loss falls, bottoms out, then climbs.** Here it is lowest at degree 7 and then explodes, to a test RMSE in the thousands.

The gap between the two curves is what you are actually managing.

| What you see | What it means | What to do |
| --- | --- | --- |
| both losses high | **underfitting** — the model cannot represent the pattern | more capacity, better features, train longer |
| training low, test high | **overfitting** — it memorised | more data, regularisation, early stopping, less capacity |
| both low and close | about right | stop |
| training loss rising | something is broken — learning rate, data, or a bug | fix it before tuning anything |

**More data moves the curve further right** than any regularisation does, which is why the dataset sizes in [molecular property prediction](../mpp-en/) decide so much. **Early stopping** is the cheapest regulariser there is: watch the validation loss and stop when it turns. And the turning point has to be found on a validation set, never on the test set — the moment the test set picks the epoch, it has stopped being a test set.

> In molecular work the overfitting is often not where it looks. A model can score well by recognising a scaffold it saw in training rather than by learning chemistry, and a random split will happily hide that. The [split](../evaluation-protocol-en/) is part of the diagnosis.

## So is deep learning always better?

No. <mark>On a tabular task with a few hundred rows, gradient boosting routinely beats a neural network.</mark> Deep learning tends to win when:

- there is a lot of data,
- the input has **structure** (a molecule's connectivity, a sentence's order, an image's geometry), and
- that structure can be built into the model.

The third condition is what the architecture has to supply. A CNN (convolutional neural network) works on images because "nearby pixels are related" is baked into the architecture — and for the same reason molecules call for [graph neural networks](../gnn-en/).

## The price: interpretability

Deep learning finds representations for you, but it **does not explain them.** When millions of weights produce 0.83, asking "why" is hard.

In molecular property prediction this is a practical problem, not a philosophical one. A chemist does not act on a score alone. They need to know **which part of the molecule produced it** in order to design the next one. That is why attention-based models are used here: the prediction arrives together with where the model was looking.

> **The general view.** The same story runs through other fields: hand-built descriptors like SIFT and HOG gave way to CNNs, TF-IDF (term frequency–inverse document frequency) to Transformers. But **gradient boosting still wins on tabular data** — when the input has no structure to exploit, deep learning's advantage disappears.

## Summary

- Programming writes rules; machine learning finds them
- A model, a loss and an optimiser is the whole of training
- The bottleneck in traditional machine learning is human-designed features
- Deep learning learns the representation too — at the cost of data and of explanation
- The more structure the data has, the more deep learning helps

Next: [where the answers come from, and how that splits learning into kinds](../learning-paradigms-en/).

## References

- Goodfellow, Bengio & Courville, [Deep Learning](https://www.deeplearningbook.org/) (MIT Press, 2016) — free online
- LeCun, Bengio & Hinton, [Deep learning](https://doi.org/10.1038/nature14539), *Nature* (2015)
- Grinsztajn et al., [Why do tree-based models still outperform deep learning on typical tabular data?](https://arxiv.org/abs/2207.08815) (NeurIPS 2022) — on the tabular row of the table above
