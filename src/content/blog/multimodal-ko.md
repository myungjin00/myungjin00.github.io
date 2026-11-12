---
title: "멀티모달 모델: 무엇이 모달리티이고, 어디서 합치나"
date: 2026-06-12
description: "모달리티는 두 번째 데이터 타입이 아니라 한 대상에 대한 두 번째 측정이다 · 상보성과 중복성이 둘 다 필요한 이유 · early·intermediate·late fusion · 합치는 지점으로서의 cross-attention · 라벨 없이 공간을 맞추는 contrastive 정렬 · 그리고 multimodal 숫자가 아무 의미도 없게 되는 다섯 가지 경우"
category: concept
updated: 2026-07
lang: ko
group: multimodal
topic: Machine learning
subtopic: Basics
tags: [multimodal, fusion, cross-attention, representation learning]
---

"멀티모달"은 느슨하게 쓰여서, 많은 경우 "입력 배열이 두 개"라는 말 이상이 아니다. 유용한 정의는 더 좁고, 그 정의가 이 작업이 애초에 성립하느냐를 가른다.

## 모달리티가 실제로 무엇인가

데이터 타입이 아니다. 모달리티는 **같은 대상에 대한 서로 다른 측정**이다.

<mark>판단 기준은 두 view가 한 대상의 것이냐다.</mark> 이미지와 그 캡션은 한 장면을 서술한다. SMILES (simplified molecular-input line-entry system) 문자열과 분자 그래프는 한 분자를 적는 두 방식이다. bulk RNA-seq (RNA sequencing) 프로파일과 조직 슬라이드는 한 조직 블록에서 나온다. 한 환자의 검사 수치, 진료 기록, 영상은 한 환자에 대한 세 가지 측정이다.

멀티모달이 *아닌* 것: 서로 무관한 feature 표 두 개, 또는 feature 행렬을 반으로 쪼갠 것. 그건 그냥 feature다. 정렬, 공짜로 생기는 positive pair, 한 view가 다른 view를 메울 수 있다는 주장은 모두 밑에 대상이 하나 있다는 데 걸려 있다. 그래서 이 구분이 그 세 가지를 쓸 수 있는지를 가른다.

| 분야 | 한 대상의 여러 view |
| --- | --- |
| **분자** | SMILES 문자열, 원자 그래프, 3D conformer, 구조를 그린 이미지 |
| **생물** | 전사체, 조직 슬라이드 이미지, 임상 변수 |

## 왜 하는가

성질 두 가지가 동시에 성립해야 하고, 둘은 서로 반대 방향으로 당긴다.

- **상보성** — 한 view가 다른 view에 없는 정보를 나른다. 그래프는 고리 위상을 명시하고, conformer는 공간상 거리를 명시한다. 어느 쪽도 다른 쪽에서 복원되지 않는다. 성능 이득이 나올 자리가 여기다.
- **중복성** — 두 view가 겹친다. *라벨 없이* 정렬을 배울 수 있게 해 주는 게 이것이다. 같은 블록에서 나온 조직 슬라이드와 전사체가 신호를 공유한다면, 둘을 맞추는 일 자체가 결과 라벨 없이 학습시킬 수 있는 과제가 된다.

겹침 없이 상보성만 있으면 정렬할 근거가 없다. 중복성만 있으면 복사본 하나를 더 얻고 이득은 없다. 쓸 만한 조합은 그 사이에 있고, <mark>중복성이 학습 신호이고 상보성이 보상이다.</mark>

## 어디서 합치나

질문은 두 흐름이 어느 깊이에서 만나느냐다.

| | 무엇인가 | 장점 | 단점 |
| --- | --- | --- | --- |
| **early fusion** | 원 feature를 한 벡터로 이어붙여 모델 하나를 학습 | 간단하고 모델이 하나, 첫 층부터 상호작용이 가능 | 스케일이나 차원이 큰 모달리티가 지배한다. 모달리티가 하나 없으면 입력 모양 자체가 깨진다 |
| **intermediate (joint) fusion** | 모달리티별로 따로 인코딩하고 표현을 합친 뒤 이어서 간다 | 인코더가 각자 자기 데이터에 맞다. cross-attention이 들어가는 자리가 여기다 | 파라미터가 늘고, 합치는 지점이 하이퍼파라미터가 된다 |
| **late fusion** | 모델을 따로 학습하고 예측값을 합친다 (평균, 가중 투표, stacking) | 모달리티가 없으면 그 모델만 빠진다. 인코더를 독립적으로, 짝이 안 맞는 데이터로도 학습할 수 있다 | 상호작용을 전혀 배울 수 없다. 두 모달리티가 서로를 한 번도 못 본다 |

실제 시스템은 대부분 intermediate이고, 이유는 단순하다. 1024차원 이미지 embedding 옆에 임상 변수 8개를 세워 두면 early fusion은 감당하지 못하고, late fusion은 애초에 동기였던 교차 모달 상호작용을 그냥 포기한다. intermediate fusion은 인코더가 각자 할 일을 하게 두면서 둘이 대화할 자리를 남긴다.

## 합치는 방식

기제 네 가지를, 표현할 수 있는 범위가 커지는 순서로.

**이어붙이기 (concatenation).** 두 표현 벡터를 붙여서 MLP (multilayer perceptron)에 넣는다. 잘 되고, 어느 논문이든 baseline으로 보고해야 하는 방법이다. 한계는 상호작용을 위층이 처음부터 배워야 한다는 점이다.

**gating.** 한 모달리티가 다른 모달리티의 차원마다 곱할 값을 만든다. 한 view가 옆에 나란히 서는 대신 다른 view의 feature를 조절하는 셈이다. 비용이 낮고, 이걸로 충분한 경우가 많다.

**bilinear pooling.** 두 벡터의 모든 쌍별 곱을 모델링한다. 쌍별 상호작용에 대해서는 표현력이 크지만 차원에 대해 제곱으로 커지므로, 실제로는 항상 분해된 형태나 압축 근사로 쓴다.

**cross-attention.** query는 한 모달리티에서, key와 value는 다른 모달리티에서 온다. 입력 두 개를 넣은 self-attention과 말 그대로 같은 연산이고, $Q$·$K$·$V$를 만드는 방식도 [attention](../attention-ko/)과 똑같다. 달라지는 건 각 projection이 어디서 오느냐뿐이다.

- 모달리티 A에서 $Q$: *A의 각 원소가 무엇을 알아야 하나*
- 모달리티 B에서 $K$, $V$: *B가 무엇을 제공하고, 무엇을 건네주나*

출력은 query마다 한 행이므로 A의 모양과 길이가 유지된다. 실용적인 결과가 두 가지다. 첫째, **비대칭**이다. A가 B를 읽는 것과 B가 A를 읽는 것은 다른 연산이고, 둘 다 원하면 블록을 두 개 돌린다. 둘째, 대상 전체끼리가 아니라 **원소 대 원소**로 상호작용한다. 원자가 자기를 품은 부분구조에 질문하고, 단어가 이미지 패치에 질문한다. pooling한 벡터 둘을 이어붙이는 쪽보다 cross-attention을 쓰는 주된 이유가 이 수준까지 내려간다는 점이다. 이어붙이기에서 남는 상호작용은 요약 둘 사이의 것뿐이다.

## contrastive 정렬

라벨이 없는데 두 모달리티를 한 공간에 놓으려면 어떻게 하나. CLIP (contrastive language–image pre-training)의 답은 이렇다. 짝이 맞는 쌍을 batch로 모아, 각 view가 batch 안의 다른 어떤 view보다 자기 짝에 가깝게 되도록 학습한다. 맞는 쌍은 당기고, 안 맞는 쌍은 밀어낸다. 짝 자체가 지도 신호이므로, 아무도 annotation하지 않은 데이터에서 공유 embedding 공간이 나온다.

문제는 positive pair다. 이미지에서는 같은 입력을 두 번 증강해서 만들고, 분자에서는 그 단계가 안전하지 않다. 원자를 지우면 *다른 화합물*이고, 그게 [증강 노트](../augmentation-ko/)의 논지 전부다.

이중 view 분자 모델은 설계로 그 단계를 건너뛴다. [MoleSG](../molesg-ko/)는 SMILES 문자열과 그래프를 짝짓고, [SJoINT](https://github.com/sslim-aidrug/SJoINT)는 원자 수준 그래프와 부분구조 위의 [junction tree](../fragmentation-ko/)를 짝짓는다. <mark class="blue">둘 다 한 분자의 두 view이고, 그래서 안전하지 않은 증강이 아예 필요하지 않다. positive pair가 어떤 변환을 하기도 전에 이미 있었다.</mark>

## 어디서 잘못되나

내가 실제로 부딪힌 순서대로.

**(a) 모달리티 하나가 지배한다.** 모델이 센 view만 읽고 다른 쪽을 무시하는 것을 배우는데, 숫자는 그래도 올라간다. 센 view 혼자서도 좋았기 때문이다. 단일 모달리티 baseline을 같은 split, 같은 튜닝 예산으로 반드시 함께 학습해야 한다. 그게 없으면 multimodal 점수는 해석이 불가능하고, "영상을 넣으니 좋아졌다"는 말이 실은 영상만이 유일하게 쓸 만한 입력이었다는 뜻일 수도 있다.

**(b) 테스트 시점에 모달리티가 빠진다.** 임상 데이터에서 흔하다. 영상이 일부 환자에게만 있다. early fusion은 그대로 깨진다. intermediate fusion은 학습된 placeholder나 0을 채워야 하는데 그러면 표현의 분포가 틀어진다. late fusion은 성능이 서서히 떨어지고, 구조적으로 약한 쪽인데도 그 이유로 선택되는 경우가 많다.

**(c) 상관은 있지만 상보적이지 않다.** 두 view가 크게 겹치면서 아무것도 더하지 않을 수 있다. 정렬은 아주 잘 학습되고 공유 공간도 깔끔해 보이는데 downstream 이득이 0이다. 확인에는 실험 하나면 된다. A만 쓴 모델의 잔차에 대해 모달리티 B가 개선을 주는가.

**(d) 정렬에는 짝지어진 데이터가 필요하고, 정작 희소한 게 그것이다.** 각 모달리티의 짝 없는 데이터는 보통 넘친다. 한 대상에서 둘 다 측정된 샘플은 그렇지 않다. 생물 쪽 멀티모달 연구의 규모를 제한하는 건 구조가 아니라 이것이다.

**(e) baseline을 제대로 학습시켜야 한다.** multimodal 모델이 단일 모달리티 모델을 이긴 게 흥미로운 건, 단일 모달리티 모델도 같은 하이퍼파라미터 탐색, 같은 seed 수, 같은 split을 받았을 때뿐이다. 덜 학습된 baseline은 어떤 구조든 좋아 보이게 만들고, [허술한 split](../data-splitting-ko/)은 두 숫자를 모두 무의미하게 만든다.

## 정리

- 모달리티는 다른 데이터 타입이 아니라 **한 대상에 대한 다른 측정**이다. 판단 기준은 밑에 대상이 하나 있느냐다
- 짝은 **상보적** (이득)이면서 **중복적** (정렬 신호)이어야 한다
- early fusion은 원 feature를 이어붙이고, intermediate는 표현을 합치고, late는 예측값을 합친다. 실제 시스템은 대부분 intermediate다
- early fusion에서는 스케일이 큰 모달리티가 지배한다. late fusion은 모달리티가 빠져도 버티지만 상호작용을 배울 수 없다
- 합치는 기제: 이어붙이기, gating, bilinear pooling, 그리고 **cross-attention** — $Q$는 한 view에서, $K$와 $V$는 다른 view에서. 입력 둘을 넣은 self-attention과 같은 연산이다
- cross-attention은 비대칭이고, 요약끼리가 아니라 **원소 대 원소**로 작동한다
- **contrastive 정렬**은 라벨 없이 공유 공간을 주고, 한 분자의 두 view면 positive pair가 공짜다
- 실패 양상: 모달리티 하나의 지배, 테스트 시점의 결측, 상관만 있고 상보적이지 않은 view, 희소한 짝 데이터, 덜 학습된 단일 모달리티 baseline
- **단일 모달리티 baseline을 돌려라. 안 돌리면 multimodal 숫자는 아무 의미도 없다**

## 참고

- Radford et al., [Learning transferable visual models from natural language supervision](https://arxiv.org/abs/2103.00020) (ICML 2021) — CLIP. 두 모달리티의 contrastive 정렬
- Baltrušaitis et al., [Multimodal machine learning: a survey and taxonomy](https://arxiv.org/abs/1705.09406), *IEEE TPAMI* **41**(2) (2019) — fusion 분류가 여기서 나왔다
- Shen et al., [Complementary multi-modality molecular self-supervised learning via non-overlapping masking](https://doi.org/10.1093/bib/bbae256), *Brief. Bioinform.* **25**(4) (2024) — MoleSG. [여기](../molesg-ko/)서 리뷰했다
