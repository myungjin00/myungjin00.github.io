---
title: "What counts as an explanation"
date: 2025-03-28
description: "Local attribution against global claims · the attention debate and what survives it · gradients, Integrated Gradients, SHAP, LIME and GNNExplainer compared · the four checks that make an interpretability claim testable · and why plausibility is not faithfulness"
category: concept
updated: 2025-04
lang: en
group: interpretability
topic: Machine learning
subtopic: Evaluation
tags: [interpretability, attribution, attention, SHAP]
---

The [attention note](../attention-en/) ends by saying that attention weights are not explanations, and stops there. It never says what would be one. Any model whose selling point includes interpretability — a dual-view molecular model with cross-attention between an atom graph and a junction tree, for instance — is making a claim, and a claim needs a way of being wrong.

## Two questions that get mixed up

| | the question | what can answer it |
| --- | --- | --- |
| **local** | why this prediction, for this input | an attribution over this input's features |
| **global** | what has the model learned, in general | behaviour measured across many inputs |

Almost every tool in use answers the local question. Almost every sentence quoting one makes a global claim. "The model learned to recognise sulfonamides" is global; a highlighted sulfonamide in twelve example molecules is local evidence, chosen by the author. Crossing from one to the other takes aggregation over the whole test set and a check that the aggregate survives a change of seed — not a gallery.

## The attention debate, properly

Jain & Wallace, *Attention is not Explanation* (NAACL 2019), made two measurements on text classifiers. Attention weights correlate **poorly** with gradient-based and leave-one-out importance, so the weights and the usual notions of importance are not the same ranking. And **adversarial attention distributions** can be constructed: a very different weight distribution over the same inputs that leaves the prediction essentially unchanged. The weights are therefore not uniquely identified by the output — the distribution a training run produced is one of many that would fit.

Wiegreffe & Pinter, *Attention is not not Explanation* (EMNLP 2019), replied on three points. The adversarial distributions are found by an attacker free to optimise directly for them, which bounds what is possible in weight space rather than describing what the trained model does; an adversary trained from scratch, under the same constraints as the model, is much harder to produce. Attention has to be judged against a **baseline** — weights frozen to uniform, or shuffled per instance — because a weighting that beats those is doing something, and "poorly correlated with gradients" says nothing on its own about which of the two is closer to the model. And "explanation" was never one thing, so the two papers partly test different properties and partly argue past each other.

What survives both is narrower than either headline. <mark class="blue">Attention tells you what the model used, not why it mattered, and the two coincide only if nothing else could have carried the same signal.</mark> In a molecule, where a substituent, the ring it sits on and the descriptor that correlates with both are all present, something else usually could.

## The attribution methods

| method | what it computes | cost | what it assumes |
| --- | --- | --- | --- |
| **gradients / saliency** | ∂output/∂input | one backward pass | the local slope is informative — noisy, and it reads near zero wherever the output has saturated |
| **Integrated Gradients (IG)** | the path integral of the gradient from a baseline to the input | tens to hundreds of passes | a baseline that means "absent". Attributions sum to $f(x) - f(\text{baseline})$ (completeness), so the baseline is **a real modelling choice** — a zero vector is not a neutral molecule |
| **SHAP (SHapley Additive exPlanations)** | Shapley values: a feature's average marginal contribution over all orderings | exponential in features, so every usable implementation approximates | efficiency, symmetry, dummy and additivity — the strongest axiomatic grounding here, and the approximations inherit it only loosely |
| **LIME (local interpretable model-agnostic explanations)** | a sparse linear surrogate fitted to perturbations around the input | a few hundred forward passes | the surface is locally linear and the perturbation distribution is meaningful; unstable enough that two runs disagree |
| **GNNExplainer / SubgraphX** | a mask over edges and node features, learned to keep the prediction while staying small | an optimisation per explained graph | a small subgraph suffices. For a GNN (graph neural network) this is the one whose output a chemist can read |
| **attention weights** | the mixing weights, already there | free | that a mixing weight is an importance — the contested assumption above |

Two patterns in the column on the right. The cheap methods assume the most, and the two axiomatic methods pay for their axioms in compute and then hand you an approximation that no longer quite satisfies them.

## What makes an interpretability claim testable

**Perturb and measure.** Remove or alter the highlighted part and see whether the prediction actually moves. Report that move against the same operation applied to a randomly chosen part of equal size; the comparison, not the absolute drop, is the result. If the prediction does not move, the highlight was decoration.

**A negative control.** Pick something the model should not care about — a feature that cannot carry the label, a substructure unrelated to the endpoint — and run the identical procedure. If the method highlights that too, the method is the problem, and nothing it said about the real features is usable.

**Stability.** Rerun with a different seed, or take two models of equal accuracy. An explanation that changes while the accuracy does not is an explanation of one run, not of the task. This is the check most likely to fail, and the cheapest to do.

**Agreement across methods.** Necessary, not sufficient. Two methods sharing an assumption can agree and both be wrong — IG and plain saliency both read the local slope, so their agreement is close to free. Agreement between methods that assume different things is worth something.

**Plausibility is not faithfulness.** <mark>An explanation a chemist finds reasonable may still not be what the model computed.</mark> Faithfulness is a property of the model and can be measured on it; plausibility is a property of the reader and is what makes the figure convincing. The two are routinely reported as one, with the second supplying the evidence and the first supplying the word.

## What this means for molecules

Substructure-level attention is readable in a way atom-level gradients are not. A per-atom saliency map over forty atoms is a heatmap someone has to interpret; a weight over junction-tree nodes names a ring or a functional group, which is an object a chemist can agree or disagree with. Where those substructures come from, and what the decomposition rule decides on your behalf, is in [taking a molecule apart](../fragmentation-en/) — and the reason a substructure view is worth having at all is that its coarse nodes give long-range shortcuts, which is what relieves the over-squashing problem in [GNNs](../gnn-en/).

That readability is the hazard rather than the feature. <mark>A readable explanation is more persuasive than a correct one</mark>, and persuasion is not evidence. The checks above are unusually cheap here: deleting along the decomposition the model already uses leaves a valid molecule, substructures with no plausible relation to the endpoint are easy to name, and seeds cost nothing.

[Activity cliffs](../activity-cliff-en/) are the sharpest available stress test. A cliff pair differs by one small change and by orders of magnitude in activity, so the explanation for the two members has to differ somewhere near that change. If it does not, the method is tracking what the two molecules have in common rather than what decided their labels — and a model with cross-attention between two views has two sets of weights to hold to that standard, not one.

## Summary

- **Local** attribution and **global** behaviour are different questions; most tools answer the first and get quoted as the second
- Jain & Wallace: attention correlates poorly with gradient importance, and **adversarial attention distributions** give the same prediction from very different weights
- Wiegreffe & Pinter: those adversaries are optimised for directly, attention must be judged against a trained **baseline**, and "explanation" was never one property
- **Attention says what was used, not why it mattered**
- Cheap methods assume the most; **SHAP** and **IG** are the axiomatic ones and their approximations weaken that; **IG**'s baseline is a modelling choice; **GNNExplainer** returns something chemically readable
- A claim is testable when it survives **perturbation, a negative control, a seed change, and methods that disagree on assumptions**
- **Plausibility is not faithfulness** — the distinction most often skipped, and the one the readable molecular explanations make most tempting to skip

## References

- Jain & Wallace, [Attention is not Explanation](https://arxiv.org/abs/1902.10186) (NAACL 2019) — the adversarial distributions, and the correlation measurements
- Wiegreffe & Pinter, [Attention is not not Explanation](https://arxiv.org/abs/1908.04626) (EMNLP 2019) — the reply, and the baselines attention should be judged against
- Sundararajan et al., [Axiomatic Attribution for Deep Networks](https://arxiv.org/abs/1703.01365) (ICML 2017) — Integrated Gradients and completeness
- Lundberg & Lee, [A Unified Approach to Interpreting Model Predictions](https://arxiv.org/abs/1705.07874) (NeurIPS 2017) — SHAP and its axioms
- Ying et al., [GNNExplainer: Generating Explanations for Graph Neural Networks](https://arxiv.org/abs/1903.03894) (NeurIPS 2019) — masks over edges and features
