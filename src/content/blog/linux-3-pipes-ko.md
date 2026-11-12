---
title: "리눅스 #3 — pipe와 redirection, 그리고 검색"
date: 2024-04-19
description: "stdout과 stderr는 다른 통로 · 2>&1의 순서가 중요한 이유 · grep과 find의 차이 · sort | uniq -c로 세기"
category: tutorial
updated: 2024-05
lang: ko
group: linux-3
topic: Linux
tags: [linux, shell]
---

**시리즈** · [#1 명령줄](../linux-1-command-line-ko/) · [#2 파일과 권한](../linux-2-files-ko/) · #3 pipe와 검색 · [#4 프로세스](../linux-4-processes-ko/) · [#5 셸 스크립트](../linux-5-scripting-ko/)

<mark class="blue">리눅스 명령은 하나하나는 단순하다. 힘은 **이어 붙이는 데서** 나온다.</mark>

## stdin · stdout · stderr

모든 명령에는 통로가 세 개 있다.

| 이름 | 번호 | 무엇 |
| --- | --- | --- |
| stdin (standard input) | 0 | 들어오는 입력 |
| stdout (standard output) | 1 | 정상 출력 |
| stderr (standard error) | 2 | **오류 메시지** |

정상 출력과 오류가 **따로** 흐른다는 점이 중요하다. <mark>그래서 출력을 파일로 보내도 오류는 여전히 화면에 뜬다.</mark>

<figure>
<img src="/assets/fig/linux-streams.svg" alt="One input stream and two output streams, and a chain of commands joined by pipes" loading="lazy" />
<figcaption><b>들어가는 길 하나, 나오는 길 둘.</b> 결과는 stdout으로, 불평은 stderr로 나가고 둘은 별개의 통로다. pipe는 앞 명령의 stdout을 다음 명령의 stdin에 꽂는 것이고, 요령은 그게 전부다.</figcaption>
</figure>

## redirection (방향 바꾸기) — 파일로 보내기

```bash
python train.py > out.log       # 덮어쓰기
python train.py >> out.log      # 이어 붙이기
python train.py 2> err.log      # 오류만 따로
python train.py > all.log 2>&1  # 둘 다 한 파일로
python train.py &> all.log      # 위와 같음 (bash 전용, 더 짧음)
sort < names.txt                # 파일을 입력으로 넣기
```

`2>&1`은 "stderr(2)를 stdout(1)이 가는 곳으로 보내라"는 뜻이다.

> **순서가 중요하다.** `> all.log 2>&1`은 맞고, `2>&1 > all.log`는 틀렸다. 뒤 형태는 stderr를 *아직 화면인* stdout에 붙인 다음 stdout만 파일로 돌리기 때문에, 오류는 화면에 남는다.

출력이 필요 없을 때는 `/dev/null`로 버린다.

```bash
command > /dev/null 2>&1        # 조용히 실행
```

## pipe — 명령끼리 잇기

`|`는 앞 명령의 stdout을 뒤 명령의 stdin으로 넘긴다.

```bash
ls | wc -l                      # 파일이 몇 개인가
cat train.log | grep Error      # 로그에서 에러 줄만
ps aux | grep python            # 돌아가는 파이썬 프로세스
du -sh * | sort -h | tail -5    # 제일 큰 폴더 다섯 개
```

pipe는 얼마든지 이을 수 있고, 각 단계는 한 가지만 한다. 문장처럼 읽으면 된다. *크기를 재고 → 정렬하고 → 마지막 다섯 줄만.*

## grep — 찾기

```bash
grep "Error" train.log          # 이 단어가 든 줄
grep -i "error" train.log       # 대소문자 무시
grep -n "Error" train.log       # 줄 번호까지
grep -c "Error" train.log       # 몇 줄인지 세기
grep -v "DEBUG" train.log       # 이 단어가 '없는' 줄만
grep -r "TODO" src/             # 폴더 전체를 뒤져서
grep -A 3 -B 1 "Error" log      # 맞은 줄 앞 1줄, 뒤 3줄까지
```

실제로 자주 쓰는 건 이 둘이다.

```bash
grep -rn "load_model" src/      # 이 함수가 어디서 쓰이는지
grep -v "^#" config.conf        # 주석 뺀 설정만 보기 (^는 줄 시작, 아래 참고)
```

## 정규식 (regular expression) 기초

`grep`은 패턴을 받는다. 다음 다섯 개면 대부분 해결된다.

| 기호 | 뜻 |
| --- | --- |
| `^` | 줄의 시작 |
| `$` | 줄의 끝 |
| `.` | 아무 글자 하나 |
| `.*` | 아무 글자 몇 개든 |
| `[0-9]` | 숫자 하나 |

```bash
grep "^epoch" train.log         # epoch로 시작하는 줄
grep "loss: 0\.[0-9]*" log      # loss: 0.xxx 형태
```

점(`.`)은 정규식에서 특별한 뜻이라, 진짜 점을 찾으려면 `\.`로 쓴다.

## 알아둘 만한 필터

| 명령 | 하는 일 |
| --- | --- |
| `wc -l` | 줄 수 |
| `sort` | 정렬 (`-n` 숫자, `-h` 사람이 읽는 크기, `-r` 역순) |
| `uniq` | **이웃한** 중복 제거 (`-c` 개수 세기) |
| `cut -d, -f2` | 구분자로 잘라 n번째 열만 |
| `head` / `tail` | 앞 / 뒤 n줄 |
| `tr` | 글자 바꾸기·지우기 |
| `sed 's/a/b/g'` | 치환 |
| `awk '{print $1}'` | 열 단위 처리. `$1`이 첫 열 |

> **`uniq`는 반드시 `sort` 뒤에.** 붙어 있는 줄만 비교하기 때문에, 정렬하지 않으면 떨어져 있는 중복을 놓친다. `sort | uniq -c | sort -rn`이 "많이 나온 순으로 세기"의 정석이다.

## 실제로 쓰는 조합

```bash
# CSV의 두 번째 열에 어떤 값이 몇 개씩 있나
cut -d, -f2 data.csv | sort | uniq -c | sort -rn

# 로그에서 에러 종류별 개수
grep -i error train.log | cut -d: -f2 | sort | uniq -c

# 가장 큰 파일·폴더 열 개
du -ah . | sort -h | tail -10

# 어느 GPU가 비어 있나
nvidia-smi --query-gpu=index,memory.used --format=csv

# 로그를 보면서 동시에 파일로도 남기기
python train.py 2>&1 | tee train.log
```

마지막 `tee`는 pipe를 두 갈래로 나눈다. 화면으로도 보내고 파일로도 쓴다. 긴 학습을 돌릴 때 유용하다.

## find — 파일 찾기

`grep`이 파일 *안*을 찾는다면 `find`는 파일 *자체*를 찾는다.

```bash
find . -name "*.ckpt"                 # 이름으로
find . -type d -name "logs"           # 디렉터리만
find . -size +1G                      # 1GB 넘는 것
find . -mtime -7                      # 최근 7일 안에 수정된 것
find . -name "*.tmp" -delete          # 찾아서 지우기
```

> `-delete`는 항상 **빼고 먼저 실행**해서 목록을 확인한 다음 붙인다.

## 정리

- stdout(1)과 stderr(2)는 다른 통로 — `2>&1`로 합친다
- `>` 덮어쓰기, `>>` 이어쓰기, `|` 다음 명령으로 넘기기
- `grep`으로 안을 찾고, `find`로 파일을 찾는다
- `sort | uniq -c | sort -rn` = 빈도 세기
- `tee`는 보면서 동시에 저장

다음 편은 [프로세스와 작업 관리](../linux-4-processes-ko/)이다. 학습을 띄워놓고 접속을 끊어도 계속 돌게 만드는 법이다.

## 참고

- [grep(1)](https://man7.org/linux/man-pages/man1/grep.1.html)
- [Ryan's Linux Tutorial — Piping and Redirection](https://ryanstutorials.net/linuxtutorial/piping.php)
