---
title: "Python libraries worth knowing"
date: 2026-05-15
description: "The core stack, grouped by job · RDKit, PyTorch Geometric and DeepChem for molecules · Scanpy and PyDESeq2 for omics · what Polars and uv replace · the small utilities that pay for themselves in a day"
category: tutorial
updated: 2026-06
lang: en
group: py-libs
topic: Python
tags: [RDKit, PyTorch Geometric, Scanpy, tooling]
---

A per-library reference — what is inside each package, including the plotting ones — is on the [libraries page](../libraries/).

<mark>A list of libraries is only useful if it says **what each one replaces**.</mark> The grouping below is by job rather than by popularity.

## The basics

| Library | For | Note |
| --- | --- | --- |
| NumPy | arrays, linear algebra | everything else is built on it |
| pandas | tabular data | the default; slow above ~10 GB |
| Polars | tabular data | Rust, multi-threaded, lazy; worth it on large files |
| SciPy | statistics, sparse matrices, optimisation | `scipy.sparse` is what single-cell data lives in |
| scikit-learn | classical machine learning, splits, metrics | the baseline you must beat |

`scikit-learn` deserves a note. It is not just a model collection — `train_test_split`, `Pipeline`, `cross_val_score` and the metrics module are the correctness scaffolding around whatever model you actually use.

```python
from sklearn.datasets import load_diabetes
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import cross_val_score

X, y = load_diabetes(return_X_y=True)
s = cross_val_score(RandomForestRegressor(random_state=0), X, y, cv=5, scoring="r2")
print("R2 per fold:", [round(float(v), 3) for v in s])
print("mean %.3f +/- %.3f" % (s.mean(), s.std()))
```

```
R2 per fold: [0.378, 0.511, 0.433, 0.353, 0.441]
mean 0.423 +/- 0.055
```

Five folds, one line, and a standard deviation that tells you whether a 0.01 improvement means anything. <mark class="blue">Most reported gains do not survive this.</mark>

## Molecules

**RDKit** is the whole field. Parsing, [descriptors and fingerprints](../descriptors-fingerprints-en/), substructure search, scaffolds, depiction, conformers.

```python
from rdkit import Chem
from rdkit.Chem import Descriptors, rdFingerprintGenerator

m = Chem.MolFromSmiles("CC(=O)Oc1ccccc1C(=O)O")      # aspirin
print("formula :", Chem.rdMolDescriptors.CalcMolFormula(m))
print("MW      :", round(Descriptors.MolWt(m), 2))
print("logP    :", round(Descriptors.MolLogP(m), 2))
print("TPSA    :", round(Descriptors.TPSA(m), 2))
print("HBD/HBA :", Descriptors.NumHDonors(m), "/", Descriptors.NumHAcceptors(m))

gen = rdFingerprintGenerator.GetMorganGenerator(radius=2, fpSize=2048)
fp = gen.GetFingerprint(m)
print("ECFP4   :", fp.GetNumBits(), "bits,", fp.GetNumOnBits(), "on")
```

```
formula : C9H8O4
MW      : 180.16
logP    : 1.31
TPSA    : 63.6
HBD/HBA : 1 / 3
ECFP4   : 2048 bits, 24 on
```

Two things to carry away from that output. `MolFromSmiles` returns `None` on an invalid SMILES (simplified molecular-input line-entry system) string rather than raising — check it, or a silent `None` propagates through the whole pipeline. And an ECFP4 (extended-connectivity fingerprint) of a small molecule sets **24 of 2048 bits**: these vectors are extremely sparse, which is why Tanimoto rather than Euclidean distance is used on them.

| Library | For |
| --- | --- |
| RDKit | everything cheminformatics |
| PyTorch Geometric (PyG) | graph neural networks |
| DGL | graph neural networks, alternative API |
| DeepChem | datasets + splitters + baseline models |
| Chemprop | directed message passing on bonds, a strong property-prediction baseline |
| TorchDrug | datasets and models for molecules and knowledge graphs |
| MolVS / RDKit standardiser | structure normalisation before anything else |
| datamol | a thin, friendlier wrapper over RDKit |

**DeepChem** is worth installing for the splitters alone — scaffold splits, and the MoleculeNet loaders, implemented the way the papers did it. <mark>Reimplementing a scaffold split yourself is how benchmark numbers quietly stop being comparable.</mark>

## Graphs and deep learning

PyTorch for the models, PyTorch Geometric for graph layers and batching.

```python
import torch
from torch_geometric.data import Data

ei = torch.tensor([[0, 1, 1, 2], [1, 0, 2, 1]])   # 2 x num_edges
x  = torch.randn(3, 8)                             # 3 nodes, 8 features
d  = Data(x=x, edge_index=ei)
print(d)
print("nodes", d.num_nodes, "| edges", d.num_edges, "| undirected", d.is_undirected())
```

```
Data(x=[3, 8], edge_index=[2, 4])
nodes 3 | edges 4 | undirected True
```

`edge_index` is `[2, num_edges]`, and an undirected edge is stored **twice**, once in each direction. PyG's `Batch` then stacks many small graphs into one disconnected graph rather than padding them — which is the reason molecular graphs batch efficiently at all.

| Library | For |
| --- | --- |
| PyTorch | models and training |
| PyG / DGL | [graph layers](../gnn-en/), batching, pooling |
| Lightning | removes training-loop boilerplate |
| Hugging Face Transformers | pretrained SMILES and protein language models |
| Optuna | [hyperparameter search](../hyperparameter-search-en/), with bad trials stopped early |
| Weights & Biases / TensorBoard | run tracking |
| Hydra / OmegaConf | config files instead of 40 argparse flags |

A caution on Lightning: it is a real time-saver on standard supervised training and a liability when the training loop is the research. For anything with a custom loss schedule or multi-stage pretraining, plain PyTorch is easier to debug.

## Omics

| Library | For | R counterpart |
| --- | --- | --- |
| Scanpy | single-cell analysis | Seurat |
| AnnData | the single-cell data container | `SingleCellExperiment` |
| PyDESeq2 | [differential expression](../de-tools-en/) | DESeq2 |
| scVI-tools | deep generative models, batch integration | — |
| gseapy | enrichment — GSEA (gene set enrichment analysis), Enrichr | clusterProfiler |
| muon | multi-modal — RNA, ATAC (assay for transposase-accessible chromatin), protein | Seurat v5 |
| pertpy | perturbation analysis | — |

The conclusion from the [R vs Python](../r-vs-python-en/) note still holds: statistics and annotation resources are deeper in R, everything that has to join up with a model is easier in Python.

## The small libraries

These are the ones that pay for themselves within a day.

| Library | What it replaces |
| --- | --- |
| tqdm | printing a counter and guessing how long is left |
| joblib | a hand-rolled `multiprocessing.Pool`, plus disk caching |
| rich | `print` debugging, and manual table formatting |
| typer | `argparse` boilerplate for a CLI (command-line interface) |
| pathlib (stdlib) | `os.path.join` chains |
| ruff | flake8 + isort + black, in one fast tool |
| pytest | `assert` scripts you run by hand |
| pyarrow / Parquet | CSV for anything you write more than once |

Two of these change habits rather than code. **Parquet instead of CSV** for intermediate files: typed, compressed, and roughly an order of magnitude faster to read, which matters because intermediate files get read many times. ruff replaces three tools with one and is fast enough to run on save.

## Picking between near-duplicates

| Choice | Take | Because |
| --- | --- | --- |
| pandas vs Polars | pandas, Polars when it hurts | ecosystem; switch when files get large |
| PyG vs DGL | PyG | more molecular machine-learning code targets it |
| matplotlib vs plotnine | matplotlib + seaborn | control when the figure is final |
| argparse vs typer vs Hydra | typer for a CLI, Hydra for experiments | different jobs |
| pip vs conda vs uv | see [environments](../conda-environments-en/) | depends on native dependencies |

## Summary

- NumPy / pandas / SciPy / scikit-learn are the floor — and `cross_val_score` plus a standard deviation kills most imaginary improvements
- **RDKit** is all of cheminformatics; check for `None` after parsing, and remember fingerprints are very sparse
- **PyG** for graphs; `edge_index` is `[2, E]` and undirected edges appear twice
- **DeepChem** for splitters and MoleculeNet loaders, so benchmark numbers stay comparable
- **Scanpy / AnnData / PyDESeq2** cover the omics side; R still wins on statistics and annotation
- tqdm, joblib, rich, typer, ruff, pytest, Parquet — small, and they pay back immediately

## References

- [RDKit documentation](https://www.rdkit.org/docs/) · [RDKit cookbook](https://www.rdkit.org/docs/Cookbook.html)
- [PyTorch Geometric](https://pytorch-geometric.readthedocs.io/) · [DeepChem](https://deepchem.readthedocs.io/)
- [Scanpy](https://scanpy.readthedocs.io/) · [AnnData](https://anndata.readthedocs.io/) · [PyDESeq2](https://pydeseq2.readthedocs.io/)
- [scikit-learn user guide](https://scikit-learn.org/stable/user_guide.html) · [Polars](https://docs.pola.rs/) · [ruff](https://docs.astral.sh/ruff/)
