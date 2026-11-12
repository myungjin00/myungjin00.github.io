---
title: "Molecular descriptors and fingerprints"
date: 2025-05-16
description: "Continuous descriptors and discrete fingerprints · ECFP and hash collisions · where the Tanimoto 0.85 rule comes from and where it fails · activity cliffs"
category: concept
updated: 2025-06
lang: en
group: descriptors
topic: Cheminformatics
subtopic: Representation
tags: [cheminformatics, molecular representation]
---

Machine learning eats numbers. A molecule is not a number. Descriptors and fingerprints are the two classical ways to bridge that gap, and they work differently.

<figure>
<svg viewBox="0 0 540 206" role="img" aria-label="A molecule turned into a continuous descriptor vector, a discrete fingerprint bit vector, and a learned embedding.">
  <g font-family="IBM Plex Mono, monospace" font-size="11" fill="#1E4A39">
    <text x="16" y="20">descriptor</text><text x="16" y="88">fingerprint</text><text x="16" y="156">learned embedding</text>
  </g>
  <g font-family="IBM Plex Mono, monospace" font-size="9.5" fill="#6E7873">
    <text x="16" y="36">continuous · named</text><text x="16" y="104">discrete · present or not</text><text x="16" y="172">continuous · unnamed</text>
  </g>
  <g font-family="IBM Plex Mono, monospace" font-size="10" fill="#46524D">
    <text x="166" y="26">MW</text><text x="226" y="26">logP</text><text x="294" y="26">TPSA</text><text x="360" y="26">HBD</text><text x="414" y="26">rings</text>
    <text x="166" y="54">180.2</text><text x="226" y="54">1.31</text><text x="294" y="54">63.6</text><text x="360" y="54">1</text><text x="414" y="54">1</text>
  </g>
  <g fill="none" stroke="#C2703C" stroke-width="1.2"><rect x="158" y="36" width="56" height="24" rx="3"/><rect x="220" y="36" width="56" height="24" rx="3"/><rect x="286" y="36" width="56" height="24" rx="3"/><rect x="352" y="36" width="46" height="24" rx="3"/><rect x="406" y="36" width="46" height="24" rx="3"/></g>
  <g font-family="IBM Plex Mono, monospace" font-size="10" fill="#46524D"><text x="166" y="94">0 1 0 0 1 1 0 0 1 0 0 1 0 0 0 1 …</text></g>
  <g stroke="#2E5878" stroke-width="1.2">
    <rect x="158" y="102" width="18" height="18" rx="2" fill="none"/><rect x="180" y="102" width="18" height="18" rx="2" fill="rgba(46,88,120,.75)"/>
    <rect x="202" y="102" width="18" height="18" rx="2" fill="none"/><rect x="224" y="102" width="18" height="18" rx="2" fill="none"/>
    <rect x="246" y="102" width="18" height="18" rx="2" fill="rgba(46,88,120,.75)"/><rect x="268" y="102" width="18" height="18" rx="2" fill="rgba(46,88,120,.75)"/>
    <rect x="290" y="102" width="18" height="18" rx="2" fill="none"/><rect x="312" y="102" width="18" height="18" rx="2" fill="none"/>
    <rect x="334" y="102" width="18" height="18" rx="2" fill="rgba(46,88,120,.75)"/><rect x="356" y="102" width="18" height="18" rx="2" fill="none"/>
    <rect x="378" y="102" width="18" height="18" rx="2" fill="none"/><rect x="400" y="102" width="18" height="18" rx="2" fill="rgba(46,88,120,.75)"/>
  </g>
  <text x="426" y="116" font-family="IBM Plex Mono, monospace" font-size="10" fill="#6E7873">… 2048 bits</text>
  <g fill="rgba(30,74,57,.14)" stroke="#1E4A39" stroke-width="1.1">
    <rect x="158" y="166" width="22" height="22" rx="3"/><rect x="184" y="166" width="22" height="22" rx="3" fill="rgba(30,74,57,.5)"/>
    <rect x="210" y="166" width="22" height="22" rx="3" fill="rgba(30,74,57,.28)"/><rect x="236" y="166" width="22" height="22" rx="3" fill="rgba(30,74,57,.62)"/>
    <rect x="262" y="166" width="22" height="22" rx="3" fill="rgba(30,74,57,.1)"/><rect x="288" y="166" width="22" height="22" rx="3" fill="rgba(30,74,57,.4)"/>
    <rect x="314" y="166" width="22" height="22" rx="3" fill="rgba(30,74,57,.2)"/><rect x="340" y="166" width="22" height="22" rx="3" fill="rgba(30,74,57,.55)"/>
  </g>
  <text x="372" y="181" font-family="IBM Plex Mono, monospace" font-size="10" fill="#6E7873">… 300 dims</text>
</svg>
<figcaption><b>One molecule, three vectors.</b> Every slot of a descriptor has a name and a unit; every slot of a fingerprint answers "is this fragment present"; and nobody can say what a slot of a learned embedding means. The values are aspirin's.</figcaption>
</figure>

## Descriptors

A descriptor is **a number computed from the molecule**, and each one has a name and a meaning.

| kind | examples |
| --- | --- |
| constitutional | molecular weight, heavy atom count, ring count |
| physicochemical | logP, TPSA (topological polar surface area), refractivity |
| topological | Balaban J, Wiener index, connectivity indices |
| drug-likeness | H-bond donors and acceptors, rotatable bonds |

RDKit alone computes over two hundred of them.

```python
from rdkit import Chem
from rdkit.Chem import Descriptors
m = Chem.MolFromSmiles("CC(=O)Oc1ccccc1C(=O)O")   # aspirin
round(Descriptors.MolWt(m), 2), round(Descriptors.MolLogP(m), 2), round(Descriptors.TPSA(m), 2)
# (180.16, 1.31, 63.6)
```

**Lipinski's rule of five** is the classic use: molecular weight ≤ 500, logP ≤ 5, H-bond donors ≤ 5, acceptors ≤ 10. Four descriptors with thresholds, as a rough filter for oral absorption.

Their strength is interpretation. If a model leans on logP, you immediately know what that means.

Their limit is that detail disappears. Many molecules weigh 180 with a logP of 1.3, and descriptors alone cannot say which of them is active.

## Fingerprints

A fingerprint is **a vector of bits recording presence and absence**: each bit answers whether some substructure occurs in the molecule. This is the <u>discrete</u> representation, in contrast to the continuous descriptors above.

There are three families.

| family | what a bit means |
| --- | --- |
| structural keys (MACCS) | one of 166 predefined questions — "is there a sulfur", "more than one aromatic ring" |
| path-based (RDKit FP, Daylight) | every short path in the molecule, hashed to a bit |
| circular (Morgan / ECFP) | the environment within radius $r$ of each atom, hashed to a bit |

ECFP (extended-connectivity fingerprint) is the de facto standard.

```python
from rdkit.Chem import rdFingerprintGenerator
gen = rdFingerprintGenerator.GetMorganGenerator(radius=2, fpSize=2048)
fp = gen.GetFingerprint(m)        # 2048 bits; aspirin sets 24 of them
```

`radius=2` is what people call **ECFP4** — the 4 is the diameter.

### Hash collisions

The number of possible atom environments is effectively unbounded, and they are being squeezed into 2048 slots. So <mark>two different fragments can land on the same bit</mark>. This is a bit collision, and it is where a fingerprint quietly lies to you. Going to 4096 bits reduces it; nothing removes it.

### Similarity

The main use of a fingerprint is measuring **how alike two molecules are**. The standard measure is the Tanimoto coefficient.

$$
T(A, B) = \frac{|A \cap B|}{|A \cup B|}
$$

Bits set in both, over bits set in either. It runs from 0 to 1, and **0.85 is the conventional threshold** for "similar" — a convention, not a law of nature.

> **The similarity principle, and where it fails.** Drug design rests on the assumption that similar structures have similar activity. But pairs exist where changing one atom moves activity a hundredfold; these are **activity cliffs**. Fingerprint similarity says 0.9, the activities say otherwise. The [MoleculeACE](https://github.com/molML/MoleculeACE) benchmark collects exactly these cases. What fails there is the *similarity measure*, not the representation: fingerprints plus a classical regressor actually [match or beat message-passing models](../activity-cliff-en/) on those pairs.

## Descriptors, fingerprints and embeddings compared

| | descriptor | fingerprint | learned embedding |
| --- | --- | --- | --- |
| values | continuous | discrete (0/1) | continuous |
| meaning of a slot | explicit | a substructure (collisions possible) | unknown |
| who decided | a person | a person (rules) | the data |
| length | ~200 | 1024–4096 | usually 128–512 |
| adapts to the task | no | no | yes |
| data needed | little | little | a lot |

<mark class="blue">The first two are **fixed**: the vector is the same whatever you are predicting.</mark> That is precisely what [deep learning changed](../ml-and-dl-en/) — the representation itself becomes something the task shapes.

## Where they are still used

Learned representations have not displaced them in these four places.

- **When data is scarce.** On a few hundred molecules, ECFP with a random forest routinely beats a graph neural network.
- **As a baseline.** If a new model cannot beat ECFP plus random forest, it is not ready.
- **For search and clustering.** Finding similar molecules in a library of hundreds of millions is far faster with fingerprints.
- **As a pretext task.** Asking a model to predict descriptors builds useful representations along the way — one of the objectives [MAGNET](../../projects/magnet/) uses.

## Summary

- Descriptors are **continuous** and named — easy to interpret, but detail is lost
- Fingerprints are **discrete**, recording which substructures are present — with hash collisions
- Tanimoto 0.85 is the usual similarity threshold, and activity cliffs break it
- Both are fixed; a learned embedding changes with the task
- With little data, fingerprints still win — always include them as a baseline

## References

- [RDKit: list of available descriptors](https://www.rdkit.org/docs/GettingStartedInPython.html#list-of-available-descriptors)
- [RDKit: fingerprinting and molecular similarity](https://www.rdkit.org/docs/GettingStartedInPython.html#fingerprinting-and-molecular-similarity)
- Rogers & Hahn, [Extended-Connectivity Fingerprints](https://doi.org/10.1021/ci100050t), *J. Chem. Inf. Model.* (2010) — the ECFP paper
