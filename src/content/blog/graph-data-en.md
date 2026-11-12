---
title: "What becomes a graph, and why you cannot just feed it to a network"
date: 2026-02-20
description: "A graph carries attributes at four levels, not one · what is worth representing as a graph and what is not · the n! argument that forces permutation invariance · edge lists, the PyTorch Geometric Data object, and block-diagonal batching"
category: concept
updated: 2026-03
lang: en
group: graph-data
topic: Graphs
tags: [graphs, representation, permutation invariance, batching]
---

Message passing is the second question about a **GNN (graph neural network)**. Underneath it sit four others: what a graph is, exactly; what is worth turning into one; how the thing is stored; and why it cannot be handed to an ordinary feed-forward network the way a feature vector can. That last point is not a performance observation. It is the reason the whole architecture family exists.

One layer below [graph neural networks](../gnn-en/), then, with molecules as the running example, because that is what I work on.

## A graph, stated precisely

A graph is a set of **nodes** and a set of **edges** between them. Beyond that, a graph carries information at **four** levels, and a model that only reads the first is throwing most of the data away.

| level | what it holds | in a molecule |
| --- | --- | --- |
| **node** | a vector per node | atomic number, formal charge, hydrogen count, aromaticity |
| **edge** | a vector per edge | bond order: single, double, triple, aromatic |
| **global** | one vector for the whole graph | the property being predicted, or a learned graph embedding |
| **connectivity** | which nodes are joined | the bond table |

Two more properties have to be stated, not assumed, because code silently defaults on both. Edges are **directed or undirected** — a citation points one way, a covalent bond does not. And **self-loops** may or may not be present, which decides whether a node sees its own previous state when its neighbours are aggregated.

Connectivity is a fourth kind of attribute, not a container for the other three. It is the only one of the four that no fixed-size vector representation of the same object keeps.

## What actually becomes a graph

| object | node | edge | global attribute |
| --- | --- | --- | --- |
| **molecule** | atom | covalent bond | solubility, toxicity, binding affinity |
| **protein** | residue or atom | peptide bond, or spatial contact under a distance cutoff | function, stability, fold class |
| **citation network** | paper | citation (directed) | field of a subgraph |
| **social network** | account | follow or friendship | community label |
| **knowledge graph** | entity | typed relation (directed) | — |
| **image** | pixel | adjacency to the 4 or 8 neighbouring pixels | class label |
| **sentence** | word | adjacency to the next word | sentiment, topic |

The last two rows are the arguable ones. Any object with parts and relations between them can be drawn as a graph, and an image and a sentence both can. <mark>"Anything can be a graph" is true and nearly useless; the question is whether the graph structure carries information that the cheaper representation loses.</mark>

For an image it does not. A pixel grid has a fixed, known, uniform neighbourhood — every pixel has the same four neighbours in the same relative positions, forever. A convolution exploits exactly that regularity and gets weight sharing with a fixed offset for free. Writing the grid as an edge list keeps the same information and discards the regularity that made it cheap. Same for a sentence: position is total order, and a transformer reads all pairs with that order encoded. Neither domain was won by graph methods.

For a molecule it goes the other way. There is no fixed neighbourhood — carbon has four bonds, oxygen two, and the pattern is the thing being predicted. A fingerprint reduces the molecule to a bag of substructures somebody chose in advance; [descriptors and fingerprints](../descriptors-fingerprints-en/) covers what that costs. A SMILES (simplified molecular-input line-entry system) string keeps the connectivity but hides it inside character order, so a ring closure shows up as two digits twenty characters apart. The graph is the representation in which "which atom is bonded to which" is first-class.

So the useful test is not "can I draw this as a graph" but "does the alternative representation lose the relations I need". For molecules, proteins, and anything relational by construction — knowledge graphs, interaction networks — it does.

## Why you cannot feed it to a multilayer perceptron

Take 1-propanol, heavy atoms only: a chain of four nodes, C–C–C–O. Write down its adjacency matrix with the atoms numbered in that order.

$$
A = \begin{pmatrix} 0&1&0&0 \\ 1&0&1&0 \\ 0&1&0&1 \\ 0&0&1&0 \end{pmatrix}
$$

Now renumber the atoms. There are $4! = 24$ ways to do it, and every one of them is an equally correct description of the same molecule. Of those 24, twelve give distinct adjacency matrices — reading the chain from either end produces the same matrix — and once the node features are attached, the oxygen tells the two ends apart and all 24 orderings give a distinct (adjacency matrix, feature matrix) pair.

Flatten that matrix into 16 numbers and feed it to an **MLP (multilayer perceptron)**. The first layer multiplies input position $k$ by weight $w_k$, so position is meaning: the number in slot 3 is a different input from the number in slot 12. Nothing in the network knows those 24 inputs are the same molecule. To return the same prediction for all of them, it has to learn the function 24 times over, once per ordering, from data that contains maybe one of them.

Four nodes is 24. A 30-atom molecule is $30! \approx 2.7 \times 10^{32}$. No amount of data fixes this, because the problem is not data — it is that the architecture has no notion of the symmetry at all.

What is wanted instead is stated as two requirements. Write $P$ for a relabelling of the nodes:

- **permutation invariance** — a graph-level output must not change: $f(PAP^\top, PX) = f(A, X)$. The predicted solubility of a molecule does not depend on which atom you called atom 0.
- **permutation equivariance** — node-level outputs must be relabelled the same way: $f(PAP^\top, PX) = Pf(A, X)$. If you swap atoms 1 and 3, their per-atom predictions swap too, unchanged in value.

Message passing with an order-independent aggregation is equivariant per layer, and an order-independent readout over the nodes makes the graph-level output invariant. That is the entire design constraint, and it is checkable:

```python
import torch
from torch_geometric.data import Data
from torch_geometric.nn import GINConv, global_add_pool

torch.manual_seed(0)
x = torch.tensor([[6., 1.], [6., 2.], [6., 2.], [8., 1.]])   # C C C O
edge_index = torch.tensor([[0, 1, 1, 2, 2, 3], [1, 0, 2, 1, 3, 2]])

perm = torch.tensor([3, 0, 2, 1])          # relabel the atoms
inv = torch.argsort(perm)
x2, ei2 = x[perm], inv[edge_index]         # same molecule, new numbering

gnn = GINConv(torch.nn.Linear(2, 8))
mlp = torch.nn.Linear(16, 8)               # over the flattened 4x4 adjacency matrix

def dense(ei):
    A = torch.zeros(4, 4); A[ei[0], ei[1]] = 1.; return A.view(-1)

zero = torch.zeros(4, dtype=torch.long)
g1 = global_add_pool(gnn(x, edge_index), zero)
g2 = global_add_pool(gnn(x2, ei2), zero)
print("GNN  max |difference|:", (g1 - g2).abs().max().item())
print("MLP  max |difference|:", (mlp(dense(edge_index)) - mlp(dense(ei2))).abs().max().item())
# GNN  max |difference|: 3.814697265625e-06    <- float32 rounding, i.e. zero
# MLP  max |difference|: 0.6325682997703552    <- a different molecule, as far as it knows
```

Both networks are untrained and random. The GNN still agrees with itself, because invariance is structural and does not have to be learned; the MLP disagrees, and training will not make it agree except by memorising orderings. <mark class="blue">This, not any benchmark number, is why GNNs exist.</mark> What follows from the constraint — the message-passing update, and how GCN (graph convolutional network), GraphSAGE, GAT (graph attention network) and GIN (graph isomorphism network) differ inside it — is in [graph neural networks](../gnn-en/).

## How a graph is actually stored

The dense adjacency matrix is $O(n^2)$ and almost entirely zeros. For 1-propanol it is 16 numbers holding 6 ones. For a 50-atom molecule with 52 bonds it is 2,500 numbers, of which 104 are nonzero. Molecular graphs are sparse by chemistry: an atom carries a small number of bonds — typically four for carbon, up to six for sulfur or phosphorus — and that number does not grow with the molecule, so the edge count grows like $n$ while the dense matrix grows like $n^2$.

So nobody stores it densely. The real format is an **edge list** in **COO (coordinate format)**: two index arrays, one of source nodes and one of target nodes, aligned position by position. Features live in separate matrices — one row per node, one row per edge — which is also what makes four-level attributes natural to carry.

<figure>
<img src="/assets/fig/edge-index.svg" alt="A dense adjacency matrix and a COO edge index for 1-propanol, with the same bond highlighted in both" loading="lazy" />
<figcaption><b>The same three bonds, stored twice over.</b> Sixteen numbers against twelve is a small win at four atoms and an enormous one at fifty, because one side grows with the square of the atom count and the other does not. The C1&#8211;C2 bond is the orange pair on each side: two symmetric cells in the matrix, two adjacent columns in the edge list.</figcaption>
</figure>

In **PyG (PyTorch Geometric)** this is the `Data` object:

```python
import torch
from torch_geometric.data import Data

# 1-propanol, heavy atoms only: C0-C1-C2-O3
x = torch.tensor([[6, 1], [6, 2], [6, 2], [8, 1]], dtype=torch.float)   # [atomic number, degree]
edge_index = torch.tensor([[0, 1, 1, 2, 2, 3],
                           [1, 0, 2, 1, 3, 2]], dtype=torch.long)       # each bond stored twice
edge_attr = torch.tensor([[1.], [1.], [1.], [1.], [1.], [1.]])          # bond order
y = torch.tensor([0.25])                                                # logP

d = Data(x=x, edge_index=edge_index, edge_attr=edge_attr, y=y)
print(d)
print(d.num_nodes, d.num_edges, d.is_undirected())
# Data(x=[4, 2], edge_index=[2, 6], edge_attr=[6, 1], y=[1])
# 4 6 True
```

Four things to hold onto.

- `edge_index` is `[2, num_edges]`, **not** `[num_edges, 2]`. Getting this backwards is a common first-time error, and with two edges it silently runs.
- **An undirected edge is stored twice**, once in each direction. Three bonds become six entries. There is no `undirected=True` flag; `is_undirected()` returns `True` precisely because both directions are present. If you store each bond once, messages flow one way only and half the molecule never hears from the other half.
- `edge_attr` is aligned to `edge_index` **column by column**, so both copies of a bond need the same feature row. Sort or filter one without the other and bond orders end up attached to the wrong bonds.
- `y` is the global attribute. Shape `[1]` for one graph-level target, `[num_nodes]` for a node-level task — the distinction decides whether you need pooling at all.

## Batching graphs is not like batching images

A batch of images is a tensor: 32 images, same height, same width, stack them on a new axis. Graphs have no such luck. Thirty-two molecules have 32 different atom counts and 32 different bond counts, and there is no axis to stack along.

The trick is to stop trying. Put all 32 graphs into **one disconnected graph** — a block-diagonal supergraph — by concatenating the node features and shifting each graph's `edge_index` by the number of nodes already placed. Then carry a `batch` vector, one integer per node, saying which original graph that node came from.

```python
import torch
from torch_geometric.data import Data, Batch
from torch_geometric.nn import global_mean_pool

def chain(n):  # a path of n nodes, each node feature = its index
    ei = torch.tensor([[i for i in range(n - 1)] + [i + 1 for i in range(n - 1)],
                       [i + 1 for i in range(n - 1)] + [i for i in range(n - 1)]])
    return Data(x=torch.arange(n, dtype=torch.float).view(-1, 1), edge_index=ei)

b = Batch.from_data_list([chain(4), chain(3), chain(5)])
print(b)
print(b.batch)
print(global_mean_pool(b.x, b.batch).view(-1))
# DataBatch(x=[12, 1], edge_index=[2, 18], batch=[12], ptr=[4])
# tensor([0, 0, 0, 0, 1, 1, 1, 2, 2, 2, 2, 2])
# tensor([1.5000, 1.0000, 2.0000])
```

Three graphs of 4, 3 and 5 nodes become one graph of 12 nodes, and 3 + 2 + 4 = 9 bonds become 18 directed entries. The `batch` vector is `[0,0,0,0,1,1,1,2,2,2,2,2]`. `global_mean_pool` reads it and returns one row per original graph: means of 0–3, of 0–2, and of 0–4, which are 1.5, 1.0 and 2.0.

It looks like cheating, and it is safe for a structural reason. <mark>Message passing only moves information along edges, and there are no edges between the blocks</mark> — so a node in molecule 7 can never receive a message from molecule 23, however many layers you stack. The supergraph is one graph to the data structure and 32 independent graphs to the computation. Node counts vanish from the model entirely: a layer sees an `[N, F]` feature matrix and a `[2, E]` index array and does not care how they were partitioned.

Two consequences in practice. Memory depends on the total node count in the batch, not the batch size, so a batch of 32 varies in cost from step to step and the worst case is set by the largest graphs in the set. And any operation you write yourself that needs per-graph semantics — pooling, a normalisation, a loss weighted per graph — has to take `batch` as an argument. Forgetting it is how `mean(x)` quietly becomes an average over the whole batch, which trains without error and learns nothing.

## The global node

Sometimes you want a place to put graph-level information while messages are still being passed, rather than only at readout. The standard move is a **virtual node** (also called a master or context node): one extra node connected to every real node, carried through every layer.

It buys two things. Distances collapse — any two atoms are now two [hops](../gnn-en/) apart through it, which is a shortcut past the over-squashing that makes far-apart functional groups invisible to a shallow stack. And after the last layer the virtual node's own vector is a graph-level representation that was built up by learning, rather than by averaging at the end.

The cost is the same mechanism read the other way. Every node is a neighbour of the virtual node, so its state is roughly a running summary of the whole graph, and it pushes that summary back into every node each layer. Local structure gets washed toward the graph mean — the over-smoothing problem, arriving in one layer instead of six. For small molecules a virtual node usually helps a little and sometimes hurts; it is worth an ablation — train once with it and once without, and compare — not a default. A second graph at the substructure level is the other way to get the same shortcut while keeping the levels separate, which is what a junction tree gives you — see [taking a molecule apart](../fragmentation-en/).

## What to check before you model

Run through this before writing a layer. Most of the time I have lost on graph data was lost on one of these.

| check | why it matters |
| --- | --- |
| **Is the structure actually informative?** | If a fingerprint or a tabular baseline matches the GNN, the graph was decoration. Run the baseline first. |
| **Directed or undirected?** | Store an undirected edge once and half the graph is unreachable. Store a directed one twice and you have erased the direction. |
| **Self-loops?** | They decide whether a node keeps its own state. Some layers add them internally, some do not, and adding them twice double-counts. |
| **Are edge features present, and used?** | Bond order is essential in a molecule, and plain GCN, GAT and GIN layers ignore `edge_attr` without complaining. |
| **How big is the biggest graph?** | Batched memory is set by the largest members, not the average. One 400-atom outlier can decide your batch size. |
| **Are node features comparable across graphs?** | The one that kills transfer. |

Node features are only comparable if they were built the same way, and across datasets they usually were not: a different atom-type vocabulary, hydrogens explicit in one set and implicit in the other, one-hot columns in a different order, a charge feature standardised against a different mean. Every one of those loads without error, because the shape still matches. The model then reads column 7 as "aromatic" in pretraining and as "formal charge +1" downstream, and the only symptom is that transfer does not help. If you pretrain on one corpus and fine-tune on another — which is the whole point of [pretraining](../transfer-learning-en/) for [molecular property prediction](../mpp-en/), where labelled sets are a few thousand molecules — the featuriser has to be the same code, not the same description of the code.

## Summary

- A graph carries attributes at four levels: node, edge, global, and connectivity
- "Anything can be a graph" is true and useless; the test is whether the alternative representation loses the relations you need. For images and text it does not, which is why convolutions and transformers won there
- A graph with $n$ nodes has $n!$ valid node orderings, so an MLP over a flattened adjacency matrix would have to learn the same function $n!$ times
- That forces permutation invariance for graph-level outputs and equivariance for node-level ones, and it is the reason GNNs exist
- Storage is an edge list in COO form, `[2, num_edges]`, with each undirected edge stored twice
- Batching concatenates graphs into one disconnected supergraph plus a `batch` vector; message passing never crosses the blocks, so the graphs stay independent
- Node features that are not comparable across datasets load without error and quietly kill transfer

## References

- Sanchez-Lengeling et al., [A Gentle Introduction to Graph Neural Networks](https://distill.pub/2021/gnn-intro/), *Distill* (2021) — interactive, first-principles, and the best starting point
- Gilmer et al., [Neural Message Passing for Quantum Chemistry](https://arxiv.org/abs/1704.01212) (ICML 2017) — the message-passing neural network framework, and the master-node variant
- Xu et al., [How Powerful are Graph Neural Networks?](https://arxiv.org/abs/1810.00826) (ICLR 2019) — what sum, mean and max aggregation can and cannot distinguish
- Fey & Lenssen, [Fast Graph Representation Learning with PyTorch Geometric](https://arxiv.org/abs/1903.02428) (ICLR 2019 workshop) — the paper behind the `Data` and `Batch` objects; the [documentation](https://pytorch-geometric.readthedocs.io/) is where the conventions are actually written down
