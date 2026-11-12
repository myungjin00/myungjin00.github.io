---
title: "From a GEO accession to a count matrix"
date: 2026-06-12
description: "What GSE, GSM, GPL and SRR actually point at · getting FASTQ out of SRA · what a FASTQ record contains and what FastQC is telling you · trim, align or pseudo-align, count · why the annotation version is part of your method · and when to just use the submitter's counts"
category: tutorial
updated: 2026-07
lang: en
group: geo-fastq
topic: Bioinformatics
subtopic: Transcriptomics
tags: [GEO, SRA, RNA-seq, preprocessing]
---

A paper gives you a GEO (Gene Expression Omnibus) accession — `GSE123456` — and you want a gene × sample matrix you can hand to [DESeq2](../de-tools-en/).

## What the accession points at

<figure>
<img src="/assets/fig/geo-structure.svg" alt="GSE series containing GSM samples, a GPL platform, and SRR runs holding the raw reads" loading="lazy" />
<figcaption><b>Four prefixes, four different things.</b> The number in a paper is almost always a <b>GSE</b>. The raw reads are not in GEO at all — they are in SRA (Sequence Read Archive), reached through the linked SRP/SRR accessions.</figcaption>
</figure>

| Prefix | What it is |
| --- | --- |
| **GSE** | a series — one study. The number quoted in papers |
| **GSM** | a sample — one library. This is where the per-sample metadata lives |
| **GPL** | the platform — which instrument |
| **SRP / SRR** | the raw reads, in SRA (Sequence Read Archive). SRP is the study, SRR one sequencing run |

<mark class="blue">The metadata you need for a design formula lives on the GSM records, and it is free text.</mark> Condition, sex, age, batch — if the submitter put them in a characteristics field you can parse them; if they put them in the sample title you parse that instead; if they did not record them, the comparison you wanted is not available and no amount of processing fixes it. **Read the GSM fields before downloading 400 GB.**

```r
library(GEOquery)
gse <- getGEO("GSE123456", GSEMatrix = TRUE)
pData(gse[[1]])[, 1:10]      # look at this first
```

## Getting the FASTQ

```bash
# the modern SRA toolkit: prefetch then convert
prefetch SRR12345678
fasterq-dump --split-files --threads 8 SRR12345678
gzip SRR12345678_*.fastq      # fasterq-dump writes them uncompressed, and they are large
```

`--split-files` is what gives you `_1` and `_2` for paired-end data. Getting this wrong and treating a paired run as single-end is a common and silent error.

For a whole study, the pipeline route is better than scripting it yourself:

```bash
nextflow run nf-core/fetchngs --input ids.csv --outdir fastq/   # ids.csv: one accession per line
```

## What is in a FASTQ

Four lines per read, always:

```
@SRR12345678.1 1/1
GGTTCAGCAGGAATGCCGAGACCGATCTCCCTAAGCTACGG
+
IIIIIIIIIIIIIIIIIIIIIIIIIIFFFFFFF:,,,,,,,
```

1. identifier
2. the sequence
3. a `+` separator
4. **quality**, one character per base

The quality line is Phred+33: character minus 33 is the score, and the score is −10·log₁₀(error probability). `I` is 40 — one error in 10,000. `,` is 11 — about one in 13. Quality dropping at the 3′ end, as above, is normal.

## QC (quality control), and what to actually look at

```bash
fastqc *.fastq.gz -o qc/ -t 8
multiqc qc/ -o qc/
```

Run FastQC per file and **MultiQC to collapse them into one report** — with 40 samples the individual reports are unreadable and the only question that matters is which samples differ from the others.

| Module | What it means |
| --- | --- |
| per-base quality | decline at the 3′ end is normal; a cliff is not |
| per-sequence GC | a second peak means contamination or rRNA (ribosomal RNA) |
| adapter content | how much of the adapter — the synthetic sequence attached to each fragment before sequencing — was read through; tells you whether you need to trim at all |
| duplication | high is expected in RNA-seq — highly expressed genes are genuinely duplicated |
| overrepresented sequences | usually rRNA or adapter; look them up before worrying |

<mark>FastQC was written for genome sequencing, and some of its red crosses are normal for RNA-seq.</mark> Duplication and per-base sequence content at the start of reads are the two that scare people for no reason — the latter is random-priming bias and is expected.

## Trim, then quantify

<figure>
<img src="/assets/fig/rnaseq-pipeline.svg" alt="FASTQ, QC, trimming, alignment or pseudo-alignment, counts, with the reference annotation feeding in" loading="lazy" />
<figcaption><b>The whole path.</b> Everything up to the count matrix is engineering; everything after it is statistics. The reference genome and its annotation feed the quantification step, and the <b>version</b> of that annotation is part of the method.</figcaption>
</figure>

```bash
# --detect_adapter_for_pe: work the adapter sequence out from the reads instead of naming it
fastp -i r_1.fq.gz -I r_2.fq.gz -o t_1.fq.gz -O t_2.fq.gz --detect_adapter_for_pe
```

Modern aligners soft-clip adapters — they ignore a mismatching end instead of discarding the read — so trimming is often optional. Do it when the adapter content is high or the read ends are poor.

Then one of two routes: map every read to a position on the genome, or skip the position and only work out which transcript each read came from (pseudo-alignment).

| | Align to the genome | Pseudo-align to the transcriptome |
| --- | --- | --- |
| tools | STAR → featureCounts | salmon, kallisto |
| gives you | BAM (binary alignment/map) files, so you can look at a locus | counts only |
| cost | high memory (~32 GB human), slow | minutes per sample, laptop-sized |
| use when | you need coverage, novel transcripts, variants | you want gene counts and nothing else |

```bash
# -i: a transcriptome index built once with `salmon index`.  -l A: infer the library type
salmon quant -i idx -l A -1 t_1.fq.gz -2 t_2.fq.gz -o out/
```

For most differential-expression work salmon is the right default — it is an order of magnitude cheaper and the gene-level counts agree closely with the alignment route.

## The parts that silently ruin an analysis

- **The annotation version is part of your method.** GENCODE v38 and v45 do not have the same genes. If half your samples were quantified against one and half against another, the batch effect is in the gene set itself.
- **Strandedness** — whether the library preserves which strand each read came from. Guessing wrong loses most of your reads or assigns them to the antisense gene. `salmon -l A` infers it; check what it inferred rather than assuming.
- **Paired versus single end.** See `--split-files` above.
- **Transcript-level counts need `tximport` before DESeq2** — handing salmon output straight to DESeq2 skips the offset that corrects for transcript length.
- **rRNA.** If depletion failed, most of the library is rRNA and the effective depth is a fraction of what the read count suggests.

## When to skip all of this

Many GSEs include a processed count matrix as a supplementary file. Using it is legitimate and often correct — but know what you are accepting:

- it was produced by **someone else's pipeline**, with their aligner and their annotation version;
- it cannot be combined with counts you generated yourself without a batch effect that is really a pipeline effect;
- and if you are **merging several studies**, re-quantifying everything from FASTQ with one pipeline is usually the only way to get a comparable matrix.

One study, one question: take the supplementary counts. Several studies, pooled: start from FASTQ.

## Summary

- GSE is the study, GSM the sample and where metadata lives, SRR the raw reads in SRA
- Read the GSM metadata **before** downloading — if the covariate was not recorded, no processing recovers it
- A FASTQ record is four lines; the quality line is Phred+33, and a 3′ decline is normal
- Run FastQC then **MultiQC**; high duplication and start-of-read bias are normal in RNA-seq
- Trimming is often optional with modern aligners
- **salmon** for gene counts, **STAR** when you need alignments; and `tximport` before DESeq2
- **The annotation version, strandedness and paired-end handling** are the three that silently ruin an analysis
- Submitter counts are fine for one study, and the wrong choice when pooling several

## References

- [GEO documentation](https://www.ncbi.nlm.nih.gov/geo/info/overview.html) · [SRA toolkit](https://github.com/ncbi/sra-tools)
- [nf-core/rnaseq](https://nf-co.re/rnaseq) and [nf-core/fetchngs](https://nf-co.re/fetchngs) — the pipelines worth using instead of your own scripts
- Patro et al., [Salmon provides fast and bias-aware quantification of transcript expression](https://doi.org/10.1038/nmeth.4197), *Nat. Methods* (2017)
- Soneson, Love & Robinson, [Differential analyses for RNA-seq: transcript-level estimates improve gene-level inferences](https://doi.org/10.12688/f1000research.7563.2), *F1000Research* (2016) — why `tximport` exists
