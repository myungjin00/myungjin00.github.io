---
title: "Linux #2 — Files and permissions"
date: 2024-03-29
description: "mkdir -p, cp -r, mv, rm · checking a wildcard with ls before rm · rwx and 644, 755, 600 · rules for a shared server"
category: tutorial
updated: 2024-04
lang: en
group: linux-2
topic: Linux
tags: [linux, shell]
---

**Series** · [#1 The command line](../linux-1-command-line-en/) · #2 Files and permissions · [#3 Pipes and search](../linux-3-pipes-en/) · [#4 Processes](../linux-4-processes-en/) · [#5 Shell scripting](../linux-5-scripting-en/)

## Creating

```bash
mkdir results                  # one directory
mkdir -p runs/exp1/logs        # the whole path at once
touch notes.txt                # an empty file (or update its timestamp)
```

Without `-p` the second command fails when `runs` does not already exist. Scripts almost always use `mkdir -p`, because it also does not complain when the directory is already there.

## Copy, move, delete

```bash
cp a.txt b.txt                 # copy
cp -r data/ backup/            # directories need -r (recursive)
cp -a data/ backup/            # keep permissions and timestamps

mv old.txt new.txt             # rename
mv report.pdf ~/papers/        # move

rm temp.txt                    # delete
rm -r old_runs/                # delete a directory
```

Linux has **no separate rename command.** `mv` does both: moving something within the same directory is a rename.

> <mark class="blue">**`rm` has no wastebasket.** Deleted is deleted.</mark> Two habits worth building:
>
> ```bash
> ls old_runs/                 # 1. look at it before deleting
> rm -ri old_runs/             # 2. -i asks about each one
> ```
>
> `rm -rf` asks nothing and ignores errors. It is most dangerous **with variables**: in `rm -rf $DIR/`, an empty `DIR` makes it `rm -rf /`.

## Wildcards

The shell expands patterns into real filenames **before** the command runs.

| pattern | matches |
| --- | --- |
| `*` | any characters, including none |
| `?` | exactly **one** character |
| `[abc]` | one of those characters |
| `[0-9]` | one digit |
| `{a,b}` | expands to a and b separately |

```bash
ls *.csv                       # every csv
ls data_?.csv                  # data_1.csv, data_a.csv …
ls run_[1-3].log               # run_1 run_2 run_3
cp exp_{train,test}.json ~/    # two files in one go
```

> **How to check before deleting.** Run the same pattern through `ls` first. If the list is what you expected, change `ls` to `rm`. That one step prevents most accidents.

## Reading permissions

The first column of `ls -l` is the permissions. On a shared machine it is the column that explains why you cannot open a colleague's file, and why a script you just wrote will not run.

```
-rw-r--r--  1 user  lab  4096 Nov 11 18:00 notes.txt
drwxr-xr-x  2 user  lab  4096 Nov 11 18:00 results/
```

Read those ten characters as four groups.

```
 d  rwx  r-x  r-x
 │   │    │    │
 │   │    │    └── everyone else (others)
 │   │    └─────── the group
 │   └──────────── the owner (user)
 └──────────────── type: - file, d directory, l link
```

| letter | on a file | on a directory |
| --- | --- | --- |
| `r` | read the contents | list what is inside |
| `w` | change the contents | **create or delete files inside** |
| `x` | execute it | enter it |

That `w` on a directory matters. Even if a file itself is read-only, <mark>you can delete it when you have write permission on the directory holding it.</mark>

<figure>
<img src="/assets/fig/linux-permissions.svg" alt="The ten permission characters split into type, user, group and other, with their octal values" loading="lazy" />
<figcaption><b>Reading the ten characters.</b> One for the type, then three triplets &mdash; you, your group, everyone else. Each triplet is read 4 + write 2 + execute 1, which is where <code>754</code> comes from. On a directory the letters mean something different: <code>x</code> is permission to enter it, and <code>w</code> on the directory is what lets you delete files inside.</figcaption>
</figure>

## Changing permissions

**Symbolically** — who (`u` owner, `g` group, `o` others, `a` all three), how (`+` `-` `=`), what (`r` `w` `x`).

```bash
chmod +x run.sh                # make it executable (the common one)
chmod u+w notes.txt            # give the owner write
chmod go-w shared/             # take write away from group and others
```

**Numerically** — three digits set everything at once.

| digit | meaning | |
| --- | --- | --- |
| `4` | read | r |
| `2` | write | w |
| `1` | execute | x |

Add them up: `7 = 4+2+1 = rwx`, `6 = 4+2 = rw-`, `5 = 4+1 = r-x`.

| command | result | used for |
| --- | --- | --- |
| `chmod 644 file` | `rw-r--r--` | ordinary files |
| `chmod 755 dir` | `rwxr-xr-x` | directories, scripts |
| `chmod 600 key` | `rw-------` | secrets, SSH (secure shell) keys |
| `chmod 700 private/` | `rwx------` | a folder only you use |

`-R` applies it all the way down. **Use it carefully on a shared server.**

```bash
chmod -R 755 scripts/
```

## Changing the owner

```bash
chown user file.txt         # owner
chown user:lab file.txt     # owner:group
```

This usually needs `sudo`, which runs the one command that follows it as root. On a shared server, <mark>**do not change the ownership of other people's files.**</mark>

## Rules for a shared server

The lab server belongs to several people at once.

- **Touch only your own.** Never run `chmod -R` over someone else's directory.
- **Keep shared data read-only.** `644` or `444` on a shared dataset stops accidental overwrites.
- **SSH keys are `600`.** Anything looser and SSH refuses to use them.
- **`ls` before `rm`**, especially with wildcards and variables.

## Disk space

```bash
df -h /data                   # what is left on the partition
du -sh results/                # how much this folder takes
du -sh * | sort -h             # what is biggest (-h sorts human sizes)
```

Training output piles up quickly. Checking `df -h` before launching a big run is a good habit.

## Summary

- `mkdir -p`, `cp -r`, `mv` (move and rename), `rm` (no undo)
- The shell expands wildcards first — check with `ls` before `rm`
- Permissions are `owner / group / others` × `r w x`
- `w` on a directory means "can delete things inside it"
- `644` for files, `755` for directories and scripts, `600` for keys

Next: [connecting commands together and finding things](../linux-3-pipes-en/).

## References

- [chmod(1)](https://man7.org/linux/man-pages/man1/chmod.1.html)
- [Ryan's Linux Tutorial — Permissions](https://ryanstutorials.net/linuxtutorial/permissions.php)
