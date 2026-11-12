---
title: "Linux #3 — Pipes, redirection and search"
date: 2024-04-19
description: "stdout and stderr are separate · why the order of 2>&1 matters · grep versus find · counting with sort | uniq -c"
category: tutorial
updated: 2024-05
lang: en
group: linux-3
topic: Linux
tags: [linux, shell]
---

**Series** · [#1 The command line](../linux-1-command-line-en/) · [#2 Files and permissions](../linux-2-files-en/) · #3 Pipes and search · [#4 Processes](../linux-4-processes-en/) · [#5 Shell scripting](../linux-5-scripting-en/)

<mark class="blue">Individual Linux commands are simple. The power comes from **joining them**.</mark>

## stdin, stdout, stderr

Every command has three channels.

| name | number | what |
| --- | --- | --- |
| stdin (standard input) | 0 | input coming in |
| stdout (standard output) | 1 | normal output |
| stderr (standard error) | 2 | **error messages** |

Normal output and errors flow **separately**. <mark>That is why sending output to a file still leaves errors on your screen.</mark>

<figure>
<img src="/assets/fig/linux-streams.svg" alt="One input stream and two output streams, and a chain of commands joined by pipes" loading="lazy" />
<figcaption><b>One way in, two ways out.</b> Results leave on stdout and complaints leave on stderr, and they are separate channels &mdash; which is why sending output to a file still leaves the errors on your screen. A pipe wires one command&rsquo;s stdout into the next one&rsquo;s stdin, and that is the whole trick.</figcaption>
</figure>

## Redirection — sending output to a file

```bash
python train.py > out.log       # overwrite
python train.py >> out.log      # append
python train.py 2> err.log      # errors only
python train.py > all.log 2>&1  # both into one file
python train.py &> all.log      # same thing (bash only, shorter)
sort < names.txt                # take a file as input
```

`2>&1` means "send stderr (2) wherever stdout (1) is going".

> **Order matters.** `> all.log 2>&1` is right; `2>&1 > all.log` is not. The second form points stderr at stdout *while stdout is still the screen*, then redirects stdout alone — so errors stay on screen.

To throw output away, send it to `/dev/null`.

```bash
command > /dev/null 2>&1        # run silently
```

## Pipes — joining commands

`|` hands the stdout of one command to the stdin of the next.

```bash
ls | wc -l                      # how many files
cat train.log | grep Error      # only the error lines
ps aux | grep python            # which python jobs are running
du -sh * | sort -h | tail -5    # the five biggest folders
```

Pipes chain as far as you like, and each stage does one thing. Read it as a sentence: *measure sizes → sort them → keep the last five.*

## grep — finding text

```bash
grep "Error" train.log          # lines containing this
grep -i "error" train.log       # ignore case
grep -n "Error" train.log       # with line numbers
grep -c "Error" train.log       # just count them
grep -v "DEBUG" train.log       # lines *without* it
grep -r "TODO" src/             # search a whole tree
grep -A 3 -B 1 "Error" log      # 1 line before, 3 after
```

The two most useful in practice:

```bash
grep -rn "load_model" src/      # where is this function used
grep -v "^#" config.conf        # the config without its comments (^ is start of line, below)
```

## A little regular expression

`grep` takes patterns. These five cover most of what you need.

| symbol | means |
| --- | --- |
| `^` | start of line |
| `$` | end of line |
| `.` | any single character |
| `.*` | any run of characters |
| `[0-9]` | one digit |

```bash
grep "^epoch" train.log         # lines starting with epoch
grep "loss: 0\.[0-9]*" log      # loss: 0.xxx
```

A dot is special in a pattern, so to match a literal dot write `\.`.

## Filters worth knowing

| command | does |
| --- | --- |
| `wc -l` | count lines |
| `sort` | sort (`-n` numeric, `-h` human sizes, `-r` reverse) |
| `uniq` | drop **adjacent** duplicates (`-c` counts them) |
| `cut -d, -f2` | split on a delimiter, keep field n |
| `head` / `tail` | first / last n lines |
| `tr` | translate or delete characters |
| `sed 's/a/b/g'` | substitute |
| `awk '{print $1}'` | work column by column — `$1` is the first one |

> **`uniq` always follows `sort`.** It only compares neighbouring lines, so without sorting it misses duplicates that are far apart. `sort | uniq -c | sort -rn` is the standard way to count by frequency.

## Combinations you will actually use

```bash
# what values appear in column two of a CSV, and how often
cut -d, -f2 data.csv | sort | uniq -c | sort -rn

# count errors by kind
grep -i error train.log | cut -d: -f2 | sort | uniq -c

# the ten largest files and folders
du -ah . | sort -h | tail -10

# which GPU is free
nvidia-smi --query-gpu=index,memory.used --format=csv

# watch the log and save it at the same time
python train.py 2>&1 | tee train.log
```

That last one, `tee`, splits the pipe in two: to your screen and to a file. Useful for long runs.

## find — finding files

Where `grep` searches *inside* files, `find` searches *for* them.

```bash
find . -name "*.ckpt"                 # by name
find . -type d -name "logs"           # directories only
find . -size +1G                      # bigger than 1GB
find . -mtime -7                      # modified in the last week
find . -name "*.tmp" -delete          # find and remove
```

> Always run it **without** `-delete` first and read the list before adding it.

## Summary

- stdout (1) and stderr (2) are different channels — `2>&1` merges them
- `>` overwrites, `>>` appends, `|` passes along
- `grep` looks inside files, `find` looks for files
- `sort | uniq -c | sort -rn` counts by frequency
- `tee` lets you watch and save at once

Next: [processes and jobs](../linux-4-processes-en/) — how to leave a job running after you log out.

## References

- [grep(1)](https://man7.org/linux/man-pages/man1/grep.1.html)
- [Ryan's Linux Tutorial — Piping and Redirection](https://ryanstutorials.net/linuxtutorial/piping.php)
