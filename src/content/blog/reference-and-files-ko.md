---
title: "레퍼런스, 주석 (annotation), 그리고 그 사이의 파일들"
date: 2026-11-13
description: "레퍼런스 유전체가 실제로 무엇인지 · 세는 데 왜 유전자 위치를 알려주는 두 번째 파일이 필요한지 · FASTA, FASTQ, SAM, BAM, GTF, BED, VCF를 표 하나로 · 정렬이 read에 더해주는 것 · 그리고 read가 아무것도 세지 못하고 버려지는 이유들"
category: concept
updated: 2026-11
lang: ko
group: reference-and-files
topic: Bioinformatics
subtopic: Sequencing
tags: [reference genome, annotation, GTF, BAM, file formats]
---

[count matrix까지 가는 글](../geo-fastq-ko/)은 절차다. 이 명령을 이 순서로 돌려라. 이 글은 그 아래층이다. 레퍼런스와 파일들이 실제로 무엇인지 — 그래야 명령어가 주문이 아니게 된다. [시퀀싱](../sequencing-ko/)에서 이어진다.

## 레퍼런스 유전체가 무엇인가

레퍼런스 유전체 (reference genome)는 염색체 (chromosome)마다 A, C, G, T가 길게 이어진 문자열 하나이고, **FASTA** 파일에 들어 있다. 특정 개인의 유전체가 아니고, 여러 사람의 평균도 아니다 — 소수의 익명 공여자 (donor)에게서 받은 클론 라이브러리 (clone library)를 이어 붙인 **반수체 모자이크 (haploid mosaic)** 이고, 그중 한 라이브러리가 대부분을 차지한다. 모두가 위치를 같은 방식으로 말할 수 있게 하려고 존재한다.

파일에는 염색체만 들어 있지 않다. 서열이 아직 밝혀지지 않은 자리의 `N` 구간, 위치가 정해지지 않은 scaffold 꼬리, 그리고 변이가 심한 영역의 대체 하플로타입 (alternate haplotype)이 함께 들어 있다. 똑같이 GRCh38이라 불리는 두 파일이 다르게 동작하는 이유가 이것이다.

레퍼런스에는 **버전**이 있고, 그 버전은 결과의 일부다.

| 종 | 현재 assembly |
| --- | --- |
| 사람 | GRCh38 (hg38); 예전 작업에는 GRCh37/hg19도 흔하다 |
| 생쥐 | GRCm39; 그 전은 GRCm38/mm10 |

**좌표는 assembly 사이에서 통하지 않는다.** GRCh37의 1번 염색체 1,000,000번은 GRCh38의 같은 염기가 아니다. 섞어 쓰면 멀쩡해 보이면서 틀린 결과가 나온다. assembly를 method에 적는 이유다.

## 주석 (annotation): 유전자가 어디 있는지 알려주는 파일

레퍼런스는 글자를 알려준다. 어느 구간이 유전자인지는 알려주지 않는다. 그건 **따로 있는 파일**, 주석 (annotation)이고 보통 **GTF**(또는 가까운 친척인 GFF)다.

GTF는 표다. feature 하나당 한 줄이고, 염색체·시작·끝 좌표 (coordinate)·strand·feature 종류(gene, transcript, exon), 그리고 마지막 열에 유전자 ID와 이름이 담긴 속성들이 들어간다.

**세려면 두 파일이 다 필요하다.** 정렬 (alignment) 도구는 레퍼런스로 read가 어디서 왔는지 찾고, 세는 도구는 주석으로 그 위치가 어느 유전자인지 정한다. 주석을 바꾸면 read가 똑같아도 count가 바뀐다. assembly와 마찬가지로 주석의 **출처와 버전**도 method의 일부다.

- **GENCODE와 Ensembl** — 같은 유전자 집합이다. GENCODE는 거기에 속성 (attribute)을 더 얹어서 내보내고 사람·생쥐의 표준 선택이며, Ensembl은 포장 방식이 다르다
- **RefSeq** — 따로 큐레이션되고, 더 보수적이며 유전자당 전사체 (transcript)가 적다

셋은 유전자 식별자 (gene identifier)가 다르고, 하위 도구가 맞춰보는 게 바로 그 식별자다. **ID 체계를 변환하면 유전자가 조용히 사라진다.** 흔하고, 눈에 안 보이는 방식으로 결과를 잃는 길이다.

## 파일 형식, 표 하나로

| 형식 | 담는 것 | 모양 |
| --- | --- | --- |
| **FASTA** | 서열 — 유전체, 전사체, 단백질 집합 | `>이름` 다음에 글자들 |
| **FASTQ** | 서열 *과* 염기별 품질 — 원시 read | read 하나당 네 줄 |
| **SAM** | 레퍼런스 위에 놓인 read | 텍스트, 정렬 하나당 한 줄 |
| **BAM** | 같은 것을 압축한 것 — 좌표로 정렬하면 색인 (index)을 붙일 수 있다 | 이진. 실제로 보관하는 건 이것 |
| **GTF / GFF** | 유전자가 어디 있는지 | feature 하나당 한 줄 |
| **BED** | 단순 구간 — peak, 영역, 무엇이든 | 염색체, 시작, 끝 |
| **VCF** | 변이 — 레퍼런스와 다른 지점 | 변이 위치당 한 줄 |

외워둘 함정이 하나 있다. **BED는 0부터 세고 끝을 제외한다. GTF는 1부터 세고 끝을 포함한다.** 같은 엑손이 BED에서는 `chr1 999 1100`, GTF에서는 `chr1 1000 1100`이다. 도구들은 알아서 변환하지만 손으로 쓴 스크립트는 자주 틀리고, 결과는 **어떤 에러 메시지도 알려주지 않는 1칸 어긋남**이다.

## 정렬 (alignment)이 read에 더해주는 것

FASTQ의 read는 주소가 없는 문자열이다. 정렬 후에는 주소가 생기고, 장부가 몇 줄 붙는다. BAM에서 알아볼 값어치가 있는 것들:

- **position** — read가 시작하는 염색체와 좌표
- **CIGAR** — read가 어떻게 맞춰졌는지를 압축한 문자열. `100M`은 100염기가 indel 없이 쭉 정렬됐다는 뜻이다 — 일치든 불일치든 상관없다. 둘을 구분하는 건 `=`와 `X`뿐이다. 그리고, `50M200N50M`은 50개 맞고 200개 건너뛰고 50개 맞았다는 뜻이다. RNA-seq에서 그 건너뜀이 **인트론 (intron)**이다. 즉 이 read는 splice junction을 가로질렀다
- **MAPQ** — 이 위치가 맞을 거라는 확신도
- **flag** — paired 여부, 짝의 위치, 역방향 (reverse strand), 중복 (duplicate)

MAPQ에는 주의가 하나 붙는다. **정렬 도구마다 척도가 다르다.** STAR는 유일하게 매핑된 read에 255를 쓰는데 — SAM 명세가 "매핑 품질을 알 수 없음"을 뜻하도록 비워둔 값이다 — BWA-MEM은 최대가 60이며 0은 여러 곳에 똑같이 잘 붙었다는 뜻이다. 한 파이프라인에서 베껴온 필터가 다른 파이프라인에서 **전부를 버릴 수 있다.**

## read가 세어지지 않는 이유

read가 정렬을 통과하고도 matrix에 아무것도 기여하지 못할 수 있다.

- **Multi-mapping** — 여러 곳에 똑같이 잘 맞는다. 보통 반복서열 (repeat)이나 유전자 가족 (gene family)이다. 세는 도구 대부분은 추측하지 않고 버린다
- **Ambiguous** — 주석된 두 유전자가 겹치는 자리에 떨어져서 어느 쪽인지 정해지지 않는다
- **No feature** — 유전체에는 붙었는데 주석된 유전자에는 안 붙는다. 인트론, 유전자 사이, 또는 이 주석에 없는 전사체
- **Unmapped** — 레퍼런스에 아예 안 붙는다. 오염 (contamination), 어댑터 (adapter), 품질 나쁜 read

이 숫자들은 보고되고, **읽어볼 값어치가 있다.** "no feature" 비율이 큰 시료는 보통 strandedness 설정이 틀린 경우다 — 다른 게 다 멀쩡해도 그것만으로 대부분의 read가 여기로 떨어진다 — 아니면 유전체 DNA 오염 (genomic DNA contamination)이거나 주석이 틀린 경우고, "unmapped" 비율이 크면 보통 종이 틀렸거나 앞 단계에서 뭔가 잘못된 경우다.

## 요약

- **레퍼런스 유전체**는 FASTA에 든 합의 서열이다. **assembly 버전**은 결과의 일부이고 좌표는 버전 간에 통하지 않는다
- 레퍼런스는 유전자 위치를 말해주지 않는다. 그건 별도의 **주석** 파일(보통 GTF)이고, 그 출처와 버전이 count를 바꾼다
- GENCODE와 Ensembl은 같은 유전자 집합이고 RefSeq은 따로 큐레이션된다. 셋은 유전자 ID가 다르고, 변환하면 유전자가 조용히 사라진다
- **BED는 0-based·끝 제외, GTF는 1-based·끝 포함**
- 정렬은 read에 위치, **CIGAR**(RNA-seq에서 `N`은 splice junction), **MAPQ**, flag를 붙인다
- MAPQ 척도는 도구마다 다르다. STAR의 유일 매핑은 255, BWA의 최대는 60
- read는 multi-mapping·ambiguous·no feature·unmapped로 버려질 수 있고, 그 네 숫자가 시료를 진단한다

## 참고문헌

- Danecek et al., [Twelve years of SAMtools and BCFtools](https://doi.org/10.1093/gigascience/giab008), *GigaScience* (2021)
- Mudge et al., [GENCODE 2025: reference gene annotation for human and mouse](https://doi.org/10.1093/nar/gkae1078), *Nucleic Acids Res.* (2025)
- Dobin et al., [STAR: ultrafast universal RNA-seq aligner](https://doi.org/10.1093/bioinformatics/bts635), *Bioinformatics* (2013)
- Putri et al., [Analysing high-throughput sequencing data in Python with HTSeq 2.0](https://doi.org/10.1093/bioinformatics/btac166), *Bioinformatics* (2022)
