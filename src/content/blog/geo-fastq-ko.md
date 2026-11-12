---
title: "GEO 번호 하나에서 count 행렬까지"
date: 2026-06-12
description: "GSE·GSM·GPL·SRR이 각각 무엇을 가리키나 · SRA에서 FASTQ 꺼내기 · FASTQ 한 레코드에 든 것과 FastQC가 말하는 것 · 트리밍·정렬 또는 유사정렬·카운팅 · annotation 버전이 왜 method의 일부인가 · 그리고 제출자의 count를 그냥 쓸 때"
category: tutorial
updated: 2026-07
lang: ko
group: geo-fastq
topic: Bioinformatics
subtopic: Transcriptomics
tags: [GEO, SRA, RNA-seq, preprocessing]
---

논문이 GEO (Gene Expression Omnibus) 번호 하나를 준다 — `GSE123456`. 그리고 [DESeq2](../de-tools-ko/)에 넘길 유전자 × 샘플 행렬이 필요하다.

## 그 번호가 가리키는 것

<figure>
<img src="/assets/fig/geo-structure.svg" alt="GSE series containing GSM samples, a GPL platform, and SRR runs holding the raw reads" loading="lazy" />
<figcaption><b>접두어 네 개가 서로 다른 것을 가리킨다.</b> 논문에 적힌 번호는 거의 항상 <b>GSE</b>다. 원시 read는 GEO에 없다. 연결된 SRP/SRR 번호를 통해 SRA (Sequence Read Archive)에 있다.</figcaption>
</figure>

| 접두어 | 무엇인가 |
| --- | --- |
| **GSE** | series — 연구 하나. 논문에 인용되는 번호 |
| **GSM** | sample — 라이브러리 하나. 샘플별 metadata가 여기 들어 있다 |
| **GPL** | platform — 어느 장비인가 |
| **SRP / SRR** | 원시 read. SRA (Sequence Read Archive)에 있다. SRP는 연구 단위, SRR은 시퀀싱 run 하나 |

<mark class="blue">design 공식에 필요한 metadata는 GSM 레코드에 있고, 자유 텍스트다.</mark> 조건·성별·나이·배치 — 제출자가 characteristics 필드에 넣었으면 파싱할 수 있고, 샘플 제목에 넣었으면 그걸 파싱하고, 아예 기록하지 않았으면 원하던 비교는 불가능하며 어떤 처리로도 복구되지 않는다. **400 GB를 내려받기 전에 GSM 필드를 먼저 읽는다.**

```r
library(GEOquery)
gse <- getGEO("GSE123456", GSEMatrix = TRUE)
pData(gse[[1]])[, 1:10]      # 이것부터 본다
```

## FASTQ 받기

```bash
# 요즘의 SRA toolkit: prefetch 후 변환
prefetch SRR12345678
fasterq-dump --split-files --threads 8 SRR12345678
gzip SRR12345678_*.fastq      # fasterq-dump는 압축 없이 쓰고, 파일이 크다
```

`--split-files`가 paired-end에서 `_1`·`_2`를 만들어 준다. 이걸 빠뜨려서 paired를 single로 다루는 것이 흔하고 조용한 오류다.

연구 전체라면 직접 스크립트 짜는 것보다 파이프라인이 낫다.

```bash
nextflow run nf-core/fetchngs --input ids.csv --outdir fastq/   # ids.csv: 한 줄에 accession 하나
```

## FASTQ에 무엇이 들어 있나

read 하나당 네 줄, 항상.

```
@SRR12345678.1 1/1
GGTTCAGCAGGAATGCCGAGACCGATCTCCCTAAGCTACGG
+
IIIIIIIIIIIIIIIIIIIIIIIIIIFFFFFFF:,,,,,,,
```

1. 식별자
2. 서열
3. `+` 구분자
4. **품질**, 염기 하나당 글자 하나

품질 줄은 Phred+33이다. 글자에서 33을 빼면 점수이고, 점수는 −10·log₁₀(오류 확률)이다. `I`는 40 — 1만 개에 하나 틀림. `,`는 11 — 대략 13개에 하나. 위처럼 3′ 끝에서 품질이 떨어지는 건 정상이다.

## QC (quality control), 그리고 실제로 볼 것

```bash
fastqc *.fastq.gz -o qc/ -t 8
multiqc qc/ -o qc/
```

파일마다 FastQC를 돌리고 **MultiQC로 하나의 보고서로 합친다.** 샘플이 40개면 개별 보고서는 읽을 수 없고, 어느 샘플이 나머지와 다른가만이 의미 있는 질문이다.

| 모듈 | 무슨 뜻인가 |
| --- | --- |
| per-base quality | 3′ 끝의 하락은 정상, 절벽은 아니다 |
| per-sequence GC | 봉우리가 둘이면 오염 또는 rRNA (ribosomal RNA) |
| adapter content | adapter (시퀀싱 전에 각 조각 끝에 붙이는 합성 서열)가 read에 얼마나 섞여 들어왔는지. 트리밍이 필요한지를 알려 준다 |
| duplication | RNA-seq에서는 높은 게 정상 — 많이 발현된 유전자는 실제로 중복된다 |
| overrepresented sequences | 대개 rRNA나 adapter. 걱정하기 전에 찾아본다 |

<mark>FastQC는 유전체 시퀀싱용으로 만들어졌고, 빨간 X 중 일부는 RNA-seq에서 정상이다.</mark> duplication과 read 앞부분의 염기 조성 편향이 괜히 사람을 놀라게 하는 대표적인 항목인데, 후자는 random priming 편향이라 원래 그렇다.

## 트리밍, 그다음 정량

<figure>
<img src="/assets/fig/rnaseq-pipeline.svg" alt="FASTQ, QC, trimming, alignment or pseudo-alignment, counts, with the reference annotation feeding in" loading="lazy" />
<figcaption><b>전체 경로.</b> count 행렬까지는 엔지니어링이고 그 뒤는 통계다. 참조 유전체와 annotation이 정량 단계로 들어가고, <b>그 annotation의 버전이 method의 일부다.</b></figcaption>
</figure>

```bash
# --detect_adapter_for_pe: adapter 서열을 적어 주는 대신 read에서 알아내게 한다
fastp -i r_1.fq.gz -I r_2.fq.gz -o t_1.fq.gz -O t_2.fq.gz --detect_adapter_for_pe
```

요즘 정렬기는 adapter를 soft-clip한다. read를 버리는 대신 맞지 않는 끝부분만 무시하는 것이라, 트리밍이 선택인 경우가 많다. adapter 비율이 높거나 read 끝이 나쁠 때 한다.

그다음 둘 중 하나다. read 하나하나를 유전체 위 위치에 맞추거나, 위치는 건너뛰고 어느 전사체에서 왔는지만 알아내거나(유사정렬).

| | 유전체에 정렬 | 전사체에 유사정렬 |
| --- | --- | --- |
| 도구 | STAR → featureCounts | salmon, kallisto |
| 얻는 것 | BAM (binary alignment/map) 파일. 특정 자리를 들여다볼 수 있다 | count만 |
| 비용 | 메모리 큼(사람 기준 ~32 GB), 느림 | 샘플당 수 분, 노트북으로 가능 |
| 쓸 때 | coverage·새 전사체·변이가 필요할 때 | 유전자 count만 필요할 때 |

```bash
# -i: `salmon index`로 한 번 만들어 둔 전사체 index.  -l A: library type을 추론하게 한다
salmon quant -i idx -l A -1 t_1.fq.gz -2 t_2.fq.gz -o out/
```

대부분의 차등 발현 작업에서는 salmon이 올바른 기본값이다. 10배가량 싸고, 유전자 수준 count가 정렬 경로와 거의 일치한다.

## 조용히 분석을 망치는 것들

- **annotation 버전이 method의 일부다.** GENCODE v38과 v45는 유전자 집합이 다르다. 샘플 절반을 한쪽으로, 절반을 다른 쪽으로 정량했다면 배치 효과가 유전자 집합 자체에 들어 있다.
- **Strandedness.** 라이브러리가 read가 어느 가닥에서 왔는지를 보존하는지 여부다. 틀리면 read 대부분을 잃거나 반대 가닥 유전자에 배정한다. `salmon -l A`가 추론해 주는데, 가정하지 말고 무엇이라고 추론했는지 확인한다.
- **paired냐 single이냐.** 위의 `--split-files` 참고.
- **전사체 수준 count는 DESeq2 전에 `tximport`가 필요하다.** salmon 출력을 DESeq2에 바로 주면 전사체 길이 보정 offset이 빠진다.
- **rRNA.** 제거가 실패했으면 라이브러리 대부분이 rRNA이고, 유효 깊이는 read 수가 시사하는 값의 일부에 불과하다.

## 이 전부를 건너뛰어도 될 때

많은 GSE가 처리된 count 행렬을 보조 파일로 함께 올린다. 그걸 쓰는 건 정당하고 대개 옳다. 다만 무엇을 받아들이는지는 알아야 한다.

- **남의 파이프라인**이 만든 것이다. 그쪽 정렬기, 그쪽 annotation 버전.
- 내가 만든 count와 합치면 파이프라인 효과인 배치 효과가 생긴다.
- **여러 연구를 합치는 중이라면**, 하나의 파이프라인으로 FASTQ부터 전부 다시 정량하는 것이 비교 가능한 행렬을 얻는 유일한 방법인 경우가 많다.

연구 하나, 질문 하나라면 보조 count를 쓴다. 여러 연구를 합친다면 FASTQ부터 시작한다.

## 정리

- GSE는 연구, GSM은 샘플이자 metadata가 들어 있는 곳, SRR은 SRA의 원시 read
- 내려받기 **전에** GSM metadata를 읽는다. 기록되지 않은 공변량은 어떤 처리로도 복구되지 않는다
- FASTQ 레코드는 네 줄. 품질 줄은 Phred+33이고 3′ 하락은 정상이다
- FastQC 다음 **MultiQC**. RNA-seq에서 높은 duplication과 read 앞부분 편향은 정상이다
- 요즘 정렬기에서는 트리밍이 선택인 경우가 많다
- 유전자 count는 **salmon**, 정렬이 필요하면 **STAR**. 그리고 DESeq2 전에 `tximport`
- **annotation 버전·strandedness·paired 처리**, 이 셋이 조용히 분석을 망친다
- 제출자 count는 연구 하나에는 괜찮고, 여러 연구를 합칠 때는 틀린 선택이다

## 참고

- [GEO 문서](https://www.ncbi.nlm.nih.gov/geo/info/overview.html) · [SRA toolkit](https://github.com/ncbi/sra-tools)
- [nf-core/rnaseq](https://nf-co.re/rnaseq), [nf-core/fetchngs](https://nf-co.re/fetchngs) — 직접 스크립트 짜는 대신 쓸 만한 파이프라인
- Patro et al., [Salmon provides fast and bias-aware quantification of transcript expression](https://doi.org/10.1038/nmeth.4197), *Nat. Methods* (2017)
- Soneson, Love & Robinson, [Differential analyses for RNA-seq: transcript-level estimates improve gene-level inferences](https://doi.org/10.12688/f1000research.7563.2), *F1000Research* (2016) — `tximport`가 존재하는 이유
