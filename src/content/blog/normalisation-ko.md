---
title: "세기와 정규화: raw count를 그대로 비교할 수 없는 이유"
date: 2026-11-13
description: "생물학과 무관하게 count를 키우는 두 가지 · CPM, FPKM, TPM 중 샘플 사이를 건너갈 수 있는 것 · 소수의 유전자가 라이브러리를 지배하면 library size 보정이 망가지는 이유 · DESeq2의 size factor가 대신 하는 일 · 그리고 DE 도구가 raw count를 원하는 이유"
category: concept
updated: 2026-11
lang: ko
group: normalisation
topic: Bioinformatics
subtopic: Transcriptomics
tags: [normalisation, TPM, CPM, size factors, DESeq2]
---

count matrix는 아직 비교할 수 있는 상태가 아니다. 그 안의 두 숫자가 다른 이유는 생물학이 달라서일 수도 있고, 생물학과 아무 상관 없는 두 가지 때문일 수도 있다. 이 글은 [count를 얻는 과정](../reference-and-files-ko/)과 [그걸 검정하는 도구들](../de-tools-ko/) 사이에 있다.

## 방해 요인 (nuisance) 둘

| 방해 요인 | 왜 count를 부풀리는가 |
| --- | --- |
| **Library size (라이브러리 크기)** | 두 배 깊게 시퀀싱한 샘플은 모든 것에서 대략 두 배의 count를 얻는다 |
| **Gene length (유전자 길이)** | 긴 전사체 (transcript)는 더 많은 조각으로 쪼개지므로, 같은 양이어도 더 많은 read를 모은다 |

어느 쪽을 제거해야 하는지는 **무엇을 비교하느냐**에 달렸다.

- **샘플 사이에서 같은 유전자** — library size만 문제다. 유전자 길이는 양쪽이 같으니 상쇄된다.
- **한 샘플 안에서 다른 유전자끼리** — 길이가 문제다. 무시하면 긴 유전자가 많이 발현된 것처럼 보인다.

대부분의 차등 발현 (differential expression) 분석은 첫 번째 경우다. 기억해둘 만하다 — **다들 습관적으로 하는 길이 보정이 대개 불필요하다**는 뜻이니까.

## CPM, FPKM, TPM

만나게 되는 세 이름:

- **CPM** (counts per million) — library size로 나눈다. 깊이 (depth)만 보정한다.
- **RPKM**, 그리고 paired-end용인 **FPKM** — library size로 나눈 다음, 유전자 길이 (kb)로 나눈다. 둘 다 보정한다.
- **TPM** (transcripts per million) — 유전자 길이로 *먼저* 나누고, 그다음 길이 보정된 값들의 총합으로 나눈다.

TPM과 FPKM은 같은 두 보정을 쓰고, **백만당 (per-million) 단계에서 무엇으로 나누느냐**가 다르다. FPKM은 총 read 수로, TPM은 길이 보정된 값들의 총합으로 나눈다. TPM은 정규화를 마지막에 하기 때문에 **한 샘플 안의 TPM 총합이 정확히 100만**이 된다. FPKM은 어떤 고정된 값으로도 합쳐지지 않는다. 그래서 TPM은 샘플 사이에서 비교 가능하고 FPKM은 그러지 못한다. 샘플이 둘 이상 들어가는 작업에서 TPM을 쓰는 이유다 — 다만 합이 100만으로 고정된다는 것 자체가 다음 절에서 깨지는 바로 그 가정이다. TPM은 깊이와 길이를 보정하지, 조성 (composition)은 보정하지 않는다.

"이 유전자가 저 유전자보다 많다"고 말하고 싶을 때, 또는 상대적 양 (relative abundance)을 기대하는 방법에 숫자를 넘길 때 TPM을 쓴다. **셋 중 어느 것도 차등 발현 검정의 입력으로 쓰지 않는다.**

## library size로 나누는 것만으로는 부족한 이유

총 count로 나누는 것은 **총합이 깊이의 공정한 척도**라고 가정한다. 소수의 유전자가 라이브러리의 대부분을 차지하면 그 가정이 깨진다.

<figure>
<img src="/assets/fig/composition-effect.svg" alt="각 유전자가 라이브러리에서 차지하는 몫을 막대로 그린 두 샘플. 두 번째에서는 유전자 하나가 30%를 차지하고 나머지 막대가 모두 낮아져 있다" loading="lazy" />
<figcaption><b>총합으로 나누기가 실패하는 이유.</b> 변한 건 유전자 하나뿐이다. 몫의 합이 1이어야 하므로 나머지 유전자의 몫은 전부 떨어지고, 총 count로 나누는 방법은 그것들을 감소했다고 보고한다. size factor가 존재하는 이유가 이 인공물이다. 이 글을 위해 그렸다.</figcaption>
</figure>

똑같이 시퀀싱한 두 샘플을 생각해보자. 두 번째 샘플에서 유전자 하나가 엄청나게 유도돼 read의 30%를 가져갔다. 이제 다른 모든 유전자는 총합에서 차지하는 몫이 작아졌으므로, 총합으로 나누면 **다른 모든 유전자가 낮아 보인다.** 오로지 한 유전자의 성공이 만들어낸 인공물 (artefact)이다. 이런 조성 (composition)은 전부 같은 문제를 일으킨다 — 지배적인 유전자 하나, rRNA나 globin mRNA 오염, 한쪽 샘플에만 있는 고발현 세포 유형.

이건 이론적인 문제가 아니라 실제로 자주 일어나는 문제이고, DE 도구들이 라이브러리 총합만으로 스케일링하지 않는 이유다.

## size factor가 대신 하는 일

DESeq2의 **median of ratios** (비율의 중앙값)는 다른 길로 간다. 대략:

1. 유전자마다 샘플 전체에 걸친 기준값을 구한다 (기하평균).
2. 샘플마다, 각 유전자의 count를 그 기준값으로 나눈 비율을 구한다.
3. 그 비율들의 **중앙값** (median)을 취한다. 그게 그 샘플의 size factor다.

**중앙값이 핵심이다.** 실제로 변하고 있는 유전자들은 비율 분포의 꼬리에 있다. 중앙값은 그것들을 무시하고 가운데를 읽는데, 거기에는 변하지 않는 대다수 유전자가 있다. 그래서 size factor가 가장 시끄러운 유전자가 아니라 시퀀싱 깊이를 반영하게 된다. edgeR의 TMM은 극단을 잘라내고 가중평균을 취하는 방식으로 같은 일을 한다.

둘 다 하나의 가정 위에 서 있다. **대부분의 유전자는 차등 발현하지 않는다.** 그게 거짓일 때 — 전역적 이동 (global shift), 전사를 광범위하게 억제하는 약물 — 이 방법들은 과소보정하고, 정직한 답은 spike-in 대조군이다.

## 도구가 raw count를 원하는 이유

DESeq2에 TPM matrix를 넘기고 싶어진다. 하지 마라. 이 도구들은 **count를 모델링**하고, count에는 비율이 버린 정보가 들어 있다 — **몇 개의 read에 근거한 숫자인가.**

count가 10인 유전자와 10,000인 유전자가 같은 값으로 정규화될 수 있지만, 한쪽은 훨씬 잘 측정된 것이다. DESeq2가 적합시키는 음이항 (negative binomial) 모델은 그 원래 크기를 써서 유전자의 변동성 (variability)을 추정하고, **그 분산 추정이 유의성을 결정한다.** 정규화된 값을 넣으면 확신 있는 측정과 잡음 섞인 측정을 구별할 방법이 없어진다.

그러니 도구에는 **raw count**를 주고 size factor는 알아서 계산하게 둔다. TPM은 보여주기용이다 — 그림, 유전자끼리의 비교, 양을 요구하는 방법의 입력. 그 외에는 아니다.

## 요약

- 생물학과 무관하게 count를 부풀리는 두 가지: **library size**와 **유전자 길이**
- 샘플 사이에서 같은 유전자를 비교할 때는 깊이 보정만 필요하다. 길이는 상쇄된다
- **CPM**은 깊이를, **RPKM/FPKM**과 **TPM**은 둘 다 보정하며 백만당 단계에서 무엇으로 나누느냐가 다르다 — TPM은 합이 100만이 되고 FPKM은 아니라서, 샘플 사이에서 비교 가능한 건 TPM이다. 둘 다 조성은 보정하지 않는다
- 소수의 유전자가 라이브러리를 지배하면 총 count로 나누기가 실패하고, 나머지 전부가 낮아 보인다
- **size factor** (DESeq2 median of ratios, edgeR TMM)는 *중앙값*을 써서 시끄러운 유전자가 척도를 정하지 못하게 한다
- 대부분의 유전자가 변하지 않는다고 가정하므로, 그게 거짓이면 spike-in을 쓴다
- DE 도구에는 **raw count**를 준다. 그 크기가 분산 모델에 필요하다. TPM은 보여주기용이다

## 참고문헌

- Love et al., [Moderated estimation of fold change and dispersion for RNA-seq data with DESeq2](https://doi.org/10.1186/s13059-014-0550-8), *Genome Biol.* (2014)
- Robinson & Oshlack, [A scaling normalization method for differential expression analysis of RNA-seq data](https://doi.org/10.1186/gb-2010-11-3-r25), *Genome Biol.* (2010)
- Wagner et al., [Measurement of mRNA abundance using RNA-seq data: RPKM measure is inconsistent among samples](https://doi.org/10.1007/s12064-012-0162-3), *Theory Biosci.* (2012)
- Evans et al., [Selecting between-sample RNA-seq normalization methods from the perspective of their assumptions](https://doi.org/10.1093/bib/bbx008), *Brief. Bioinform.* (2018)
