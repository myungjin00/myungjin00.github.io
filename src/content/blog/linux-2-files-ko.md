---
title: "리눅스 #2 — 파일과 권한"
date: 2024-03-29
description: "mkdir -p·cp -r·mv·rm · wildcard를 rm 전에 ls로 확인하기 · rwx와 644·755·600 · 공용 서버에서 지킬 것"
category: tutorial
updated: 2024-04
lang: ko
group: linux-2
topic: Linux
tags: [linux, shell]
---

**시리즈** · [#1 명령줄](../linux-1-command-line-ko/) · #2 파일과 권한 · [#3 pipe와 검색](../linux-3-pipes-ko/) · [#4 프로세스](../linux-4-processes-ko/) · [#5 셸 스크립트](../linux-5-scripting-ko/)

## 만들기

```bash
mkdir results                  # 디렉터리 하나
mkdir -p runs/exp1/logs        # 중간 경로까지 한 번에
touch notes.txt                # 빈 파일 (이미 있으면 시각만 갱신)
```

`-p`가 없으면 두 번째 명령은 `runs`가 미리 없을 때 실패한다. 스크립트에서는 거의 항상 `mkdir -p`를 쓴다. 이미 있어도 오류를 내지 않기 때문이다.

## 복사·이동·삭제

```bash
cp a.txt b.txt                 # 복사
cp -r data/ backup/            # 디렉터리는 -r (재귀, recursive)
cp -a data/ backup/            # 권한·시각까지 그대로

mv old.txt new.txt             # 이름 바꾸기
mv report.pdf ~/papers/        # 옮기기

rm temp.txt                    # 삭제
rm -r old_runs/                # 디렉터리 삭제
```

리눅스에는 **이름 바꾸기 명령이 따로 없다.** `mv`가 둘 다 한다. 같은 디렉터리 안에서 옮기면 그게 이름 변경이다.

> <mark class="blue">**`rm`에는 휴지통이 없다.** 지우면 끝이다.</mark> 몸에 익혀둘 습관 두 가지:
>
> ```bash
> ls old_runs/                 # 1. 지우기 전에 무엇인지 본다
> rm -ri old_runs/             # 2. -i 로 하나씩 확인받는다
> ```
>
> `rm -rf`는 확인도 없고 오류도 무시한다. 특히 **변수와 같이 쓸 때** 위험하다. `rm -rf $DIR/`에서 `DIR`이 비어 있으면 `rm -rf /`가 된다.

## wildcard

셸이 명령을 실행하기 **전에** 패턴을 실제 파일 이름들로 펼쳐준다.

| 패턴 | 맞는 것 |
| --- | --- |
| `*` | 아무 글자 몇 개든 (0개 포함) |
| `?` | 아무 글자 **하나** |
| `[abc]` | 괄호 안의 글자 하나 |
| `[0-9]` | 숫자 하나 |
| `{a,b}` | a 또는 b로 각각 펼침 |

```bash
ls *.csv                       # csv 전부
ls data_?.csv                  # data_1.csv, data_a.csv …
ls run_[1-3].log               # run_1 run_2 run_3
cp exp_{train,test}.json ~/    # 두 파일을 한 번에
```

> **지우기 전에 확인하는 법.** 같은 패턴을 `rm` 대신 `ls`에 먼저 넣어 본다. 목록이 생각과 같으면 그때 `rm`으로 바꾼다. 이 한 단계가 사고를 막아준다.

## 권한 (permission) 읽기

`ls -l`의 첫 열이 권한이다. 공용 장비에서는 남의 파일이 왜 안 열리는지, 방금 쓴 스크립트가 왜 실행되지 않는지를 설명해 주는 열이다.

```
-rw-r--r--  1 user  lab  4096 Nov 11 18:00 notes.txt
drwxr-xr-x  2 user  lab  4096 Nov 11 18:00 results/
```

맨 앞 10글자를 네 덩어리로 끊어 읽는다.

```
 d  rwx  r-x  r-x
 │   │    │    │
 │   │    │    └── 그 외 모든 사람 (others)
 │   │    └─────── 같은 그룹 (group)
 │   └──────────── 소유자 (user)
 └──────────────── 종류: - 파일, d 디렉터리, l 링크
```

| 글자 | 파일에서 | 디렉터리에서 |
| --- | --- | --- |
| `r` | 내용을 읽을 수 있다 | 목록을 볼 수 있다 |
| `w` | 내용을 고칠 수 있다 | **안의 파일을 만들거나 지울 수 있다** |
| `x` | 실행할 수 있다 | 안으로 들어갈 수 있다 |

디렉터리의 `w`가 특히 중요하다. 파일 자체가 읽기 전용이어도, <mark>그 파일이 든 디렉터리에 쓰기 권한이 있으면 파일을 지울 수 있다.</mark>

<figure>
<img src="/assets/fig/linux-permissions.svg" alt="The ten permission characters split into type, user, group and other, with their octal values" loading="lazy" />
<figcaption><b>열 글자 읽는 법.</b> 맨 앞 하나가 종류, 그다음 세 글자씩 셋 &mdash; 나, 내 그룹, 나머지 전부. 각 세 글자는 읽기 4 + 쓰기 2 + 실행 1로 읽고, <code>754</code>가 거기서 나온다. 디렉터리에서는 글자의 뜻이 달라진다. <code>x</code>는 들어갈 수 있다는 뜻이고, 안의 파일을 지울 수 있게 하는 것은 디렉터리의 <code>w</code>다.</figcaption>
</figure>

## 권한 바꾸기

**기호로** — 누구에게(`u` 소유자, `g` 그룹, `o` 나머지, `a` 셋 다), 어떻게(`+` `-` `=`), 무엇을(`r` `w` `x`).

```bash
chmod +x run.sh                # 실행 권한 주기 (가장 자주 씀)
chmod u+w notes.txt            # 소유자에게 쓰기
chmod go-w shared/             # 그룹과 그 외 사용자의 쓰기 권한 회수
```

**숫자로** — 세 자리로 한 번에 지정한다.

| 숫자 | 뜻 | |
| --- | --- | --- |
| `4` | 읽기 | r |
| `2` | 쓰기 | w |
| `1` | 실행 | x |

더해서 쓴다. `7 = 4+2+1 = rwx`, `6 = 4+2 = rw-`, `5 = 4+1 = r-x`.

| 명령 | 결과 | 쓰는 곳 |
| --- | --- | --- |
| `chmod 644 file` | `rw-r--r--` | 보통 파일 |
| `chmod 755 dir` | `rwxr-xr-x` | 디렉터리, 스크립트 |
| `chmod 600 key` | `rw-------` | 비밀 파일·SSH (secure shell) 키 |
| `chmod 700 private/` | `rwx------` | 나만 쓰는 폴더 |

`-R`을 붙이면 안쪽까지 전부 적용된다. **공용 서버에서는 조심해서 쓴다.**

```bash
chmod -R 755 scripts/
```

## 소유자 바꾸기

```bash
chown user file.txt         # 소유자
chown user:lab file.txt     # 소유자:그룹
```

보통 뒤에 오는 명령 하나를 root 권한으로 실행하는 `sudo`가 필요하다. 공용 서버에서는 <mark>**다른 사람 파일의 소유자를 바꾸지 않는다.**</mark>

## 공용 서버에서 지킬 것

연구실 서버는 여러 사람이 같이 쓴다.

- **내 것만 건드린다.** 다른 사람 디렉터리에 `chmod -R`을 돌리지 않는다.
- **공유 데이터는 읽기 전용으로.** 같이 쓰는 데이터셋은 `644`나 `444`로 두면 실수로 덮어쓰는 일을 막는다.
- **SSH 키는 `600`.** 더 열려 있으면 SSH가 아예 거부한다.
- **지우기 전에 `ls`.** 특히 wildcard와 변수를 쓸 때.

## 디스크 공간

```bash
df -h /data                   # 파티션에 얼마나 남았나
du -sh results/                # 이 폴더가 얼마나 차지하나
du -sh * | sort -hr            # 큰 것부터 (-h는 사람이 읽는 크기, -r은 내림차순)
```

학습 산출물이 쌓이면 금방 찬다. 큰 실험을 돌리기 전에 `df -h`로 한 번 보는 습관이 좋다.

## 정리

- `mkdir -p`, `cp -r`, `mv`(이동 겸 이름 변경), `rm`(되돌릴 수 없음)
- wildcard는 셸이 먼저 펼친다 — `rm` 전에 `ls`로 확인
- 권한은 `소유자 / 그룹 / 그 외` × `r w x`
- 디렉터리의 `w`는 "안의 파일을 지울 수 있다"는 뜻
- `644` 파일, `755` 디렉터리와 스크립트, `600` 키

다음 편은 [명령을 서로 연결하고 원하는 것을 찾아내는 법](../linux-3-pipes-ko/)이다.

## 참고

- [chmod(1) 매뉴얼](https://man7.org/linux/man-pages/man1/chmod.1.html)
- [Ryan's Linux Tutorial — Permissions](https://ryanstutorials.net/linuxtutorial/permissions.php)
