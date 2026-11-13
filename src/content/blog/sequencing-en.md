---
title: "Sequencing: what the machine actually gives you"
date: 2026-11-13
description: "A sequencer does not read a molecule end to end · it reads short fragments, many times over · what a read, depth and coverage are · why reads come in pairs · and what is in a FASTQ file"
category: concept
updated: 2026-11
lang: en
group: sequencing
topic: Bioinformatics
subtopic: Sequencing
tags: [sequencing, NGS, FASTQ, reads, coverage]
---

Every RNA-seq analysis I do starts from a count matrix, and the [note on getting there](../geo-fastq-en/) starts from a FASTQ file. This is the step before that: what the machine does, and why the data arrives in the shape it does.

## A sequencer reads fragments, not molecules

The intuition people start with is that a sequencer takes a DNA molecule and reads it from one end to the other. It does not. The sample is first broken into **short fragments**, and the machine reads a stretch from the end of each one. One such stretch is a **read**.

A read from the usual short-read machines is 50–300 bases long. A gene is thousands. So nothing is read whole — the original sequence has to be reconstructed afterwards, either by aligning each read back to a reference genome or by assembling the reads against each other.

This is why the first file you get is millions of short strings in no particular order, and why alignment is a separate step rather than something the machine did for you.

## Depth and coverage

Because fragmentation is random, the same position gets read by several different fragments. Two words for this:

| Term | What it counts |
| --- | --- |
| **Depth** | how many reads cover one position |
| **Coverage** | what fraction of the target was read at all |

They are often used interchangeably, and "30× coverage" usually means average depth. The distinction matters when a region is missed entirely — high average depth does not mean nothing was missed.

For RNA-seq the number people quote is **library size**: total reads per sample, typically 20–50 million. It is not a measure of quality on its own. A sample with many reads that all came from a handful of highly expressed genes has less information than the number suggests, which is why [normalisation](../normalisation-en/) exists.

## Why reads come in pairs

A fragment can be read from both ends. That gives two reads — a **pair** — with a roughly known distance between them.

- **Single-end**: one read per fragment. Cheaper, enough for counting genes.
- **Paired-end**: both ends. The pair pins down position better, which matters for splicing, structural variants and repetitive regions.

Most of the bulk RNA-seq I work with is paired-end, and the pairing shows up as two FASTQ files per sample, `_1` and `_2`, with the same read names in the same order.

## Long reads, briefly

A second family of machines — PacBio and Oxford Nanopore — reads whole fragments tens of thousands of bases long. That removes the reconstruction problem: a full transcript can be read in one piece, so isoforms are unambiguous. The trade is cost per sample and, for raw PacBio CLR or Nanopore simplex reads, a higher per-base error rate — though PacBio HiFi and Nanopore duplex now reach Q30, so accuracy is no longer the dividing line it was. Short reads remain the default for counting.

## What a FASTQ file holds

Four lines per read:

```
@SRR1234567.1/1            ← the read's name
GATTACAGATTACAGATTACA      ← the bases
+
IIIIIIIIIIIIIIIIIFFF:      ← one quality character per base
```

The fourth line is the part worth knowing. Each character encodes a **Phred score**: the machine's estimate of the probability that it called that base wrong.

| Phred | Error probability | Read as |
| --- | --- | --- |
| 10 | 1 in 10 | poor |
| 20 | 1 in 100 | usable |
| 30 | 1 in 1,000 | good |
| 40 | 1 in 10,000 | very good |

Quality tends to fall off toward the end of a read — the chemistry degrades over cycles — which is why quality control plots are per-position, and why trimming the tail is a routine step.

## Summary

- A sequencer reads short fragments, not whole molecules; a **read** is one such stretch
- Reconstruction (alignment or assembly) happens afterwards, in software
- **Depth** is reads per position, **coverage** is how much was read at all; high average depth can still miss a region
- Library size is not quality: reads concentrated in a few genes carry less than the count suggests
- **Paired-end** reads both ends of a fragment, which pins down position; it arrives as two matched FASTQ files
- Long reads remove the reconstruction problem at the cost of accuracy and money
- A FASTQ read is four lines, and the fourth is a **Phred score** per base — quality falls toward the read's end

## References

- Goodwin et al., [Coming of age: ten years of next-generation sequencing technologies](https://doi.org/10.1038/nrg.2016.49), *Nat. Rev. Genet.* (2016)
- Conesa et al., [A survey of best practices for RNA-seq data analysis](https://doi.org/10.1186/s13059-016-0881-8), *Genome Biol.* (2016)
- Cock et al., [The Sanger FASTQ file format for sequences with quality scores, and the Solexa/Illumina FASTQ variants](https://doi.org/10.1093/nar/gkp1137), *Nucleic Acids Res.* (2010)
- Amarasinghe et al., [Opportunities and challenges in long-read sequencing data analysis](https://doi.org/10.1186/s13059-020-1935-5), *Genome Biol.* (2020)
