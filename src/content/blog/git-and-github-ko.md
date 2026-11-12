---
title: "Git과 GitHub"
date: 2024-08-09
description: "Git과 GitHub가 어떻게 다른가 · working → staging → local → remote · revert와 reset의 차이 · 커밋하면 안 되는 것들"
category: tutorial
updated: 2024-08
lang: ko
group: git
topic: Git
tags: [git, github]
---

둘을 같은 말처럼 쓰는 경우가 많은데, 먼저 구분해 둘 필요가 있다. 어느 명령이 무슨 일을 하는지 헷갈리는 이유 대부분이 지금 둘 중 어느 쪽에 말하고 있는지 모르는 데서 온다.

## Git과 GitHub는 다르다

| | Git | GitHub |
| --- | --- | --- |
| 무엇 | 버전 관리 프로그램 | Git 저장소를 올려두는 웹 서비스 |
| 어디서 | 내 컴퓨터 | 남의 서버 |
| 만든 곳 | Linus Torvalds, 2005 | GitHub Inc. (현재 Microsoft), 2008 |
| 없어도 되나 | Git만으로 완전히 쓸 수 있다 | Git 없이는 의미가 없다 |

GitLab, Bitbucket, 또는 연구실 자체 서버도 GitHub 자리를 대신할 수 있다. <mark class="blue">**Git이 본체이고 GitHub는 선택지 중 하나다.**</mark>

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
<figcaption><b>네 개의 장소.</b> 파일을 고치면 working directory가 바뀌고, <code>add</code>로 staging에 올리고, <code>commit</code>으로 기록을 만들고, <code>push</code>로 원격에 보낸다.</figcaption>
</figure>

## 세 가지 상태 (three states)

Git을 이해하는 데 필요한 핵심 개념이다. 모든 파일은 셋 중 하나다.

| 상태 | 뜻 |
| --- | --- |
| modified | 고쳤지만 아직 기록하지 않음 |
| staged | 다음 commit에 넣기로 표시함 |
| committed | 로컬 저장소에 기록됨 |

staging이 왜 있는지는 처음에 잘 이해되지 않는다. 이유는 **한 번에 고친 것 중 일부만 commit할 수 있게** 하기 위해서다. 버그 수정과 오타 수정을 같이 했다면 따로 commit하는 편이 나중에 읽기 좋다.

## 시작하기

```bash
git config --global user.name "Your Name"
git config --global user.email "you@example.com"   # 한 번만

git init                       # 현재 폴더를 저장소로
git clone <url>                # 다른 사람의 저장소를 가져오기
```

## 매일 쓰는 것

```bash
git status                     # 지금 무슨 일이 벌어지고 있나 — 제일 자주 씀
git add file.py                # 이 파일을 staging에
git add .                      # 전부 — git status를 먼저 볼 것. 데이터 파일이 같이 들어간다
git commit -m "메시지"          # 기록 만들기
git log --oneline              # 기록 보기
git diff                       # 아직 add 안 한 변경
git diff --staged              # add 했지만 commit 안 한 변경
```

막혔을 때는 거의 항상 `git status`부터 본다. 지금 상태와 다음에 할 만한 명령까지 알려준다.

## 원격과 주고받기

**원격** (remote)은 같은 저장소를 다른 컴퓨터에 둔 것이다. 보통 GitHub이고, 여기로 commit을 올리고 여기서 받아온다.

```bash
git remote -v                  # 연결된 원격 보기
git push origin main           # 올리기
git pull origin main           # 가져와서 합치기
git fetch                      # 가져오기만 (합치지 않음)
```

`origin`은 기본 원격의 이름이고, `main`은 기본 branch의 이름이다. 둘 다 관례일 뿐 바꿀 수 있다.

> **`pull`은 `fetch` + `merge`이다.** 무엇이 올지 먼저 보고 싶으면 `git fetch` 다음 `git log HEAD..origin/main`으로 확인하고 합친다. `HEAD`는 지금 내가 서 있는 지점이라, 저 범위는 원격에는 있고 내게는 없는 commit들이다.

## branch

branch는 기록을 갈라서 작업하는 것이다. 실험적인 변경을 `main`에 섞지 않고 해볼 수 있다.

```bash
git branch                     # 목록
git switch -c feature-x        # 새 branch 만들고 이동
git switch main                # 이동
git merge feature-x            # 현재 branch에 feature-x를 합침
git branch -d feature-x        # 다 쓴 branch 삭제
```

예전 자료에는 `git checkout -b`가 나온다. 여전히 동작하지만, `checkout`이 너무 많은 일을 해서 Git 2.23부터 **`switch`** (branch 이동)와 **`restore`** (파일 되돌리기)로 나뉘었다. 새로 배운다면 이쪽이 헷갈리지 않는다.

## 되돌리기 (undo)

```bash
git restore file.py            # 아직 add 안 한 변경 버리기 — 복구 불가
git restore --staged file.py   # add만 취소 (변경은 유지)
git commit --amend             # 직전 commit 고치기 (아직 push 안 했을 때만)
git revert <commit>            # 그 commit을 취소하는 '새 commit'을 만듦
git reset --hard <commit>      # 거기로 되돌리고 이후 작업을 버림 — 위험
```

> **`revert`와 `reset`의 차이.** `revert`는 기록을 남긴 채 되돌리고, `reset`은 기록 자체를 지운다. **이미 push한 것에는 `reset --hard`를 쓰지 않는다.** 다른 사람의 기록과 어긋난다.

## .gitignore

올리면 안 되는 것을 적어둔다.

```
__pycache__/
*.pyc
.env
checkpoints/
data/*.csv
runs/
```

연구 코드에서 특히 중요하다.

- **비밀값은 절대 commit하지 않는다.** API 키, 비밀번호. <mark>한 번 push하면 나중에 지워도 **기록에 남는다.**</mark>
- **큰 파일도 피한다.** 체크포인트와 데이터셋은 Git에 맞지 않는다. 필요하면 Git LFS (large file storage)나 별도 저장소를 쓴다.
- `.gitignore`는 **이미 추적 중인 파일에는 소용없다.** 먼저 `git rm --cached <파일>`로 추적을 끊어야 한다.

## GitHub가 추가로 주는 것

Git에는 없고 GitHub가 얹은 것들이다.

| 기능 | 무엇 |
| --- | --- |
| Pull Request | 내 브랜치를 합쳐달라고 요청하고 리뷰받는 자리 |
| Issues | 할 일과 버그 기록 |
| Actions | push할 때 자동으로 돌리는 작업 (테스트, 배포) |
| Pages | 저장소를 웹사이트로 (이 사이트도 그렇다) |
| Releases | 특정 시점에 버전 번호와 파일을 붙여 배포 |

논문 코드를 공개할 때 보통 쓰는 흐름이다. 저장소를 만들고, README에 쓰는 법을 적고, Zenodo를 연결해 DOI (digital object identifier)를 받고, 릴리스를 만든다.

## 자주 겪는 일

**충돌 (conflict)이 났을 때.** 같은 줄을 두 사람이 다르게 고치면 Git이 합치기를 멈추고 표시를 남긴다.

```
<<<<<<< HEAD
내 버전
=======
상대 버전
>>>>>>> feature-x
```

파일을 원하는 모양으로 고친 다음, 표시로 남은 세 줄 (`<<<<<<<`, `=======`, `>>>>>>>`)을 모두 지우고 `git add`하고 commit한다. 한 줄이라도 남겨 두면 그 표시가 코드에 그대로 들어간다.

**commit 메시지.** 현재형 명령문으로 짧게 쓰는 것이 관례다. `Fix data loader` 쪽이 `fixed the data loader bug`보다 낫다. 한 줄 제목 다음 빈 줄, 그 아래 이유를 적으면 충분하다.

**실수로 큰 파일을 commit했을 때.** 아직 push하지 않았다면 `git reset` 후 `.gitignore`에 추가하면 된다. 이미 push했다면 기록을 다시 쓰는 작업이 필요하고 간단하지 않으므로, 애초에 `.gitignore`를 먼저 쓰는 것이 낫다.

저장소는 배포 단위이기도 하다. [Dockerfile](../docker-ko/)이 그 안에 들어 있고, image가 무엇으로 빌드되는지는 그 commit 시점의 저장소 내용이 정한다.

## 정리

- Git은 프로그램, GitHub는 서비스 — Git만으로도 완전하다
- 흐름은 **working → staging → local → remote**
- 막히면 `git status`
- `revert`는 안전하게 되돌리고, `reset --hard`는 기록을 지운다
- 비밀값과 큰 파일은 commit하지 않는다
- Pull Request, Issues, Actions, Pages는 GitHub가 더한 것

## 참고

- [Pro Git](https://git-scm.com/book/ko/v2) — 공식 책, 한국어판이 있다
- [git switch와 restore가 생긴 이유](https://github.blog/open-source/git/highlights-from-git-2-23/)
- [GitHub Docs](https://docs.github.com/)
