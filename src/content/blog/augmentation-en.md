---
title: "Data augmentation, and why molecules make it hard"
date: 2025-03-14
description: "Augmentation is a claim that a transformation does not change the label · what it buys and what it costs · the standard moves in images, text, graphs and molecules · and why atom masking is the one that quietly breaks"
category: concept
updated: 2025-04
lang: en
group: augmentation
topic: Machine learning
subtopic: Basics
tags: [augmentation, contrastive learning, molecular representation]
---

With a few thousand labelled molecules, the obvious move is to make more training examples out of the ones you have. That is augmentation, and in images it works so well it is barely discussed. In molecules it is the step most likely to be wrong.

## What augmentation actually asserts

Every augmentation is the same claim:

> **this transformation changes the input but not the label.**

Rotate a cat and it is still a cat. That claim is what lets you train on the rotated image with the original label, and everything else follows from whether it holds.

When it holds, you get two things:

- **More effective data.** A model sees more variation per epoch than the dataset contains.
- **An invariance is taught.** You tell the model "this axis does not matter", which is a prior being injected through the data rather than the architecture.

The second is what separates augmentation from simply having more data. <mark>You are not adding information; you are removing a direction the model is allowed to use.</mark> That helps when the direction is genuinely irrelevant and hurts when it is not.

## The standard moves, by modality

| Modality | Typical transformations | Label safe because |
| --- | --- | --- |
| images | flip, crop, rotate, colour jitter, cutout, mixup | a cat is a cat under all of them |
| audio | time shift, pitch shift, noise, SpecAugment masking | the word survives |
| text | synonym swap, back-translation, random deletion | meaning mostly survives — mostly |
| tabular | SMOTE (synthetic minority over-sampling technique), noise on continuous columns | assumes local linearity between neighbours |
| graphs | node drop, edge perturbation, subgraph sampling, feature masking | a large graph's properties are robust to small edits |
| molecules | SMILES enumeration, atom masking, bond deletion, subgraph removal | **this is where it breaks** |

Text already shows the crack. Synonym replacement is safe until the sentence is about the precise word. Negation is the classic failure: delete one word and the label inverts.

## Why molecules are different

<mark class="blue">A molecular graph has almost no transformation that preserves the label.</mark>

- **Delete an atom** and you have a different compound, with a different measured property. Not a noisy version of the same one — a different one.
- **Perturb a bond** and you may have produced something that cannot exist.
- **Drop a subgraph** and you have removed the functional group the property depended on.

Image augmentation works because the label is robust to pixel-level change. Molecular properties are not: [activity cliffs](../activity-cliff-en/) are the extreme statement of this — one methylene changes potency a thousandfold. A model trained to treat an atom deletion as label-preserving is being taught precisely the smoothness that cliffs violate.

One transformation is genuinely safe.

**SMILES enumeration.** SMILES (simplified molecular-input line-entry system) is a string form of a molecule, and the same one has many valid SMILES strings depending on which atom you start from. Enumerating them gives a text model many inputs for one molecule with a guaranteed-identical label, because the *molecule* never changed — only its serialisation. It is the only label-safe transformation of the six, and it only helps string-based models.

```python
from rdkit import Chem
m = Chem.MolFromSmiles("CC(=O)Oc1ccccc1C(=O)O")
[Chem.MolToSmiles(m, doRandom=True, canonical=False) for _ in range(3)]
# three different strings, all parsing back to the same molecule
```

## Where it bites hardest: contrastive learning

Contrastive pre-training needs a **positive pair** — two views that should land close in the embedding space. In images you make one by augmenting twice. In molecules you have to augment, and now the whole method rests on the unsafe assumption.

If your positive pair is (molecule, molecule-with-an-atom-deleted), you are training the encoder to place a compound and a *different* compound together. The representation that results is smooth in exactly the way that fails at a cliff.

The way out is to find two views that are **descriptions of the same molecule** rather than perturbations of it:

| Approach | The two views | Perturbation needed |
| --- | --- | --- |
| standard graph contrastive | graph, perturbed graph | yes — unsafe |
| [MoleSG](../molesg-en/) | SMILES, graph | no |
| 2D/3D (GraphMVP) | topology, conformer | no |
| [SJoINT](https://github.com/sslim-aidrug/SJoINT) | atom graph, [junction tree](../fragmentation-en/) | no |

That is the design decision behind all three: **a second view, not a corrupted copy.** The positive pair is free because the two descriptions were always of one molecule.

## The costs

Even where augmentation is safe, it is not free.

- **You can augment away a real signal.** Colour jitter on a task where colour is the label; atom masking where the atom is the pharmacophore.
- **It slows training**, sometimes substantially, for data that is not new information.
- **It interacts with evaluation.** Augmenting the training set and not the test set is correct; forgetting and augmenting both inflates the score.
- **Heavy augmentation can replace the model's capacity problem with an optimisation one.** If the task is already hard, adding variation can stop it converging rather than help it generalise.
- **It hides a small dataset rather than fixing one.** Ten thousand augmented versions of 600 molecules is still 600 molecules of information, and a [scaffold split](../evaluation-protocol-en/) will say so.

## Summary

- Augmentation asserts that **a transformation changes the input but not the label**; everything depends on whether that holds
- It does not add information — it **removes a direction the model may use**, which is a prior injected through the data
- Images and audio are safe; text is mostly safe and fails on negation; graphs are safe when large
- **Molecules have almost no label-preserving transformation.** Delete an atom and it is a different compound, which is the same fact that produces activity cliffs
- **SMILES enumeration is the exception** — the molecule never changed, only its serialisation
- Contrastive learning is where this bites, because the positive pair is the augmentation itself
- The fix is a **second view rather than a corrupted copy**: SMILES + graph, 2D + 3D, atoms + junction tree
- Costs: augmenting away real signal, slower training, and hiding a small dataset instead of fixing it

## References

- Chen et al., [A simple framework for contrastive learning of visual representations](https://arxiv.org/abs/2002.05709) (ICML 2020) — SimCLR, where the augmentation recipe comes from
- Bjerrum, [SMILES enumeration as data augmentation for neural network modeling of molecules](https://arxiv.org/abs/1703.07076) (2017)
- You et al., [Graph contrastive learning with augmentations](https://arxiv.org/abs/2010.13902) (NeurIPS 2020) — GraphCL and its augmentation set
- Wang et al., [MolCLR: molecular contrastive learning of representations via graph neural networks](https://doi.org/10.1038/s42256-022-00447-x), *Nat. Mach. Intell.* (2022)
