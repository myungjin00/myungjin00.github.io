---
title: "R에서 실제로 쓰는 명령어"
date: 2026-07-17
description: "Python을 쓰던 사람을 위한 R · 다섯 가지 자료 구조 · dplyr 동사와 파이프 · factor라는 고전적 함정 · CRAN과 Bioconductor 설치 · DESeq2 한 세션 전체 · 재현을 위해 남겨야 할 것"
category: tutorial
updated: 2026-08
lang: ko
group: r-basics
topic: R
tags: [R, dplyr, Bioconductor, DESeq2]
---

이 분야에서 R로 오는 경로는 대개 하나다. Python에는 없는 통계 방법이나 Bioconductor annotation 자료가 필요해서다.

먼저 몸에 익혀 둘 구조적 사실 하나. <mark class="blue">**R은 1부터 세고, 거의 모든 것이 벡터다.**</mark> scalar는 길이 1짜리 벡터다. 연산은 기본적으로 전체에 퍼진다. 반복문은 대개 필요한 답이 아니다.

## 다섯 가지 구조

| 구조 | 무엇 | Python 대응 |
| --- | --- | --- |
| **vector** | 같은 타입 1차원 | `np.array` |
| **list** | 타입 섞인 컨테이너 | `list` / `dict` |
| **matrix** | 같은 타입 2차원 | `np.ndarray` (2D) |
| **data.frame** | 타입이 다른 열들 | `pd.DataFrame` |
| **factor** | 수준 (level)이 고정된 범주형 | `pd.Categorical` |

```r
x <- c(2, 7, 1, 8)        # vector
x[1]                      # 2   -- 1부터 센다
x[-1]                     # 7 1 8  -- 음수는 뒤에서가 아니라 '제거'
x[x > 2]                  # 7 8
length(x); sum(x); mean(x)
```

Python 쓰던 사람이 가장 먼저 밟는 게 `x[-1]`이다. R에서 음수 인덱스는 그 원소를 빼라는 뜻이다.

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

`str()`은 data.frame이든 모델 적합 결과든 Seurat 객체든 "이게 대체 뭔가"에 답해 준다.

| 알고 싶은 것 | 호출 |
| --- | --- |
| 아무 객체의 구조 | `str(x)` |
| 앞/뒤 몇 행 | `head(x)`, `tail(x)` |
| 크기 | `dim(x)`, `nrow(x)`, `ncol(x)` |
| 열·행 이름 | `colnames(x)`, `rownames(x)` |
| 타입 | `class(x)` |
| 요약 통계 | `summary(x)` |
| S4 객체의 슬롯 — S4는 Bioconductor 객체가 쓰는 클래스 체계이고, 그 필드를 슬롯이라 부른다 | `slotNames(x)` |
| 도움말 | `?함수명`, `vignette(package = "DESeq2")` |

## dplyr과 파이프

base R의 부분 선택으로도 되지만, 분석 코드는 이제 압도적으로 dplyr로 쓰인다.

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

| 동사 | 하는 일 |
| --- | --- |
| `filter()` | 행 고르기 |
| `select()` | 열 고르기 |
| `mutate()` | 열 추가·변경 |
| `arrange()` | 정렬 |
| `group_by()` + `summarise()` | split–apply–combine |
| `left_join()` | 키로 병합 |
| `pivot_longer()` / `pivot_wider()` | 모양 바꾸기 (tidyr) |

`|>`는 R 4.1부터 들어온 기본 파이프다. `x |> f(y)`는 `f(x, y)`가 된다. magrittr의 `%>%`도 같은 일을 하고 아직 사방에 있지만, 새 코드에는 `|>`를 쓴다.

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

`tibble`은 출력이 깔끔하고 추측을 덜 하는 data.frame이다. base R이 조용히 변환해 버릴 자리에서 tibble은 오류를 낸다.

## factor

틀린 값을 조용히 내놓는 함정이다.

```r
> f <- factor(c("ctrl", "treat", "ctrl"))
> levels(f)
[1] "ctrl"  "treat"

> as.numeric(factor(c("10", "5", "20")))
[1] 1 3 2        # 숫자가 아니라 수준 (level) 번호
```

두 번째 줄이 고전적인 버그다. factor를 바로 numeric으로 바꾸면 내부 코드가 나온다. 올바른 형태는 `as.numeric(as.character(f))`다.

<mark>**첫 번째 수준이 모든 모델 공식의 기준** (reference)이 된다.</mark> `~ condition`은 나머지 수준을 전부 1번 수준과 비교하고, `levels()`의 기본 순서는 알파벳순이다. 그래서 "control" vs "treated"는 운 좋게 맞고, "KO" (knockout) vs "WT" (wild type)는 조용히 WT를 KO와 비교하게 된다. 명시적으로 정한다.

```r
dds$condition <- relevel(dds$condition, ref = "control")
```

## 공식 (formula)

`~`는 R의 모델 명세 문법이고, R에서 통계 코드가 짧은 이유다.

```r
lm(y ~ x)              # x로 y를
lm(y ~ x + batch)      # batch 보정
lm(y ~ x * batch)      # 교호작용까지
~ batch + condition    # DESeq2 design: batch 보정한 condition
```

마지막 줄이 RNA-seq에서 가장 자주 쓰는 design이다. [차등 발현 도구](../de-tools-ko/) 글에서 다뤘다.

## 패키지 설치

저장소가 두 개고 명령도 두 개다.

```r
install.packages("dplyr")                  # CRAN (Comprehensive R Archive Network)

if (!require("BiocManager")) install.packages("BiocManager")
BiocManager::install("DESeq2")             # Bioconductor -- 생물정보
```

Bioconductor는 1년에 두 번 배포하고 패키지 전체가 함께 버전이 매겨진다. 그래서 <mark>**Bioconductor 버전을 섞으면 안 된다.**</mark> `BiocManager::valid()`가 현재 설치가 일관적인지 알려 준다.

```r
remotes::install_github("satijalab/seurat")   # 개발 버전
renv::init()                                   # 프로젝트별 라이브러리, venv와 같은 역할
```

`renv`가 R의 환경 도구다. 프로젝트에 자기 라이브러리와 lock 파일을 준다. [Python 쪽](../conda-environments-ko/)에서 conda가 하는 역할과 같다.

## DESeq2 한 세션 전체

```r
library(DESeq2)

dds <- DESeqDataSetFromMatrix(countData = counts,
                              colData   = meta,
                              design    = ~ batch + condition)
dds$condition <- relevel(dds$condition, ref = "control")
dds <- dds[rowSums(counts(dds)) >= 10, ]      # 거의 빈 유전자 제거
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

진행 출력 여섯 줄이 방법 전부다. 시퀀싱 깊이 (sequencing depth) 보정 → 유전자별 dispersion 추정 → 전체 경향 쪽으로 축소 → 검정. 경고가 찍히면 읽어야 한다. "few genes with a dispersion estimate"는 보통 반복 수가 너무 적다는 뜻이다.

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

기본 임계값이 0.05가 아니라 `padj < 0.1`이다. 0.05로 보고할 거라면 `results()`에 `alpha = 0.05`를 넘겨야 한다. 안 그러면 DESeq2가 내부에서 하는 필터링은 0.1에 맞춰져 있는데 보고는 0.05로 하게 된다.

count가 적은 유전자는 fold change가 과장되어 나오므로, 효과 크기로 순위를 매기기 전에 축소한다.

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

## 그림

DE 결과를 처음 보는 방식은 volcano plot이다. 가로축이 효과 크기, 세로축이 유의성이고, 코드는 이게 전부다.

```r
library(ggplot2)

ggplot(as.data.frame(res), aes(log2FoldChange, -log10(padj))) +
  geom_point(aes(colour = padj < 0.05), size = 0.6, alpha = 0.6) +
  scale_colour_manual(values = c("grey70", "#8c4a32"), guide = "none") +
  labs(x = "log2 fold change", y = "-log10 adjusted p") +
  theme_bw(base_size = 11)
```

문법은 늘 같다. 데이터, 열을 시각 채널에 연결하는 `aes()`, 그 위에 `+`로 쌓는 `geom_*` 층.

## 재현성

```r
> sessionInfo()
R version 4.4.1 (2024-06-14)
Platform: x86_64-pc-linux-gnu
...
other attached packages:
[1] DESeq2_1.44.0  SummarizedExperiment_1.34.0  dplyr_1.1.4  ggplot2_3.5.1
```

분석 스크립트 끝마다 `sessionInfo()`를 찍고 출력을 남긴다. 결과를 추적 가능하게 만드는 가장 작은 장치이고, 논문 method에 필요한 게 보통 정확히 이 버전 목록이다.

## 정리

- R은 1부터 세고 벡터가 기본. `x[-1]`은 뒤에서가 아니라 **제거**
- 모르는 객체는 일단 `str()`
- 분석 코드는 dplyr 동사 + `|>`로 쓴다
- **factor**: `as.numeric()`은 수준 번호를 주고, 1번 수준이 모델의 기준이다 — `relevel()`로 의도를 못 박는다
- `~` 공식이 모델 명세 전부. 기억할 하나는 `~ batch + condition`
- CRAN은 `install.packages()`, Bioconductor는 `BiocManager::install()`, 버전 섞지 않기
- DESeq2 기본은 `padj < 0.1` — 0.05로 보고하려면 `alpha`를 넘길 것
- 스크립트 끝은 항상 `sessionInfo()`

## 참고

- Wickham & Grolemund, [R for Data Science](https://r4ds.hadley.nz/) — 표준 입문서
- [Bioconductor](https://bioconductor.org/) · [DESeq2 vignette](https://bioconductor.org/packages/DESeq2/)
- [dplyr](https://dplyr.tidyverse.org/) · [ggplot2](https://ggplot2.tidyverse.org/) · [renv](https://rstudio.github.io/renv/)
- Love, Huber & Anders, [Moderated estimation of fold change and dispersion for RNA-seq data with DESeq2](https://doi.org/10.1186/s13059-014-0550-8), *Genome Biol.* (2014)
