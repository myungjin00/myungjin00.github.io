---
title: "Graph AI in medicine: what a graph buys you in the clinic"
date: 2024-02-14
description: "Why clinical data resists a grid and fits a graph · the model families and what each is for · injecting biology as an inductive bias · three places to fuse modalities · and the problems the field has not solved"
category: review
updated: 2024-03
lang: en
topic: Graphs
venue: Annual Review of Biomedical Data Science
venueYear: 2024
group: graph-ai-medicine
tags: [review, graph neural networks, knowledge graph, multimodal, clinical]
---

> Johnson, Ruth, et al. "Graph Artificial Intelligence in Medicine." *Annual Review of Biomedical Data Science*, vol. 7, no. 1, 2024, pp. 345–368, [doi.org/10.1146/annurev-biodatasci-110723-024625](https://doi.org/10.1146/annurev-biodatasci-110723-024625).
> [PMC11344018](https://pmc.ncbi.nlm.nih.gov/articles/PMC11344018/)

The review starts one step before architecture: the argument for *why* a graph at all for clinical data.

## Why clinical data resists a grid

An electronic health record is a mixture of structured fields, semi-structured notes and unstructured free text, with missing values at rates that are themselves informative. Images, text, video and lab values arrive on different clocks and at different granularities.

A grid assumes every sample has the same shape. Clinical data does not, and forcing it into one is where most of the information goes. A graph makes no such assumption: nodes can be of different types, edges can be of different types, and a patient with three visits and a patient with forty are both representable without padding either.

The second argument is about knowledge. The relationships in biomedicine are **already known** — genes sit in pathways, drugs hit targets, diseases have hierarchies. A grid cannot encode that. <mark class="blue">A graph is the structure in which prior knowledge can be stated.</mark>

## The model families

Once the data is a graph, the question becomes which graph model to run on it, and the review answers it from the shape of the data rather than from which model is newest.

<figure>
<img src="/assets/fig/graphai-f1.jpg" alt="Message passing, graph transformers, temporal graphs, hypergraphs and subgraph GNNs" width="1050" height="558">
<figcaption><b>Figure 1.</b> Variants of graph neural networks, and the data shape each is for: <b>(a)</b> message passing, <b>(b)</b> the graph transformer, <b>(c)</b> temporal graphs, <b>(d, e)</b> hypergraphs and subgraph models.
<br><span class="credit">Johnson et al., <a href="https://doi.org/10.1146/annurev-biodatasci-110723-024625"><i>Annu. Rev. Biomed. Data Sci.</i> <b>7</b>, 345&ndash;368 (2024)</a> &#183; paper figure, Figure 1</span></figcaption>
</figure>

| Family | What it adds | The clinical shape it fits |
| --- | --- | --- |
| MPNN (message passing neural network) | neighbours aggregate, layer by layer | the default graph neural network (GNN) — see [GNNs](../gnn-en/) |
| GAT (graph attention network) | [attention](../attention-en/) decides which edges carry information | when edges differ in importance |
| Graph transformer | global attention, no message passing | more expressive; needs the structure encoded some other way |
| Temporal GNN | node and edge representations per time step | a patient's trajectory — emergency-department visits |
| Hypergraph | one edge joins *n* nodes at once | a prescription linking a drug, a dose and a diagnosis |
| Subgraph GNN | learns over a region rather than a node | disease classification from a patient's neighbourhood |

The hypergraph row is one to read twice. An ordinary edge is a pair, and a great deal of clinical structure is not a pair — a visit involves a patient, a clinician, a diagnosis and a set of orders simultaneously, and splitting it into pairs loses the fact that they co-occurred.

The review also separates **shallow from deep embeddings**. Shallow methods optimise a lookup table against a fixed notion of distance and cannot embed a node unseen during training; a GNN computes the embedding from features and neighbours, so a patient admitted tomorrow gets one.

## Putting biology into the architecture

Saying a graph *can* hold prior knowledge is not the same as putting it there. The review gives three routes for putting it there, and what they buy is a model whose internals refer to things a biologist can name.

<figure>
<img src="/assets/fig/graphai-f2.jpg" alt="Biologically informed architectures, patient graphs on knowledge graphs, and fine-tuning pretrained models" width="965" height="1050">
<figcaption><b>Figure 2.</b> Three ways prior knowledge enters: architectures whose layers <em>are</em> the biology (P-NET, BINN), patient data attached to a biomedical knowledge graph, and fine-tuning a large pre-trained model for a clinical task.
<br><span class="credit">Johnson et al., <a href="https://doi.org/10.1146/annurev-biodatasci-110723-024625"><i>Annu. Rev. Biomed. Data Sci.</i> <b>7</b>, 345&ndash;368 (2024)</a> &#183; paper figure, Figure 2</span></figcaption>
</figure>

In **P-NET** and **BINN** the hidden layers are not arbitrary — an input layer of proteins, hidden layers that *are* pathways, an output layer of biological processes. The weights are then readable: a large weight on a pathway node is a statement about that pathway, not about neuron 412.

The second route is to attach patients to an existing knowledge graph, and the review distinguishes three ways of doing it, which are easy to conflate:

1. **Alter the base graph** — add a node per patient and connect it in.
2. **Extract a patient subgraph** — pull the relevant region out of the base graph.
3. **Build a personalised graph per patient** — processed independently of the base graph.

These differ in what can be shared. In (1) patients influence each other's representations; in (3) they cannot. Which is wanted depends on whether you believe similar patients should inform each other — and on what the privacy constraints allow.

## Where to fuse the modalities

A patient arrives as images, notes and lab values at once, so the modalities have to be combined somewhere — and where you do it decides what the model can learn and what it can survive without. The review names the three options plainly, and the naming is the useful part:

| | Where | Trade |
| --- | --- | --- |
| Early | combine inputs before the model | domain knowledge can shape the combination; interactions between modalities are not learned |
| Intermediate | per-modality encoders, combined inside the model | interactions are learned; needs every modality present |
| Late | train separately, combine the outputs | robust to a missing modality; the modalities never meet |

<mark>The choice is usually made by what the data allows, not by what would work best.</mark> Late fusion wins by default in clinical settings because patients are missing modalities, not because it is the better model.

## Explainability: the two things the survey separates

A clinical prediction nobody can justify does not get acted on, so explanation is part of the deliverable rather than an extra. The review's contribution is to point out that the word covers two different jobs.

<figure>
<img src="/assets/fig/graphai-f4.jpg" alt="Mathematical versus user-centred explainability and the stakeholders each serves" width="1050" height="459">
<figcaption><b>Figure 4.</b> Two different things both called explanation: a <b>mathematical</b> account of what the model did, and a <b>user-centred</b> one aimed at whoever has to act on it. The stakeholders differ, and so does what counts as a good answer.
<br><span class="credit">Johnson et al., <a href="https://doi.org/10.1146/annurev-biodatasci-110723-024625"><i>Annu. Rev. Biomed. Data Sci.</i> <b>7</b>, 345&ndash;368 (2024)</a> &#183; paper figure, Figure 4</span></figcaption>
</figure>

A subgraph that maximises some attribution score answers the mathematical question. Whether a clinician can act on it is a different question with a different success criterion, and the review states the two separately rather than treating explanation as one thing.

## The problems it does not solve

The closing section is a list of open problems, and all five are still open:

- **Multimodal integration** — graphs can hold anything, which is not the same as representing it well.
- **Irregular collection and missingness** — clinical data is missing non-randomly, and the pattern of missingness carries signal the model usually ignores.
- **Modality collapse** — a model leaning on the single most predictive modality and ignoring the rest, which looks like success on the metric.
- **Scale** — biomedical graphs are large and high-dimensional.
- **Trust** — the review's position is that an unfaithful explanation is worse than none, because it is acted upon.

## Why I read it

Separating mathematical from user-centred explanation is the part I keep coming back to, and it transfers directly to molecular work: "these atoms had the highest attention" is a mathematical explanation, while "this substructure is why the molecule is toxic" is the claim a chemist needs, and the gap between them is exactly what [attention weights do not cross on their own](../attention-en/). This is also the paper that makes my two tracks look like one subject rather than two. A molecule is a graph of atoms, a patient is a graph of events on a knowledge graph, and the machinery — message passing, attention over edges, heterogeneous node types, where to fuse — is the same machinery. The [knowledge-graph repurposing](../repurposing-en/) work and the molecular work share more than they appear to.

It is a survey, so it has no result to check. What it has is vocabulary, and having the vocabulary straight is what lets you notice that a problem you are stuck on has a name somewhere else.

## Summary

- Clinical data resists a grid because samples differ in shape; a graph needs no such assumption and can state prior knowledge
- Model families map to data shapes: MPNN, GAT, graph transformer, temporal, hypergraph, subgraph
- **Hypergraphs** exist because much of clinical structure is *n*-ary, not pairwise
- Shallow embeddings cannot handle a patient admitted tomorrow; a GNN can
- Biology enters as architecture (P-NET, BINN) or by attaching patients to a knowledge graph in one of three ways, which differ in what is shared between patients
- Fusion is early / intermediate / late, and the choice is usually forced by missing data
- **Mathematical and user-centred explanation are different things**, and conflating them is how an unfaithful explanation gets acted on

## References

- Johnson, Li, Noori, Queen & Zitnik, [Graph artificial intelligence in medicine](https://doi.org/10.1146/annurev-biodatasci-110723-024625), *Annu. Rev. Biomed. Data Sci.* **7** (2024) — the paper reviewed here
- Elmarakeby et al., [Biologically informed deep neural network for prostate cancer discovery](https://doi.org/10.1038/s41586-021-03922-4), *Nature* (2021) — P-NET
- Chandak, Huang & Zitnik, [Building a knowledge graph to enable precision medicine](https://doi.org/10.1038/s41597-023-01960-3), *Sci. Data* (2023) — PrimeKG
