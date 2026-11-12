---
title: "R과 Python, 언제 무엇을"
date: 2026-03-20
description: "통계와 생물정보는 R, 머신러닝과 파이프라인은 Python · Seurat과 Scanpy의 차이 · 한 분석 안에서 둘을 오가는 방법 · 언어를 바꿀 때 실제로 드는 비용"
category: tutorial
updated: 2026-04
lang: ko
group: r-python
topic: Bioinformatics
subtopic: Transcriptomics
tags: [R, Python, Seurat, Scanpy]
---

"무엇이 더 나은가"는 답이 없는 질문이다. 생물정보 분석에서 둘은 서로 다른 생태계를 갖고 있고, 선택은 대개 **하려는 일이 어느 쪽 생태계에 있는가**로 결정된다.

## 어느 쪽에 무엇이 있나

| 하려는 일 | 어디에 있나 |
| --- | --- |
| 차등 발현 (differential expression), 통계 모델 | **R** — DESeq2, edgeR, limma |
| annotation·참조 데이터 | **R** — Bioconductor 2,000개 이상 패키지 |
| 통계 그래픽 | **R** — ggplot2 |
| single-cell 분석 | **둘 다** — Seurat (R) / Scanpy (Python) |
| 머신러닝·딥러닝 | **Python** — scikit-learn, PyTorch |
| 화학정보학 (cheminformatics) | **Python** — RDKit |
| 파이프라인·자동화 (automation) | **Python** |
| 대규모 데이터 처리 | **Python** (또는 R의 data.table) |

경계가 분명하다. <mark class="blue">통계와 생물정보 패키지는 R에 두텁게 쌓여 있고, 머신러닝과 일반 프로그래밍은 Python이 압도한다.</mark>

분자 쪽 작업이 Python으로 기우는 이유도 여기 있다. RDKit·PyTorch Geometric·DeepChem이 전부 Python이다. 반대로 RNA-seq에서 DESeq2를 쓰지 않을 이유를 찾기 어렵다.

## Seurat과 Scanpy

single-cell은 둘이 정면으로 겹치는 거의 유일한 영역이다.

| | Seurat (R) | Scanpy (Python) |
| --- | --- | --- |
| 자료 구조 (data structure) | `Seurat` 객체 | `AnnData` |
| 스타일 | 각 단계가 객체를 반환 | 객체를 제자리에서 수정 |
| 그림 | ggplot2 기반, 손보기 쉬움 | matplotlib 기반 |
| 큰 데이터 | 메모리에 올림 | 행렬을 디스크에 둘 수 있음(`backed` 모드) |
| 배치 통합 (batch integration) | Seurat anchors, Harmony | Harmony, scVI, BBKNN |
| 생태계 | Bioconductor와 자연스럽게 연결 | 딥러닝 도구와 자연스럽게 연결 |

표준 single-cell 파이프라인 — 정규화, 변동 큰 유전자 선택, PCA (principal component analysis), 이웃 그래프, 클러스터링 — 은 양쪽이 거의 같은 모양으로 읽힌다.

```r
# Seurat
obj <- NormalizeData(obj) |> FindVariableFeatures() |> ScaleData() |> RunPCA()
obj <- FindNeighbors(obj, dims = 1:30) |> FindClusters(resolution = 0.5)
```

```python
# Scanpy — 같은 흐름
sc.pp.normalize_total(ad); sc.pp.log1p(ad)
sc.pp.highly_variable_genes(ad); sc.pp.pca(ad)
sc.pp.neighbors(ad, n_pcs=30); sc.tl.leiden(ad, resolution=0.5)
```

## 객체 안을 열어 보면

두 객체가 같은 것을 다르게 담는다. `AnnData`를 실제로 찍어 보면 이렇다.

```python
import anndata as ad
adata = ad.read_h5ad("pbmc.h5ad")
print(adata)
```

```
AnnData object with n_obs × n_vars = 2638 × 1838
    obs: 'sample_id', 'cell_type', 'n_genes'
    var: 'gene_ids'
    obsm: 'X_pca'
    layers: 'counts'
```

**행이 세포, 열이 유전자**이고 나머지는 그 두 축에 붙는 annotation이다.

| 자리 | 모양 | 무엇 |
| --- | --- | --- |
| `.X` | 2638 × 1838 | 발현 행렬 (보통 정규화된 값) |
| `.layers["counts"]` | 2638 × 1838 | 같은 모양의 다른 버전 — 원본 count |
| `.obs` | 2638 × 3 | 세포별 metadata (`sample_id`, `cell_type` …) |
| `.var` | 1838 × 1 | 유전자별 metadata |
| `.obsm["X_pca"]` | 2638 × 50 | 세포별 벡터 — PCA, UMAP (uniform manifold approximation and projection) |
| `.uns` | dict | 나머지 전부 (색 팔레트, 파라미터 기록) |

```python
>>> adata.obs.head(3)
       sample_id cell_type  n_genes
cell_0    ctrl_2    B cell      633
cell_1      tx_1        NK      614
cell_2      tx_1        NK      585
```

`.obs`가 그냥 `DataFrame`이라는 점이 중요하다. pandas로 하던 걸 그대로 하면 된다. `adata[adata.obs.cell_type == "T cell"]`처럼 자르면 행렬·metadata·embedding이 같이 잘린다.

Seurat 객체도 같은 내용을 담지만 이름이 다르다.

| Seurat | AnnData | 메모 |
| --- | --- | --- |
| `pbmc[["RNA"]]$counts` | `.layers["counts"]` | Seurat은 **유전자 × 세포** (전치되어 있다) |
| `pbmc[["RNA"]]$data` | `.X` | 정규화된 값 |
| `pbmc@meta.data` | `.obs` | 둘 다 data.frame |
| `Embeddings(pbmc, "pca")` | `.obsm["X_pca"]` | |
| `Idents(pbmc)` | `.obs["leiden"]` | 현재 군집 라벨 |
| assay 여러 개 | `.obsm` / `MuData` | RNA + ADT (antibody-derived tag) 같은 multi-modal |

> 자주 걸리는 함정은 행과 열의 방향이다. Seurat은 유전자 × 세포, AnnData는 세포 × 유전자다. 변환 도구가 알아서 바꿔 주지만, 행렬을 직접 꺼내 쓸 때는 `dim()`을 한 번 찍어 확인하는 게 빠르다.

단계는 사실상 같다. <mark>결과가 완전히 일치하지는 않는데, 기본값과 구현 세부가 다르기 때문이다. 그래서 두 도구의 결과를 한 논문에서 섞어 쓰면 안 된다.</mark>

<figure>
<img src="/assets/fig/seurat-anndata.svg" alt="A slot-by-slot mapping between a Seurat object and an AnnData object" loading="lazy" />
<figcaption><b>같은 실험, 두 개의 객체.</b> 자리마다 같은 것을 다른 이름으로 담고 있다. 함정은 방향이다. Seurat은 유전자 &times; 세포로, AnnData는 세포 &times; 유전자로 저장한다.</figcaption>
</figure>

## 둘을 오가기

현실의 분석은 한쪽에서 끝나지 않는다. Scanpy로 군집을 잡고 DESeq2로 검정하는 일이 흔하다. 방법은 세 가지다.

**1. 파일로 주고받기 (가장 튼튼함)**

```python
adata.write_h5ad("data.h5ad")
# R: zellkonverter::readH5AD("data.h5ad")
```

각 언어가 자기 환경에서 돌아서 의존성 충돌이 없다. 중간 파일이 남는 것도 재현에는 오히려 장점이다.

**2. 같은 세션에서 호출**

```r
library(reticulate)
sc <- import("scanpy")
```

R에서 Python을, Python에서 R을(`rpy2`) 부를 수 있다. 편하지만 **환경이 꼬이기 쉽다.** 특히 conda와 섞이면 디버깅이 괴롭다.

**3. 한쪽 구현으로 통일**

PyDESeq2처럼 재구현이 있으면 언어를 넘지 않아도 된다. 다만 [앞 글](../de-tools-ko/)에서 말했듯 기능이 완전히 같지는 않다.

> 파이프라인이 길어질수록 파일 교환이 안전하다. 중간 파일마다 어느 단계의 결과인지가 그대로 남기 때문이다.

## 언어를 바꿀 때 드는 비용

"Python으로 통일하자"는 생각이 들 때 실제로 드는 비용은 이렇다.

- **R에만 있는 도구를 포기해야 한다.** Bioconductor의 annotation 자료나 특정 통계 모델은 대체재가 없는 경우가 많다.
- **재현성 (reproducibility)이 끊긴다.** 기존 분석을 다시 돌릴 수 없게 된다.
- **검증 부담이 생긴다.** 재구현한 결과가 원래와 같은지 확인해야 한다.

반대로 Python으로 옮겨서 얻는 것은 **파이프라인 통합**이다. 전처리·모델·평가가 한 언어 안에 있으면 자동화와 재현이 훨씬 쉽다.

둘 다 맞다. 그래서 **분석 단위로 정하되 한 분석 안에서는 섞지 않는** 쪽이 현실적이다.

## 정리

- R은 **통계와 생물정보**, Python은 **머신러닝과 파이프라인** — 생태계가 결정한다
- single-cell은 Seurat/Scanpy가 겹치지만 결과가 미세하게 다르니 **섞지 말 것**
- 오갈 때는 `h5ad` 파일 교환이 가장 튼튼하다
- `reticulate`·`rpy2`는 편하지만 환경 문제를 부른다
- 언어 통일의 비용은 **포기하는 도구와 재현성**이고, 이득은 **파이프라인 통합**이다

## 참고

- [Scanpy 문서](https://scanpy.readthedocs.io/) · [Seurat 문서](https://satijalab.org/seurat/)
- [zellkonverter](https://bioconductor.org/packages/zellkonverter/) — `AnnData` ↔ `SingleCellExperiment` 변환
- [reticulate](https://rstudio.github.io/reticulate/) · [rpy2](https://rpy2.github.io/)
- Heumos et al., [Best practices for single-cell analysis across modalities](https://doi.org/10.1038/s41576-023-00586-w), *Nat. Rev. Genet.* (2023)
