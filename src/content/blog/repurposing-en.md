---
title: "Drug repurposing"
date: 2025-09-19
description: "Finding new indications for existing drugs · three approaches and the knowledge-graph one · recasting it as link prediction · the problem that there are no negatives · why benchmarks do not compare"
category: concept
updated: 2025-10
lang: en
group: repurposing
topic: Graphs
tags: [drug repurposing, knowledge graph, link prediction]
---

## Why bother

Bringing a new drug to market takes over a decade and costs billions. An **already-approved drug comes with its safety record written.** If it turns out to work on a second disease, much of phase I can be skipped or shortened.

The famous cases are sildenafil, developed for angina and redirected, and thalidomide, which returned from disgrace as a treatment for multiple myeloma. Both were found **by accident.** The point of the field is to do it **systematically**.

## Three approaches

| approach | data it uses | the question it asks |
| --- | --- | --- |
| **structure-based** | molecular and protein structures | will this drug bind that target |
| **signature-based** | transcriptomes (LINCS and similar) | does this drug's expression signature **reverse** the disease's |
| **knowledge-graph-based** | a network of drugs, genes, diseases | is there a missing link between this drug and that disease |

The signature logic is simple: if a disease raises gene A and lowers B, look for a drug that lowers A and raises B. That is what a connectivity score measures.

The third is the most active now, and the one I worked on in the [platform project](../../projects/repurposing/).

## Recasting it as a graph problem

Put biomedical knowledge in one graph. Nodes are drugs, proteins, genes, diseases and side effects; edges are the relationships already known.

```
drug ──inhibits──▶ protein ──associated──▶ disease
  └──indicated_for──────────────────────────▶ disease
```

<figure>
<img src="/assets/fig/knowledge-graph.svg" alt="A biomedical knowledge graph with one missing drug-disease edge" loading="lazy" />
<figcaption><b>Repurposing, as a graph problem.</b> Drugs, proteins and diseases are nodes; known relations are typed edges. Metformin already has an <code>indicated_for</code> edge to type 2 diabetes. The dashed edge is the question &mdash; should one exist to polycystic ovary syndrome (PCOS)? &mdash; and the evidence for it is the path through PRKAB1, not any property of the drug alone.</figcaption>
</figure>

Repurposing then becomes **link prediction**: *should there be an `indicated_for` edge between this drug and that disease?*

[PrimeKG](https://doi.org/10.1038/s41597-023-01960-3) is the standard public graph — twenty resources merged into roughly 130,000 nodes and 4 million edges, covering some 17,000 diseases.

The models are [GNNs](../gnn-en/) (graph neural networks), but the setting differs from molecules in every dimension:

| | molecular graph | knowledge graph |
| --- | --- | --- |
| size | millions of small graphs | one large graph |
| what is predicted | the whole graph | an **edge** |
| node types | one (atoms) | drugs, proteins, diseases… (heterogeneous) |
| edge types | bond order | dozens of relations |

Several node and edge types mean you need an architecture built for **heterogeneous graphs** — R-GCN (relational graph convolutional network), or a separate message function per relation.

## The underlying problem: no negatives

A knowledge graph contains **no edge saying "this drug does not treat this disease."** It holds known positives only. So training invents negatives: pair a drug and a disease at random and call it negative.

The trouble is that such a pair may not be a true negative but **a pair nobody has tested yet** — which is exactly the kind of pair we are trying to find. In other words, **the training signal may be labelling the answer as negative.**

<mark class="blue">As a result, a reported ROC-AUC (area under the receiver operating characteristic curve) of 0.95 measures something closer to "can separate known positives from random pairs" than "can propose a new indication".</mark>

## Evaluation designs that do not inflate

- **Temporal split.** Train on everything known before a cut-off year, and test on indications approved after it. The closest thing to reality.
- **Disease-level split.** Hold out whole diseases, so the model predicts for a disease it knows nothing about.
- **State how negatives were made.** Random pairs, chemically distant pairs, and recorded clinical failures are three completely different difficulties.
- **Look at the top K by hand.** Only a few dozen candidates will ever be tested, so precision at the top matters more than overall ROC-AUC.

> Negative sampling and split design are the main reasons benchmarks in this field do not compare. Two papers can use the same PrimeKG and report numbers that mean different things, which is why the project had to start by building **one standardised environment** and running five models inside it.

## Summary

- Approved drugs come with safety data, which makes repurposing faster and cheaper
- Structure-based, signature-based and knowledge-graph-based; the last is the most active
- In a knowledge graph, repurposing is **link prediction**
- Several node and edge types call for a heterogeneous architecture
- **The absence of negatives is the core problem** — random negatives can be the very answers you want
- Temporal splits, disease-level splits and top-K inspection are the designs that do not inflate the score

## References

- Chandak, Huang & Zitnik, [Building a knowledge graph to enable precision medicine](https://doi.org/10.1038/s41597-023-01960-3), *Sci. Data* (2023) — PrimeKG
- Huang et al., [A foundation model for clinician-centered drug repurposing](https://doi.org/10.1038/s41591-024-03233-x), *Nat. Med.* (2024) — TxGNN
- Pushpakom et al., [Drug repurposing: progress, challenges and recommendations](https://doi.org/10.1038/nrd.2018.168), *Nat. Rev. Drug Discov.* (2019)
