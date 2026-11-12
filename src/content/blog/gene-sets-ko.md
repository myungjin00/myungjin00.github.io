---
title: "유전자 집합과 enrichment 분석: GO, KEGG, Reactome, Hallmark"
date: 2026-05-15
description: "유전자 800개 목록은 유전자 집합으로 묶기 전까지 아무 뜻이 없다 · 유전자 집합이 어디서 오고 서로 어떻게 다른가 · ORA와 GSEA, 그리고 임계값이 버리는 것 · AUCell·GSVA로 세포마다 점수 매기기 · 그리고 '면역 반응'이 끊임없이 올라오는 이유"
category: concept
updated: 2026-06
lang: ko
group: gene-sets
topic: Bioinformatics
subtopic: Gene sets
tags: [GSEA, GO, KEGG, Reactome, AUCell]
---

차등 발현을 돌리면 유의한 유전자 800개가 나온다. 그 800개를 그대로 읽어서는 아무 이야기도 나오지 않는다. **enrichment 분석은 그 목록을 사람이 쓸 수 있는 것으로 바꾸는 단계**다. 동시에 결론이 데이터보다 멀리 나가기 쉬운 단계이기도 하다.

## 유전자 집합은 어디서 오나

네 데이터베이스는 서로 바꿔 쓸 수 있는 게 아니고, *각각이 무엇인지* 알면 결과 차이의 대부분이 설명된다.

| 데이터베이스 | 무엇인가 | 단점 |
| --- | --- | --- |
| **GO** (Gene Ontology) | 세 갈래 (생물학적 과정·분자 기능·세포 구성요소)의 용어 계층 | 용어가 중첩돼서, 자식 용어에 annotation된 유전자는 모든 부모에도 들어간다 — 중복이 심하다 |
| **KEGG** (Kyoto Encyclopedia of Genes and Genomes) | 사람이 그린 pathway 지도. 대사는 화합물이 효소를 거쳐 바뀌는 사슬, 신호전달은 단백질 사이의 활성화·억제 | pathway 수가 적고 거칠다. 그리고 상업적 사용에 라이선스 제약이 있다 |
| **Reactome** | 사람이 큐레이션한 반응을 계층으로. 무료 | 계층이 깊은 게 양날이다. 하나의 발견이 중첩된 pathway 여러 개로 올라오고, 사람 유전자 커버리지는 GO보다 좁다 |
| **MSigDB** (Molecular Signatures Database) | 모음의 모음. H (hallmark), C2 (큐레이션, KEGG·Reactome 포함), C5 (GO), C7 (면역) | 모음끼리 겹친다 — C2에 이미 KEGG·Reactome이 들어 있다 — 그리고 사람 유전자 기호 기준이라 다른 종에서는 ortholog 매핑이 필요하다 |

<mark>시작할 곳을 하나만 고르라면 **hallmark 50개**다.</mark> GO의 중복 문제를 고치려고 만든 것이라 일관되고, 서로 겹치지 않으며, 유의한 결과가 나와도 읽을 수 있을 만큼 작다.

사람들이 걸려 넘어지는 건 GO의 계층이다. 어떤 유전자에 "T세포 활성화" annotation을 달면 "림프구 활성화", "면역 반응", "자극에 대한 반응"에도 자동으로 달린다. 그래서 **유의한 GO 용어 마흔 개가 하나의 발견을 마흔 번 보고한 것**인 경우가 흔하다.

## 검정하는 두 방식: ORA와 GSEA

**ORA (over-representation analysis).** 유의한 유전자를 가져와, 그중 몇 개가 집합에 들어 있는지 세고, 그게 우연보다 많은지 초기하 검정이나 Fisher 정확검정으로 묻는다.

**GSEA (gene set enrichment analysis).** 임계값을 아예 쓰지 않는다. 모든 유전자를 통계량으로 순위 매기고, 그 순위를 따라 내려가며 집합 구성원이 위쪽이나 아래쪽에 몰려 있는지 묻는다.

<figure>
<img src="/assets/fig/gsea-running.svg" alt="The GSEA running enrichment score walking down a ranked gene list" loading="lazy" />
<figcaption><b>누적 점수.</b> 순위 목록을 따라 내려가며 집합 구성원을 만나면 가중치만큼 올라가고 아니면 일정량 내려간다. 집합이 흩어져 있으면 무작위 걸음이 되어 0 근처에서 끝나고, 위쪽에 몰려 있으면 먼저 올라간다. <b>enrichment score (ES)</b>는 0에서 가장 멀어진 지점이다. 이 글을 쓰면서 계산했다.</figcaption>
</figure>

실질적 차이는 임계값이 치르는 비용이다.

<figure>
<img src="/assets/fig/ora-vs-gsea.svg" alt="The cut that ORA applies, and how few set members survive it" loading="lazy" />
<figcaption><b>ORA가 버리는 것.</b> 같은 모사 데이터. <b>(A)</b> 임계값이 3,000개 중 205개만 남기고, 점선 사이의 모든 것이 버려진다. <b>(B)</b> 집합에 든 60개 중 <b>세 개</b>만 살아남는다. 이 데이터에서 ORA는 아무것도 찾지 못하고, 같은 순위에 GSEA를 돌리면 ES = 0.45가 나온다.</figcaption>
</figure>

<mark class="blue">기억할 경우가 이것이다. 구성원 전부가 조금씩 같은 방향으로 움직인 집합은 ORA에게 보이지 않고 GSEA에게는 명백하다.</mark> 그리고 조금씩 함께 움직이는 것이야말로 pathway가 하는 일이다.

| | ORA | GSEA |
| --- | --- | --- |
| 입력 | 유전자 목록 | 순위 매긴 전체 목록 |
| 임계값 필요 | 필요 | 불필요 |
| 방향 | 잃는다 | 유지한다 (ES의 부호) |
| 배경 (background) | 직접 골라야 한다 | 해당 없음 |
| 좋은 경우 | 남에게 받은 목록 | 직접 돌린 차등 발현 결과 |

**ORA가 가장 자주 틀리는 곳이 배경이다.** 전체 집합은 검출될 수 있었던 유전자 — 그 조직에서 발현되는 유전자 — 여야지 유전체의 모든 유전자가 아니다. 유전체를 배경으로 쓰면 조직 특이적 집합이 그 조직에서 발현됐다는 이유만으로 유의하게 나온다.

## 샘플마다, 또는 세포마다 점수 매기기

앞의 둘과 자주 혼동되는 세 번째가 있다. 집합을 검정하는 게 아니라 **샘플 하나하나 또는 세포 하나하나에 그 집합의 점수**를 주는 것. 묻는 질문이 달라진다. 두 집단 사이에서 이 pathway가 다른가가 아니라, 이 세포 유형에서 이 pathway가 켜져 있는가다.

| 방법 | 어떻게 점수 매기나 | 메모 |
| --- | --- | --- |
| **AUCell** | 세포 안에서 유전자 순위를 매기고, 집합의 회복 곡선 아래 면적 (AUC)을 쓴다 | 순위 기반이라 dropout과 정규화에 강하다 — single-cell 기본값 |
| **GSVA** (gene set variation analysis) | 발현 분포에 kernel density를 얹고 Kolmogorov–Smirnov 비슷한 통계량 | 샘플 수준. bulk용 |
| **ssGSEA** (single-sample GSEA) | 샘플마다 GSEA를 돌린다 | 샘플 수준. 스케일에 민감 |
| **AddModuleScore** (Seurat) | 집합 평균에서 짝지은 대조군 집합의 평균을 뺀다 | 빠르다. 대조군 매칭 덕분에 쓸 만해진다 |

single-cell에서는 AUCell을 쓰고, 이유는 [dropout](../bulk-vs-sc-ko/)이다. 세포 안에서 유전자의 **순위만** 쓰기 때문에, 포획되지 않은 유전자가 평균을 쓸 때만큼 점수를 끌어내리지는 않는다.

single-cell 데이터에서 [SenMayo·SHGS](../sasp-ko/) 같은 세포노화 집합에 점수를 낼 때 이 방식을 쓰는 이유가 이것이다. SHGS 논문 자체는 bulk를 다루고, 거기서는 GSVA를 쓴다.

## enrichment 분석이 틀어지는 지점

- **중복.** 한 가지를 설명하는 GO 용어 마흔 개. hallmark를 쓰거나, 유의한 용어들을 유전자 겹침으로 군집화한 뒤 읽어서 해결한다.
- **집합 크기 편향.** 아주 작은 집합은 불안정하고 아주 큰 집합은 모호하다. 대부분의 도구가 15~500개 정도로 거를 수 있게 해 두었고, 걸러야 한다.
- **수천 개 집합에 대한 다중 검정.** 보정 p값을 반드시 보고하고, 집합들이 독립이 아니라는 점을 기억한다. 집합이 바깥 유전자들보다 더 변했는지를 묻는 경쟁적 (competitive) 검정에서는, 유전자끼리 상관이 있으면 통계량이 부풀려져 표준 FDR (false discovery rate) 보정으로도 위양성이 남는다.
- **문헌 편향.** 많이 연구된 유전자가 더 많은 집합에 들어 있어서 "면역 반응"과 "세포주기"가 끊임없이 올라온다. 일부는 진짜고 일부는 annotation이 많아서다. 유명한 pathway가 걸리면 의심을 더 해야지 덜 해서는 안 된다.
- **annotation 변동.** GO는 계속 갱신된다. 같은 분석을 1년 뒤에 돌리면 결과가 달라지므로 버전을 기록한다.
- **임의의 절단에 건 ORA.** 유의성 임계값을 바꾸면 enrichment 결과가 바뀐다. 분석이 허약하다는 신호다. GSEA는 이 문제를 아예 피한다.

검정 전에 더 싼 확인이 있다. 집합을 volcano에 칠해 어디 있는지 보는 것이다. [차등 발현 결과를 그림으로 읽기](../reading-de-ko/)가 그 이야기이고, 그 그림이 곧 enrichment 방법이 필요한 이유다.

> enrichment 분석은 **가설 생성**이다. 어떤 이야기가 내 데이터와 모순되지 않는지를 알려 줄 뿐, 어느 것이 참인지는 알려 주지 않는다. pathway 하나가 걸린 것은 실험의 시작이지 분석의 끝이 아니다.

## 정리

- 유전자 800개는 읽을 수 없다. enrichment 분석이 그걸 유전자 집합으로 묶고, 묶는 지점에서 결론이 과하게 나간다
- GO는 계층이라 구성상 중복되고, KEGG는 거칠고 라이선스 제약이 있고, Reactome은 무료이고 상세하며, MSigDB hallmark 50개가 시작할 곳이다
- ORA는 임계값이 필요하고 방향을 잃고, GSEA는 전체 순위를 쓰며 방향을 유지한다
- 구성원이 다 조금씩 움직인 집합은 ORA에게 보이지 않고 GSEA에게 명백하다. pathway는 원래 그렇게 움직인다
- ORA의 배경은 유전체가 아니라 발현된 유전자여야 한다
- 세포마다 점수를 매기려면 AUCell. 순위 기반이라 dropout을 견딘다. bulk에서는 GSVA·ssGSEA
- 중복·집합 크기 편향·유명 pathway 쏠림·annotation 버전 변동을 경계한다

## 참고

- Subramanian et al., [Gene set enrichment analysis](https://doi.org/10.1073/pnas.0506580102), *PNAS* (2005)
- Liberzon et al., [The Molecular Signatures Database hallmark gene set collection](https://doi.org/10.1016/j.cels.2015.12.004), *Cell Systems* (2015)
- Aibar et al., [SCENIC: single-cell regulatory network inference and clustering](https://doi.org/10.1038/nmeth.4463), *Nat. Methods* (2017) — AUCell
- Wu & Smyth, [Camera: a competitive gene set test accounting for inter-gene correlation](https://doi.org/10.1093/nar/gks461), *Nucleic Acids Res.* (2012) — 유전자 간 상관이 왜 문제인가
