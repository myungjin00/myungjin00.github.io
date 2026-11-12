---
title: "HuggingFace 사전학습 encoder 쓰기: 로딩, pooling, 함정"
date: 2026-11-12
description: "어떤 Auto 클래스가 표현을 주는가 · CLS와 평균 pooling을 실제로 재보면 · checkpoint가 함께 올려 둔 토크나이저가 학습에 쓴 것과 다를 수 있다 · 도메인 어휘로 얻는 것 · 그리고 masked-language checkpoint가 문장 embedding 모델이 아닌 이유"
category: tutorial
updated: 2026-11
lang: ko
group: huggingface-practice
topic: Machine learning
subtopic: Representation
tags: [HuggingFace, transformers, embeddings, tokenisation]
---

사전학습 모델은 세 줄이면 올라온다. 그게 문제다. 잘못 올려도 벡터는 멀쩡해 보인다. 이 글의 모든 숫자는 2026년 11월 12일 `transformers` 4.44.0 · `torch` 2.8.0에서 직접 측정했고, 끝의 점검 항목은 각 실수를 잡아낼 수 있었던 것들이다.

## 세 줄, 그리고 파일이 쌓이는 곳

```python
import os
os.environ["HF_HOME"] = "/scratch/hf_cache"   # transformers import 전에 설정

from transformers import AutoTokenizer, AutoModel

name = "microsoft/BiomedNLP-BiomedBERT-base-uncased-abstract-fulltext"
tok = AutoTokenizer.from_pretrained(name)
mod = AutoModel.from_pretrained(name).eval()
```

`HF_HOME`은 import **전에** 설정해야 한다. 안 그러면 캐시가 홈 디렉터리로 가서 쌓인다. base 크기 encoder 하나가 440 MB 정도이고, 몇 개만 받아도 수 GB가 된다.

알아 둘 환경 변수 둘. `HF_HUB_OFFLINE=1`은 네트워크 호출을 전면 금지하므로, 인터넷 없는 노드에서 돌릴 작업이 정말 다 캐시되어 있는지 미리 확인하는 방법이 된다. `HF_HUB_DISABLE_PROGRESS_BARS=1`은 로그 파일을 읽을 수 있게 유지한다.

## 어떤 Auto 클래스인가

여기서 첫 실질적 판단이 갈린다. 클래스가 출력이 무엇인지를 정한다.

| 클래스 | 내놓는 것 | 쓰는 경우 |
| --- | --- | --- |
| `AutoModel` | hidden state, head 없음 | **embedding**이 필요할 때 |
| `AutoModelForMaskedLM` | 어휘에 대한 logit | 가려진 자리를 맞힐 때 |
| `AutoModelForSequenceClassification` | 내 라벨에 대한 logit | 과제에 맞게 파인튜닝할 때 |
| `AutoModelForCausalLM` | 다음 토큰 logit | 생성 모델일 때 |

`AutoModelForSequenceClassification`은 **새로 초기화된 head**를 붙이고, transformers가 그걸 짚어 알려 준다. BERT checkpoint면 `classifier.weight`·`classifier.bias`, RoBERTa면 `classifier.dense`·`classifier.out_proj`다. 곧 학습할 head라면 정상인 메시지다.

RoBERTa checkpoint를 평범한 `AutoModel`로 올려도 거의 같은 경고가 뜨는데, 그쪽은 뜻이 다르다.

```
Some weights of RobertaModel were not initialized from the model checkpoint at ... and are
newly initialized: ['roberta.pooler.dense.bias', 'roberta.pooler.dense.weight']
You should probably TRAIN this model on a down-stream task ...
```

이건 pooler에 대한 것이고, `pooler_output`을 쓰지 말아야 할 이유가 그것이다. 경고가 어떤 파라미터를 짚는지 먼저 읽어야 한다.

## pooling: CLS 토큰이냐 평균이냐

`last_hidden_state`는 토큰마다 벡터 하나다. 이걸 입력마다 벡터 하나로 줄이는 건 내 선택이고, 흔한 두 선택은 서로 다른 답을 준다.

```python
import torch

def embed(texts, tok, mod):
    enc = tok(texts, padding=True, truncation=True, max_length=128, return_tensors="pt")
    with torch.no_grad():
        h = mod(**enc).last_hidden_state                    # (batch, tokens, dim)
    m = enc["attention_mask"].unsqueeze(-1)                 # padding은 평균에서 제외
    mean = (h * m).sum(1) / m.sum(1)
    cls  = h[:, 0]
    return mean, cls
```

사람들이 빼먹는 건 `attention_mask` 항이다. 이게 없으면 padding까지 평균에 들어가고, 결과가 batch 안의 가장 긴 문자열에 좌우된다. 같은 입력이 batch가 달라지면 다른 embedding이 된다.

`seyonec/ChemBERTa-zinc-base-v1`에서 입력 셋으로 측정했다. **A**와 **A′**, 이 둘은 *같은* 분자(4-chloronitrobenzene)의 유효한 SMILES (simplified molecular-input line-entry system) 문자열 두 개이고, **B**는 아스피린이다.

| 코사인 | mean pooling | CLS |
| --- | --- | --- |
| A ~ A′ (같은 분자) | 0.783 | 0.747 |
| A ~ B | 0.451 | 0.545 |
| A′ ~ B | 0.332 | 0.498 |

읽는 법이 둘이다. 쓸모 있는 쪽은 이것이다. mean pooling이 동일 쌍과 무관한 쌍을 더 깔끔하게 가른다. masked-language modelling으로 학습한 checkpoint에서 보통 나오는 결과다. <mark>문장 수준 목표로 학습하지 않았다면 CLS 자리는 무엇도 요약하도록 배운 적이 없다.</mark>

불편한 쪽은 이것이다. 한 분자의 두 표기가 1.0이 아니라 0.78에 놓인다. 다만 정확히 읽어야 한다. 이 checkpoint의 카드는 ZINC 분자 10만 개로 사전학습했다고 적고 있으므로, 이 숫자는 큰 모델에 대해 아무 말도 하지 않는다. 말해 주는 것은 불변성이 **보장이 아니라 학습의 결과**라는 점이고, 그래서 내가 고른 checkpoint에서 직접 재봐야 하는 성질이라는 점이다. 그래프는 [원리상](../graph-data-ko/) 얻고, 그것이 [문자열 관점의 변치 않는 한계](../chemical-language-models-ko/)다.

## 토크나이저가 원문으로 되돌아오는지 확인한다

가장 중요하면서 거의 아무도 돌리지 않는 점검이다.

`DeepChem/ChemBERTa-77M-MLM`은 많이 쓰이는 checkpoint다. 지난달 다운로드가 약 188,000회다. 함께 공개된 `vocab.json`은 591개 항목짜리 원자 단위 어휘이고 그중 558개가 두 글자 이상이다. `Cl`이 토큰 28번, `Br`이 37번, `[N+]`이 41번, `[C@H]`이 33번이다. 그런데 저장소에는 byte 단위 BPE (byte-pair encoding) `tokenizer.json`도 함께 올라와 있고, `AutoTokenizer`가 고르는 건 그쪽이다. 그 문자 집합에는 `l`이 없고, merge 목록도 **비어 있다** — `merges.txt`에 헤더 한 줄뿐이다 — 그래서 조각을 합쳐 `Cl`을 되만들 방법도 없다.

```python
tok = AutoTokenizer.from_pretrained("DeepChem/ChemBERTa-77M-MLM")

tok.tokenize("Clc1ccc(cc1)[N+](=O)[O-]")
# ['C', 'c', '1', 'c', 'c', 'c', '(', 'c', 'c', '1', ')', 'N', '(', '=', 'O', ')', 'O', '-']

tok.decode(tok("Clc1ccc(cc1)[N+](=O)[O-]")["input_ids"], skip_special_tokens=True)
# 'Cc1ccc(cc1)N(=O)O-'            <- 넣은 분자가 아니다

tok.tokenize("Cl"), tok.tokenize("Br"), tok.tokenize("[C@H]")
# (['C'],            ['B'],            ['C'])
```

`l`, `r`, `+`, `H`, `[`, `]`, `@`는 그 토크나이저의 문자 집합에 없고 **조용히 버려진다**. unknown 토큰도 나오지 않고 `unk_count`는 0이다. 염소가 탄소로, 브롬이 붕소로 들어가고 입체화학은 사라진다. 망가진 문자열 `Cc1ccc(cc1)N(=O)O-`를 같은 경로로 넣으면 원본과 코사인 **1.0000**이 나온다. 모델이 망가진 분자를 받고 있고 둘을 구별하지 못한다는 증거다.

어휘는 문제가 없다. 어긋난 것은 파일들끼리다. 그 저장소의 `tokenizer_config.json`은 옆에 놓인 어휘와 다른 토크나이저를 아직 가리키고 있다. 원자 단위 정규식으로 쪼개면 공개된 `vocab.json`에 전부 들어 있는 토큰이 나온다.

```python
import re, json
PAT = r"(\[[^\]]+]|Br?|Cl?|N|O|S|P|F|I|b|c|n|o|s|p|\(|\)|\.|=|#|-|\+|\\|/|:|~|@|\?|>|\*|\$|%[0-9]{2}|[0-9])"

re.findall(PAT, "BrC[C@H](O)c1ccccc1")
# ['Br', 'C', '[C@H]', '(', 'O', ')', 'c', '1', 'c', 'c', 'c', 'c', 'c', '1']   전부 vocab.json에 있음
```

반면 `seyonec/ChemBERTa-zinc-base-v1`은 문자열을 정확히 복원한다. BPE 단위는 화학적으로 임의적이다 — `['Clc', '1', 'ccc', '(', 'cc', '1', ')[', 'N', '+](=', 'O', ')[', 'O', '-]']`에서 `)[`나 `+](=`가 한 단위다. 하지만 잃는 건 없다.

<mark class="blue">그래서 새 checkpoint마다 돌릴 점검은 하나다. 입력을 토큰화하고 다시 decode해서 넣은 것과 비교한다.</mark>

```python
for s in ["Clc1ccc(cc1)[N+](=O)[O-]", "BrC[C@H](O)c1ccccc1"]:
    back = tok.decode(tok(s)["input_ids"], skip_special_tokens=True).replace(" ", "")
    assert back == s, f"{s} -> {back}"
```

세 줄이고, 이걸로 잡힌다.

## 코드를 함께 들고 오는 checkpoint

모든 checkpoint가 표준 아키텍처는 아니다. `ibm-research/MoLFormer-XL-both-10pct`는 `modeling_molformer.py`를 함께 올리고 `config.json`에 `auto_map`을 선언하므로, 올리려면 `trust_remote_code=True`가 필요하다. 저장소의 Python을 내 프로세스 안에서 실행한다는 뜻이다. 카드에서 베껴 올 플래그가 아니라 의식적으로 내릴 판단이다.

공개된 파일에서 결과를 바꾸는 것이 셋이다. 아래는 그 `config.json`과 모델 카드를 읽은 내용이고, 이 글의 다른 모든 것과 달리 이 모델은 직접 돌리지 않았다.

- **`deterministic_eval` 기본값이 `false`다.** 이 아키텍처는 `num_random_features: 32`인 linear attention을 쓰므로 feature map이 무작위이고, 카드의 예시 코드 자체가 `deterministic_eval=True`를 넘긴다. 기본값으로 두면 한 SMILES 문자열이 두 번 같은 벡터를 준다는 보장이 없다.
- **`max_position_embeddings`가 202이다.** 202 토큰보다 긴 분자는 사전학습에서 제외했고, 카드는 원자 200개 정도를 넘으면 검증되지 않았다고 적는다.
- **먼저 canonical로 바꾼다.** 카드는 학습 SMILES를 RDKit으로 canonical화하고 이성질 정보를 제거했다고, 그리고 canonical이 아닌 입력은 성능이 떨어질 수 있다고 적는다. 그러니 토큰화 전에 `Chem.MolToSmiles(Chem.MolFromSmiles(s), isomericSmiles=False)`를 거친다. 뜻을 새길 필요가 있다. 이 모델은 입체화학을 설계상 버리고, 앞의 모델은 사고로 잃었다.

카드는 호환 버전도 못 박는다. `transformers` v4에서는 `revision="compat-v4"`가 필요하다.

## 도메인 모델의 실체는 대부분 어휘다

같은 점검을 거꾸로 읽으면 도메인 사전학습이 왜 통하는지가 보인다. 평범한 생의학 단어 둘을 토큰화해 보면 이렇다.

| checkpoint | `cyclooxygenase` | `thrombocytopenia` |
| --- | --- | --- |
| `microsoft/BiomedNLP-BiomedBERT-base-uncased-abstract-fulltext` | 1조각 | 1조각 |
| `dmis-lab/biobert-base-cased-v1.2` | 8조각 | 6조각 |
| `bert-base-uncased` | 5조각 | 6조각 |

BioBERT는 일반 도메인 BERT에서 사전학습을 이어받으며 어휘를 그대로 유지했기 때문에, 약물 분류 이름이 단어 조각으로 흩어진다. PubMedBERT는 어휘를 PubMed에서 새로 만들었으므로 같은 단어가 한 단위이고 학습할 embedding도 하나다. 이것이 그 결과의 부수 효과가 아니라 기작이고, [약 설명문을 읽는 노트](../biomedical-text-encoders-ko/)에서 다룬다.

## masked-language checkpoint는 문장 embedding 모델이 아니다

문장 넷을 준비했다. 같은 약리를 다르게 쓴 두 문장(`para1`, `para2`), 임상 기록 한 문장, 새에 대한 한 문장. 쓸 만한 embedding 공간이라면 두 패러프레이즈는 가깝고 새는 멀어야 한다. mean pooling, 코사인이다.

| checkpoint | 패러프레이즈 쌍 | 무관한 쌍 | 간격 |
| --- | --- | --- | --- |
| `bert-base-uncased` | 0.854 | 0.444 | 0.410 |
| `dmis-lab/biobert-base-cased-v1.2` | 0.902 | 0.813 | 0.089 |
| `microsoft/BiomedNLP-BiomedBERT-...-abstract-fulltext` | 0.988 | 0.957 | **0.031** |
| `pritamdeka/S-PubMedBert-MS-MARCO` | 0.963 | 0.827 | 0.136 |
| `ncbi/MedCPT-Query-Encoder` | 0.930 | 0.514 | 0.416 |
| `cambridgeltl/SapBERT-from-PubMedBERT-fulltext` | 0.824 | 0.364 | 0.460 |

PubMedBERT는 패러프레이즈에서 0.988을 낸다. 다음 칸을 읽기 전까지는 훌륭해 보인다. 금화조에 대한 문장에도 0.957을 낸다. <mark>공간 전체가 좁은 띠로 눌려 있어서 코사인이 높다는 사실 자체가 아무 뜻이 없다.</mark> 파인튜닝용 encoder로는 강하고, 그대로 쓰는 유사도 척도로는 나쁘다.

패러프레이즈와 새 문장을 0.1 이상 벌려 놓은 생의학 checkpoint 셋은 모두 문장 수준 목표로 추가 학습을 받았다. MedCPT는 검색 쌍, MS MARCO 변형은 질문–본문 쌍, SapBERT는 생의학 어휘의 동의어 쌍이다. 코사인 유사도가 필요하면 그중에서 고르고, 어차피 파인튜닝할 거라면 원본 encoder가 맞는 출발점이다. [linear probing과 전체 파인튜닝의 구분](../transfer-learning-ko/)과 같은 이야기다.

## 숫자를 바꾸는 자잘한 것들

- **`.eval()`과 `torch.no_grad()`.** `eval()`이 없으면 dropout이 켜진 채라 같은 입력이 다른 벡터를 준다. `no_grad()`가 없으면 쓰지도 않을 그래프를 들고 있다가 긴 batch에서 메모리가 터진다.
- **truncation은 조용하다.** `max_length=128`만 주고 `truncation=True`를 빼면 버전에 따라 오류가 나기도 하고 그냥 넘어가기도 한다. 둘 다 주고, 실제로 한계에 닿은 입력이 몇 개인지 세어 본다.
- **batch는 묶되 padding을 본다.** 길이로 정렬해서 묶으면 padding이 크게 줄어든다. mask로 평균을 내면 결과가 그대로이고, mask 없이 내면 달라진다.
- **device와 dtype.** `mod.to("cuda")`와 `enc.to("cuda")`를 맞춘다. `torch.float16`은 메모리를 대략 절반으로 줄이고 코사인을 소수 셋째 자리에서 흔든다. 검색에는 괜찮고, 보고할 숫자로는 안 된다.
- **버전을 고정한다.** 토크나이저 기본값은 릴리스마다 바뀐다. `clean_up_tokenization_spaces` 기본값이 4.45에서 바뀌었다. 보관하는 embedding 옆에 `transformers` 버전을 같이 적어 둔다.

## 모델 카드를 먼저 읽는다

- **무엇으로 학습했는지.** 내 텍스트가 애초에 그 도메인인지가 여기서 갈린다.
- **의도된 head.** "과제에 맞게 파인튜닝하라"고 적힌 카드는 embedding 모델을 주겠다는 뜻이 아니다.
- **라이선스와 gating.** 약관 동의와 토큰이 필요한 가중치가 있다. `huggingface-cli login`을 한 번 해 두고, 토큰은 공유하는 스크립트에 절대 넣지 않는다.
- **최대 길이.** BERT 계열은 512 토큰이다. 긴 초록은 잘리고, 잘린 사실은 보이지 않는다.
- **어떤 토크나이저인지.** 카드와 파일이 어긋나거나, 위처럼 파일끼리 어긋나면 round-trip을 믿는다.

## 정리

- `HF_HOME`은 transformers import **전에** 설정한다. 아니면 캐시가 홈 디렉터리에 쌓인다
- embedding은 `AutoModel`, `...For...` 클래스는 head를 붙이며 새 head는 무작위다
- `attention_mask`로 mean pooling을 한다. 문장 수준 목표가 학습시키지 않았다면 CLS는 아무것도 요약하지 않는다
- **새 checkpoint는 토크나이저를 round-trip**해 본다. `DeepChem/ChemBERTa-77M-MLM`을 `AutoTokenizer`로 올리면 `Cl`이 `C`로, `Br`이 `B`로 바뀌고 입체화학이 사라지는데 경고할 unknown 토큰도 없다
- `auto_map`이 있는 checkpoint는 `trust_remote_code=True`로 자기 코드를 실행하며, MoLFormer는 추가로 `deterministic_eval=True`와 canonical 입력을 원한다
- 도메인 모델의 이득은 상당 부분 어휘다. `cyclooxygenase`가 PubMedBERT에서 1조각, BioBERT에서 8조각이다
- masked-language checkpoint는 유사도 모델이 아니다. PubMedBERT는 무관한 문장을 0.957에 놓고, 쌍으로 학습한 MedCPT·SapBERT는 제대로 가른다
- `.eval()`, `no_grad()`, 명시적 `truncation`, 버전 고정, 그리고 벡터 옆에 버전 기록

## 참고

- [transformers: Auto 클래스](https://huggingface.co/docs/transformers/model_doc/auto) — `AutoModelFor...`가 각각 무엇을 붙이는가
- [transformers: padding과 truncation](https://huggingface.co/docs/transformers/pad_truncation) — 인자 조합과 각각의 동작
- [huggingface_hub: 환경 변수](https://huggingface.co/docs/huggingface_hub/package_reference/environment_variables) — `HF_HOME`, `HF_HUB_OFFLINE` 등
- Reimers & Gurevych, [Sentence-BERT: sentence embeddings using Siamese BERT-networks](https://doi.org/10.18653/v1/D19-1410), *EMNLP-IJCNLP* (2019) — 코사인이 뜻을 가지려면 문장 수준 목표가 왜 필요한가
