---
title: "시퀀싱: 기계가 실제로 주는 것"
date: 2026-11-13
description: "시퀀서는 분자를 처음부터 끝까지 읽지 않는다 · 짧은 조각을 여러 번 읽는다 · read, depth, coverage가 무엇인지 · read가 쌍으로 나오는 이유 · 그리고 FASTQ 파일에 들어 있는 것"
category: concept
updated: 2026-11
lang: ko
group: sequencing
topic: Bioinformatics
subtopic: Sequencing
tags: [sequencing, NGS, FASTQ, reads, coverage]
---

내가 하는 RNA-seq 분석은 전부 count matrix에서 시작하고, [거기까지 가는 글](../geo-fastq-ko/)은 FASTQ 파일에서 시작한다. 이 글은 그 앞 단계다. 기계가 무엇을 하고, 데이터가 왜 그런 모양으로 나오는지.

## 시퀀서는 분자가 아니라 조각을 읽는다

처음에 갖게 되는 직관은 시퀀서가 DNA 분자를 한쪽 끝에서 반대쪽 끝까지 읽는다는 것이다. 아니다. 시료 (sample)는 먼저 **짧은 조각 (fragment)**으로 쪼개지고, 기계는 각 조각의 끝에서 일정 길이를 읽는다. 그 한 토막이 **read**다.

흔히 쓰는 short-read 기계의 read는 50~300 염기다. 유전자는 수천 염기다. 그러니 통째로 읽히는 것은 아무것도 없고, 원래 서열은 나중에 재구성 (reconstruction)해야 한다 — read를 참조 유전체 (reference genome)에 정렬 (alignment)하거나, read끼리 맞춰서 조립 (assembly)하거나.

처음 받는 파일이 순서 없는 짧은 문자열 수백만 개인 이유가 이것이고, 정렬이 기계가 해준 일이 아니라 별도 단계인 이유도 이것이다.

## Depth와 coverage

조각내기 (fragmentation)가 무작위라서, 같은 위치가 서로 다른 조각들에 의해 여러 번 읽힌다. 이걸 가리키는 말이 두 개다.

| 용어 | 무엇을 세는가 |
| --- | --- |
| **Depth (깊이)** | 한 위치를 몇 개의 read가 덮는가 |
| **Coverage (커버리지)** | 대상 중 얼마만큼이 읽히기는 했는가 |

둘은 자주 섞여 쓰이고, "30× coverage"는 보통 평균 depth를 뜻한다. 구분이 중요해지는 건 어떤 구간이 아예 안 읽혔을 때다 — **평균 depth가 높아도 빠진 데가 없다는 뜻은 아니다.**

RNA-seq에서 사람들이 말하는 숫자는 **library size**, 즉 시료당 총 read 수이고 보통 2천만~5천만이다. 이 숫자 자체는 품질 지표가 아니다. read는 많은데 전부 소수의 고발현 유전자에서 나왔다면 숫자가 말하는 것보다 정보가 적다. [정규화](../reading-de-ko/)가 있는 이유다.

## read가 쌍으로 나오는 이유

한 조각을 양쪽 끝에서 읽을 수 있다. 그러면 read가 두 개 — **pair** — 나오고, 둘 사이 거리가 대략 알려진다.

- **Single-end**: 조각당 read 하나. 싸고, 유전자를 세는 데는 충분하다.
- **Paired-end**: 양쪽 끝. 위치가 더 확실히 고정돼서 splicing, 구조변이 (structural variant), 반복서열 (repeat) 구간에서 유리하다.

내가 다루는 bulk RNA-seq은 대부분 paired-end이고, 그게 시료 (sample)당 FASTQ 파일 두 개 (`_1`, `_2`) 로 나타난다. 두 파일은 같은 read 이름이 같은 순서로 들어 있다.

## Long read, 짧게

두 번째 계열인 PacBio와 Oxford Nanopore는 수만 염기짜리 조각을 통째로 읽는다. 재구성 문제가 사라진다 — 전사체 (transcript) 하나를 한 조각으로 읽을 수 있으니 isoform이 모호하지 않다. 대가는 염기 (base)당 오류율 (error rate)이 높고 시료당 비용이 비싸다는 것이라, 세는 작업에는 여전히 short read가 기본이다.

## FASTQ 파일에 들어 있는 것

read 하나당 네 줄이다.

```
@SRR1234567.1 1/1          ← read 이름
GATTACAGATTACAGATTACA      ← 염기
+
IIIIIIIIIIIIIIIIIFFF:      ← 염기 하나당 품질 문자 하나
```

알아둘 값어치가 있는 건 네 번째 줄이다. 각 문자가 **Phred score**를 담는다. 기계가 그 염기를 잘못 불렀을 확률의 추정치다.

| Phred | 오류 확률 | 읽는 법 |
| --- | --- | --- |
| 10 | 10분의 1 | 나쁨 |
| 20 | 100분의 1 | 쓸 만함 |
| 30 | 1,000분의 1 | 좋음 |
| 40 | 10,000분의 1 | 매우 좋음 |

품질은 read의 뒤쪽으로 갈수록 떨어진다 — 사이클이 거듭될수록 화학반응이 나빠진다. 품질 검사 (quality control) 그림이 위치별로 그려지는 이유이고, 꼬리를 잘라내는 trimming (트리밍)이 상례인 이유다.

## 요약

- 시퀀서는 분자 전체가 아니라 짧은 조각을 읽는다. **read**는 그 한 토막이다
- 재구성(정렬 또는 조립)은 그다음에, 소프트웨어가 한다
- **Depth**는 위치당 read 수, **coverage**는 얼마나 읽혔는가. 평균 depth가 높아도 빠진 구간이 있을 수 있다
- Library size는 품질이 아니다. 소수 유전자에 몰린 read는 숫자만큼의 정보를 담지 않는다
- **Paired-end**는 조각의 양쪽 끝을 읽어 위치를 고정한다. FASTQ 파일 두 개로 온다
- Long read는 재구성 문제를 없애는 대신 정확도와 비용을 치른다
- FASTQ의 read는 네 줄이고, 네 번째 줄은 염기별 **Phred score**다. 품질은 read 끝으로 갈수록 떨어진다

## 참고문헌

- Goodwin et al., [Coming of age: ten years of next-generation sequencing technologies](https://doi.org/10.1038/nrg.2016.49), *Nat. Rev. Genet.* (2016)
- Conesa et al., [A survey of best practices for RNA-seq data analysis](https://doi.org/10.1186/s13059-016-0881-8), *Genome Biol.* (2016)
- Cock et al., [The Sanger FASTQ file format, and the Solexa/Illumina FASTQ variants](https://doi.org/10.1093/nar/gkp1137), *Nucleic Acids Res.* (2010)
- Amarasinghe et al., [Opportunities and challenges in long-read sequencing data analysis](https://doi.org/10.1186/s13059-020-1935-5), *Genome Biol.* (2020)
