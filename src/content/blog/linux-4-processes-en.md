---
title: "Linux #4 — Processes and jobs"
date: 2024-05-17
description: "Foreground, background and detached · surviving logout with tmux · kill versus kill -9 · how not to kill someone else's job"
category: tutorial
updated: 2024-06
lang: en
group: linux-4
topic: Linux
tags: [linux, shell]
---

**Series** · [#1 The command line](../linux-1-command-line-en/) · [#2 Files and permissions](../linux-2-files-en/) · [#3 Pipes and search](../linux-3-pipes-en/) · #4 Processes · [#5 Shell scripting](../linux-5-scripting-en/)

A training run takes six hours and closing your laptop kills it. The process has to outlive the terminal it was started from.

## What a process is

One running program is one **process**. Each has a number (**PID**, process ID), an owner, and a record of how much CPU and memory it is using.

```bash
ps                     # processes in this terminal
ps aux                 # everything on the system
ps aux | grep python   # just the python ones
pgrep -af train.py     # find by name, with PID and command line
```

Only a few columns of `ps aux` matter day to day.

| column | meaning |
| --- | --- |
| `USER` | who started it |
| `PID` | process number |
| `%CPU` `%MEM` | CPU and memory use |
| `STAT` | state (`R` running, `S` sleeping, `Z` zombie) |
| `COMMAND` | what was actually run |

For a live view use `top`, or `htop` if it is installed (`q` to quit). GPUs are separate:

```bash
nvidia-smi                                          # once
watch -n 1 nvidia-smi                               # refresh every second
nvidia-smi --query-gpu=index,memory.used,memory.total,utilization.gpu --format=csv
```

## Foreground, background, detached

Run a command plainly and it stays in the **foreground**: it holds your terminal, and it dies when the terminal closes.

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
<figcaption><b>Three states.</b> Adding <code>&amp;</code> gives you the prompt back but does not survive a logout. For a long run, <code>tmux</code> is the answer.</figcaption>
</figure>

```bash
python train.py &          # run in the background
jobs                       # background jobs of this terminal
fg %1                      # bring job 1 to the foreground
bg %1                      # let job 1 continue in the background
```

To background something already running, press `Ctrl + Z` to **suspend** it, then `bg` to let it continue. Pressing `Ctrl + Z` and walking away leaves it stopped, so remember the second step.

## Surviving a disconnect

### tmux (recommended)

<mark class="blue">`tmux` gives you a terminal session that outlives your connection. For GPU work it is effectively required.</mark>

```bash
tmux new -s train          # start a session called 'train'
# … run your job inside it …
# press Ctrl-b, release, then d  → detach

tmux ls                    # list sessions
tmux attach -t train       # go back in
tmux kill-session -t train # end it
```

`Ctrl-b` is tmux's prefix key: press and release it, then press the command key.

| keys | does |
| --- | --- |
| `Ctrl-b` `d` | detach (the job keeps running) |
| `Ctrl-b` `c` | new window |
| `Ctrl-b` *number* | go to that window |
| `Ctrl-b` `[` | scroll mode (`q` to exit) |

Name sessions after the work so you can tell them apart later, e.g. `tmux new -s phaseC_gpu1`.

### nohup

The simple alternative when tmux is not available.

```bash
nohup python train.py > train.log 2>&1 &
echo $!                    # the PID of what you just started
```

A **signal** is a short message the system delivers to a running process, and each kind has a name. `nohup` makes the job ignore the one sent on logout (SIGHUP). Always redirect the output to a file, or it piles up in `nohup.out`.

Unlike tmux, **you cannot get the screen back.** You read the log file instead:

```bash
tail -f train.log
```

## Stopping things

```bash
kill 20481                 # ask it to stop (SIGTERM)
kill -9 20481              # force it (SIGKILL) — last resort
pgrep -u "$USER" -f train.py   # find your own PIDs first, then kill those
```

`kill` sends **SIGTERM** by default. The program receives it and gets a chance to clean up — saving a checkpoint, closing files.

`kill -9` sends **SIGKILL**, which a program cannot catch. It dies instantly and whatever it was writing may be corrupt. **Try `kill` first, wait a few seconds, and only then use `-9`.**

> **On a shared server**
>
> 1. **Kill only your own.** Check before you do:
>    ```bash
>    ps -o user,pid,cmd -p 20481
>    ```
>    Confirm `USER` is you and `cmd` is the command you started.
> 2. <mark>**Never run anything like `pkill -f python`.** It takes out everyone else's training too.</mark> Target a **PID**, not a name.

## Checking disk, memory and GPU

Before launching anything large, look at three things.

```bash
df -h .                    # disk space on the current filesystem
free -h                    # memory (read the available column)
nvidia-smi                 # GPU memory and utilisation
```

In `free -h`, a small `free` column is usually fine: Linux uses spare memory as cache. The **`available`** column is what you can actually use.

In `nvidia-smi`, a free GPU is one with near-zero memory used and nothing in the process list at the bottom — utilisation alone can read 0% on a GPU that is still holding someone's model. Once you know which one is free, pin the job to it:

```bash
CUDA_VISIBLE_DEVICES=1 python train.py
```

## Summary

- Find with `ps aux | grep` or `pgrep -af`, watch with `htop`
- `&` returns the prompt but does not survive logout
- Long jobs go in **tmux**; `nohup … &` for something simple
- `kill` first, `kill -9` last
- Confirm ownership with `ps -o user,pid,cmd -p PID` before killing
- Check `df -h`, `free -h` and `nvidia-smi` before you launch

Next: [tying all of this into a script](../linux-5-scripting-en/).

## References

- [ps(1)](https://man7.org/linux/man-pages/man1/ps.1.html) · [kill(1)](https://man7.org/linux/man-pages/man1/kill.1.html) · [signal(7)](https://man7.org/linux/man-pages/man7/signal.7.html)
- [Getting started with tmux](https://github.com/tmux/tmux/wiki/Getting-Started)
- [Ryan's Linux Tutorial — Process Management](https://ryanstutorials.net/linuxtutorial/processes.php)
