---
title: "Git and GitHub"
date: 2024-08-09
description: "How Git differs from GitHub · working → staging → local → remote · revert versus reset · what should never be committed"
category: tutorial
updated: 2024-08
lang: en
group: git
topic: Git
tags: [git, github]
---

The two names get used interchangeably, and that is worth untangling first: most of the confusion about which command does what comes from not knowing which of the two you are talking to.

## Git and GitHub are different things

| | Git | GitHub |
| --- | --- | --- |
| what | a version control program | a web service hosting Git repositories |
| where | your machine | someone else's server |
| from | Linus Torvalds, 2005 | GitHub Inc. (now Microsoft), 2008 |
| optional? | Git alone is fully usable | meaningless without Git |

GitLab, Bitbucket or a lab's own server can take GitHub's place. <mark class="blue">**Git is the thing; GitHub is one option.**</mark>

<figure>
<svg viewBox="0 0 540 190" role="img" aria-label="Working directory, staging area and local repository live on your machine; the remote lives on a server.">
  <rect x="16" y="28" width="330" height="142" rx="6" fill="none" stroke="#D3D8CE"/>
  <rect x="378" y="28" width="146" height="142" rx="6" fill="none" stroke="#2E5878" stroke-opacity=".5"/>
  <g font-family="IBM Plex Mono, monospace" font-size="11" fill="#1E4A39"><text x="28" y="22">your machine</text></g>
  <g font-family="IBM Plex Mono, monospace" font-size="11" fill="#2E5878"><text x="390" y="22">GitHub (remote)</text></g>
  <g fill="#DCE7DF" stroke="#1E4A39" stroke-width="1.4">
    <rect x="30" y="60" width="86" height="40" rx="5"/><rect x="142" y="60" width="86" height="40" rx="5"/><rect x="250" y="60" width="86" height="40" rx="5"/>
  </g>
  <rect x="396" y="60" width="110" height="40" rx="5" fill="rgba(46,88,120,.12)" stroke="#2E5878" stroke-width="1.4"/>
  <g font-family="IBM Plex Mono, monospace" font-size="9.5" fill="#1E4A39" text-anchor="middle">
    <text x="73" y="78">working</text><text x="73" y="90">directory</text>
    <text x="185" y="78">staging</text><text x="185" y="90">area</text>
    <text x="293" y="78">local</text><text x="293" y="90">repository</text>
  </g>
  <text x="451" y="84" font-family="IBM Plex Mono, monospace" font-size="9.5" fill="#2E5878" text-anchor="middle">origin</text>
  <g stroke="#1E4A39" stroke-width="1.3" marker-end="url(#h1)">
    <line x1="118" y1="80" x2="138" y2="80"/><line x1="230" y1="80" x2="246" y2="80"/><line x1="338" y1="80" x2="392" y2="80"/>
  </g>
  <defs><marker id="h1" markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6 z" fill="#1E4A39"/></marker></defs>
  <g font-family="IBM Plex Mono, monospace" font-size="10" fill="#46524D" text-anchor="middle">
    <text x="128" y="122">git add</text><text x="238" y="122">git commit</text><text x="365" y="122">git push</text>
  </g>
  <path d="M396 140 C 300 160, 140 160, 60 140" fill="none" stroke="#2E5878" stroke-width="1.3" stroke-dasharray="4 4" marker-end="url(#h2)"/>
  <defs><marker id="h2" markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6 z" fill="#2E5878"/></marker></defs>
  <text x="228" y="166" font-family="IBM Plex Mono, monospace" font-size="10" fill="#2E5878" text-anchor="middle">git pull</text>
</svg>
<figcaption><b>Four places.</b> Editing changes the working directory, <code>add</code> stages it, <code>commit</code> records it locally, and <code>push</code> sends it to the remote.</figcaption>
</figure>

## Three states

This is the idea Git is built on. Every file is in one of three states.

| state | meaning |
| --- | --- |
| modified | changed but not recorded |
| staged | marked to go into the next commit |
| committed | recorded in the local repository |

The staging area seems strange at first. It exists so you can **commit only part of what you changed**. If you fixed a bug and a typo in one sitting, two commits read better later than one.

## Getting started

```bash
git config --global user.name "Your Name"
git config --global user.email "you@example.com"   # once

git init                       # make this folder a repository
git clone <url>                # copy someone else's
```

## The daily commands

```bash
git status                     # what is going on — the one you type most
git add file.py                # stage this file
git add .                      # stage everything — read git status first, or data files ride along
git commit -m "message"        # record it
git log --oneline              # see the history
git diff                       # changes not yet added
git diff --staged              # added but not yet committed
```

When stuck, start with `git status`. It describes the state and usually suggests the command you want.

## Working with a remote

A **remote** is the same repository kept on another machine — GitHub, usually — that you send commits to and take commits from.

```bash
git remote -v                  # which remotes are configured
git push origin main           # send
git pull origin main           # fetch and merge
git fetch                      # fetch only, merge nothing
```

`origin` is the conventional name of the default remote and `main` of the default branch. Both are conventions, not rules.

> **`pull` is `fetch` + `merge`.** To see what is coming before taking it, run `git fetch` then `git log HEAD..origin/main` — `HEAD` is where you are now, so that range is the commits the remote has and you do not.

## Branches

A branch splits the history so you can work without disturbing `main`.

```bash
git branch                     # list
git switch -c feature-x        # create and move to it
git switch main                # move
git merge feature-x            # bring feature-x into the current branch
git branch -d feature-x        # delete when done
```

Older material says `git checkout -b`. It still works, but `checkout` did so many different jobs that Git 2.23 split it into **`switch`** (change branch) and **`restore`** (undo file changes). If you are learning now, the newer pair is less confusing.

## Undoing things

```bash
git restore file.py            # throw away unstaged changes — unrecoverable
git restore --staged file.py   # unstage, keep the changes
git commit --amend             # fix the last commit (only if not pushed)
git revert <commit>            # make a *new* commit that undoes that one
git reset --hard <commit>      # move back and discard everything after — dangerous
```

> **`revert` versus `reset`.** `revert` undoes while keeping the history; `reset` removes the history. **Never `reset --hard` something you have already pushed** — it desynchronises everyone else.

## .gitignore

List what should never be committed.

```
__pycache__/
*.pyc
.env
checkpoints/
data/*.csv
runs/
```

This matters particularly for research code.

- **Never commit secrets.** API keys, passwords. <mark>Once pushed, deleting them later **does not remove them from the history.**</mark>
- **Keep large files out.** Checkpoints and datasets do not belong in Git. Use Git LFS (large file storage) or separate storage.
- `.gitignore` **does nothing for files already tracked.** Untrack them first with `git rm --cached <file>`.

## What GitHub adds

Things that are not part of Git itself:

| feature | what it is |
| --- | --- |
| Pull requests | propose a branch for merging, and review it |
| Issues | track work and bugs |
| Actions | run something automatically on push (tests, deploys) |
| Pages | serve a repository as a website (including this one) |
| Releases | attach a version number and files to a point in history |

The usual flow when publishing paper code: create the repository, write a README explaining how to run it, connect Zenodo to get a DOI (digital object identifier), and cut a release.

## Things that come up

**A conflict.** When two people change the same line differently, Git stops and leaves markers:

```
<<<<<<< HEAD
your version
=======
their version
>>>>>>> feature-x
```

Edit the file into the shape you want, delete all three marker lines, then `git add` and commit. A marker left in the file gets committed with the code.

**Commit messages.** The convention is a short imperative sentence: `Fix data loader` rather than `fixed the data loader bug`. One line, a blank line, then the reasoning if it needs one.

**A large file committed by accident.** If it is not pushed, `git reset` and add it to `.gitignore`. If it is pushed, removing it means rewriting history, which is not simple — which is the argument for writing `.gitignore` first.

A repository is also the unit that ships: a [Dockerfile](../docker-en/) lives in it, and what the image builds from is whatever the repo contains at that commit.

## Summary

- Git is the program, GitHub is the service — Git alone is complete
- The flow is **working → staging → local → remote**
- When stuck, `git status`
- `revert` undoes safely; `reset --hard` erases history
- Keep secrets and large files out of commits
- Pull requests, Issues, Actions and Pages are GitHub's additions

## References

- [Pro Git](https://git-scm.com/book/en/v2) — the official book, free online
- [Why switch and restore exist](https://github.blog/open-source/git/highlights-from-git-2-23/)
- [GitHub Docs](https://docs.github.com/)
