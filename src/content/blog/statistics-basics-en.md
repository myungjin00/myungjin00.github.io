---
title: "Reading a p-value: significance, effect size and the multiple testing problem"
date: 2024-11-22
description: "What a p-value is, and the three things it is not · 0.05 is a convention, not a law · effect size is the half people drop · 20,000 tests produce 1,000 false positives by construction · Bonferroni against Benjamini–Hochberg, and what FDR < 0.05 actually promises"
category: concept
updated: 2024-12
lang: en
group: statistics-basics
topic: Machine learning
subtopic: Basics
tags: [p-value, multiple testing, effect size, statistics]
---

A differential expression (DE) table carries a `pvalue` column and a `padj` column, and [DE tools](../de-tools-en/) and [gene sets](../gene-sets-en/) both rest on what those two columns mean. The setting here is transcriptomics, where one analysis asks the same question of twenty thousand genes at once.

## What a p-value actually is

A p-value is the probability of seeing data at least this extreme **if the null hypothesis were true** — the hypothesis that there is no difference. It is a statement about data under an assumption. It is not a statement about the assumption.

Three things it is not:

- **Not the probability the null hypothesis is true.** That quantity needs a prior on how often the null holds, and a p-value contains no prior.
- **Not the probability the result is a fluke.** p = 0.03 does not mean a 3% chance of being wrong. How often your hits are wrong depends on how many of the things you tested had anything going on, which the p-value does not know.
- **Not a measure of how big the effect is.** p = 10⁻²⁰ says the difference is hard to explain by noise alone. It says nothing about whether the difference is large.

## Significance is a threshold, and a threshold is a choice

α = 0.05 is a convention, inherited from Fisher, kept because everyone else kept it. Nothing about the number is derived.

So p = 0.049 and p = 0.051 are nearly the same evidence. One gets an asterisk and a sentence in the abstract, the other gets dropped, and the difference between them is noise. Report the number rather than the verdict, and say what α you used.

## Effect size — the other half

Significance depends on the effect **and** on the sample size — and what counts as a sample, and how many you need, is [a design question](../experimental-design-en/). Divide a fixed difference by a shrinking standard error and the p-value falls; with enough samples, any non-zero difference becomes significant.

Transcriptomics makes this concrete in the worst way. Treat 50,000 cells as 50,000 independent samples and the standard error becomes tiny, so single-cell DE tables routinely report p-values below 10⁻¹⁰⁰ for differences no one could measure twice in a mouse. Those numbers are a statement about cell count, not biology — the [DE tools note](../de-tools-en/) covers why cells are not replicates and why pseudobulk is the fix.

The effect-size column is what keeps this honest. **Log fold change (logFC)** is the log₂ ratio of mean expression between the two conditions: logFC = 1 is a twofold increase, logFC = −1 a twofold decrease, logFC = 0 no change. It carries no sample size at all — 50,000 cells and 5 do not change what a twofold difference means.

<mark>A p-value answers whether a difference is distinguishable from noise; only the effect size answers whether it is worth caring about.</mark> Which is why DE filters are written with both: `padj < 0.05 & abs(log2FoldChange) > 1`. The first threshold screens out noise, the second screens out the significant-but-trivial.

## The multiple testing problem

α = 0.05 is a promise about one test: if the null is true, there is a 5% chance of calling it significant anyway. Run the test 20,000 times and that 5% collects.

Suppose nothing at all is happening — no gene differs between conditions. Then:

```
20,000 genes × 0.05 = 1,000 genes with p < 0.05
```

A thousand significant genes, by construction, from pure noise. And the chance of getting at least one false positive is 1 − 0.95<sup>20,000</sup>, which is 1 to more decimal places than anyone needs. An uncorrected p-value column in a genome-wide table is not a result.

## Two corrections, and what each controls

| | **Bonferroni** | **Benjamini–Hochberg (BH)** |
| --- | --- | --- |
| Controls | family-wise error rate (FWER) — the chance of **any** false positive | false discovery rate (FDR) — the expected **proportion** of false positives among the hits |
| Rule | call a test significant if p < α/m, for m tests | sort the p-values, compare the i-th to i·α/m, keep everything up to the largest that passes |
| Strictness | very strict; with m = 20,000 the threshold is 2.5 × 10⁻⁶ | far more permissive, and the threshold adapts to how many real effects there are |
| Use it when | a single false positive is costly — one confirmatory test, one clinical endpoint, a target you will spend a year on | you are screening thousands of candidates and a few bad ones in the list are tolerable |
| Where you meet it | GWAS (genome-wide association study) 5 × 10⁻⁸ (Bonferroni over a million variants) | every `padj` column DESeq2, edgeR or limma hands you |

Genomics runs on BH because FWER control at genome scale leaves nothing: the simulation below shows Bonferroni rejecting everything, which is correct when there is nothing to find and useless when there is.

<mark class="blue">"FDR < 0.05" promises that of the genes you call significant, about 5% are expected to be wrong. It does **not** mean each gene has a 5% chance of being wrong.</mark> The guarantee is a property of the list, not of any row in it. A gene at `padj` = 0.049 sitting at the bottom of the list is much likelier to be a false positive than the one at 10⁻³⁰ at the top, and both are inside the same 5%.

## A worked illustration

Twenty thousand tests where the answer is known: both groups come from the same distribution, so every significant gene is a false positive.

```python
import numpy as np
from scipy import stats

rng = np.random.default_rng(0)
n, k = 20_000, 5

# both groups drawn from the same distribution: no gene is truly different
p = stats.ttest_ind(rng.normal(size=(n, k)), rng.normal(size=(n, k)), axis=1).pvalue

def bh(p):                                  # Benjamini-Hochberg adjusted p-values
    o = np.argsort(p)
    q = np.minimum.accumulate((p[o] * len(p) / np.arange(1, len(p) + 1))[::-1])[::-1]
    out = np.empty_like(q); out[o] = np.minimum(q, 1.0)
    return out

print("raw p < 0.05      :", (p < 0.05).sum())        # 946
print("Bonferroni < 0.05 :", (p < 0.05 / n).sum())    # 0
print("BH padj < 0.05    :", (bh(p) < 0.05).sum())    # 0
print("smallest raw p    :", f"{p.min():.2e}")        # 1.83e-05
```

946 against the 1,000 the arithmetic predicted, and both corrections return nothing, which is the right answer. The smallest p-value in the run was **1.83 × 10⁻⁵**, and it came from noise. In a table of twenty thousand genes, p = 0.00002 on its own is not evidence of anything. (`statsmodels.stats.multitest.multipletests(p, method="fdr_bh")` does the same thing if you have it installed; BH is four lines, so it is not worth a dependency.)

<figure>
<img src="/assets/fig/multiple-testing.svg" alt="A p-value histogram of 20,000 null tests plus 300 real effects, and the Benjamini-Hochberg cutoff on the sorted p-values" loading="lazy" />
<figcaption><b>The 946 false positives are the flat part, spread evenly across the whole range.</b> Same seed as the code above, with 300 genes carrying a real effect added to the 20,000 null tests. Left: null p-values are flat everywhere, and the real effects pile into the first bin. Right: BH walks up the sorted p-values until they cross the <i>i/m</i>&nbsp;&middot;&nbsp;&alpha; line and stops at rank 147 &mdash; 140 of those are real and 7 are not, a realised FDR of 4.8% against the 5% promised. Bonferroni&rsquo;s flat threshold of 2.5&nbsp;&times;&nbsp;10&#8315;&#8310; finds 6 of the same 300.</figcaption>
</figure>

## Where this goes wrong in practice

- **p-hacking.** Testing until something is significant — more covariates, another normalisation, dropping the awkward sample — and reporting only the run that worked. The reported p-value is then a p-value for a single test you did not perform.
- **Reporting the unadjusted p-value next to an adjusted threshold.** "FDR < 0.05, 3,200 genes" where the 3,200 was counted on the `pvalue` column. Check which column a gene count came from; it is a common mix-up in figure legends.
- **Filtering on something related to the test statistic before testing.** Dropping genes with zero counts in every sample is fine — that filter does not know about the groups, and DESeq2's independent filtering is designed to work this way. Dropping genes by fold change or by group-wise mean before testing is not: the test then runs on a set chosen for looking different, and the p-values are no longer valid.
- **Switching to a one-sided test after seeing the direction.** It halves the p-value for free. Decide the sidedness from the hypothesis, before looking.
- **Assuming the tests are independent.** They are not — co-regulated genes rise and fall together, and overlapping gene sets share members outright. Correlation among tests makes standard FDR control conservative rather than anti-conservative, so it is the safer failure, but it does mean the real proportion of false discoveries is not the nominal one. The [gene sets note](../gene-sets-en/) hits the same problem from the enrichment side.

## Confidence intervals

A 95% confidence interval (CI) carries two things a p-value cannot: the estimate itself, and how precisely you know it. "logFC = 0.3, 95% CI [0.28, 0.32]" and "logFC = 0.3, 95% CI [0.01, 0.59]" give the same significant verdict and describe entirely different states of knowledge. A wide interval that excludes zero is a weak result dressed as a strong one, and a narrow interval straddling zero is real evidence that the effect is small — which a non-significant p-value never tells you apart from having no data.

Reporting the interval is almost always better than reporting the p-value. Shrunken logFC estimates with standard errors, which DESeq2 gives you by default, are the practical version of this in a DE table.

## Summary

- A p-value is P(data this extreme | null hypothesis true) — **not** P(null true), not the chance of a fluke, not an effect size
- **0.05 is a convention.** 0.049 and 0.051 are the same evidence; report the number, not the verdict
- Significance scales with sample size, so **effect size is the other half** — logFC does not care how many cells you have
- Filter DE results on a p-value threshold **and** an effect-size threshold, together
- 20,000 genes at α = 0.05 gives **1,000 false positives for free**; the simulation produced 946
- **Bonferroni controls FWER** (any false positive), **BH controls FDR** (the proportion among hits); genomics uses BH
- **`padj` < 0.05 is a property of the list, not of a row** — about 5% of your calls are wrong, not each call 5% likely wrong
- Correlated tests make FDR control **conservative**, which is the safe direction but not the nominal one
- A **confidence interval** says what the p-value leaves out; report it when you can

## References

- Benjamini & Hochberg, [Controlling the false discovery rate: a practical and powerful approach to multiple testing](https://doi.org/10.1111/j.2517-6161.1995.tb02031.x), *J. R. Stat. Soc. B* (1995) — where `padj` comes from
- Wasserstein & Lazar, [The ASA statement on p-values: context, process, and purpose](https://doi.org/10.1080/00031305.2016.1154108), *Am. Stat.* (2016) — the official list of what a p-value is not
- Storey & Tibshirani, [Statistical significance for genomewide studies](https://doi.org/10.1073/pnas.1530509100), *PNAS* (2003) — FDR as genomics actually uses it, and the q-value
- Squair et al., [Confronting false discoveries in single-cell differential expression](https://doi.org/10.1038/s41467-021-25960-2), *Nat. Commun.* (2021) — where the impossible p-values come from
