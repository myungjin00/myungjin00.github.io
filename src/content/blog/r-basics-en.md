---
title: "R commands you actually need"
date: 2026-07-17
description: "R for someone who already writes Python · the five data structures · dplyr verbs and the pipe · factors, the classic trap · installing from CRAN and Bioconductor · a DESeq2 session end to end · what to record for reproducibility"
category: tutorial
updated: 2026-08
lang: en
group: r-basics
topic: R
tags: [R, dplyr, Bioconductor, DESeq2]
---

Most people in this field arrive at R from Python, and for one reason: a statistical method or a Bioconductor annotation that has no Python equivalent.

The one structural thing to internalise first: <mark class="blue">**R indexes from 1, and almost everything is a vector.**</mark> A scalar is a length-1 vector. Operations broadcast by default. Loops are rarely what you want.

## The five structures

| Structure | What it is | Python analogue |
| --- | --- | --- |
| **vector** | same-type 1D sequence | `np.array` |
| **list** | mixed-type container | `list` / `dict` |
| **matrix** | same-type 2D | `np.ndarray` (2D) |
| **data.frame** | columns of different types | `pd.DataFrame` |
| **factor** | categorical with fixed levels | `pd.Categorical` |

```r
x <- c(2, 7, 1, 8)        # vector
x[1]                      # 2   -- one-indexed
x[-1]                     # 7 1 8  -- negative means DROP, not from-the-end
x[x > 2]                  # 7 8
length(x); sum(x); mean(x)
```

`x[-1]` is the first thing that bites a Python user. In R a negative index removes that element.

```r
> df <- data.frame(gene = c("TP53", "EGFR", "MYC"),
+                  lfc  = c(-1.8, 2.4, 0.3),
+                  padj = c(1e-6, 3e-4, 0.42))
> df
  gene  lfc   padj
1 TP53 -1.8 1e-06
2 EGFR  2.4 3e-04
3 MYC   0.3 4.2e-01

> str(df)
'data.frame':	3 obs. of  3 variables:
 $ gene: chr  "TP53" "EGFR" "MYC"
 $ lfc : num  -1.8 2.4 0.3
 $ padj: num  1e-06 3e-04 4.2e-01
```

`str()` answers "what is this object actually" for anything — a data.frame, a model fit, a Seurat object.

| Want to know | Call |
| --- | --- |
| structure of anything | `str(x)` |
| first rows | `head(x)`, `tail(x)` |
| dimensions | `dim(x)`, `nrow(x)`, `ncol(x)` |
| column / row names | `colnames(x)`, `rownames(x)` |
| type | `class(x)` |
| summary statistics | `summary(x)` |
| what slots an S4 object has — S4 is the class system Bioconductor objects use, and its fields are called slots | `slotNames(x)` |
| help | `?function`, `vignette(package = "DESeq2")` |

## dplyr and the pipe

Base R subsetting works, but analysis code is overwhelmingly written with dplyr now.

```r
library(dplyr)

res <- df |>
  filter(padj < 0.05) |>
  mutate(direction = if_else(lfc > 0, "up", "down")) |>
  arrange(padj)
```

```
  gene  lfc  padj direction
1 TP53 -1.8 1e-06      down
2 EGFR  2.4 3e-04        up
```

| Verb | Does |
| --- | --- |
| `filter()` | keep rows |
| `select()` | keep columns |
| `mutate()` | add or change a column |
| `arrange()` | sort |
| `group_by()` + `summarise()` | split–apply–combine |
| `left_join()` | merge on a key |
| `pivot_longer()` / `pivot_wider()` | reshape (tidyr) |

`|>` is the base-R pipe, available since R 4.1 — `x |> f(y)` is `f(x, y)`. The older `%>%` from magrittr does the same thing and is still everywhere. Use `|>` in new code.

```r
counts |>
  group_by(cell_type) |>
  summarise(n = n(), mean_expr = mean(expr), .groups = "drop")
```

```
# A tibble: 4 x 3
  cell_type     n mean_expr
  <chr>     <int>     <dbl>
1 B cell      673     0.401
2 Monocyte    702     0.398
3 NK          661     0.392
4 T cell      664     0.404
```

A `tibble` is a data.frame that prints better and does less guessing. Where base R would silently convert, a tibble errors.

## Factors

The trap that silently returns the wrong value.

```r
> f <- factor(c("ctrl", "treat", "ctrl"))
> levels(f)
[1] "ctrl"  "treat"

> as.numeric(factor(c("10", "5", "20")))
[1] 1 3 2        # the level INDEX, not the number
```

The second line is the classic bug. Converting a factor straight to numeric gives you the internal codes. The correct form is `as.numeric(as.character(f))`.

<mark>Factors matter because **the first level is the reference level** in every model formula.</mark> `~ condition` compares every other level against level 1, and `levels()` is alphabetical by default, so "control" vs "treated" happens to work and "KO" (knockout) vs "WT" (wild type) silently compares WT against KO. Set it explicitly:

```r
dds$condition <- relevel(dds$condition, ref = "control")
```

## Formulas

`~` is R's model-specification syntax, and it is why statistical code in R is so short.

```r
lm(y ~ x)              # y on x
lm(y ~ x + batch)      # adjust for batch
lm(y ~ x * batch)      # plus the interaction
~ batch + condition    # DESeq2 design: condition adjusted for batch
```

The last line is the design you will write most often in RNA-seq work — covered in the [differential expression tools](../de-tools-en/) note.

## Installing packages

Two separate repositories, two separate commands.

```r
install.packages("dplyr")                  # CRAN (Comprehensive R Archive Network)

if (!require("BiocManager")) install.packages("BiocManager")
BiocManager::install("DESeq2")             # Bioconductor -- bioinformatics
```

Bioconductor releases twice a year and all its packages are versioned together, so <mark>**do not mix Bioconductor versions**</mark>. `BiocManager::valid()` reports whether your installation is self-consistent.

```r
remotes::install_github("satijalab/seurat")   # development versions
renv::init()                                   # per-project library, like a venv
```

`renv` is the environment tool for R — it gives a project its own library and a lockfile, the same role conda plays on the [Python side](../conda-environments-en/).

## A DESeq2 session end to end

```r
library(DESeq2)

dds <- DESeqDataSetFromMatrix(countData = counts,
                              colData   = meta,
                              design    = ~ batch + condition)
dds$condition <- relevel(dds$condition, ref = "control")
dds <- dds[rowSums(counts(dds)) >= 10, ]      # drop near-empty genes
dds <- DESeq(dds)
```

```
estimating size factors
estimating dispersions
gene-wise dispersion estimates
mean-dispersion relationship
final dispersion estimates
fitting model and testing
```

Those six lines of progress output are the whole method: normalise for depth, estimate per-gene dispersion, shrink it towards the global trend, then test. If a step prints a warning, read it — "few genes with a dispersion estimate" usually means too few replicates.

```r
res <- results(dds, contrast = c("condition", "treated", "control"))
summary(res)
```

```
out of 18342 with nonzero total read count
adjusted p-value < 0.1
LFC > 0 (up)       : 1204, 6.6%
LFC < 0 (down)     : 987, 5.4%
outliers [1]       : 12, 0.065%
low counts [2]     : 3557, 19%
```

Note the default threshold is `padj < 0.1`, not 0.05. Pass `alpha = 0.05` to `results()` if that is what you intend to report, otherwise the filtering DESeq2 applies internally is tuned for 0.1 while you report 0.05.

Fold changes for low-count genes come out exaggerated, so shrink them before ranking anything by effect size:

```r
res <- lfcShrink(dds, coef = "condition_treated_vs_control", type = "apeglm")
as.data.frame(res) |>
  tibble::rownames_to_column("gene") |>
  filter(padj < 0.05, abs(log2FoldChange) > 1) |>
  arrange(padj) |>
  head(3)
```

```
   gene baseMean log2FoldChange     pvalue      padj
1  CYP1A1   842.3           3.41  2.1e-24   7.8e-21
2  SERPINE1 1530.7         -2.18  5.6e-19   1.0e-15
3  IL6       214.9          2.76  3.3e-15   4.1e-12
```

## Plotting

The first look at a DE result is a volcano plot — effect size across, significance up — and this is the whole of it:

```r
library(ggplot2)

ggplot(as.data.frame(res), aes(log2FoldChange, -log10(padj))) +
  geom_point(aes(colour = padj < 0.05), size = 0.6, alpha = 0.6) +
  scale_colour_manual(values = c("grey70", "#8c4a32"), guide = "none") +
  labs(x = "log2 fold change", y = "-log10 adjusted p") +
  theme_bw(base_size = 11)
```

The grammar is always the same: data, `aes()` mapping columns to visual channels, then `geom_*` layers added with `+`.

## Reproducibility

```r
> sessionInfo()
R version 4.4.1 (2024-06-14)
Platform: x86_64-pc-linux-gnu
...
other attached packages:
[1] DESeq2_1.44.0  SummarizedExperiment_1.34.0  dplyr_1.1.4  ggplot2_3.5.1
```

Print `sessionInfo()` at the end of every analysis script and keep the output. It is the smallest thing that makes a result traceable, and the methods section usually needs exactly these version numbers.

## Summary

- R is 1-indexed and vector-first; `x[-1]` **drops** an element
- `str()` first, on anything you do not recognise
- dplyr verbs plus `|>` are how analysis code is written now
- **Factors**: `as.numeric()` on a factor gives level codes, and level 1 is the model's reference — `relevel()` it on purpose
- `~` formulas are the whole model spec; `~ batch + condition` is the one to remember
- CRAN via `install.packages()`, Bioconductor via `BiocManager::install()`, and do not mix Bioconductor versions
- DESeq2 defaults to `padj < 0.1` — set `alpha` if you report 0.05
- End every script with `sessionInfo()`

## References

- Wickham & Grolemund, [R for Data Science](https://r4ds.hadley.nz/) — the standard introduction
- [Bioconductor](https://bioconductor.org/) · [DESeq2 vignette](https://bioconductor.org/packages/DESeq2/)
- [dplyr](https://dplyr.tidyverse.org/) · [ggplot2](https://ggplot2.tidyverse.org/) · [renv](https://rstudio.github.io/renv/)
- Love, Huber & Anders, [Moderated estimation of fold change and dispersion for RNA-seq data with DESeq2](https://doi.org/10.1186/s13059-014-0550-8), *Genome Biol.* (2014)
