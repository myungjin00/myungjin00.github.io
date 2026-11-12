---
title: "Python 환경 관리: conda, mamba, venv, uv"
date: 2024-07-12
description: "프로젝트마다 환경을 따로 두는 이유 · Anaconda·Miniconda·Miniforge 중 무엇을 깔 것인가 · conda와 mamba와 uv 비교 · CUDA·PyTorch를 깨뜨리지 않고 설치하는 법 · 남에게 건넬 수 있는 environment.yml"
category: tutorial
updated: 2025-02
lang: ko
group: environments
topic: Python
tags: [conda, mamba, uv, reproducibility]
---

<u>환경 (environment)</u>은 Python 인터프리터 하나와 패키지 한 벌이 들어 있는 디렉터리다. <mark class="blue">존재 이유는 하나다. **프로젝트의 의존성을 전역 (global)에서 떼어내는 것.**</mark>

프로젝트 둘이 각각 `numpy 1.26`과 `numpy 2.1`을 요구한다고 하자. 전역에 하나만 깔려 있으면 한쪽을 맞추는 순간 다른 쪽이 깨진다. 환경을 나누면 둘이 공존하고, 전환은 명령 한 줄이다.

## 무엇을 깔 것인가

차이는 기본으로 딸려 오는 패키지와 어느 채널 (channel)을 보느냐뿐이다. 채널은 패키지를 내려받는 저장소다.

| | 들어 있는 것 | 채널 | 언제 |
| --- | --- | --- | --- |
| **Anaconda** | 패키지 250여 개 + GUI (graphical user interface) | `defaults` (상업 라이선스 조건 있음) | 처음부터 다 깔려 있길 원할 때 |
| **Miniconda** | conda + Python만 | `defaults` | 최소 설치, 공식 |
| **Miniforge** | conda + mamba + Python | **conda-forge** | 기본으로 권할 선택 |
| **Micromamba** | 정적 바이너리 하나, base 없음 | conda-forge | CI (continuous integration), 컨테이너 |
| **venv** (표준 라이브러리) | Python 패키지만 격리 | PyPI (Python Package Index) | 순수 Python 프로젝트 |
| **uv** | venv + 설치 도구, Rust로 작성 | PyPI | 빠른 순수 Python 프로젝트 |

<mark>특별한 이유가 없으면 **Miniforge**를 깔면 된다.</mark> 기본 채널이 conda-forge이고, 커뮤니티가 운영해서 라이선스 조건이 붙지 않으며, mamba가 같이 들어 있다. Anaconda의 `defaults` 채널은 규모가 큰 조직에는 유료 라이선스를 요구한다. 취향 문제가 아니라 피할 실질적 이유다.

컨테이너는 이 모두보다 한 단계 아래까지 내려간다. 그 선이 어디인지는 [Docker 글](../docker-ko/)에서 다룬다.

conda가 `venv`·`uv`와 결정적으로 다른 점은 하나다. **Python이 아닌 의존성을 설치할 수 있다.** CUDA 런타임, 컴파일러, `samtools`, R 자체까지. 생물정보와 딥러닝이 conda 쪽에 자리 잡고 웹 쪽은 그러지 않은 이유가 여기 있다.

<figure>
<img src="/assets/fig/conda-environments.svg" alt="Three conda environments side by side, each with its own interpreter and packages" loading="lazy" />
<figcaption><b>격리가 주는 것.</b> 환경 하나하나가 자기 인터프리터와 자기 패키지를 가진 디렉터리다. 그래서 같은 라이브러리의 호환되지 않는 두 버전이 동시에 존재할 수 있다. <code>base</code>를 일부러 비워 두는 이유는, 그게 깨지면 conda 자체가 깨지기 때문이다.</figcaption>
</figure>

## 실제로 쓰는 명령

```bash
# 생성 — Python 버전은 항상 고정한다
conda create -n myproj python=3.12

conda activate myproj
conda install -c conda-forge numpy pandas scikit-learn rdkit
conda deactivate
```

"지금 어디에 있고 여기 뭐가 깔려 있나"에 답하는 명령이 두 개다. `conda env list`는 환경 전체를 찍고 활성 환경에 `*`를 붙인다.

```bash
$ conda env list
# conda environments:
#
base                 *  /opt/miniforge3
myproj                  /opt/miniforge3/envs/myproj
```

`conda list`는 활성 환경에 깔린 것을 찍는다. 볼 곳은 마지막 열이다. 의도하지 않은 채널이나 `pip`에서 들어온 패키지가, 이유 없이 import가 깨지는 흔한 원인이다.

```bash
$ conda list | head -5
# packages in environment at /opt/miniforge3/envs/myproj:
#
# Name          Version      Build              Channel
numpy           2.4.2        py312h...          conda-forge
pandas          3.0.1        py312h...          conda-forge
```

환경을 지우는 건 디렉터리를 지우는 것과 같고, conda가 대신 해 준다.

```bash
conda env remove -n myproj
```

## mamba

mamba는 conda의 의존성 solver를 C++로 다시 구현한 것이다. solver는 서로 공존할 수 있는 패키지 버전 조합을 찾아내는 부분이다. 명령도 환경도 같고 `conda`를 `mamba`로 바꾸기만 하면 된다.

```bash
mamba create -n myproj python=3.12
mamba install -c conda-forge pytorch
```

예전에는 이게 30초와 10분의 차이였다. conda 23.10부터 빠른 solver(`libmamba`)가 기본이라 격차는 많이 줄었다. 그래도 `mamba`가 조금 더 빠르고, Miniforge를 깔면 어차피 같이 온다.

## uv

`uv`는 PyPI 쪽에서 같은 역할을 한다. `pip` + `venv`를 Rust로 다시 구현했고 보통 10~100배 빠르다.

```bash
uv venv                       # .venv/ 생성
source .venv/bin/activate
uv pip install numpy pandas scikit-learn
```

CUDA나 컴파일러는 설치하지 못하므로 GPU 프로젝트에서 conda를 대체하지는 못한다. 순수 Python 패키지나 CLI (command-line interface) 도구라면 지금은 이쪽이 낫다.

## 환경을 글로 남기기

환경 파일이 있어야 여섯 달 뒤의 나를 포함해 누구든 이 분석을 다시 돌릴 수 있다.

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
conda env update -f environment.yml --prune   # 수정한 뒤. --prune은 지운 것도 같이 뺀다
```

**이 파일은 손으로 쓴다.** `conda env export`는 빌드 해시까지 박힌 전체 덤프를 뱉는데, 같은 OS·아키텍처에서만 동작한다. lock 파일로는 쓸 만하지만 명세 (spec)로는 못 쓴다. lock이 필요하면 둘 다 두면 된다.

```bash
conda env export > environment.lock.yml
```

## pip과 conda 섞기

<mark>환경이 망가지는 가장 흔한 경로다.</mark> 살려 두는 규칙은 네 가지다.

1. **conda 먼저, pip 마지막.** conda-forge에 있는 건 전부 conda로 깔고, 없는 것만 pip으로.
2. **환경 안에서 `pip install --user` 금지.** 환경 바깥에 써서 다른 모든 환경으로 새어 나간다.
3. **pip 이후에 conda install을 다시 하지 않는다.** conda는 pip이 바꾼 걸 모르고 그냥 덮어쓴다.
4. **`base`에는 아무것도 깔지 않는다.** `base`가 깨지면 conda 자체가 깨진다. conda만 들어 있게 둔다.

## PyTorch와 CUDA

**시스템에 CUDA를 따로 깔 필요가 없다.** pip이 내려받는 미리 빌드된 패키지인 PyTorch 휠이 CUDA 런타임을 들고 다니고, 최신이어야 하는 건 NVIDIA 드라이버뿐이다.

```bash
# 드라이버에 맞는 cu 버전을 pytorch.org에서 고른다
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

`is_available()`가 `False`면 순서대로 본다. 드라이버 버전(`nvidia-smi`) → CPU 전용 빌드를 깐 건 아닌지 → 프로세스가 GPU를 볼 수 있는지(`CUDA_VISIBLE_DEVICES`). 환경 설정 탓인 경우는 거의 없다.

## 반나절씩 잡아먹는 문제들

- **스크립트 안에서 `conda activate`가 실패한다.** 비대화형 셸은 conda 훅을 읽지 않는다. `source "$(conda info --base)/etc/profile.d/conda.sh"`를 먼저 하거나, 인터프리터를 절대 경로로 직접 부른다. 후자가 어차피 더 튼튼하다.
- **solver가 멈춘다.** 대개 채널 충돌이다. conda-forge만 쓰고 `channel_priority: strict`로 둔다(`conda config --set channel_priority strict`). solver가 두 채널의 빌드를 섞지 않게 막는다.
- **홈 디렉터리에 환경을 만들었다가 용량이 찼다.** 환경은 크다. 여유 있는 볼륨에 둔다: `conda create -p /path/with/space/envs/myproj`.
- **다른 장비에서 결과가 다르다.** Python 마이너 버전과 수치에 영향을 주는 몇 개를 고정한다. 빌드까지 고정하는 건 lock 파일에서 할 일이지 명세에서 할 일이 아니다.

## 정리

- 프로젝트마다 환경 하나. 요점은 의존성이 전역이 아니게 되는 것
- **Miniforge를 깐다** — conda-forge 기본, mamba 포함, 라이선스 조건 없음
- conda는 Python 아닌 의존성 (CUDA·컴파일러·R)을 설치한다. `venv`·`uv`는 못 한다
- 순수 Python이면 `uv`, 네이티브가 섞이면 `mamba`/conda
- 명세는 손으로 쓴 `environment.yml`, 잠금은 export한 파일로 따로
- conda 먼저 pip 마지막, `base`는 건드리지 않는다
- PyTorch는 CUDA 런타임을 들고 다닌다. 최신이어야 하는 건 드라이버뿐

## 참고

- [Miniforge](https://github.com/conda-forge/miniforge) · [conda-forge](https://conda-forge.org/)
- [conda 사용자 가이드](https://docs.conda.io/projects/conda/en/stable/user-guide/) · [mamba 문서](https://mamba.readthedocs.io/)
- [uv](https://docs.astral.sh/uv/)
- [PyTorch 설치 안내](https://pytorch.org/get-started/locally/)
