---
title: "Gene sets and enrichment: GO, KEGG, Reactome, Hallmark"
date: 2026-05-15
description: "A list of 800 genes means nothing until it is grouped into gene sets · where the sets come from and how they differ · ORA versus GSEA, and what a threshold throws away · scoring a set per cell with AUCell, GSVA and friends · and why 'immune response' keeps coming up"
category: concept
updated: 2026-06
lang: en
group: gene-sets
topic: Bioinformatics
subtopic: Gene sets
tags: [GSEA, GO, KEGG, Reactome, AUCell]
---

A differential expression run gives you 800 significant genes. Reading them as a list tells you nothing. **Enrichment analysis is the step that turns that list into something a person can act on** — and the step where a conclusion most easily outruns the data.

## Where gene sets come from

The four databases are not interchangeable, and knowing what each one *is* explains most of the differences between results.

| Database | What it is | Downside |
| --- | --- | --- |
| **GO** (Gene Ontology) | a hierarchy of terms in three branches: biological process, molecular function, cellular component | terms are nested, so a gene annotated to a child is also in every parent — massive redundancy |
| **KEGG** (Kyoto Encyclopedia of Genes and Genomes) | hand-drawn pathway maps &mdash; metabolism as compounds converted by named enzymes, signalling as proteins activating or inhibiting each other | relatively few pathways, coarse, and licensing is restrictive for commercial use |
| **Reactome** | manually curated reactions, hierarchically organised, free | the deep hierarchy cuts both ways — one finding surfaces as a chain of nested pathways, and the human coverage is narrower than GO |
| **MSigDB** (Molecular Signatures Database) | a collection of collections: H (hallmark), C2 (curated incl. KEGG/Reactome), C5 (GO), C7 (immune) | the collections overlap each other — C2 already contains KEGG and Reactome — and the sets are human gene symbols, so other species need ortholog mapping |

<mark>If you want one place to start, it is the 50 **hallmark** sets.</mark> They were built specifically to fix GO's redundancy problem — coherent, non-overlapping, and small enough that a significant result is readable.

GO's hierarchy is the thing that trips people. Annotating a gene to "T cell activation" automatically annotates it to "lymphocyte activation", "immune response", "response to stimulus". So forty significant GO terms are often **one finding reported forty times**.

## Two ways to test: ORA and GSEA

**Over-representation analysis (ORA).** Take your significant genes, count how many are in the set, ask whether that is more than chance with a hypergeometric or Fisher test.

**GSEA (gene set enrichment analysis).** Do not threshold at all. Rank every gene by a statistic, walk down the ranking, and ask whether set members cluster near the top or the bottom.

<figure>
<img src="/assets/fig/gsea-running.svg" alt="The GSEA running enrichment score walking down a ranked gene list" loading="lazy" />
<figcaption><b>The running score.</b> Walking down the ranked list, step up by a weight at each set member and down by a constant otherwise. If the set is scattered, the walk is a random one that ends near zero; if it clusters at the top, the walk climbs first. The <b>enrichment score (ES)</b> is the furthest point from zero. Computed for this note.</figcaption>
</figure>

The practical difference is what a threshold costs:

<figure>
<img src="/assets/fig/ora-vs-gsea.svg" alt="The cut that ORA applies, and how few set members survive it" loading="lazy" />
<figcaption><b>What ORA discards.</b> Same simulated data. <b>(A)</b> the threshold keeps 205 of 3,000 genes; everything between the dashed lines is thrown away. <b>(B)</b> of the 60 genes in the set, <b>three</b> survive the cut. ORA on this data finds nothing; GSEA on the same ranking gives ES = 0.45.</figcaption>
</figure>

<mark class="blue">That is the case worth remembering: a set where every member moves *slightly* in the same direction is invisible to ORA and obvious to GSEA.</mark> And coordinated small changes are exactly what a pathway does.

| | ORA | GSEA |
| --- | --- | --- |
| input | a gene list | the whole ranked list |
| needs a threshold | yes | no |
| direction | lost | kept (positive/negative ES) |
| background | you must choose it | not applicable |
| good for | a list you were handed | your own differential expression output |

**The background is where ORA is most often wrong.** The universe should be the genes that *could* have been detected — the ones expressed in your tissue — not every gene in the genome. Using the genome as background makes tissue-specific sets look enriched when they are only expressed.

## Scoring a set per sample, or per cell

A third thing, often confused with the first two: rather than testing a set, give **each sample or each cell a score** for it. That answers a different question — is this pathway on in *this* cell type, rather than is it different between two groups.

| Method | How it scores | Notes |
| --- | --- | --- |
| **AUCell** | ranks genes within a cell, takes the area under the recovery curve (AUC) for the set | rank-based, so robust to dropout and to normalisation — the single-cell default |
| **GSVA** (gene set variation analysis) | kernel density over the expression distribution, then a Kolmogorov–Smirnov-like statistic | sample-level, for bulk |
| **ssGSEA** (single-sample GSEA) | GSEA run per sample | sample-level, scale-sensitive |
| **AddModuleScore** (Seurat) | mean of the set minus the mean of a matched control set | quick; the control matching is what makes it usable |

AUCell is the one to reach for in single-cell work, and the reason is [dropout](../bulk-vs-sc-en/): it uses only the **ranking** of genes within a cell, so a gene that was not captured drags the score down less than it would in a mean.

This is how senescence sets like [SenMayo and SHGS](../sasp-en/) are scored when the data is single-cell. The SHGS paper itself works in bulk, where it uses GSVA.

## Where enrichment analysis goes wrong

- **Redundancy.** Forty GO terms describing one thing. Fix it by using hallmark sets, or by clustering the significant terms by gene overlap before reading them.
- **Set size bias.** Very small sets are unstable; very large ones are vague. Most tools let you filter to roughly 15–500 genes, and you should.
- **Multiple testing across thousands of sets.** Always report adjusted p-values, and remember the sets are not independent. Correlation between genes inflates the statistic of a competitive test — one that asks whether the set changed more than the genes outside it — so false positives survive even standard FDR (false discovery rate) correction.
- **The literature bias.** Well-studied genes are in more sets, so "immune response" and "cell cycle" come up constantly — partly because they are real and partly because they are annotated. A hit on a famous pathway deserves more scepticism, not less.
- **Annotation drift.** GO is updated continuously. The same analysis run a year apart gives different results, so record the version.
- **ORA on an arbitrary cut.** Changing the significance threshold changes the enrichment result, which is a sign the analysis is fragile. GSEA avoids this entirely.

Before the test there is a cheaper look: mark the set on the volcano and see where it sits. [Reading a differential expression result](../reading-de-en/) does that, and the picture is the argument for enrichment methods.

> Enrichment is **hypothesis generation**. It tells you which stories are consistent with your data, not which one is true. A pathway hit is the beginning of an experiment, not the end of an analysis.

## Summary

- 800 genes is unreadable; enrichment groups them, and the grouping is where conclusions get overclaimed
- GO is a hierarchy, so it is redundant by construction; KEGG is coarse and licence-restricted; Reactome is free and detailed; MSigDB hallmark is 50 de-duplicated sets and the right place to start
- ORA needs a threshold and loses direction; GSEA uses the whole ranking and keeps it
- A set whose members all shift slightly is invisible to ORA and obvious to GSEA — and that is what a pathway looks like
- ORA's background should be expressed genes, not the genome
- To score a set per cell, use AUCell — it is rank-based and survives dropout; GSVA and ssGSEA are the bulk equivalents
- Watch for redundancy, set-size bias, literature bias toward famous pathways, and annotation version drift

## References

- Subramanian et al., [Gene set enrichment analysis](https://doi.org/10.1073/pnas.0506580102), *PNAS* (2005)
- Liberzon et al., [The Molecular Signatures Database hallmark gene set collection](https://doi.org/10.1016/j.cels.2015.12.004), *Cell Systems* (2015)
- Aibar et al., [SCENIC: single-cell regulatory network inference and clustering](https://doi.org/10.1038/nmeth.4463), *Nat. Methods* (2017) — AUCell
- Wu & Smyth, [Camera: a competitive gene set test accounting for inter-gene correlation](https://doi.org/10.1093/nar/gks461), *Nucleic Acids Res.* (2012) — why inter-gene correlation matters
