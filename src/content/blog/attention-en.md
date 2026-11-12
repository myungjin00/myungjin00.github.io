---
title: "Attention, cross-attention and the rest of a transformer block"
date: 2025-04-18
description: "Softmax as a learned weighted average · Q, K and V and why there are three · self versus cross attention · multi-head · the FFN that does half the work · why a set needs no positions · GAT as attention on a neighbourhood · why attention weights are not explanations"
category: concept
updated: 2025-05
lang: en
group: attention
topic: Graphs
tags: [attention, transformer, cross-attention, interpretability]
---

[Message passing](../gnn-en/) lets a node gather from its neighbours, but it weights all of them the same way. Attention is the small change that lets the model decide, per pair, how much to listen — and it is the operation everything from GAT to a transformer is built out of.

## The idea in one line

<mark class="blue">Attention is a weighted average where the model learns the weights, and the weights depend on what is being asked.</mark>

A fixed average is the same for every input. Attention computes a fresh set of weights for every query, so the same position can look at different neighbours depending on what it currently needs.

## Q, K and V

Three projections of the same input, with three jobs:

| | Comes from | Means |
| --- | --- | --- |
| **query** $Q$ | the position doing the looking | what am I looking for |
| **key** $K$ | every position that could be looked at | what do I offer |
| **value** $V$ | the same positions | what I actually hand over |

Compare each query with every key, turn the comparisons into weights, average the values with them:

$$
\mathrm{Attention}(Q, K, V) = \mathrm{softmax}\!\left(\frac{QK^\top}{\sqrt{d_k}}\right)V
$$

<figure>
<img src="/assets/fig/attention-matrix.svg" alt="A raw score matrix and the same matrix after softmax, over eight atoms" loading="lazy" />
<figcaption><b>The two steps, computed.</b> Eight positions, 16 dimensions, random projections — run in PyTorch for this note. <b>(A)</b> every query scored against every key; the values are signed and unbounded. <b>(B)</b> softmax along each row turns them into weights that are non-negative and sum to one. That row is the recipe for mixing the values.</figcaption>
</figure>

Two details:

- **$\sqrt{d_k}$.** Dot products grow with dimension, and a large input to softmax makes it almost one-hot, which kills the gradient. Dividing keeps the scale usable.
- **softmax is where the choosing happens.** It is also why attention can only *redistribute* — the weights sum to one, so a position cannot attend to everything strongly at once.

## Self versus cross

<figure>
<img src="/assets/fig/attention-self-cross.svg" alt="Self-attention within one set of atoms, and cross-attention from atoms to junction-tree nodes" loading="lazy" />
<figcaption><b>The only difference is where K and V come from.</b> In self-attention all three projections come from one set. In cross-attention the query comes from one view and the keys and values from another, so the two representations can ask each other questions.</figcaption>
</figure>

**Self-attention**: $Q$, $K$, $V$ all from the same set. Every atom looks at every other atom, including distant ones — which is exactly the shortcut that plain message passing lacks, where information has to walk one bond at a time.

**Cross-attention**: $Q$ from one sequence or view, $K$ and $V$ from another. This is how a decoder reads an encoder, how an image model reads a caption, and how a [dual-view molecular model](../learning-paradigms-en/) lets the atom-level graph query the junction tree. The asymmetry matters: the output has one row per query, so cross-attention also changes shape.

## Multi-head

One attention computes one set of weights, which means one notion of relatedness. Multi-head splits the dimension into $h$ pieces, runs attention independently in each, and concatenates:

$$
\mathrm{MultiHead} = \mathrm{Concat}(\mathrm{head}_1, \ldots, \mathrm{head}_h)\,W^O
$$

Each head is free to specialise — in molecular models heads commonly separate into something like "same ring", "bonded neighbour", and "far but functionally paired". It costs nothing extra: $h$ heads of width $d/h$ have the same parameter count as one head of width $d$.

## The other half: the FFN

A transformer block is **not** just attention. Attention mixes information *across* positions; the feed-forward network (FFN) transforms *each* position on its own, and it holds most of the parameters. Each sublayer is wrapped in a **residual connection** — its output is added to its input rather than replacing it, which is what lets a gradient reach the early layers of a deep stack.

<figure>
<img src="/assets/fig/transformer-block.svg" alt="A transformer block: multi-head attention, add and norm, feed-forward network, add and norm" loading="lazy" />
<figcaption><b>One block.</b> The input and the output have the same shape, which is the property that lets blocks stack. Each sublayer is wrapped in a residual connection and a normalisation — without the residual, a deep stack does not train.</figcaption>
</figure>

$$
\mathrm{FFN}(x) = W_2\,\sigma(W_1 x + b_1) + b_2
$$

It is two linear layers with a nonlinearity between them, applied identically to every position, and the hidden width is usually **four times** the model width. So in a standard block roughly two thirds of the parameters sit in the FFN, not in the attention. A useful way to read the pair: **attention decides what to look at, the FFN decides what to make of it.** Remove the FFN and you have a stack of weighted averages, which composes to one weighted average — no extra expressive power at all.

## Sets, sequences and graphs

Attention as written has **no notion of order.** Permute the inputs and the outputs permute with them. For text that is a bug, and the fix is positional encoding. For a molecule it is a feature — a molecule is a set of atoms with bonds, not a sequence, and [permutation invariance](../gnn-en/) is exactly what you want.

That leaves the question of how bonds enter. Three answers are in use: restrict attention to bonded neighbours (this is **GAT** (graph attention network) — attention over a neighbourhood instead of over everything), add an edge term to the score, or bias the score by graph distance.

| | mixes over | cost | order |
| --- | --- | --- | --- |
| message passing | neighbours only | $O(E)$ | invariant |
| **GAT** | neighbours, weighted | $O(E)$ | invariant |
| self-attention | everything | $O(n^2)$ | invariant unless you add positions |
| transformer on text | everything | $O(n^2)$ | needs positional encoding |

The $O(n^2)$ is why attention over everything is affordable for a 40-atom molecule and expensive for a 100,000-node knowledge graph.

## Attention is not an explanation

This is what interpretability claims run into, including the ones I make in my own work.

A high attention weight says the model **mixed in** that position. <mark>It does not say that position caused the prediction.</mark> The two can come apart, and demonstrably do:

- Attention weights are **not unique**. Different weightings can give the same output, so the ones you read off are one solution, not the solution.
- The value path matters as much. A large weight on a near-zero value contributes nothing.
- With residual connections and many layers, a single layer's weights explain less and less of the final output. Attention rollout exists because reading one layer is not enough.

So what does make an attention claim defensible? Treat the weights as a **hypothesis** and test it: perturb or remove the highlighted substructure and check the prediction actually moves; compare against a negative control the model should not care about; check that the highlighted fragment agrees with what the chemistry would predict. The weights are where you start looking, not the evidence itself.

## Summary

- Attention is a weighted average whose weights are computed from the input, per query
- $Q$ asks, $K$ advertises, $V$ is handed over; the $\sqrt{d_k}$ keeps softmax out of saturation
- **Self** means $K$ and $V$ come from the same set; **cross** means they come from another view
- Multi-head buys several notions of relatedness for the same parameter budget
- A block is attention **plus an FFN**, each wrapped in a residual and a norm — the FFN holds most of the parameters, and without it the stack collapses to one average
- Attention has no order, which is a problem for text and the right default for molecules
- GAT is attention restricted to bonded neighbours; full self-attention is $O(n^2)$
- **A weight is a hypothesis, not an explanation** — perturb the highlighted part and see whether the prediction moves

## References

- Vaswani et al., [Attention is all you need](https://arxiv.org/abs/1706.03762) (NeurIPS 2017) — the original block, FFN included
- Brody et al., [How attentive are graph attention networks?](https://arxiv.org/abs/2105.14491) (ICLR 2022) — GAT vs GATv2
- Jain & Wallace, [Attention is not explanation](https://arxiv.org/abs/1902.10186) (NAACL 2019) — read with the reply, *Attention is not not explanation*
