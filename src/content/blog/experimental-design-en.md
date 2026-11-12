---
title: "Replicates, batches and confounding: what a dataset can and cannot answer"
date: 2026-01-16
description: "The question to ask before any analysis · biological versus technical replicates · how many replicates, and when depth matters more · what a batch is and how to design around it · which batch problems are repairable and which are not · reading a public dataset's design before downloading it"
category: concept
updated: 2026-02
lang: en
group: experimental-design
topic: Bioinformatics
subtopic: Transcriptomics
tags: [experimental design, replicates, batch effect, confounding]
---

Most of the public data I work with — aging and liver disease series pulled out of GEO (Gene Expression Omnibus) — is already collected, already paid for, and I get no say in how it was designed. Which means the first job is deciding whether it is usable, and the honest answer is often no.

## The one question to ask first

Before anything else: **is the effect I care about separable from the things nobody controlled?**

Suppose a study has 12 disease samples and 12 controls, and the disease samples were all sequenced in 2019 while the controls were all sequenced in 2023. Different kit lot, different machine, probably a different person at the bench. Now compare disease against control. Every gene that comes out differential is equally well explained by "disease changes this gene" and by "2019 libraries differ from 2023 libraries", and the data contains nothing that distinguishes the two.

That is **confounding**: two variables move together so completely that the dataset holds no information about which one produced the difference. Not *some* ambiguity — none. <mark class="blue">A fully confounded variable is not a hard statistical problem, it is missing data, and it is missing in every single sample.</mark>

**This is not fixable downstream.** No normalisation, no covariate, no correction method recovers a contrast the experiment never measured. It is worth being blunt about this because the tooling will not stop you: every method here runs happily on a confounded design and returns a tidy table of p-values.

## Biological versus technical replicates

The distinction that is easy to get wrong, and the one that decides what n actually is.

Three mice, one library each, is **n = 3**. One mouse, sequenced three times, is **n = 1** measured precisely.

| | biological replicate | technical replicate |
| --- | --- | --- |
| what differs | a different individual, animal, donor, culture | the same material, measured again |
| what it estimates | biological variation in the population | measurement error of the protocol |
| counts toward n | yes | no |
| example | 3 mice, 1 library each | 1 mouse, 3 libraries |
| more of them buys | a defensible inference about the group | a tighter estimate for that one sample |

Technical replicates shrink measurement error and tell you **nothing about biological variation** — and biological variation is exactly what a p-value about a population is asking about. A test comparing two groups is asking whether the difference between group means is large relative to the spread *between individuals*. Three libraries from one mouse never see that spread, so averaging them gives a very precise number for one animal and no basis at all for a statement about mice.

The same error reappears in single-cell data, where cells from one donor get treated as independent samples. That version is covered in [the differential expression note](../de-tools-en/).

## How many replicates

There is no universal number: without deciding what effect size you need to detect, the replicate count is undecidable too. What is useful is a set of anchors.

For bulk RNA-seq (RNA sequencing) differential expression (DE), **the practical floor is around 5 per group** and most published designs use 3. Schurch et al. (2016) worked through this with 48 replicates per condition in yeast and landed on at least 6 replicates for routine DE, and around 12 if the goal is to recover most of the genes that genuinely changed. Three per group is not useless — it reliably finds large effects — but it has little power for the moderate fold changes that most biology actually produces. What the resulting [p-values and effect sizes](../statistics-basics-en/) do and do not say is a separate note.

Two trade-offs point in opposite directions:

- **More replicates beats more depth for DE.** Once a gene has enough reads to be counted, the limiting quantity is the between-individual spread, and only more individuals reduces that. Liu et al. (2014) showed this directly: adding replicates increased the number of detected DE genes much more than adding reads to the same libraries.
- **More depth beats more replicates for detecting lowly expressed transcripts.** A transcript sitting at a handful of reads is absent, not quiet, and no number of shallow libraries makes it appear.

So the answer depends on the question. "Which genes changed between conditions" wants replicates. "Is this low-abundance transcript present and which isoform is it" wants depth.

For single-cell, the number that matters is **the number of subjects, not the number of cells**. Ten thousand cells from two mice is n = 2 with a lot of internal detail. This is the whole reason pseudobulk exists, and the argument is in [the differential expression note](../de-tools-en/).

## Batches, and how to design around them

A **batch** is any grouping of samples that reflects how they were processed rather than what they are: a sequencing run, a day at the bench, a library kit lot, a technician, a flow cell, a plate. Batches produce real, large, reproducible shifts in expression — often larger than the biological effect being chased.

The rule that covers almost every case: **randomise what you cannot control, block what you can.**

Blocking means deliberately arranging samples so that each batch carries a mix of conditions. A **balanced block** is the clean version: **every batch contains some of every condition**, ideally in the same proportions. If 24 samples must be processed in three runs of 8, each run gets 4 disease and 4 control rather than being filled up condition by condition.

That arrangement is what converts an unfixable confound into a modellable covariate. With a balanced design, the batch difference and the condition difference show up in different comparisons, so a model can estimate both:

```
~ batch + condition
```

One extra term in the design matrix, and the condition estimate is now the condition effect *within* batches. [The differential expression note](../de-tools-en/) covers where this formula goes in practice. Randomisation handles everything you did not think to block — sample order on the plate, which day a dissection happened — by making those nuisances uncorrelated with condition rather than aligned with it.

Blocking costs nothing, if planned. The expense is entirely in the planning, which is why confounded public datasets are usually not the result of a hard choice but of nobody thinking about it on the day.

## What you can repair afterwards, and what you cannot

Three cases, and they behave completely differently.

| design | what to do | what you get |
| --- | --- | --- |
| **balanced batch** — every batch has every condition | put batch in the model as a covariate (`~ batch + condition`) | fine. The batch variation is absorbed and the condition estimate is clean |
| **partially confounded** — batches lean towards one condition | still model it | it works, but batch and condition compete for the same variation, so the condition estimate is weaker and the standard errors grow |
| **fully confounded** — batch is condition | nothing works | there is no analysis. `ComBat` and friends will run without complaint and return a result, and that result will be wrong |

<figure>
<img src="/assets/fig/confounding.svg" alt="Three sample-to-batch arrangements and the condition effect estimated from 2,000 simulated experiments under each" loading="lazy" />
<figcaption><b>Only the third row is unrecoverable, and it is unrecoverable by arithmetic rather than by bad luck.</b> 24 samples in 4 batches, a true condition effect of 1.0 and batch shifts of about &plusmn;2; 2,000 simulated experiments per arrangement. With balanced blocks the estimate is 1.00 &plusmn; 0.21 whether or not batch is in the model. Partially confounded, ignoring batch gives 1.01 &plusmn; 1.07 and <code>~ batch + condition</code> tightens it to 1.01 &plusmn; 0.24 &mdash; the model earns its keep. Fully confounded, the condition column is a combination of the batch columns, the design matrix is rank 4 where it needs 5, and the estimate comes back 0.71 &plusmn; 1.60: one experiment in ten lands within 20% of the truth.</figcaption>
</figure>

The existence of batch correction tools makes people believe the problem is solved. <mark>Batch-correcting a fully confounded design removes the biology along with the batch: the correction's whole job is to make the batches look alike, and the batches *are* the conditions.</mark> What comes back is a matrix in which the effect of interest has been deliberately erased, looking tidier than before.

Nygaard et al. (2016) made the related point for partially confounded designs: removing batch effects as a pre-processing step and then testing, rather than including batch in the model, inflates false positives, because the test is never told that some degrees of freedom were already spent. Model the batch; do not clean the data and then forget you did.

## Reading someone else's design

For public data these checks happen before any download. GEO metadata is free text and deeply uneven, but the checks are quick.

- **Group sizes.** How many samples per condition, and are they balanced? A 20-vs-3 comparison is dominated by the group of 3.
- **Processing dates or submission batches.** Run dates, series split into sub-series, samples with suspiciously different accession ranges. If dates are recorded, cross-tabulate them against condition immediately — that one table answers the confounding question.
- **Sex and age.** If all patients are male and all controls female, sex is the comparison. Age matters doubly for anything about aging; a disease cohort is usually older than its controls.
- **Paired or unpaired.** Whether samples come from the same individuals, and whether the pairing is actually recorded in a parseable field.
- **QC (quality control) exclusions.** If the submitter dropped samples, from which group? Uneven dropping after the fact reintroduces imbalance into a design that was planned balanced.
- **What the "control" is.** This is the one I get caught by most. Adjacent normal tissue is not healthy tissue — it sits in a diseased organ, with the same inflammation and the same circulating environment. Neither is non-tumour liver from a patient with cirrhosis a healthy liver. Both are legitimate comparators, but the contrast they define is narrower than "disease versus healthy", and the paper's conclusion should match.

[The note on going from a GEO accession to a count matrix](../geo-fastq-en/) covers where these fields live and how to pull them. The order is the point: read the metadata, decide the dataset can answer the question, and only then spend the disk space.

## Paired designs

Sometimes samples arrive in pairs: before and after treatment in the same person, tumour and adjacent tissue from the same patient, a baseline and a follow-up biopsy.

Pairing is information, and an unpaired test throws it away. Within a pair, genetics, age, sex, medication and tissue handling are held fixed, so the paired difference removes all of that between-individual variation — which in human data is usually the largest source of noise there is. Running an unpaired comparison on paired samples is not wrong, just weaker: the between-individual spread goes back into the error term and swamps the within-pair effect.

In a model this is one more term, the same shape as blocking:

```
~ subject + condition
```

The caveats are the usual ones. Pairing has to be recorded to be used, and in public data it frequently is not. And it costs degrees of freedom, so with very few pairs it can cost more than it buys — but where the between-subject effect is large, pairing is still almost always the better trade.

## Summary

- Ask first whether the effect of interest is separable from what nobody controlled; if it is not, **no analysis fixes it**
- **Confounding** means the data holds no information about which variable produced the difference — it is missing data, not a hard problem
- Three mice is n = 3; one mouse sequenced three times is n = 1. Technical replicates buy precision, never **biological variation**
- Bulk DE is underpowered below about **5 per group**, and most published designs use 3
- **More replicates for DE, more depth for lowly expressed transcripts**
- For single-cell the unit of replication is **the subject, not the cell** — hence pseudobulk
- **Randomise what you cannot control, block what you can**; a balanced block makes batch a covariate (`~ batch + condition`)
- A fully confounded design cannot be rescued, and **batch correction deletes the biology with the batch**
- For public data, read group sizes, dates, sex, age, pairing and what the "control" really is **before downloading**
- Pairing is information; an unpaired test on paired samples loses power

## References

- Schurch et al., [How many biological replicates are needed in an RNA-seq experiment and which differential expression tool should you use?](https://doi.org/10.1261/rna.053959.115), *RNA* (2016) — 48 replicates per condition, used to answer the replicate question empirically
- Liu, Zhou & White, [RNA-seq differential expression studies: more sequence or more replication?](https://doi.org/10.1093/bioinformatics/btt688), *Bioinformatics* (2014) — replicates beat depth for DE
- Leek et al., [Tackling the widespread and critical impact of batch effects in high-throughput data](https://doi.org/10.1038/nrg2825), *Nat. Rev. Genet.* (2010) — what batch effects do and why design comes first
- Nygaard, Rødland & Hovig, [Methods that remove batch effects while retaining group differences may lead to exaggerated confidence in downstream analyses](https://doi.org/10.1093/biostatistics/kxv027), *Biostatistics* (2016) — why removing batch before testing inflates false positives
- Johnson, Li & Rabinovic, [Adjusting batch effects in microarray expression data using empirical Bayes methods](https://doi.org/10.1093/biostatistics/kxj037), *Biostatistics* (2007) — `ComBat`, and the assumptions it needs
