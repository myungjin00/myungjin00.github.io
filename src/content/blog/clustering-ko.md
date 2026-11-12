---
title: "군집화 (clustering)"
date: 2024-12-13
description: "라벨 없이 집단을 찾기 · k-means·계층적·DBSCAN·Leiden이 각각 가정하는 모양 · 정답이 없는 k를 어떻게 고르나 · resolution 하나가 결론을 정하는 이유 · 진짜 군집과 그려진 군집을 구분하는 법"
category: concept
updated: 2025-01
lang: ko
group: clustering
topic: Machine learning
subtopic: Basics
tags: [clustering, unsupervised, single-cell]
---

**Machine learning** · [#1 머신러닝과 딥러닝](../ml-and-dl-ko/) · [#2 지도·비지도·자기지도](../learning-paradigms-ko/) · #3 군집화 · [#4 전이학습](../transfer-learning-ko/)

군집화 (clustering)는 어떤 집단이 있는지 알려 주지 않은 채 데이터를 몇 개의 집단으로 나누는 일이다. [비지도학습](../learning-paradigms-ko/) 중에서 결과가 과하게 읽히기 쉬운 방법인데, 이유는 하나다. <mark class="blue">어떤 알고리즘이든 군집이 실제로 있든 없든 군집을 돌려준다.</mark>

## 알고리즘 넷, 가정 넷

넷 중 무엇을 쓸지는 사실 군집이 어떤 모양이라고 가정할지를 고르는 일이고, 답을 정하는 것도 그 가정이다.

<figure>
<img src="/assets/fig/clustering.svg" alt="k-means, hierarchical and DBSCAN on blobs, k-means and DBSCAN on moons, and a silhouette curve" loading="lazy" />
<figcaption><b>같은 데이터, 다른 가정.</b> 윗줄은 둥글고 잘 떨어진 덩어리라 셋 다 같은 답을 낸다. 아랫줄은 맞물린 초승달 둘인데, <b>k-means가 실패한다</b> — 직선 경계로만 공간을 자를 수 있어서 직선 하나가 두 초승달을 가로질러 버린다. DBSCAN (density-based spatial clustering of applications with noise)은 중심까지의 거리가 아니라 밀도를 따라가므로 제대로 찾는다. scikit-learn으로 직접 돌린 결과다.</figcaption>
</figure>

| 알고리즘 | 무엇을 가정하나 | 필요한 것 | 약점 |
| --- | --- | --- | --- |
| k-means | 둥글고 크기가 비슷한 집단 | `k`를 미리 | 볼록하지 않은 모양에서 실패, 모든 점에 라벨이 붙음 |
| 계층적 (hierarchical) | 중첩 구조를 어느 높이에서 자른다 | linkage와 자를 높이 | 메모리 O(n²), dendrogram이 과잉 해석을 부름 |
| DBSCAN / HDBSCAN | 군집은 밀도가 높은 영역 | 밀도 기준 | 데이터 전체에 `eps` 하나 |
| Leiden / Louvain | 군집은 kNN (k-nearest neighbour) 그래프의 커뮤니티 | resolution | resolution이 임의적. single-cell 기본값 |

전사체에서 실제로 중요한 것은 마지막 줄이다. Scanpy와 Seurat 둘 다 세포 사이의 kNN 그래프를 만든 뒤 커뮤니티 탐지를 돌린다. 그래서 `k`를 묻지 않고, 대신 더 곤란한 것을 묻는다.

## 올바른 k는 없다

<figure>
<img src="/assets/fig/clustering-k.svg" alt="The same points clustered into 2, 4, 7 and 11 groups" loading="lazy" />
<figcaption><b>같은 420개 점, 네 가지 답.</b> 어느 것이 맞는지는 데이터 안에 적혀 있지 않다. 여기서 silhouette이 k = 4를 고르는 이유는 중심 4개로 만든 데이터이기 때문이고, 실제 데이터에서는 곡선이 대개 평평해서 결국 사람이 고른다.</figcaption>
</figure>

흔히 쓰는 보조 지표는 전부 같은 종류를 잰다. 집단이 얼마나 조밀한지를 집단끼리 얼마나 떨어져 있는지에 견준 값이다. 어느 것도 검정이 아니다.

- **silhouette** — 점마다, 자기 군집이 옆 군집보다 얼마나 더 가까운지. −1~1이고 대략 0.5 이상이면 구조가 뚜렷하다.
- **관성 (inertia)의 elbow** — 군집을 하나 더 늘려도 별로 나아지지 않는 지점. 판단처럼 읽히는 이유는 실제로 판단이기 때문이다.
- **gap statistic** — 같은 모양의 무작위 데이터였다면 나왔을 값과 비교한다. 여기서 귀무가설에 가장 가까운 것.

single-cell에서 돌리는 다이얼은 `k`가 아니라 **resolution**이고, 성질은 같다. 올리면 군집이 쪼개지고 내리면 합쳐진다. <mark>정답인 값이 없으므로 정직한 선택은 하나다. 쓴 값을 밝히고, 그 양옆 값에서도 결론이 유지되는지 보이는 것.</mark>

## 군집화하기 전에

군집화 문제의 대부분은 사실 군집화 문제가 아니다.

1. **특징의 스케일을 맞춘다.** k-means와 kNN 그래프는 거리를 쓰므로 범위가 큰 변수가 지배한다. 발현 데이터라면 정규화 → 로그 변환 → 변동 큰 유전자 선택이 먼저다.
2. **차원을 먼저 줄인다.** 수천 차원에서는 거리가 의미를 잃는다. single-cell의 표준 경로는 PCA (principal component analysis)로 50차원 정도로 줄인 뒤 그 위에서 이웃 그래프를 만드는 것이다.
3. **배치 효과를 먼저 제거한다.** 안 그러면 가장 먼저, 가장 또렷하게 나오는 군집이 배치이고, 그게 생물학처럼 보인다.
4. **군집이 무엇이어야 하는지 정한다.** 세포 유형도, 세포 상태도, 두 세포가 하나로 잡힌 doublet도, 죽어가는 세포도 전부 군집을 만든다. 그중 원했던 것은 보통 하나뿐이다.

## 군집이 진짜인지 확인하기

> 색칠된 덩어리가 있는 UMAP (uniform manifold approximation and projection)은 설득력은 큰데 결론은 나오지 않는 그림이다. <mark>UMAP에서 군집 사이의 거리는 아무 의미가 없다.</mark> 의미가 있는 건 소속뿐이다. 멀리 떨어져 그려진 두 군집이 데이터에서는 인접할 수 있고, 그려지는 위치는 random seed에 따라 바뀐다.

군집을 믿기 전에 해 볼 것들:

- **marker가 있는지 본다.** 특이적으로 올라간 유전자가 없는 군집은 다른 무언가가 쪼개진 것일 가능성이 높다.
- **배치·세포주기·품질 artefact가 아닌지 본다.** 같은 embedding을 샘플별, 세포주기 점수별, 미토콘드리아 비율별, 검출 유전자 수별로 색칠해 본다. 그중 하나에서 군집이 켜지면 그게 정체다.
- **다른 resolution과 다른 seed에서도 남는지 본다.**
- **크기를 본다.** 4만 세포 중 12개짜리 "군집"은 발견이 아니라 가설이다.

그리고 그렇게 나눈 집단을 차등 발현으로 비교할 때는, 군집을 정의할 때 쓴 데이터로 다시 검정하고 있다는 점을 기억해야 한다. 그 순환이 비교의 모든 p값을 부풀린다. [군집 marker는 탐색용](../de-tools-ko/)이고 조건 비교는 pseudobulk로 하는 이유가 이것이다.

## 정리

- 어떤 알고리즘이든 군집을 돌려준다. 구조가 없는 데이터에서도. 알고리즘은 그게 진짜인지 알려 주지 않는다
- 알고리즘 선택은 사실 **어떤 모양을 가정할지**의 선택이다. k-means는 둥근 모양, DBSCAN은 밀도, Leiden은 그래프의 커뮤니티
- k-means는 볼록하지 않은 집단을 못 찾는다. 밀도 기반은 찾지만 전체에 밀도 기준 하나를 써야 한다
- **올바른 k도 resolution도 없다.** 쓴 값을 밝히고 양옆에서도 결론이 유지됨을 보인다
- 군집화 전에 스케일·차원·배치를 처리한다. 안 하면 그것들을 군집화하게 된다
- UMAP에서 소속은 의미가 있고 거리는 없다
- 데이터로 정의한 군집을 같은 데이터로 검정하면 p값이 부풀려진다

## 참고

- Luecken & Theis, [Current best practices in single-cell RNA-seq analysis: a tutorial](https://doi.org/10.15252/msb.20188746), *Mol. Syst. Biol.* (2019)
- Traag, Waltman & van Eck, [From Louvain to Leiden: guaranteeing well-connected communities](https://doi.org/10.1038/s41598-019-41695-z), *Sci. Rep.* (2019)
- Campello, Moulavi & Sander, [Density-based clustering based on hierarchical density estimates](https://doi.org/10.1007/978-3-642-37456-2_14), *PAKDD* (2013) — HDBSCAN
- Chari & Pachter, [The specious art of single-cell genomics](https://doi.org/10.1371/journal.pcbi.1011288), *PLoS Comput. Biol.* (2023) — embedding 과잉 해석에 대해
