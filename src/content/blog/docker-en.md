---
title: "Docker, and when you actually need it"
date: 2026-09-18
description: "Dockerfile, image and container are three different things · why layer order decides your build time · sharing the GPU and the filesystem on purpose · what conda already gives you and what it does not · when a container is worth it"
category: tutorial
updated: 2026-10
lang: en
group: docker
topic: Linux
tags: [docker, reproducibility, GPU]
---

A [conda environment](../conda-environments-en/) pins your Python packages. A container pins everything below them too — the system libraries, the CUDA runtime, the compiler, the exact Ubuntu. <mark class="blue">Whether you need that second thing is the real question, and the answer is often no.</mark>

## Dockerfile, image, container

<figure>
<img src="/assets/fig/docker-layers.svg" alt="Dockerfile builds to an image, which runs as a container; and an image as a stack of cached layers" loading="lazy" />
<figcaption><b>Recipe, frozen filesystem, running process.</b> The image is the unit you share; a container is one execution of it. The bottom half is the thing that decides your build time: an image is a stack of layers, each cached, and everything below a changed layer rebuilds.</figcaption>
</figure>

| | What it is | Lives |
| --- | --- | --- |
| **Dockerfile** | a text recipe | in your repo, in git |
| **image** | the built, frozen filesystem | in a registry (a server images are pushed to) or a `.tar` |
| **container** | a process running on that filesystem | until you stop it |

<mark>Nothing you write inside a container survives it unless it was written to a mounted volume.</mark> Every "my results disappeared" is this. A **volume** is a directory on the host handed into the container with `-v`, and it is the only place a write outlives the run.

## A Dockerfile worth copying

```dockerfile
FROM mambaorg/micromamba:1.5

# least-changing first: the environment spec, then the install
COPY --chown=$MAMBA_USER:$MAMBA_USER environment.yml /tmp/env.yml
RUN micromamba install -y -n base -f /tmp/env.yml && micromamba clean --all --yes

# most-changing last: your code
COPY --chown=$MAMBA_USER:$MAMBA_USER src/ /app/src
WORKDIR /app
ENV PYTHONUNBUFFERED=1
CMD ["python", "src/train.py"]
```

The ordering is the entire point. **Put what changes least at the top.** On a rebuild Docker reuses cached layers up to the first one that changed, so editing `src/` keeps the dependency install cached; if `COPY src/` came before the install, every edit to a single file would re-run the whole dependency solve.

| Instruction | Does |
| --- | --- |
| `FROM` | the base image you build on |
| `COPY` / `ADD` | files from your machine into the image |
| `RUN` | a command at **build** time, baked into a layer |
| `CMD` / `ENTRYPOINT` | what runs at **start** time |
| `WORKDIR` | the directory the rest runs in |
| `ENV` | environment variables, kept in the image |
| `.dockerignore` | what not to send — put `data/`, `.git/`, checkpoints in it |

That last one is routinely forgotten and routinely costs minutes. Without it, `docker build` ships your entire data directory to the Docker daemon — the background service that does the building — before it starts.

## What the container shares

<figure>
<img src="/assets/fig/docker-host.svg" alt="The host kernel, driver, disk and ports on the left, the container's own filesystem and libraries on the right" loading="lazy" />
<figcaption><b>The kernel is shared; everything else is handed in with a flag.</b> This is the whole difference from a virtual machine — there is no second kernel, which is why a container starts in a second and a VM does not.</figcaption>
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

Five of those flags each close a hole people hit:

- **`--gpus all`** needs the NVIDIA Container Toolkit on the host. The container carries its own CUDA *runtime*; the **driver** stays on the host and must be new enough for it. This is the same rule as [installing PyTorch](../conda-environments-en/) — the driver is the only thing that has to be current.
- **`-v host:container`** is the only way data gets in or results get out.
- **`-u $(id -u)`** stops every file the container writes from being owned by root on a shared machine. Without it you will need an admin to delete your own outputs.
- **`--shm-size`** — the default 64 MB shared memory is too small for a PyTorch `DataLoader` with workers, and the failure message does not say so.
- **`--rm`** deletes the container when it exits. Without it they accumulate, silently, with their writable layers.

The other two are mechanical: `-it` attaches a terminal, so you see output as it happens and can interrupt with Ctrl-C, and `-p 8888:8888` publishes a port, which is how a notebook started inside becomes reachable from outside.

## So do you need it

For one person on one server: **usually not.** An `environment.yml` plus a pinned driver already reproduces the work, and it is less to maintain. A container earns its place when one of these is true:

| Situation | Why conda is not enough |
| --- | --- |
| a non-Python dependency with a messy build | compilers, system libraries, old GCC |
| you hand the work to someone else's machine | you cannot assume their OS or libraries |
| CI (continuous integration), or a cluster that runs images | the scheduler takes an image, not a yml |
| a reviewer must rerun it years later | conda-forge may no longer solve that spec |
| two projects need different CUDA *runtimes* | one driver, several runtimes — containers do this cleanly |

> On an HPC (high-performance computing) cluster you often cannot run Docker at all, because it needs root. **Apptainer** (formerly Singularity) is what clusters use; it reads Docker images directly, so `apptainer build x.sif docker://your/image` is usually the whole migration.

## Things that cost an afternoon

- **The image is 12 GB.** A CUDA base plus conda is enormous. Use `micromamba clean --all`, combine `RUN` steps so intermediates do not get a layer each, and use a multi-stage build if you compile anything — build in one image, copy only the finished artefact into a clean one.
- **Files written by the container are owned by root.** Use `-u $(id -u):$(id -g)`, and set it before the first run, not after.
- **`docker build` takes forever on a one-line change.** Your `COPY src/` is above the install, or `.dockerignore` is missing.
- **It works on your machine and not on theirs.** You pulled a tag like `:latest`, which is not a version. Pin the digest (`image@sha256:…`, which names exactly one build) or at least an exact tag.
- **Disk fills up.** Stopped containers and dangling images stay. `docker system df` shows it; `docker system prune` reclaims it — read what it will delete first.

## Summary

- **Dockerfile → image → container**: recipe, frozen filesystem, running process
- Nothing written inside a container survives unless it was on a mounted volume
- **Layer order is build time.** Least-changing first, code last, and write a `.dockerignore`
- The kernel is shared; the GPU, the disk and the ports are each handed in with a flag
- `--gpus all` needs the host toolkit, and the host **driver** must be new enough for the container's CUDA runtime
- `-u $(id -u):$(id -g)` and `--shm-size=8g` are the two flags whose absence hurts later
- For one person on one server, **conda is usually enough** — containers earn their place at the handoff, on CI, and on a cluster, where Apptainer reads the same images

## References

- [Docker reference](https://docs.docker.com/reference/dockerfile/) · [best practices for writing Dockerfiles](https://docs.docker.com/build/building/best-practices/)
- [NVIDIA Container Toolkit](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/) — what `--gpus` needs
- [micromamba-docker](https://github.com/mamba-org/micromamba-docker) — the base image used above
- [Apptainer](https://apptainer.org/docs/user/latest/) — running the same images where Docker is not allowed
