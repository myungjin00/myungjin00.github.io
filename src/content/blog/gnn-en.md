---
title: "Graph neural networks"
date: 2025-03-21
description: "What a molecule looks like as matrices · one layer of message passing · GCN, GraphSAGE, GAT, GATv2 and GIN compared · over-smoothing and the edge-feature trap"
category: concept
updated: 2025-04
lang: en
group: gnn
topic: Graphs
tags: [graph neural networks, molecular ML]
---

## Why a graph

Before a molecule can go into a model, you have to decide what shape it has.

| representation | looks like | what is lost |
| --- | --- | --- |
| SMILES string (simplified molecular-input line-entry system) | `CC(=O)Oc1ccccc1C(=O)O` | connectivity is hidden in character order |
| fingerprint | a bit vector | a person chooses which substructures to count |
| graph | atoms = nodes, bonds = edges | 3D coordinates (for a 2D graph) |

The graph is closest to what a molecule actually is. Written out, $G = (V, E)$: $V$ the atoms, $E$ the bonds, each node $v$ carrying a feature vector $h_v$. However you number those atoms it is the same molecule, so the output must not change either — **permutation invariance**, which a GNN (graph neural network) has built in. Why that requirement is forced, and how a graph is stored and batched, are in [what becomes a graph](../graph-data-en/).

<figure>
<img src="/assets/fig/molecule-as-graph-david2020.jpg" alt="Acetic acid as a graph: adjacency matrix, node feature matrix, edge feature matrix" width="1600" height="408">
<figcaption><b>What a molecule looks like once a model has it.</b> Acetic acid (a) becomes an adjacency matrix <i>A</i> (b), a node feature matrix <i>X</i> (c) and an edge feature matrix <i>E</i> (d). The columns of <i>X</i> one-hot encode atom type, formal charge and implicit hydrogens. This matrix is what "a person decides what goes into a node" refers to later — and a model that ignores <i>E</i> is throwing bond order away.
<br><span class="credit">David et al., <a href="https://doi.org/10.1186/s13321-020-00460-5"><i>J. Cheminform.</i> <b>12</b>, 56 (2020)</a> &#183; paper figure, Figure 2</span></figcaption>
</figure>

## Message passing

<mark class="blue">One GNN layer does a single thing: **every node collects information from its neighbours and updates itself.**</mark>

<figure>
<svg viewBox="0 0 540 200" role="img" aria-label="One round of message passing: a node collects vectors from its neighbours, aggregates them, and updates itself.">
  <g font-family="IBM Plex Mono, monospace" font-size="11" fill="#1E4A39">
    <text x="28" y="26">1. neighbours send</text><text x="212" y="26">2. aggregate</text><text x="372" y="26">3. update</text>
  </g>
  <g stroke="#C2703C" stroke-width="1.3" marker-end="url(#b2)">
    <line x1="52" y1="70" x2="96" y2="100"/><line x1="46" y1="130" x2="94" y2="112"/><line x1="112" y1="160" x2="106" y2="124"/>
  </g>
  <defs><marker id="b2" markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6 z" fill="#C2703C"/></marker></defs>
  <g fill="#F3DCCB" stroke="#C2703C" stroke-width="1.3"><circle cx="44" cy="64" r="9"/><circle cx="38" cy="134" r="9"/><circle cx="116" cy="166" r="9"/></g>
  <circle cx="104" cy="110" r="12" fill="#DCE7DF" stroke="#1E4A39" stroke-width="1.6"/>
  <text x="99" y="114" font-family="IBM Plex Mono, monospace" font-size="10" fill="#1E4A39">v</text>
  <g font-family="IBM Plex Mono, monospace" font-size="10.5" fill="#46524D">
    <text x="212" y="86">Σ  or  mean</text><text x="212" y="104">or  max</text>
    <text x="212" y="136">must not depend</text><text x="212" y="150">on the order</text>
  </g>
  <rect x="200" y="62" width="124" height="60" rx="5" fill="none" stroke="#D3D8CE"/>
  <g stroke="#46524D" stroke-width="1.2" marker-end="url(#b3)"><line x1="330" y1="92" x2="364" y2="92"/></g>
  <defs><marker id="b3" markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6 z" fill="#46524D"/></marker></defs>
  <circle cx="404" cy="92" r="14" fill="#1E4A39"/>
  <text x="398" y="96" font-family="IBM Plex Mono, monospace" font-size="10" fill="#F5F5EF">v'</text>
  <g font-family="IBM Plex Mono, monospace" font-size="10" fill="#6E7873">
    <text x="372" y="134">now carries its</text><text x="372" y="148">neighbourhood</text>
  </g>
</svg>
<figcaption><b>One layer.</b> Neighbours send vectors, an order-independent operation aggregates them, and the node updates. Repeat <i>L</i> times and each node knows its <i>L</i>-hop neighbourhood.</figcaption>
</figure>

A **hop** is one edge. A node's $L$-hop neighbourhood is every node reachable by crossing at most $L$ edges, so one layer reaches one hop and two layers reach two. The number of layers is literally how far a node can see.

As a formula:

$$
h_v^{(l+1)} = \phi\Big(h_v^{(l)},\ \bigoplus_{u \in \mathcal{N}(v)} \psi\big(h_v^{(l)}, h_u^{(l)}, e_{uv}\big)\Big)
$$

- $h_v^{(l)}$ — node $v$'s vector at layer $l$; the layer outputs $h_v^{(l+1)}$
- $\mathcal{N}(v)$ — the neighbours of $v$, the nodes one hop away
- $\psi$ — builds the message a neighbour sends
- $\bigoplus$ — aggregates. It must be **order-independent**: sum, mean, max
- $\phi$ — combines the aggregate with the node's own state

That $\bigoplus$ is what delivers permutation invariance. Concatenating neighbours into a list would make the answer depend on how you numbered the atoms.

## The main variants

Every difference lives in $\bigoplus$ — **how the neighbours get combined.**

| | how it aggregates | what it adds |
| --- | --- | --- |
| **GCN** | degree-normalised sum, $\frac{1}{\sqrt{d_i d_j}}$ | the simplest baseline |
| **GraphSAGE** | samples neighbours, then mean or max, concatenated with self | large graphs, unseen nodes |
| **GAT** | attention-weighted sum | a learned weight per neighbour |
| **GATv2** | $a$ applied after the nonlinearity | fixes GAT's static attention |
| **GIN** | sum + MLP (multilayer perceptron) | the most expressive possible |

### GCN (graph convolutional network)

$$
h_v^{(l+1)} = \sigma\Big(\sum_{u \in \mathcal{N}(v) \cup \{v\}} \frac{1}{\sqrt{d_v d_u}} W h_u^{(l)}\Big)
$$

Neighbours are summed with a degree normalisation, which makes it a weighted mean — so **how many neighbours there were is erased.** It is light and fast and always worth running as a baseline, but on data where valence carries meaning, that loss hurts.

### GraphSAGE (sample and aggregate)

$$
h_v^{(l+1)} = \sigma\Big(W \cdot \big[\, h_v^{(l)} \;\|\; \mathrm{AGG}(\{h_u^{(l)} : u \in \mathcal{S}(v)\}) \,\big]\Big)
$$

Two things are different. It **samples a fixed number of neighbours** ($\mathcal{S}$) instead of using all of them, which is what lets it run on graphs with hundreds of millions of nodes. And it concatenates self with the neighbour summary rather than adding them, so "me" and "around me" never blur together.

It also works on nodes never seen in training (**inductive**). Molecules need that by default, since every molecule is a new graph — though they are small enough that sampling is usually unnecessary.

### GAT and GATv2 (graph attention network)

GAT learns a weight per neighbour — the same operation as a transformer's, restricted to bonded neighbours. [Attention in full](../attention-en/) covers query/key/value, cross-attention and the FFN (feed-forward network).

$$
\alpha_{vu} = \mathrm{softmax}_u\big(\mathrm{LeakyReLU}(a^\top [W h_v \,\|\, W h_u])\big)
$$

The problem is that $a$ sits **inside** the nonlinearity. Because of that, every node ranks its neighbours in the same order — <u>static attention</u>, which defeats the point of attention being query-dependent.

GATv2 changes only the order of operations.

$$
\alpha_{vu} = \mathrm{softmax}_u\big(a^\top \mathrm{LeakyReLU}(W [h_v \,\|\, h_u])\big)
$$

Moving $a$ **outside** the nonlinearity allows a different ranking per node (dynamic attention). The implementation differs by a line and costs about the same, so **for new work, GATv2 is the right default.**

### GIN (graph isomorphism network)

$$
h_v^{(l+1)} = \mathrm{MLP}\Big((1 + \epsilon)\, h_v^{(l)} + \sum_{u \in \mathcal{N}(v)} h_u^{(l)}\Big)
$$

Unlike mean or max, **summing preserves how many neighbours there were and how often each appeared.** That gives GIN the same discriminative power as the 1-dimensional Weisfeiler-Lehman (1-WL) test, which is the theoretical ceiling for message passing. GCN and mean-aggregating GraphSAGE are strictly weaker.

This is why GIN is the standard backbone for molecular pre-training: a mean cannot tell two hydrogens from three on a carbon, and a sum can.

### Choosing one for molecules

| situation | reasonable choice |
| --- | --- |
| a baseline | GCN or GraphSAGE |
| pre-training backbone | GIN (an edge-feature variant) |
| attention you intend to interpret | GATv2 |
| a very large knowledge graph | GraphSAGE, with sampling |

One trap matters. <mark>As originally defined, GCN, GAT and GIN **do not use edge features.**</mark> Bond order — single, double, aromatic — is essential information in a molecule, and plain implementations throw it away. Use a variant that accepts edge features: `GINEConv` or `NNConv` in PyTorch Geometric, or an MPNN (message passing neural network) layer.

## From nodes to one molecule

To predict a property of the whole molecule you have to collapse the node vectors. This is the **readout**, or pooling.

$$
h_G = \mathrm{READOUT}\big(\{h_v^{(L)} : v \in V\}\big)
$$

At its simplest a sum or mean; more elaborately an attention-weighted sum or hierarchical pooling. It must be order-independent for the same reason.

## What goes wrong when you go deep

A CNN (convolutional neural network) stacks dozens of layers. GNNs usually stop at **two to five**. Two reasons.

**Over-smoothing.** Each layer mixes a wider neighbourhood into every node. Repeat it enough and all nodes look alike, so you can no longer tell them apart. On graphs as small as molecules this takes only a few layers.

**Over-squashing.** Information from an $L$-hop neighbourhood is compressed into one fixed-size vector. Signals from far-away nodes effectively never arrive.

<mark>So if you want to capture an interaction between two distant functional groups, adding layers is not the answer.</mark> **Adding shortcuts** usually is: a virtual node, a separate substructure-level graph (which is what a junction tree gives you), or global attention.

## Practical problems on molecules

- **Feature choice.** A person still decides what goes into a node: atomic number, degree, formal charge, aromaticity, hydrogen count — and for bonds, order and ring membership.
- **Rings.** Decomposition rules like BRICS deliberately do not cut rings, so a fused polycyclic system can come out as one enormous fragment.
- **Stereochemistry.** A 2D graph cannot tell enantiomers apart. When activity depends on it, you need 3D information or explicit features.
- **Data size.** Labelled sets are usually a few thousand molecules, which is why [pre-training](../transfer-learning-en/) is close to mandatory.

> **The general view.** Graphs are not a molecular idea — social networks, recommendation, knowledge graphs and road networks are all graphs. What differs is **scale**. Molecules give you millions of small graphs of 20–50 nodes; a social network is one graph with hundreds of millions. So molecular work centres on graph-level prediction and readout, and theirs on node-level prediction and sampling.


<figure>
<img src="/assets/fig/gnn-applications-reiser2022.jpg" alt="Where GNNs are used: property prediction, screening, inverse design, atomistic simulation, synthesis prediction" width="1400" height="1302">
<figcaption><b>Where GNNs actually get used.</b> Molecules along the top: ADMET (absorption, distribution, metabolism, excretion, toxicity) properties, inverse design, explainable ML. Materials along the bottom: MOFs, defect classification, surface reactions. The arrow between them is the range of tasks, from property prediction to scientific understanding.
<br><span class="credit">Reiser et al., <a href="https://doi.org/10.1038/s43246-022-00315-6"><i>Commun. Mater.</i> <b>3</b>, 93 (2022)</a> &#183; paper figure, Figure 2</span></figcaption>
</figure>

## Summary

- Molecules are graphs, and GNNs have permutation invariance built in
- One layer = build messages → aggregate order-independently → update
- GCN mean · GAT attention · GIN sum (the most expressive)
- Molecule-level prediction needs a readout
- Deep stacks over-smooth and over-squash — two to five layers is the norm

## References

- Kipf & Welling, [GCN](https://arxiv.org/abs/1609.02907) (ICLR 2017) · Hamilton et al., [GraphSAGE](https://arxiv.org/abs/1706.02216) (NeurIPS 2017)
- Veličković et al., [GAT](https://arxiv.org/abs/1710.10903) (ICLR 2018) · Brody et al., [GATv2](https://arxiv.org/abs/2105.14491) (ICLR 2022)
- Xu et al., [How Powerful are Graph Neural Networks?](https://arxiv.org/abs/1810.00826) (ICLR 2019) — GIN and the WL test
- [A Gentle Introduction to Graph Neural Networks](https://distill.pub/2021/gnn-intro/) — Distill, interactive and the best place to start
