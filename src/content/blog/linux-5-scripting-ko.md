---
title: "리눅스 #5 — 셸 스크립트"
date: 2024-06-14
description: "set -euo pipefail이 왜 첫 줄인가 · 변수에 따옴표를 씌우는 이유 · [ ] 안의 공백과 비교 연산자 · 인자와 종료 코드"
category: tutorial
updated: 2024-07
lang: ko
group: linux-5
topic: Linux
tags: [linux, bash, shell]
---

**시리즈** · [#1 명령줄](../linux-1-command-line-ko/) · [#2 파일과 권한](../linux-2-files-ko/) · [#3 pipe와 검색](../linux-3-pipes-ko/) · [#4 프로세스](../linux-4-processes-ko/) · #5 셸 스크립트

<mark class="blue">같은 명령을 세 번 쳤다면 스크립트로 만들 때다.</mark>

## 첫 스크립트

```bash
nano run.sh                 # 편집기는 아무거나
```

```bash
#!/bin/bash
echo "시작: $(date)"
python train.py --epochs 100
echo "끝: $(date)"
```

```bash
chmod +x run.sh            # 실행 권한 (한 번만)
./run.sh
```

첫 줄 `#!/bin/bash`가 **shebang**이다. `#!` 뒤에 인터프리터의 절대 경로를 적는다. 그 외에 `#`로 시작하는 줄은 주석이다.

리눅스에는 `sh` (Bourne), `ksh` (Korn), `bash` (Bourne-Again) 등이 있고 대부분의 배포판 기본은 **bash**이다. Debian·Ubuntu에서 `/bin/sh`는 `dash`라 bash 전용 문법을 거부하므로, bash 기능을 쓴다면 `#!/bin/sh`가 아니라 `#!/bin/bash`라고 써야 한다.

## 맨 위에 넣어둘 한 줄

```bash
#!/bin/bash
set -euo pipefail
```

| 옵션 | 효과 |
| --- | --- |
| `-e` | 실패한 명령이 나오면 즉시 중단 |
| `-u` | 정의 안 된 변수를 쓰면 오류 (오타를 잡아줌) |
| `-o pipefail` | pipeline의 **어느 단계든** 실패하면 실패 처리 |

`-e`가 없으면 전처리 단계가 실패해도 스크립트는 없는 파일을 대상으로 뒤 단계를 그대로 다 실행한다.

## 변수

타입 선언이 없다. `=` 양옆에 **공백을 넣지 않는다.**

```bash
name="run"
epochs=100
out="results/${name}_${epochs}"
echo "$out"
```

변수는 두 종류다.

- **환경 변수** — 시스템이 정의하며 관례상 대문자. `printenv`로 전체를 본다. `HOME`, `PATH` (셸이 프로그램을 찾는 디렉터리 목록), `CUDA_VISIBLE_DEVICES`.
- **사용자 변수** — 내가 정의하며, `export`하지 않으면 스크립트 실행 중에만 존재한다.

> <mark>**변수는 항상 따옴표로 감싼다.**</mark> 값에 공백이 있어도 `"$path"`는 한 덩어리로 유지되지만 `$path`는 쪼개진다. 파일 경로를 다룰 때 사고가 여기서 난다.

### 명령 출력 저장

```bash
today=$(date +%F)          # 권장
files=`ls | wc -l`         # 예전 backtick 방식
```

`$( )`는 중첩이 되고 읽기 쉬워서 이쪽을 쓴다.

### 산술 (arithmetic)

```bash
i=$((i + 1))
total=$(( epochs * 3 ))
```

예전 스크립트는 `` i=`expr $i + 1` ``를 썼다. `$(( ))`는 셸 내장이라 외부 프로세스를 띄우지 않고 공백 처리도 자연스럽다.

## 비교 연산자 (comparison operators)

조건은 `[ ]`(`test` 내장 명령) 또는 `[[ ]]`(bash 키워드, 기능이 더 많음) 안에 쓴다. **`[` 뒤와 `]` 앞에는 반드시 공백**이 필요하다. `a=1`일 때 `[$a -eq $b]`는 셸이 `[1`이라는 명령을 찾으려 해서 오류가 난다.

| 정수 | | 문자열 | | 파일 | |
| --- | --- | --- | --- | --- | --- |
| `-eq` | 같다 | `=` | 같다 | `-e` | 존재한다 |
| `-ne` | 다르다 | `!=` | 다르다 | `-f` | 일반 파일이다 |
| `-lt` | 작다 | `-z` | 길이가 0 | `-d` | 디렉터리다 |
| `-le` | 작거나 같다 | `-n` | 길이가 0이 아님 | `-s` | 비어 있지 않다 |
| `-gt` | 크다 | `\<` | 사전순 앞 | `-r` `-w` `-x` | 읽기·쓰기·실행 가능 |
| `-ge` | 크거나 같다 | `\>` | 사전순 뒤 | | |

> **자주 잘못 아는 두 가지.**
> 매뉴얼은 "POSIX 호환을 위해서는 `test`에 `=`를 써야 한다"고 명시한다. POSIX (portable operating system interface)는 유닉스 계열 셸이 공통으로 따르는 표준이다. `==`도 bash에서는 동작하지만 `sh`로 가면 깨진다.
> 또 `\<` `\>`는 "ASCII 순"이 아니라 **사전순** (lexicographic)이며, 실제 순서는 로케일을 따른다. `[ ]` 안에서는 이스케이프가 필요하고 `[[ ]]` 안에서는 필요 없다.

## 조건문 (conditionals)

```bash
if [ "$epochs" -gt 50 ]; then
    echo "긴 학습"
elif [ "$epochs" -eq 0 ]; then
    echo "학습 안 함"
else
    echo "짧은 학습"
fi
```

`fi`로 닫는다. 하나의 값을 여러 패턴과 맞출 때는 `case`가 깔끔하다.

```bash
case "$1" in
    train)  python train.py ;;
    eval)   python eval.py ;;
    *)      echo "사용법: $0 {train|eval}"; exit 1 ;;
esac
```

각 분기는 `;;`로 끝내고, `*)`는 아무것도 맞지 않을 때다. 맞는 패턴이 없고 `*)`도 없으면 `case`의 종료 상태는 0이다.

## 반복문 (loops)

```bash
# for — 목록을 순회
for seed in 42 43 44; do
    python train.py --seed "$seed"
done

# for — 파일들
for f in data/*.csv; do
    echo "처리 중: $f"
done

# while — 조건이 참인 동안
i=1
while [ "$i" -le 5 ]; do
    echo "반복 $i"
    i=$((i + 1))
done

# until — 조건이 거짓인 동안 (while의 반대)
until [ -f results/done.flag ]; do
    sleep 10
done
```

`break`는 반복문을 빠져나가고, `continue`는 남은 본문을 건너뛰고 다음 반복으로 간다.

| | `break` | `continue` |
| --- | --- | --- |
| 제어가 가는 곳 | `done` 다음 줄 | 루프 맨 위, 다음 값 |
| 쓰는 상황 | 찾던 것을 찾았을 때 | 이 항목만 건너뛸 때 |

## 인자 받기

| | |
| --- | --- |
| `$0` | 스크립트 이름 |
| `$1` … `$9` | 첫 번째~아홉 번째 인자 |
| `${10}` | 열 번째부터는 중괄호 필요 |
| `$#` | 인자 개수 |
| `$@` | 전체 인자, 각각 별개 단어로 |

```bash
#!/bin/bash
set -euo pipefail

if [ "$#" -lt 2 ]; then
    echo "사용법: $0 <config> <gpu>" >&2
    exit 1
fi

config="$1"
gpu="$2"
CUDA_VISIBLE_DEVICES="$gpu" python train.py --config "$config"
```

다른 명령에 인자를 그대로 넘길 때는 `"$*"`가 아니라 **`"$@"`** 를 쓴다. 인자 사이의 경계를 유지한다.

## 종료 코드 (exit code)

명령은 끝날 때 **0에서 255 사이**의 값을 반환한다. **0이 성공**, 나머지는 실패다. 매뉴얼은 "성공하는 방법은 하나로 정의되고 실패하는 방법은 여러 가지이기 때문"이라고 설명한다.

```bash
grep -q "Error" train.log  # -q: 아무것도 찍지 않고 종료 코드만 남긴다
echo "$?"                  # 직전 명령의 종료 코드
```

다만 `$?`를 직접 볼 일은 드물다. `if`가 이미 종료 상태를 검사하기 때문이다.

```bash
if grep -q "Error" train.log; then
    echo "에러 발견"
fi
```

내 스크립트의 종료 코드는 `exit`로 정한다.

```bash
exit 0    # 성공
exit 1    # 실패
```

알아둘 값이 둘 있다. 시그널 N으로 죽으면 bash는 **128 + N**을 반환하고 (Ctrl-C는 SIGINT = 2이므로 130), 127은 *command not found*이다.

## 실제로 쓰는 모양

```bash
#!/bin/bash
# 시드 세 개로 학습을 돌리고 로그를 남긴다
set -euo pipefail

CONFIG="${1:-configs/default.yaml}"     # 인자가 없으면 기본값
GPU="${2:-0}"
STAMP=$(date +%Y%m%d_%H%M)
OUT="runs/${STAMP}"

mkdir -p "$OUT"
echo "config=$CONFIG gpu=$GPU out=$OUT"

for seed in 42 43 44; do
    log="$OUT/seed${seed}.log"
    echo "=== seed $seed → $log"
    CUDA_VISIBLE_DEVICES="$GPU" python train.py \
        --config "$CONFIG" --seed "$seed" > "$log" 2>&1
done

echo "완료: $OUT"
```

`${1:-기본값}`은 "인자가 없으면 이 값을 쓴다"는 뜻이다. `set -u`를 켜 둔 채로도 쓸 수 있게 해 주는 장치다.

## 정리

- `#!/bin/bash` + `set -euo pipefail`로 시작
- 변수는 `=` 양옆 공백 없이, 읽을 때는 항상 `"$따옴표"`
- `[ ]` 안쪽에 공백, 정수는 `-eq`, 문자열은 `=`
- `for` `while` `until`, 그리고 `break` / `continue`
- `"$@"`로 인자를 넘기고, `exit 0`으로 성공을 알린다

## 참고

- [GNU Bash Reference Manual](https://www.gnu.org/software/bash/manual/)
- [Bash Conditional Expressions](https://www.gnu.org/software/bash/manual/html_node/Bash-Conditional-Expressions.html) · [Exit Status](https://www.gnu.org/software/bash/manual/html_node/Exit-Status.html)
- [Ryan's Linux Tutorial — Scripting](https://ryanstutorials.net/linuxtutorial/scripting.php)
