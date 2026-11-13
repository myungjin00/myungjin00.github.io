---
title: "References, annotation, and the files in between"
date: 2026-11-13
description: "What a reference genome actually is · why counting needs a second file that says where the genes are · FASTA, FASTQ, SAM, BAM, GTF, BED, VCF in one table · what alignment adds to a read · and the reasons a read ends up counted for nothing"
category: concept
updated: 2026-11
lang: en
group: reference-and-files
topic: Bioinformatics
subtopic: Sequencing
tags: [reference genome, annotation, GTF, BAM, file formats]
---

The [note on getting to a count matrix](../geo-fastq-en/) is the procedure: run these commands in this order. This is the layer underneath it — what the reference and the files actually are, so the commands stop being incantations. It follows on from [sequencing](../sequencing-en/).

## What a reference genome is

A reference genome is one long string of A, C, G and T per chromosome, stored in a **FASTA** file. It is not any particular person's genome, and it is not an average of several either — it is a haploid **mosaic**, stitched together from clone libraries of a handful of anonymous donors, with one library supplying most of it. It exists so that everyone can describe a position the same way.

The file holds more than the chromosomes: runs of `N` where the sequence is still unresolved, a tail of unplaced scaffolds, and alternate haplotypes for the most variable regions. Whether those extras are present is why two files both called GRCh38 can behave differently.

References have **versions**, and the version is part of a result:

| Species | Current assembly |
| --- | --- |
| Human | GRCh38 (hg38); GRCh37/hg19 still common in older work |
| Mouse | GRCm39; GRCm38/mm10 before it |

Coordinates are not portable between assemblies — chromosome 1 position 1,000,000 in GRCh37 is not the same base as in GRCh38. Mixing them produces results that look fine and are wrong, which is why the assembly belongs in the methods section.

## Annotation: the file that says where the genes are

The reference tells you the letters. It does not tell you which stretches are genes. That is a **separate file**, the annotation, usually **GTF** (or its close relative GFF).

A GTF is a table: one line per feature, with the chromosome, the start and end coordinate, the strand, the feature type (gene, transcript, exon) and a final column of attributes carrying the gene ID and name.

Counting needs both files. The aligner uses the reference to find where a read came from; the counter uses the annotation to decide which gene that position belongs to. Change the annotation and the counts change, even with identical reads — so, like the assembly, the annotation **source and version** are part of the method:

- **GENCODE and Ensembl** — the same gene set. GENCODE ships it with extra attributes and is the usual choice for human and mouse; Ensembl packages it differently
- **RefSeq** — curated independently, more conservative, fewer transcripts per gene

Gene identifiers differ between them, and the identifier is what a downstream tool matches on. Converting between ID systems silently loses genes, which is a common and invisible way to lose results.

## The file formats, in one table

| Format | Holds | Shape |
| --- | --- | --- |
| **FASTA** | sequences — a genome, a transcriptome, a set of proteins | `>name` then the letters |
| **FASTQ** | sequences *with* per-base quality — raw reads | four lines per read |
| **SAM** | reads placed on the reference | text, one line per alignment |
| **BAM** | the same thing, compressed — and indexable once coordinate-sorted | binary; what you actually keep |
| **GTF / GFF** | where the genes are | one line per feature |
| **BED** | plain intervals — peaks, regions, anything | chromosome, start, end |
| **VCF** | variants — differences from the reference | one line per variant position |

One trap worth memorising: **BED counts from 0 and excludes the end; GTF counts from 1 and includes it.** The same exon is `chr1 999 1100` in BED and `chr1 1000 1100` in GTF. Tools convert correctly; hand-written scripts frequently do not, and the result is an off-by-one that no error message will report.

## What alignment adds to a read

A read in a FASTQ is a string with no address. After alignment it has one, plus some bookkeeping. The parts worth recognising in a BAM:

- **position** — chromosome and coordinate where the read starts
- **CIGAR** — how the read lines up, as a compact string. `100M` means a hundred bases aligned straight through with no indel — matches *or* mismatches, since only `=` and `X` tell those apart; `50M200N50M` means fifty matched, two hundred skipped, fifty matched — and in RNA-seq that skip is an **intron**, so the read crossed a splice junction
- **MAPQ** — confidence that the position is the right one
- **flags** — paired, mate's position, reverse strand, duplicate

MAPQ is worth one caution: the aligners do not agree on a scale. STAR writes 255 for a uniquely mapped read — a value the SAM spec reserves for "mapping quality unavailable" — while BWA-MEM's maximum is 60 and 0 means the read mapped equally well in more than one place. A filter copied from one pipeline into another can quietly discard everything.

## Why a read might not be counted

A read can survive alignment and still contribute nothing to the matrix:

- **Multi-mapping** — it fits several places equally well, usually a repeat or a gene family. Most counters discard these rather than guess
- **Ambiguous** — it lands where two annotated genes overlap, so which gene it belongs to is undetermined
- **No feature** — it maps to the genome but to no annotated gene: intronic, intergenic, or a transcript this annotation does not include
- **Unmapped** — it does not fit the reference at all: contamination, adapter, or a poor-quality read

These counts are reported, and they are worth reading. A sample where a large fraction is "no feature" usually means the strandedness setting is wrong — that alone can dump most reads into the bin with nothing else amiss — or genomic DNA contamination, or the wrong annotation; a large "unmapped" fraction usually means the wrong organism or something upstream went wrong.

## Summary

- A **reference genome** is a haploid mosaic sequence in FASTA; its **assembly version** is part of any result, and coordinates do not transfer between versions
- The reference does not say where genes are — that is a separate **annotation** file, usually GTF, and its source and version change the counts
- GENCODE and Ensembl carry the same gene set; RefSeq is curated separately. Gene identifiers differ between them, and converting between them loses genes silently
- **BED is 0-based and end-exclusive; GTF is 1-based and end-inclusive**
- Alignment gives a read a position, a **CIGAR** string (where `N` in RNA-seq means a splice junction), a **MAPQ** and flags
- MAPQ scales differ between aligners — STAR's unique is 255, BWA's maximum is 60
- A read can be dropped as multi-mapping, ambiguous, no-feature or unmapped, and those four numbers diagnose the sample

## References

- Danecek et al., [Twelve years of SAMtools and BCFtools](https://doi.org/10.1093/gigascience/giab008), *GigaScience* (2021)
- Mudge et al., [GENCODE 2025: reference gene annotation for human and mouse](https://doi.org/10.1093/nar/gkae1078), *Nucleic Acids Res.* (2025)
- Dobin et al., [STAR: ultrafast universal RNA-seq aligner](https://doi.org/10.1093/bioinformatics/bts635), *Bioinformatics* (2013)
- Putri et al., [Analysing high-throughput sequencing data in Python with HTSeq 2.0](https://doi.org/10.1093/bioinformatics/btac166), *Bioinformatics* (2022)
