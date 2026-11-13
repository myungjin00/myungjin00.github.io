---
title: "Counting and normalising: why raw counts are not comparable"
date: 2026-11-13
description: "Two things make a count large that have nothing to do with biology · CPM, FPKM and TPM, and which one is safe to average · why a few loud genes break library-size scaling · what a DESeq2 size factor does instead · and why a differential-expression tool wants raw counts"
category: concept
updated: 2026-11
lang: en
group: normalisation
topic: Bioinformatics
subtopic: Transcriptomics
tags: [normalisation, TPM, CPM, size factors, DESeq2]
---

A count matrix is not yet comparable. Two numbers in it can differ because the biology differs, or because of two things that have nothing to do with biology. This sits between [getting the counts](../reference-and-files-en/) and [the tools that test them](../de-tools-en/).

## The two nuisances

| Nuisance | Why it inflates a count |
| --- | --- |
| **Library size** | a sample sequenced twice as deeply gets roughly twice the counts for everything |
| **Gene length** | a longer transcript is broken into more fragments, so it collects more reads at the same abundance |

Which one you have to remove depends on the comparison:

- **The same gene across samples** — only library size matters. Gene length is identical on both sides and cancels.
- **Different genes within a sample** — length matters, and ignoring it makes long genes look highly expressed.

Most differential expression is the first case. That is worth remembering, because it means the length correction everyone reaches for is usually unnecessary.

## CPM, FPKM, TPM

The three names you meet, in the order they were invented:

- **CPM** (counts per million) — divide by library size. Corrects depth only.
- **FPKM / RPKM** — divide by library size, then by gene length in kilobases. Corrects both, in that order.
- **TPM** (transcripts per million) — divide by gene length *first*, then by the total of those length-corrected values.

TPM and FPKM use the same two corrections and differ only in order, which sounds pedantic and is not. Because TPM normalises last, **TPMs within a sample sum to one million**; FPKMs do not sum to anything fixed. That makes TPM comparable across samples in a way FPKM is not, and it is why TPM replaced FPKM for anything involving more than one sample.

Use TPM when you want to say "this gene is more abundant than that gene" or to hand numbers to a method that expects relative abundance. Do not use any of them as input to a differential-expression test.

## Why dividing by library size is not enough

Scaling by total counts assumes the total is a fair measure of depth. It stops being fair when a handful of genes take up most of the library.

Consider two samples sequenced identically. In the second, one gene is enormously induced and takes 30% of the reads. Every other gene now has a smaller share of the total, so dividing by the total makes **every other gene look lower** — an artefact produced entirely by one gene's success. Any composition like this breaks the assumption: a dominant gene, globoid rRNA contamination, a highly expressed cell type present in one sample.

This is a real problem in practice rather than a theoretical one, and it is the reason the DE tools do not use CPM.

## What a size factor does instead

DESeq2's **median of ratios** takes a different route. Roughly:

1. For each gene, compute a reference value across samples (the geometric mean).
2. For each sample, take the ratio of each gene's count to that reference.
3. Take the **median** of those ratios. That is the sample's size factor.

The median is the point. Genes that are genuinely changing sit in the tails of the ratio distribution; the median ignores them and reads the middle, where most genes are not changing. So the factor reflects sequencing depth rather than the loudest gene. edgeR's TMM does the same job by trimming the extremes and taking a weighted mean.

Both rest on one assumption: **most genes are not differentially expressed**. When that is false — a global shift, a drug that shuts down transcription broadly — these methods under-correct, and spike-in controls are the honest answer.

## Why the tool wants raw counts

It is tempting to hand DESeq2 a TPM matrix. Do not. The tools model counts, and a count carries information that a ratio has thrown away: **how many reads it was based on**.

A gene at 10 counts and a gene at 10,000 counts can both normalise to the same value, but one is far better measured than the other. The negative binomial model DESeq2 fits uses the raw magnitude to estimate how variable a gene is, and that variance estimate is what decides significance. Feed it normalised values and it has no way to tell a confident measurement from a noisy one.

So: give the tool raw counts and let it compute its own size factors. Use TPM for description — plots, comparisons between genes, input to methods that ask for abundance — and nothing else.

## Summary

- Two non-biological things inflate a count: **library size** and **gene length**
- Comparing the same gene across samples needs only the depth correction; length cancels
- **CPM** corrects depth; **FPKM** and **TPM** correct both and differ in order — TPMs sum to a million, FPKMs do not, so TPM is the one that travels between samples
- Dividing by total counts fails when a few genes dominate the library, making everything else look lower
- **Size factors** (DESeq2 median of ratios, edgeR TMM) use the *median* so that a loud gene cannot set the scale
- They assume most genes are unchanged; when that is false, use spike-ins
- Give a DE tool **raw counts** — the magnitude is what its variance model needs. TPM is for description

## References

- Love et al., [Moderated estimation of fold change and dispersion for RNA-seq data with DESeq2](https://doi.org/10.1186/s13059-014-0550-8), *Genome Biol.* (2014)
- Robinson & Oshlack, [A scaling normalization method for differential expression analysis of RNA-seq data](https://doi.org/10.1186/gb-2010-11-3-r25), *Genome Biol.* (2010)
- Wagner et al., [Measurement of mRNA abundance using RNA-seq data: RPKM measure is inconsistent among samples](https://doi.org/10.1007/s12064-012-0162-3), *Theory Biosci.* (2012)
- Evans et al., [Selecting between-sample RNA-seq normalization methods from the perspective of their assumptions](https://doi.org/10.1093/bib/bbx008), *Brief. Bioinform.* (2018)
