---
title: "HDN-DDI: hierarchical molecular graphs for drug–drug interaction prediction"
date: 2025-01-18
description: "Atoms, substructures and the whole molecule in one graph · the bipartite graph built between substructures, not atoms · the cold-start split (S1 / S2) that is the part worth borrowing · why warm-start accuracy above 97% proves little"
category: review
updated: 2025-01
lang: en
topic: Cheminformatics
subtopic: Prediction
venue: BMC Bioinformatics
venueYear: 2025
group: hdn-ddi
tags: [review, DDI, graph neural networks]
---

> Sun, Jinchen, and Haoran Zheng. "HDN-DDI: a novel framework for predicting drug-drug interactions using hierarchical molecular graphs and enhanced dual-view representation learning." *BMC Bioinformatics*, vol. 26, no. 1, 2025, article 28, [doi.org/10.1186/s12859-025-06052-0](https://doi.org/10.1186/s12859-025-06052-0).
> [PMC11765940](https://pmc.ncbi.nlm.nih.gov/articles/PMC11765940/) &#183; [code](https://github.com/F1am-e/HDN-DDI)

## Why drug–drug interactions

Patients rarely take one drug. Co-administration can be deliberate — hitting several biological processes at once for a better therapeutic effect — but two drugs in the same body can also interfere with each other, and the result ranges from a lost effect to a dangerous one. These are <u>drug–drug interactions, or DDIs</u>.

Finding them experimentally is slow and expensive, and the number of pairs grows quadratically with the number of drugs, so exhaustive testing is not an option. That makes DDI prediction a natural machine-learning problem: given two drugs and an interaction type, does that interaction occur?

Formally, for a set of drugs $D$ and interaction types $R$, the task is to learn an approximation of

$$
f(D_x, r, D_y) \in \{0, 1\}
$$

where 1 means the triple $(D_x, r, D_y)$ is a real interaction.

## The gap this paper is aimed at

[Graph neural networks](../gnn-en/) (GNNs) are the standard tool here: represent each drug as a molecular graph, with atoms as nodes and bonds as edges, and learn from structure.

The complication is *which* structure. A drug's behaviour is driven largely by its functional groups, so a line of work predicts DDIs from substructures rather than raw atoms. But those methods split into two camps, and each gives something up:

- **Learned substructures.** Models like SSI-DDI and SA-DDI let the network decide what counts as a substructure. Flexible, but the resulting pieces often don't correspond to anything a chemist would name, so the explanation is hard to trust.
- **Chemically defined substructures.** Decomposition algorithms such as BRICS (breaking of retrosynthetically interesting chemical substructures) cut at synthetically meaningful bonds, which yields fragments that *are* interpretable. The cost is isolation: once the molecule is cut, each fragment is handled on its own and the information about the whole molecule is lost.

<mark>HDN-DDI tries to keep the second camp's interpretability without paying the isolation cost.</mark>

## The hierarchical molecular graph

<figure>
<img src="/assets/fig/hdn-ddi-fig1.png" alt="HDN-DDI framework: substructure extraction, six HDN blocks, and a co-attention decoder" width="1418" height="1324">
<figcaption><b>Figure 1.</b> The framework. <b>(A)</b> Two drugs are decomposed into substructures, turned into hierarchical molecular graphs, passed through six HDN blocks, and combined by a co-attention decoder into a DDI probability. <b>(B)</b> Inside one block: a hierarchical-view layer per drug, an interactive-view layer over the bipartite graph between their substructure-level nodes, and an update layer that merges the two.
<br><span class="credit">Sun &amp; Zheng, <a href="https://doi.org/10.1186/s12859-025-06052-0"><i>BMC Bioinformatics</i> <b>26</b>, 28 (2025)</a> &#183; paper figure, Figure 1</span></figcaption>
</figure>

The central idea is simple to state. Rather than replacing the atom graph with a substructure graph, keep both, plus a node for the molecule itself, in a single graph with three levels:

| level | what the node is | what it collects |
| --- | --- | --- |
| atomic | one heavy atom | local neighbourhood information |
| substructure | one BRICS fragment | the behaviour of a functional group |
| molecular | the whole drug | a global summary of the molecule |

Substructure nodes connect to the atoms they contain and to the molecular node, so they sit in the middle and route information between the two other levels. Message passing is not restricted by level: an atom node can take information from a neighbouring substructure node and from its adjacent atoms in the same step.

One practical consequence follows. Because the molecular node aggregates from all substructure nodes during encoding, the global representation of a drug is simply that node's embedding — no separate pooling step is needed, which is cheaper than the usual readout over a flat graph.

<figure>
<img src="/assets/fig/hdn-ddi-fig2.png" alt="Substructure extraction: BRICS decomposition, ring splitting, and the resulting three-level graph" width="1415" height="1075">
<figcaption><b>Figure 2.</b> Substructure extraction. <b>(A)</b> A SMILES string becomes a molecular graph, BRICS cuts it, and any ring fragment BRICS leaves intact is split further. <b>(B)</b> The result is the three-level graph — atoms, substructures, and one node for the whole molecule.
<br><span class="credit">Sun &amp; Zheng, <a href="https://doi.org/10.1186/s12859-025-06052-0"><i>BMC Bioinformatics</i> <b>26</b>, 28 (2025)</a> &#183; paper figure, Figure 2</span></figcaption>
</figure>

**Substructure extraction.** The SMILES (simplified molecular-input line-entry system) string is parsed into a molecular graph with RDKit, BRICS is applied, and any large ring fragment that BRICS leaves intact is split further into smaller ring fragments by additional rules. This last step is needed because BRICS deliberately avoids breaking rings: without it a fused polycyclic drug would come out as one enormous fragment.

## The encoder: two views, repeated

The encoder is a stack of six HDN blocks — the paper's name for its hierarchical dual-view block. Each block has three layers:

1. **Hierarchical-view layer** — processes one drug at a time, propagating information up and down its own hierarchy.
2. **Interactive-view layer** — processes the *pair*, letting the two drugs see each other.
3. **Update layer** — merges what the two views produced and writes the new node representations.

All message passing uses a multi-head graph attention network (two heads).

The interactive-view layer is where the paper's "enhanced" dual-view claim lives. Earlier dual-view models build a bipartite graph between the *atoms* of the two drugs. HDN-DDI builds it between their **substructure nodes** instead. Two arguments are given for this:

- Interactions are mediated by functional groups, so substructure-level edges carry the relevant signal and atom-level edges mostly add noise.
- The bipartite graph is much smaller, since a drug has far fewer fragments than atoms.

On top of that, connections in the bipartite graph are **dropped at random** during training. The stated purpose is to stop substructure representations from homogenising — if every fragment attends to every fragment at every layer, their embeddings converge and the later blocks stop adding information.

## The decoder

After six blocks, each drug has one global representation per block — six of them. The decoder condenses them with a **co-attention** mechanism: the two drugs' global representations are scored against each other through a learned weight matrix and a tanh non-linearity, producing a relevance score per depth. Those scores weight the representations, which are combined with a learned embedding of the interaction type $r$ to give the final probability.

Training is binary cross-entropy. Both benchmark datasets contain only positive interactions, so negatives are generated by randomly swapping one drug in a known triple — the standard trick in this literature, and one of its standing weaknesses, since a "negative" generated this way may simply be an interaction nobody has recorded yet.

## Experiments

**Datasets.**

| | drugs | interaction types | positive DDIs |
| --- | --- | --- | --- |
| DrugBank | 1,706 | 86 | 191,808 |
| Twosides | 645 | 963 | 4,576,287 |

The two are evaluated separately rather than merged, because their labels mean different things: DrugBank describes how one drug affects another's metabolism, while Twosides describes side effects observed when two drugs are taken together.

**Two settings.**

- **Warm-start** — the usual 6:2:2 split over interaction triples. The same drug can appear in both training and test sets.
- **Cold-start** — 20% of *drugs* are held out entirely. Test triples are then divided into **S1**, where both drugs are new, and **S2**, where one is new and one is known.

<mark class="blue">Warm-start accuracy above 97% sounds impressive until you notice that a model can reach it by memorising drug identities rather than learning chemistry.</mark> Cold-start is the setting that tests whether the representation generalises, and it is the setting that matches the real use case: you want to know about a drug that has just been approved.

**Results.** Warm-start, as the paper reports it — ACC is accuracy, AUPR the paper's label for PR-AUC (area under the precision–recall curve), and ROC-AUC the area under the receiver operating characteristic (ROC) curve:

| Table 2 · model | DrugBank ACC | AUPR | F1 | Twosides ACC | AUPR | F1 |
| --- | --- | --- | --- | --- | --- | --- |
| SSI-DDI | 96.33 | 98.57 | 96.38 | 78.20 | 82.71 | 79.81 |
| GMPNN-CS | 95.30 | 97.94 | 95.39 | 82.83 | 87.24 | 84.08 |
| SA-DDI | 96.23 | 98.36 | 96.29 | 87.45 | 90.57 | 88.35 |
| DSN-DDI | 96.94 | 99.37 | 96.93 | 98.83 | 99.89 | 98.83 |
| BDN-DDI | 96.33 | 99.28 | 94.40 | 99.07 | 99.90 | 99.07 |
| **HDN-DDI** | 97.93 | 99.72 | 98.03 | 99.38 | 99.97 | 99.38 |

Numbers from Table 2 of the paper. The margin over the previous best is about one accuracy point on DrugBank and a third of a point on Twosides — small, because everything is already near the ceiling. Cold-start is where it separates: gains of roughly 4.96 points in accuracy and 7.08 in F1.

**Cold-start, on DrugBank.**

| Table 3 · model | S1 ACC | ROC-AUC | AUPR | F1 | S2 ACC | ROC-AUC | AUPR | F1 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| MHCADDI | 66.50 | 72.53 | 71.06 | 67.21 | 70.58 | 77.84 | 76.16 | 72.74 |
| SSI-DDI | 65.40 | 73.43 | 75.03 | 54.12 | 76.38 | 84.23 | 84.94 | 73.54 |
| GMPNN-CS | 68.57 | 74.96 | 75.44 | 65.32 | 77.72 | 84.84 | 84.87 | 78.29 |
| SA-DDI | 67.15 | 73.62 | 73.39 | 63.40 | 75.55 | 82.95 | 84.11 | 71.94 |
| DSN-DDI | 73.42 | 81.79 | 81.82 | 70.34 | 81.92 | 91.01 | 91.09 | 80.18 |
| BDN-DDI | 74.88 | 86.10 | 85.84 | 70.21 | 85.35 | 93.68 | 93.64 | 84.34 |
| **HDN-DDI** | 79.84 | 89.48 | 89.65 | 77.42 | 89.43 | 95.92 | 95.95 | 89.34 |
| *improvement* | *+4.96* | *+3.38* | *+3.81* | *+7.08* | *+4.08* | *+2.24* | *+2.31* | *+5.00* |

S1 is both drugs unseen, S2 is one unseen. Compare these to the warm-start table above: every model loses twenty to thirty points, and the ordering changes &mdash; SSI-DDI is mid-table at warm-start and last on S1 F1.

**Ablations**, run in the cold-start setting:

| Table 4 · variant | what it removes | S1 ACC | S1 F1 | S2 ACC | S2 F1 |
| --- | --- | --- | --- | --- | --- |
| wo-SEM | substructure extraction — a plain molecular graph | 69.96 | 66.83 | 78.01 | 78.15 |
| wo-EDV | the enhanced dual view, reverting to the earlier scheme | 76.15 | 74.00 | 84.98 | 84.97 |
| with-pool | the molecular node, replaced by a sum over substructures | 78.56 | 76.89 | 87.18 | 87.24 |
| with-SAG | the molecular node, replaced by SAGPooling (self-attention graph pooling) | 78.20 | 75.41 | 87.67 | 87.60 |
| **full model** | — | 79.84 | 77.42 | 89.43 | 89.34 |

Removing substructure extraction costs about **10 points**; reverting the dual view costs **3.7**; replacing the molecule-level node with either pooling costs **1.3 to 1.6**. So the hierarchy is doing most of the work, the bipartite-graph change is a real but smaller gain, and the molecule node holds a small, consistent margin over two different pooling alternatives rather than only saving an operation.

<figure>
<img src="/assets/fig/hdn-ddi-fig3.png" alt="ROC and precision-recall curves for HDN-DDI and baselines on newly approved drugs" width="1419" height="583">
<figcaption><b>Figure 3.</b> The prospective check. Models trained on drugs approved before a cut-off, tested on drugs approved after. <b>(A)</b> ROC and <b>(B)</b> precision&ndash;recall on the held-out new drugs. This is the split that matters, because it is the only one shaped like the actual use.
<br><span class="credit">Sun &amp; Zheng, <a href="https://doi.org/10.1186/s12859-025-06052-0"><i>BMC Bioinformatics</i> <b>26</b>, 28 (2025)</a> &#183; paper figure, Figure 3</span>
</figcaption>
</figure>

**A real-world check.** Train on drugs approved before 2015, test on drugs approved after — a harder protocol than a random split. HDN-DDI holds its lead in both ROC-AUC and PR-AUC.

<figure>
<img src="/assets/fig/hdn-ddi-fig4.png" alt="Attention over substructures for five drug pairs, with the top-contributing fragments shaded" width="1416" height="1932">
<figcaption><b>Figure 4.</b> Five interacting pairs, with the substructures contributing the top 40% of the attention shaded &mdash; darker is a larger contribution. This is the paper's interpretability claim in full: the model points at fragments, not at atoms or at the whole molecule.
<br><span class="credit">Sun &amp; Zheng, <a href="https://doi.org/10.1186/s12859-025-06052-0"><i>BMC Bioinformatics</i> <b>26</b>, 28 (2025)</a> &#183; paper figure, Figure 4</span>
</figcaption>
</figure>

**Case study.** For amyl nitrite with vardenafil — a pair that can drop blood pressure sharply — the attention lands on the groups the paper names: the nitroso group on one side, the pyridine ring and the amide bond on the other. A second case covers amobarbital with dicoumarol.

## What the authors admit, and what I'd add

The paper lists two limitations: the decomposition rules leave some drugs under-fragmented, and the model has no access to external knowledge such as metabolic pathways. Both are fair.

Three more I'd raise:

- **Negative sampling.** Random drug replacement assumes an unrecorded pair is a non-interacting pair. With metrics in the high nineties, the measurement may be dominated by how easy the sampled negatives are.
- **Random connection dropping.** The motivation — avoiding homogenisation — is plausible and matches what happens in deep graph neural networks, but it is argued rather than demonstrated. An ablation on the drop rate would settle it.
- **Interpretability as an evaluation.** The attention maps look right on the five hand-picked pairs of Figure 4, which is thin evidence, and there is no quantitative check that high-attention substructures are the ones that actually drive the prediction.

## Why I read it

The hierarchy here is close to what I work on. In [SJoINT](https://github.com/sslim-aidrug/SJoINT) I also read a molecule at two levels — atoms and the substructures they form — and connect them through attention. The difference is where the constraint lives. HDN-DDI puts the levels in one graph and lets attention find the routing; SJoINT keeps two encoders and masks the attention by membership, so an atom can only ever exchange information with the substructures that contain it.

The design decision I took from this paper is the cold-start protocol. Reporting warm-start numbers alone makes substructure models look better than they are, and S1/S2 is a cleaner way to show generalisation to new chemistry than a [scaffold split](../data-splitting-en/) alone.

## Summary

- Substructures are more interpretable than learned fragments, but cutting a molecule leaves the pieces isolated
- HDN-DDI keeps atoms, substructures and the whole molecule in **one graph**, so the levels can talk to each other
- The bipartite graph between the two drugs is built at the **substructure** level, not the atom level
- The molecule-level node gives a global representation without a separate pooling step
- The cold-start split (S1 / S2) is the part worth borrowing — warm-start accuracy above 97% can be memorisation

## References

- Sun & Zheng, [HDN-DDI](https://doi.org/10.1186/s12859-025-06052-0), *BMC Bioinformatics* **26**, 28 (2025) — the paper reviewed here
- Nyamabo et al., [SSI-DDI](https://doi.org/10.1093/bib/bbab133), *Brief. Bioinform.* (2021) — substructure-level DDI prediction
- Degen et al., [On the Art of Compiling and Using 'Drug-Like' Chemical Fragment Spaces](https://doi.org/10.1002/cmdc.200800178), *ChemMedChem* (2008) — BRICS
- Zitnik, Agrawal & Leskovec, [Modeling polypharmacy side effects with graph convolutional networks](https://doi.org/10.1093/bioinformatics/bty294), *Bioinformatics* (2018) — side-effect prediction over Twosides
- Tatonetti et al., [Data-driven prediction of drug effects and interactions](https://doi.org/10.1126/scitranslmed.3003377), *Sci. Transl. Med.* **4** (2012) — where Twosides comes from
