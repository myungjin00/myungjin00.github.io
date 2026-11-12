---
title: "리눅스 #4 — 프로세스와 작업"
date: 2024-05-17
description: "포그라운드·백그라운드·분리의 차이 · tmux로 로그아웃을 견디기 · kill과 kill -9의 차이 · 공용 서버에서 다른 사람 프로세스를 죽이지 않는 법"
category: tutorial
updated: 2024-06
lang: ko
group: linux-4
topic: Linux
tags: [linux, shell]
---

**시리즈** · [#1 명령줄](../linux-1-command-line-ko/) · [#2 파일과 권한](../linux-2-files-ko/) · [#3 pipe와 검색](../linux-3-pipes-ko/) · #4 프로세스 · [#5 셸 스크립트](../linux-5-scripting-ko/)

학습 한 번에 여섯 시간이 걸리는데, 노트북을 닫으면 작업이 죽는다. 터미널 연결과 프로세스의 수명을 떼어 놓아야 한다.

## 프로세스 (process)란

실행 중인 프로그램 하나가 **프로세스** 하나다. 각각 고유한 번호 (**PID**, process ID)를 갖고, 누가 띄웠는지와 CPU·메모리를 얼마나 쓰는지가 기록된다.

```bash
ps                     # 지금 이 터미널의 프로세스
ps aux                 # 시스템 전체
ps aux | grep python   # 그중 파이썬만
pgrep -af train.py     # 이름으로 찾기 (PID와 명령줄까지)
```

`ps aux`의 열 중 실제로 보게 되는 것은 몇 개뿐이다.

| 열 | 뜻 |
| --- | --- |
| `USER` | 누가 띄웠나 |
| `PID` | 프로세스 번호 |
| `%CPU` `%MEM` | CPU·메모리 사용률 |
| `STAT` | 상태 (`R` 실행, `S` 대기, `Z` 좀비) |
| `COMMAND` | 실제 실행된 명령 |

실시간으로 보려면 `top`, 설치돼 있다면 `htop`이 훨씬 편하다(`q`로 나감). GPU는 따로 본다.

```bash
nvidia-smi                                          # 한 번
watch -n 1 nvidia-smi                               # 1초마다 갱신
nvidia-smi --query-gpu=index,memory.used,memory.total,utilization.gpu --format=csv
```

## 포그라운드 · 백그라운드 · 분리 (detached)

명령을 그냥 실행하면 **포그라운드** (foreground)에서 돈다. 터미널을 붙들고 있고, 터미널이 닫히면 같이 죽는다.

<figure>
<svg viewBox="0 0 540 210" role="img" aria-label="Three states: foreground holds the terminal, background releases it but still dies on logout, detached survives.">
  <g font-family="IBM Plex Mono, monospace" font-size="11">
    <text x="16" y="24" fill="#1E4A39">foreground</text>
    <text x="196" y="24" fill="#1E4A39">background</text>
    <text x="376" y="24" fill="#1E4A39">detached</text>
    <text x="16" y="180" fill="#6E7873">holds the terminal</text>
    <text x="196" y="180" fill="#6E7873">prompt comes back, but</text>
    <text x="196" y="196" fill="#6E7873">it dies when you log out</text>
    <text x="376" y="180" fill="#6E7873">survives logout</text>
  </g>
  <g fill="none" stroke="#D3D8CE">
    <rect x="16" y="36" width="150" height="124" rx="5"/>
    <rect x="196" y="36" width="150" height="124" rx="5"/>
    <rect x="376" y="36" width="148" height="124" rx="5"/>
  </g>
  <g font-family="IBM Plex Mono, monospace" font-size="10.5" fill="#46524D">
    <text x="30" y="62">$ python train.py</text>
    <text x="30" y="84">(waiting…)</text>
    <text x="210" y="62">$ python train.py &amp;</text>
    <text x="210" y="84">[1] 20481</text>
    <text x="210" y="100">$ _</text>
    <text x="390" y="62">$ tmux new -s run</text>
    <text x="390" y="84">$ python train.py</text>
    <text x="390" y="100">Ctrl-b d</text>
  </g>
  <g stroke-width="1.4" stroke-linecap="round">
    <line x1="30" y1="120" x2="152" y2="120" stroke="#C2703C"/>
    <line x1="210" y1="126" x2="332" y2="126" stroke="#C2703C"/>
    <line x1="390" y1="126" x2="510" y2="126" stroke="#1E4A39"/>
  </g>
  <g font-family="IBM Plex Mono, monospace" font-size="10" fill="#C2703C">
    <text x="30" y="140">✗ dies on logout</text>
    <text x="210" y="146">✗ dies on logout</text>
  </g>
  <text x="390" y="146" font-family="IBM Plex Mono, monospace" font-size="10" fill="#1E4A39">✓ keeps running</text>
</svg>
<figcaption><b>세 가지 상태.</b> <code>&amp;</code>만 붙이면 프롬프트는 돌려받지만 로그아웃을 견디지 못한다. 긴 학습에는 <code>tmux</code>가 답이다.</figcaption>
</figure>

```bash
python train.py &          # 백그라운드로 실행
jobs                       # 이 터미널의 백그라운드 작업 목록
fg %1                      # 1번을 포그라운드로
bg %1                      # 1번을 백그라운드에서 계속
```

이미 실행 중인 것을 백그라운드로 보내려면 `Ctrl + Z`로 **일시 정지** (suspend)한 뒤 `bg`로 다시 돌린다. `Ctrl + Z`만 누르고 두면 멈춘 채로 있으니 주의해야 한다.

## 접속을 끊어도 살아남게

### tmux (권장)

<mark class="blue">`tmux`는 끊어도 남아 있는 터미널 세션을 만든다. GPU 작업에는 사실상 필수다.</mark>

```bash
tmux new -s train          # 'train'이라는 세션 생성
# … 안에서 학습 실행 …
# Ctrl-b 를 누르고 손 뗀 다음 d  → 분리 (detach)

tmux ls                    # 세션 목록
tmux attach -t train       # 다시 붙기
tmux kill-session -t train # 세션 종료
```

`Ctrl-b`가 tmux의 prefix 키다. 눌렀다 뗀 다음 명령 키를 누른다.

| 키 | 하는 일 |
| --- | --- |
| `Ctrl-b` `d` | 분리 (작업은 계속 돎) |
| `Ctrl-b` `c` | 새 창 |
| `Ctrl-b` *숫자* | 그 창으로 이동 |
| `Ctrl-b` `[` | 스크롤 모드 (`q`로 나감) |

세션 이름은 작업과 맞춰두면 나중에 헷갈리지 않는다. 예: `tmux new -s phaseC_gpu1`.

### nohup

tmux가 없을 때 쓰는 간단한 방법이다.

```bash
nohup python train.py > train.log 2>&1 &
echo $!                    # 방금 띄운 것의 PID
```

**시그널** (signal)은 시스템이 실행 중인 프로세스에 보내는 짧은 신호이고, 종류마다 이름이 붙어 있다. `nohup`은 로그아웃 때 오는 시그널 (SIGHUP)을 무시하게 만든다. 출력은 반드시 파일로 돌려야 한다. 그렇지 않으면 `nohup.out`에 쌓인다.

tmux와 달리 **나중에 그 화면으로 돌아갈 수 없다.** 로그 파일로만 확인한다.

```bash
tail -f train.log
```

## 종료하기 (kill)

```bash
kill 20481                 # 정중히 종료 요청 (SIGTERM)
kill -9 20481              # 강제 종료 (SIGKILL) — 최후의 수단
pgrep -u "$USER" -f train.py   # 내 PID만 먼저 찾고, 그 PID를 kill한다
```

`kill`은 기본적으로 **SIGTERM**을 보낸다. 프로그램이 받아서 정리하고 끝낼 기회를 준다. 체크포인트 저장이나 파일 정리가 여기서 일어난다.

`kill -9`는 **SIGKILL**이라 프로그램이 받을 수 없다. 즉시 죽고, 쓰던 파일은 망가질 수 있다. **먼저 `kill`을 쓰고, 몇 초 기다려도 안 죽을 때만 `-9`를 쓴다.**

> **공용 서버에서 꼭 지킬 것**
>
> 1. **내가 띄운 것만 종료한다.** 종료 전에 반드시 확인한다.
>    ```bash
>    ps -o user,pid,cmd -p 20481
>    ```
>    `USER`가 내가 맞는지 보고, `cmd`가 내가 띄운 그 명령인지 본다.
> 2. <mark>**`pkill -f python` 같은 건 절대 쓰지 않는다.** 다른 사람이 돌리던 학습까지 전부 죽는다.</mark> 이름이 아니라 **PID로** 지정하는 습관을 들인다.

## 디스크·메모리·GPU 확인

큰 작업을 띄우기 전에 세 가지를 본다.

```bash
df -h .                    # 현재 파일시스템의 디스크 여유
free -h                    # 메모리 (available 열을 봄)
nvidia-smi                 # GPU 메모리와 사용률
```

`free -h`에서 `free` 열이 작아 보여도 보통 문제없다. 리눅스는 남는 메모리를 캐시로 쓰기 때문이다. **`available` 열**이 실제로 쓸 수 있는 양이다.

`nvidia-smi`에서 빈 GPU는 memory.used가 0에 가깝고 아래 프로세스 목록에도 아무것도 없는 것이다. 사용률만 보면 남의 모델을 물고 있는 GPU도 0%로 보일 수 있다. 빈 GPU를 확인하고 나면 쓸 것만 지정해서 띄운다.

```bash
CUDA_VISIBLE_DEVICES=1 python train.py
```

## 정리

- `ps aux | grep`, `pgrep -af`로 찾고 `htop`으로 지켜본다
- `&`는 프롬프트만 돌려줄 뿐, 로그아웃은 못 견딘다
- 긴 작업은 **tmux**, 간단하면 `nohup … &`
- `kill` 먼저, `kill -9`는 최후에
- 종료 전에 `ps -o user,pid,cmd -p PID`로 내 것인지 확인
- 띄우기 전에 `df -h` · `free -h` · `nvidia-smi`

다음 편은 [이 모든 걸 스크립트 하나로 만드는 법](../linux-5-scripting-ko/)이다.

## 참고

- [ps(1)](https://man7.org/linux/man-pages/man1/ps.1.html) · [kill(1)](https://man7.org/linux/man-pages/man1/kill.1.html) · [signal(7)](https://man7.org/linux/man-pages/man7/signal.7.html)
- [tmux 사용법](https://github.com/tmux/tmux/wiki/Getting-Started)
- [Ryan's Linux Tutorial — Process Management](https://ryanstutorials.net/linuxtutorial/processes.php)
