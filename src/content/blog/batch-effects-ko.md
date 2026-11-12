---
title: "batch effect, 그리고 integration이 실제로 지우는 것"
date: 2025-12-12
description: "batch effect가 어디서 생기나 · shift는 왜 noise와 다른가 · 보정하기 전에 찾아내는 법 · ComBat·Harmony·Seurat anchor·scVI·fastMNN이 각각 내놓는 것 · 보정된 embedding은 보정된 count가 아니다 · 과보정, 그리고 섞임 점수만으로는 성공이 아닌 이유"
category: concept
updated: 2026-01
lang: ko
group: batch-effects
topic: Bioinformatics
subtopic: Transcriptomics
tags: [batch effects, data integration, scRNA-seq, Harmony]
---

내 작업은 대부분 GEO(Gene Expression Omnibus)에서 공개된 bulk·scRNA-seq(single-cell RNA sequencing) 시리즈를 받아다 노화 관련 [MASLD(metabolic dysfunction-associated steatotic liver disease)](../masld-staging-ko/) 데이터베이스 하나로 쌓는 일이다. 그 데이터셋들은 애초에 서로 합칠 생각으로 모인 게 아니다. 그래서 질문은 batch effect가 있느냐가 아니다. 있다. 문제는 보정이 데이터에 무슨 일을 하는지, 그리고 그 결과물을 뒤의 어느 단계가 써도 되는지다.

## batch effect란 무엇인가

batch effect는 샘플이 무엇인지가 아니라 **언제, 어디서, 어떻게** 처리됐는지를 따라가는 체계적인 변동이다. 재현된다. 같은 재료를 같은 두 파이프라인에 다시 넣으면 같은 차이가 또 나온다.

내가 겪는 골치 순서대로 적으면 이렇다.

- **아예 다른 랩.** 공개 데이터에서는 이게 압도적으로 크고, 변수 하나가 아니다. 아래 항목이 한꺼번에 전부 다른데 무엇이 달랐는지 기록이 없는 상태다.
- **library prep kit의 화학.** 10x Genomics v2와 v3는 포획 효율이 달라서, 같은 세포 유형인데 검출 유전자 수와 0의 비율이 다르게 나온다.
- **조직 해리(dissociation) 프로토콜.** 효소, 온도, 조직이 그 안에 있던 시간. 해리 자체가 스트레스 반응 유전자를 유도하고 따뜻한 프로토콜에서 더 많이 유도된다. 그래서 "활성화 signature"가 프로토콜의 것일 수 있다.
- **시퀀싱 run.** flow cell, 장비, kit lot, depth.
- **조직을 다룬 시간.** 적출에서 동결까지의 분 단위 시간. 간이라면 허혈 시간이 대사 유전자에 그대로 드러난다.
- **실험한 사람.** 피펫팅, 타이밍, 판단이 들어가는 모든 단계의 판단.
- **파이프라인과 annotation 버전.** 두 reference annotation의 유전자 목록이 같지 않으니, batch effect가 "어떤 유전자가 존재하는가"에 들어앉는다. [GEO에서 count까지](../geo-fastq-ko/)에 더 적어 뒀다.

## 그냥 noise가 아닌 이유

noise와 batch는 문제의 모양이 다르다. noise는 대칭이고 평균이 되면 사라진다. 반복을 늘리면 집단 평균이 수렴한다. batch effect는 **shift**다. 한 집단의 샘플 전체를 한 방향으로 밀어 버리므로, 그 batch의 샘플을 늘리면 shift가 더 정확히 추정될 뿐 작아지지 않는다.

더 고약한 성질은 그 shift가 보려는 **생물학과 confound되는** 경우가 많다는 것이다. 결정적인 경우는 구체적이다. 내 데이터에서 MASLD 샘플이 전부 한 연구에서 왔고 대조군이 전부 다른 연구에서 왔다고 하자. 그러면 "연구"와 "질병"이 design matrix의 같은 열이고, 차등 발현으로 나오는 모든 유전자가 둘 중 어느 쪽으로도 똑같이 잘 설명된다.

이건 분석의 문제가 아니라 설계의 문제다. `ComBat`, Harmony, scVI는 그래도 깔끔한 결과를 내놓고, [어떤 설계가 복구 가능한지](../experimental-design-ko/)는 따로 쓴 글이다. 이 글은 그걸 이미 확인했고 답이 "가능"이었다고 가정한다.

## 보정하기 전에 먼저 찾아낸다

방법을 집어 들기 전에 본다. 그림 두 장이면 거의 끝난다. batch로 색칠한 [PCA(principal component analysis)](../dimensionality-reduction-ko/), 그리고 보정 안 한 데이터로 돌린 [군집화](../clustering-ko/) 결과를 샘플과 교차표로 놓은 것.

| 보이는 것 | 보통 무슨 뜻인가 |
| --- | --- |
| PC(principal component) 1이나 2가 조건이 아니라 연구를 가른다 | batch가 생물학보다 전체 분산을 더 많이 차지한다 |
| 군집이 샘플과 거의 일대일로 대응한다 | batch를 군집화한 것이다 |
| 세포 유형이 하나씩이 아니라 연구마다 하나씩 나온다 | 실제 집단을 쪼갤 만큼 shift가 크다 |
| 어떤 군집이 정확히 한 데이터셋에만 있다 | 그 연구만 잡은 집단이거나 artefact다. 이 그림만으로는 구분 못 한다 |
| 세포당 검출 유전자 수가 데이터셋 사이에서 몇 배씩 다르다 | 생물학이 아니라 화학이나 depth다 |
| UMAP(uniform manifold approximation and projection)에서는 batch가 갈리는데 이웃 그래프에서는 섞인다 | 겉보기만인 경우가 많다. 보정 전에 그래프를 확인한다 |

군집 대 샘플 교차표는 내가 아는 가장 값싼 진단이고, 가장 자주 건너뛰는 것이기도 하다.

## 방법들, 그리고 각자 내놓는 것

| 방법 | 무엇을 하나 | 무엇을 내놓나 | 그 결과를 어디에 쓰나 |
| --- | --- | --- | --- |
| **ComBat** / limma `removeBatchEffect` | 유전자별 선형 모형. 각 batch의 평균을, ComBat은 분산까지, 통합 추정치 쪽으로 당긴다. 유전자 전체에 걸쳐 empirical Bayes 축소를 쓴다 | **보정된 발현 행렬** | bulk의 시각화, 군집화, 상관. 검정의 입력으로는 안 된다 |
| **Harmony** | PC 공간에서의 soft 군집화와, 군집별·batch별 offset으로 세포를 보정하는 일을 번갈아 반복한다 | **보정된 embedding이지 보정된 count 행렬이 아니다** | 이웃 그래프, 군집화, UMAP |
| **Seurat CCA(canonical correlation analysis) / RPCA(reciprocal PCA) anchor** | 데이터셋들을 공유 공간에 투영하고, 서로 가장 가까운 이웃인 세포 쌍을 **anchor**로 찾아 그 쌍들로 보정량을 만든다 | 통합된 assay와 anchor 집합 | 군집화, 시각화, label transfer |
| **scVI(single-cell variational inference) / scANVI** | batch를 decoder의 covariate로 명시해 넣은 VAE(variational autoencoder). encoder는 batch 없이 세포를 서술해야 한다 | **latent space**, 원하면 denoise된 발현값까지 | 군집화, 시각화. scANVI는 세포 유형 label 전이까지 |
| **MNN(mutual nearest neighbours) / fastMNN** | 두 batch 사이에서 서로 가장 가까운 이웃인 세포 쌍을 같은 생물학적 상태로 보고, 그 차이 벡터들을 평균해 보정량으로 쓴다 | 보정된 저차원 좌표(fastMNN) 또는 보정된 행렬(원래의 `mnnCorrect`) | 군집화, 시각화 |

이 표에서 알고리즘 차이보다 더 중요한 차이가 하나 있다.

<mark class="blue">single-cell integration 방법은 대부분 count가 아니라 embedding을 보정한다. 그래서 군집화와 시각화는 보정된 값으로 하고, DE(differential expression)는 raw count로 돌아가 batch를 모형의 covariate로 넣는다.</mark>

이 실수는 아주 흔하고, 모르는 사이에 하기 쉽다. Harmony는 기존 표현 옆에 새 표현을 하나 더 써 주고, 뒤의 모든 단계가 그래도 돌아가기 때문이다.

```python
import scanpy as sc
import scanpy.external as sce

sc.pp.pca(adata)
sce.pp.harmony_integrate(adata, key='batch')   # adata.obsm['X_pca_harmony']가 생긴다
sc.pp.neighbors(adata, use_rep='X_pca_harmony')
sc.tl.leiden(adata)
```

여기서 `adata.X`는 건드려지지 않는다. 그게 맞다. [DE 도구](../de-tools-ko/)가 필요한 건 count다. 사고는 반대 방향에서 난다. batch 보정된 행렬을 검정에 넣으면 유의성이 부풀려져 나온다. batch는 미리 지워 둘 것이 아니라 모형에 넣을 것이다.

## 과보정

남은 batch effect는 모두가 걱정하는 쪽이다. 과보정(over-correction)은 내가 더 많이 손해 본 쪽이다.

integration의 목적 함수는 batch를 겹치게 만드는 것이다. 어떤 연구만 잡은 집단이 있다면 — 희귀 면역 세포 집단, 진행된 질병 코호트에만 있는 섬유화 상태, 다른 랩의 해리 과정에서 깨져 버린 세포 유형 — "batch를 겹치게 만들라"와 "그 집단을 지워라"가 같은 지시가 되고, 방법은 둘을 구분할 수 없다. 질병과 연구가 부분적으로만 겹쳐 있을 때의 진짜 질병 효과도 마찬가지다. 생물학의 일부가 batch와 함께 조용히 빠져나간다.

integration 벤치마크가 점수를 하나가 아니라 둘로 내놓는 이유가 이것이다. kBET(k-nearest-neighbour batch effect test)과 LISI(local inverse Simpson's index)는 이웃 안에서 batch가 얼마나 잘 섞였는지를 재고, 별도의 지표들이 알려진 세포 유형 label·희귀 집단·trajectory가 살아남았는지를 묻는다. Luecken et al.(2022)의 scIB(single-cell integration benchmarking)가 정확히 이 구분 위에 만들어졌다. batch 보정과 생물학적 보존을 따로 집계한 뒤 합치는데, 한쪽 축에서 이기는 방법이 다른 축에서 지는 일이 흔하다.

<mark>섞임 점수가 높다는 것만으로는 성공이 아니다. 완벽하게 섞인 상태는 생물학을 지워도 얻을 수 있다.</mark>

실제로는 점수보다 센 증거로 판단한다. 이름을 댈 수 있는 세포 유형이 보정 뒤에도 갈리는지, 그리고 통합된 군집이 전에 가지고 있던 marker를 아직 갖고 있는지.

## 실무 규칙

- **필요해지기 전에 batch metadata를 적어 둔다.** 샘플마다 연구, run, kit 화학, 해리 프로토콜, 실험한 사람, 날짜를 한 열씩. 나중에 복원하려면 GEO 레코드를 다시 읽어야 하고, 애초에 기록이 없는 항목도 있다.
- **보지 않고 보정하지 않는다.** batch effect를 본 적이 없으면 보정이 도움이 됐는지, 무엇을 얼마나 같이 가져갔는지 판단할 수 없다.
- **보정 안 한 객체를 남겨 둔다.** 보정된 값은 이웃 그래프와 그림용이다. 모든 비교와 유전자 수준의 모든 숫자는 원래 count에서 나오니, 둘 다 손에 있어야 한다.
- **batch를 design matrix에 넣는다.** `~ batch + condition` 이고, 보정된 행렬을 검정하는 게 아니다.
- **알고 있는 marker가 아직 갈리는지 확인한다.** 간이라면 [간세포와 면역세포](../liver-cells-ko/)가 점검용이다. integration 뒤에 이 둘이 더는 갈리지 않으면 섞임 점수가 뭐라고 하든 보정이 너무 셌다.
- **되는 것 중 가장 약한 방법을 쓴다.** 균형 잡힌 bulk 설계에서 batch가 그냥 covariate라면, 행렬을 보정하는 것보다 모형에 항 하나 넣는 게 낫다. 데이터셋들이 공유 latent space를 정말로 필요로 할 때 깊은 모형을 꺼낸다.

## 정리

- batch effect는 샘플이 **언제, 어디서, 어떻게** 처리됐는지를 따라간다. run, kit 화학, 해리, 실험한 사람, 다룬 시간, 그리고 공개 데이터에서는 그 전부의 배후인 "다른 랩"
- noise가 아니라 **shift**다. 한 batch의 샘플을 늘리면 shift가 더 정확히 추정될 뿐 줄지 않는다
- 생물학과 confound되면 **설계의 문제**이고 보정으로 구할 수 없다. 그래도 모든 도구는 결과를 내놓는다
- 먼저 진단한다. batch로 색칠한 PCA, 그리고 군집 대 샘플 교차표
- **single-cell 방법은 대부분 count가 아니라 embedding을 보정한다.** 군집화와 그림은 보정된 값으로, 검정은 raw count에 `~ batch + condition`으로
- **과보정은 진짜 생물학을 지운다.** 한 연구만 잡은 집단도 함께
- 섞임 지표와 생물학적 보존 지표는 서로 절충 관계다. 섞임 점수만으로는 아무것도 증명되지 않는다
- 보정 안 한 객체를 남기고, integration 뒤에 알고 있는 marker가 아직 갈리는지 확인한다

## 참고

- Haghverdi et al., [Batch effects in single-cell RNA-sequencing data are corrected by matching mutual nearest neighbors](https://doi.org/10.1038/nbt.4091), *Nat. Biotechnol.* (2018) — anchor 계열 방법이 올라선 MNN 아이디어
- Korsunsky et al., [Fast, sensitive and accurate integration of single-cell data with Harmony](https://doi.org/10.1038/s41592-019-0619-0), *Nat. Methods* (2019) — PC 공간에서의 반복 보정, 내놓는 것은 embedding
- Lopez et al., [Deep generative modeling for single-cell transcriptomics](https://doi.org/10.1038/s41592-018-0229-2), *Nat. Methods* (2018) — scVI, VAE에 batch를 covariate로
- Luecken et al., [Benchmarking atlas-level data integration in single-cell genomics](https://doi.org/10.1038/s41592-021-01336-8), *Nat. Methods* (2022) — 섞임과 생물학적 보존을 따로 채점
