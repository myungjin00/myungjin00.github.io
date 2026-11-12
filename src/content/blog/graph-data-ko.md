---
title: "무엇을 그래프로 볼 것인가, 그리고 왜 그냥 넣으면 안 되는가"
date: 2026-02-20
description: "그래프는 네 단계에 정보를 담는다 · 그래프로 만들 가치가 있는 것과 없는 것 · n!개의 번호 매기기가 강제하는 순열 불변성 · edge list와 PyTorch Geometric의 Data 객체, 그리고 블록 대각 batch"
category: concept
updated: 2026-03
lang: ko
group: graph-data
topic: Graphs
tags: [graphs, representation, permutation invariance, batching]
---

message passing은 **GNN** (graph neural network)에 대한 두 번째 질문이다. 그 아래에 네 가지가 더 있다. 그래프가 정확히 무엇이고, 무엇을 그래프로 만들 가치가 있고, 실제로 어떻게 저장되고, 왜 특징 벡터처럼 그냥 신경망에 넣을 수 없는가. 마지막 항목은 성능 이야기가 아니다. GNN이라는 구조가 존재하는 이유 자체다.

그래서 [GNN](../gnn-ko/)보다 한 단계 아래이고, 예시는 내가 하는 일인 분자로 든다.

## 그래프를 정확히 정의하면

그래프는 **node** 집합과 그 사이의 **edge** 집합이다. 그 너머로, 그래프는 **네 단계**에 정보를 담고, 첫 번째만 읽는 모델은 데이터의 대부분을 버리는 셈이다.

| 단계 | 담는 것 | 분자에서는 |
| --- | --- | --- |
| **node** | node마다 벡터 하나 | 원자 번호, 형식 전하, 수소 개수, 방향족 여부 |
| **edge** | edge마다 벡터 하나 | 결합 차수: 단일·이중·삼중·방향족 |
| **global** | 그래프 전체에 벡터 하나 | 예측 대상 물성, 또는 학습된 그래프 embedding |
| **연결 관계** | 어느 node끼리 이어졌는가 | 결합 목록 |

여기에 두 가지를 더 명시해야 한다. 코드가 둘 다 조용히 기본값을 쓰기 때문이다. edge는 **방향이 있을 수도 없을 수도** 있다. 인용은 한 방향이지만 공유 결합은 아니다. 그리고 **self-loop**가 있을 수도 없을 수도 있는데, 이웃을 모을 때 node가 자기 직전 상태를 보는지 여부가 여기서 갈린다.

연결 관계는 네 번째 종류의 정보이고, 앞의 세 가지를 담는 그릇이 아니다. 같은 대상을 고정 크기 벡터로 바꾼 표현이 유일하게 잃는 것이 이것이다.

## 실제로 무엇을 그래프로 보는가

| 대상 | node | edge | global 정보 |
| --- | --- | --- | --- |
| **분자** | 원자 | 공유 결합 | 용해도, 독성, 결합 친화도 |
| **단백질** | 잔기 또는 원자 | 펩타이드 결합, 또는 거리 기준 공간 접촉 | 기능, 안정성, fold 분류 |
| **인용 네트워크** | 논문 | 인용 (방향 있음) | 부분 그래프의 분야 |
| **소셜 네트워크** | 계정 | 팔로우·친구 관계 | 커뮤니티 라벨 |
| **지식 그래프** | 개체 | 종류가 있는 관계 (방향 있음) | — |
| **이미지** | 픽셀 | 인접한 픽셀 4개 또는 8개와 연결 | 클래스 라벨 |
| **문장** | 단어 | 다음 단어와 연결 | 감성, 주제 |

마지막 두 줄이 논쟁거리다. 부분이 있고 부분 사이에 관계가 있는 대상은 전부 그래프로 그릴 수 있고, 이미지와 문장도 당연히 그릴 수 있다. <mark>"무엇이든 그래프가 된다"는 맞는 말이지만 그것만으로는 아무 도움이 안 된다. 중요한 질문은 더 싼 표현이 잃어버리는 관계 정보를 그래프 구조가 담고 있느냐다.</mark>

이미지는 담고 있지 않다. 픽셀 격자는 이웃이 고정되어 있고 알려져 있고 어디서나 같다. 모든 픽셀이 같은 상대 위치에 네 이웃을 갖는다. convolution은 바로 이 규칙성을 이용해 고정 offset으로 가중치를 공유한다. 격자를 edge list로 바꿔 쓰면 정보는 그대로지만 싸게 계산할 수 있게 해준 규칙성이 사라진다. 문장도 같다. 위치는 완전한 순서이고, transformer는 그 순서를 encoding한 채로 모든 쌍을 본다. 두 분야 모두 그래프 방법이 이기지 못했다.

분자는 반대다. 고정된 이웃이라는 것이 없다. 탄소는 결합이 네 개, 산소는 두 개이고, 그 패턴 자체가 예측하려는 대상이다. fingerprint는 분자를 사람이 미리 정해둔 부분 구조들의 집합으로 줄인다. 그 대가는 [디스크립터와 fingerprint](../descriptors-fingerprints-ko/)에서 다뤘다. SMILES (simplified molecular-input line-entry system) 문자열은 연결 관계를 보존하지만 글자 순서 안에 숨긴다. 고리 닫힘 하나가 스무 글자 떨어진 숫자 두 개로 나타난다. 그래프는 "어느 원자가 어느 원자와 붙어 있는가"가 일급 정보인 유일한 표현이다.

그래서 쓸 만한 기준은 "이걸 그래프로 그릴 수 있나"가 아니라 "다른 표현을 쓰면 내가 필요한 관계가 사라지나"다. 분자, 단백질, 그리고 애초에 관계로 정의된 것들(지식 그래프, 상호작용 네트워크)은 사라진다.

## 왜 MLP에 그냥 넣을 수 없는가

1-프로판올의 중원자만 보면 C–C–C–O, node 네 개짜리 사슬이다. 이 순서대로 번호를 매겨 인접 행렬을 적어 보자.

$$
A = \begin{pmatrix} 0&1&0&0 \\ 1&0&1&0 \\ 0&1&0&1 \\ 0&0&1&0 \end{pmatrix}
$$

이제 원자 번호를 다시 매긴다. 방법은 $4! = 24$가지이고, 그 24가지 전부가 같은 분자를 똑같이 올바르게 적은 것이다. 이 중 인접 행렬이 서로 다른 것은 열두 가지다. 사슬을 어느 쪽 끝에서 읽어도 같은 행렬이 나오기 때문이다. 다만 node 특징을 함께 붙이면 산소가 양쪽 끝을 구분해 주므로, 24가지 번호 매기기가 모두 서로 다른 (인접 행렬, 특징 행렬) 쌍이 된다.

이 행렬을 숫자 16개로 펼쳐서 **MLP** (multilayer perceptron)에 넣는다. 첫 층은 입력 $k$번째 자리에 가중치 $w_k$를 곱하므로 자리가 곧 의미다. 3번 자리의 숫자와 12번 자리의 숫자는 서로 다른 입력이다. 이 24개 입력이 같은 분자라는 사실을 네트워크는 전혀 모른다. 24개 전부에 같은 값을 내놓으려면 번호 매기기마다 한 번씩, 같은 함수를 24번 따로 배워야 한다. 그런데 데이터에 들어 있는 것은 그중 하나뿐이다.

node 네 개가 24가지다. 원자 30개짜리 분자는 $30! \approx 2.7 \times 10^{32}$가지다. 데이터를 더 모아서 해결되는 문제가 아니다. 애초에 구조 쪽에 이 대칭성에 대한 개념이 아예 없기 때문이다.

필요한 것은 두 가지 조건으로 적는다. $P$를 node 번호를 다시 매기는 연산이라 하면,

- **순열 불변성 (permutation invariance)** — 그래프 단위 출력은 바뀌면 안 된다: $f(PAP^\top, PX) = f(A, X)$. 분자의 예측 용해도가 어느 원자를 0번이라 불렀는지에 따라 달라질 수는 없다.
- **permutation equivariance** — node 단위 출력은 같은 방식으로 따라 바뀌어야 한다: $f(PAP^\top, PX) = Pf(A, X)$. 1번과 3번 원자를 맞바꾸면 두 원자의 예측값도 값은 그대로인 채 자리만 맞바뀌어야 한다.

순서에 영향받지 않는 aggregation을 쓰는 message passing은 층마다 equivariance를 만족하고, node 전체에 대한 readout이 순서에 영향받지 않으면 그래프 단위 출력이 불변이 된다. 설계 제약의 전부가 이것이고, 직접 확인해 볼 수 있다.

```python
import torch
from torch_geometric.data import Data
from torch_geometric.nn import GINConv, global_add_pool

torch.manual_seed(0)
x = torch.tensor([[6., 1.], [6., 2.], [6., 2.], [8., 1.]])   # C C C O
edge_index = torch.tensor([[0, 1, 1, 2, 2, 3], [1, 0, 2, 1, 3, 2]])

perm = torch.tensor([3, 0, 2, 1])          # 원자 번호를 다시 매긴다
inv = torch.argsort(perm)
x2, ei2 = x[perm], inv[edge_index]         # 같은 분자, 새 번호

gnn = GINConv(torch.nn.Linear(2, 8))
mlp = torch.nn.Linear(16, 8)               # 4x4 인접 행렬을 펼쳐서 넣는다

def dense(ei):
    A = torch.zeros(4, 4); A[ei[0], ei[1]] = 1.; return A.view(-1)

zero = torch.zeros(4, dtype=torch.long)
g1 = global_add_pool(gnn(x, edge_index), zero)
g2 = global_add_pool(gnn(x2, ei2), zero)
print("GNN  max |difference|:", (g1 - g2).abs().max().item())
print("MLP  max |difference|:", (mlp(dense(edge_index)) - mlp(dense(ei2))).abs().max().item())
# GNN  max |difference|: 3.814697265625e-06    <- float32 반올림, 사실상 0
# MLP  max |difference|: 0.6325682997703552    <- MLP 입장에서는 다른 분자
```

두 네트워크 모두 학습하지 않은 무작위 초기 상태다. 그래도 GNN은 자기 자신과 답이 일치한다. 불변성이 구조에 들어 있어서 배울 필요가 없기 때문이다. MLP는 일치하지 않고, 학습해도 번호 매기기를 외우는 방식 말고는 일치하게 만들 수 없다. <mark class="blue">벤치마크 숫자가 아니라 이것이 GNN이 존재하는 이유다.</mark> 이 제약에서 따라 나오는 것들, 즉 message passing 갱신식과 GCN (graph convolutional network)·GraphSAGE·GAT (graph attention network)·GIN (graph isomorphism network)의 차이는 [GNN 글](../gnn-ko/)에 있다.

## 그래프는 실제로 어떻게 저장되는가

밀집 인접 행렬은 $O(n^2)$인데 거의 전부 0이다. 1-프로판올이면 숫자 16개 중 1이 6개다. 원자 50개에 결합 52개짜리 분자면 숫자 2,500개 중 0이 아닌 것이 104개다. 분자 그래프는 화학적으로 희소하다. 원자 하나가 갖는 결합 수는 적고 — 탄소는 보통 넷, 황이나 인은 여섯까지 — 분자가 커져도 그 수는 늘지 않는다. 그래서 edge 개수는 $n$에 비례해 늘지만 밀집 행렬은 $n^2$에 비례해 늘어난다.

그래서 아무도 밀집으로 저장하지 않는다. 실제 형식은 **COO** (coordinate format)로 적은 **edge list**다. source node 배열과 target node 배열 두 개를 자리마다 짝지어 둔다. 특징은 별도 행렬에 둔다. node마다 한 행, edge마다 한 행이다. 네 단계 정보를 자연스럽게 들고 다닐 수 있는 이유도 이 분리 때문이다.

<figure>
<img src="/assets/fig/edge-index.svg" alt="A dense adjacency matrix and a COO edge index for 1-propanol, with the same bond highlighted in both" loading="lazy" />
<figcaption><b>같은 결합 셋, 두 가지 저장.</b> 원자 넷에서는 16 대 12라 차이가 작지만, 한쪽은 원자 수의 제곱으로 늘고 한쪽은 그렇지 않아서 원자 50개면 차이가 커진다. C1&#8211;C2 결합은 양쪽의 주황 한 쌍이다. 행렬에서는 대칭인 두 칸, edge list에서는 이웃한 두 column.</figcaption>
</figure>

**PyG** (PyTorch Geometric)에서는 `Data` 객체가 이 역할을 한다.

```python
import torch
from torch_geometric.data import Data

# 1-프로판올, 중원자만: C0-C1-C2-O3
x = torch.tensor([[6, 1], [6, 2], [6, 2], [8, 1]], dtype=torch.float)   # [원자 번호, 차수]
edge_index = torch.tensor([[0, 1, 1, 2, 2, 3],
                           [1, 0, 2, 1, 3, 2]], dtype=torch.long)       # 결합 하나를 두 번 저장
edge_attr = torch.tensor([[1.], [1.], [1.], [1.], [1.], [1.]])          # 결합 차수
y = torch.tensor([0.25])                                                # logP

d = Data(x=x, edge_index=edge_index, edge_attr=edge_attr, y=y)
print(d)
print(d.num_nodes, d.num_edges, d.is_undirected())
# Data(x=[4, 2], edge_index=[2, 6], edge_attr=[6, 1], y=[1])
# 4 6 True
```

기억할 것이 네 가지다.

- `edge_index`는 `[2, num_edges]`다. `[num_edges, 2]`가 **아니다.** 처음 쓸 때 흔히 하는 실수이고, edge가 두 개일 때는 오류 없이 그냥 돌아간다.
- **방향 없는 edge는 양쪽 방향으로 두 번 저장한다.** 결합 3개가 항목 6개가 된다. `undirected=True` 같은 설정은 없고, `is_undirected()`가 `True`를 돌려주는 것도 양쪽이 다 들어 있기 때문이다. 결합을 한 번만 저장하면 message가 한 방향으로만 흘러서 분자의 절반이 나머지 절반 소식을 못 듣는다.
- `edge_attr`는 `edge_index`와 **열 단위로** 짝이 맞아야 하므로, 같은 결합의 두 복사본에 같은 특징 행을 줘야 한다. 한쪽만 정렬하거나 걸러내면 결합 차수가 엉뚱한 결합에 붙는다.
- `y`가 global 정보다. 그래프 단위 목표 하나면 모양이 `[1]`, node 단위 과제면 `[num_nodes]`다. pooling이 필요한지 아닌지가 여기서 갈린다.

## 그래프 batch는 이미지 batch와 다르다

이미지 batch는 그냥 tensor다. 이미지 32장, 높이 같고 너비 같으니 축 하나 늘려서 쌓으면 된다. 그래프는 그게 안 된다. 분자 32개는 원자 개수가 32가지고 결합 개수도 32가지라서, 쌓을 축이 없다.

해법은 쌓기를 포기하는 것이다. 32개 그래프를 **서로 연결되지 않은 그래프 하나**, 즉 블록 대각 형태의 큰 그래프로 합친다. node 특징을 이어 붙이고, 각 그래프의 `edge_index`에 그 앞까지 들어간 node 개수만큼 더해주면 된다. 그리고 node마다 정수 하나씩, 이 node가 원래 몇 번째 그래프에서 왔는지 적은 `batch` 벡터를 함께 들고 다닌다.

```python
import torch
from torch_geometric.data import Data, Batch
from torch_geometric.nn import global_mean_pool

def chain(n):  # node n개짜리 사슬, node 특징 = 자기 index
    ei = torch.tensor([[i for i in range(n - 1)] + [i + 1 for i in range(n - 1)],
                       [i + 1 for i in range(n - 1)] + [i for i in range(n - 1)]])
    return Data(x=torch.arange(n, dtype=torch.float).view(-1, 1), edge_index=ei)

b = Batch.from_data_list([chain(4), chain(3), chain(5)])
print(b)
print(b.batch)
print(global_mean_pool(b.x, b.batch).view(-1))
# DataBatch(x=[12, 1], edge_index=[2, 18], batch=[12], ptr=[4])
# tensor([0, 0, 0, 0, 1, 1, 1, 2, 2, 2, 2, 2])
# tensor([1.5000, 1.0000, 2.0000])
```

node 4개·3개·5개짜리 그래프 세 개가 node 12개짜리 그래프 하나가 되고, 결합 3 + 2 + 4 = 9개가 방향 있는 항목 18개가 된다. `batch` 벡터는 `[0,0,0,0,1,1,1,2,2,2,2,2]`다. `global_mean_pool`은 이 벡터를 읽어서 원래 그래프마다 한 행씩 돌려준다. 0–3의 평균, 0–2의 평균, 0–4의 평균이니 각각 1.5, 1.0, 2.0이다.

반칙처럼 보이지만, 안전한 이유는 구조에 있다. <mark>message passing은 edge를 따라서만 정보를 옮기고 블록 사이에는 edge가 없다.</mark> 그래서 7번 분자의 node는 층을 몇 개 쌓든 23번 분자에서 온 message를 받을 수 없다. 데이터 구조 입장에서는 그래프 하나, 계산 입장에서는 독립적인 그래프 32개다. 그래서 node 개수가 모델에서 완전히 사라진다. 층이 보는 것은 `[N, F]` 특징 행렬과 `[2, E]` index 배열뿐이고, 그게 어떻게 나뉘어 있었는지는 알 필요가 없다.

실제로 따라오는 결과가 두 가지다. 메모리는 batch size가 아니라 batch에 들어간 node 총개수에 따라 결정되므로, 32개짜리 batch의 비용이 step마다 달라지고 최악의 경우는 데이터셋에서 가장 큰 그래프들이 정한다. 그리고 그래프 단위 의미가 필요한 연산을 직접 짠다면 (pooling, 정규화, 그래프별 가중 loss 등) `batch`를 인자로 받아야 한다. 이걸 빼먹으면 `mean(x)`가 조용히 batch 전체 평균이 되는데, 오류 없이 학습되면서 아무것도 배우지 않는다.

## global node

readout 때만이 아니라 message passing이 돌아가는 동안에도 그래프 단위 정보를 둘 자리가 필요할 때가 있다. 흔히 쓰는 방법은 **가상 node** (virtual node)다. master node, context node라고도 부른다. 모든 실제 node와 연결된 node 하나를 추가해 모든 층을 같이 통과시킨다.

얻는 것이 두 가지다. 거리가 줄어든다. 어느 두 원자든 이 node를 거쳐 두 [홉](../gnn-ko/)이면 닿으므로, 얕은 층으로는 멀리 떨어진 작용기가 서로 보이지 않는 over-squashing을 우회하는 지름길이 된다. 그리고 마지막 층 뒤에 이 가상 node 자신의 벡터가 그래프 단위 표현이 되는데, 끝에서 평균을 내 만든 것이 아니라 학습으로 쌓아올린 표현이다.

대가는 같은 기제를 반대로 읽은 것이다. 모든 node가 가상 node의 이웃이므로 가상 node의 상태는 사실상 그래프 전체의 요약이고, 매 층마다 그 요약을 다시 모든 node에 밀어 넣는다. 국소 구조가 그래프 평균 쪽으로 씻겨 나간다. over-smoothing 문제가 여섯 층이 아니라 한 층 만에 오는 셈이다. 작은 분자에서는 가상 node가 조금 도움이 되기도 하고 때로는 해가 되기도 한다. 기본값으로 둘 것이 아니라 ablation, 즉 넣은 것과 뺀 것을 각각 학습해 비교하는 실험을 돌려볼 대상이다. 같은 지름길을 얻으면서 단계를 분리해 두는 다른 방법은 부분 구조 수준의 그래프를 따로 두는 것인데, junction tree가 하는 일이 그것이다. [분자를 분해하는 방법](../fragmentation-ko/)에서 다뤘다.

## 모델을 짜기 전에 확인할 것

층을 쓰기 전에 이 목록을 훑는다. 그래프 데이터에서 내가 날린 시간은 대부분 이 중 하나였다.

| 확인 | 왜 중요한가 |
| --- | --- |
| **구조가 정말 정보를 담고 있나?** | fingerprint나 표 형태 baseline이 GNN과 비슷하게 나오면 그래프는 장식이었다. baseline을 먼저 돌린다. |
| **방향이 있나 없나?** | 방향 없는 edge를 한 번만 저장하면 그래프 절반에 닿지 못한다. 방향 있는 edge를 두 번 저장하면 방향을 지운 것이다. |
| **self-loop가 있나?** | node가 자기 상태를 유지하는지가 여기서 갈린다. 내부에서 알아서 넣는 층도 있고 안 넣는 층도 있어서, 두 번 넣으면 중복 계산된다. |
| **edge feature가 있고, 쓰이고 있나?** | 분자에서 결합 차수는 핵심 정보인데, 기본 GCN·GAT·GIN 층은 `edge_attr`를 아무 말 없이 무시한다. |
| **가장 큰 그래프가 얼마나 큰가?** | batch 메모리는 평균이 아니라 가장 큰 쪽이 정한다. 원자 400개짜리 하나가 batch size를 결정할 수 있다. |
| **node feature가 그래프끼리 비교 가능한가?** | transfer가 죽는 자리. |

node feature는 같은 방식으로 만들었을 때만 비교 가능한데, 데이터셋이 다르면 보통 그렇지 않다. 원자 종류 vocabulary가 다르고, 한쪽은 수소를 명시하고 다른 쪽은 암시하고, one-hot 열 순서가 다르고, 전하 특징을 다른 평균으로 표준화했다. 이 전부가 오류 없이 로드된다. 모양은 여전히 맞으니까. 그러면 모델은 7번 열을 사전학습에서는 "방향족"으로 읽고 downstream에서는 "형식 전하 +1"로 읽는데, 증상은 transfer가 도움이 안 된다는 것뿐이다. 한 corpus에서 사전학습하고 다른 데이터로 파인튜닝한다면 — 라벨 데이터가 수천 개뿐인 [분자 물성 예측](../mpp-ko/)에서 [사전학습](../transfer-learning-ko/)을 하는 이유가 바로 그것이다 — featurizer는 같은 코드여야 한다. 코드에 대한 같은 설명이 아니라 같은 코드.

## 정리

- 그래프는 네 단계에 정보를 담는다: node, edge, global, 연결 관계
- "무엇이든 그래프가 된다"는 맞지만 그것만으로는 쓸 데가 없다. 기준은 다른 표현이 내가 필요한 관계를 잃느냐다. 이미지와 문장은 잃지 않고, 그래서 거기서는 convolution과 transformer가 이겼다
- node가 $n$개인 그래프에는 올바른 번호 매기기가 $n!$가지 있어서, 인접 행렬을 펼쳐 넣는 MLP는 같은 함수를 $n!$번 배워야 한다
- 그래서 그래프 단위 출력에는 순열 불변성, node 단위 출력에는 equivariance가 강제되고, 이것이 GNN이 존재하는 이유다
- 저장 형식은 COO 형태의 edge list이고 모양은 `[2, num_edges]`, 방향 없는 edge는 두 번 저장한다
- batch는 그래프들을 서로 연결되지 않은 큰 그래프 하나로 합치고 `batch` 벡터를 함께 든다. message passing이 블록을 넘지 않으므로 그래프들은 독립으로 남는다
- 그래프끼리 비교 불가능한 node feature는 오류 없이 로드되고 transfer를 조용히 망친다

## 참고

- Sanchez-Lengeling et al., [A Gentle Introduction to Graph Neural Networks](https://distill.pub/2021/gnn-intro/), *Distill* (2021) — 인터랙티브하고 처음부터 쌓아 올린다. 시작점으로 가장 좋다
- Gilmer et al., [Neural Message Passing for Quantum Chemistry](https://arxiv.org/abs/1704.01212) (ICML 2017) — message passing neural network 틀, 그리고 master node 변형
- Xu et al., [How Powerful are Graph Neural Networks?](https://arxiv.org/abs/1810.00826) (ICLR 2019) — 합·평균·최대 aggregation이 각각 무엇을 구분하고 못 구분하는지
- Fey & Lenssen, [Fast Graph Representation Learning with PyTorch Geometric](https://arxiv.org/abs/1903.02428) (ICLR 2019 workshop) — `Data`·`Batch` 객체의 출처. 규약이 실제로 적혀 있는 곳은 [문서](https://pytorch-geometric.readthedocs.io/)다
