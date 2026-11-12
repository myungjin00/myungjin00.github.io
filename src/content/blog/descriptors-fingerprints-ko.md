---
title: "분자 디스크립터와 지문"
date: 2025-05-16
description: "연속인 디스크립터와 이산인 지문 · ECFP와 해시 충돌 · 타니모토 0.85의 근거와 한계 · activity cliff에서 무너지는 지점"
category: concept
updated: 2025-06
lang: ko
group: descriptors
topic: Cheminformatics
subtopic: Representation
tags: [cheminformatics, molecular representation]
---

머신러닝은 숫자를 먹는다. 분자는 숫자가 아니다. 그 사이를 메우는 방법이 디스크립터 (descriptor)와 지문 (fingerprint)이고, 둘은 성격이 다르다.

<figure>
<svg viewBox="0 0 540 206" role="img" aria-label="A molecule turned into a continuous descriptor vector, a discrete fingerprint bit vector, and a learned embedding.">
  <g font-family="IBM Plex Mono, monospace" font-size="11" fill="#1E4A39">
    <text x="16" y="20">descriptor</text><text x="16" y="88">fingerprint</text><text x="16" y="156">learned embedding</text>
  </g>
  <g font-family="IBM Plex Mono, monospace" font-size="9.5" fill="#6E7873">
    <text x="16" y="36">continuous · named</text><text x="16" y="104">discrete · present or not</text><text x="16" y="172">continuous · unnamed</text>
  </g>
  <g font-family="IBM Plex Mono, monospace" font-size="10" fill="#46524D">
    <text x="166" y="26">MW</text><text x="226" y="26">logP</text><text x="294" y="26">TPSA</text><text x="360" y="26">HBD</text><text x="414" y="26">rings</text>
    <text x="166" y="54">180.2</text><text x="226" y="54">1.31</text><text x="294" y="54">63.6</text><text x="360" y="54">1</text><text x="414" y="54">1</text>
  </g>
  <g fill="none" stroke="#C2703C" stroke-width="1.2"><rect x="158" y="36" width="56" height="24" rx="3"/><rect x="220" y="36" width="56" height="24" rx="3"/><rect x="286" y="36" width="56" height="24" rx="3"/><rect x="352" y="36" width="46" height="24" rx="3"/><rect x="406" y="36" width="46" height="24" rx="3"/></g>
  <g font-family="IBM Plex Mono, monospace" font-size="10" fill="#46524D"><text x="166" y="94">0 1 0 0 1 1 0 0 1 0 0 1 0 0 0 1 …</text></g>
  <g stroke="#2E5878" stroke-width="1.2">
    <rect x="158" y="102" width="18" height="18" rx="2" fill="none"/><rect x="180" y="102" width="18" height="18" rx="2" fill="rgba(46,88,120,.75)"/>
    <rect x="202" y="102" width="18" height="18" rx="2" fill="none"/><rect x="224" y="102" width="18" height="18" rx="2" fill="none"/>
    <rect x="246" y="102" width="18" height="18" rx="2" fill="rgba(46,88,120,.75)"/><rect x="268" y="102" width="18" height="18" rx="2" fill="rgba(46,88,120,.75)"/>
    <rect x="290" y="102" width="18" height="18" rx="2" fill="none"/><rect x="312" y="102" width="18" height="18" rx="2" fill="none"/>
    <rect x="334" y="102" width="18" height="18" rx="2" fill="rgba(46,88,120,.75)"/><rect x="356" y="102" width="18" height="18" rx="2" fill="none"/>
    <rect x="378" y="102" width="18" height="18" rx="2" fill="none"/><rect x="400" y="102" width="18" height="18" rx="2" fill="rgba(46,88,120,.75)"/>
  </g>
  <text x="426" y="116" font-family="IBM Plex Mono, monospace" font-size="10" fill="#6E7873">… 2048 bits</text>
  <g fill="rgba(30,74,57,.14)" stroke="#1E4A39" stroke-width="1.1">
    <rect x="158" y="166" width="22" height="22" rx="3"/><rect x="184" y="166" width="22" height="22" rx="3" fill="rgba(30,74,57,.5)"/>
    <rect x="210" y="166" width="22" height="22" rx="3" fill="rgba(30,74,57,.28)"/><rect x="236" y="166" width="22" height="22" rx="3" fill="rgba(30,74,57,.62)"/>
    <rect x="262" y="166" width="22" height="22" rx="3" fill="rgba(30,74,57,.1)"/><rect x="288" y="166" width="22" height="22" rx="3" fill="rgba(30,74,57,.4)"/>
    <rect x="314" y="166" width="22" height="22" rx="3" fill="rgba(30,74,57,.2)"/><rect x="340" y="166" width="22" height="22" rx="3" fill="rgba(30,74,57,.55)"/>
  </g>
  <text x="372" y="181" font-family="IBM Plex Mono, monospace" font-size="10" fill="#6E7873">… 300 dims</text>
</svg>
<figcaption><b>같은 분자, 세 가지 벡터.</b> 디스크립터는 각 칸에 이름과 단위가 있고, 지문은 각 칸이 "이 조각이 있는가"이며, 학습된 embedding은 각 칸이 무엇을 뜻하는지 아무도 모른다. 값은 아스피린 기준이다.</figcaption>
</figure>

## 디스크립터 (descriptor)

분자에서 **계산해 얻는 수**다. 각 값에 이름과 뜻이 있다.

| 종류 | 예 |
| --- | --- |
| 구성 | 분자량, 중원자 수, 고리 개수 |
| 물리화학 | logP, TPSA (topological polar surface area), 굴절률 |
| 위상 | Balaban J, Wiener 지수, 차수 기반 지수 |
| 약물 유사성 (drug-likeness) | 수소결합 공여체/수용체 수, 회전 가능 결합 수 |

RDKit 하나로 200개 넘게 바로 나온다.

```python
from rdkit import Chem
from rdkit.Chem import Descriptors
m = Chem.MolFromSmiles("CC(=O)Oc1ccccc1C(=O)O")   # 아스피린
round(Descriptors.MolWt(m), 2), round(Descriptors.MolLogP(m), 2), round(Descriptors.TPSA(m), 2)
# (180.16, 1.31, 63.6)
```

**리핀스키의 5원칙 (rule of five)** 이 디스크립터를 쓰는 전형적인 예다. 분자량 ≤ 500, logP ≤ 5, 수소결합 공여체 ≤ 5, 수용체 ≤ 10. 네 개의 디스크립터에 임계값을 걸어 경구 흡수 가능성을 가늠한다.

장점은 해석 (interpretability)이다. 모델이 logP를 중요하게 봤다면 그 말이 무슨 뜻인지 바로 안다.

한계는 세부가 사라진다는 점이다. 분자량 180에 logP 1.3인 분자는 수없이 많고, 그중 어느 것이 활성인지 디스크립터만으로는 구분되지 않는다.

## 지문 (fingerprint)

**있고 없음을 bit로 적은 벡터**이다. 각 bit가 "이 부분 구조가 분자에 있는가"에 대응한다. 이것이 <u>이산 (discrete)</u> 표현이다. 디스크립터가 연속 (continuous)인 것과 대비된다.

세 가지 계열이 있다.

| 계열 | bit가 뜻하는 것 |
| --- | --- |
| 구조 키 (MACCS) | 미리 정해둔 166개 질문. "황이 있는가", "방향족 고리가 둘 이상인가" |
| 경로 기반 (RDKit FP, Daylight) | 분자 안의 모든 짧은 경로를 hash해서 bit로 |
| 원형 (Morgan / ECFP) | 각 원자 주변 반지름 $r$ 안의 환경을 hash해서 bit로 |

ECFP (extended-connectivity fingerprint)가 사실상의 표준이다.

```python
from rdkit.Chem import rdFingerprintGenerator
gen = rdFingerprintGenerator.GetMorganGenerator(radius=2, fpSize=2048)
fp = gen.GetFingerprint(m)        # 2048bit 중 아스피린은 24개만 1
```

`radius=2`를 흔히 **ECFP4**라고 부른다. 4는 지름이라는 뜻이다.

### hash 충돌 (hash collision)

원형 지문의 가능한 원자 환경은 사실상 무한한데, 그것을 2048칸에 욱여넣는다. 그래서 <mark>서로 다른 두 조각이 같은 bit에 떨어질 수 있다.</mark> 이것을 bit 충돌이라고 하고, 지문이 조금씩 거짓말을 하는 지점이다. 길이를 4096으로 늘리면 줄지만 사라지지는 않는다.

### 유사도 (similarity)

지문의 가장 큰 용도는 **분자끼리 얼마나 닮았는지** 재는 것이다. 표준은 타니모토 계수 (Tanimoto coefficient)이다.

$$
T(A, B) = \frac{|A \cap B|}{|A \cup B|}
$$

둘 다 1인 bit 수를, 적어도 하나가 1인 bit 수로 나눈다. 0과 1 사이이고, 보통 **0.85 이상이면 비슷하다**고 본다. 다만 이 임계값은 관례일 뿐 물리 법칙이 아니다.

> **유사성 원리 (similarity principle)와 그 반례.** "구조가 비슷하면 활성도 비슷하다"는 가정이 약물 설계의 바탕이다. 그런데 원자 하나 차이로 활성이 100배 바뀌는 쌍이 실제로 존재하고, 이를 **activity cliff**라고 한다. 지문 유사도가 0.9인데 활성이 전혀 다른 경우다. [MoleculeACE](https://github.com/molML/MoleculeACE) 벤치마크가 이 상황만 모아둔 것이다. 여기서 무너지는 건 *유사도 척도*지 표현 자체가 아니다. 지문에 고전적인 회귀기를 붙이면 그 쌍들에서 [message passing 모델과 대등하거나 더 낫다](../activity-cliff-ko/).

## 디스크립터·지문·embedding 비교

| | 디스크립터 | 지문 | 학습된 embedding |
| --- | --- | --- | --- |
| 값 | 연속 | 이산 (0/1) | 연속 |
| 각 칸의 뜻 | 명확 | 부분 구조 (충돌 가능) | 알 수 없음 |
| 누가 정했나 | 사람 | 사람 (규칙) | 데이터 |
| 길이 | ~200 | 1024~4096 | 보통 128~512 |
| 과제 적응 | 안 됨 | 안 됨 | 됨 |
| 데이터 요구 | 적음 | 적음 | 많음 |

<mark class="blue">앞 둘은 **고정**이다. 과제가 바뀌어도 벡터는 그대로다.</mark> [딥러닝이 바꾼 것](../ml-and-dl-ko/)이 바로 이 지점으로, 표현 자체를 과제에 맞게 학습한다.

## 지금도 쓰는 자리

학습된 표현이 나온 뒤에도 아래 네 자리에서는 디스크립터와 지문을 그대로 쓴다.

- **데이터가 적을 때.** 분자 수백 개짜리 과제에서는 ECFP + 랜덤 포레스트가 그래프 신경망을 이기는 일이 흔하다.
- **베이스라인으로.** 새 모델이 ECFP + 랜덤 포레스트를 못 이기면 아직 쓸 만하지 않다는 뜻이다.
- **검색과 군집화.** 수억 개 라이브러리에서 비슷한 분자를 찾는 일은 지문이 압도적으로 빠르다.
- **pretext task로.** 모델에게 디스크립터를 맞히게 하면 그 과정에서 유용한 표현이 생긴다. [MAGNET](../../projects/magnet/)이 쓰는 방식 중 하나다.

## 정리

- 디스크립터는 **연속**이고 뜻이 있다 — 해석은 쉽지만 세부가 날아간다
- 지문은 **이산**이고 부분 구조의 유무를 적는다 — hash 충돌이 있다
- 타니모토 0.85가 관례적 기준이지만 activity cliff에서 무너진다
- 둘 다 고정된 표현이고, 학습된 embedding은 과제에 맞춰 바뀐다
- 데이터가 적으면 여전히 지문이 이긴다 — 베이스라인으로 반드시 넣을 것

## 참고

- [RDKit: 디스크립터 목록](https://www.rdkit.org/docs/GettingStartedInPython.html#list-of-available-descriptors)
- [RDKit: 지문 생성](https://www.rdkit.org/docs/GettingStartedInPython.html#fingerprinting-and-molecular-similarity)
- Rogers & Hahn, [Extended-Connectivity Fingerprints](https://doi.org/10.1021/ci100050t), *J. Chem. Inf. Model.* (2010) — ECFP 원 논문
