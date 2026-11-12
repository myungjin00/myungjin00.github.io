---
title: "Linux #5 — Shell scripting"
date: 2024-06-14
description: "Why set -euo pipefail belongs on line one · why variables need quotes · spaces inside [ ] and the comparison operators · arguments and exit codes"
category: tutorial
updated: 2024-07
lang: en
group: linux-5
topic: Linux
tags: [linux, bash, shell]
---

**Series** · [#1 The command line](../linux-1-command-line-en/) · [#2 Files and permissions](../linux-2-files-en/) · [#3 Pipes and search](../linux-3-pipes-en/) · [#4 Processes](../linux-4-processes-en/) · #5 Shell scripting

<mark class="blue">Once you have typed the same thing three times, write a script.</mark>

## A first script

```bash
nano run.sh                 # any editor will do
```

```bash
#!/bin/bash
echo "started: $(date)"
python train.py --epochs 100
echo "finished: $(date)"
```

```bash
chmod +x run.sh            # executable, once
./run.sh
```

The first line is the **shebang**: `#!` followed by the absolute path to the interpreter. Every other line starting with `#` is a comment.

Linux has several shells — `sh` (Bourne), `ksh` (Korn), `bash` (Bourne-Again) — and **bash** is the default on most distributions. On Debian and Ubuntu `/bin/sh` is `dash`, which rejects bash-only syntax, so write `#!/bin/bash` rather than `#!/bin/sh` when you use bash features.

## One line to put at the top

```bash
#!/bin/bash
set -euo pipefail
```

| option | effect |
| --- | --- |
| `-e` | stop at the first command that fails |
| `-u` | an unset variable is an error (catches typos) |
| `-o pipefail` | a pipeline fails if **any** stage fails |

Without `-e`, a script whose preprocessing step failed will happily run everything after it on a missing file.

## Variables

No type declarations, and **no spaces** around `=`.

```bash
name="run"
epochs=100
out="results/${name}_${epochs}"
echo "$out"
```

There are two kinds.

- **Environment variables** — set by the system, conventionally uppercase. List them with `printenv`. `HOME`, `PATH` (the directories the shell searches for programs), `CUDA_VISIBLE_DEVICES`.
- **User variables** — yours, and they live only as long as the script runs unless you `export` them.

> <mark>**Always quote variables when reading them.**</mark> `"$path"` survives spaces in the value; `$path` splits apart. This is where accidents with file paths happen.

### Capturing command output

```bash
today=$(date +%F)          # preferred
files=`ls | wc -l`         # the older backtick form
```

`$( )` nests and reads more easily, so use it.

### Arithmetic

```bash
i=$((i + 1))
total=$(( epochs * 3 ))
```

Older scripts use `` i=`expr $i + 1` ``. `$(( ))` is built into the shell, spawns no process, and handles spacing sanely.

## Comparison operators

Conditions go inside `[ ]` (the `test` builtin) or `[[ ]]` (a bash keyword with more features). **Spaces are required** after `[` and before `]` — with `a=1`, `[$a -eq $b]` makes the shell look for a command named `[1`.

| integers | | strings | | files | |
| --- | --- | --- | --- | --- | --- |
| `-eq` | equal | `=` | equal | `-e` | exists |
| `-ne` | not equal | `!=` | not equal | `-f` | is a regular file |
| `-lt` | less than | `-z` | length is zero | `-d` | is a directory |
| `-le` | less or equal | `-n` | length is non-zero | `-s` | is not empty |
| `-gt` | greater than | `\<` | sorts before | `-r` `-w` `-x` | readable, writable, executable |
| `-ge` | greater or equal | `\>` | sorts after | | |

> **Two details often got wrong.**
> The manual states that "`=` should be used with the `test` command for POSIX conformance" — POSIX (portable operating system interface) being the standard every Unix shell is expected to follow. `==` works in bash but breaks under `sh`.
> And `\<` `\>` sort **lexicographically**, not "in ASCII order" — the real order follows the locale. They need escaping inside `[ ]` and not inside `[[ ]]`.

## Conditionals

```bash
if [ "$epochs" -gt 50 ]; then
    echo "long run"
elif [ "$epochs" -eq 0 ]; then
    echo "no training"
else
    echo "short run"
fi
```

`fi` closes it. To match one value against several patterns, `case` is cleaner.

```bash
case "$1" in
    train)  python train.py ;;
    eval)   python eval.py ;;
    *)      echo "usage: $0 {train|eval}"; exit 1 ;;
esac
```

Each branch ends with `;;` and `*)` catches everything else. With no match and no `*)`, the exit status of `case` is 0.

## Loops

```bash
# for — over a list
for seed in 42 43 44; do
    python train.py --seed "$seed"
done

# for — over files
for f in data/*.csv; do
    echo "processing $f"
done

# while — while the condition holds
i=1
while [ "$i" -le 5 ]; do
    echo "iteration $i"
    i=$((i + 1))
done

# until — while the condition is false (the inverse of while)
until [ -f results/done.flag ]; do
    sleep 10
done
```

`break` leaves the loop; `continue` skips the rest of the body and moves on.

| | `break` | `continue` |
| --- | --- | --- |
| control goes to | the first line after `done` | the top of the loop, next value |
| typical use | you found what you wanted | this item should be skipped |

## Taking arguments

| | |
| --- | --- |
| `$0` | the script's name |
| `$1` … `$9` | the first nine arguments |
| `${10}` | beyond nine, braces are required |
| `$#` | how many were passed |
| `$@` | all of them, as separate words |

```bash
#!/bin/bash
set -euo pipefail

if [ "$#" -lt 2 ]; then
    echo "usage: $0 <config> <gpu>" >&2
    exit 1
fi

config="$1"
gpu="$2"
CUDA_VISIBLE_DEVICES="$gpu" python train.py --config "$config"
```

When passing arguments on to another command, use **`"$@"`** rather than `"$*"`: it keeps the boundaries between them.

## Exit codes

Commands return a number when they finish, between **0 and 255**, where **0 means success**. The manual's reasoning: there is one well-defined way to succeed and many ways to fail.

```bash
grep -q "Error" train.log  # -q: print nothing, just set the exit code
echo "$?"                  # exit code of the last command
```

You rarely need `$?` directly, because `if` already tests the status:

```bash
if grep -q "Error" train.log; then
    echo "found an error"
fi
```

Set your own script's status with `exit`:

```bash
exit 0    # success
exit 1    # failure
```

Two values worth knowing: bash returns **128 + N** when a command is killed by signal N (Ctrl-C is SIGINT = 2, so 130), and 127 means *command not found*.

## What one really looks like

```bash
#!/bin/bash
# train three seeds and keep the logs
set -euo pipefail

CONFIG="${1:-configs/default.yaml}"     # fall back when no argument is given
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

echo "done: $OUT"
```

`${1:-default}` means "use this when the argument is missing" — which is what makes `set -u` safe to keep on.

## Summary

- Start with `#!/bin/bash` and `set -euo pipefail`
- No spaces around `=`, and always read variables as `"$quoted"`
- Spaces inside `[ ]`; `-eq` for integers, `=` for strings
- `for`, `while`, `until`, plus `break` and `continue`
- Pass arguments with `"$@"` and report success with `exit 0`

## References

- [GNU Bash Reference Manual](https://www.gnu.org/software/bash/manual/)
- [Bash Conditional Expressions](https://www.gnu.org/software/bash/manual/html_node/Bash-Conditional-Expressions.html) · [Exit Status](https://www.gnu.org/software/bash/manual/html_node/Exit-Status.html)
- [Ryan's Linux Tutorial — Scripting](https://ryanstutorials.net/linuxtutorial/scripting.php)
