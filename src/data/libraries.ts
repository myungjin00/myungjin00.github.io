// Per-library reference for the Python stack. en/ko strings are shown by the page's language toggle.
export type Lib = {
  name: string
  docs: string
  en: string
  ko: string
  // the parts of the package worth knowing by name
  parts: string[]
  tag?: string
}

export type Group = { key: string; en: string; ko: string; noteEn: string; noteKo: string; libs: Lib[] }

export const GROUPS: Group[] = [
  {
    key: 'core',
    en: 'Core',
    ko: '기본',
    noteEn: 'Everything else in this list is built on these four.',
    noteKo: '이 목록의 나머지는 전부 이 넷 위에 올라가 있다.',
    libs: [
      {
        name: 'NumPy', docs: 'https://numpy.org/doc/stable/',
        en: 'N-dimensional arrays and the linear algebra on them.',
        ko: 'N차원 배열과 그 위의 선형대수.',
        parts: ['np.ndarray', 'np.random.default_rng', 'np.linalg', 'broadcasting', 'np.einsum'],
      },
      {
        name: 'pandas', docs: 'https://pandas.pydata.org/docs/',
        en: 'Labelled tables. The default until a file gets large.',
        ko: '행과 열에 이름이 붙은 표. 파일이 커지기 전까지는 기본 선택.',
        parts: ['DataFrame', 'groupby', 'merge', 'pivot_table', 'read_csv / read_parquet'],
      },
      {
        name: 'Polars', docs: 'https://docs.pola.rs/',
        en: 'A Rust dataframe with lazy, multi-threaded execution. Worth switching to when pandas starts to hurt.',
        ko: 'Rust로 만든 dataframe. lazy·멀티스레드 실행. pandas가 버거워지기 시작하면 갈아탈 만하다.',
        parts: ['pl.LazyFrame', 'scan_parquet', 'expressions', 'streaming'],
      },
      {
        name: 'SciPy', docs: 'https://docs.scipy.org/doc/scipy/',
        en: 'Statistics, sparse matrices and optimisation. Single-cell matrices live in scipy.sparse.',
        ko: '통계·희소 행렬·최적화. single-cell 행렬은 scipy.sparse 형태로 다룬다.',
        parts: ['scipy.stats', 'scipy.sparse', 'scipy.optimize', 'scipy.cluster.hierarchy'],
      },
      {
        name: 'scikit-learn', docs: 'https://scikit-learn.org/stable/',
        en: 'Classical models, and the splitting and metric machinery that keeps leakage out of an evaluation.',
        ko: '고전적인 모델, 그리고 데이터가 새지 않게 평가를 붙잡아 주는 split·지표 도구.',
        parts: ['Pipeline', 'train_test_split', 'StratifiedKFold', 'cross_val_score', 'metrics', 'RandomForest / SVM'],
        tag: 'baseline',
      },
    ],
  },
  {
    key: 'viz',
    en: 'Visualisation',
    ko: '시각화',
    noteEn: 'matplotlib for anything that goes into a paper, seaborn for everything on the way there.',
    noteKo: '논문에 들어갈 그림은 matplotlib, 거기까지 가는 동안의 탐색은 seaborn.',
    libs: [
      {
        name: 'matplotlib', docs: 'https://matplotlib.org/stable/',
        en: 'The base plotting engine. Verbose, and the only one that gives full control over a final figure.',
        ko: '바탕이 되는 그리기 엔진. 코드가 길지만, 최종 그림을 완전히 제어할 수 있는 유일한 선택.',
        parts: ['pyplot', 'Figure / Axes', 'GridSpec', 'rcParams', 'colormaps', 'savefig(dpi=600)'],
        tag: 'final figures',
      },
      {
        name: 'seaborn', docs: 'https://seaborn.pydata.org/',
        en: 'Statistical plots over matplotlib. One call does what twenty matplotlib lines would.',
        ko: 'matplotlib 위에 올린 통계 그래픽. 한 줄이 matplotlib 스무 줄을 대신한다.',
        parts: ['relplot / displot / catplot', 'heatmap', 'clustermap', 'pairplot', 'seaborn.objects'],
      },
      {
        name: 'plotly', docs: 'https://plotly.com/python/',
        en: 'Interactive figures for the browser. Hovering over a point to read its label is the reason to use it.',
        ko: '브라우저에서 보는 인터랙티브 그림. 점 위에 마우스를 올리면 라벨이 뜨고, 그 한 가지 때문에 쓴다.',
        parts: ['plotly.express', 'graph_objects', 'write_html'],
        tag: 'exploration',
      },
      {
        name: 'UpSetPlot', docs: 'https://upsetplot.readthedocs.io/',
        en: 'Set intersections beyond three sets, where a Venn diagram stops working.',
        ko: '벤 다이어그램으로 감당이 안 되는 네 개 이상 집합의 교집합을 그린다.',
        parts: ['UpSet', 'from_contents'],
      },
      {
        name: 'adjustText', docs: 'https://adjusttext.readthedocs.io/',
        en: 'Moves overlapping point labels apart. The fix for an unreadable volcano plot.',
        ko: '겹친 점 라벨을 서로 밀어낸다. 읽을 수 없는 volcano plot의 해법.',
        parts: ['adjust_text'],
      },
      {
        name: 'scanpy.pl', docs: 'https://scanpy.readthedocs.io/en/stable/api/plotting.html',
        en: 'The single-cell plotting set: UMAP coloured by gene, dot plots, violin stacks, rank-genes panels.',
        ko: 'single-cell 전용 그림 모음. 유전자로 색칠한 UMAP, dot plot, violin, rank-genes 패널.',
        parts: ['pl.umap', 'pl.dotplot', 'pl.violin', 'pl.rank_genes_groups', 'pl.matrixplot'],
      },
      {
        name: 'RDKit Draw', docs: 'https://www.rdkit.org/docs/GettingStartedInPython.html#drawing-molecules',
        en: 'Molecule depiction: 2D structures, grids of molecules, substructure highlighting.',
        ko: '분자 그리기. 2D 구조, 분자 여러 개를 한 장에 배열한 그림, 부분구조 강조.',
        parts: ['Draw.MolToImage', 'Draw.MolsToGridImage', 'rdMolDraw2D', 'highlightAtoms'],
      },
      {
        name: 'networkx', docs: 'https://networkx.org/',
        en: 'Graph layout and drawing when the graph itself is the figure. Slow above a few thousand nodes; use igraph then.',
        ko: '그래프 자체가 그림일 때의 배치와 드로잉. node가 수천 개를 넘으면 느려지고, 그때는 igraph를 쓴다.',
        parts: ['spring_layout', 'draw_networkx', 'algorithms'],
      },
    ],
  },
  {
    key: 'mol',
    en: 'Molecules',
    ko: '분자',
    noteEn: 'RDKit is the standard here. Everything else assumes it underneath.',
    noteKo: 'RDKit이 이 분야의 표준이다. 나머지는 전부 그 위에 올라간다고 가정한다.',
    libs: [
      {
        name: 'RDKit', docs: 'https://www.rdkit.org/docs/',
        en: 'Parsing, descriptors, fingerprints, substructure search, scaffolds, conformers, depiction.',
        ko: '파싱·디스크립터·fingerprint·부분구조 검색·scaffold·conformer·그리기.',
        parts: ['Chem.MolFromSmiles', 'Descriptors', 'rdFingerprintGenerator', 'MurckoScaffold', 'AllChem.EmbedMolecule', 'Draw'],
        tag: 'essential',
      },
      {
        name: 'Chemprop', docs: 'https://chemprop.readthedocs.io/',
        en: 'A directed message-passing network for property prediction, as a command-line tool. The baseline a new molecular model is expected to beat.',
        ko: '성질 예측용 directed message passing 신경망을 명령줄 도구로 만든 것. 새 분자 모델이 이겨야 하는 베이스라인.',
        parts: ['chemprop train', 'chemprop predict', 'D-MPNN'],
        tag: 'baseline',
      },
      {
        name: 'TorchDrug', docs: 'https://torchdrug.ai/',
        en: 'Drug-discovery tasks on PyTorch — property prediction, generation, retrosynthesis and knowledge graphs under one API.',
        ko: 'PyTorch 위의 신약 개발 과제 모음. 성질 예측·생성·역합성·지식 그래프를 하나의 API로.',
        parts: ['datasets', 'models', 'tasks', 'core.Engine'],
      },
      {
        name: 'DeepChem', docs: 'https://deepchem.readthedocs.io/',
        en: 'MoleculeNet loaders and the split functions implemented the way the papers did them.',
        ko: 'MoleculeNet 로더와 논문이 쓴 방식 그대로 구현된 split 함수.',
        parts: ['molnet.load_*', 'ScaffoldSplitter', 'featurizers', 'baseline models'],
        tag: 'benchmarks',
      },
      {
        name: 'datamol', docs: 'https://docs.datamol.io/',
        en: 'A short, readable wrapper over the RDKit calls you make every day.',
        ko: '매일 쓰는 RDKit 호출을 짧고 읽기 좋게 감싼 wrapper.',
        parts: ['dm.to_mol', 'dm.standardize_mol', 'dm.parallelized'],
      },
      {
        name: 'MolVS', docs: 'https://molvs.readthedocs.io/',
        en: 'Structure standardisation: salts, tautomers, charges. Run it before deduplicating, not after.',
        ko: '구조 표준화. 염·tautomer·전하 처리. 중복 제거 전에 돌린다.',
        parts: ['Standardizer', 'tautomer canonicalisation'],
      },
    ],
  },
  {
    key: 'dl',
    en: 'Deep learning',
    ko: '딥러닝',
    noteEn: 'PyTorch for the model, PyG for anything shaped like a graph.',
    noteKo: '모델은 PyTorch, 그래프 모양인 것은 전부 PyG.',
    libs: [
      {
        name: 'PyTorch', docs: 'https://pytorch.org/docs/stable/',
        en: 'Tensors, autograd, modules, optimisers. The training loop is yours to write.',
        ko: 'tensor·autograd·module·optimizer. 학습 루프는 직접 쓴다.',
        parts: ['nn.Module', 'DataLoader', 'optim.AdamW', 'lr_scheduler', 'amp.autocast'],
      },
      {
        name: 'PyTorch Geometric', docs: 'https://pytorch-geometric.readthedocs.io/',
        en: 'Graph layers, batching of many small graphs, pooling and readout.',
        ko: '그래프 레이어, 작은 그래프 여러 개의 배치, pooling과 readout.',
        parts: ['Data / Batch', 'GCNConv / GINConv / GATv2Conv', 'global_mean_pool', 'MessagePassing'],
        tag: 'graphs',
      },
      {
        name: 'Hugging Face Transformers', docs: 'https://huggingface.co/docs/transformers/',
        en: 'Pretrained transformers and the training loop around them. In molecular work it is how you reach ChemBERTa and the SMILES language models.',
        ko: '사전학습된 transformer와 그 주위의 학습 루프. 분자 쪽에서는 ChemBERTa 같은 SMILES 언어 모델을 가져다 쓰는 통로다.',
        parts: ['AutoModel', 'AutoTokenizer', 'Trainer', 'pipeline'],
      },
      {
        name: 'Optuna', docs: 'https://optuna.readthedocs.io/',
        en: 'Hyperparameter search with TPE and early pruning of hopeless trials.',
        ko: 'TPE 기반 하이퍼파라미터 탐색, 가망 없는 trial의 조기 중단.',
        parts: ['study.optimize', 'suggest_float', 'MedianPruner', 'storage'],
      },
      {
        name: 'Lightning', docs: 'https://lightning.ai/docs/pytorch/stable/',
        en: 'Removes training-loop boilerplate. A liability when the training loop is the research.',
        ko: '학습 루프 보일러플레이트를 없애 준다. 학습 루프 자체가 연구 대상이면 오히려 짐이 된다.',
        parts: ['LightningModule', 'Trainer', 'callbacks'],
      },
      {
        name: 'Weights & Biases', docs: 'https://docs.wandb.ai/',
        en: 'Run tracking: metrics, configs and artefacts, comparable across runs.',
        ko: '실행 기록. 지표·설정·산출물을 실행 간에 비교할 수 있게 남긴다.',
        parts: ['wandb.init', 'wandb.log', 'sweeps'],
      },
      {
        name: 'Hydra', docs: 'https://hydra.cc/',
        en: 'Composable config files, so a run is described by a file instead of forty flags.',
        ko: '조합 가능한 설정 파일. 실행 하나가 플래그 40개가 아니라 파일 하나로 기술된다.',
        parts: ['@hydra.main', 'config groups', 'multirun'],
      },
    ],
  },
  {
    key: 'omics',
    en: 'Omics',
    ko: '오믹스',
    noteEn: 'The Python side of transcriptomics. Statistics and annotation are still deeper in R.',
    noteKo: '전사체 분석의 Python 쪽. 통계와 annotation 패키지는 여전히 R이 두텁다.',
    libs: [
      {
        name: 'Scanpy', docs: 'https://scanpy.readthedocs.io/',
        en: 'The single-cell pipeline: QC, normalisation, PCA, neighbours, Leiden, UMAP, markers.',
        ko: 'single-cell 파이프라인. QC·정규화·PCA·이웃 그래프·Leiden·UMAP·marker.',
        parts: ['pp.*  (preprocess)', 'tl.*  (tools)', 'pl.*  (plots)', 'tl.leiden', 'tl.rank_genes_groups'],
      },
      {
        name: 'AnnData', docs: 'https://anndata.readthedocs.io/',
        en: 'The container: cells × genes, with per-cell and per-gene metadata and embeddings attached.',
        ko: '데이터 컨테이너. 세포 × 유전자에 세포별·유전자별 metadata와 embedding이 붙는다.',
        parts: ['.X', '.obs / .var', '.obsm / .varm', '.layers', '.uns', 'read_h5ad'],
      },
      {
        name: 'PyDESeq2', docs: 'https://pydeseq2.readthedocs.io/',
        en: 'DESeq2 reimplemented in Python. Use it when the rest of the analysis is already Python.',
        ko: 'DESeq2의 Python 재구현. 나머지 분석이 이미 Python일 때 쓴다.',
        parts: ['DeseqDataSet', 'DeseqStats', 'design'],
      },
      {
        name: 'scVI-tools', docs: 'https://docs.scvi-tools.org/',
        en: 'Deep generative models for single-cell: batch integration, label transfer, denoising.',
        ko: 'single-cell용 심층 생성 모델. 배치 통합, 라벨 전이, 노이즈 제거.',
        parts: ['SCVI', 'SCANVI', 'get_latent_representation'],
      },
      {
        name: 'gseapy', docs: 'https://gseapy.readthedocs.io/',
        en: 'Enrichment: GSEA (gene set enrichment analysis) on a ranked list, or Enrichr on a gene set.',
        ko: 'enrichment 분석. 순위를 매긴 목록에는 GSEA (gene set enrichment analysis), 유전자 집합에는 Enrichr.',
        parts: ['gseapy.prerank', 'gseapy.enrichr', 'gseaplot'],
      },
      {
        name: 'muon', docs: 'https://muon.readthedocs.io/',
        en: 'Multi-modal data — RNA with ATAC or surface protein — in one object.',
        ko: 'multi-modal 데이터 (RNA + ATAC 또는 표면 단백질)를 한 객체에.',
        parts: ['MuData', 'mu.pp', 'mu.tl.mofa'],
      },
    ],
  },
  {
    key: 'tools',
    en: 'Day to day',
    ko: '작업 도구',
    noteEn: 'Small, and they pay for themselves within a day.',
    noteKo: '작고, 하루 안에 본전을 뽑는다.',
    libs: [
      {
        name: 'tqdm', docs: 'https://tqdm.github.io/',
        en: 'A progress bar with a time estimate, around any iterable.',
        ko: '어떤 반복문에나 씌우는 진행 막대와 남은 시간 추정.',
        parts: ['tqdm(iterable)', 'tqdm.pandas()'],
      },
      {
        name: 'joblib', docs: 'https://joblib.readthedocs.io/',
        en: 'Parallel map over processes, plus on-disk caching of expensive functions.',
        ko: '프로세스 단위 병렬 map, 그리고 계산이 무거운 함수의 디스크 캐시.',
        parts: ['Parallel / delayed', 'Memory', 'dump / load'],
      },
      {
        name: 'rich', docs: 'https://rich.readthedocs.io/',
        en: 'Readable terminal output: tables, trees, tracebacks, progress.',
        ko: '읽을 수 있는 터미널 출력. 표·트리·traceback·진행 표시.',
        parts: ['rich.print', 'Table', 'Console', 'traceback.install'],
      },
      {
        name: 'typer', docs: 'https://typer.tiangolo.com/',
        en: 'A CLI generated from type hints, instead of argparse boilerplate.',
        ko: 'argparse 보일러플레이트 대신 타입 힌트에서 만들어지는 CLI.',
        parts: ['typer.Typer', 'typer.Option', 'typer.Argument'],
      },
      {
        name: 'pyarrow', docs: 'https://arrow.apache.org/docs/python/',
        en: 'Parquet read and write. Typed, compressed, and far faster to read than CSV.',
        ko: 'Parquet 읽기·쓰기. 타입이 보존되고 압축되며 CSV보다 읽기가 훨씬 빠르다.',
        parts: ['parquet.read_table', 'parquet.write_table'],
      },
      {
        name: 'ruff', docs: 'https://docs.astral.sh/ruff/',
        en: 'Linter and formatter in one, fast enough to run on every save.',
        ko: 'linter와 formatter를 하나로. 저장할 때마다 돌려도 될 만큼 빠르다.',
        parts: ['ruff check --fix', 'ruff format'],
      },
      {
        name: 'pytest', docs: 'https://docs.pytest.org/',
        en: 'Plain assert statements as tests, collected and run for you.',
        ko: '평범한 assert 문을 테스트로 삼아 모아서 실행해 준다.',
        parts: ['test_*.py', 'fixtures', 'parametrize', '-k'],
      },
    ],
  },
]
