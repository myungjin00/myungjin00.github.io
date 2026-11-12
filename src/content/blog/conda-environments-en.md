---
title: "Python environments: conda, mamba, venv, uv"
date: 2024-07-12
description: "Why every project needs its own environment · Anaconda vs Miniconda vs Miniforge and which to install · conda, mamba and uv side by side · pinning CUDA and PyTorch without breaking the solver · an environment.yml you can hand to someone else"
category: tutorial
updated: 2025-02
lang: en
group: environments
topic: Python
tags: [conda, mamba, uv, reproducibility]
---

An <u>environment</u> is a directory holding one Python interpreter and one set of packages. <mark class="blue">The whole point is that **a project's dependencies stop being global.**</mark>

Two projects need `numpy 1.26` and `numpy 2.1`. With one global install, satisfying one breaks the other. With environments they coexist, and switching is one command.

## Which installer

They differ only in what ships by default and which channel they point at — a channel being the repository packages are downloaded from.

| | What you get | Channel | Use when |
| --- | --- | --- | --- |
| **Anaconda** | ~250 packages preinstalled, a GUI (graphical user interface) | `defaults` (commercial terms apply) | you want everything up front |
| **Miniconda** | conda + Python, nothing else | `defaults` | minimal, official |
| **Miniforge** | conda + mamba + Python | **conda-forge** | most projects |
| **Micromamba** | one static binary, no base env | conda-forge | CI (continuous integration), containers |
| **venv** (stdlib) | isolates Python packages only | PyPI (Python Package Index) | pure-Python projects |
| **uv** | venv + installer, written in Rust | PyPI | fast, pure-Python projects |

<mark>**Install Miniforge** unless something forces otherwise.</mark> It defaults to conda-forge, which is community-run and has no licence terms attached, and it bundles mamba. Anaconda's `defaults` channel now requires a paid licence for larger organisations — a real reason to avoid it, not a style preference.

A container goes one level deeper than any of these &mdash; [Docker, and when you actually need it](../docker-en/) covers where that line falls.

The one thing conda does that `venv` and `uv` cannot: install **non-Python** dependencies. CUDA runtimes, compilers, `samtools`, R itself. That is why bioinformatics and deep learning ended up on conda while web projects did not.

<figure>
<img src="/assets/fig/conda-environments.svg" alt="Three conda environments side by side, each with its own interpreter and packages" loading="lazy" />
<figcaption><b>What isolation buys.</b> Each environment is a directory with its own interpreter and its own packages, so two projects can hold two incompatible versions of the same library at once. <code>base</code> stays empty on purpose &mdash; breaking it breaks conda itself.</figcaption>
</figure>

## The commands that matter

```bash
# create — always pin the Python version
conda create -n myproj python=3.12

conda activate myproj
conda install -c conda-forge numpy pandas scikit-learn rdkit
conda deactivate
```

Two commands answer "where am I and what is in here". `conda env list` prints every environment and marks the active one with `*`:

```bash
$ conda env list
# conda environments:
#
base                 *  /opt/miniforge3
myproj                  /opt/miniforge3/envs/myproj
```

`conda list` prints what is installed in the active environment. The column to read is the last one: a package that came from `pip` or from a channel you did not intend is the usual cause of an import that fails for no visible reason.

```bash
$ conda list | head -5
# packages in environment at /opt/miniforge3/envs/myproj:
#
# Name          Version      Build              Channel
numpy           2.4.2        py312h...          conda-forge
pandas          3.0.1        py312h...          conda-forge
```

Removing an environment is just deleting its directory, which conda will do for you:

```bash
conda env remove -n myproj
```

## mamba

mamba is a drop-in reimplementation of conda's solver in C++ — the solver being the part that works out a set of package versions that can coexist. Same commands, same environments — replace `conda` with `mamba`:

```bash
mamba create -n myproj python=3.12
mamba install -c conda-forge pytorch
```

Historically this was the difference between 30 seconds and 10 minutes. Since conda 23.10 the fast solver (`libmamba`) is the default, so the gap has closed; `mamba` is still a little quicker and is what Miniforge gives you anyway.

## uv

`uv` is the PyPI-side equivalent: a Rust reimplementation of `pip` + `venv`, typically 10–100× faster.

```bash
uv venv                       # creates .venv/
source .venv/bin/activate
uv pip install numpy pandas scikit-learn
```

It cannot install CUDA or compilers, so for a GPU project it is not a conda replacement. For a pure-Python package or a CLI (command-line interface) tool it is the better choice now.

## Writing the environment down

An environment file is what lets anyone — including you, six months later — reproduce the analysis.

```yaml
# environment.yml
name: myproj
channels:
  - conda-forge
dependencies:
  - python=3.12
  - numpy=2.4
  - pandas=3.0
  - scikit-learn=1.8
  - pip
  - pip:
      - some-package-not-on-conda-forge==0.4.1
```

```bash
conda env create -f environment.yml
conda env update -f environment.yml --prune   # after editing; --prune also removes what you deleted
```

**Write this file by hand.** `conda env export` produces a full build-pinned dump that only works on the same OS and architecture — useful as a lock file, useless as a spec. If you want the lock, keep both:

```bash
conda env export > environment.lock.yml
```

## Mixing pip and conda

<mark>The usual way an environment gets destroyed.</mark>

Rules that keep it alive:

1. **conda first, pip last.** Install everything available on conda-forge, then pip for the rest.
2. **Never `pip install --user`** inside an environment. It writes outside the environment and leaks into every other one.
3. **After pip, do not conda install again.** conda does not see pip's changes and will happily overwrite them.
4. **Never install into `base`.** Breaking `base` breaks conda itself. Keep it holding conda and nothing else.

## PyTorch and CUDA

**You do not need a system CUDA installation.** The PyTorch wheels — the prebuilt packages pip downloads — bundle their own CUDA runtime; the only thing that must be new enough is the NVIDIA driver.

```bash
# pick the cu-version from pytorch.org matching your driver
pip install torch --index-url https://download.pytorch.org/whl/cu128
```

```python
>>> import torch
>>> torch.__version__
'2.8.0+cu128'
>>> torch.cuda.is_available()
True
>>> torch.cuda.get_device_name(0)
'NVIDIA RTX PRO 6000'
```

If `is_available()` is `False`, check in this order: driver version (`nvidia-smi`), then whether you installed a CPU-only build, then whether the process can see the GPU at all (`CUDA_VISIBLE_DEVICES`). It is almost never the environment's fault.

## Things that cost an afternoon

- **`conda activate` fails in a script.** Non-interactive shells do not source the conda hook. Either `source "$(conda info --base)/etc/profile.d/conda.sh"` first, or call the interpreter by absolute path — which is more robust anyway.
- **The solver hangs.** Usually conflicting channels. Use conda-forge alone and set `channel_priority: strict` (`conda config --set channel_priority strict`), which stops the solver from mixing builds from two channels.
- **The environment is in your home directory and it filled up.** Environments are large. Put them on the volume with space: `conda create -p /path/with/space/envs/myproj`.
- **Different results on another machine.** Pin the Python minor version and the handful of packages that affect numerics. Full build pinning is for lock files, not for specs.

## Summary

- One environment per project; the point is that dependencies stop being global
- **Install Miniforge** — conda-forge by default, mamba included, no licence terms
- conda handles non-Python dependencies (CUDA, compilers, R); `venv`/`uv` do not
- `uv` is the fast choice for pure-Python work, `mamba`/conda for anything with native parts
- Keep a hand-written `environment.yml` as the spec and an exported file as the lock
- conda first, pip last, never touch `base`
- PyTorch ships its own CUDA runtime — only the driver has to be current

## References

- [Miniforge](https://github.com/conda-forge/miniforge) · [conda-forge](https://conda-forge.org/)
- [conda user guide](https://docs.conda.io/projects/conda/en/stable/user-guide/) · [mamba docs](https://mamba.readthedocs.io/)
- [uv](https://docs.astral.sh/uv/)
- [PyTorch install matrix](https://pytorch.org/get-started/locally/)
