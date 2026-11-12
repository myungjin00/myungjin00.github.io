---
title: "Pretrained encoders from HuggingFace: loading, pooling and the traps"
date: 2026-11-12
description: "Which Auto class actually gives you a representation · CLS or mean pooling, measured · the tokeniser a checkpoint ships is not always the one it was trained with · what an in-domain vocabulary buys · and why a masked-language checkpoint is not a sentence embedder"
category: tutorial
updated: 2026-11
lang: en
group: huggingface-practice
topic: Machine learning
subtopic: Representation
tags: [HuggingFace, transformers, embeddings, tokenisation]
---

Three lines load a pretrained model, and that is the problem: nothing stops you from loading it wrongly and getting vectors that look fine. Every number on this page was measured with `transformers` 4.44.0 and `torch` 2.8.0 on 12 November 2026, and the checks at the end are the ones that would have caught each mistake.

## Three lines, and where the files land

```python
import os
os.environ["HF_HOME"] = "/scratch/hf_cache"   # set before importing transformers

from transformers import AutoTokenizer, AutoModel

name = "microsoft/BiomedNLP-BiomedBERT-base-uncased-abstract-fulltext"
tok = AutoTokenizer.from_pretrained(name)
mod = AutoModel.from_pretrained(name).eval()
```

`HF_HOME` has to be set **before** the import, or the cache goes to your home directory and fills it. A base-size encoder is around 440 MB; a handful of them is a few gigabytes.

Two environment variables worth knowing: `HF_HUB_OFFLINE=1` forbids any network call, which is how you find out whether a job actually has everything cached before it runs on a node without internet, and `HF_HUB_DISABLE_PROGRESS_BARS=1` keeps log files readable.

## Which Auto class

This is the first real decision, because the class decides what comes out.

| class | returns | use it when |
| --- | --- | --- |
| `AutoModel` | hidden states, no head | you want an **embedding** |
| `AutoModelForMaskedLM` | logits over the vocabulary | you want to fill in a masked position |
| `AutoModelForSequenceClassification` | logits over your labels | you are fine-tuning for a task |
| `AutoModelForCausalLM` | next-token logits | the model is a generator |

`AutoModelForSequenceClassification` attaches a **freshly initialised head**, and transformers says so, naming `classifier.dense` and `classifier.out_proj`. That message is routine for a head you are about to train.

A near-identical warning appears when you load a RoBERTa checkpoint with plain `AutoModel`, and there it means something else:

```
Some weights of RobertaModel were not initialized from the model checkpoint at ... and are
newly initialized: ['roberta.pooler.dense.bias', 'roberta.pooler.dense.weight']
You should probably TRAIN this model on a down-stream task ...
```

That one is about the pooler, which is a reason not to use `pooler_output`. Read which parameters it names before deciding whether the warning matters.

## Pooling: the CLS token or the mean

`last_hidden_state` is one vector per token. Collapsing it to one vector per input is your choice, and the two usual choices do not agree.

```python
import torch

def embed(texts, tok, mod):
    enc = tok(texts, padding=True, truncation=True, max_length=128, return_tensors="pt")
    with torch.no_grad():
        h = mod(**enc).last_hidden_state             # (batch, tokens, dim)
    m = enc["attention_mask"].unsqueeze(-1)                 # do not average over padding
    mean = (h * m).sum(1) / m.sum(1)
    cls  = h[:, 0]
    return mean, cls
```

The `attention_mask` term is the part people drop. Without it you average padding into the vector, and the result then depends on the longest string in the batch — the same input gives a different embedding in a different batch.

Measured on `seyonec/ChemBERTa-zinc-base-v1` with three inputs: **A** and **A′** are two valid SMILES (simplified molecular-input line-entry system) strings for the *same* molecule, 4-chloronitrobenzene, and **B** is aspirin.

| cosine | mean pooling | CLS |
| --- | --- | --- |
| A ~ A′ (same molecule) | 0.783 | 0.747 |
| A ~ B | 0.451 | 0.545 |
| A′ ~ B | 0.332 | 0.498 |

Two readings. The useful one: mean pooling separates the identical pair from the unrelated one more cleanly, which is the usual finding for a checkpoint trained with masked-language modelling. <mark>The CLS position was never trained to summarise anything unless the model was trained with a sentence-level objective.</mark>

The uncomfortable one: two spellings of one molecule sit at 0.78, not at 1.0. Read that carefully — this checkpoint's card says it was pretrained on 100,000 ZINC molecules, so the number says nothing about large models. What it does say is that the invariance is **learned rather than guaranteed**, so it is a property you have to measure on whichever checkpoint you picked. A graph gets it [by construction](../graph-data-en/), and that is [the standing limit of the string view](../chemical-language-models-en/).

## Check that the tokeniser round-trips

This is the check that matters most and almost nobody runs.

`DeepChem/ChemBERTa-77M-MLM` is a popular checkpoint — about 188,000 downloads in the last month. Its published `vocab.json` is an atom-level vocabulary of 591 entries, 558 of them multi-character: `Cl` is token 28, `Br` is 37, `[N+]` is 41, `[C@H]` is 33. But the repository also ships a byte-level BPE (byte-pair encoding) `tokenizer.json`, and that is what `AutoTokenizer` picks. Its merge list is **empty** — `merges.txt` is a header and nothing else — so no merge can ever rebuild `Cl` from `C` and `l`, and `l` is not in its alphabet either:

```python
tok = AutoTokenizer.from_pretrained("DeepChem/ChemBERTa-77M-MLM")

tok.tokenize("Clc1ccc(cc1)[N+](=O)[O-]")
# ['C', 'c', '1', 'c', 'c', 'c', '(', 'c', 'c', '1', ')', 'N', '(', '=', 'O', ')', 'O', '-']

tok.decode(tok("Clc1ccc(cc1)[N+](=O)[O-]")["input_ids"], skip_special_tokens=True)
# 'Cc1ccc(cc1)N(=O)O-'            <- not the molecule that went in

tok.tokenize("Cl"), tok.tokenize("Br"), tok.tokenize("[C@H]")
# (['C'],            ['B'],            ['C'])
```

The characters `l`, `r`, `+`, `H`, `[`, `]` and `@` are not in that tokeniser's alphabet and are **dropped silently** — no unknown token is emitted, `unk_count` is zero. Chlorine arrives as carbon, bromine as boron, and stereochemistry disappears. Feeding the mangled string `Cc1ccc(cc1)N(=O)O-` through the same path gives cosine **1.0000** against the original, which is the proof that the model receives the mangled molecule and cannot tell the difference.

The vocabulary is fine; the mismatch is between files. `tokenizer_config.json` in that repository still names a different tokeniser than the vocabulary it sits beside. Splitting with an atom-level regular expression gives tokens that are all present in the published `vocab.json`:

```python
import re, json
PAT = r"(\[[^\]]+]|Br?|Cl?|N|O|S|P|F|I|b|c|n|o|s|p|\(|\)|\.|=|#|-|\+|\\|/|:|~|@|\?|>|\*|\$|%[0-9]{2}|[0-9])"

re.findall(PAT, "BrC[C@H](O)c1ccccc1")
# ['Br', 'C', '[C@H]', '(', 'O', ')', 'c', '1', 'c', 'c', 'c', 'c', 'c', '1']   all in vocab.json
```

`seyonec/ChemBERTa-zinc-base-v1`, by contrast, round-trips the string exactly. Its BPE units are chemically arbitrary — `['Clc', '1', 'ccc', '(', 'cc', '1', ')[', 'N', '+](=', 'O', ')[', 'O', '-]']`, where `)[` and `+](=` are units — but nothing is lost.

<mark class="blue">So the one check to run on any new checkpoint: tokenise an input, decode it back, and compare with what you put in.</mark>

```python
for s in ["Clc1ccc(cc1)[N+](=O)[O-]", "BrC[C@H](O)c1ccccc1"]:
    back = tok.decode(tok(s)["input_ids"], skip_special_tokens=True).replace(" ", "")
    assert back == s, f"{s} -> {back}"
```

Three lines, and it would have caught this.

## A checkpoint that brings its own code

Not every checkpoint is a stock architecture. `ibm-research/MoLFormer-XL-both-10pct` ships `modeling_molformer.py` and declares an `auto_map` in its `config.json`, so loading it needs `trust_remote_code=True` — which runs the repository's Python inside your process. That is a decision to take deliberately, not a flag to copy off a card.

Three things in its published files change results. These come from reading that `config.json` and model card; unlike everything else on this page, I did not run this model.

- **`deterministic_eval` ships as `false`.** The architecture uses linear attention with `num_random_features: 32`, so the feature map is random, and the card's own example passes `deterministic_eval=True`. Left at the default, there is nothing guaranteeing that one SMILES string gives one vector twice.
- **`max_position_embeddings` is 202.** Molecules longer than 202 tokens were dropped during pretraining, and the card says the model is untested past roughly 200 atoms.
- **Canonicalise first.** The card states training SMILES were canonicalised with RDKit with isomeric information removed, and that noncanonical input may perform worse — so `Chem.MolToSmiles(Chem.MolFromSmiles(s), isomericSmiles=False)` before tokenising. Note what that means: this model discards stereochemistry by design, where the other one lost it by accident.

The card also pins compatibility: with `transformers` v4 you need `revision="compat-v4"`.

## An in-domain vocabulary is most of what a domain model is

The same check read the other way explains why domain-specific pretraining works at all. Tokenising two ordinary biomedical words:

| checkpoint | `cyclooxygenase` | `thrombocytopenia` |
| --- | --- | --- |
| `microsoft/BiomedNLP-BiomedBERT-base-uncased-abstract-fulltext` | 1 piece | 1 piece |
| `dmis-lab/biobert-base-cased-v1.2` | 8 pieces | 6 pieces |
| `bert-base-uncased` | 5 pieces | 6 pieces |

BioBERT continued pretraining from general-domain BERT and kept its vocabulary, so a drug class is spelled out in word fragments. PubMedBERT built its vocabulary from PubMed, so the same word is one unit with one embedding to learn. That is the mechanism behind its result rather than a side effect of it, and it is covered in the [note on reading what is written about a drug](../biomedical-text-encoders-en/).

## A masked-language checkpoint is not a sentence embedder

Four sentences: two paraphrases of the same pharmacology (`para1`, `para2`), one clinical note sentence, one about birds. A usable embedding space should put the paraphrases close and the bird far. Mean pooling, cosine:

| checkpoint | paraphrase pair | unrelated pair | spread |
| --- | --- | --- | --- |
| `bert-base-uncased` | 0.854 | 0.444 | 0.410 |
| `dmis-lab/biobert-base-cased-v1.2` | 0.902 | 0.813 | 0.089 |
| `microsoft/BiomedNLP-BiomedBERT-...-abstract-fulltext` | 0.988 | 0.957 | **0.031** |
| `pritamdeka/S-PubMedBert-MS-MARCO` | 0.963 | 0.827 | 0.136 |
| `ncbi/MedCPT-Query-Encoder` | 0.930 | 0.514 | 0.416 |
| `cambridgeltl/SapBERT-from-PubMedBERT-fulltext` | 0.824 | 0.364 | 0.460 |

PubMedBERT scores 0.988 on the paraphrase, which looks excellent until you read the next column: it also scores 0.957 on a sentence about zebra finches. <mark>The whole space is squeezed into a narrow band, so a high cosine means nothing.</mark> It is a strong encoder for fine-tuning and a bad similarity metric straight out of the box.

Every model here that separates the pair from the bird by more than 0.1 had further training with a sentence-level objective — retrieval pairs for MedCPT, question–passage pairs for the MS MARCO variant, synonym pairs from a biomedical vocabulary for SapBERT. If you need cosine similarity, pick one of those; if you are going to fine-tune anyway, the raw encoder is the right starting point. This is the same distinction as [linear probing versus full fine-tuning](../transfer-learning-en/).

## Housekeeping that changes the numbers

- **`.eval()` and `torch.no_grad()`.** Without `eval()` dropout stays on and the same input gives different vectors; without `no_grad()` you keep a graph you never use and run out of memory on long batches.
- **Truncation is silent.** `max_length=128` with no `truncation=True` raises on long inputs in some versions and silently keeps going in others. Set both, and check how many inputs actually hit the limit.
- **Batch, but watch the padding.** Sorting inputs by length before batching cuts padding sharply. With mean pooling over the mask the result is unchanged; without the mask it is not.
- **Device and dtype.** `mod.to("cuda")` and matching `enc.to("cuda")`. `torch.float16` roughly halves memory and moves cosines in the third decimal, which is fine for retrieval and not fine for a reported number.
- **Pin the version.** Tokeniser defaults change between releases — the `clean_up_tokenization_spaces` default changed in 4.45. Record the `transformers` version next to any embedding you keep.

## Reading the model card first

- **What it was trained on**, which decides whether your text is in domain at all.
- **The intended head.** A card that says "fine-tune for your task" is not offering you an embedding model.
- **Licence and gating.** Some weights need an accepted agreement and a token; `huggingface-cli login` once, and never put the token in a script you share.
- **Maximum length.** 512 tokens for the BERT family. A long abstract gets cut, and the cut is invisible.
- **Which tokeniser.** If the card and the files disagree — or the files disagree with each other, as above — trust the round-trip.

## Summary

- Set `HF_HOME` **before** importing transformers, or the cache lands in your home directory
- `AutoModel` for an embedding; the `...For...` classes add a head, and a fresh head is random
- Mean-pool over the `attention_mask`; CLS summarises nothing unless a sentence-level objective trained it
- **Round-trip the tokeniser** on every new checkpoint: `DeepChem/ChemBERTa-77M-MLM` loaded through `AutoTokenizer` turns `Cl` into `C` and `Br` into `B` and drops stereochemistry, with no unknown token to warn you
- A checkpoint with an `auto_map` runs its own code under `trust_remote_code=True`, and MoLFormer additionally wants `deterministic_eval=True` and canonical input
- A domain model's gain is largely its vocabulary: `cyclooxygenase` is 1 piece for PubMedBERT and 8 for BioBERT
- A masked-language checkpoint is not a similarity model — PubMedBERT puts an unrelated sentence at 0.957; MedCPT and SapBERT, trained on pairs, separate properly
- `.eval()`, `no_grad()`, explicit `truncation`, a pinned version, and the version recorded beside the vectors

## References

- [transformers: the Auto classes](https://huggingface.co/docs/transformers/model_doc/auto) — what each `AutoModelFor...` attaches
- [transformers: padding and truncation](https://huggingface.co/docs/transformers/pad_truncation) — the argument combinations and what each one does
- [huggingface_hub: environment variables](https://huggingface.co/docs/huggingface_hub/package_reference/environment_variables) — `HF_HOME`, `HF_HUB_OFFLINE` and the rest
- Reimers & Gurevych, [Sentence-BERT: sentence embeddings using Siamese BERT-networks](https://doi.org/10.18653/v1/D19-1410), *EMNLP-IJCNLP* (2019) — why a sentence-level objective is needed before cosine means anything
