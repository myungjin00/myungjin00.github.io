---
title: "알아 두면 좋은 Python 라이브러리"
date: 2026-05-15
description: "용도별로 정리한 핵심 스택 · 분자 쪽 RDKit·PyTorch Geometric·DeepChem · 오믹스 쪽 Scanpy·PyDESeq2 · Polars와 uv가 무엇을 대체하는가 · 하루 안에 본전을 뽑는 작은 라이브러리들"
category: tutorial
updated: 2026-06
lang: ko
group: py-libs
topic: Python
tags: [RDKit, PyTorch Geometric, Scanpy, tooling]
---

패키지별로 안에 무엇이 들어 있는지는 — 시각화 쪽을 포함해서 — [라이브러리 목록 페이지](../libraries/)에 따로 정리해 두었다.

<mark>라이브러리 목록은 **각 라이브러리가 무엇을 대신해 주는지**를 같이 적어야 쓸 만하다.</mark> 아래는 인기 순이 아니라 용도별로 나눴다.

## 기본 패키지

| 라이브러리 | 용도 | 메모 |
| --- | --- | --- |
| NumPy | 배열, 선형대수 | 나머지 전부가 이 위에 서 있다 |
| pandas | 표 형식 (tabular) 데이터 | 기본 선택. 10 GB를 넘어가면 느려진다 |
| Polars | 표 형식 데이터 | Rust 기반, 멀티스레드, lazy 실행. 큰 파일에서 차이가 크다 |
| SciPy | 통계, 희소 행렬 (sparse matrix), 최적화 | single-cell 데이터는 `scipy.sparse` 형태로 다룬다 |
| scikit-learn | 전통적인 머신러닝, 데이터 분할, 평가 지표 | 반드시 이겨야 하는 베이스라인 (baseline) |

`scikit-learn`은 따로 한마디 할 만하다. 단순한 모델 모음이 아니다. `train_test_split`·`Pipeline`·`cross_val_score`와 metrics 모듈이 어떤 모델을 쓰든 평가를 올바르게 해 주는 뼈대다.

```python
from sklearn.datasets import load_diabetes
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import cross_val_score

X, y = load_diabetes(return_X_y=True)
s = cross_val_score(RandomForestRegressor(random_state=0), X, y, cv=5, scoring="r2")
print("R2 per fold:", [round(float(v), 3) for v in s])
print("mean %.3f +/- %.3f" % (s.mean(), s.std()))
```

```
R2 per fold: [0.378, 0.511, 0.433, 0.353, 0.441]
mean 0.423 +/- 0.055
```

5-fold 한 줄, 그리고 0.01 개선이 의미가 있는지 알려 주는 표준편차. <mark class="blue">보고되는 개선의 대부분이 이 한 줄을 못 넘는다.</mark>

## 분자

**RDKit**이 이 분야 전부다. 파싱, [디스크립터와 지문](../descriptors-fingerprints-ko/), 부분구조 검색, scaffold, 그리기, conformer까지.

```python
from rdkit import Chem
from rdkit.Chem import Descriptors, rdFingerprintGenerator

m = Chem.MolFromSmiles("CC(=O)Oc1ccccc1C(=O)O")      # 아스피린
print("formula :", Chem.rdMolDescriptors.CalcMolFormula(m))
print("MW      :", round(Descriptors.MolWt(m), 2))
print("logP    :", round(Descriptors.MolLogP(m), 2))
print("TPSA    :", round(Descriptors.TPSA(m), 2))
print("HBD/HBA :", Descriptors.NumHDonors(m), "/", Descriptors.NumHAcceptors(m))

gen = rdFingerprintGenerator.GetMorganGenerator(radius=2, fpSize=2048)
fp = gen.GetFingerprint(m)
print("ECFP4   :", fp.GetNumBits(), "bits,", fp.GetNumOnBits(), "on")
```

```
formula : C9H8O4
MW      : 180.16
logP    : 1.31
TPSA    : 63.6
HBD/HBA : 1 / 3
ECFP4   : 2048 bits, 24 on
```

이 출력에서 가져갈 게 두 가지다. `MolFromSmiles`는 잘못된 SMILES (simplified molecular-input line-entry system) 문자열에 예외를 던지지 않고 `None`을 반환한다. 확인하지 않으면 `None`이 조용히 파이프라인 끝까지 흘러간다. 그리고 작은 분자의 ECFP4는 2048 bit 중 **24개만 켜진다.** 이 벡터가 극단적으로 희소하다는 뜻이고, 여기에 유클리드 거리가 아니라 Tanimoto를 쓰는 이유다.

| 라이브러리 | 용도 |
| --- | --- |
| RDKit | 화학정보학 전반 |
| PyTorch Geometric (PyG) | 그래프 신경망 |
| DGL | 그래프 신경망, 다른 API |
| DeepChem | 데이터셋 + split 함수 + 기준 모델 |
| Chemprop | 결합 단위 directed message passing. 물성 예측 베이스라인으로 강하다 |
| TorchDrug | 분자와 지식 그래프용 데이터셋·모델 모음 |
| MolVS / RDKit standardiser | 다른 작업을 하기 전 구조 정규화 |
| datamol | RDKit을 간단하게 감싼 wrapper |

**DeepChem**은 데이터 split 기능 하나만으로도 설치할 만하다. scaffold split과 MoleculeNet 로더가 논문이 쓴 방식 그대로 들어 있다. <mark>scaffold split을 직접 다시 구현하는 것이야말로 벤치마크 숫자가 조용히 비교 불가능해지는 경로다.</mark>

## 그래프와 딥러닝

모델은 PyTorch, 그래프 층과 배치는 PyTorch Geometric.

```python
import torch
from torch_geometric.data import Data

ei = torch.tensor([[0, 1, 1, 2], [1, 0, 2, 1]])   # 2 x num_edges
x  = torch.randn(3, 8)                             # node 3개, 특징 8차원
d  = Data(x=x, edge_index=ei)
print(d)
print("nodes", d.num_nodes, "| edges", d.num_edges, "| undirected", d.is_undirected())
```

```
Data(x=[3, 8], edge_index=[2, 4])
nodes 3 | edges 4 | undirected True
```

`edge_index`는 `[2, edge 개수]`이고, 무방향 edge는 **양쪽 방향으로 두 번** 들어간다. PyG의 `Batch`는 작은 그래프 여러 개를 padding 없이 연결되지 않은 큰 그래프 하나로 쌓는다. 분자 그래프가 애초에 효율적으로 배치되는 이유가 이것이다.

| 라이브러리 | 용도 |
| --- | --- |
| PyTorch | 모델과 학습 |
| PyG / DGL | [그래프 층](../gnn-ko/), 배치, pooling |
| Lightning | 학습 루프 보일러플레이트 제거 |
| Hugging Face Transformers | 사전학습된 SMILES·단백질 언어 모델 |
| Optuna | [하이퍼파라미터 탐색](../hyperparameter-search-ko/). 나쁜 trial은 중간에 끊는다 |
| Weights & Biases / TensorBoard | 실행 기록 |
| Hydra / OmegaConf | argparse 플래그 40개 대신 설정 파일 |

Lightning에는 단서를 붙여야 한다. 평범한 지도학습 훈련에서는 시간을 크게 아껴 주지만, 학습 루프 자체가 연구 대상일 때는 짐이 된다. 손실 스케줄을 직접 짜거나 다단계 사전학습을 하는 경우엔 순수 PyTorch가 디버깅하기 쉽다.

## 오믹스

| 라이브러리 | 용도 | R 대응 |
| --- | --- | --- |
| Scanpy | single-cell 분석 | Seurat |
| AnnData | single-cell 데이터 컨테이너 | `SingleCellExperiment` |
| PyDESeq2 | [차등 발현](../de-tools-ko/) | DESeq2 |
| scVI-tools | 심층 생성 모델, 배치 통합 | — |
| gseapy | enrichment 분석 — GSEA (gene set enrichment analysis), Enrichr | clusterProfiler |
| muon | multi-modal — RNA, ATAC (assay for transposase-accessible chromatin), 단백질 | Seurat v5 |
| pertpy | perturbation 분석 | — |

[R과 Python](../r-vs-python-ko/) 글의 결론이 여기서도 그대로다. 통계와 annotation 패키지는 R이 두텁고, 모델과 이어 붙여야 하는 건 Python이 쉽다.

## 작은 라이브러리들

하루 안에 본전을 뽑는 쪽이다.

| 라이브러리 | 무엇을 대체하나 |
| --- | --- |
| tqdm | 직접 카운터를 출력하고 남은 시간을 짐작하던 것 |
| joblib | 직접 작성한 `multiprocessing.Pool`, 그리고 디스크 캐시 |
| rich | `print` 디버깅, 표를 직접 정렬해서 출력하던 것 |
| typer | CLI (command-line interface)용 `argparse` 보일러플레이트 |
| pathlib (표준) | `os.path.join` 사슬 |
| ruff | flake8 + isort + black 세 개를 하나로 |
| pytest | 직접 실행하던 `assert` 스크립트 |
| pyarrow / Parquet | 두 번 이상 읽을 파일에 쓰던 CSV |

이 중 두 가지는 코드가 아니라 작업 습관을 바꾼다. 중간 파일을 **CSV 대신 Parquet**으로 두면 타입이 보존되고 압축되며 읽기가 대략 10배 빨라진다. 중간 파일은 여러 번 읽히기 때문에 이게 누적된다. ruff는 도구 셋을 하나로 줄이고, 저장할 때마다 돌려도 될 만큼 빠르다.

## 비슷한 라이브러리 둘 중 고르기

| 선택 | 무엇을 | 이유 |
| --- | --- | --- |
| pandas vs Polars | 기본은 pandas, 느려지면 Polars | 생태계가 넓다. 파일이 커지면 갈아탄다 |
| PyG vs DGL | PyG | 분자 머신러닝 코드가 이쪽을 더 많이 쓴다 |
| matplotlib vs plotnine | matplotlib + seaborn | 최종 그림은 세밀한 조정이 필요하다 |
| argparse vs typer vs Hydra | CLI는 typer, 실험은 Hydra | 애초에 다른 일 |
| pip vs conda vs uv | [환경 관리](../conda-environments-ko/) 참고 | 네이티브 의존성이 있느냐로 갈린다 |

## 정리

- NumPy / pandas / SciPy / scikit-learn이 기본. `cross_val_score` + 표준편차 한 줄이 상상 속 개선 대부분을 걸러낸다
- **RDKit**이 화학정보학 전부. 파싱 후 `None` 확인, 지문은 매우 희소하다는 것
- 그래프는 **PyG**. `edge_index`는 `[2, E]`이고 무방향 edge는 두 번 들어간다
- **DeepChem**은 split 기능과 MoleculeNet 로더 때문에 쓴다. 벤치마크 숫자를 비교 가능하게 유지하는 장치다
- 오믹스는 **Scanpy / AnnData / PyDESeq2**. 통계와 annotation은 여전히 R이 낫다
- tqdm·joblib·rich·typer·ruff·pytest·Parquet — 작고, 바로 본전을 뽑는다

## 참고

- [RDKit 문서](https://www.rdkit.org/docs/) · [RDKit cookbook](https://www.rdkit.org/docs/Cookbook.html)
- [PyTorch Geometric](https://pytorch-geometric.readthedocs.io/) · [DeepChem](https://deepchem.readthedocs.io/)
- [Scanpy](https://scanpy.readthedocs.io/) · [AnnData](https://anndata.readthedocs.io/) · [PyDESeq2](https://pydeseq2.readthedocs.io/)
- [scikit-learn 사용자 가이드](https://scikit-learn.org/stable/user_guide.html) · [Polars](https://docs.pola.rs/) · [ruff](https://docs.astral.sh/ruff/)
