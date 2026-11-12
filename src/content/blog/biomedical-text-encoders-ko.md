---
title: "약 설명문을 읽는 모델"
date: 2026-11-12
description: "약 설명문은 구조가 말하지 않는 약리를 담는다 · 그 설명문이 어디서 오는가 · 적응증 필드에 숨은 label leakage · BioBERT 이후의 계보 · BLURB가 정하는 것과 정할 수 없는 것 · 과제별로 무엇을 집을까 · 그리고 decoder LLM이 이걸 대체했는가"
category: concept
updated: 2026-11
lang: ko
group: biomedical-text-encoders
topic: Bioinformatics
subtopic: Representation
tags: [BioBERT, text embeddings, drug repurposing, label leakage]
---

화학 언어 모델이라는 이름으로 서로 다른 둘이 불린다. 하나는 [문자열로 적은 분자](../chemical-language-models-ko/)다. 구조를 다시 적은 것이고 더해진 정보가 없다. 다른 하나는 그 화합물에 대해 사람들이 써 놓은 설명문이다. 무엇에 쓰이는지, 어떻게 작용한다고 보는지, 환자가 먹으면 무엇이 잘못되는지, 그리고 초록 수천 편.

이 글은 두 번째에 대한 것이다. 실패 양식이 다른 별개의 입력이고, 그 실패 양식이 흥미로운 부분이다. <mark class="blue">모델에게 정답을 조용히 건네줄 가능성이 가장 큰 입력이 텍스트다.</mark>

## 그 설명문이 어디서 오는가

| 출처 | 어떤 텍스트인가 |
| --- | --- |
| DrugBank | 약마다 정리된 산문. 적응증, 약력학, 작용 기전, 상호작용 |
| SIDER | 약물 라벨에서 읽어낸 부작용 용어를 어휘 체계에 코딩한 것 |
| DisGeNET | 유전자–질병 연관. 점수가 있고, 큐레이션과 텍스트 마이닝에서 온다 |
| PubMed 초록 | 원문 문헌 그 자체, 그리고 생의학 encoder가 사전학습하는 코퍼스 |

이 중 여럿은 [데이터베이스 페이지](../databases/)에 규모와 이용 조건과 함께 정리해 두었다.

## 텍스트가 주고 구조가 주지 못하는 것

**약리**를 담는다. 구조는 그걸 말하지 않는다.

서로 무관한 골격으로 만들어진 두 약이 같은 질환에 처방되면, 지문 공간에서는 멀고 텍스트에서는 가깝다. 그 둘에 대해 쓰인 문장이 거의 같은 문장이기 때문이다. 그 유사성은 원자에서 끌어낼 수 없다. [repurposing](../repurposing-ko/) 방법이 원하는 신호가 바로 그것이고, 구조 view를 하나 더 붙이는 대신 텍스트 view를 붙이는 정직한 이유다.

## 함정: 정답이 입력에 들어 있다

DrugBank의 적응증 텍스트를 encoding하고 치료 분류를 맞히는 모델을 학습시킨다. 점수는 훌륭하게 나오고, 아무 뜻이 없다. **그 텍스트가 이 약이 무엇에 쓰이는지를 적어 둔 설명문이기 때문이다.**

표현 학습의 옷을 입은 label leakage다. 놓치기 쉽다. 파이프라인에 이상해 보이는 데가 없기 때문이다. 코퍼스, encoder, 파인튜닝, 떼어 둔 테스트셋. 누출은 절차에 있는 게 아니라 필드에 있다.

정직하게 유지하는 방법 셋.

- **결과를 적은 필드를 뺀다.** 목표가 적응증이면 적응증과 기전 텍스트는 입력에 못 들어간다. 그 구절만 지우는 건 부족하다. 기전 문장도 보통 질병 이름을 말하고, 어떤 연구가 임상시험 프로토콜에서 약을 식별하는 필드를 전부 지웠을 때도 언어 모델이 약물 분류를 45% 맞혔다.
- **약 단위로 떼어 둔다.** 문장 단위로 나누면 같은 약의 설명문이 split 양쪽에 들어간다.
- **텍스트를 ablation한다.** 적응증 문장을 빼고 다시 학습한다. 성능이 바닥으로 무너지면 모델이 답을 읽고 있었던 것이고, 유지되면 그 아래에 표현이 있었던 것이다. [누출 점검](../evaluation-protocol-ko/)의 라벨 섞기와 같은 반사 동작이다.

## 2026년에 이름이 붙었다 — 유전자와 임상시험에서, 약은 아직

올해까지 이 실패는 측정은 되어 있었지만 타당성 위협으로 불린 적이 없었다. 2026년에 나온 세 연구가 이름을 붙였고, 크기에 대해서는 서로 다른 답을 낸다. 그 불일치가 쓸 만한 부분이다.

**유전자 요약문.** Alliance of Genome Resources가 Gene Ontology 주석을 문장으로 바꾸고, NCBI Gene이 그걸 보여 주고, 어떤 유전자 embedding 모델이 그것을 입력으로 받는다. 그 요약문은 사람 단백질 코딩 유전자 19,256개 중 6,172개를 덮는다. 같은 코퍼스를 그 요약문 없이 embedding하고 probe를 다시 맞추면, 논문이 1~10편인 유전자에서 유전자별 AUROC가 **0.078** 떨어졌다 (95% bootstrap 구간 0.072–0.084). 평범한 TF-IDF encoder도 그 요약문에서 이득을 봤는데, encoder가 정교해서 생긴 일이 아니라는 뜻이다.

**임상시험 프로토콜.** 어떤 약을 시험했는지 식별하는 필드를 전부 가린 뒤, 남은 텍스트에서 무엇이 살아남는지 물은 연구가 있다. 언어 모델이 가려 둔 약물 분류를 **45% 맞혔다.** 저자들은 그 때문에 자기 측정값을 하한으로 취급한다.

**종양 임상시험 초록, 그리고 작게 나온 측정.** 셋 중 유일하게 심사를 거친 연구는 두 군을 비교한 종양 임상시험 250건에서 근거를 단계적으로 지워 봤다. 제목과 초록을 다 주면 0.96–0.97, 제목만 주면 0.79–0.88, **DOI만** 주면 다수 클래스 기준선 58.4%에 대해 0.63–0.67이었다. 식별자도 신호를 담고 있지만 저자들은 그 정도를 제한적이라고 부른다. 그다음 결과 문장을 실제와 반대로 뒤집어 넣었더니 모델들이 뒤집힌 텍스트를 0.96–0.99로 따라갔다. 그 과제에서 모델은 알아보는 게 아니라 대체로 읽고 있었다.

합치면 이렇다. 누출은 실재하고 측정 가능하며, 그 크기는 상수가 아니라 데이터셋의 성질이다. <mark>변하지 않는 건 정답을 적은 필드를 지워도 정답이 지워지지 않는다는 점이다.</mark>

약 쪽은 아직 점검되지 않았다. DrugBank의 description·indication·pharmacodynamics 필드와 치료 분류 또는 작용 기전의 관계다. 방법은 유전자 논문이 그대로 제시한다. 같은 코퍼스를 결과를 담은 필드가 있는 판과 없는 판으로 embedding하고, probe를 다시 맞추고, 화합물마다 쓰인 글의 양으로 층을 나눠 약별 차이를 보고하고, TF-IDF 대조군을 같이 둔다.

올해 전까지는 약 쪽에서 이 기작이 두 번 측정되었고, 문제가 아니라 발견으로 보고되었다.

**프롬프트 안에서.** 화학 과제 8개로 대형 언어 모델을 평가한 벤치마크에서 GPT-4가 HIV 활성 예측 F1 **0.977**을 냈는데, 그 프롬프트에 *inhibit HIV replication*이라는 구절이 들어 있었다. 라벨의 의미를 프롬프트에서 빼면 **0.554**로 떨어지고 정확도는 0.986에서 0.628로 내려갔다. 논문은 이것을 발견 목록에 넣고, 라벨 의미가 프롬프트에 있으면 물성 예측이 더 쉬워진다고 적는다.

**데이터베이스 필드 안에서.** DrugBank 자유 텍스트를 노드 feature로 더한 지식 그래프 모델에 약의 ATC (anatomical therapeutic chemical) 분류를 맞히게 했다. 그 논문의 오류 분석이 예를 들어 준다. cidofovir의 설명문은 그 약을 *injectable antiviral medication*이라고 적고, 정답 분류는 *direct acting antivirals*이며, 텍스트 모델은 정답을 1위에 놓고 구조만 쓰는 모델은 25위에 놓는다. 이것도 텍스트가 도움이 됐다는 틀로 적혀 있다.

발표된 비판에 가장 가까운 것은 적응증이 애초에 틀린 예측 목표라고 주장한다. feature가 그걸 담고 있기 때문이다. 입력이 **어떤** 표적 단백질에 친화도 데이터가 존재하는가 뿐인 모델이 14개 치료 분류를 47.3%로 맞힌다. 무작위는 7.14%다 ([Kim et al.](https://proceedings.mlr.press/v209/kim23a.html), CHIL 2023).

분야가 실제로 막는 것은 문제보다 좁다. 분자-텍스트 연구의 표준 예방 조치는 분자의 **이름**을 "The molecule"로 바꾸는 것이다. 이름은 지우고, 그 분자의 분류나 역할을 적은 문장은 온전히 남긴다. 통제되지 않은 사례도 쉽게 찾는다. 2025년 한 논문은 생의학 BERT로 **약 이름**을 embedding한 것과 **부작용 용어**를 embedding한 것의 코사인 유사도로 약–부작용 쌍을 AUC 0.915로 예측한다. 모델에 구조는 전혀 없고, 코퍼스는 바로 그 관계를 서술한 PubMed 초록이다.

그래서 이것은 일반 leakage 분류의 *부당한 feature* 범주 안에 들어가고, 그중 약 설명문에 해당하는 종을 아무도 점검하지 않았다.

## 그래서 텍스트를 더하면 예측이 나아지는가

거의 나아지지 않고, 확실히 나아지는 한 곳이 가장 자세히 봐야 할 곳이다.

가장 깔끔한 발표된 비교는 같은 MoleculeNet 6개 세트에서 과제 전용 모델과 instruction tuning한 언어 모델을 나란히 놓는다.

| | ESOL (RMSE) | Lipophilicity (RMSE) | BBBP (정확도) | ClinTox (정확도) | HIV (정확도) | SIDER (정확도) |
| --- | --- | --- | --- | --- | --- | --- |
| 과제 전용 모델 | **0.819** | **0.612** | 85.3 | 92.4 | 97.0 | 70.0 |
| GPT-4 | 2.570 | 1.545 | 62.9 | 50.0 | 59.6 | 57.6 |
| 가장 좋은 instruction tuning 7B | 1.150 | 1.010 | 74.6 | 93.1 | 96.7 | 70.7 |

행이 아니라 열을 읽어야 한다. 텍스트 모델이 비기거나 앞서는 칸 — ClinTox, HIV, SIDER — 은 심하게 불균형한 이진 세트의 정확도이고, 다수 클래스만 찍어도 나오는 값 근처에 있다. [잘못 고른 지표가 가리는](../metrics-ko/) 바로 그 숫자다. 그렇게 속일 수 없는 두 열은 회귀 RMSE 둘이고, 거기서 텍스트 모델은 **40~65% 나쁘고** GPT-4는 두 배 반에서 세 배 조금 넘게 나쁘다.

표현을 통제해 비교한 연구도 같은 방향을 가리킨다. 평범한 ECFP4 지문에 작은 신경망을 붙인 것이 SIDER와 BACE에서 그래프 사전학습과 LLM이 쓴 텍스트 표현을 모두 앞섰고, 텍스트 방법의 대표 성과인 ClinTox 승리는 표준편차가 **±17.63**이었다. 비교 대상이던 그래프 사전학습 베이스라인들을 품을 만큼 넓다.

여기서 논의가 한 바퀴 돌아온다. 이 문헌에서 재현되는 "텍스트가 물성 예측에 도움이 된다"는 결과는 **ClinTox**에 몰려 있다. MoleculeSTM이 그래프 쪽에서 거기서만 큰 이득을 보고하고 다른 데서는 거의 보고하지 않는다. ClinTox는 분자 1,478개이고 라벨은 임상시험 실패이며, 음성 쪽은 승인된 약이다. DrugBank와 PubChem 텍스트가 승인되었다고 서술해 둔 바로 그 분자들이다. 적응증 필드와 같은 이야기가 데이터셋 하나 아래에서 반복된다.

두 설명을 가려낼 ablation을 돌린 논문은 찾지 못했다. 누군가 돌리기 전까지, 텍스트가 화학을 가르친다는 이 분야의 대표 근거는 텍스트가 작고 불균형한 세트에서 라벨을 다시 말하고 있다는 설명과 똑같이 잘 맞는다.

2026년의 인접한 결과 하나는 범위를 함께 적어 둘 만하다. [과제 조건화 encoder](https://arxiv.org/abs/2602.04696)에 각 독성 과제의 올바른 자연어 설명을 주고, 다음에는 무작위로 고른 설명을 줬다. AUROC가 **97.5**에서 **92.4**로 떨어졌고, 분포 밖의 무작위 문자열은 92.5로 분포 안의 것보다 나을 게 없었다. 표준편차 하나 범위에서 겹치므로 깔끔한 분리가 아니라 방향으로 읽어야 한다. 즉 약 5점이 조건화 벡터의 존재가 아니라 텍스트의 *의미*에 있었다. 깔끔한 증명이지만 그 텍스트가 무엇인지는 짚어야 한다. 화합물에 대한 산문이 아니라 과제에 대한 설명이다.

## 텍스트가 쓰이는 자리, 과제별로

물성 예측이 이 기법의 주된 거처가 아니다. 논문 수로 보면 약에 대한 산문이 가장 많이 쓰이는 곳은 **약물 상호작용**과 **repurposing**이다. 물성 예측에서 "텍스트"는 거의 항상 *분자 캡션* — PubChem record description이나 LLM이 쓴 단락 — 이고 임상적인 약 설명문이 아니다. 부작용 예측에서는 약마다의 산문이 거의 쓰이지 않는다.

중요한 건 **텍스트를 빼 보고 결과를 보고하는** 논문이 어느 것이냐다. 대부분은 하지 않는다. 아래는 한 것들이다.

| 과제 | 논문 | ablation이 보여주는 것 |
| --- | --- | --- |
| zero-shot DDI | [TextDDI](https://doi.org/10.18653/v1/2023.emnlp-main.918), EMNLP (2023) | 약 ID만 F1 21.1 → 이름만 42.1 → 잘라낸 산문 48.0 → 골라낸 산문 **52.5** |
| 부작용 | [PromptSE](https://doi.org/10.1038/s41598-026-55667-7), *Sci. Rep.* **16** (2026) | 분자 feature가 없으면 텍스트가 AUPR **+0.131**, 넣으면 **+0.007**, 그리고 네 지표 중 둘은 더 나빠진다 |
| repurposing | [Asada et al.](https://doi.org/10.3389/frma.2021.670206), *Front. Res. Metr. Anal.* **6** (2021) | 텍스트가 DistMult의 macro 평균 MRR을 주입 방식 셋 모두에서 **떨어뜨렸고** TransE에서는 셋 중 둘에서 떨어뜨렸으며, 관계 여덟 개 중 넷에서 텍스트 없는 쪽이 가장 좋았다 |
| repurposing | [LLaDR](https://doi.org/10.18653/v1/2025.findings-emnlp.751), Findings of EMNLP (2025) | 같은 backbone에서 MRR +0.057에서 +0.076, 텍스트를 더 가릴수록 떨어진다 |
| 물성 예측 | [MolCap-Arena](https://arxiv.org/abs/2411.00737), ICLR 워크숍 (2025) | 가장 좋은 캡션 모델이 텍스트 없는 그래프 신경망보다 ROC-AUC 2.03 높다. 그리고 **빈 캡션 대조군이 82.97, 그래프 모델이 82.96이다** |
| DDI | [Im & Ko](https://doi.org/10.3390/biomedicines13102355), *Biomedicines* **13** (2025) | 텍스트만 0.9584가 구조만 0.9495를 이기고, 합치면 0.9655 |
| repurposing | [HeTDR](https://doi.org/10.1016/j.patter.2021.100307), *Patterns* **2** (2021) | BioBERT 텍스트 feature를 빼면 AUROC가 0.043 떨어진다 |
| 부작용 | [HMMF](https://doi.org/10.1186/s12859-024-05806-6), *BMC Bioinform.* **25** (2024) | **구조**를 빼도 거의 손실이 없다. 전체 모델 0.9428에 0.9412 |
| DDI | [Shtar et al.](https://doi.org/10.1186/s12859-022-05083-1), *BMC Bioinform.* **23** (2022) | 전체 데이터에서는 텍스트가 0.78로 0.79에 지고, 알려진 상호작용이 셋 미만인 약에서는 0.76으로 0.63을 이긴다 |

하나의 패턴이 전체를 가로지른다. <mark>텍스트는 구조가 없거나 그 화합물이 처음일 때 값어치를 한다</mark> — zero-shot, cold-start, 상호작용 기록이 없는 약 — 그리고 모델에 분자 feature가 들어오면 그 값어치가 줄거나 뒤집힌다.

여기서 가장 날카로운 숫자는 빈 캡션 대조군이다. 텍스트 채널에 **아무것도** 없는 융합 모델이 평범한 그래프 모델과 같은 점수를 낸다. 보고된 이득이 추가 파라미터가 아니라 단어에서 와야 한다는 뜻이고, 보고된 이득 대부분은 그렇게 검증된 적이 없다.

논쟁을 끝낼 실험은 아직 없다. **cold-start나 scaffold split에서 텍스트 유무 ablation을 보고한 논문이 없다.** cold-start 실험을 돌린 논문들은 ablation을 warm으로 돌린다.

이 문헌을 읽을 때 하나 더 주의할 것. 가장 많이 인용되는 논문 여럿이 산문을 아예 쓰지 않는다. DeepDDI는 약 이름과 구조를 받고 문장을 *출력으로* 만든다. DDIMDL은 구조화된 feature 표를 쓴다. Decagon은 부작용 이진 지시자를 쓴다. SMILES를 "텍스트"라고 부르는 모델도 하나가 아니다. 언어에 대한 근거로 인용하기 전에 그 모델에 실제로 무엇이 들어갔는지 확인해야 한다.

## 상호작용 밖에서는: 지는 자리, 그리고 아무도 안 해 본 자리

물성 예측·상호작용·repurposing을 벗어나면, 논문 수가 주는 인상보다 그림이 좋지 않다.

| 과제 | 근거가 뒷받침하는 것 |
| --- | --- |
| 결합친화도에 쓰는 assay 설명문 | **가장 잘 뒷받침되는 경우.** 독립적인 텍스트 유무 ablation 세 건이 모두 양성이고, 효과 크기는 모두 작다 |
| 임상시험 결과 | 논쟁 중. 깔끔한 ablation 한 건은 선정 기준을 빼도 상관없고 간단 요약만 신호를 담는다고 본다 |
| 기능 전이에 쓰는 단백질 설명문 | 이득이 크고, 그 입력 텍스트가 정답을 바꿔 말한 것이다 |
| 약물감시 서술 | **뒷받침되지 않는다.** 아래 참조 |
| 문헌 기반 타깃 우선순위 | **뒷받침되지 않는다.** 아래 참조 |
| 산문으로 하는 ADMET·약동학 | **해당하는 연구가 없다** |

이 중 둘은 숫자를 적어 둘 만하다.

**약물감시.** 후보 논문 서른 편쯤 중에서, 같은 보고서의 코딩된 필드와 서술 텍스트를 제대로 견준 비교는 셋뿐이다. 가장 잘 측정된 쪽은 Guillain–Barré 의심 사례 분류인데, 서술 텍스트가 **AUC 0.777**이고 MedDRA 코딩 방식이 **0.904**다. 텍스트가 0.127 진다. 그 논문의 결론은 징후와 증상만으로는 사례 분류에 부족하고, 특이도가 우선일 때만 그쪽이 낫다는 것이다.

**타깃 우선순위.** 한 연구는 자기 언어 모델의 유전자 순위를 PubMed 논문 편수와 맞춰 봤다. 검색을 전혀 쓰지 않은 상태에서 Spearman **ρ = 0.795**였고, 검증에 쓴 벤치마크 자체가 ρ = 0.802로 같은 편향을 갖고 있었다. 아무것도 검색하지 않은 모델이 논문 편수를 세는 것만큼 유전자를 잘 정렬하고, 그 판정 기준이 바로 그 논문들로 만든 자료다. 앞에서 말한 문헌 편향이 측정된 것이다.

그리고 빈 칸은 소리 내어 말해 둘 만하다. ADMET이나 약동학에 산문을 입력으로 쓴 연구는 발표된 것이 없다. 약 설명문을 거기에 쓰고 싶었다면 따를 선례도, 이길 베이스라인도 없다.

## 사라지지 않는 한계 둘

**문헌 편향.** 많이 연구된 약에는 쓰인 텍스트가 많으니, 텍스트 커버리지는 그 화합물이 어떻게 작동하는지가 아니라 얼마나 주목받았는지를 따라간다. [GO (Gene Ontology) 주석에 적용되는 비판과 같은 것](../gene-sets-ko/)이다. 유명한 항목은 유명하다는 이유로도 연결이 많아 보인다.

**새 화합물에는 설명문이 아예 없다.** 그 산문은 약이 연구되고 승인되고 처방되고 정리되었기 때문에 존재한다. 예측이 결정을 바꿀 수 있는 상황의 정반대다. 텍스트 view는 가장 필요하지 않은 곳에서 가장 강하고, 지난주 스크리닝에서 나온 골격에 대해서는 침묵한다. [구조 view](../descriptors-fingerprints-ko/)에는 그런 빈틈이 없다. 분자에는 전부 구조가 있다.

## 계보

이걸 처음부터 사전학습하지는 않는다. 생의학 encoder에서 출발하고, 계보는 머리에 담을 만큼 짧다.

| 모델 | 발표 | 코퍼스와 방식 | 가중치 |
| --- | --- | --- | --- |
| [SciBERT](https://doi.org/10.18653/v1/D19-1371) | EMNLP-IJCNLP (2019) | Semantic Scholar 논문 114만 편, 토큰 31.7억, 대부분 생의학. **자체 어휘로 처음부터** | `allenai/scibert_scivocab_uncased` |
| [ClinicalBERT](https://doi.org/10.18653/v1/W19-1909) | NAACL Clinical NLP 워크숍 (2019) | MIMIC-III 임상 기록 약 200만 건. BioBERT에서 이어 학습 | `emilyalsentzer/Bio_ClinicalBERT` |
| [BlueBERT](https://doi.org/10.18653/v1/W19-5006) | ACL BioNLP 워크숍 (2019) | PubMed와 MIMIC-III. **BLUE** 벤치마크를 도입 | `bionlp/bluebert_pubmed_mimic_uncased_L-12_H-768_A-12` |
| [BioBERT](https://doi.org/10.1093/bioinformatics/btz682) | *Bioinformatics* **36** (2020) | 일반 BERT에서 PubMed 45억 단어·PMC 135억 단어로 사전학습을 **이어서** 하고, BERT의 원래 어휘를 유지 | `dmis-lab/biobert-base-cased-v1.2` |
| [PubMedBERT](https://doi.org/10.1145/3458754) | *ACM Trans. Comput. Healthc.* **3** (2021) | PubMed 초록 1,400만 편, 약 32억 단어. **도메인 어휘로 처음부터** 사전학습. **BLURB**를 도입 | `microsoft/BiomedNLP-BiomedBERT-base-uncased-abstract-fulltext` |
| [SapBERT](https://doi.org/10.18653/v1/2021.naacl-main.334) | NAACL (2021) | UMLS의 모든 동의어 표면형에 대한 metric learning | `cambridgeltl/SapBERT-from-PubMedBERT-fulltext` |
| [LinkBERT](https://doi.org/10.18653/v1/2022.acl-long.551) | ACL (2022) | 같은 PubMed 코퍼스에 **인용 링크**를 더해, 논문을 그것이 인용한 논문 옆에서 보게 한다 | `michiyasunaga/BioLinkBERT-base` |
| [GatorTron](https://doi.org/10.1038/s41746-022-00742-2) | *npj Digit. Med.* **5** (2022) | 비식별화된 EHR 서술 820억 단어 이상. 파라미터 3.45억·39억·89억 | `UFNLP/gatortron-base` |
| [KRISSBERT](https://doi.org/10.18653/v1/2022.findings-emnlp.61) | Findings of EMNLP (2022) | UMLS 개체 347만 개에 대한 자기지도 mention. **문맥** prototype으로 연결 | `microsoft/BiomedNLP-KRISSBERT-PubMed-UMLS-EL` |
| [MedCPT](https://doi.org/10.1093/bioinformatics/btad651) | *Bioinformatics* **39** (2023) | PubMed 검색 로그 2억 5,500만 건으로 contrastive 학습. query tower와 document tower | `ncbi/MedCPT-Query-Encoder` |
| [BioLORD-2023](https://doi.org/10.1093/jamia/ocae029) | *JAMIA* **31** (2024) | 개념 정의와 관계를 쓴 문장 embedding 모델 | `FremyCompany/BioLORD-2023` |

이 표에서 순위보다 중요한 발견이 둘이다.

**PubMedBERT가 찾은 것**은 이렇다. 이만큼 구별되는 도메인에서는 일반 모델을 적응시키는 것보다 처음부터 사전학습하는 쪽이 낫다. 어휘 자체가 틀려 있었기 때문이다. 기작은 토큰화 한 줄에서 보인다. `cyclooxygenase`가 PubMedBERT에서는 토큰 하나이고 BioBERT에서는 단어 조각 여덟 개다. [측정값은 여기](../huggingface-practice-ko/) 있다.

**LinkBERT가 찾은 것**은 이렇다. 코퍼스는 문서를 담은 자루가 아니다. 링크로 이어진 논문들을 한 문맥에 넣는 것이 같은 초록을 한 번 더 훑는 것보다 많이 얻는다. 둘 다 아키텍처가 아니라 코퍼스에 대한 논거이고, 두 모델 다 속은 평범한 BERT다.

## BLURB가 정하는 것과 정할 수 없는 것

BLURB는 개체명 인식, 관계 추출, PICO 추출, 문장 유사도, 문서 분류, 질의응답을 묶고 macro 평균을 낸다. 2026년 11월 기준 리더보드에서 열한 행을 가져왔다.

| 모델 | BLURB macro |
| --- | --- |
| BioLinkBERT-large | **84.30** |
| BioM-ALBERT-xxlarge-PMC | 84.10 |
| BioLinkBERT-base | 83.39 |
| PubMedBERT-large | 82.91 |
| BioELECTRA-base | 82.60 |
| PubMedBERT-base (초록) | 81.16 |
| BioBERT | 80.34 |
| SciBERT | 78.86 |
| ClinicalBERT | 77.29 |
| BlueBERT | 76.27 |
| BERT-base | 76.11 |

인용하기 전에 주의할 것 셋.

- **이 열한 행 중 다섯 개가 제3자가 낸 값이다.** BioBERT·SciBERT·ClinicalBERT·BlueBERT와 일반 BERT는 BLURB를 보고한 적이 없다. 그 숫자는 PubMedBERT 논문의 Table 6에서 왔다. PubMedBERT-base 값도 하나가 아니다. 위의 값은 그 논문 자신의 Table 6 수치이고, 리더보드에는 뒤에 나온 파인튜닝 연구의 더 높은 값이 올라가 있다.
- **텍스트가 많다고 더 좋은 텍스트는 아니다.** PubMedBERT는 초록만으로 81.16, 초록에 전문을 더해 81.01이다. 조금 떨어졌고, 학습을 60% 더 해야 81.50에 닿는다. 그런데도 사람들이 내려받는 건 초록+전문 checkpoint다. 전문이 도움이 된다고 말하면 안 된다.
- **BLURB는 문헌 전용이라 임상 encoder를 고를 수 없다.** ClinicalBERT는 이 표 아래쪽에 있으면서 이 계열에서 가장 많이 내려받는 모델이다. 병원 기록은 다른 방언이고 BLURB에는 그게 한 건도 없기 때문이다.

## 무엇을 집을까

| 내가 가진 텍스트 | 집을 것 | 왜 |
| --- | --- | --- |
| 초록, 문헌 | **BiomedBERT-base**, 발표된 최고 숫자가 필요하면 BioLinkBERT-large | 그 순서가 리더보드뿐 아니라 이 값을 보고한 논문들에서도 유지된다 |
| 임상 기록 | **BioClinical ModernBERT**, 기존 연구 재현에는 Bio_ClinicalBERT | 파라미터 1.5억·문맥 8,192 토큰으로 임상 과제 5개 중 4개에서 ClinicalBERT와 GatorTron을 모두 앞섰다고 보고된다. 다만 아직 프리프린트다 |
| mention 문자열에서 사전 항목으로 | **SapBERT** | 파인튜닝이 필요 없고, 과제가 표면형 정규화다 |
| mention과 문맥에서 개념 ID로 | **KRISSBERT** | 데이터셋 7개 평균에서 SapBERT 66.4에 대해 77.4. 중의성을 푼다 |
| 논문 검색 | **MedCPT** | PubMed에 대한 검색 증강 생성에서 아직 기본값으로 권장된다 |

2024–2026 문헌이 뒤집은 것이 하나 있다. 도메인 전용 embedder가 좋은 범용 모델보다 **확실히 낫지는 않다**. MedCPT 논문은 2023년에 3.3억 도메인 모델이 1,750억 범용 모델을 이기는 걸 보였다. 그 뒤 가장 깔끔한 맞대결에서는 범용 BGE-large가 생의학 검색에서 MedCPT를 조금 앞서고, 2026년의 추론 중심 의료 벤치마크는 70억 규모에서는 도메인 사전학습으로 얻는 것이 없다고 본다. 지금은 규모가 도메인보다 더 중요하고, 어려운 버전의 과제는 아무도 잘하지 못한다.

## 서지 기록이 나빠지고 있다

앞의 추천 표에는 소리 내어 말해 둘 것이 있다. 2023년 이후로는 이 모델들 중 심사를 거친 발표가 있는 것이 몇 개뿐이다. *Bioinformatics*의 MedCPT와 *JAMIA*의 BioLORD-2023 정도다. BioClinical ModernBERT, Clinical ModernBERT, ModernBERT-bio 계열, MedTE, 그리고 2025–2026년 embedding 모델 대부분은 **arXiv 프리프린트**이고, 널리 쓰이는 checkpoint 중에는 논문이 아예 없는 것도 있다.

사용량은 인용 가능성과 반대로 간다. 2026년 11월 12일까지 한 달 다운로드 기준이다.

| checkpoint | 다운로드 | 논문 |
| --- | --- | --- |
| `emilyalsentzer/Bio_ClinicalBERT` | 2,394,513 | 2019년 워크숍 논문 |
| `microsoft/BiomedNLP-BiomedBERT-base-...` | 1,924,950 | *ACM Trans. Comput. Healthc.* (2021) |
| `cambridgeltl/SapBERT-from-PubMedBERT-fulltext` | 1,406,322 | NAACL (2021) |
| `NeuML/pubmedbert-base-embeddings` | 742,483 | **없음** |
| `ncbi/MedCPT-Query-Encoder` | 64,929 | *Bioinformatics* (2023) |
| `michiyasunaga/BioLinkBERT-large` | 18,065 | ACL (2022) |

BLURB 최고 점수 모델이 2019년 워크숍 모델보다 130배 적게 내려받고, 이 계열에서 가장 많이 쓰이는 문장 embedder에는 발표된 논문이 없다. **어느 모델이 좋은가, 어느 모델이 인용 가능한가, 어느 모델이 실제로 쓰이는가는 서로 다른 세 순서**이고, 누가 checkpoint를 추천할 때 그중 무엇을 읽고 있는지 알아 두는 편이 낫다.

## encoder냐 decoder냐

생성 쪽 작업은 decoder LLM으로 갔다. encoder는 죽지 않았고, 이 글이 다루는 일에는 보통 아직 그쪽이 맞다.

- 생의학 NLP 벤치마크 12개에서 파인튜닝이 zero-shot·few-shot LLM을 대부분의 과제에서 이겼고, 비공개 모델은 추론형 질의응답에서만 앞섰다 (*Nat. Commun.* **16**, 3280, 2025).
- 처방 938,150건을 11개 범주로 분류하는 과제에서 파인튜닝한 Bio+Clinical BERT가 F1 0.97–0.98, zero-shot GPT-4가 0.71–0.86이었다 (*Commun. Med.* **5**, 83, 2025).
- 체계적 문헌고찰 선별에서 PubMedBERT와 BioLinkBERT 앙상블이 zero-shot 최신 모델 넷을 이겼고, 그 모델들은 신뢰도 보정이 심하게 어긋나 있었다 (*J. Clin. Epidemiol.* **200**, 112514, 2026).

예외도 실재하고 늘고 있다. 80억 규모 LLM이 생의학 개체명 과제 여럿에서 3억 규모 encoder를 이긴다. 추론 비용이 10배에서 100배다.

**embedding**에 한정하면 아키텍처 논쟁은 해소됐는데, 해소된 방식이 눈여겨볼 만하다. decoder LLM을 강한 텍스트 encoder로 바꾸는 방법은 **causal mask를 제거하는 것**에서 시작한다. decoder를 BERT처럼 양방향으로 만드는 것이다. 그러니 embedding에서 decoder가 encoder를 대체한 게 아니라, 더 큰 양방향 모델이 더 작은 양방향 모델을 대체했다.

## 실제로 쓸 때

측정해서 얻은 실용적 결과 하나가 [HuggingFace 노트](../huggingface-practice-ko/)에 있다.

원본 masked-language checkpoint는 [파인튜닝](../transfer-learning-ko/) 출발점으로는 강하고 유사도 척도로는 나쁘다. PubMedBERT는 같은 약리를 다르게 쓴 두 문장을 코사인 0.988에 놓고, 새에 대한 무관한 문장을 0.957에 놓는다. 공간 전체가 좁은 띠로 눌려 있다. 간격이 쓸 만한 생의학 checkpoint 셋은 전부 쌍으로 추가 학습을 받았다.

구조와 텍스트 두 view를 함께 돌릴 생각이라면, 그게 값어치를 했는지 정하는 질문은 [multimodal](../multimodal-ko/) 쪽 질문이다. 두 view는 어딘가에서 서로 달라야 한다.

## 정리

- 약 설명문은 그 구조와 다른 입력이고, **구조가 말하지 않는 약리**를 담는다
- 무관한 두 골격이 한 질환에 쓰이면 텍스트에서 닮아 보인다. 그게 신호이고, 텍스트 view를 붙이는 이유다
- **함정은 누출이다.** 적응증 텍스트가 치료 분류를 적어 두므로, 결과 필드를 빼고 약 단위로 떼어 두고 텍스트를 ablation해서 확인한다. 그리고 필드를 지워도 정답은 지워지지 않는다. 약 관련 필드를 전부 지운 임상시험 프로토콜도 약물 분류를 45% 내준다
- 이 기작은 **2026년에 타당성 위협으로 이름이 붙었다.** 유전자 요약문과 GO 용어, 임상시험 프로토콜과 약물 분류에서다. 약 설명문 버전의 감사는 아직 비어 있다
- 산문이 주로 쓰이는 곳은 **상호작용과 repurposing**이고, ablation들의 결론이 일치한다. 구조가 없거나 그 약이 처음일 때 값어치를 하고, 분자 feature가 들어오면 이득이 줄어든다
- **텍스트는 물성 예측을 거의 돕지 않고**, 재현되는 이득 하나는 ClinTox에 있는데 그 음성 쪽이 텍스트가 승인되었다고 적어 둔 승인 약이다
- 텍스트는 많이 연구된 약으로 치우치고 **새 화합물에는 없다**. 모델이 필요했던 바로 그 경우다
- PubMedBERT는 도메인 어휘로 처음부터 하는 것이 일반 BERT에서 이어받는 것보다 낫다는 걸, LinkBERT는 인용 링크가 같은 초록을 더 보는 것보다 낫다는 걸 보였다
- **BLURB는 문헌 encoder의 순위이고 임상 encoder를 고르지 못한다.** 그리고 그 자체 숫자가 전문은 도움이 안 된다고 말한다
- 상호작용 밖으로 나가면 기록이 금세 얇아진다. **assay 설명문이 가장 잘 뒷받침되고**, 약물감시 서술은 코딩된 필드에 AUC 0.127 지고, 문헌 기반 타깃 점수는 논문 편수와 0.795로 상관되며, ADMET은 시도한 사람이 없다
- 초록에는 BiomedBERT, 임상 기록에는 BioClinical ModernBERT, 개체 연결에는 SapBERT나 KRISSBERT, 검색에는 MedCPT
- 도메인 embedder가 좋은 범용 모델보다 **더 낫다는 보장은 이제 없다.** 70억 규모에서 도메인 사전학습으로 얻는 것은 적다
- 파인튜닝 분류에서는 비용과 보정 때문에 encoder가 아직 이기고, 그걸 이기는 decoder embedder는 causal mask를 떼어서 그렇게 한다

## 참고

- Windisch et al., [Evidence use and identifier-conditioned prior knowledge in LLM classification of oncology trials](https://doi.org/10.2196/95565), *JMIR AI* **5**, e95565 (2026) — 단계적 근거 제거와 반사실 검정. 약 버전에 필요한 방법이 여기 있다
- Woo et al., [The contribution of the Vaccine Adverse Event Text Mining system to the classification of possible Guillain-Barré syndrome reports](https://doi.org/10.4338/aci-2012-11-ra-0049), *Appl. Clin. Inform.* **4**, 88–99 (2013) — 서술 텍스트가 코딩된 필드에 지는 사례
- Khan et al., [Automating candidate gene prioritization with large language models](https://doi.org/10.1093/bioinformatics/btaf541), *Bioinformatics* **41** (2025) — 논문 편수와의 상관
- Wu et al., [When gene summaries reveal the answers: Gene Ontology circularity in gene embedding benchmarks](https://arxiv.org/abs/2611.11118) (2026) — 유전자에서 기작을 측정한 연구
- Koyun, [Does your trial simulator know what the drug does?](https://arxiv.org/abs/2611.05907) (2026) — 가려 둔 약물 분류를 언어 모델이 45% 맞힌다
- Guo et al., [What can large language models do in chemistry? A comprehensive benchmark on eight tasks](https://arxiv.org/abs/2305.18365) (NeurIPS Datasets and Benchmarks 2023) — 측정된 프롬프트 ablation, HIV F1 0.977에서 0.554로
- Asada et al., [Representing a heterogeneous pharmaceutical knowledge-graph with textual information](https://doi.org/10.3389/frma.2021.670206), *Front. Res. Metr. Anal.* **6** (2021) — DrugBank 설명문에서 ATC로 가는 실제 예시
- Jeon et al., [Predicting drug–side effect relationships from parametric knowledge](https://doi.org/10.2196/67513), *JMIR Med. Inform.* **13**, e67513 (2025) — 통제되지 않은 사례
- Kapoor & Narayanan, [Leakage and the reproducibility crisis in machine-learning-based science](https://doi.org/10.1016/j.patter.2023.100804), *Patterns* **4**, 100804 (2023) — 이것이 속하는 분류 체계
- Yu et al., [LlaSMol: advancing large language models for chemistry with a large-scale, comprehensive, high-quality instruction tuning dataset](https://arxiv.org/abs/2402.09391) (COLM 2024) — 위의 물성 예측 표
- Qian et al., [Can large language models empower molecular property prediction?](https://arxiv.org/abs/2307.07443) (2023) — 표현을 통제한 비교
- Liu et al., [Multi-modal molecule structure–text model for text-based retrieval and editing](https://doi.org/10.1038/s42256-023-00759-6), *Nat. Mach. Intell.* **5**, 1447–1457 (2023) — MoleculeSTM
- Lee et al., [BioBERT: a pre-trained biomedical language representation model for biomedical text mining](https://doi.org/10.1093/bioinformatics/btz682), *Bioinformatics* **36**, 1234–1240 (2020)
- Beltagy et al., [SciBERT: a pretrained language model for scientific text](https://doi.org/10.18653/v1/D19-1371), *EMNLP-IJCNLP* (2019)
- Alsentzer et al., [Publicly available clinical BERT embeddings](https://doi.org/10.18653/v1/W19-1909), *Clinical NLP Workshop* (2019)
- Peng et al., [Transfer learning in biomedical natural language processing](https://doi.org/10.18653/v1/W19-5006), *BioNLP Workshop* (2019) — BlueBERT와 BLUE 벤치마크
- Gu et al., [Domain-specific language model pretraining for biomedical natural language processing](https://doi.org/10.1145/3458754), *ACM Trans. Comput. Healthc.* **3**, 1–23 (2021) — PubMedBERT와 BLURB
- Liu et al., [Self-alignment pretraining for biomedical entity representations](https://doi.org/10.18653/v1/2021.naacl-main.334), *NAACL* (2021) — SapBERT
- Yasunaga et al., [LinkBERT: pretraining language models with document links](https://doi.org/10.18653/v1/2022.acl-long.551), *ACL* (2022)
- Yang et al., [A large language model for electronic health records](https://doi.org/10.1038/s41746-022-00742-2), *npj Digit. Med.* **5**, 194 (2022) — GatorTron
- Zhang et al., [Knowledge-rich self-supervision for biomedical entity linking](https://doi.org/10.18653/v1/2022.findings-emnlp.61), *Findings of EMNLP* (2022) — KRISSBERT
- Jin et al., [MedCPT: contrastive pre-trained transformers with large-scale PubMed search logs](https://doi.org/10.1093/bioinformatics/btad651), *Bioinformatics* **39** (2023)
- Remy et al., [BioLORD-2023: semantic textual representations fusing large language models and clinical knowledge graph insights](https://doi.org/10.1093/jamia/ocae029), *JAMIA* **31**, 1844–1855 (2024)
- Chen et al., [Benchmarking large language models for biomedical natural language processing](https://doi.org/10.1038/s41467-025-56989-2), *Nat. Commun.* **16**, 3280 (2025)
- Yuan et al., [Transformers and large language models are efficient feature extractors for electronic health records](https://doi.org/10.1038/s43856-025-00790-1), *Commun. Med.* **5**, 83 (2025)
- Pitre et al., [A biomedical BERT ensemble (TITAN-SR) outperformed active-learning and large language model chatbots for systematic review title and abstract screening](https://doi.org/10.1016/j.jclinepi.2026.112514), *J. Clin. Epidemiol.* **200**, 112514 (2026)
- BehnamGhader et al., [LLM2Vec: large language models are secretly powerful text encoders](https://arxiv.org/abs/2404.05961) (COLM 2024)
