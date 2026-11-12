---
title: "분자를 문장처럼 읽기: SMILES 언어 모델이 배우는 것"
date: 2025-05-16
description: "SMILES는 문법이 있는 문자열이라 텍스트용 방법이 그대로 넘어온다 · tokenisation이 첫 번째 실질적 판단이다 · masking 사전학습이 실제로 가르치는 것 · 1,870만 문자열에서 11억까지의 계보 · 문자열이 잃고 그래프가 지키는 것 · 그리고 두 논문의 숫자가 거의 비교되지 않는 이유"
category: concept
updated: 2026-11
lang: ko
group: chemical-language-models
topic: Cheminformatics
subtopic: Representation
tags: [SMILES, language models, pretraining, molecular property prediction]
---

분자는 문자열로 적을 수 있고, 문자열이 된 순간 텍스트용으로 만들어진 모든 방법이 그대로 적용된다. 발상은 그게 전부다. 흥미로운 쪽은 그 표기법이 조용히 치르는 비용, 그리고 발표된 비교가 생각보다 아무것도 결론 내지 못한다는 사실이다.

약에 대해 쓰인 *설명문* — 적응증, 작용 기전, 부작용, 초록 — 은 실패 양식이 다른 별개의 입력이고, [따로 노트](../biomedical-text-encoders-ko/)가 있다.

## SMILES가 언어처럼 읽히는 이유

SMILES (simplified molecular-input line-entry system) 문자열에는 **문법**이 있다. 괄호가 중첩되고, 고리는 쌍으로 열고 닫히며, 분기가 균형을 맞춘다. 그리고 원소 기호·결합 기호·구문 문자로 이루어진 **유한한 어휘**가 있다. 유효한 문자열은 파싱되고 아닌 것은 안 된다.

그러니 분자가 문장이라면, 토큰화하고 일부를 가리고 가린 부분을 맞히게 하고 작은 라벨 집합에 파인튜닝하면 된다. transformer 구현, 학습 루프, 사전학습 모델 허브가 전부 그대로 동작하고, 그래프 라이브러리를 직접 만들 필요가 없다.

이 모델들이 애초에 존재하는 이유도 그것이다. 라벨 붙은 분자는 적고 라벨 없는 구조는 많으니 [사전학습](../transfer-learning-ko/)이 필요했고, 사전학습이 이미 풀려 있던 곳이 텍스트였다.

## tokenisation이 첫 번째 실질적 판단이다

당연해 보이지 않지만, 모델이 표현할 수 있는 것 자체가 달라진다.

**문자 단위**는 순진한 선택이고 틀렸다. `Cl`을 `C`와 `l`로 쪼개서, 없는 탄소를 하나 만들고 아무 뜻 없는 문자를 하나 남긴다.

**원자 단위 정규식**은 두 글자 원소 기호(`Cl`, `Br`)와 대괄호 원자(`[N+]`, `[O-]`, `[C@@H]`)를 한 단위로 유지한다.

**BPE** (byte-pair encoding)는 빈번한 쌍을 병합해 코퍼스에서 단위를 학습하므로, 흔한 조각이 한 단위가 된다. 화학적으로 무의미한 단위도 같이 생긴다. `seyonec/ChemBERTa-zinc-base-v1`이 함께 올려 둔 BPE로 4-chloronitrobenzene을 토큰화하면 `['Clc', '1', 'ccc', '(', 'cc', '1', ')[', 'N', '+](=', 'O', ')[', 'O', '-]']`가 나오는데, 여기서 `)[`와 `+](=`가 한 단위다.

```python
import re
from rdkit import Chem

smi = "Clc1ccc(cc1)[N+](=O)[O-]"              # 4-chloronitrobenzene
Chem.MolToSmiles(Chem.MolFromSmiles(smi))
# 'O=[N+]([O-])c1ccc(Cl)cc1'  — 같은 분자, 다른 문자열

list(smi)[:4]
# ['C', 'l', 'c', '1']  — 문자 단위는 없는 탄소를 만들어 냈다

pattern = r"(\[[^\]]+]|Br?|Cl?|N|O|S|P|F|I|b|c|n|o|s|p|\(|\)|\.|=|#|-|\+|\\|/|:|~|@|\?|>|\*|\$|%[0-9]{2}|[0-9])"
re.findall(pattern, smi)
# ['Cl', 'c', '1', 'c', 'c', 'c', '(', 'c', 'c', '1', ')', '[N+]', '(', '=', 'O', ')', '[O-]']
```

문자 24개가 단위 17개가 되고, 염소가 살아남는다.

분명히 적어 둘 것. **SMILES 토큰은 단어가 아니다.** `c` 하나는 그 자체로 아무 뜻이 없다. 주변 때문에 방향족 탄소인 것이다. 괄호는 내용을 담지 않고 분기를 구분한다. 그리고 고리 닫힘 숫자는 **포인터**다. `1`이 두 번 나오고, 그 두 원자가 결합되어 있다고 말하는 것이 그 역할이다. <mark>어휘에는 그런 말이 없고, 모델은 공존 통계로 그걸 배워야 한다.</mark>

실무에서 하나 경고할 것이 있다. 일어나도 보이지 않기 때문이다. checkpoint가 함께 제공하는 토크나이저가 그 모델이 학습에 쓴 것과 늘 같지는 않다. `DeepChem/ChemBERTa-77M-MLM`을 `AutoTokenizer`로 올리면 `l`, `r`, `+`, `H`, `[`, `]`, `@`가 조용히 사라지고, 염소가 탄소로 들어가며 입체화학이 없어진다. 측정값과 해결 경로는 [HuggingFace 노트](../huggingface-practice-ko/)에 있다.

## 사전학습 목표가 가르치는 것

| 목표 | 방향 | 나오는 것 |
| --- | --- | --- |
| masked token 예측 (BERT 방식) | 양방향 | **표현**. encoder가 빈자리의 양쪽을 다 보므로 물성 예측에 쓰려면 이쪽이다 |
| autoregressive 다음 토큰 (GPT 방식) | 왼쪽에서 오른쪽 | **생성기**. 새 문자열을 뽑을 수 있고 표현은 한쪽만 본다 |
| contrastive | **두 view**가 필요 | 무엇을 같은 분자로 볼지가 모양을 정하는 embedding 공간 |

세 번째가 분자에서 까다롭다. contrastive 목표에는 양성 쌍이 필요하고, 이미지에서는 같은 입력을 두 번 변형해서 만든다. 그런데 [분자 변형은 라벨을 보존하는 것이 거의 없어서](../augmentation-ko/), 그 쌍 자체가 가장 확신 없는 가정이 된다.

MLM (masked language modelling)이 기본값이고, 무엇을 배우는지는 정확히 짚을 만하다. 단위의 15%를 가리고 되맞히게 하면 두 가지를 보상한다. **문자열의 구문**, 그리고 **어떤 조각들이 함께 나타나는가**. `c1ccc?cc1`의 빈자리를 채우려면 방향족 고리가 6원으로 적히고 고리가 닫혀야 한다는 걸 알아야 한다. `[N+](=O)[O-]`를 채우려면 nitro 기를 어떻게 적는지 알아야 한다.

<mark class="blue">그래서 SMILES에 대한 masked token 예측은 표기법의 문법과 조각의 공존 통계를 가르친다. 화학은 그로부터 따라 나오기를 바라는 것이고, 같은 것이 아니다.</mark>

## 계보

| 모델 | 발표 | 사전학습 코퍼스 | 더한 것 | 가중치 |
| --- | --- | --- | --- | --- |
| [SMILES-BERT](https://doi.org/10.1145/3307339.3342186) | ACM-BCB (2019) | ZINC 문자열 1,870만 | SMILES에 masked token 사전학습을 처음 적용 | 공개 안 됨 |
| [SMILES Transformer](https://arxiv.org/abs/1911.04738) | 프리프린트 (2019) | ChEMBL24에서 861,000 | 데이터 적은 상황을 겨냥한 고정 사전학습 지문 | 공식 가중치 없음 |
| [ChemBERTa](https://arxiv.org/abs/2010.09885) | NeurIPS 워크숍 (2020) | 정리한 PubChem 7,700만. 사전학습은 1,000만까지이고, 공개된 가중치는 별도의 ZINC 10만 학습본이다 | RoBERTa를 그대로 가져온 것, 그리고 첫 스케일링 곡선 | `seyonec/ChemBERTa-zinc-base-v1` |
| [MolBERT](https://arxiv.org/abs/2011.13230) | NeurIPS 워크숍 (2020) | ChEMBL 화합물 160만 | *어떤* pretext task가 이득을 내는지에 대한 ablation | GitHub만 |
| [MoLFormer-XL](https://doi.org/10.1038/s42256-022-00580-7) | *Nat. Mach. Intell.* **4** (2022) | PubChem·ZINC 11억 | rotary 위치 embedding을 쓴 linear attention. 그 규모를 감당하게 만든 것 | `ibm-research/MoLFormer-XL-both-10pct` |
| [ChemBERTa-2](https://arxiv.org/abs/2209.01712) | 워크숍 논문 (2022) | PubChem 500만 / 1,000만 / 7,700만 | 계산 가능한 물성 200개에 대한 multi-task 회귀를 pretext task로. 큰 두 규모에서 masking을 이겼다 | `DeepChem/ChemBERTa-77M-MTR` |
| [SELFormer](https://doi.org/10.1088/2632-2153/acdb30) | *Mach. Learn.: Sci. Technol.* **4** (2023) | ChEMBL v30 210만을 SELFIES로 | 구문적으로 무효가 될 수 없는 표기법에 같은 방식을 적용 | `HUBioDataLab/SELFormer` |
| [SMI-TED](https://doi.org/10.1038/s42004-025-01585-0) | *Commun. Chem.* **8** (2025) | 정리한 PubChem 9,100만, 토큰 약 40억 | 파라미터 2억 8,900만짜리 encoder–decoder | `ibm-research/materials.smi-ted` |
| [ChemBERTa-3](https://doi.org/10.1039/d5dd00348b) | *Digital Discovery* **5** (2026) | ZINC20 10억에 PubChem 1억 | 두 계보를 한 번에 학습·평가하는 공개 프로토콜 | `DeepChem/ChemBERTa-100M-MLM` |

이 표에 대해 둘.

**이름의 숫자는 코퍼스 크기이고 모델 크기가 아니다.** `ChemBERTa-77M-MLM`은 분자 7,700만 개로 사전학습한 파라미터 340만짜리 모델이고, `MoLFormer-c3-1.1B`은 11억 개로 학습한 파라미터 4,680만짜리 모델이다. 둘 다 그 숫자가 파라미터 수인 것처럼 인용되는 일이 흔하다.

**계보의 대부분은 코퍼스 크기이고, 안을 들여다본 한 편이 불편한 걸 찾았다.** MolBERT는 pretext task 셋을 ablation해서, 계산된 물리화학 디스크립터 200개를 맞히는 과제가 가장 큰 몫을 했고 masked token 예측은 보탠 것이 적었으며 두 문자열이 같은 분자인지 판정하는 과제는 오히려 해가 됐다고 보고한다. ChemBERTa-2는 반대쪽에서 같은 결론에 닿았다. 계산 물성에 대한 multi-task 회귀가 큰 두 규모에서 masking을 모든 과제에서 이겼다. 모델이 문자열보다 자기가 계산할 수도 있었던 디스크립터에서 더 많이 배운다면, 언어라는 틀이 보이는 만큼 일하고 있지 않다는 뜻이다.

## 문자열이 잃는 것

**한 구조, 여러 문자열.** 어느 원자에서 시작하느냐에 따라 같은 분자에 유효한 SMILES가 여럿 있다. 위 코드가 그 예다. 그래프는 이걸 공짜로 얻는다. 원자 순서를 바꿔도 GNN (graph neural network)은 원리상 같은 답을 내고, 그것이 [아키텍처를 그렇게 만드는 논거](../graph-data-ko/)다. 언어 모델은 그 불변성을 데이터로 **학습**해야 하고 온전히 얻는다는 보장이 없다. 어떤 공개 checkpoint에서는 한 분자의 두 표기가 코사인 0.78로 돌아온다. [측정값은 여기](../huggingface-practice-ko/) 있다.

**인접이 근접은 아니다.** `Clc1ccc(cc1)[N+](=O)[O-]`에서 고리 닫힘 `1`로 이어진 두 탄소는 문자열에서 일곱 단위 떨어져 있고 분자에서는 결합되어 있다. 그래프는 그걸 간선 목록에 적어 둔다.

**입체화학이 구두점이다.** `@`와 `@@`, `/`와 `\`. 활성이 완전히 다를 수 있는 두 화합물을 문자 하나가 가르는데, 그게 구문처럼 보인다. MoLFormer의 모델 카드는 학습 SMILES에서 이성질 정보를 제거했다고 적는다.

2026년의 한 연구가 그 비용을 예측 단계에서 숫자로 보여 준다. 같은 분자를 다른 표기법으로 다시 적으면 화학 언어 모델의 용해도 예측이 **평균 1.69 log S, ESOL의 88%에서** 흔들렸다. 디스크립터 모델은 영향을 받지 않았고, 그래서 실패 지점이 과제가 아니라 문자열에 있다는 것이 드러난다.

[디스크립터와 지문](../descriptors-fingerprints-ko/)과 견주면 득실이 분명하다. 지문은 고정이지만 부분구조의 존재를 직접 말하고, 문자열은 학습 가능하지만 직접 말하는 것이 거의 없다.

표기가 여럿이라는 성질의 진짜 이득은 증강이다. **SMILES enumeration** — 한 분자에 대해 유효한 문자열 여러 개를 만드는 것 — 은 [넷 중 라벨이 안전한 유일한 변형](../augmentation-ko/)이고, 분자는 그대로이고 직렬화만 바뀌었기 때문에 안전하다.

## 그래프를 이기는가

깔끔하게는 아니고, 정직한 답은 발표된 표로는 결론이 안 난다는 것이다.

MoLFormer는 그래프 논문들과 공유하는 분류 데이터셋 6개 중 3개에서 모든 베이스라인을 앞섰다고 보고한다. ChemBERTa 자신의 표현은 directed message-passing 신경망보다 낫다가 아니라 **대등하다**는 것이다. 주장은 그렇고, 문제는 그 아래에 있다.

## 발표된 숫자가 맞춰지지 않는 이유

구체적인 네 경우이고, 각각 논문 자신이 적어 둔 내용이다.

- **한 논문, 두 split 방식.** MoLFormer의 보충 자료는 분류 표가 scaffold split을, 회귀 표가 random split을 쓴다고 적는다. 그래서 ESOL·FreeSolv의 RMSE 0.28과 0.23은 random split 값이고, 다른 논문의 scaffold split RMSE 0.8–1.0과 1.5–2.2 옆에 나란히 인용된다. 그 간격의 대부분이 split이다.
- **같은 checkpoint, 24점 차이.** GROVER는 BBBP ROC-AUC를 0.94 가까이로 발표했다. GEM과 Uni-Mol이 공개된 같은 checkpoint를 카이랄성을 고려한 scaffold split에서 다시 돌려 약 0.70을 얻었다. GEM은 그 격차의 원인을 진단하지 않는다. 공개 구현들이 scaffold 계산에서 카이랄성을 고려하는지에서 갈린다고 적고, 카이랄성을 고려하는 쪽으로 통일하며, 별도로 GROVER의 무작위 scaffold 프로토콜도 함께 돌린다. 0.94와 0.70을 한 표에 놓는 것은 서로 다른 벤치마크를 비교하는 것이다.
- **리더보드 순위는 재현성이 아니다.** TDC (Therapeutics Data Commons) ADMET 리더보드 22개의 상위 3개 모델을 공개된 산출물만으로 감사한 연구에서, 모든 단계를 통과하고 보고된 숫자를 재현한 모델은 **셋뿐**이었고 나머지 여럿에서 누출이 확인됐다.
- **데이터셋 이름이 데이터셋이 아니다.** ChemBERTa-2는 multi-task 데이터셋 둘을 단일 과제로 바꿔 썼다. ClinTox 대신 임상 독성 과제, Tox21 대신 p53 스트레스 반응 경로다. 그래서 그 논문의 "ClinTox"와 "Tox21"은 흔히 쓰는 평균이 아니다. 논문은 절차가 달라 GROVER와 비교할 수 없었다고 분명히 적는다.

<mark>두 논문이 BBBP에 대해 보고한 두 숫자는 보통 같은 것을 재고 있지 않다.</mark> 앞의 세 경우는 기작이 같고, [split의 선택](../data-splitting-ko/)이 결정적인 이유이자 [발표된 MPP (molecular property prediction) 숫자가 옮겨지지 않는 이유](../mpp-ko/)다.

## 독립 평가가 찾은 것

프로토콜을 하나로 고정하고 그 안에서 전부 돌린 연구들은 일관되고 김빠지는 답에 닿는다.

| 연구 | 설계 | 결과 |
| --- | --- | --- |
| Jiang et al., *J. Cheminform.* **13** (2021) | 디스크립터 모델 4개 대 그래프 모델 4개, 데이터셋 11개 | 디스크립터 모델이 평균적으로 이겼고 비용도 낮았다 |
| Sun et al., NeurIPS (2022) | 목표·split·아키텍처를 바꿔 가며 그래프 사전학습 평가 | 자기지도 사전학습 단독으로는 통계적으로 유의한 이득을 안정적으로 내지 못했고, **하이퍼파라미터 선택이 더 중요했다** |
| Deng et al., *Nat. Commun.* **14** (2023) | 모델 약 62,800개. 지문 대 SMILES 언어 모델 대 그래프 모델 | 대부분의 데이터셋에서 표현 학습이 지문 + 랜덤 포레스트 대비 이득이 제한적이었다 |
| Sultan et al., *J. Chem. Inf. Model.* **64** (2024) | SMILES transformer 5년 리뷰 | split이 일관되지 않고 통계가 약해서 이 문헌의 모델 간 비교는 신뢰할 수 없다 |

그래서 지킬 수 있는 입장은 좁다. **문자열과 그래프 중 하나를 올려 세우는 중립 연구는 내가 찾은 범위에 없다.** 둘은 같은 구간에 떨어지고, 분자 수백에서 수천 개 규모에서는 둘 다 [지문 + 랜덤 포레스트](../descriptors-fingerprints-ko/)를 이기기 어렵다. 언어 관점이 예측 가능하게 강한 곳은 그 전제가 성립하는 자리다. 라벨 없는 큰 코퍼스와 아주 적은 라벨.

그 결론 없음을 두고 분야가 한 일이 쓸 만한 부분이다. 한쪽이 다른 쪽을 대체하는 대신, 최근 연구는 **둘을 함께** 돌린다. 언어 view와 그래프 view를 한 모델에 넣고 사전학습에서 또는 예측 시점에 융합한다. [MoleSG](../molesg-ko/)가 그 논거의 한 형태이고, 일반화하면 [multimodal 표현](../multimodal-ko/)의 문제다.

## SMILES냐 SELFIES냐

SELFIES는 모든 문자열이 유효한 분자로 해독되게 만들려고 나왔고, 모델이 *생성*할 때는 그게 중요하다. *예측*에서는 근거가 그쪽을 편들지 않는다. 아키텍처 3개 · 표기 2개 · 생물활성 데이터셋 10개를 통제해 비교한 연구에서 분류 과제는 SMILES가 앞섰고, 표기보다 아키텍처가 더 중요했다. 유효성이 제약인 곳에 SELFIES를 쓰고, 일반적인 개선으로 쓰지는 않는다.

## 내 작업에서는 어떤 이야기인가

내가 다루는 encoder는 SMILES view를 부분구조의 [junction tree](../fragmentation-ko/)와 짝지운다. 위에서 말한 방향의 한 사례다. 한 view가 이기는 게 아니라 둘을 함께 돌리는 쪽.

열린 질문은 그런 모든 짝에 공통으로 적용되는 것이다. **두 view는 어딘가에서 서로 달라야 하고, 아니면 그 짝은 비싼 중복이다.** 문자열 통계와 고리 닫힘 장부를 배운 SMILES encoder가, 그래프가 이미 정확히 적어 둔 연결성을 덜 정확하게 다시 끌어내고 있을 수 있다. 그렇다면 두 번째 view는 파라미터와 학습 시간만 쓰고 얻는 것은 없다.

벤치마크 숫자로는 답이 안 된다고 본다. 융합과 무관한 이유로도 융합 모델이 이길 수 있기 때문이다. 답이 될 것은 더 좁다. 두 view의 예측이 갈리는 분자를 찾아, 그 갈림이 구조적인지 noise인지 확인하는 것이다.

## 정리

- SMILES에는 문법과 유한한 어휘가 있어서 텍스트 도구 전체가 공짜로 넘어온다. 이 모델들이 존재하는 이유다
- **tokenisation이 중요하다.** 문자 단위는 `Cl`을 깨고 원자 단위 정규식은 깨지 않으며 BPE는 조각과 함께 무의미한 단위도 배운다. 그리고 checkpoint가 함께 올려 둔 토크나이저가 학습에 쓴 것이 아닐 수 있다
- masked token 예측은 표현을, autoregressive는 생성기를 주고 contrastive는 두 번째 view를 필요로 한다. MLM이 가르치는 건 **구문과 공존**이고 화학이 아니다
- 계보는 문자열 1,870만에서 11억까지 가고, 모델 이름의 숫자는 **파라미터가 아니라 코퍼스 크기**다
- MolBERT의 ablation과 ChemBERTa-2의 multi-task 결과는 같은 방향을 가리킨다. pretext task로서 계산된 디스크립터가 문자열 masking을 이긴다
- 문자열은 순서 불변성을 잃고, 결합된 원자를 멀리 놓고, 입체화학을 구두점으로 줄인다. 그래프는 그 전부를 직접 적는다
- 한 분자를 다른 표기법으로 다시 적으면 언어 모델의 용해도 예측이 **평균 1.69 log S** 움직이는데, 디스크립터 모델은 전혀 움직이지 않는다
- **논문 사이의 숫자는 네 가지 방식으로 비교되지 않는다.** 한 논문 안에서 split 방식이 다르고, 같은 checkpoint가 scaffold 관례에 따라 0.94나 0.70으로 읽히고, 데이터셋 이름이 12개나 2개 과제 대신 1개를 뜻할 수 있고, 리더보드 순위가 재현되지 않을 수 있다
- 독립 평가들은 문자열과 그래프를 같은 구간에 놓고, 작은 데이터셋에서는 지문 베이스라인이 아직 경쟁력 있다고 본다
- SELFIES는 생성에서 제 자리를 얻는다. 물성 예측에서는 통제된 비교가 SMILES를 편든다

## 참고

- Wang et al., [SMILES-BERT: large scale unsupervised pre-training for molecular property prediction](https://doi.org/10.1145/3307339.3342186), *ACM-BCB* (2019) — SMILES에 masked token 사전학습을 처음 적용
- Honda et al., [SMILES Transformer: pre-trained molecular fingerprint for low data drug discovery](https://arxiv.org/abs/1911.04738) (2019) — 데이터가 적은 상황을 겨냥한 고정 사전학습 지문
- Chithrananda et al., [ChemBERTa: large-scale self-supervised pretraining for molecular property prediction](https://arxiv.org/abs/2010.09885) (2020) — 스케일링과 토크나이저 연구
- Fabian et al., [Molecular representation learning with language models and domain-relevant auxiliary tasks](https://arxiv.org/abs/2011.13230) (2020) — MolBERT, 그리고 pretext task 셋의 ablation
- Ross et al., [Large-scale chemical language representations capture molecular structure and properties](https://doi.org/10.1038/s42256-022-00580-7), *Nat. Mach. Intell.* **4**, 1256–1264 (2022) — MoLFormer, 분자 11억 규모의 linear attention
- Ahmad et al., [ChemBERTa-2: towards chemical foundation models](https://arxiv.org/abs/2209.01712) (2022) — 같은 규모에서 masking을 이긴 multi-task 회귀
- Yüksel et al., [SELFormer: molecular representation learning via SELFIES language models](https://doi.org/10.1088/2632-2153/acdb30), *Mach. Learn.: Sci. Technol.* **4**, 025035 (2023)
- Soares et al., [An open-source family of large encoder-decoder foundation models for chemistry](https://doi.org/10.1038/s42004-025-01585-0), *Commun. Chem.* **8**, 193 (2025) — SMI-TED
- Singh et al., [ChemBERTa-3: an open source training framework for chemical foundation models](https://doi.org/10.1039/d5dd00348b), *Digital Discovery* **5**, 662–685 (2026)
- Mishra, [Notation matters: cross-representation inconsistency in chemistry language models and its mechanistic origins](https://doi.org/10.1039/d6dd00309e), *Digital Discovery* **5**, 4729–4738 (2026)
- Jiang et al., [Could graph neural networks learn better molecular representation for drug discovery? A comparison study of descriptor-based and graph-based models](https://doi.org/10.1186/s13321-020-00479-8), *J. Cheminform.* **13**, 12 (2021)
- Sun et al., [Does GNN pretraining help molecular representation?](https://arxiv.org/abs/2207.06010) (NeurIPS 2022)
- Deng et al., [A systematic study of key elements underlying molecular property prediction](https://doi.org/10.1038/s41467-023-41948-6), *Nat. Commun.* **14**, 6395 (2023)
- Koleiev et al., [An end-user audit of reproducibility, data leakage and overfitting of the top-ranked ADMET prediction models in TDC leaderboards](https://doi.org/10.1021/acs.jcim.6c00819), *J. Chem. Inf. Model.* **66**, 8045–8058 (2026)
- Sultan et al., [Transformers for molecular property prediction: lessons learned from the past five years](https://doi.org/10.1021/acs.jcim.4c00747), *J. Chem. Inf. Model.* **64**, 6259–6280 (2024)
- Özçelik & Grisoni, [A hitchhiker's guide to deep chemical language processing for bioactivity prediction](https://doi.org/10.1039/d4dd00311j), *Digital Discovery* **4**, 316–325 (2025) — 통제된 SMILES 대 SELFIES 비교
- Krenn et al., [Self-referencing embedded strings (SELFIES): a 100% robust molecular string representation](https://doi.org/10.1088/2632-2153/aba947), *Mach. Learn.: Sci. Technol.* **1**, 045024 (2020)
