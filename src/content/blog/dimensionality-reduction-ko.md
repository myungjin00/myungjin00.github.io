---
title: "PCA·t-SNE·UMAP: 각자 무엇을 지키는가"
date: 2026-05-29
description: "유전자 2만 개는 눈으로 볼 수 있는 것이 아니다 · 분산과 거리를 지키는 PCA, 계산은 여기서 한다 · 이웃만 지키고 나머지는 버리는 t-SNE·UMAP · 군집 크기와 군집 사이 간격이 아무 뜻도 없는 이유 · 실제 파이프라인에서 각자의 자리"
category: concept
updated: 2026-06
lang: ko
group: dimensionality-reduction
topic: Machine learning
subtopic: Basics
tags: [PCA, UMAP, t-SNE, dimensionality reduction]
---

single-cell count 행렬은 유전자 쪽 폭이 2만 개쯤 된다. 그 열 대부분은 지금 묻는 질문에 아무 신호도 주지 않는다. 어디서나 꺼져 있는 유전자, 평균에 노이즈만 얹힌 유전자, 시퀀싱 깊이 차이만 반영하는 유전자. 설령 모든 열이 의미가 있다 해도 **2만 차원을 눈으로 볼 방법은 없다.** 차원 축소라는 한 단어가 실제로는 서로 다른 두 문제를 가리킨다. 계산을 위한 노이즈 제거와, 그림을 위한 2축 투영이다. 이 분야에서 생기는 문제는 거의 다 두 번째 용도로 만든 도구를 첫 번째 일에 쓰는 데서 나온다.

## PCA: 계산은 여기서 한다

**PCA** (principal component analysis)는 원래 공간에서 서로 직교하는 방향을 찾아, 각 방향이 설명하는 분산이 큰 순서로 늘어놓는다. 첫 번째 **PC** (principal component)는 세포들이 가장 크게 갈리는 방향 하나이고, 두 번째는 그에 직각인 방향 중 남은 분산이 가장 큰 방향이다.

이 정의에서 네 가지 성질이 따라 나온다.

- **선형이다.** 각 PC는 유전자들의 가중합이다. 그 비중이 **loading** 이고, 사람이 읽을 수 있다. 상위 loading이 *HBB*, *HBA1*, *HBA2* 인 PC는 추상적인 축이 아니라 적혈구 축이다.
- **결정적이다.** 같은 입력이면 같은 출력이고, 축마다 부호가 뒤집힐 수 있는 것뿐이다. seed가 없다.
- **거리에 의미가 있다.** 회전시킨 뒤 뒤쪽을 잘라낸 것이므로, PC 공간의 거리는 원래 공간의 거리를 근사한다. 국소뿐 아니라 전체 구조도 그렇다.
- **explained variance ratio가 몇 개를 쓸지 알려 준다.** 그려서 평평해지는 구간을 보면 된다. single-cell에서는 보통 PC 30~50개가 표준 범위다.

PCA가 쓸 만한 결과를 주는지는 두 가지가 결정한다. **중심화 (centring)는 필수** 다. 안 하면 첫 PC가 그냥 평균 방향을 가리킨다. **스케일링은 진짜 선택** 이다. 유전자마다 분산을 1로 맞추면 모든 유전자가 같은 한 표를 갖는데 발현량 낮고 시끄러운 유전자까지 그렇게 된다. 안 맞추면 발현량 큰 유전자가 지배한다. 발현 데이터에서 흔히 쓰는 절충은 정규화 → 로그 변환 → 변동 큰 유전자 선택 → 극단값을 자르면서 스케일링이다.

<mark>모든 single-cell 파이프라인에서 PCA를 PC 50개 정도로 먼저 돌린다. t-SNE·UMAP 앞에, 그 둘이 올라탈 토대로.</mark> 여기서 PCA가 하는 일은 두 가지다. 거의 기술적 노이즈인 방향들을 떨어내고, 최근접 이웃 탐색을 2만 차원에서 50차원으로 줄인다. 후자는 돌아가느냐 안 돌아가느냐의 차이다.

## t-SNE: 국소 이웃이 전부다

**t-SNE** (t-distributed stochastic neighbour embedding)는 비선형이고 목표가 다르다. 거리를 "이웃일 확률"로 바꾼 다음, 2차원에서 그 이웃 확률이 최대한 맞아떨어지게 점들을 배치한다. 투영이 아니라서 loading이 없고, 그래서 PCA의 주성분처럼 해석할 수 있는 축이 나오지 않는다.

알고리즘보다 중요한 건 그 결과다.

- **누가 누구 옆에 있는지**를 지키고, 나머지는 일부러 희생한다.
- **군집 크기는 의미가 없다.** 밀도가 높은 영역을 펼치고 희박한 영역을 압축하므로, 아주 조밀한 세포 유형이 큰 덩어리로 그려질 수 있다.
- **군집 사이 거리도 의미가 없다.** 멀리 떨어져 그려진 두 덩어리가 데이터에서는 인접할 수 있다.
- 주 다이얼은 **perplexity** 다. 각 점이 이웃을 대략 몇 개 가진다고 볼지에 해당한다. 작으면 그림이 조각나고, 크면 하나로 합쳐진다.
- **확률적이다.** 같은 데이터인데 seed를 바꾸면 눈에 보이게 다른 그림이 나온다.

## 빠른 t-SNE 구현

대부분 `sklearn.manifold.TSNE`부터 집는데, t-SNE가 "느려서 못 쓴다"는 평을 듣는 이유가 이것이다. Barnes–Hut 근사라서 세포 수십만 개면 한참 걸리고, 그러면 다시 안 돌리게 된다. 그림을 한 번만 계산하고 끝내면 seed에 얼마나 휘둘리는지는 확인하지 못한 채로 남는다.

빠른 구현들은 Barnes–Hut 단계를 **FFT** (fast Fourier transform) 격자 위의 보간으로 바꾼다. 반복 한 번의 비용이 $O(n \log n)$에서 사실상 $O(n)$이 된다. 세포 100만 개면 몇 시간이 몇 분이 되고, 결과의 성질은 하나도 안 바뀐다. 목적함수도 같고 단점도 같고 거리를 읽을 수 없다는 것도 같다.

| | 무엇인가 | 메모 |
| --- | --- | --- |
| `sklearn.manifold.TSNE` | Barnes–Hut | 기본값이고 느린 쪽 |
| openTSNE | FFT 가속, 순수 Python | 이걸 쓰면 된다. 게다가 기존 embedding에 새 점을 `transform()`으로 얹을 수 있다 |
| FIt-SNE | FFT 구현 원본, C++ | 속도는 비슷하다. openTSNE가 같은 아이디어를 더 편하게 감싼 것 |

```python
from openTSNE import TSNE

emb = TSNE(perplexity=30, n_jobs=-1, random_state=0).fit(X_pca)   # 50개 PC에 적합
emb_new = emb.transform(X_pca_new)                                # 새 세포를 다시 적합 없이 얹는다
```

`transform()`은 t-SNE가 못 한다고 늘 이야기되던 바로 그 동작이고, 이게 되면 참조 embedding을 만들어 두고 새 샘플을 거기에 투영할 수 있다. UMAP에서 `umap.transform`으로 하던 것과 같다. 그래도 여전히 국소 구조를 그린 그림이므로, 아래 주의사항은 투영된 점들에도 그대로 적용된다.

## UMAP: 더 빠르고, 단점은 같다

**UMAP** (uniform manifold approximation and projection)은 비슷한 국소 목표를 다른 loss와 훨씬 가벼운 이웃 그래프로 최적화한다. 그래서 세포 수백만 개까지 올라가고, single-cell 기본값 자리를 t-SNE에게서 가져갔다. 다이얼은 두 개다. `n_neighbors`는 국소 디테일과 넓은 구조 사이를 조절하고, `min_dist`는 점들이 얼마나 빽빽하게 뭉칠 수 있는지를 정한다. `min_dist`는 순전히 보기용이라 밑에 깔린 그래프는 하나도 바꾸지 않는다.

UMAP이 t-SNE보다 전체 구조를 더 잘 지킨다는 말을 자주 하는데, **이건 논쟁 중이다.** Chari와 Pachter는 이런 종류의 2차원 embedding이 이웃 관계를 심하게 왜곡해서 실제로 보존되는 비율이 작고, 같은 데이터로 눈에 아주 다른, 그러면서 똑같이 "타당한" 배열을 여러 개 만들 수 있다는 걸 보였다. 안전한 입장은 이렇다. UMAP의 전체 배열은 t-SNE보다 조금 더 안정적이고, 그래도 주장을 세울 근거는 못 된다.

## 나란히 놓고 보기

| | PCA | t-SNE | UMAP |
| --- | --- | --- | --- |
| 선형인가 | 그렇다 | 아니다 | 아니다 |
| 결정적인가 | 그렇다 | 아니다 | 아니다 |
| 거리가 의미 있나 | 있다 | 없다 | 없다 |
| 전체 구조 | 보존됨 | 잃음 | 일부, 논쟁 중 |
| 주 다이얼 | PC 개수 | perplexity | `n_neighbors`, `min_dist` |
| 무엇에 쓰나 | 계산 — 노이즈 제거, 이웃 그래프, 회귀 입력 | 국소 구조 보기 | 보기 — 그림 |

<figure>
<img src="/assets/fig/dimred-digits.svg" alt="손글씨 숫자 데이터의 PCA·t-SNE·UMAP 결과와 각 방법이 무엇을 보존하는지 점수로 비교한 막대 패널" loading="lazy" />
<figcaption><b>숫자 열 개가 열 덩어리로 남는 건 셋 다 같고, 그 덩어리들이 어디에 놓이는지는 전혀 다르다.</b> 숫자 0은 PCA에서 아래쪽, t-SNE에서 아래 가운데, UMAP에서는 오른쪽 멀리에 떨어져 있고 덩어리 사이 간격도 같이 바뀐다. 네 번째 패널은 각 embedding을 원래 64차원과 비교해 점수로 매긴 것이다. 점끼리의 거리를 가장 많이 지키는 쪽은 PCA이고(&rho; = 0.58, 나머지는 0.51과 0.36), 각 점의 이웃을 훨씬 많이 지키는 쪽은 t-SNE와 UMAP이다 (trustworthiness 0.99와 0.98, PCA는 0.83). PC 두 개만 쓰면 숫자 자체도 잃는다. 10-NN 투표로 제 라벨을 맞히는 비율이 61%인데 나머지 둘은 97%다. 계산은 PC 50개에서 하고 두 개에서는 하지 않는 이유가 이것이다.</figcaption>
</figure>

## embedding에서 읽어낼 수 없는 것

1. **UMAP에서 군집이 떨어져 보이는 건 군집이 있다는 근거가 아니다.** 군집화는 PC 공간의 이웃 그래프에서 했고, embedding은 같은 그래프를 따로, 손실을 받아들이며 그린 그림이다. UMAP에서 겹쳐 보이는 두 군집이 50차원에서는 깨끗하게 갈릴 수 있고, 떨어져 보이는 둘이 그림이 우연히 쪼갠 한 집단일 수 있다. embedding은 결과를 *보는* 자리이고, 결과를 얻는 자리가 아니다.
2. **두 군집 사이 간격은 아무 뜻도 없다.** 거리도, 상대적 크기도, 어느 군집이 다른 둘 사이에 놓였는지도 마찬가지다. 정보가 있는 건 소속과 바로 옆 관계뿐이고, 옆 관계마저 약하다.
3. **seed나 `n_neighbors`를 바꾸면 그림이 바뀐다.** 그러니 그림의 배열에 기대는 문장은 전부, 예컨대 "집단 A가 B와 C 사이에 있다", "이 두 상태가 연속적으로 이어진다" 같은 말은 생물학에 대한 진술이 아니라 embedding에 대한 진술이다. PC 공간에서 확인하거나, trajectory 방법으로 확인하거나, 아니면 하지 않는다.
4. **t-SNE·UMAP은 보는 것이고 PCA는 계산하는 것이다.** 군집화, 차등 발현, trajectory 추론, 최근접 이웃 라벨 전이, batch 보정 — 전부 PC나 보정된 latent 공간, 즉 PC와 같은 역할을 하도록 모델이 학습한 저차원 좌표에서 돌리고 UMAP 좌표 2개에서 돌리지 않는다. UMAP 좌표에 k-means를 돌리는 것이 이 실수의 전형적인 형태다.
5. **batch 효과는 생물학과 똑같이 생겼다.** 보정하지 않은 embedding에서 가장 눈에 띄게 갈리는 축은 대개 샘플이거나 시약 버전이다. 어떤 분리든 해석하기 전에 같은 embedding을 batch로 색칠해 보고, 이어서 뻔한 기술적 변수들 — 검출 유전자 수, 미토콘드리아 비율, 세포주기 점수 — 로도 색칠해 봐야 한다.

<mark class="blue">UMAP은 어떤 결과가 말이 안 된다는 걸 보여줄 수 있지만, 어떤 결과가 맞다는 건 보여줄 수 없다.</mark>

## 파이프라인에서 각자의 자리

순서는 고정이고, 마지막 단계만 보기용이다.

**정규화·유전자 선택 → 스케일링 → PCA로 PC 50개 → PC 위에서 kNN (k-nearest neighbour) 그래프 → [Leiden 군집화](../clustering-ko/) → UMAP, 그림용으로만.**

```python
import scanpy as sc

adata = sc.datasets.pbmc3k()
sc.pp.filter_genes(adata, min_cells=3)
sc.pp.normalize_total(adata, target_sum=1e4)
sc.pp.log1p(adata)
sc.pp.highly_variable_genes(adata, n_top_genes=2000)
adata = adata[:, adata.var.highly_variable].copy()

sc.pp.scale(adata, max_value=10)            # 중심화 + 스케일링: PCA에 필요
sc.tl.pca(adata, n_comps=50)                # 1. 노이즈 제거, 2만 차원 -> 50

# PC를 몇 개 쓸지: 평평해지는 지점을 본다
sc.pl.pca_variance_ratio(adata, n_pcs=50)

sc.pp.neighbors(adata, n_neighbors=15, n_pcs=50)   # 2. PC 공간에서 그래프
sc.tl.leiden(adata, resolution=1.0, flavor="igraph", n_iterations=2)  # 3. 군집
sc.tl.umap(adata, min_dist=0.5)             # 4. 그림에 쓸 좌표
```

`sc.tl.leiden`은 2단계에서 만든 그래프를 읽으므로, `sc.tl.umap` 앞에서 돌리든 뒤에서 돌리든 라벨이 똑같이 나온다. UMAP은 자기가 설명하는 것처럼 보이는 모든 것보다 뒤에 있다.

bulk 데이터에도 같은 구분이 적용되는데, 거기엔 UMAP 단계가 아예 없다. 샘플들의 PCA가 표준적인 첫 확인이고, [bulk와 single-cell의 차이](../bulk-vs-sc-ko/)는 그 PCA를 샘플 위에서 하느냐 세포 위에서 하느냐에 가깝다.

## 분자에 PCA를 쓰면

같은 분해를 화학정보학에서도 쓴다. 화합물마다 계산한 [디스크립터](../descriptors-fingerprints-ko/) 행렬에 돌린다. 이유도 같다. 디스크립터는 서로 상관이 심하고, PCA가 회귀나 유사도 계산 앞에서 그 중복을 걷어낸다.

해석은 한 가지가 예상대로 다르다. 디스크립터 집합에는 분자 크기와 함께 커지는 양이 많이 들어 있어서 — 중원자 수, 고리 수, 표면적, 분극률 — **디스크립터 행렬의 앞쪽 PC는 대개 그냥 크기다.** 내가 본 대부분의 집합에서 PC1은 분자량과 *r* 0.9 이상으로 상관이 있었다. 그래서 "chemical space" 그림의 첫 축은 화학의 지도가 아니다. 그 축은 대개 크기 축이고, 화학적으로 흥미로운 변동은 몇 성분 뒤에서 시작한다.

## 정리

- 문제는 실제로 있다. 유전자 2만 차원의 대부분은 노이즈이고, 2만 개 축을 눈으로 볼 수 있는 사람은 없다
- **PCA**는 선형·결정적이고 loading으로 읽힌다. 거리와 전체 구조가 살아남고, explained variance ratio가 PC를 몇 개 쓸지 알려 준다
- PCA 전에 중심화는 항상 한다. 스케일링은 모든 유전자에게 같은 한 표를 줄지, 발현량 큰 유전자가 지배하게 둘지의 선택이다
- 모든 single-cell 파이프라인에서 PC 50개 정도까지의 PCA가 **먼저** 온다. 노이즈를 떨고 이웃 탐색을 가능하게 만든다
- **t-SNE**와 **UMAP**은 국소 이웃을 지키고 군집 크기와 군집 사이 거리를 버린다. 둘 다 확률적이어서 seed에 따라 그림이 바뀐다
- UMAP이 전체 구조에서 더 낫다는 주장은 **논쟁 중** 이다. 그 배열은 측정이 아니라 그림으로 취급한다
- **그림의 배열에 기대는 주장은 절대 하지 않는다.** 군집화는 PC 공간에서, 2차원은 보는 데만
- 보정하지 않은 batch 효과가 어떤 embedding에서든 가장 설득력 있는 분리를 만든다
- 화학정보학에서 디스크립터 행렬의 앞쪽 PC는 대개 분자 크기다

## 참고

- van der Maaten & Hinton, [Visualizing data using t-SNE](https://www.jmlr.org/papers/v9/vandermaaten08a.html), *JMLR* (2008)
- Linderman et al., [Fast interpolation-based t-SNE for improved visualization of single-cell RNA-seq data](https://doi.org/10.1038/s41592-018-0308-4), *Nat. Methods* **16**, 243–245 (2019) — FIt-SNE
- Poličar, Stražar & Zupan, [openTSNE: a modular Python library for t-SNE dimensionality reduction and embedding](https://doi.org/10.18637/jss.v109.i03), *J. Stat. Softw.* **109**(3) (2024)
- McInnes, Healy & Melville, [UMAP: uniform manifold approximation and projection for dimension reduction](https://arxiv.org/abs/1802.03426), *arXiv* (2018)
- Chari & Pachter, [The specious art of single-cell genomics](https://doi.org/10.1371/journal.pcbi.1011288), *PLoS Comput. Biol.* (2023) — 2차원 embedding을 읽는 것에 대한 반론
