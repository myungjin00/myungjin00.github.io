---
title: "Docker, 그리고 언제 정말 필요한가"
date: 2026-09-18
description: "Dockerfile·image·container는 서로 다른 셋 · layer 순서가 빌드 시간을 정한다 · GPU와 파일시스템은 플래그로 일부러 넘겨준다 · conda가 이미 주는 것과 주지 못하는 것 · 컨테이너가 값어치를 하는 시점"
category: tutorial
updated: 2026-10
lang: ko
group: docker
topic: Linux
tags: [docker, reproducibility, GPU]
---

[conda 환경](../conda-environments-ko/)은 Python 패키지를 고정한다. 컨테이너는 그 아래까지 고정한다 — 시스템 라이브러리, CUDA 런타임, 컴파일러, 우분투 버전까지. <mark class="blue">두 번째 것이 정말 필요한가가 진짜 질문이고, 답은 아닌 경우가 많다.</mark>

## Dockerfile · image · container

<figure>
<img src="/assets/fig/docker-layers.svg" alt="Dockerfile builds to an image, which runs as a container; and an image as a stack of cached layers" loading="lazy" />
<figcaption><b>레시피, 얼어붙은 파일시스템, 돌아가는 프로세스.</b> 공유하는 단위는 image이고 container는 그것을 한 번 실행한 것이다. 아래쪽 절반이 빌드 시간을 정하는 부분이다. image는 캐시되는 layer를 쌓아 올린 것이고, 바뀐 layer 아래는 전부 다시 빌드된다.</figcaption>
</figure>

| | 무엇인가 | 어디에 있나 |
| --- | --- | --- |
| **Dockerfile** | 텍스트로 쓴 레시피 | 저장소 안, [git에](../git-and-github-ko/) |
| **image** | 빌드되어 얼어붙은 파일시스템 | 레지스트리 (image를 올려 두는 서버)나 `.tar` |
| **container** | 그 파일시스템 위에서 도는 프로세스 | 멈출 때까지 |

<mark>컨테이너 안에서 쓴 것은 컨테이너와 함께 사라진다. 마운트한 볼륨에 썼을 때만 남는다.</mark> "결과가 없어졌다"는 전부 이것이다. **볼륨** (volume)은 `-v`로 컨테이너 안에 넣어 주는 host의 디렉터리이고, 쓴 것이 실행 뒤에도 남는 유일한 자리다.

## 그대로 베껴도 되는 Dockerfile

```dockerfile
FROM mambaorg/micromamba:1.5

# 덜 바뀌는 것부터: 환경 명세, 그다음 설치
COPY --chown=$MAMBA_USER:$MAMBA_USER environment.yml /tmp/env.yml
RUN micromamba install -y -n base -f /tmp/env.yml && micromamba clean --all --yes

# 가장 자주 바뀌는 것은 마지막에: 내 코드
COPY --chown=$MAMBA_USER:$MAMBA_USER src/ /app/src
WORKDIR /app
ENV PYTHONUNBUFFERED=1
CMD ["python", "src/train.py"]
```

순서가 전부다. **덜 바뀌는 것을 위에 둔다.** 다시 빌드할 때 Docker는 처음 바뀐 layer 앞까지 캐시를 재사용하므로 `src/`만 고치면 의존성 설치는 캐시를 쓴다. `COPY src/`가 설치보다 위에 있으면 파일 하나만 고쳐도 의존성 해결이 통째로 다시 돈다.

| 명령 | 하는 일 |
| --- | --- |
| `FROM` | 바탕으로 삼을 base image |
| `COPY` / `ADD` | 내 컴퓨터의 파일을 image 안으로 |
| `RUN` | **빌드** 시점의 명령. layer로 구워진다 |
| `CMD` / `ENTRYPOINT` | **실행** 시점에 도는 것 |
| `WORKDIR` | 나머지가 실행될 디렉터리 |
| `ENV` | 환경 변수, image에 남는다 |
| `.dockerignore` | 보내지 않을 것 — `data/`·`.git/`·체크포인트를 적는다 |

마지막 줄은 늘 잊히고 늘 몇 분을 잡아먹는다. 이게 없으면 `docker build`가 시작도 하기 전에 데이터 디렉터리 전체를, 빌드를 실제로 수행하는 백그라운드 서비스인 Docker 데몬으로 보낸다.

## 컨테이너가 공유하는 것

<figure>
<img src="/assets/fig/docker-host.svg" alt="The host kernel, driver, disk and ports on the left, the container's own filesystem and libraries on the right" loading="lazy" />
<figcaption><b>kernel은 공유되고, 나머지는 플래그로 하나씩 넘겨준다.</b> 가상머신과의 차이가 전부 여기다. 두 번째 kernel이 없고, 그래서 컨테이너는 1초 만에 뜨고 가상머신은 그러지 못한다.</figcaption>
</figure>

```bash
docker run --rm -it \
  --gpus all \
  -v /data/project:/data \
  -p 8888:8888 \
  -u $(id -u):$(id -g) \
  --shm-size=8g \
  sjoint:0.3 python src/train.py
```

그중 다섯 개가 각각 사람들이 밟는 구멍을 하나씩 막는다.

- **`--gpus all`은** host에 NVIDIA Container Toolkit이 있어야 한다. 컨테이너는 자기 CUDA *런타임*을 들고 다니고, **드라이버**는 host에 남아 그 런타임을 감당할 만큼 새로워야 한다. [PyTorch 설치](../conda-environments-ko/)와 같은 규칙이다. 최신이어야 하는 건 드라이버뿐이다.
- **`-v host:container`가** 데이터가 들어가고 결과가 나오는 유일한 통로다.
- **`-u $(id -u)`가** 없으면 컨테이너가 쓴 파일이 전부 root 소유가 된다. 공용 장비에서는 내 산출물을 지우는 데 관리자가 필요해진다.
- **`--shm-size`** — 기본 공유 메모리 64 MB는 worker를 쓰는 PyTorch `DataLoader`에 모자라고, 오류 메시지는 그 얘기를 해 주지 않는다.
- **`--rm`은** 종료할 때 컨테이너를 지운다. 없으면 쓰기 가능 layer를 달고 조용히 쌓인다.

나머지 둘은 기계적이다. `-it`은 터미널을 붙여 출력을 바로 보고 Ctrl-C로 끊을 수 있게 하고, `-p 8888:8888`은 포트를 열어 안에서 띄운 노트북을 밖에서 접속할 수 있게 한다.

## 그래서 필요한가

한 사람이 한 서버를 쓴다면 **대개는 필요 없다.** `environment.yml`과 고정된 드라이버만으로 이미 재현되고, 관리할 것도 적다. 컨테이너를 쓸 만한 경우는 아래 중 하나다.

| 상황 | conda로 안 되는 이유 |
| --- | --- |
| 빌드가 지저분한 비-Python 의존성 | 컴파일러, 시스템 라이브러리, 옛날 GCC |
| 작업을 남의 장비로 넘긴다 | 그쪽 OS나 라이브러리를 가정할 수 없다 |
| CI (continuous integration), 또는 image를 실행하는 클러스터 | 스케줄러는 yml이 아니라 image를 받는다 |
| 몇 년 뒤 심사자가 다시 돌려야 한다 | conda-forge가 그 명세를 더 이상 못 풀 수 있다 |
| 두 프로젝트가 다른 CUDA *런타임*을 쓴다 | 드라이버 하나에 런타임 여럿 — 컨테이너가 깔끔하다 |

> HPC (high-performance computing) 클러스터에서는 Docker를 아예 못 돌리는 경우가 많다. root가 필요하기 때문이다. 클러스터가 쓰는 건 **Apptainer** (옛 Singularity)이고, Docker image를 그대로 읽는다. 그래서 `apptainer build x.sif docker://your/image` 한 줄이 이식의 전부인 경우가 보통이다.

## 반나절씩 잡아먹는 문제들

- **image가 12 GB다.** CUDA base에 conda를 얹으면 거대해진다. `micromamba clean --all`을 쓰고, `RUN`을 합쳐 중간 산물마다 layer가 생기지 않게 하고, 무언가 컴파일한다면 multi-stage 빌드를 쓴다. 한 image에서 빌드하고 결과물만 깨끗한 image로 복사하는 방식이다.
- **컨테이너가 쓴 파일이 root 소유다.** `-u $(id -u):$(id -g)`를 쓰되, 첫 실행 전에 넣는다.
- **한 줄 고쳤는데 빌드가 끝나지 않는다.** `COPY src/`가 설치보다 위에 있거나 `.dockerignore`가 없다.
- **내 장비에선 되는데 저쪽에선 안 된다.** `:latest` 같은 태그를 받았을 것이다. 그건 버전이 아니다. 빌드 하나를 정확히 가리키는 digest(`image@sha256:…`)를 고정하거나 최소한 정확한 태그를 쓴다.
- **디스크가 찬다.** 멈춘 컨테이너와 떠도는 image가 남는다. `docker system df`로 보이고 `docker system prune`으로 회수하는데, 무엇을 지울지 먼저 읽는다.

## 정리

- **Dockerfile → image → container**: 레시피, 얼어붙은 파일시스템, 돌아가는 프로세스
- 마운트한 볼륨에 쓰지 않은 것은 컨테이너와 함께 사라진다
- **layer 순서가 곧 빌드 시간이다.** 덜 바뀌는 것 먼저, 코드는 마지막, 그리고 `.dockerignore`
- kernel은 공유되고 GPU·디스크·포트는 플래그로 하나씩 넘겨준다
- `--gpus all`은 host 툴킷이 필요하고, host **드라이버**가 컨테이너의 CUDA 런타임을 감당해야 한다
- 없으면 나중에 아픈 플래그 둘: `-u $(id -u):$(id -g)`와 `--shm-size=8g`
- 한 사람 한 서버라면 **conda로 충분하다.** 컨테이너는 넘겨줄 때, CI에서, 클러스터에서 값어치를 한다. 클러스터에서는 Apptainer가 같은 image를 읽는다

## 참고

- [Dockerfile 레퍼런스](https://docs.docker.com/reference/dockerfile/) · [Dockerfile 작성 모범 사례](https://docs.docker.com/build/building/best-practices/)
- [NVIDIA Container Toolkit](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/) — `--gpus`에 필요한 것
- [micromamba-docker](https://github.com/mamba-org/micromamba-docker) — 위에서 쓴 base image
- [Apptainer](https://apptainer.org/docs/user/latest/) — Docker가 안 되는 곳에서 같은 image를 돌리는 법
