---
title: "Linux #1 — The command line"
date: 2024-03-08
description: "Reading the prompt · absolute versus relative paths · looking at files with ls, less and tail -f · typing less with Tab and Ctrl+R"
category: tutorial
updated: 2024-03
lang: en
group: linux-1
topic: Linux
tags: [linux, shell]
---

The first time you log into the lab server you get a black screen and a blinking cursor. This series starts there and gets you to the point where you can actually work.

**Series** · #1 The command line · [#2 Files and permissions](../linux-2-files-en/) · [#3 Pipes and search](../linux-3-pipes-en/) · [#4 Processes](../linux-4-processes-en/) · [#5 Shell scripting](../linux-5-scripting-en/)

## What the shell is

The **shell** turns what you type into work the operating system does. It is an interface made of words instead of windows and icons. The **terminal** is the window the shell runs in; the two words get used for each other constantly.

It does not replace the GUI (graphical user interface); it is a different tool. Opening one file is faster with a mouse. <mark class="blue">Doing the same thing to **3,000 files** is where the shell wins outright, and that is why we use it.</mark>

On most distributions the default shell is **bash**. To see what you are running:

```bash
echo $SHELL
```

## Reading the prompt

```
user@server:~$
```

| part | meaning |
| --- | --- |
| `user` | who you are logged in as |
| `server` | which machine you are on |
| `~` | **where you are** (tilde means your home directory) |
| `$` | type your command after this |

A `#` instead of `$` means you are root — the administrator account, which can overwrite anything on the machine. On a shared server, if you see `#`, be certain you know what you are doing.

## The shape of a command

Commands have three parts, separated by spaces.

```
ls -l /data/projects
│  │   └── argument (what to act on)
│  └────── option (how)
└───────── command (what)
```

- Options usually come in a short form (`-l`) and a long one (`--long`).
- Short options can be bundled: `ls -l -a` is `ls -la`.
- **Linux is case-sensitive.** `Data` and `data` are different files.

## Paths

The file system is one tree. There is a single top, `/` (root) — no separate drive letters.

```
/
├── home/user        ← your home
├── data/projects    ← research data
└── usr/bin          ← installed programs
```

There are two ways to name a location.

**Absolute** — starts at `/`, and always means the same place.

```bash
/data/projects/molecules/zinc250k.csv
```

**Relative** — starts from wherever you are.

```bash
data/zinc250k.csv      # the data folder below you
../other_project       # up one, then across
./run.sh               # run.sh right here
```

| symbol | meaning |
| --- | --- |
| `.` | this directory |
| `..` | one level up |
| `~` | your home directory |
| `-` | **the directory you were in before** (`cd -` to bounce) |

> Use absolute paths in scripts and relative paths when typing. A script does not know where it will be run from.

<figure>
<img src="/assets/fig/linux-tree.svg" alt="The Linux filesystem as one tree, with an absolute and a relative path to the same file" loading="lazy" />
<figcaption><b>One tree, one root.</b> Everything hangs off <code>/</code>; there is no second drive letter. The same file has two names &mdash; an absolute one that always works, and a relative one that depends on where you are standing.</figcaption>
</figure>

## Moving around

```bash
pwd                    # where am I (print working directory)
ls                     # what is here
cd /data/projects      # go there
cd ..                  # up one
cd                     # home (with no argument)
cd -                   # back to where you just were
```

`ls` changes a lot with its options.

| command | shows |
| --- | --- |
| `ls` | names only |
| `ls -l` | one per line, with permissions, size and date |
| `ls -a` | hidden files too (those starting with `.`) |
| `ls -lh` | sizes as `4.0K`, `1.2G` |
| `ls -lt` | newest first |
| `ls -lS` | largest first |

`ls -lah` turns on all three of those at once.

## Looking at files

```bash
cat config.yaml        # dump the whole thing — short files only
less train.log         # page through it (q to quit, / to search)
head -n 20 data.csv    # first 20 lines
tail -n 20 data.csv    # last 20 lines
tail -f train.log      # keep watching the end — for training logs
wc -l data.csv         # count lines
```

`tail -f` shows a log filling up while a job runs. `Ctrl + C` to stop watching.

> **Careful.** `cat` on a file of tens of gigabytes will lock up your terminal. If you do not know the size, check with `ls -lh` first and open it with `head` or `less`.

## Typing less

| key | does |
| --- | --- |
| `Tab` | **completes names** |
| `Tab` twice | lists the possibilities |
| `↑` `↓` | previous commands |
| `Ctrl + R` | search your command history |
| `Ctrl + C` | stop whatever is running |
| `Ctrl + L` | clear the screen (same as `clear`) |
| `Ctrl + A` / `Ctrl + E` | jump to start / end of the line |

`Tab` removes typos and means you never have to memorise a long path. Type the first few characters and let it finish.

## Finding out what a command does

```bash
man ls                 # the manual (q to quit)
ls --help              # a short summary
which python           # where this command actually lives
type cd                # built into the shell, or a program on disk?
```

Inside `man`, search with `/term` and jump to the next hit with `n`. Manual pages look long, but usually only **OPTIONS** and **EXAMPLES** at the bottom matter.

## Summary

- The prompt tells you who you are and where you are
- Paths are absolute (from `/`) or relative (from here)
- `pwd` `ls` `cd` to move, `less` and `tail -f` to look
- `Tab` and `Ctrl + R` remove half your typing
- When stuck, `man`

Next: [creating, copying and deleting files, and permissions](../linux-2-files-en/).

## References

- [GNU Bash Reference Manual](https://www.gnu.org/software/bash/manual/)
- [Ryan's Linux Tutorial](https://ryanstutorials.net/linuxtutorial/) — good exercises
- [GeeksforGeeks Linux Tutorial](https://www.geeksforgeeks.org/linux-unix/linux-tutorial/)
