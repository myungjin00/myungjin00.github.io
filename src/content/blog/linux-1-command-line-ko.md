---
title: "리눅스 #1 — 명령줄과 경로 찾기"
date: 2024-03-08
description: "프롬프트 읽는 법 · 절대 경로와 상대 경로 · ls·less·tail -f로 들여다보기 · Tab과 Ctrl+R로 타이핑 줄이기"
category: tutorial
updated: 2024-03
lang: ko
group: linux-1
topic: Linux
tags: [linux, shell]
---

연구실 서버에 처음 접속하면 검은 화면에 커서만 깜빡인다. 이 시리즈는 거기서부터 시작해 실제로 작업할 수 있는 지점까지 간다.

**시리즈** · #1 명령줄 · [#2 파일과 권한](../linux-2-files-ko/) · [#3 pipe와 검색](../linux-3-pipes-ko/) · [#4 프로세스](../linux-4-processes-ko/) · [#5 셸 스크립트](../linux-5-scripting-ko/)

## 셸이란

**셸** (shell)은 입력한 글자를 운영체제가 할 일로 바꿔주는 프로그램이다. 창과 아이콘 대신 글로 지시하는 인터페이스라고 보면 된다. 셸이 돌아가는 창이 **터미널** (terminal)이고, 두 말은 서로 섞여 쓰인다.

GUI (graphical user interface)를 대신하는 게 아니라 다른 도구다. 파일 하나 여는 건 마우스가 빠르지만, <mark class="blue">**같은 일을 3,000개 파일에 반복**하는 건 셸이 압도적으로 빠르다. 연구실에서 셸을 쓰는 이유가 바로 이것이다.</mark>

대부분의 리눅스 배포판에서 기본 셸은 **bash**이다. 지금 무엇을 쓰는지는 이렇게 확인한다.

```bash
echo $SHELL
```

## 프롬프트 읽기

접속하면 이런 줄이 보인다.

```
user@server:~$
```

| 부분 | 뜻 |
| --- | --- |
| `user` | 로그인한 사용자 |
| `server` | 접속해 있는 컴퓨터 이름 |
| `~` | **지금 있는 위치** (물결표는 홈 디렉터리) |
| `$` | 여기부터 명령을 입력하라는 표시 |

`$`가 아니라 `#`이면 관리자 (root) 계정이다. 이 계정은 장비의 어떤 파일이든 덮어쓸 수 있다. 공용 서버에서 `#`가 보인다면 무엇을 하는지 확실히 알고 있어야 한다.

## 명령의 생김새

명령은 세 부분으로 되어 있고, 사이는 공백으로 구분한다.

```
ls -l /data/projects
│  │   └── 인자 (무엇에 대해)
│  └────── 옵션 (어떻게)
└───────── 명령 (무엇을)
```

- 옵션은 보통 `-l`처럼 짧은 형태와 `--long`처럼 긴 형태가 둘 다 있다.
- 짧은 옵션은 붙여 쓸 수 있다. `ls -l -a`는 `ls -la`와 같다.
- **리눅스는 대소문자를 구분한다.** `Data`와 `data`는 다른 파일이다.

## 경로 (path)

파일 시스템은 하나의 트리 구조다. 꼭대기는 `/` (루트) 하나뿐이고, 윈도우처럼 드라이브가 여러 개로 나뉘지 않는다.

```
/
├── home/user        ← 개인 홈
├── data/projects    ← 연구 데이터
└── usr/bin          ← 설치된 프로그램
```

경로를 쓰는 방법은 두 가지다.

**절대 경로 (absolute path)** — `/`에서 시작한다. 내가 어디에 있든 항상 같은 곳을 가리킨다.

```bash
/data/projects/molecules/zinc250k.csv
```

**상대 경로 (relative path)** — 지금 위치에서 출발한다.

```bash
data/zinc250k.csv      # 현재 위치 아래의 data 폴더
../other_project       # 한 단계 위로 갔다가 옆으로
./run.sh               # 현재 위치의 run.sh
```

| 기호 | 뜻 |
| --- | --- |
| `.` | 지금 이 디렉터리 |
| `..` | 한 단계 위 |
| `~` | 내 홈 디렉터리 |
| `-` | **직전에 있던 곳** (`cd -`로 왔다 갔다) |

> 스크립트에는 절대 경로를, 터미널에서 손으로 칠 때는 상대 경로를 쓰는 편이 안전하다. 스크립트는 어디서 실행될지 모르기 때문이다.

<figure>
<img src="/assets/fig/linux-tree.svg" alt="The Linux filesystem as one tree, with an absolute and a relative path to the same file" loading="lazy" />
<figcaption><b>하나의 트리, 하나의 루트.</b> 모든 것이 <code>/</code> 아래 달려 있고 두 번째 드라이브 문자 같은 건 없다. 같은 파일에 이름이 두 개다. 어디서든 통하는 절대 경로와, 지금 서 있는 위치에 따라 달라지는 상대 경로.</figcaption>
</figure>

## 돌아다니기

```bash
pwd                    # 지금 어디인가 (print working directory)
ls                     # 여기 뭐가 있나
cd /data/projects      # 저기로 이동
cd ..                  # 한 단계 위로
cd                     # 홈으로 (인자 없이)
cd -                   # 직전 위치로
```

`ls`는 옵션에 따라 많이 달라진다.

| 명령 | 보여주는 것 |
| --- | --- |
| `ls` | 이름만 |
| `ls -l` | 한 줄에 하나씩, 권한·크기·날짜까지 |
| `ls -a` | 숨김 파일(`.`으로 시작)까지 |
| `ls -lh` | 크기를 `4.0K`, `1.2G`처럼 읽기 쉽게 |
| `ls -lt` | 최근 수정 순 |
| `ls -lS` | 큰 파일 순 |

`ls -lah`는 위 세 옵션을 한 번에 켠다.

## 파일 들여다보기

```bash
cat config.yaml        # 전체를 쏟아냄 — 짧은 파일에만
less train.log         # 넘겨 보기 (q로 나감, / 로 검색)
head -n 20 data.csv    # 앞 20줄
tail -n 20 data.csv    # 뒤 20줄
tail -f train.log      # 뒤를 계속 지켜봄 — 학습 로그 볼 때
wc -l data.csv         # 줄 수 세기
```

`tail -f`는 학습이 도는 동안 로그가 쌓이는 걸 실시간으로 보여준다. 멈추려면 `Ctrl + C`.

> **주의.** 수십 GB짜리 파일에 `cat`을 쓰면 터미널이 멈춘다. 크기를 모르면 `ls -lh`로 먼저 확인하고, `head`나 `less`로 연다.

## 타이핑을 줄이는 습관

| 키 | 하는 일 |
| --- | --- |
| `Tab` | **이름을 자동으로 완성한다** |
| `Tab` 두 번 | 가능한 후보 전부 보기 |
| `↑` `↓` | 이전 명령 꺼내기 |
| `Ctrl + R` | 과거 명령 검색 |
| `Ctrl + C` | 지금 실행 중인 명령 중단 |
| `Ctrl + L` | 화면 정리 (`clear`와 같음) |
| `Ctrl + A` / `Ctrl + E` | 줄의 맨 앞 / 맨 끝으로 |

`Tab`을 쓰면 오타가 줄고 경로를 외울 필요도 없어진다. 긴 경로는 전부 치지 말고 앞 몇 글자만 치고 `Tab`을 누른다.

## 모르는 명령 찾기

```bash
man ls                 # 설명서 (q로 나감)
ls --help              # 짧은 요약
which python           # 이 명령이 실제로 어디 있는지
type cd                # 내장 명령인지 프로그램인지
```

`man` 안에서는 `/검색어`로 찾고 `n`으로 다음 결과로 넘어간다. 설명서가 길어 보여도 보통 **OPTIONS**와 맨 아래 **EXAMPLES**만 보면 된다.

## 정리

- 프롬프트는 "누가, 어디서" 작업 중인지 알려준다
- 경로는 절대(`/`에서 시작)와 상대(지금 위치에서) 두 가지
- `pwd` `ls` `cd`로 돌아다니고, `less`와 `tail -f`로 들여다본다
- `Tab`과 `Ctrl + R`로 타이핑이 절반으로 줄어든다
- 막히면 `man`

다음 편은 [파일을 만들고 옮기고 지우는 법, 그리고 권한](../linux-2-files-ko/)이다.

## 참고

- [GNU Bash Reference Manual](https://www.gnu.org/software/bash/manual/)
- [Ryan's Linux Tutorial](https://ryanstutorials.net/linuxtutorial/) — 연습 문제가 잘 되어 있다
- [GeeksforGeeks Linux Tutorial](https://www.geeksforgeeks.org/linux-unix/linux-tutorial/)
