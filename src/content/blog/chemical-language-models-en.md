---
title: "Molecules as sentences: what a SMILES language model learns"
date: 2025-05-16
description: "SMILES is a string with a grammar, so every method built for text transfers · tokenisation is the first real decision · what masked-token pretraining actually teaches · the lineage from 18.7 million strings to 1.1 billion · what the string loses that a graph keeps · and why numbers from two papers rarely compare"
category: concept
updated: 2026-11
lang: en
group: chemical-language-models
topic: Cheminformatics
subtopic: Representation
tags: [SMILES, language models, pretraining, molecular property prediction]
---

A molecule can be written down as a string, and once it is a string every method built for text applies to it unchanged. That is the whole idea. The interesting part is what the notation quietly costs, and how little the published comparisons settle.

Prose written *about* a drug — indications, mechanisms, side effects, abstracts — is a different input with a different failure mode, and it has [its own note](../biomedical-text-encoders-en/).

## Why SMILES reads like a language

A SMILES (simplified molecular-input line-entry system) string has a **grammar** — brackets nest, rings open and close in pairs, branches balance — and a **finite vocabulary** of element symbols, bond marks and syntax characters. A valid string parses; an invalid one does not.

So if a molecule is a sentence, tokenise it, mask part of it, predict the missing part, fine-tune on a small labelled set. The transformer implementations, the training loops and the pretrained-model hubs all work as they are, and nobody has to write a graph library.

This is also why these models exist at all. Labelled molecules are scarce and unlabelled structures are not, so the field wanted [pretraining](../transfer-learning-en/), and text is where pretraining was already solved.

## Tokenisation is the first real decision

Not obvious, and it changes what the model can represent.

**Character level** is the naive choice and it is wrong. It splits `Cl` into `C` and `l`, inventing a carbon that is not there and a character that means nothing.

**Atom-level regular expressions** keep two-character element symbols (`Cl`, `Br`) and bracketed atoms (`[N+]`, `[O-]`, `[C@@H]`) together as single units.

**BPE (byte-pair encoding)** learns its units from the corpus by merging frequent pairs, so common fragments end up as one unit — along with chemically meaningless ones. Tokenising 4-chloronitrobenzene with the BPE that `seyonec/ChemBERTa-zinc-base-v1` ships gives `['Clc', '1', 'ccc', '(', 'cc', '1', ')[', 'N', '+](=', 'O', ')[', 'O', '-]']`, in which `)[` and `+](=` are units.

```python
import re
from rdkit import Chem

smi = "Clc1ccc(cc1)[N+](=O)[O-]"              # 4-chloronitrobenzene
Chem.MolToSmiles(Chem.MolFromSmiles(smi))
# 'O=[N+]([O-])c1ccc(Cl)cc1'  — same molecule, different string

list(smi)[:4]
# ['C', 'l', 'c', '1']  — character level has invented a carbon

pattern = r"(\[[^\]]+]|Br?|Cl?|N|O|S|P|F|I|b|c|n|o|s|p|\(|\)|\.|=|#|-|\+|\\|/|:|~|@|\?|>|\*|\$|%[0-9]{2}|[0-9])"
re.findall(pattern, smi)
# ['Cl', 'c', '1', 'c', 'c', 'c', '(', 'c', 'c', '1', ')', '[N+]', '(', '=', 'O', ')', '[O-]']
```

24 characters become 17 units, and the chlorine survives.

Worth saying plainly: **a SMILES token is not a word.** A `c` has no meaning on its own — it is an aromatic carbon only because of what surrounds it. Parentheses carry no content, they delimit a branch. And a ring-closure digit is a **pointer**: the `1` appears twice and its job is to say that those two atoms are bonded. <mark>Nothing in the vocabulary says so, and the model has to learn it from co-occurrence.</mark>

One practical warning, because it is invisible when it happens: the tokeniser a checkpoint serves is not always the one it was trained with. Loading `DeepChem/ChemBERTa-77M-MLM` through `AutoTokenizer` silently drops `l`, `r`, `+`, `H`, `[`, `]` and `@`, so chlorine arrives as carbon and stereochemistry disappears — measured, with the fix, in the [HuggingFace note](../huggingface-practice-en/).

## What the pretraining objective teaches

| objective | direction | what you get out |
| --- | --- | --- |
| masked-token prediction (BERT-style) | bidirectional | a **representation** — the encoder sees both sides of the gap, which is what you want for a property |
| autoregressive next-token (GPT-style) | left to right | a **generator** — it can sample new strings, and its representation is one-sided |
| contrastive | needs **two views** | an embedding space shaped by what counts as the same molecule |

The third is where molecules are awkward. A contrastive objective needs a positive pair, and in images you make one by augmenting twice — but [almost no transformation of a molecule preserves the label](../augmentation-en/), so the pair becomes the assumption you are least sure of.

MLM (masked language modelling) is the default, and it is worth being precise about what it learns. Masking 15% of the units and predicting them back rewards two things: **the syntax of the string**, and **which fragments occur together**. To fill the gap in `c1ccc?cc1` the model needs to know that aromatic rings are written six-membered and that the ring must close. To fill `[N+](=O)[O-]` it needs to know how a nitro group is spelled.

<mark class="blue">So masked-token prediction on SMILES teaches the grammar of the notation and the co-occurrence statistics of fragments. Chemistry is what you hope falls out of that, and it is not the same thing.</mark>

## The lineage

| model | venue | pretraining corpus | what it added | weights |
| --- | --- | --- | --- | --- |
| [SMILES-BERT](https://doi.org/10.1145/3307339.3342186) | ACM-BCB (2019) | 18.7M ZINC strings | the first masked-token pretraining on SMILES | never released |
| [SMILES Transformer](https://arxiv.org/abs/1911.04738) | preprint (2019) | 861,000 from ChEMBL24 | a frozen pretrained fingerprint aimed at small-data settings | none official |
| [ChemBERTa](https://arxiv.org/abs/2010.09885) | NeurIPS workshop (2020) | a curated 77M PubChem set, with pretraining runs up to 10M; the released weights are a separate ZINC-100k run | RoBERTa off the shelf, and the first scaling curve | `seyonec/ChemBERTa-zinc-base-v1` |
| [MolBERT](https://arxiv.org/abs/2011.13230) | NeurIPS workshop (2020) | 1.6M ChEMBL compounds | an ablation of *which* pretext task carries the gain | GitHub only |
| [MoLFormer-XL](https://doi.org/10.1038/s42256-022-00580-7) | *Nat. Mach. Intell.* **4** (2022) | 1.1 billion, PubChem and ZINC | linear attention with rotary embeddings, which is what makes that scale affordable | `ibm-research/MoLFormer-XL-both-10pct` |
| [ChemBERTa-2](https://arxiv.org/abs/2209.01712) | workshop paper (2022) | 5M / 10M / 77M PubChem | multi-task regression on 200 computed properties as the pretext task, which beat masking at the two larger scales | `DeepChem/ChemBERTa-77M-MTR` |
| [SELFormer](https://doi.org/10.1088/2632-2153/acdb30) | *Mach. Learn.: Sci. Technol.* **4** (2023) | 2.1M ChEMBL v30, written as SELFIES | the same recipe on a notation that cannot be syntactically invalid | `HUBioDataLab/SELFormer` |
| [SMI-TED](https://doi.org/10.1038/s42004-025-01585-0) | *Commun. Chem.* **8** (2025) | 91M curated PubChem, about 4B tokens | an encoder–decoder at 289M parameters | `ibm-research/materials.smi-ted` |
| [ChemBERTa-3](https://doi.org/10.1039/d5dd00348b) | *Digital Discovery* **5** (2026) | 1B ZINC20 plus 100M PubChem | one open training and benchmarking protocol for both lineages at once | `DeepChem/ChemBERTa-100M-MLM` |

Two things about that table.

**The names are corpus sizes, not model sizes.** `ChemBERTa-77M-MLM` is a 3.4M-parameter model pretrained on 77 million molecules; `MoLFormer-c3-1.1B` is a 46.8M-parameter model trained on 1.1 billion. Both are routinely cited as though the number were the parameter count.

**Most of the progression is corpus size, and the one paper that looked inside found something awkward.** MolBERT ablated its three pretext tasks and reports that predicting 200 computed physicochemical descriptors made the largest single contribution, that masked-token prediction added little, and that the task of judging whether two strings denote the same molecule actually hurt. ChemBERTa-2 reached the same conclusion from the other side: its multi-task regression on computed properties beat masking on every task at the two larger scales. If a model learns more from descriptors it could have calculated than from the strings themselves, the language framing is doing less than it appears to.

## What the string loses

**One structure, many strings.** The same molecule has many valid SMILES depending on which atom you start from, as the snippet above shows. A graph gets this for free: permute the atom ordering and a GNN (graph neural network) returns the same answer by construction, which is [the argument that forces the architecture](../graph-data-en/). A language model must **learn** that invariance from data, and nothing guarantees it fully does — two spellings of one molecule come back at cosine 0.78 from one published checkpoint, [measured here](../huggingface-practice-en/).

**Adjacency is not proximity.** In `Clc1ccc(cc1)[N+](=O)[O-]` the two carbons joined by the ring-closure `1` sit seven units apart in the string and are bonded in the molecule. A graph states that in the edge list.

**Stereochemistry is punctuation.** `@` and `@@`, `/` and `\`. One character separates two compounds that can differ completely in activity, and it looks like syntax. MoLFormer's model card states that its training SMILES had isomeric information removed.

A 2026 study puts a number on what that costs at prediction time. Rewriting the same molecule in another notation shifted a chemistry language model's solubility predictions by **1.69 log S on average, across 88% of ESOL** — while descriptor models were unaffected, which locates the failure in the string rather than in the task.

Set against [descriptors and fingerprints](../descriptors-fingerprints-en/), the trade is clear: a fingerprint is fixed but states substructure presence directly, while a string is learnable but states almost nothing directly.

The one genuine upside of the many-strings property is augmentation. **SMILES enumeration** — generating several valid strings for one molecule — is [the only label-safe transformation of the four](../augmentation-en/) that note considers, and it is safe precisely because the molecule never changed, only the serialisation.

## Does it beat the graph?

Not cleanly, and the honest answer is that the published tables cannot settle it.

MoLFormer reports beating every baseline on three of the six classification datasets it shares with the graph papers. ChemBERTa's own framing is **competitive with** a directed message-passing network rather than better than it. Those are the claims; the problem is underneath them.

## Why the published numbers do not line up

Four concrete cases, each documented in the papers themselves.

- **One paper, two split types.** MoLFormer's supplementary text states that its classification table uses scaffold splits and its regression table uses random splits. Its ESOL and FreeSolv RMSEs of 0.28 and 0.23 are therefore random-split numbers, and they get quoted beside scaffold-split RMSEs of 0.8–1.0 and 1.5–2.2 from other papers. Most of that gap is the split.
- **The same checkpoint, twenty-four points apart.** GROVER published BBBP ROC-AUC around 0.94. GEM and Uni-Mol re-ran the released checkpoints under a chirality-aware scaffold split and got about 0.70. GEM does not diagnose the gap. It reports that public implementations differ on whether scaffold calculation considers chirality, standardises on the chirality-aware one, and separately reruns GROVER’s random-scaffold protocol. A table placing 0.94 beside 0.70 is comparing two benchmarks.
- **Leaderboard position is not reproducibility.** An end-user audit of the top three models on all 22 TDC (Therapeutics Data Commons) ADMET leaderboards, using only each model's public artifacts, found **only three models** that got through every stage and reproduced their reported numbers, and traced leakage in several of the rest.
- **The dataset name is not the dataset.** ChemBERTa-2 substituted a single task for two multi-task sets — clinical toxicity for ClinTox, the p53 stress-response pathway for Tox21 — so its "ClinTox" and "Tox21" are not the usual averages. The paper says plainly that it could not benchmark against GROVER because the procedures differ.

<mark>Two numbers reported for BBBP in two different papers are usually not measurements of the same thing.</mark> The mechanism behind the first three is the same one that makes [the choice of split](../data-splitting-en/) decisive and [published MPP (molecular property prediction) numbers hard to transfer](../mpp-en/).

## What the independent evaluations find

Studies that fix one protocol and run everything inside it reach a consistent and deflationary answer.

| study | design | finding |
| --- | --- | --- |
| Jiang et al., *J. Cheminform.* **13** (2021) | 4 descriptor models vs 4 graph models, 11 datasets | descriptor models won on average, at lower cost |
| Sun et al., NeurIPS (2022) | graph pretraining across objectives, splits and architectures | self-supervised pretraining alone did not reliably give a statistically significant gain; **hyperparameter choice mattered more** |
| Deng et al., *Nat. Commun.* **14** (2023) | about 62,800 models; fingerprints vs a SMILES language model vs a graph model | representation learning showed limited benefit over a fingerprint with a random forest on most datasets |
| Sultan et al., *J. Chem. Inf. Model.* **64** (2024) | five-year review of SMILES transformers | cross-model comparison in this literature is unreliable because splitting is inconsistent and statistics are weak |

So the defensible position is narrow. **No neutral study I have found crowns either the string or the graph**; both land in the same region, and on a few hundred to a few thousand molecules both struggle to beat [a fingerprint with a random forest](../descriptors-fingerprints-en/). Where the language view is predictably strongest is where its premise holds: a large unlabelled corpus and very few labels.

What the field did with that non-answer is the useful part. Rather than one view replacing the other, recent work runs **both together** — a language view and a graph view in one model, fused during pretraining or at prediction time. [MoleSG](../molesg-en/) is one version of that argument, and the general case is a question about [multimodal representation](../multimodal-en/).

## SMILES or SELFIES

SELFIES was introduced to make every string decode to a valid molecule, which matters when a model is *generating*. For *predicting*, the evidence does not favour it: a controlled comparison across three architectures, two notations and ten bioactivity datasets found SMILES ahead of SELFIES on classification, and the notation mattering less than the architecture. Use SELFIES where validity is the constraint, not as a general upgrade.

## What this means for my own work

The encoder I work on pairs a SMILES view with a [junction tree](../fragmentation-en/) of substructures, which is an instance of exactly the direction above: not one view winning, but two run together.

The open question is the one that applies to every such pair. **The two views have to disagree somewhere, or the pairing is an expensive duplicate.** A SMILES encoder that has learned string statistics and ring-closure bookkeeping may be re-deriving, less precisely, the connectivity the graph already states exactly. If so, the second view buys parameters and training time and nothing else.

I do not think a benchmark number answers that, since a fused model can win for reasons unrelated to fusion. What would answer it is narrower: find the molecules where the two views' predictions diverge, and check whether the divergence is structured or noise.

## Summary

- SMILES has a grammar and a finite vocabulary, so the whole text toolchain transfers for free — that is why these models exist
- **Tokenisation matters**: character level breaks `Cl`, an atom-level regex does not, BPE learns fragments and some meaningless units; and the tokeniser a checkpoint ships may not be the one it was trained with
- Masked-token prediction gives a representation, autoregressive gives a generator, contrastive needs a second view; MLM teaches **syntax and co-occurrence**, not chemistry
- The lineage runs from 18.7 million strings to 1.1 billion, and the model names are **corpus sizes, not parameter counts**
- MolBERT's ablation and ChemBERTa-2's multi-task result both point the same way: computed descriptors as a pretext task beat masking the strings
- The string loses permutation invariance, makes bonded atoms distant, and reduces stereochemistry to punctuation — all of which a graph states directly
- Rewriting one molecule in another notation moves a language model's solubility prediction by **1.69 log S on average**, where descriptor models do not move at all
- **Cross-paper numbers do not compare** in four ways: split type differs inside a single paper, the same checkpoint reads 0.94 or 0.70 depending on the scaffold convention, a dataset name can stand for one task instead of twelve or of two, and a leaderboard position need not be reproducible at all
- Independent evaluations put string and graph in the same region, with a fingerprint baseline still competitive on small sets
- SELFIES earns its place in generation; for property prediction the controlled comparison favours SMILES

## References

- Wang et al., [SMILES-BERT: large scale unsupervised pre-training for molecular property prediction](https://doi.org/10.1145/3307339.3342186), *ACM-BCB* (2019) — the first masked-token pretraining on SMILES
- Honda et al., [SMILES Transformer: pre-trained molecular fingerprint for low data drug discovery](https://arxiv.org/abs/1911.04738) (2019) — a frozen pretrained fingerprint for small-data settings
- Chithrananda et al., [ChemBERTa: large-scale self-supervised pretraining for molecular property prediction](https://arxiv.org/abs/2010.09885) (2020) — the scaling and tokeniser study
- Fabian et al., [Molecular representation learning with language models and domain-relevant auxiliary tasks](https://arxiv.org/abs/2011.13230) (2020) — MolBERT, and the ablation of its three pretext tasks
- Ross et al., [Large-scale chemical language representations capture molecular structure and properties](https://doi.org/10.1038/s42256-022-00580-7), *Nat. Mach. Intell.* **4**, 1256–1264 (2022) — MoLFormer, linear attention at 1.1 billion molecules
- Ahmad et al., [ChemBERTa-2: towards chemical foundation models](https://arxiv.org/abs/2209.01712) (2022) — multi-task regression beating masking at equal scale
- Yüksel et al., [SELFormer: molecular representation learning via SELFIES language models](https://doi.org/10.1088/2632-2153/acdb30), *Mach. Learn.: Sci. Technol.* **4**, 025035 (2023)
- Soares et al., [An open-source family of large encoder-decoder foundation models for chemistry](https://doi.org/10.1038/s42004-025-01585-0), *Commun. Chem.* **8**, 193 (2025) — SMI-TED
- Singh et al., [ChemBERTa-3: an open source training framework for chemical foundation models](https://doi.org/10.1039/d5dd00348b), *Digital Discovery* **5**, 662–685 (2026)
- Mishra, [Notation matters: cross-representation inconsistency in chemistry language models and its mechanistic origins](https://doi.org/10.1039/d6dd00309e), *Digital Discovery* **5**, 4729–4738 (2026)
- Jiang et al., [Could graph neural networks learn better molecular representation for drug discovery? A comparison study of descriptor-based and graph-based models](https://doi.org/10.1186/s13321-020-00479-8), *J. Cheminform.* **13**, 12 (2021)
- Sun et al., [Does GNN pretraining help molecular representation?](https://arxiv.org/abs/2207.06010) (NeurIPS 2022)
- Deng et al., [A systematic study of key elements underlying molecular property prediction](https://doi.org/10.1038/s41467-023-41948-6), *Nat. Commun.* **14**, 6395 (2023)
- Koleiev et al., [An end-user audit of reproducibility, data leakage and overfitting of the top-ranked ADMET prediction models in TDC leaderboards](https://doi.org/10.1021/acs.jcim.6c00819), *J. Chem. Inf. Model.* **66**, 8045–8058 (2026)
- Sultan et al., [Transformers for molecular property prediction: lessons learned from the past five years](https://doi.org/10.1021/acs.jcim.4c00747), *J. Chem. Inf. Model.* **64**, 6259–6280 (2024)
- Özçelik & Grisoni, [A hitchhiker's guide to deep chemical language processing for bioactivity prediction](https://doi.org/10.1039/d4dd00311j), *Digital Discovery* **4**, 316–325 (2025) — the controlled SMILES versus SELFIES comparison
- Krenn et al., [Self-referencing embedded strings (SELFIES): a 100% robust molecular string representation](https://doi.org/10.1088/2632-2153/aba947), *Mach. Learn.: Sci. Technol.* **1**, 045024 (2020)
