---
title: "데이터 증강, 그리고 분자에서 유독 어려운 이유"
date: 2025-03-14
description: "증강은 '이 변환이 라벨을 바꾸지 않는다'는 주장이다 · 무엇을 얻고 무엇을 치르나 · 이미지·텍스트·그래프·분자의 표준적인 방법들 · 그리고 원자 masking이 조용히 깨지는 지점"
category: concept
updated: 2025-04
lang: ko
group: augmentation
topic: Machine learning
subtopic: Basics
tags: [augmentation, contrastive learning, molecular representation]
---

라벨 붙은 분자가 수천 개뿐이면, 가진 것으로 학습 예시를 더 만들자는 생각이 당연히 나온다. 그게 데이터 증강 (data augmentation)이고, 이미지에서는 너무 잘 돼서 따로 논의조차 안 한다. 분자에서는 가장 틀리기 쉬운 단계다.

## 증강이 실제로 주장하는 것

모든 증강은 같은 주장이다.

> **이 변환은 입력을 바꾸지만 라벨은 바꾸지 않는다.**

고양이를 회전시켜도 고양이다. 이 주장이 있어야 회전된 이미지를 원래 라벨로 학습시킬 수 있고, 나머지는 전부 이 주장이 성립하느냐에 달려 있다.

성립할 때 얻는 것이 두 가지다.

- **데이터가 실질적으로 늘어난다.** 한 epoch에 데이터셋이 가진 것보다 많은 변이를 모델이 본다.
- **불변성 (invariance)을 가르친다.** "이 축은 중요하지 않다"고 모델에게 말하는 것이고, 아키텍처가 아니라 데이터를 통해 prior를 주입하는 셈이다.

증강이 단순히 "데이터 늘리기"와 갈라지는 지점이 두 번째다. <mark>정보를 더하는 게 아니라, 모델이 써도 되는 방향 하나를 없애는 것이다.</mark> 그 방향이 정말로 무관할 때는 도움이 되고, 아닐 때는 해가 된다.

## 분야별 표준적인 방법

| 분야 | 흔히 쓰는 변환 | 라벨이 보존되는 이유 |
| --- | --- | --- |
| 이미지 | 좌우 반전, crop, 회전, 색 변형, cutout, mixup | 어떻게 해도 고양이는 고양이다 |
| 오디오 | 시간 이동, 음높이 변경, noise 추가, SpecAugment masking | 단어는 그대로 남는다 |
| 텍스트 | 동의어 교체, 역번역, 임의 삭제 | 의미가 대체로 남는다 — 대체로 |
| 표 데이터 | SMOTE (synthetic minority over-sampling technique), 연속형 열에 noise | 이웃 사이가 국소적으로 선형이라고 가정한다 |
| 그래프 | node 삭제, edge 변형, 부분그래프 샘플링, feature masking | 큰 그래프의 성질은 작은 편집에 둔감하다 |
| 분자 | SMILES enumeration, 원자 masking, 결합 삭제, 부분구조 제거 | **여기서 깨진다** |

텍스트에서 이미 금이 보인다. 동의어 교체는 그 단어 자체가 중요한 문장을 만나기 전까지만 안전하다. 전형적인 실패가 부정문이다. 단어 하나 지우면 라벨이 뒤집힌다.

## 분자가 다른 이유

<mark class="blue">분자 그래프에는 라벨을 보존하는 변환이 거의 없다.</mark>

- **원자를 지우면** 다른 화합물이고, 측정값도 다르다. 같은 것에 noise를 섞은 판이 아니라 다른 화합물이다.
- **결합을 바꾸면** 존재할 수 없는 구조가 나오기도 한다.
- **부분그래프를 떼면** 그 성질을 결정하던 작용기를 떼어 낸 것일 수 있다.

이미지 증강이 되는 건 라벨이 픽셀 수준 변화에 둔감하기 때문이다. 분자의 성질은 그렇지 않다. [activity cliff](../activity-cliff-ko/)가 이 사실의 극단적인 표현이다. 메틸렌 하나에 역가가 천 배 달라진다. 원자 삭제를 라벨 보존으로 취급해 학습시킨 모델은 cliff가 위반하는 바로 그 매끄러움을 배우고 있는 것이다.

진짜로 안전한 변환은 하나다.

**SMILES enumeration.** SMILES (simplified molecular-input line-entry system)는 분자를 문자열로 적는 방식이고, 같은 분자도 어느 원자에서 시작해 읽느냐에 따라 유효한 문자열이 여러 개 나온다. 이걸 나열하면 한 분자에 대해 라벨이 확실히 같은 입력을 여러 개 얻는다. *분자*는 변하지 않았고 적는 방식만 바뀌었기 때문이다. 위 여섯 가지 중 라벨이 보존되는 유일한 변환이고, 문자열 기반 모델에만 해당된다.

```python
from rdkit import Chem
m = Chem.MolFromSmiles("CC(=O)Oc1ccccc1C(=O)O")
[Chem.MolToSmiles(m, doRandom=True, canonical=False) for _ in range(3)]
# 서로 다른 문자열 셋. 전부 같은 분자로 다시 읽힌다
```

## 가장 아픈 지점: 대조 학습

대조 학습 (contrastive learning)의 사전학습에는 **positive pair**가 필요하다. embedding 공간에서 가까이 놓여야 하는 두 view다. 이미지에서는 두 번 증강해서 만든다. 분자에서는 증강을 해야만 하고, 그 순간 방법 전체가 안전하지 않은 가정 위에 올라선다.

positive pair가 (분자, 원자 하나 지운 분자)라면, 어떤 화합물과 다른 화합물을 같은 자리에 놓으라고 encoder를 학습시키는 것이다. 그렇게 나온 표현은 cliff에서 실패하는 바로 그 방식으로 매끄럽다.

빠져나오는 길은 분자를 변형한 것이 아니라 **같은 분자에 대한 두 가지 서술**을 찾는 것이다.

| 방식 | 두 view | 변형이 필요한가 |
| --- | --- | --- |
| 일반적인 그래프 대조 학습 | 그래프, 변형된 그래프 | 필요 — 안전하지 않다 |
| [MoleSG](../molesg-ko/) | SMILES, 그래프 | 불필요 |
| 2D/3D (GraphMVP) | 위상, conformer | 불필요 |
| [SJoINT](https://github.com/sslim-aidrug/SJoINT) | 원자 그래프, [junction tree](../fragmentation-ko/) | 불필요 |

셋 모두의 설계 판단이 이것이다. **손상된 복제본이 아니라 두 번째 view.** 두 서술이 처음부터 한 분자의 것이었으므로 positive pair가 공짜로 생긴다.

## 치르는 비용

증강이 안전한 경우에도 공짜는 아니다.

- **진짜 신호를 증강으로 지워 버릴 수 있다.** 색이 라벨인 과제에 색 변형을 걸거나, 그 원자가 pharmacophore인데 원자 masking을 거는 경우.
- **학습이 느려진다.** 새 정보가 아닌 데이터를 만드는 데 때로는 상당한 시간이 든다.
- **평가와 얽힌다.** 학습 set만 증강하는 게 맞다. 잊고 test set까지 증강하면 점수가 부풀려진다.
- **증강을 세게 걸면 모델의 표현력 문제가 최적화 문제로 바뀐다.** 과제가 이미 어려우면, 변이를 더하는 것이 일반화를 돕는 대신 수렴을 막을 수 있다.
- **작은 데이터셋을 고치는 게 아니라 가린다.** 분자 600개를 만 번 증강해도 정보량은 여전히 분자 600개어치이고, [scaffold 분할](../evaluation-protocol-ko/)을 하면 그 사실이 드러난다.

## 정리

- 증강은 **변환이 입력은 바꾸고 라벨은 안 바꾼다**는 주장이다. 전부 이게 성립하느냐에 달려 있다
- 정보를 더하는 게 아니라 **모델이 쓸 수 있는 방향 하나를 없애는 것**이고, 데이터를 통해 주입하는 prior다
- 이미지와 오디오는 안전하고, 텍스트는 대체로 안전하되 부정문에서 깨지고, 그래프는 클 때 안전하다
- **분자에는 라벨 보존 변환이 거의 없다.** 원자를 지우면 다른 화합물이고, 이게 activity cliff를 만드는 바로 그 사실이다
- **SMILES enumeration이 예외다.** 분자가 변한 게 아니라 적는 방식만 바뀌었다
- 대조 학습에서 가장 아프다. positive pair가 곧 증강이기 때문이다
- 해법은 **손상된 복제본이 아니라 두 번째 view**다. SMILES + 그래프, 2D + 3D, 원자 + junction tree
- 비용: 진짜 신호를 지우는 것, 느려지는 학습, 작은 데이터셋을 고치지 않고 가리는 것

## 참고

- Chen et al., [A simple framework for contrastive learning of visual representations](https://arxiv.org/abs/2002.05709) (ICML 2020) — SimCLR. 증강 레시피가 여기서 나왔다
- Bjerrum, [SMILES enumeration as data augmentation for neural network modeling of molecules](https://arxiv.org/abs/1703.07076) (2017)
- You et al., [Graph contrastive learning with augmentations](https://arxiv.org/abs/2010.13902) (NeurIPS 2020) — GraphCL과 그 증강 집합
- Wang et al., [MolCLR: molecular contrastive learning of representations via graph neural networks](https://doi.org/10.1038/s42256-022-00447-x), *Nat. Mach. Intell.* (2022)
