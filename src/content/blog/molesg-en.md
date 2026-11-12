---
title: "MoleSG: making two views of a molecule actually need each other"
date: 2025-05-21
description: "SMILES-plus-graph pretraining usually aligns the two views only globally · MoleSG makes the two views' masks disjoint · reconstructing one view then requires reading the other"
category: review
updated: 2025-06
lang: en
topic: Cheminformatics
subtopic: Representation
venue: Briefings in Bioinformatics
venueYear: 2024
group: molesg
tags: [review, self-supervised, multimodal, molecular representation]
---

> Shen, Ao, et al. "Complementary multi-modality molecular self-supervised learning via non-overlapping masking for property prediction." *Briefings in Bioinformatics*, vol. 25, no. 4, 2024, article bbae256, [doi.org/10.1093/bib/bbae256](https://doi.org/10.1093/bib/bbae256).
> [PMC11129775](https://pmc.ncbi.nlm.nih.gov/articles/PMC11129775/)

## The limits of existing dual-view pretraining

Molecular labels are expensive, so [self-supervised pre-training](../transfer-learning-en/) is how most of this field gets around having a few thousand labelled molecules. The question is what to pre-train on.

<figure>
<img src="/assets/fig/molesg-f1.jpg" alt="SMILES as an implicit linear string versus a molecular graph, and their different receptive fields" width="660" height="196">
<figcaption><b>Figure 1.</b> The two views and what each one is good at. A SMILES (simplified molecular-input line-entry system) string is compact and sequential, so a Transformer over it sees <b>global</b> context cheaply — but ring closures and stereochemistry are implicit. A graph states the topology explicitly, and a GNN (graph neural network) over it is precise about the <b>local</b> neighbourhood but loses global context as depth grows.
<br><span class="credit">Shen et al., <a href="https://doi.org/10.1093/bib/bbae256"><i>Brief. Bioinform.</i> <b>25</b>(4), bbae256 (2024)</a> &#183; paper figure, Figure 1</span></figcaption>
</figure>

That complementarity is the usual argument for combining them, and several models already do: GraphMVP (2D + 3D), MoleculeSTM (graph + text), MOCO and DVMP (SMILES + graph).

<mark>The paper's complaint about all of them is the same: they align the two views **globally**, with a contrastive loss between whole-molecule embeddings — pull the two views of the same molecule together, push different molecules apart — and nothing forces the views to exchange information at the atom level.</mark> On the paper's reading, two encoders can satisfy a global contrastive objective while each one independently learns a decent representation — the "interaction" is a dot product at the end.

## The idea

<figure>
<img src="/assets/fig/molesg-f2.jpg" alt="MoleSG: masked SMILES and graph encoders, a shared Transformer backbone, and two decoders" width="666" height="256">
<figcaption><b>Figure 2.</b> The framework. Each view is masked and encoded separately, the two token sequences meet in a <b>shared Transformer backbone</b>, and two modality-specific decoders reconstruct the original inputs. The objective is reconstruction, not contrast.
<br><span class="credit">Shen et al., <a href="https://doi.org/10.1093/bib/bbae256"><i>Brief. Bioinform.</i> <b>25</b>(4), bbae256 (2024)</a> &#183; paper figure, Figure 2</span></figcaption>
</figure>

Two changes from the usual recipe. The objective is **masked reconstruction** rather than contrastive alignment, and the two views pass through a **shared** backbone where [self-attention](../attention-en/) can mix them.

The paper notes that reconstruction alone would not force cooperation either: a model can learn to fill in a masked SMILES token from the surrounding SMILES. The mechanism that makes the two views need each other is the **masking**.

## Non-overlapping masking

<figure>
<img src="/assets/fig/molesg-f3.jpg" alt="Atom-index alignment between SMILES tokens and graph nodes, then disjoint masks" width="666" height="217">
<figcaption><b>Figure 3.</b> The masking, in two steps. First SMILES tokens are sorted into atoms, bonds and syntax, and only the <b>atom</b> tokens are indexed so they line up with graph nodes. Then the two masks are chosen to be <b>disjoint</b>: an atom hidden in the SMILES is visible in the graph, and vice versa.
<br><span class="credit">Shen et al., <a href="https://doi.org/10.1093/bib/bbae256"><i>Brief. Bioinform.</i> <b>25</b>(4), bbae256 (2024)</a> &#183; paper figure, Figure 3</span></figcaption>
</figure>

The alignment step is less trivial than it sounds. SMILES has three kinds of token — atoms (`C`, `N`, `[Cl-]`), bonds (`=`, `#`) and syntax (parentheses, ring-closure digits) — and single bonds are usually omitted entirely, so the string and the graph do not correspond position by position. Only the **atom** tokens can be indexed against graph nodes, and that is what the alignment extracts.

Once aligned, the masks are made disjoint. <mark class="blue">Now reconstructing a masked atom in one view is only possible by reading the other view, because the information was deliberately removed from its own.</mark> The cross-modal interaction stops being optional.

Mask ratios: 15% on SMILES, 25% on the graph. Both were tuned, and the sweep is reported in the ablations.

## Evaluation

| | |
| --- | --- |
| pre-training | 250K unlabelled molecules from ZINC15 |
| downstream | 14 MoleculeNet datasets — 678 classification tasks, 19 regression |
| split | [scaffold](../data-splitting-en/), 8:1:1 (QM9 random), 3 seeds |
| metrics | ROC-AUC (area under the receiver operating characteristic curve) for classification; RMSE (root mean squared error) or MAE (mean absolute error) for regression |
| baselines | supervised (MPNN, DMPNN, CMPNN, CoMPT) and pre-trained (GROVER, GraphMVP, MolCLR, GEM, DVMP, SMICLR) |

The reported result is best or near-best across the 14 tasks, and the ablations test the mechanism directly: performance against SMILES mask ratio, against graph mask ratio, and **against the overlap ratio between the two masks**. If non-overlap is the mechanism, performance should degrade as the masks are allowed to overlap, and that is what the ablation shows.

They also re-implement MolCLR and DVMP inside their own encoder, which removes the usual objection that the gain came from a better backbone.

## What I would question

**Fine-tuning uses one modality and drops the backbone.** This is stated plainly in the paper and it is the part I keep turning over. Only the pre-trained graph encoder is fine-tuned; the SMILES branch and the shared Transformer are discarded at that point. The stated reason is fairness — the comparison models are graph-only at test time.

It is a defensible choice, and it also means the claim being tested is narrower than it first appears. The benefit is not "a multimodal model predicts better". It is **"a graph encoder trained in the presence of a second view ends up better than one trained alone"** — the second modality is scaffolding during pre-training, removed before use. That is a more interesting claim, arguably, but the paper does not frame it that way.

**The overlap sweep moves two things at once.** It is run across all 14 benchmarks, so coverage is not the objection. The objection is that the two mask ratios are held at 15% and 25% while overlap goes from 0% to 100%, which also takes the fraction of atoms hidden in at least one view from 40% down to 25%. Overlap and how much is hidden are confounded, and the figure cannot separate them.

**The alignment is SMILES-specific.** Atom-token indexing depends on the quirks of SMILES syntax. The paper suggests extending the idea to protein sequence plus structure, where the alignment is actually easier — residues index cleanly — so that direction looks more promising than the molecular case.

## Why I read it

The dual-view framing is the same one I work in: [SJoINT](https://github.com/sslim-aidrug/SJoINT) also pre-trains on two views of one molecule, and also wants interaction below the whole-molecule level. The difference is where the constraint lives. MoleSG constrains the **masks** so the views must consult each other; I constrain the **attention** by membership, so an atom can only exchange information with the substructures that contain it.

Both are answers to the same complaint about global contrastive learning. MoleSG's is cheaper — it is a data-side trick that needs no architectural constraint — and mine is more specific about which pairs are allowed to interact. Which is better is an empirical question neither paper asks.

## Summary

- SMILES carries global context, graphs carry local structure, and prior multimodal work aligns them only at the whole-molecule level
- MoleSG swaps contrastive alignment for **masked reconstruction** through a shared Transformer
- The mechanism is **non-overlapping masking**: atom tokens are indexed against graph nodes, then the masks are made disjoint
- So reconstructing one view requires reading the other — cross-modal interaction becomes necessary rather than optional
- 250K ZINC15 for pre-training, 14 MoleculeNet tasks with scaffold splits, 3 seeds
- The claim actually tested is narrower than "multimodal is better": **the second view is scaffolding during pre-training and is thrown away before fine-tuning**

## References

- Shen et al., [Complementary multi-modality molecular self-supervised learning via non-overlapping masking](https://doi.org/10.1093/bib/bbae256), *Brief. Bioinform.* **25**(4) (2024) — the paper reviewed here
- Liu et al., [Pre-training molecular graph representation with 3D geometry](https://arxiv.org/abs/2110.07728) (ICLR 2022) — GraphMVP
- Wang et al., [MolCLR: molecular contrastive learning of representations via graph neural networks](https://doi.org/10.1038/s42256-022-00447-x), *Nat. Mach. Intell.* (2022)
