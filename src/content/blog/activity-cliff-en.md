---
title: "Activity cliffs"
date: 2025-08-22
description: "Pairs of near-identical molecules with very different activity · why the similarity principle fails exactly where it matters · how SALI and MoleculeACE define a cliff · why descriptor models often beat deep ones here · how to report cliff performance honestly"
category: concept
updated: 2025-09
lang: en
group: activity-cliff
topic: Cheminformatics
subtopic: Prediction
tags: [activity cliff, SAR, benchmark]
---

Most of molecular machine learning rests on one assumption: **similar structures have similar properties.** It is called the <u>similarity principle</u>, and it is what makes [fingerprints](../descriptors-fingerprints-en/) and [GNNs](../gnn-en/) (graph neural networks) work at all.

An **activity cliff** is a pair of molecules where that assumption breaks — nearly the same structure, order-of-magnitude different activity.

<figure>
<svg viewBox="0 0 640 240" role="img" aria-label="Smooth structure-activity landscape versus a cliff">
<text x="36" y="20" font-family="ui-monospace,monospace" font-size="12" fill="#4a6b5c">similarity principle holds</text>
<text x="364" y="20" font-family="ui-monospace,monospace" font-size="12" fill="#8c4a32">activity cliff</text>
<line x1="36" y1="196" x2="300" y2="196" stroke="#c9cfca" stroke-width="1"/>
<line x1="36" y1="196" x2="36" y2="46" stroke="#c9cfca" stroke-width="1"/>
<text x="42" y="42" font-family="ui-monospace,monospace" font-size="10" fill="#8a918c">activity</text>
<text x="196" y="214" font-family="ui-monospace,monospace" font-size="10" fill="#8a918c">chemical space</text>
<path d="M46 186 C110 176 150 126 292 66" fill="none" stroke="#4a6b5c" stroke-width="2.5"/>
<circle cx="152" cy="131" r="4.5" fill="#4a6b5c"/>
<circle cx="180" cy="120" r="4.5" fill="#4a6b5c"/>
<line x1="152" y1="131" x2="180" y2="120" stroke="#4a6b5c" stroke-width="1" stroke-dasharray="3 3"/>
<text x="52" y="86" font-family="ui-monospace,monospace" font-size="10" fill="#4a6b5c">small step in structure</text>
<text x="52" y="100" font-family="ui-monospace,monospace" font-size="10" fill="#4a6b5c">small step in activity</text>
<line x1="364" y1="196" x2="628" y2="196" stroke="#c9cfca" stroke-width="1"/>
<line x1="364" y1="196" x2="364" y2="46" stroke="#c9cfca" stroke-width="1"/>
<text x="370" y="42" font-family="ui-monospace,monospace" font-size="10" fill="#8a918c">activity</text>
<text x="524" y="214" font-family="ui-monospace,monospace" font-size="10" fill="#8a918c">chemical space</text>
<path d="M374 184 C420 179 470 175 499 173 L503 78 C540 73 580 68 616 64" fill="none" stroke="#8c4a32" stroke-width="2.5"/>
<circle cx="492" cy="174" r="4.5" fill="#8c4a32"/>
<circle cx="512" cy="76" r="4.5" fill="#8c4a32"/>
<line x1="492" y1="174" x2="512" y2="76" stroke="#8c4a32" stroke-width="1" stroke-dasharray="3 3"/>
<text x="380" y="110" font-family="ui-monospace,monospace" font-size="10" fill="#8c4a32">same small step</text>
<text x="380" y="124" font-family="ui-monospace,monospace" font-size="10" fill="#8c4a32">100x in activity</text>
</svg>
<figcaption>A structure–activity landscape. On a smooth landscape a model can interpolate; at a cliff two neighbours sit on different levels, and any model that smooths over neighbourhoods lands between them.</figcaption>
</figure>

<figure>
<img src="/assets/fig/activity-cliff-pair.svg" alt="Two near-identical molecules whose binding affinity differs 1200-fold" loading="lazy" />
<figcaption><b>A real cliff.</b> Both molecules come from the MoleculeACE set for the dopamine D3 receptor. They share a tetrahydroquinolinone, a piperazine and a <i>tert</i>-butyl trifluoromethylpyrimidine; the only difference is the highlighted linker, five methylenes instead of four. ECFP4 Tanimoto is 0.98 &mdash; as far as a fingerprint is concerned they are the same molecule &mdash; and the affinity differs by about 1,200-fold.</figcaption>
</figure>

## How a cliff is defined

"Nearly the same structure" has to be made operational. Two definitions are in common use.

**SALI** (structure–activity landscape index) scores a pair:

$$
\mathrm{SALI}_{ij} = \frac{|\,A_i - A_j\,|}{1 - \mathrm{sim}(i, j)}
$$

where $A$ is activity on a log scale and $\mathrm{sim}$ is usually [Tanimoto similarity](../descriptors-fingerprints-en/) on ECFP (extended-connectivity fingerprint). The denominator goes to zero as the pair gets more similar, so near-identical pairs with any activity gap score very high.

**MoleculeACE** uses a threshold rule instead, which is easier to audit: a pair is a cliff when activity differs by at least 10-fold (1 log unit) *and* the molecules are similar by any of ECFP Tanimoto ≥ 0.9, scaffold (the ring systems and the linkers between them, left once the side chains are stripped) similarity ≥ 0.9, or shared substructure. Every compound involved in at least one such pair is labelled a <u>cliff compound</u>.

The threshold rule is what benchmarks use, because it produces a clean subset you can report separately.

## Why they break models

A model trained on a dataset learns, implicitly, a smooth function over chemical space. Feed it two neighbours and it returns two similar numbers — that is the inductive bias, and 90% of the time it is correct.

At a cliff the correct answer is two very different numbers for two nearly identical inputs. A smooth model splits the difference: it overestimates the weak compound and underestimates the potent one. <mark class="blue">Both predictions are wrong, and the error is largest exactly on the compounds medicinal chemists care about, because a cliff is where the structure–activity relationship (SAR) carries real information.</mark>

This is the uncomfortable result from MoleculeACE: on 30 ChEMBL bioactivity sets, <mark>descriptor- and fingerprint-based models with classical regressors (support vector machine; SVM, gradient boosting) matched or beat message-passing neural networks on the cliff subsets</mark>, even where the neural models won on the full test set. More capacity did not buy sensitivity to small structural changes.

## Where cliffs come from

A cliff is not noise. The usual physical causes:

- **A hydrogen bond gained or lost.** Replacing an N–H with N–CH₃ removes a donor that was making a key contact.
- **A steric clash.** One extra methyl does not fit the pocket.
- **A change in ionisation.** A substituent shifts the pKa, so the compound is charged at physiological pH when it was not.
- **A conformational lock.** A ring or a fluorine fixes the torsion that the binding pose requires.

All four are about the complex, not the ligand alone — which is why a 2D representation has no way of seeing them. The information is simply not in the input.

## What to do about it

Nothing fully solves this. The honest options:

| Approach | Idea | Limit |
| --- | --- | --- |
| Report cliffs separately | split test RMSE (root-mean-square error) into cliff / non-cliff | diagnostic, not a fix |
| Scaffold split | force the test set to be structurally novel | moves the problem, does not remove it |
| Pairwise / Siamese models | predict the *difference* for a pair, not the value | number of pairs grows as $n^2$ |
| 3D or structure-based features | give the model the interaction it needs | needs a structure; expensive |
| More local models | reduce smoothing (k-nearest neighbours, lower regularisation) | worse everywhere else |

The one thing that always helps is the first row. <mark>A single aggregate RMSE hides cliff performance entirely</mark>, and a model can improve its overall score by getting *more* conservative — that is, worse — on exactly these pairs.

## Caveats worth keeping

- **Some cliffs are artefacts.** Activity values pooled across assays, labs, or readouts carry noise of roughly 0.5 log units. A 1-log "cliff" built from two different assays may be measurement error.
- **Activity is not binding.** A potency difference can come from solubility or permeability rather than from the target.
- **Cliff compounds are a small subset.** Typically a few percent of a set, so a cliff metric computed on 20 molecules has wide error bars. Report the count alongside the number.

## Summary

- An activity cliff is a structurally near-identical pair with a large activity gap — the similarity principle failing locally
- SALI scores pairs continuously; MoleculeACE's threshold rule (≥10-fold difference + high similarity) is what benchmarks use
- Smooth models split the difference and get **both** compounds wrong, on exactly the pairs that carry SAR information
- Descriptor + SVM baselines are competitive with deep models on cliff subsets — capacity is not the missing ingredient
- The causes are interaction-level (H-bond, sterics, pKa, conformation) and largely invisible to 2D input
- Always report cliff and non-cliff error separately, with the compound count

## References

- Maggiora, [On outliers and activity cliffs — why QSAR often disappoints](https://doi.org/10.1021/ci060117s), *J. Chem. Inf. Model.* (2006)
- Guha & Van Drie, [Structure–activity landscape index: identifying and quantifying activity cliffs](https://doi.org/10.1021/ci7004093), *J. Chem. Inf. Model.* **48** (2008) — SALI
- Stumpfe & Bajorath, [Exploring activity cliffs in medicinal chemistry](https://doi.org/10.1021/jm201706b), *J. Med. Chem.* **55** (2012)
- van Tilborg, Alenicheva & Grisoni, [Exposing the limitations of molecular machine learning with activity cliffs](https://doi.org/10.1021/acs.jcim.2c01073), *J. Chem. Inf. Model.* (2022) — MoleculeACE
