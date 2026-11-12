---
title: "Working with molecules in RDKit: standardisation, SMARTS and the traps"
date: 2026-07-10
description: "Parsing that fails silently · the standardisation order that actually matters · deduplication before the split · SMARTS patterns worth keeping · bulk descriptors and fingerprints · where 3D and parallelism cost you"
category: tutorial
updated: 2026-08
lang: en
group: rdkit-practice
topic: Cheminformatics
subtopic: Representation
tags: [RDKit, standardisation, SMARTS, dataset curation]
---

Almost every molecular dataset arrives dirty — salts, duplicates, a handful of unparseable strings, the same compound written two ways. <mark class="blue">The curation step decides more about the final number than the model does, and it is the step that gets one line in a methods section.</mark>

What descriptors and fingerprints *are* is in the [descriptors and fingerprints](../descriptors-fingerprints-en/) note.

## Reading molecules, and failing loudly

`Chem.MolFromSmiles` — SMILES is the simplified molecular-input line-entry system, the one-line text form of a structure — does not raise on a bad input. It returns `None`, writes a complaint to stderr, and lets you carry on.

```python
from rdkit import Chem, RDLogger

RDLogger.DisableLog("rdApp.*")      # the parser is noisy; keep your own count instead

smiles = ["CC(=O)Oc1ccccc1C(=O)O", "CC(C)Cc1ccc(cc1)C(C)C(=O)O",
          "CN(C)(C)C", "C1CCCCC"]

parsed = [(s, Chem.MolFromSmiles(s)) for s in smiles]
mols   = [(s, m) for s, m in parsed if m is not None]
failed = [s for s, m in parsed if m is None]

print(f"parsed {len(mols)}/{len(parsed)}, dropped {len(failed)}")
print("failed:", failed)
```

```
parsed 2/4, dropped 2
failed: ['CN(C)(C)C', 'C1CCCCC']
```

Those two fail for different reasons — a nitrogen with four single bonds and no charge, and a ring bond that is never closed — and both are the kind of thing a vendor file is full of. The one-line filter is `if m is not None`, and the part everyone skips is the second half: **count what you dropped and report the count**. A dataset described as "3,214 compounds" where 3,180 parsed is a different dataset, and if the failures are not random — organometallics, say — you have silently changed the chemical space you are claiming to cover.

Set `sanitize=False` only if you intend to fix the molecule yourself afterwards. An unsanitised Mol has no ring information and no aromaticity perception, so descriptors computed on it are wrong rather than approximate.

## Standardisation, in the order it has to happen

`rdkit.Chem.MolStandardize.rdMolStandardize` is RDKit's port of MolVS, the reference standardisation library, and three calls cover most of what a dataset needs, with a fourth for tautomers further down.

```python
from rdkit import Chem
from rdkit.Chem.MolStandardize import rdMolStandardize

def standardise(mol):
    mol = rdMolStandardize.Cleanup(mol)              # 1. sanitise, fix nitro/azide drawing, disconnect metals
    mol = rdMolStandardize.FragmentParent(mol)       # 2. keep the largest organic fragment
    mol = rdMolStandardize.Uncharger().uncharge(mol) # 3. neutralise what can be neutralised
    return mol

for s in ["CC(=O)Oc1ccccc1C(=O)[O-].[Na+]",          # aspirin, sodium salt
          "CN(C)CCCN1c2ccccc2CCc2ccccc21.Cl.Cl",     # imipramine dihydrochloride
          "CC(=O)Nc1ccc(O)cc1.O"]:                   # paracetamol, hydrate
    print(Chem.MolToSmiles(standardise(Chem.MolFromSmiles(s))))
```

```
CC(=O)Oc1ccccc1C(=O)O
CN(C)CCCN1c2ccccc2CCc2ccccc21
CC(=O)Nc1ccc(O)cc1
```

<figure>
<img src="/assets/fig/standardisation-steps.svg" alt="Diclofenac sodium after each of the three standardisation calls, in order" loading="lazy" />
<figcaption><b>One salt, three calls.</b> Diclofenac sodium drawn the way vendor files often write it, with a covalent metal bond, then after each call in turn. The metal has to be disconnected before fragments can be compared, and the counter-ion has to be gone before the charge is neutralised; every structure and number here is RDKit's own output.</figcaption>
</figure>

### Why the order matters

The three steps are not interchangeable.

| Step | Does | Why here |
| --- | --- | --- |
| `Cleanup` | sanitises, normalises functional-group drawing, breaks covalent metal bonds | normalisation has to happen before anything inspects the structure; later steps read bond orders and charges that `Cleanup` may rewrite |
| `FragmentParent` | drops counter-ions, solvents, water — keeps the largest organic fragment | **before** uncharging: a chloride counter-ion neutralised in place becomes HCl, a legitimate fragment that then competes to be the parent |
| `Uncharger` | removes matched charge pairs, protonates/deprotonates to the neutral form | **after** fragment selection: there is no point deciding the protonation state of ions you are about to discard |

Get it the wrong way round and the failures are quiet. Uncharge first and a zwitterion loses the charge separation that `FragmentParent` would have used to recognise it as one molecule. Skip `Cleanup` and a nitro group written as `N(=O)=O` and the same group written as `[N+](=O)[O-]` stay two different structures all the way to the deduplication step, where they do not match.

<mark>`FragmentParent` keeps the largest fragment, which is a heuristic, not a fact.</mark> For a genuine co-crystal or a two-component drug it throws away half the compound. Check the fragment count before standardising, and look at anything where the discarded part is more than roughly a third of the heavy atoms.

### Tautomers, last and reluctantly

```python
te = rdMolStandardize.TautomerEnumerator()
for s in ["Oc1ccccn1", "O=c1cccc[nH]1", "OC1=CCCCC1"]:
    print(s, "->", Chem.MolToSmiles(te.Canonicalize(Chem.MolFromSmiles(s))))
```

```
Oc1ccccn1 -> O=c1cccc[nH]1
O=c1cccc[nH]1 -> O=c1cccc[nH]1
OC1=CCCCC1 -> O=C1CCCCC1
```

2-hydroxypyridine and 2-pyridone collapse to one structure, which is what you want — they are the same compound, and without this they are two rows in your dataset.

Two warnings. It is **slow**: enumeration is combinatorial, and a molecule with several enolisable positions can take hundreds of milliseconds, so on a large library this step dominates the curation time. And it is **opinionated**: the canonical form is chosen by a scoring function, not by thermodynamics, so the answer is sometimes not the tautomer a chemist would draw. That is acceptable for a deduplication key, where all you need is consistency. It is not acceptable as a claim about which form exists in solution. Run it last, after the cheap steps have already removed the easy duplicates.

## Deduplication, done right

The key is the canonical SMILES of the standardised molecule. RDKit's canonical form is stable within a version, which is all a within-dataset key needs.

```python
import pandas as pd
from rdkit import Chem

df = pd.DataFrame({
    "smiles": ["CC(=O)Oc1ccccc1C(=O)O", "O=C(O)c1ccccc1OC(C)=O",
               "c1ccccc1O", "C[C@H](N)C(=O)O"],
    "pIC50":  [7.1, 7.5, 5.2, 6.0],
})
df["key"] = [Chem.MolToSmiles(Chem.MolFromSmiles(s)) for s in df.smiles]

dups = df[df.duplicated("key", keep=False)]
spread = dups.groupby("key").pIC50.agg(["count", "min", "max"])
spread["range"] = spread["max"] - spread["min"]
print(spread)
```

```
                       count  min  max  range
key
CC(=O)Oc1ccccc1C(=O)O      2  7.1  7.5    0.4
```

The first two rows are aspirin written two ways. Exact string matching finds neither.

For stereochemistry-insensitive matching, use the **InChIKey** — the hashed form of the InChI (International Chemical Identifier) — and compare **the first block only**. The first 14 characters encode the skeletal connectivity; the second block carries stereochemistry and isotopes.

```python
from rdkit.Chem.inchi import MolToInchiKey

for s in ["C[C@H](N)C(=O)O", "C[C@@H](N)C(=O)O"]:      # L- and D-alanine
    m = Chem.MolFromSmiles(s)
    print(Chem.MolToSmiles(m), MolToInchiKey(m).split("-")[0])
```

```
C[C@H](N)C(=O)O QNAYBMKLOCPYGJ
C[C@@H](N)C(=O)O QNAYBMKLOCPYGJ
```

Different canonical SMILES, same first block. Which behaviour you want depends on the assay: if the two enantiomers were measured separately and differ, collapsing them destroys real signal, and if the source reported a racemate under one identifier, keeping them apart invents signal. Decide deliberately.

### Deduplicate before splitting, never after

This is the one that quietly ruins results. If the same compound sits in train and test under two different SMILES, the test score is partly a memorisation score, and the effect is largest exactly where it is least visible — on the strict splits people use to demonstrate generalisation. The [splitting note](../data-splitting-en/) makes the same point from the other side: exact SMILES matching is not sufficient to deduplicate, so structures must be standardised first. Order of operations: parse → standardise → deduplicate → split → never touch the test set again, as in the [evaluation protocol](../evaluation-protocol-en/).

### Duplicates with conflicting labels

Two measurements of the same structure that disagree are a decision, not a bug to be hidden. Three defensible options:

| Option | When | Cost |
| --- | --- | --- |
| **average** | replicate measurements of the same assay, small spread | hides a genuinely bimodal pair |
| **drop** | spread larger than the assay's own error | loses data, biases towards easy compounds |
| **keep the most reliable** | sources differ in quality, or one is a curated reference | needs a provenance column you may not have |

```python
# keep the mean, but drop pairs that disagree by more than 1 log unit
clean = df.groupby("key", as_index=False).agg(pIC50=("pIC50", "mean"), n=("pIC50", "size"))
bad = spread.index[spread.range > 1.0]
clean = clean[~clean.key.isin(bad)]
```

Whichever you pick, **write the rule and the resulting count in the methods**. "Averaged replicates; dropped 41 pairs disagreeing by more than 1 log unit" is one sentence and it makes the dataset reproducible.

## SMARTS substructure matching

SMARTS — SMILES arbitrary target specification — is SMILES extended with wildcards and logic, for asking whether a pattern occurs. Compile the pattern once, reuse it; `MolFromSmarts` is not free.

Four pieces of syntax make the table below readable: inside brackets, `X` is the atom's total connection count and `H` its attached-hydrogen count, `;` means and while `,` means or, and `$(...)` holds a whole sub-pattern, so `!$(NC=O)` reads "not a nitrogen bonded to a carbonyl carbon".

| Pattern | SMARTS | Note |
| --- | --- | --- |
| carboxylic acid | `[CX3](=O)[OX2H1]` | requires the acidic H, so it misses the deprotonated form |
| primary amine | `[NX3;H2;!$(NC=O)]` | the recursive `!$(...)` is what excludes primary amides |
| aromatic nitro | `[$([NX3](=O)=O),$([NX3+](=O)[O-])][c]` | both drawings, because input files contain both |
| amide bond | `[NX3][CX3](=[OX1])` | matches peptide bonds too |
| sulfonamide | `[SX4](=[OX1])(=[OX1])[NX3]` | |
| halogen | `[F,Cl,Br,I]` | plain atom list; no `X` count needed |

```python
from rdkit import Chem

PATTERNS = {k: Chem.MolFromSmarts(v) for k, v in {
    "carboxylic acid": "[CX3](=O)[OX2H1]",
    "primary amine":   "[NX3;H2;!$(NC=O)]",
    "aromatic nitro":  "[$([NX3](=O)=O),$([NX3+](=O)[O-])][c]",
    "amide bond":      "[NX3][CX3](=[OX1])",
    "sulfonamide":     "[SX4](=[OX1])(=[OX1])[NX3]",
    "halogen":         "[F,Cl,Br,I]",
}.items()}
assert all(PATTERNS.values())        # MolFromSmarts also returns None on a typo

for name, smi in [("aspirin",          "CC(=O)Oc1ccccc1C(=O)O"),
                  ("sulfamethoxazole", "Cc1onc(c1)NS(=O)(=O)c1ccc(N)cc1"),
                  ("chloramphenicol",  "OC[C@@H](NC(=O)C(Cl)Cl)[C@@H](O)c1ccc(cc1)[N+](=O)[O-]")]:
    m = Chem.MolFromSmiles(smi)
    print(f"{name:18s}", [k for k, p in PATTERNS.items() if m.HasSubstructMatch(p)])
```

```
aspirin            ['carboxylic acid']
sulfamethoxazole   ['primary amine', 'sulfonamide']
chloramphenicol    ['aromatic nitro', 'amide bond', 'halogen']
```

`HasSubstructMatch` answers yes or no and stops at the first hit. `GetSubstructMatches` returns the atom indices of every match, which is what you need to count groups or to highlight them.

```python
m = Chem.MolFromSmiles("Nc1ccc(cc1)S(=O)(=O)Nc1ccccn1")      # sulfapyridine
print(m.GetSubstructMatches(PATTERNS["sulfonamide"]))        # ((7, 8, 9, 10),)
print(m.GetSubstructMatches(PATTERNS["primary amine"]))      # ((0,),)
```

Symmetric patterns return several overlapping tuples for one chemical group, so pass `uniquify=True` (the default) and, for counting groups rather than matches, reduce the tuples to the set of atoms you care about.

## Aromaticity is a model, not a property

Aromaticity is perceived, and the rules differ between toolkits. A SMARTS written against another toolkit's model can fail to match in RDKit even though the chemistry is identical.

```python
m = Chem.MolFromSmiles("c1ccccc1")
print(m.HasSubstructMatch(Chem.MolFromSmarts("C1=CC=CC=C1")))   # False
print(m.HasSubstructMatch(Chem.MolFromSmarts("c1ccccc1")))      # True
```

The same benzene, two SMARTS for it, one answer each way. The kekulé pattern — the ring written out with alternating single and double bonds — asks for aliphatic carbons with alternating double bonds, and RDKit has already perceived those atoms as aromatic. Borderline rings — pyranones, some five-membered heterocycles, bridged systems — are where the models actually disagree, and `Chem.SetAromaticity(mol, Chem.AromaticityModel.AROMATICITY_SIMPLE)` lets you switch RDKit's model if you need to match another toolkit's behaviour. The practical rule: write patterns with explicit `a`/`A` or lowercase/uppercase atoms deliberately, and test every pattern against molecules you know should and should not match.

## Descriptors and fingerprints in bulk

For what these represent, see the [descriptors and fingerprints](../descriptors-fingerprints-en/) note. The calls:

```python
import numpy as np
from rdkit import Chem
from rdkit.Chem import Descriptors, rdFingerprintGenerator

mols = [Chem.MolFromSmiles(s) for s in ["CC(=O)Oc1ccccc1C(=O)O", "c1ccccc1O"]]

# all descriptors at once -> dict, one call per molecule
d = Descriptors.CalcMolDescriptors(mols[0])
print(len(d), round(d["MolWt"], 2), round(d["TPSA"], 1))     # 217 180.16 63.6

# fingerprints: the generator API, reused across molecules
gen = rdFingerprintGenerator.GetMorganGenerator(radius=2, fpSize=2048)
X = np.array(gen.GetFingerprints(mols, numThreads=8), dtype=np.uint8)
print(X.shape, X.sum(axis=1))                                 # (2, 2048) [24 11]
```

Three practical points. `CalcMolDescriptors` returns a dict of every descriptor RDKit knows — over two hundred — which is the right call for a dataframe and the wrong one if you need five of them in a loop; some are slow, and several are `NaN` or `inf` on unusual structures, so check before handing them to a model.

`rdFingerprintGenerator.GetMorganGenerator` is the current API (application programming interface). `AllChem.GetMorganFingerprintAsBitVect` is **deprecated** and still in most tutorials; it also re-reads its arguments on every call, where a generator is built once. The generator's `GetFingerprints` takes a list and a `numThreads`, which is the cheapest parallelism available here.

Converting to numpy: `np.array(fps, dtype=np.uint8)` works directly on a list of bit vectors and is enough. `DataStructs.ConvertToNumpyArray` per molecule does the same thing one row at a time. Keep `uint8` rather than `float32` — four times less memory on a matrix that is mostly zeros, and scikit-learn will cast when it needs to.

## 3D, only where it is actually needed

If a property depends on shape — conformer-dependent descriptors, a shape-based similarity, 3D input to a model — you need coordinates, and the sequence is add hydrogens, embed, optimise with MMFF (the Merck molecular force field).

```python
from rdkit import Chem
from rdkit.Chem import AllChem

m = Chem.AddHs(Chem.MolFromSmiles("CC(=O)Oc1ccccc1C(=O)O"))
assert AllChem.EmbedMolecule(m, randomSeed=0xf00d) == 0       # 0 = success, -1 = failed
AllChem.MMFFOptimizeMolecule(m, maxIters=500)
print(m.GetNumConformers(), "conformer;", m.GetNumAtoms(), "atoms with H")   # 1 conformer; 21 atoms with H
```

`AddHs` before embedding, not after, or the hydrogens have no coordinates. `randomSeed` is not optional in anything you intend to reproduce — the default is a non-deterministic embedding. And one conformer is usually not enough: a molecule with a few rotatable bonds has many accessible shapes, and the single conformer you get is one sample from that set, not the relevant one. `EmbedMultipleConfs(numConfs=…, pruneRmsThresh=…)` followed by `MMFFOptimizeMoleculeConfs(numThreads=…)` is what you actually need, and it is also where the cost explodes: tens to hundreds of conformers per molecule, each optimised, turns a minute of curation into hours. Confirm the step is genuinely needed before running it.

## Parallelism that works

RDKit releases the global interpreter lock (GIL) in some C++ routines and holds it in others, so threads give an uneven and unpredictable speed-up. Processes are predictable.

The rule that matters: **pass SMILES strings across the process boundary, not Mol objects.** A Mol pickles, but the round-trip is expensive enough to eat the gain, and the pickle does not carry everything by default — conformers and properties need `Chem.SetDefaultPickleProperties`. Send text, rebuild the Mol inside the worker, send text back.

```python
from multiprocessing import Pool
from rdkit import Chem, RDLogger
from rdkit.Chem.MolStandardize import rdMolStandardize

def standardise(smi):
    """SMILES in, SMILES out. No Mol crosses the process boundary."""
    RDLogger.DisableLog("rdApp.*")        # each worker is a fresh interpreter
    m = Chem.MolFromSmiles(smi)
    if m is None:
        return None
    m = rdMolStandardize.FragmentParent(rdMolStandardize.Cleanup(m))
    return Chem.MolToSmiles(rdMolStandardize.Uncharger().uncharge(m))

if __name__ == "__main__":
    smiles = ["CC(=O)Oc1ccccc1C(=O)[O-].[Na+]"] * 1000   # your list, in practice from a file
    with Pool(8) as pool:
        out = pool.map(standardise, smiles, chunksize=200)
    print(len(out), "in /", sum(x is not None for x in out), "out")
```

`chunksize` matters more than the worker count. Per-molecule work is milliseconds, so without chunking the queue overhead dominates and eight workers can be slower than one; a few hundred per chunk is a reasonable default. The `if __name__ == "__main__"` guard is mandatory, not stylistic — without it each worker re-imports and re-runs the module. And the logger is disabled inside the worker because each process starts clean.

Keep worker count at or below the physical core count. RDKit calls are memory-bound often enough that oversubscribing makes things worse, and a standardisation pass over a few hundred thousand molecules on eight workers is minutes, not hours.

## The traps

- **The silent `None`.** `MolFromSmiles` returns it instead of raising, and it propagates until something unrelated crashes. Filter, count, report the count.
- **Counter-ions inflating molecular weight.** Drugs are often distributed as salts, and the counter-ion’s mass counts towards the molecular weight. Imipramine dihydrochloride weighs 353.3 as given and 280.4 once the salt is stripped. Any weight-based filter applied before `FragmentParent` is filtering on the counter-ions.
- **Tautomers splitting one compound into two rows.** 2-hydroxypyridine and 2-pyridone are the same compound and two strings. One lands in train, one in test.
- **Stereochemistry lost without meaning to.** `MolToSmiles` keeps stereo by default, but `isomericSmiles=False`, a hand-written `Chem.RemoveStereochemistry`, or an InChIKey first-block match will all flatten enantiomers. Fine when the assay cannot distinguish them, destructive when it can.
- **Aromaticity model differences.** A SMARTS from another toolkit, or from a paper, may silently match nothing. Test every pattern on known positives and known negatives.
- **`random` without a seed.** Splits, conformer embedding, any shuffling. `EmbedMolecule` without `randomSeed` gives different coordinates every run, and a split without a seed makes the whole result unrepeatable.
- **Hidden duplicates across train and test.** The expensive one. Deduplicate on standardised structures before the split, and if you merged two sources, check the overlap explicitly rather than assuming different sources mean different molecules.

## Summary

- `MolFromSmiles` returns `None` on failure — filter it, **count it, and report the count**
- Standardise in order: `Cleanup` → `FragmentParent` → `Uncharger`, and tautomer canonicalisation last because it is slow and opinionated
- `FragmentParent` keeps the largest fragment, which is wrong for co-crystals and two-component drugs
- Deduplicate on canonical SMILES **before splitting**; InChIKey first block when you want stereochemistry ignored
- Conflicting labels are a decision — average, drop, or prefer a source — and the rule belongs in the methods
- Compile SMARTS once, use `GetSubstructMatches` for indices, and test patterns because aromaticity perception differs between toolkits
- `rdFingerprintGenerator` not the deprecated `GetMorganFingerprintAsBitVect`; `np.uint8` for the matrix
- 3D needs `AddHs` → `EmbedMolecule(randomSeed=…)` → `MMFFOptimizeMolecule`, and one conformer is rarely enough
- Parallelise with `multiprocessing.Pool` over **SMILES strings**, chunked, rebuilding the Mol in the worker

## References

- [RDKit: Getting started in Python](https://www.rdkit.org/docs/GettingStartedInPython.html) · [RDKit cookbook](https://www.rdkit.org/docs/Cookbook.html)
- [RDKit MolStandardize](https://www.rdkit.org/docs/source/rdkit.Chem.MolStandardize.rdMolStandardize.html) · [MolVS documentation](https://molvs.readthedocs.io/) — the standardisation steps and what each one does
- [Daylight SMARTS theory manual](https://www.daylight.com/dayhtml/doc/theory/theory.smarts.html) — the pattern language, including recursive SMARTS
- [Landrum, RDKit blog](https://greglandrum.github.io/rdkit-blog/) — the tautomer and fingerprint-generator posts explain the choices behind the defaults
