---
title: "From sequence to protein: the basics"
date: 2026-11-13
description: "The three alphabets and the one direction between them · what a gene actually hands you · how two sequences are aligned · what a multiple sequence alignment shows that one sequence cannot · and the little about folding you need before any of it means something"
category: concept
updated: 2026-11
lang: en
group: sequence-to-protein
topic: Bioinformatics
subtopic: Sequences
tags: [sequence, central dogma, alignment, MSA, proteins]
---

[Sequencing](../sequencing-en/) gives you letters. This note is the next step up: what the letters mean, how sequences get compared, and the little about protein folding you need before any of it is useful. It is groundwork, not a survey — I wrote it because my own work is on the molecule side and I wanted the protein side to stop being a black box.

## Three alphabets, one direction

Biology writes in three alphabets:

| | Alphabet | Which copy it is |
| --- | --- | --- |
| **DNA** | A, T, G, C | the stored copy |
| **RNA** | A, U, G, C | the working copy (T becomes U) |
| **Protein** | 20 amino acids | the thing that does the work |

The direction between them is the **central dogma**: DNA is *transcribed* into RNA, and RNA is *translated* into protein.

Translation reads RNA three letters at a time. Each triplet is a **codon**, and each codon names one amino acid. Three letters from a four-letter alphabet gives 64 codons for 20 amino acids, so the code is redundant — several codons mean the same amino acid. Three codons mean *stop*, and one (AUG) encodes methionine — and, in the right sequence context, is also the signal to *start*.

Two consequences worth holding onto:

- Because the code is redundant, **a DNA change need not change the protein**. A substitution that lands on the third letter of a codon often leaves the amino acid as it was.
- Because translation reads in threes, **inserting or deleting one or two letters shifts every codon after it**. Everything downstream becomes a different protein. That is a frameshift, and it is usually catastrophic where a substitution would not be.

<figure>
<img src="/assets/fig/frameshift.svg" alt="The same bases read as codons, and again with one base deleted, where every codon after the deletion is different" loading="lazy" />
<figcaption><b>Why an indel is not a substitution.</b> The first two codons survive; everything after the lost base is read in a new frame, so every amino acid downstream changes. A substitution at the same position would have changed at most one. Drawn for this note.</figcaption>
</figure>

## What a gene actually hands you

A gene is not a clean run of protein-coding letters. In humans the parts that survive splicing (**exons**) are interrupted by stretches removed from the RNA (**introns**) before translation. Exons are not the same as coding sequence — they include the untranslated ends, and a non-coding gene has exons with no coding content at all.

Splicing is not fixed. The same gene can keep different combinations of exons and produce different proteins — **isoforms**. So "one gene, one protein" is not true: roughly twenty thousand protein-coding genes give rise to many more distinct proteins.

This is also why RNA-seq counts are usually reported per gene rather than per isoform. Telling isoforms apart requires linking several exon junctions within one read, and a [short read](../sequencing-en/) spans one or two at most.

## Comparing two sequences

Two sequences from related species are similar but not identical. **Aligning** them means lining them up so corresponding positions sit in the same column, inserting **gaps** where one has material the other lacks.

```
Human   M K T A Y I A K Q R Q I S F V K
Mouse   M K T A Y I A K Q R Q I - F I K
                                ^   ^
                                gap substitution
```

Two scoring choices make an alignment:

- a **substitution matrix** (BLOSUM62 is the usual one) says some amino acid swaps cost less than others — swapping one small hydrophobic residue for another is cheap, swapping it for a charged one is not
- **gap penalties** say that opening a gap is expensive and extending one is cheaper, because a single insertion of several letters is more likely than several separate insertions

The output is a percentage identity and, more usefully, a column-by-column correspondence.

## Many at once: the MSA

A **multiple sequence alignment** does the same for many related sequences at once — typically thousands of homologues of the same protein, pulled from across the tree of life and from metagenomes. Its value is that you can now read *down* a column instead of across a row.

- a column where nearly every species has the same residue is **conserved**. Evolution has not been allowed to change it, which usually means it is doing something — catalysis, binding, or holding the structure together
- a column that varies freely is tolerant, and probably not doing anything delicate

<figure>
<img src="/assets/fig/msa-coevolution.svg" alt="A multiple sequence alignment with one column fixed across all species, and two further columns whose residues swap together" loading="lazy" />
<figcaption><b>Reading an alignment down, not across.</b> One column never changes — evolution was not allowed to touch it. Two others change constantly, but never alone: where one is E the other is K. The usual reading of that pattern is that the two residues touch in three dimensions. Drawn for this note.</figcaption>
</figure>

And then the part that is less obvious. Consider two columns that both vary — but *together*. Whenever one changes, the other changes as if compensating. That is **coevolution**, and the usual reading is that the two residues touch each other in three dimensions: a change at one is tolerated only when the other adjusts. The reading only holds once the indirect correlations are divided out — if A pairs with B and B with C, A and C will appear to covary without ever touching — which is what direct-coupling methods do.

So an alignment built purely from sequence carries a noisy map of which residues are near which in space. That is the signal modern structure prediction learned to read, and it is why those models take an MSA as input rather than a single sequence. A protein with few known relatives gives a shallow MSA and a weaker prediction.

## The little about folding you need

The chain does not stay a chain. It folds, and the folding is described in levels:

| Level | What it is |
| --- | --- |
| **Primary** | the amino acid sequence |
| **Secondary** | local shapes the backbone settles into — α-helices and β-sheets |
| **Tertiary** | the full three-dimensional shape of one chain |
| **Quaternary** | several chains assembled into one complex |

A **domain** is a part of the chain that folds independently and often carries a function by itself. A **fold** is the overall shape a domain takes, and unrelated sequences can share one.

The reason this matters for anything downstream: function lives in the tertiary structure, not the string. A drug binds a **pocket** — a cleft on the folded surface — and the residues lining that pocket can be far apart in the sequence and close together in space. Which is exactly what the coevolution signal in an MSA was pointing at.

## Summary

- DNA → RNA → protein; translation reads RNA in **codons** of three letters
- The code is redundant, so many DNA changes leave the protein unchanged — but an insertion or deletion of one or two letters shifts the frame and ruins everything after it
- Genes are split into **exons and introns**, and alternative splicing means one gene can give several **isoforms**
- Aligning two sequences needs a **substitution matrix** and **gap penalties**
- An **MSA** lets you read columns: conserved columns mark residues that matter
- Columns that vary *together* suggest residues that **touch in space** — the signal structure prediction reads
- Function lives in the folded shape, and a binding **pocket** is made of residues that the sequence shows as far apart

## References

- Crick, [Central dogma of molecular biology](https://doi.org/10.1038/227561a0), *Nature* (1970)
- Henikoff & Henikoff, [Amino acid substitution matrices from protein blocks](https://doi.org/10.1073/pnas.89.22.10915), *PNAS* (1992)
- Marks et al., [Protein 3D structure computed from evolutionary sequence variation](https://doi.org/10.1371/journal.pone.0028766), *PLoS ONE* (2011)
- Jumper et al., [Highly accurate protein structure prediction with AlphaFold](https://doi.org/10.1038/s41586-021-03819-2), *Nature* (2021)
