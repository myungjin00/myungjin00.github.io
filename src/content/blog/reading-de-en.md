---
title: "Reading a differential expression result"
date: 2026-02-06
description: "log2 fold change, p and adjusted p are three different questions · the volcano has two axes because significance and effect size are not the same · marking a pathway on it · what a row z-score reveals and what it destroys · and the checks before you believe a figure"
category: concept
updated: 2026-02
lang: en
group: reading-de
topic: Bioinformatics
subtopic: Transcriptomics
tags: [differential expression, volcano plot, heatmap, visualisation]
---

[Running the test](../de-tools-en/) gives you a table with twenty thousand rows. Nobody reads that table. What gets read is two figures, and both of them hide something.

## Three numbers, three questions

| | what it answers |
| --- | --- |
| log$_2$ fold change | **how much** it changed, and in which direction |
| $p$ | how surprising that change would be if nothing were going on |
| adjusted $p$ | the same, after accounting for having asked twenty thousand times |

These move independently. A gene measured in thousands of reads can have a tiny, utterly reliable change; a gene measured in tens can double and mean nothing. <mark>Significance is a statement about confidence, not about size</mark>, and the volcano exists because people kept conflating the two.

## The volcano

<figure>
<img src="/assets/fig/volcano.svg" alt="Volcano plot of a simulated young-versus-old comparison, with one pathway marked in a second colour" loading="lazy" />
<figcaption><b>The same comparison, twice.</b> Simulated counts for 4,000 genes, six samples per group, so the truth is known — 128 genes clear both cuts. <b>Left</b>, every gene. <b>Right</b>, one pathway marked: 60 lipid-metabolism genes with a median log$_2$ fold change of <b>0.79</b>, of which only <b>15</b> pass the thresholds. <mark class="blue">A set can move together and still mostly fail a per-gene test.</mark> Computed for this note with simulated data.</figcaption>
</figure>

Effect size on x, confidence on y. The dotted lines are the conventional cuts — adjusted $p$ below 0.05, fold change beyond twofold — and they are conventions, not findings.

Each corner means something different:

- **top right and top left** — large change, measured confidently. The genes people quote.
- **top middle** — a small change you can trust. Often a real biological effect in a highly expressed gene, and routinely discarded by a fold-change filter.
- **bottom corners** — a large change you cannot trust. Usually a low-count gene with one unusual sample.
- **bottom middle** — nothing happening, which is most of the genome.

The axis that misleads is y. It is $-\log_{10}$, so the top of the plot stretches and everything else compresses into a band. A gene at $10^{-100}$ is not meaningfully more real than one at $10^{-10}$; both are as certain as this data can make them.

## Marking a set on it

Colouring a pathway turns the volcano into a different instrument. Instead of *which genes changed*, it answers **where the biology I came for sits in this distribution**.

In the figure the lipid-metabolism genes sit together on the right, which is the shape of a coherent response. But most of them do not clear the line. If you read only the significant list you would report a handful of lipid genes among many others and miss that the set as a whole shifted.

That gap is the argument for [gene set enrichment](../gene-sets-en/) stated visually — a threshold test asks each gene separately, and a set that moves a little in unison is invisible to it. Marking the set first and testing second is a reasonable order to work in, as long as the set was chosen before looking.

## The heatmap

<figure>
<img src="/assets/fig/heatmap-zscore.svg" alt="The same 40 genes drawn as raw log expression and as row z-scores" loading="lazy" />
<figcaption><b>What scaling does.</b> The 40 most significant genes, same rows, same order. <b>Left</b>, raw log$_2$ expression: the rows differ by up to <b>6.7</b> log$_2$ units in overall level, and that gradient drowns the young–old difference. <b>Right</b>, each row centred and scaled: the block structure appears — down in old above, up in old below. Computed for this note with simulated data.</figcaption>
</figure>

Almost every expression heatmap you see is z-scored by row, and that choice is usually not stated. It is the right choice, and it costs something:

- **what it reveals** — the pattern across samples, for every gene at once, regardless of how highly expressed each one is
- **what it destroys** — abundance. After scaling, a gene with twenty counts and a gene with twenty thousand look identical. Nothing on the figure tells you which is which.
- **what it invents** — a row that does not change at all still gets stretched to fill the colour range. <mark>Scale a row of pure noise and it comes back looking like a pattern.</mark>

Two more things decide what the figure looks like, and neither is a result:

**Row order.** Clustered rows are the default, and the dendrogram depends on the distance and the linkage you picked. Ordering by fold change instead, as above, is often more honest — it is a choice you can state in one clause.

**Which genes are in it.** A heatmap of the top 40 by $p$ will always look convincing, because the genes were selected for separating the groups. That figure shows that the selection worked, not that the groups differ. Selecting genes on all the data and then drawing them is the same [leakage](../evaluation-protocol-en/) that invalidates a test score.

## Before believing a figure

- **Check the colour scale is centred** when the values are signed. A diverging scale with white off zero makes a difference out of nothing.
- **Count the samples.** Six per group is a small study; three is a pilot. The figure never says so.
- **Ask what was filtered.** Low-count genes are usually removed before testing, and that is correct, but the cut-off changes the picture.
- **Look for the one sample doing the work.** In the raw heatmap panel a single outlying column is visible; in the z-scored one it is much harder to see.
- **Separate the figure from the claim.** The volcano shows that genes changed. Which pathway that implicates is a second argument, and it needs [its own test](../gene-sets-en/).

Single-cell changes the pipeline before this point — quality control, normalisation, variable-gene selection, clustering, cell-type labels — but once you have a comparison within one cell type, the figures and their failure modes are the same. The difference that matters is [which test you ran to get there](../de-tools-en/).

## Summary

- log$_2$ fold change, $p$ and adjusted $p$ answer different questions and move independently
- The volcano puts effect size against confidence; the thresholds on it are conventions
- Its y-axis is logarithmic, so the top stretches and almost everything else compresses
- **Marking a pathway** turns it into a question about where your biology sits — and a set that shifts together will mostly fail a per-gene test, which is why enrichment methods exist
- Heatmaps are z-scored by row almost always, and almost never say so
- Scaling reveals pattern, destroys abundance, and makes noise look structured
- **Top-$n$ genes always separate the groups** — they were chosen to
- Check the colour centre, the sample count, the filter and the one sample carrying the result

## References

- Love et al., [Moderated estimation of fold change and dispersion for RNA-seq data with DESeq2](https://doi.org/10.1186/s13059-014-0550-8), *Genome Biol.* (2014) — where the three numbers come from
- Benjamini & Hochberg, [Controlling the false discovery rate](https://doi.org/10.1111/j.2517-6161.1995.tb02031.x), *J. R. Stat. Soc. B* (1995) — the adjustment
- Gehlenborg & Wong, [Heat maps](https://doi.org/10.1038/nmeth.1902), *Nat. Methods* **9** (2012) — what the scaling and ordering choices do
- Gehlenborg & Wong, [Mapping quantitative data to color](https://doi.org/10.1038/nmeth.2134), *Nat. Methods* **9** (2012) — why the centre of a diverging scale matters
