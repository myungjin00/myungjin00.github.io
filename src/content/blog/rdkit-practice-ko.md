---
title: "RDKit으로 분자 다루기: 표준화, SMARTS, 그리고 함정들"
date: 2026-07-10
description: "조용히 실패하는 파싱 · 순서가 중요한 표준화 · split 전에 끝내야 하는 중복 제거 · 쓸 만한 SMARTS 패턴 · 디스크립터와 지문 대량 계산 · 3D와 병렬화의 비용"
category: tutorial
updated: 2026-08
lang: ko
group: rdkit-practice
topic: Cheminformatics
subtopic: Representation
tags: [RDKit, standardisation, SMARTS, dataset curation]
---

분자 데이터셋은 거의 다 더러운 상태로 온다. 염 (salt)이 붙어 있고, 중복이 있고, 파싱이 안 되는 문자열이 몇 개 섞여 있고, 같은 화합물이 두 가지 표기로 들어 있다. <mark class="blue">최종 점수를 좌우하는 건 모델보다 이 정제 단계인데, 정작 논문 methods에는 한 줄로 끝난다.</mark>

디스크립터와 지문이 *무엇인지*는 [디스크립터와 지문](../descriptors-fingerprints-ko/) 글에 있다.

## 분자 읽기, 그리고 티 나게 실패하기

`Chem.MolFromSmiles`는 — SMILES (simplified molecular-input line-entry system)는 구조를 한 줄 문자열로 적는 표기법이다 — 잘못된 입력에 예외를 던지지 않는다. `None`을 돌려주고, stderr에 불만 한 줄 찍고, 그냥 넘어간다.

```python
from rdkit import Chem, RDLogger

RDLogger.DisableLog("rdApp.*")      # 파서 로그가 시끄럽다. 대신 직접 세는 쪽이 낫다

smiles = ["CC(=O)Oc1ccccc1C(=O)O", "CC(C)Cc1ccc(cc1)C(C)C(=O)O",
          "CN(C)(C)C", "C1CCCCC"]

parsed = [(s, Chem.MolFromSmiles(s)) for s in smiles]
mols   = [(s, m) for s, m in parsed if m is not None]
failed = [s for s, m in parsed if m is None]

print(f"parsed {len(mols)}/{len(parsed)}, dropped {len(failed)}")
print("failed:", failed)
```

```
parsed 2/4, dropped 2
failed: ['CN(C)(C)C', 'C1CCCCC']
```

두 개가 실패한 이유는 다르다. 하나는 전하 없이 단일 결합 네 개를 가진 질소이고, 하나는 닫히지 않은 고리 결합이다. 둘 다 업체에서 받은 파일에 흔한 종류다. 한 줄 필터는 `if m is not None`이고, 다들 빼먹는 건 그 뒤쪽이다. **몇 개를 버렸는지 세고, 그 숫자를 보고해야 한다.** "화합물 3,214개"라고 적은 데이터셋에서 3,180개만 파싱됐다면 그건 다른 데이터셋이다. 게다가 실패가 무작위가 아니라면 — 예를 들어 유기금속만 걸렸다면 — 다루겠다고 말한 화학 공간 자체가 조용히 바뀐 것이다.

`sanitize=False`는 뒤에서 분자를 직접 손볼 생각일 때만 쓴다. sanitize를 건너뛴 Mol은 고리 정보도, 방향족 인식도 없어서 그 상태로 계산한 디스크립터는 근사치가 아니라 그냥 틀린 값이다.

## 표준화, 반드시 이 순서로

`rdkit.Chem.MolStandardize.rdMolStandardize`는 RDKit이 표준화의 기준 라이브러리인 MolVS를 옮겨 온 모듈이고, 호출 네 개로 데이터셋에 필요한 일 대부분이 끝난다.

```python
from rdkit import Chem
from rdkit.Chem.MolStandardize import rdMolStandardize

def standardise(mol):
    mol = rdMolStandardize.Cleanup(mol)              # 1. sanitize, 나이트로/아자이드 표기 정규화, 금속 결합 분리
    mol = rdMolStandardize.FragmentParent(mol)       # 2. 가장 큰 유기 조각만 남김
    mol = rdMolStandardize.Uncharger().uncharge(mol) # 3. 중성화할 수 있는 건 중성으로
    return mol

for s in ["CC(=O)Oc1ccccc1C(=O)[O-].[Na+]",          # 아스피린 나트륨염
          "CN(C)CCCN1c2ccccc2CCc2ccccc21.Cl.Cl",     # 이미프라민 이염산염
          "CC(=O)Nc1ccc(O)cc1.O"]:                   # 아세트아미노펜 수화물
    print(Chem.MolToSmiles(standardise(Chem.MolFromSmiles(s))))
```

```
CC(=O)Oc1ccccc1C(=O)O
CN(C)CCCN1c2ccccc2CCc2ccccc21
CC(=O)Nc1ccc(O)cc1
```

<figure>
<img src="/assets/fig/standardisation-steps.svg" alt="Diclofenac sodium after each of the three standardisation calls, in order" loading="lazy" />
<figcaption><b>염 하나, 호출 셋.</b> 공급처 파일이 흔히 쓰는 방식대로 금속이 공유 결합으로 붙은 다이클로페낙 나트륨염을 넣고, 호출마다의 결과를 차례로 그렸다. 금속을 먼저 떼야 조각을 비교할 수 있고 짝이온이 사라져야 전하를 중성으로 되돌릴 수 있다. 구조도 숫자도 전부 RDKit이 내놓은 그대로다.</figcaption>
</figure>

### 순서가 왜 중요한가

세 단계는 서로 바꿔 쓸 수 없다.

| 단계 | 하는 일 | 왜 이 자리인가 |
| --- | --- | --- |
| `Cleanup` | sanitize, 작용기 표기 정규화, 공유 결합으로 그려진 금속 분리 | 구조를 들여다보는 어떤 작업보다 정규화가 먼저여야 한다. 뒤 단계들이 읽는 결합 차수와 전하를 `Cleanup`이 바꿔 쓸 수 있다 |
| `FragmentParent` | 짝이온·용매·물을 버리고 가장 큰 유기 조각만 남김 | 중성화 **앞**이어야 한다. 염화물 짝이온을 그 자리에서 중성화하면 HCl이 되는데, 이건 정당한 조각이라 parent 자리를 놓고 경쟁하게 된다 |
| `Uncharger` | 짝지어진 전하를 제거하고 중성 형태로 양성자를 붙이거나 뗌 | 조각 선택 **뒤**여야 한다. 어차피 버릴 이온의 양성자화 상태를 정해 봐야 의미가 없다 |

순서를 거꾸로 하면 실패가 조용하게 일어난다. 먼저 중성화하면 양쪽성 이온 (zwitterion)은 `FragmentParent`가 한 분자로 알아보는 데 쓸 전하 분리를 잃는다. `Cleanup`을 건너뛰면 `N(=O)=O`로 그린 나이트로기와 `[N+](=O)[O-]`로 그린 같은 기가 중복 제거 단계까지 서로 다른 구조로 남고, 거기서 매칭이 안 된다.

<mark>`FragmentParent`가 가장 큰 조각을 남기는 건 사실이 아니라 heuristic이다.</mark> 진짜 공결정 (co-crystal)이나 두 성분이 함께 약으로 쓰이는 경우에는 화합물의 절반을 버린다. 표준화 전에 조각 수를 확인하고, 버려지는 쪽이 중원자의 1/3을 넘는 항목은 따로 들여다본다.

### tautomer는 마지막에, 그리고 마지못해

```python
te = rdMolStandardize.TautomerEnumerator()
for s in ["Oc1ccccn1", "O=c1cccc[nH]1", "OC1=CCCCC1"]:
    print(s, "->", Chem.MolToSmiles(te.Canonicalize(Chem.MolFromSmiles(s))))
```

```
Oc1ccccn1 -> O=c1cccc[nH]1
O=c1cccc[nH]1 -> O=c1cccc[nH]1
OC1=CCCCC1 -> O=C1CCCCC1
```

2-하이드록시피리딘 (2-hydroxypyridine)과 2-피리돈 (2-pyridone)이 하나로 합쳐진다. 원하는 결과다. 같은 화합물이고, 이걸 안 하면 데이터셋에서 행이 두 개가 된다.

경고가 두 가지다. **느리다.** enumeration이 조합적으로 늘어나서 엔올화 가능한 자리가 여러 개인 분자는 수백 ms가 걸린다. 큰 라이브러리에서는 이 단계가 정제 시간을 다 잡아먹는다. 그리고 **취향이 들어가 있다.** canonical 형태를 열역학이 아니라 점수 함수가 고르기 때문에, 화학자가 그릴 tautomer와 답이 다른 경우가 있다. 중복 제거 key로 쓸 때는 일관성만 있으면 되니 괜찮다. 하지만 용액에서 어느 형태로 존재한다는 주장으로는 쓸 수 없다. 값싼 단계들이 쉬운 중복을 먼저 걷어낸 다음, 맨 마지막에 돌린다.

## 중복 제거, 제대로

key는 표준화를 마친 분자의 canonical SMILES다. RDKit의 canonical 형태는 같은 버전 안에서는 안정적이고, 데이터셋 내부 key로는 그 정도면 충분하다.

```python
import pandas as pd
from rdkit import Chem

df = pd.DataFrame({
    "smiles": ["CC(=O)Oc1ccccc1C(=O)O", "O=C(O)c1ccccc1OC(C)=O",
               "c1ccccc1O", "C[C@H](N)C(=O)O"],
    "pIC50":  [7.1, 7.5, 5.2, 6.0],
})
df["key"] = [Chem.MolToSmiles(Chem.MolFromSmiles(s)) for s in df.smiles]

dups = df[df.duplicated("key", keep=False)]
spread = dups.groupby("key").pIC50.agg(["count", "min", "max"])
spread["range"] = spread["max"] - spread["min"]
print(spread)
```

```
                       count  min  max  range
key
CC(=O)Oc1ccccc1C(=O)O      2  7.1  7.5    0.4
```

앞의 두 행은 같은 아스피린을 다르게 쓴 것이다. 문자열 그대로 비교하면 둘 다 못 찾는다.

입체화학을 무시하고 맞추고 싶으면 **InChIKey**를 쓴다. InChI (International Chemical Identifier)를 hash한 형태이고, **앞 블록만** 비교해야 한다. 앞 14자가 골격 연결 정보이고, 뒤 블록이 입체화학과 동위원소를 담는다.

```python
from rdkit.Chem.inchi import MolToInchiKey

for s in ["C[C@H](N)C(=O)O", "C[C@@H](N)C(=O)O"]:      # L-알라닌과 D-알라닌
    m = Chem.MolFromSmiles(s)
    print(Chem.MolToSmiles(m), MolToInchiKey(m).split("-")[0])
```

```
C[C@H](N)C(=O)O QNAYBMKLOCPYGJ
C[C@@H](N)C(=O)O QNAYBMKLOCPYGJ
```

canonical SMILES는 다르고 앞 블록은 같다. 어느 쪽을 원하는지는 assay에 달려 있다. 두 거울상 이성질체를 따로 측정했고 값이 다르다면 합치는 순간 실제 signal이 날아간다. 반대로 출처가 라세미체를 하나의 ID로 보고한 거라면 따로 두는 쪽이 없는 signal을 만들어 낸다. 의식적으로 정해야 한다.

### split 전에 중복을 제거한다. 뒤는 안 된다

결과를 조용히 망치는 지점이다. 같은 화합물이 서로 다른 SMILES로 train과 test에 각각 들어가 있으면 test 점수의 일부는 암기 점수다. 그리고 이 효과는 눈에 가장 안 보이는 곳에서 가장 크게 나타난다. 일반화를 보이겠다고 쓰는 엄격한 split이 바로 그런 곳이다. [split 글](../data-splitting-ko/)이 반대쪽에서 같은 말을 한다. 중복 제거에 정확한 SMILES 일치만으로는 부족하고, 먼저 구조를 표준화해야 한다. 순서는 이렇다. 파싱 → 표준화 → 중복 제거 → split → 그 뒤로는 test set을 다시 건드리지 않는다. [모델 평가 글](../evaluation-protocol-ko/)에서 쓴 그대로다.

### 라벨이 어긋나는 중복

같은 구조를 두 번 측정했는데 값이 다르다면, 그건 숨길 버그가 아니라 결정해야 하는 사안이다. 변호할 수 있는 선택이 세 가지다.

| 선택 | 쓸 때 | 비용 |
| --- | --- | --- |
| **평균** | 같은 assay의 반복 측정이고 차이가 작을 때 | 실제로 두 갈래인 쌍을 가린다 |
| **버리기** | 차이가 assay 자체의 오차보다 클 때 | 데이터가 줄고, 쉬운 화합물 쪽으로 치우친다 |
| **더 믿을 만한 쪽만 남기기** | 출처별 품질이 다르거나 한쪽이 정제된 기준 데이터일 때 | 없을 수도 있는 출처 컬럼이 필요하다 |

```python
# 평균을 남기되, 1 log unit 넘게 어긋나는 쌍은 버린다
clean = df.groupby("key", as_index=False).agg(pIC50=("pIC50", "mean"), n=("pIC50", "size"))
bad = spread.index[spread.range > 1.0]
clean = clean[~clean.key.isin(bad)]
```

무엇을 고르든 **규칙과 그 결과 숫자를 methods에 적는다.** "반복 측정은 평균, 1 log unit 넘게 어긋나는 41쌍은 제외" 한 문장이면 데이터셋이 재현 가능해진다.

## SMARTS 부분구조 검색

SMARTS (SMILES arbitrary target specification)는 SMILES에 와일드카드와 논리 연산을 더한 표기법이고, 어떤 패턴이 들어 있는지 묻는 데 쓴다. 패턴은 한 번 컴파일해서 재사용한다. `MolFromSmarts`는 공짜가 아니다.

아래 표를 읽으려면 표기 네 개만 알면 된다. 대괄호 안에서 `X`는 그 원자의 총 결합 수, `H`는 붙어 있는 수소 수다. `;`는 and, `,`는 or이고, `$(...)`는 부분 패턴 하나를 통째로 담는다. 그래서 `!$(NC=O)`는 "카보닐 탄소에 붙은 질소가 아닌"으로 읽는다.

| 패턴 | SMARTS | 메모 |
| --- | --- | --- |
| 카복실산 | `[CX3](=O)[OX2H1]` | 산성 H를 요구하므로 탈양성자화된 형태는 못 잡는다 |
| 1차 아민 | `[NX3;H2;!$(NC=O)]` | 재귀 `!$(...)`가 1차 아마이드를 걸러 내는 부분이다 |
| 방향족 나이트로 | `[$([NX3](=O)=O),$([NX3+](=O)[O-])][c]` | 입력 파일에 두 표기가 다 들어 있어서 둘 다 적는다 |
| 아마이드 결합 | `[NX3][CX3](=[OX1])` | 펩타이드 결합도 같이 잡힌다 |
| 설폰아마이드 | `[SX4](=[OX1])(=[OX1])[NX3]` | |
| 할로젠 | `[F,Cl,Br,I]` | 원자 나열만으로 충분하다. `X` 조건 불필요 |

```python
from rdkit import Chem

PATTERNS = {k: Chem.MolFromSmarts(v) for k, v in {
    "carboxylic acid": "[CX3](=O)[OX2H1]",
    "primary amine":   "[NX3;H2;!$(NC=O)]",
    "aromatic nitro":  "[$([NX3](=O)=O),$([NX3+](=O)[O-])][c]",
    "amide bond":      "[NX3][CX3](=[OX1])",
    "sulfonamide":     "[SX4](=[OX1])(=[OX1])[NX3]",
    "halogen":         "[F,Cl,Br,I]",
}.items()}
assert all(PATTERNS.values())        # MolFromSmarts도 오타가 있으면 None을 돌려준다

for name, smi in [("aspirin",          "CC(=O)Oc1ccccc1C(=O)O"),
                  ("sulfamethoxazole", "Cc1onc(c1)NS(=O)(=O)c1ccc(N)cc1"),
                  ("chloramphenicol",  "OC[C@@H](NC(=O)C(Cl)Cl)[C@@H](O)c1ccc(cc1)[N+](=O)[O-]")]:
    m = Chem.MolFromSmiles(smi)
    print(f"{name:18s}", [k for k, p in PATTERNS.items() if m.HasSubstructMatch(p)])
```

```
aspirin            ['carboxylic acid']
sulfamethoxazole   ['primary amine', 'sulfonamide']
chloramphenicol    ['aromatic nitro', 'amide bond', 'halogen']
```

`HasSubstructMatch`는 있다/없다만 답하고 첫 히트에서 멈춘다. `GetSubstructMatches`는 모든 매칭의 원자 인덱스를 돌려주고, 작용기 개수를 세거나 표시해야 할 때 이걸 쓴다.

```python
m = Chem.MolFromSmiles("Nc1ccc(cc1)S(=O)(=O)Nc1ccccn1")      # 설파피리딘 (sulfapyridine)
print(m.GetSubstructMatches(PATTERNS["sulfonamide"]))        # ((7, 8, 9, 10),)
print(m.GetSubstructMatches(PATTERNS["primary amine"]))      # ((0,),)
```

대칭인 패턴은 작용기 하나에 대해 겹치는 tuple 여러 개를 돌려준다. `uniquify=True`(기본값)를 유지하고, 매칭 수가 아니라 작용기 수를 세려면 tuple을 관심 있는 원자 집합으로 줄여서 센다.

## 방향족성은 속성이 아니라 모델이다

방향족성은 인식 (perception)의 결과이고, 그 규칙은 툴킷마다 다르다. 다른 툴킷의 모델에 맞춰 쓴 SMARTS는 화학적으로 동일한 구조에서도 RDKit에서는 매칭이 안 될 수 있다.

```python
m = Chem.MolFromSmiles("c1ccccc1")
print(m.HasSubstructMatch(Chem.MolFromSmarts("C1=CC=CC=C1")))   # False
print(m.HasSubstructMatch(Chem.MolFromSmarts("c1ccccc1")))      # True
```

같은 벤젠, 벤젠을 가리키는 SMARTS 둘, 답은 각각 반대다. 케쿨레 패턴은 고리를 단일·이중 결합이 번갈아 나오게 적은 것인데, 이중 결합이 번갈아 나오는 지방족 탄소를 요구하는 셈이라 RDKit은 그 원자들을 이미 방향족으로 인식해 둔 상태다. 실제로 모델이 갈리는 건 경계에 있는 고리들이다. 피라논, 일부 5원 헤테로고리, 가교 고리계가 그렇다. 다른 툴킷의 동작에 맞춰야 한다면 `Chem.SetAromaticity(mol, Chem.AromaticityModel.AROMATICITY_SIMPLE)`로 RDKit의 모델을 바꿀 수 있다. 실용적인 규칙은 이렇다. `a`/`A`나 대소문자 원자 기호를 의식적으로 골라 쓰고, 모든 패턴을 맞아야 하는 분자와 맞지 말아야 하는 분자로 둘 다 시험한다.

## 디스크립터와 지문 대량 계산

이것들이 무엇을 나타내는지는 [디스크립터와 지문](../descriptors-fingerprints-ko/) 글에 있다. 호출만 적으면,

```python
import numpy as np
from rdkit import Chem
from rdkit.Chem import Descriptors, rdFingerprintGenerator

mols = [Chem.MolFromSmiles(s) for s in ["CC(=O)Oc1ccccc1C(=O)O", "c1ccccc1O"]]

# 디스크립터 전체를 한 번에 -> dict, 분자 하나당 호출 한 번
d = Descriptors.CalcMolDescriptors(mols[0])
print(len(d), round(d["MolWt"], 2), round(d["TPSA"], 1))     # 217 180.16 63.6

# 지문: generator API, 여러 분자에 재사용
gen = rdFingerprintGenerator.GetMorganGenerator(radius=2, fpSize=2048)
X = np.array(gen.GetFingerprints(mols, numThreads=8), dtype=np.uint8)
print(X.shape, X.sum(axis=1))                                 # (2, 2048) [24 11]
```

실용적인 포인트가 세 가지다. `CalcMolDescriptors`는 RDKit이 아는 디스크립터 전부를 dict로 준다. 200개가 넘는다. 데이터프레임을 만들 때는 이게 맞는 호출이고, 루프 안에서 다섯 개만 필요할 때는 틀린 호출이다. 느린 것도 섞여 있고, 특이한 구조에서는 `NaN`이나 `inf`가 나오는 것도 여러 개 있으니 모델에 넣기 전에 확인해야 한다.

`rdFingerprintGenerator.GetMorganGenerator`가 현재 API (application programming interface)다. `AllChem.GetMorganFingerprintAsBitVect`는 **deprecated**인데 튜토리얼 대부분에 아직 남아 있다. 호출마다 인자를 다시 읽는다는 문제도 있다. generator는 한 번만 만든다. generator의 `GetFingerprints`는 리스트와 `numThreads`를 받는데, 여기서 쓸 수 있는 가장 값싼 병렬화다.

numpy 변환은 `np.array(fps, dtype=np.uint8)`로 bit 벡터 리스트에 바로 되고, 이걸로 충분하다. 분자마다 `DataStructs.ConvertToNumpyArray`를 부르는 것도 같은 일을 한 행씩 하는 것이다. dtype은 `float32`가 아니라 `uint8`로 둔다. 대부분 0인 행렬에서 메모리가 8분의 1이고, scikit-learn은 필요할 때 알아서 캐스팅한다.

## 3D는 정말 필요한 곳에만

성질이 모양에 의존한다면 — conformer에 의존하는 디스크립터, 모양 기반 유사도, 모델에 3D를 넣는 경우 — 좌표가 필요하고, 순서는 수소 추가 → embed → MMFF (Merck molecular force field)로 최적화다.

```python
from rdkit import Chem
from rdkit.Chem import AllChem

m = Chem.AddHs(Chem.MolFromSmiles("CC(=O)Oc1ccccc1C(=O)O"))
assert AllChem.EmbedMolecule(m, randomSeed=0xf00d) == 0       # 0 = 성공, -1 = 실패
AllChem.MMFFOptimizeMolecule(m, maxIters=500)
print(m.GetNumConformers(), "conformer;", m.GetNumAtoms(), "atoms with H")   # 1 conformer; 21 atoms with H
```

`AddHs`는 embed 전에 해야 한다. 뒤에 하면 수소에 좌표가 없다. `randomSeed`는 재현할 생각이 있는 코드에서는 선택 사항이 아니다. 기본값은 비결정적 embedding이다. 그리고 conformer 하나는 보통 부족하다. 회전 가능 결합이 몇 개만 있어도 접근 가능한 모양이 여러 개이고, 하나 뽑은 conformer는 그 집합에서 뽑은 표본 하나일 뿐 꼭 필요한 그 모양은 아니다. 제대로 하려면 `EmbedMultipleConfs(numConfs=…, pruneRmsThresh=…)` 뒤에 `MMFFOptimizeMoleculeConfs(numThreads=…)`를 붙여야 하고, 비용이 터지는 지점이 바로 여기다. 분자당 conformer 수십~수백 개를 각각 최적화하면 1분이면 끝나던 정제가 몇 시간이 된다. 돌리기 전에 이 단계가 정말 필요한지 확인한다.

## 제대로 되는 병렬화

RDKit은 일부 C++ 루틴에서 GIL (global interpreter lock)을 놓고 일부에서는 잡고 있어서, 스레드로 얻는 속도 향상이 고르지 않고 예측도 안 된다. 프로세스는 예측이 된다.

중요한 규칙은 하나다. **프로세스 경계를 넘길 때 Mol 객체가 아니라 SMILES 문자열을 넘긴다.** Mol도 pickle은 되지만 왕복 비용이 이득을 먹을 만큼 크고, 기본 pickle은 모든 걸 담지도 않는다. conformer와 property는 `Chem.SetDefaultPickleProperties`가 필요하다. 문자열을 보내고, worker 안에서 Mol을 다시 만들고, 문자열로 돌려받는다.

```python
from multiprocessing import Pool
from rdkit import Chem, RDLogger
from rdkit.Chem.MolStandardize import rdMolStandardize

def standardise(smi):
    """SMILES로 받아 SMILES로 돌려준다. Mol은 프로세스 경계를 넘지 않는다."""
    RDLogger.DisableLog("rdApp.*")        # worker마다 인터프리터가 새로 뜬다
    m = Chem.MolFromSmiles(smi)
    if m is None:
        return None
    m = rdMolStandardize.FragmentParent(rdMolStandardize.Cleanup(m))
    return Chem.MolToSmiles(rdMolStandardize.Uncharger().uncharge(m))

if __name__ == "__main__":
    smiles = ["CC(=O)Oc1ccccc1C(=O)[O-].[Na+]"] * 1000   # 처리할 목록. 실제로는 파일에서 읽는다
    with Pool(8) as pool:
        out = pool.map(standardise, smiles, chunksize=200)
    print(len(out), "in /", sum(x is not None for x in out), "out")
```

worker 개수보다 `chunksize`가 더 중요하다. 분자 하나당 작업이 ms 단위라서 chunk를 안 나누면 큐 오버헤드가 지배하고, worker 8개가 1개보다 느려지는 일도 생긴다. chunk당 수백 개가 무난한 기본값이다. `if __name__ == "__main__"` 가드는 스타일 문제가 아니라 필수다. 없으면 worker마다 모듈을 다시 import하고 다시 실행한다. 로거를 worker 안에서 끄는 것도 프로세스가 매번 새로 시작하기 때문이다.

worker 수는 물리 코어 수 이하로 둔다. RDKit 호출이 메모리 대역폭에 걸리는 경우가 적지 않아서 과하게 띄우면 오히려 느려진다. 수십만 개 분자를 worker 8개로 표준화하는 건 몇 시간이 아니라 몇 분짜리 작업이다.

## 함정들

- **조용한 `None`.** `MolFromSmiles`는 예외를 던지지 않고 `None`을 돌려주고, 그게 엉뚱한 곳에서 터질 때까지 흘러간다. 걸러 내고, 세고, 그 숫자를 보고한다.
- **짝이온이 붙어 분자량이 부풀어 있다.** 약물은 흔히 염 (salt) 형태로 배포되는데, 붙어 있는 짝이온의 질량이 분자량에 그대로 들어간다. 이미프라민 이염산염 (imipramine dihydrochloride)은 받은 그대로 353.3이고, 염을 떼어 낸 parent는 280.4다. `FragmentParent` 전에 분자량으로 필터를 걸면 짝이온으로 필터를 거는 셈이다.
- **tautomer가 한 화합물을 두 행으로 쪼갠다.** 2-하이드록시피리딘과 2-피리돈은 같은 화합물이고 문자열은 두 개다. 하나는 train에, 하나는 test에 간다.
- **의도 없이 날아간 입체화학.** `MolToSmiles`는 기본적으로 입체 정보를 유지하지만, `isomericSmiles=False`, 직접 부른 `Chem.RemoveStereochemistry`, InChIKey 앞 블록 매칭은 모두 거울상 이성질체를 뭉갠다. assay가 둘을 구분하지 못하면 괜찮고, 구분한다면 파괴적이다.
- **방향족성 모델 차이.** 다른 툴킷이나 논문에서 가져온 SMARTS가 아무것도 매칭하지 않을 수 있다. 모든 패턴을 맞아야 할 분자와 맞지 말아야 할 분자로 시험한다.
- **seed 없는 `random`.** split, conformer embedding, 모든 셔플에 해당한다. `randomSeed` 없는 `EmbedMolecule`은 돌릴 때마다 좌표가 달라지고, seed 없는 split은 결과 전체를 다시 못 만들게 만든다.
- **train과 test에 숨어 있는 중복.** 가장 비싼 함정이다. split 전에 표준화된 구조로 중복을 제거하고, 두 출처를 합쳤다면 출처가 다르니 분자도 다를 거라고 넘기지 말고 겹침을 직접 확인한다.

## 정리

- `MolFromSmiles`는 실패하면 `None`을 돌려준다. 걸러 내고, **세고, 그 숫자를 보고한다**
- 표준화 순서는 `Cleanup` → `FragmentParent` → `Uncharger`, tautomer canonical화는 느리고 취향이 들어가므로 맨 마지막
- `FragmentParent`는 가장 큰 조각을 남긴다. 공결정이나 두 성분 약물에서는 틀린 동작이다
- 중복 제거는 canonical SMILES로 **split 전에.** 입체화학을 무시하려면 InChIKey 앞 블록
- 어긋나는 라벨은 결정 사항이다. 평균, 버리기, 출처 우선 중 하나를 고르고 그 규칙을 methods에 적는다
- SMARTS는 한 번 컴파일하고, 인덱스가 필요하면 `GetSubstructMatches`를 쓰고, 방향족 인식이 툴킷마다 다르므로 패턴을 꼭 시험한다
- deprecated된 `GetMorganFingerprintAsBitVect` 말고 `rdFingerprintGenerator`, 행렬 dtype은 `np.uint8`
- 3D는 `AddHs` → `EmbedMolecule(randomSeed=…)` → `MMFFOptimizeMolecule`이고, conformer 하나로는 보통 부족하다
- 병렬화는 **SMILES 문자열**을 `multiprocessing.Pool`에 chunk로 넘기고, Mol은 worker 안에서 다시 만든다

## 참고

- [RDKit: Getting started in Python](https://www.rdkit.org/docs/GettingStartedInPython.html) · [RDKit cookbook](https://www.rdkit.org/docs/Cookbook.html)
- [RDKit MolStandardize](https://www.rdkit.org/docs/source/rdkit.Chem.MolStandardize.rdMolStandardize.html) · [MolVS 문서](https://molvs.readthedocs.io/) — 표준화 단계와 각 단계가 하는 일
- [Daylight SMARTS theory manual](https://www.daylight.com/dayhtml/doc/theory/theory.smarts.html) — 재귀 SMARTS를 포함한 패턴 언어 전체
- [Landrum, RDKit blog](https://greglandrum.github.io/rdkit-blog/) — tautomer와 fingerprint generator 관련 글이 기본값이 왜 그렇게 정해졌는지를 설명한다
