---
title: "MACE: when a message carries more than two bodies"
date: 2024-08-16
description: "Most message-passing potentials send two-body messages, so reach has to be bought with depth. MACE builds many-body messages from a product basis, which lets two layers suffice — and changes the exponent of the learning curve, not just its offset."
category: review
updated: 2024-09
lang: en
topic: Graphs
venue: NeurIPS
venueYear: 2022
group: mace
tags: [review, equivariance, message passing, force fields]
---

> Batatia, Ilyes, et al. "MACE: Higher Order Equivariant Message Passing Neural Networks for Fast and Accurate Force Fields." *arXiv*, 15 June 2022, [arxiv.org/abs/2206.07697](https://arxiv.org/abs/2206.07697). Preprint.
> [code](https://github.com/ACEsuit/mace)

MACE is a message-passing interatomic potential, and its argument is about what a single message is allowed to depend on.

## The problem with two-body messages

A machine-learned interatomic potential predicts energy and forces from atomic positions, fast enough to replace a quantum calculation. [Message-passing](../gnn-en/) is the obvious tool: atoms are nodes, nearby atoms are neighbours, and the site energy is a readout.

Early attempts underperformed hand-built atomic descriptors. The paper's diagnosis is specific:

<mark class="blue">Almost every **MPNN (message-passing neural network)** potential sends **two-body** messages — a message depends on one neighbour at a time — and a sum of two-body terms is a limited approximator no matter how many you add.</mark>

Physics does not work that way. The energy of an atom depends on the *arrangement* of its neighbours, not on each neighbour separately: three atoms at 120° and three atoms in a line are different states with the same pairwise distances.

The usual workaround is depth. Stack enough layers and information from a three-body arrangement eventually arrives, indirectly, after passing through intermediate nodes. That costs layers, and depth in a GNN brings [over-smoothing](../gnn-en/) with it.

## The idea

<figure>
<img src="/assets/fig/mace-messages.png" alt="Many-body message construction from a product basis" width="2967" height="1707">
<figcaption><b>Many-body messages.</b> Instead of summing over neighbours one at a time, MACE forms products of the neighbour basis, so a single message can depend on several neighbours jointly — the construction borrowed from the atomic cluster expansion.
<br><span class="credit">Batatia et al., <a href="https://arxiv.org/abs/2206.07697">MACE: Higher Order Equivariant Message Passing Neural Networks for Fast and Accurate Force Fields</a>, NeurIPS 2022 &#183; paper figure, Figure 1</span></figcaption>
</figure>

MACE builds the message from a **product basis** in the style of the atomic cluster expansion (ACE). Each neighbour is first written out in a fixed set of basis functions, and multiplying $\nu$ of those together gives messages that are genuinely $(\nu+1)$-body — a four-body message sees three neighbours at once, and sees them jointly.

Everything stays **equivariant**: rotate the molecule and the internal features rotate with it rather than being scrambled or discarded. For a scalar like energy you could get away with invariance, but forces are vectors, and equivariant features carry directional information that invariant ones throw away.

<figure>
<img src="/assets/fig/mace-layers.png" alt="Reach as a function of layers and message body order" width="1098" height="558">
<figcaption><b>Reach without depth.</b> With four-body messages, <b>two layers</b> cover the correlation order that a two-body model would need many layers to reach — which is also why the model is fast and parallelises well.
<br><span class="credit">Batatia et al., <a href="https://arxiv.org/abs/2206.07697">MACE</a>, NeurIPS 2022 &#183; paper figure, Figure 2</span></figcaption>
</figure>

## Results outside the training distribution

This is not the benchmark table. It is the claim about the learning curve — test error plotted against training-set size, which for these models falls as a power law:

| Change | Effect on the learning curve |
| --- | --- |
| **higher-order (many-body) messages** | changes the **exponent** of the power law |
| **equivariance** | **shifts** the curve, leaves the exponent alone |

<mark>Those are different kinds of improvement, and the field routinely conflates them.</mark> A shift is a constant factor — you need fewer samples, by some ratio that does not change as the dataset grows. A change of exponent means the gap *widens* with more data.

So "equivariant architectures are better" and "many-body messages are better" are not the same statement, and the paper separates them experimentally rather than asserting both at once. Benchmarks are reported on rMD17, 3BPA and AcAc — small molecular-dynamics datasets — and some of those test sets lie outside the training distribution, where a potential has to extrapolate rather than interpolate.

## The numbers behind the claim

Three datasets, chosen so the extrapolation argument can be tested rather than asserted.

**rMD17** is ten small organic molecules sampled from molecular-dynamics trajectories, 1,000
configurations each. MACE is at or near the best on every molecule, and the gap opens where the
errors are largest — aspirin force error 6.6 meV/Å against Allegro's 7.3, BOTNet's 8.5 and
NequIP's 8.2. The paper also retrains on **50 configurations** to make the benchmark harder,
which is the more informative run.

**3BPA** is the one that matters. Train on 500 geometries sampled at 300 K, then test at 300 K,
600 K and 1200 K — the last two are out of the training distribution — plus dihedral slices that
cut through regions of the energy surface the model never saw.

| RMSE (meV / meV·Å⁻¹) | NequIP | BOTNet | **MACE (L=2)** |
| --- | --- | --- | --- |
| 300 K — energy / force | 3.1 / 11.3 | 3.1 / 11.0 | **3.0 / 8.8** |
| 1200 K — energy / force | 40.8 / 86.4 | 39.1 / 81.1 | **29.8 / 62.0** |
| dihedral slices | 23.2 / 23.1 | 16.3 / 20.0 | **7.8 / 16.5** |
| evaluation time | 103.5 ms | 101.2 ms | **24.3 ms** |

<mark>The margin widens as the test moves away from the training data: roughly level at 300 K,
a quarter better at 1200 K, and less than half the energy error on the dihedral slices.</mark> That is
the shape you would expect if the product basis were capturing something about the physics rather
than fitting the sampled region, and it is a stronger argument than the headline accuracy.

The speed column is the other half. The invariant MACE (L=0) runs about ten times faster than
BOTNet and NequIP at similar accuracy, and even L=2 is four times faster — the consequence of
needing two layers instead of many.

## What I would question

- **"Many-body" is doing two jobs.** The product basis buys expressiveness *and* reduces the number of layers. The ablation — retraining with one ingredient removed — separates equivariance from body order, but not body order from depth — a two-body model at matched depth would make the comparison cleaner.
- **The benchmarks are small and clean.** rMD17 and 3BPA are exactly the regime where an ACE-style basis should shine. Whether the exponent claim survives on large, chemically diverse data is the question, and this paper does not answer it.
- **The product basis is a strong prior.** It is a good prior for atoms in 3D, where the physics really is many-body and local. How much of that carries to a domain where edges mean something else is not obvious, and the paper does not claim it does.

## Why I read it

Not for force fields. For the question of **what a message is allowed to contain**, which is the same question in any message-passing model, and because this is the clearest statement of it I know.

In a molecular graph my messages are two-body too: an atom aggregates from each neighbour and a learned function combines them. The usual fix for longer-range structure is depth, with the usual costs. MACE's answer — make a single message depend on several neighbours jointly — is an alternative I had not had a name for.

It also reframes something in my own work. A [junction tree](../jtvae-en/) node that holds a whole ring is, in effect, a many-body term: it carries a six-atom arrangement as one object rather than as six pairwise interactions a model has to reassemble. Different mechanism, same instinct — **put the group in the message instead of hoping depth recovers it.**

## Summary

- Most MPNN potentials send two-body messages, and a sum of two-body terms is a limited approximator
- Physics is many-body: three atoms at 120° and three in a line have the same pairwise distances
- MACE forms messages from a product basis (ACE-style), so one message depends on several neighbours jointly
- Four-body messages mean **two layers suffice** — reach without depth, hence speed
- Everything stays equivariant, which matters because forces are vectors
- **Many-body messages change the exponent of the learning curve; equivariance only shifts it** — different kinds of improvement, usually conflated
- The same instinct appears elsewhere: a junction-tree node holding a ring is a many-body term by another name

## References

- Batatia et al., [MACE: higher order equivariant message passing neural networks for fast and accurate force fields](https://arxiv.org/abs/2206.07697) (NeurIPS 2022) — the paper reviewed here
- Drautz, [Atomic cluster expansion for accurate and transferable interatomic potentials](https://doi.org/10.1103/PhysRevB.99.014104), *Phys. Rev. B* (2019) — the product basis
- Batzner et al., [E(3)-equivariant graph neural networks for data-efficient and accurate interatomic potentials](https://doi.org/10.1038/s41467-022-29939-5), *Nat. Commun.* (2022) — NequIP, the equivariant baseline
