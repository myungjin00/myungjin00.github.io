// =============================================================================
//  KOREAN (국문) CONTENT — mirrors cv.ts. Proper nouns, paper/poster titles,
//  technical terms, tags, links, dates and IDs are kept in English on purpose.
// =============================================================================
import type { NewsItem, ProjectGroup, VitaeSection } from './cv'

export const profile = {
  name: 'Myungjin Lee',
  nameKo: '이명진',
  firstName: 'Myungjin',
  lastName: 'Lee',
  role: '컴퓨터·인공지능공학 석사',
  major: 'AI in Healthcare and Medicine',
  headline: '신약개발 AI · ADMET 예측 · 약물 재창출 · 그래프 학습 · XAI',
  degree: '석사',
  location: '대한민국 서울',
  lab: { label: 'PRISM Lab (동국대)', href: 'https://sangsoolim.notion.site' },
  notes: {
    label: '학습노트',
    href: 'https://myungjinlee.notion.site/Myungjin-s-Notes-3baa81750c2e80388ed7e6e6676f308c',
  },
  photo: '/assets/profile.jpg',
  email: 'leemj637@gmail.com',
  links: [
    { label: '이메일', href: 'mailto:leemj637@gmail.com' },
    { label: 'GitHub', href: 'https://github.com/myungjin00' },
    { label: 'CV (PDF)', href: '/assets/cv.pdf' },
  ],
}

export const bio: string[] = [
  '안녕하세요, **신약개발 AI**를 연구하는 머신러닝 연구자 **이명진**입니다. 최근 동국대학교에서 컴퓨터·인공지능공학 석사 _(전공: AI in Healthcare and Medicine)_ 를 마쳤고, 인덕대학교 산업경영공학 학사를 수석으로 졸업했습니다. 현재 머신러닝을 신약개발과 분자 데이터에 적용할 수 있는 **기회를 찾고 있습니다**.',
  '주 분야는 분자 표현을 위한 **그래프 학습**과 **ADMET 예측**이며, 약물 재창출부터 노화연관 MASLD 표적 발굴을 위한 전사체 분석에 이르기까지 더 광범위한 AI 기반 신약개발·생물정보학 문제도 **연구한 경험이 있습니다**. 저는 **어텐션 메커니즘**을 활용해 어떤 분자 하위구조가 예측을 이끄는지 드러내는 **해석 가능한 AI 모델**을 개발하여, 모델의 추론이 불투명하지 않고 투명하게 유지되도록 합니다. 두 편의 ADMET 논문 중 하나는 심사 중이며, 다른 하나는 투고를 마무리하고 있습니다.',
  '앞으로는 해석 가능한 그래프 기반 AI로 **신약개발**을 발전시키고자 합니다. 분자 표현에서 **약물–타깃 상호작용(DTI)**과 **약물 반응 예측**까지 연결하여, 하나의 프레임워크가 분자 구조부터 세포에 미치는 효과까지 추론할 수 있도록 하는 것이 목표입니다. 장기적으로는 이를 **생성형 분자 설계**로 확장하여, 모델이 학습한 것을 새로운 약물 후보로 이어가고 싶습니다.',
]

export const aboutClosing = { before: '함께 이야기 나누고 싶으시면 언제든', after: '(으)로 연락 주세요.' }

export const news: NewsItem[] = [
  {
    date: 'Jun 2026',
    text: '💬 KCC2026에서 SJoINT를 포스터로 발표했습니다.',
    link: { label: 'KCC2026', href: 'https://www.kiise.or.kr/conference/kcc/2026/' },
  },
  {
    date: 'Oct 2025',
    text: '💬 BIOINFO2025에서 SJoINT를 포스터로 발표했습니다.',
    link: { label: 'BIOINFO2025', href: 'http://bioinfo2025.ksbi.or.kr/' },
  },
  {
    date: 'Jul 2025',
    text: '💬 KCC2025에서 MAGNET을 포스터로 발표했습니다.',
    link: { label: 'KCC2025', href: 'https://www.kiise.or.kr/conference/kcc/2025/' },
  },
  {
    date: 'Mar 2024',
    text: '🚀 동국대학교 PRISM Lab에 대학원 연구원으로 합류했습니다.',
  },
]

export const myAuthorTokens = ['Lee M.', 'M. Lee', 'Myungjin Lee']

export const projectGroups: ProjectGroup[] = [
  {
    heading: '연구',
    items: [
      {
        period: '2026',
        title: 'SJoINT: Substructure-Driven Junction Tree for Interpretable ADMET Prediction',
        authors: 'Lee M., Mo J., Kang M., Lim S.*',
        org: '논문 준비 중',
        status: '투고 준비 중',
        desc: '원자 수준 분자 그래프와 부분구조 수준 정션 트리를 구조 제약 양방향 cross-attention으로 통합하는 이중 관점 분자 표현학습 모델입니다. 데이터 증강 없는 대조학습으로 사전학습(ZINC250K)하며, MoleculeNet ADMET 및 MoleculeACE activity-cliff 과제에서 평가했습니다.',
        tags: ['Junction tree', 'Cross-attention', 'ADMET', 'Contrastive'],
        links: [{ label: 'GitHub', href: 'https://github.com/sslim-aidrug/SJoINT' }],
      },
      {
        period: '2026',
        title: 'MAGNET: Cross-view Molecular Graph Learning for Interpretable ADMET Prediction',
        authors: 'Mo J., Lee M., Lee S., Lim S.*',
        org: 'Bioinformatics (심사 중)',
        status: '심사 중',
        desc: 'MAGNET(Multi-view Aggregation of Graphs for Neural Embedding of Topologies)은 BRICS·정션 트리·Murcko 분해를 cross-view 메타그래프로 통합하는 다중 관점 분자 그래프 프레임워크입니다. ZINC250K로 다목적 자기지도 사전학습을 수행하고 ChemBERTa로 파인튜닝하여 10개 MoleculeNet ADMET 벤치마크에서 평가했습니다.',
        tags: ['Molecular graphs', 'Multi-view', 'ADMET', 'Self-supervised'],
        links: [{ label: 'GitHub', href: 'https://github.com/sslim-aidrug/MAGNET' }],
      },
    ],
    note: '* 교신저자. 굵게 표시된 이름이 본인입니다.',
  },
  {
    heading: '학술 발표',
    items: [
      {
        period: 'Jun 2026',
        title:
          'Structure-Constrained Bidirectional Cross-Attention for Self-Supervised Molecular Representation Learning',
        org: '포스터 · KCC2026, 한국정보과학회',
        status: '포스터',
        abstract:
          '분자를 정션 트리와 분자 그래프의 두 관점으로 표현하고 이를 구조 제약 양방향 cross-attention으로 통합하는 자기지도 분자 표현학습 프레임워크를 제안합니다. 원자–부분구조 대응 관계를 마스크로 반영해 대응 요소 간에만 정보를 교환하며, 데이터 증강 없이 동일 분자의 두 그래프 표현을 양성 쌍으로 사용한 대조학습을 수행합니다. MoleculeNet 9개 벤치마크에서 기존 GNN·사전학습 언어모델·자기지도 GNN 대비 경쟁력 있는 성능을 보였고, ablation을 통해 구조 제약 cross-attention과 이중 그래프 표현의 효과를 확인했습니다. 또한 attention 분석으로 예측 과제에 따라 원자–부분구조 관계가 선택적으로 반영됨을 보였습니다.',
        links: [{ label: 'Poster (PDF)', href: '/assets/kcc2026.pdf' }],
      },
      {
        period: 'Oct 2025',
        title: 'Weighted Junction-Tree Nodes for Enhanced Interpretability in ADMET Tasks',
        org: '포스터 · BIOINFO2025, 한국생명정보학회',
        status: '포스터',
        abstract:
          'ADMET(흡수·분포·대사·배설·독성) 등 분자 특성의 정확한 예측은 신약개발에서 매우 중요하지만, 예측 모델의 해석 가능성 확보는 여전히 과제입니다. 기존 GNN 기반 모델은 정확하나 어떤 하위구조가 특정 특성에 기여하는지 설명하지 못하는 “블랙박스” 한계가 있습니다. 본 연구는 분자 하위구조 정보를 명시적으로 활용해 정확성과 해석 가능성을 동시에 달성하는 이중 인코더 모델 SJoINT를 제안합니다. 원자 수준 분자 그래프와 정션 트리를 이중 입력으로 받아 반복적 cross-attention으로 두 표현의 관계를 학습하여 특정 ADMET 특성과 연관된 핵심 하위구조를 식별합니다. MoleculeNet 벤치마크의 독성 부작용 예측(SIDER) 과제에서 state-of-the-art 성능을 달성했습니다.',
        links: [{ label: 'Poster (PDF)', href: '/assets/bioinfo2025.pdf' }],
      },
      {
        period: 'Jul 2025',
        title:
          'Integrating Triple-View Chemical Graph Aggregation with Deep Topological Embedding for ADME Property Prediction',
        org: '포스터 · KCC2025, 한국정보과학회',
        status: '포스터',
        abstract:
          'SMILES 기반 분자 표현을 다양한 구조적 관점에서 해석하기 위해 세 가지 분해 기법(BRICS·Murcko scaffold·정션 트리)을 통합한 분자 구조 학습 프레임워크를 제안합니다. 각 분해 기법에서 추출한 하위구조를 triple-view 그래프로 구성하고 그래프 트랜스포머 기반 모델로 학습하여 복잡한 분자 구조 정보를 정밀하게 반영합니다. MoleculeNet 벤치마크에서 기존 모델 대비 우수한 성능을 보였고, ablation을 통해 세 분해 기법의 통합이 성능 향상에 핵심적으로 기여함을 확인했습니다.',
        links: [{ label: 'Poster (PDF)', href: '/assets/kcc2025.pdf' }],
      },
    ],
  },
  {
    heading: '연구비 수주',
    items: [
      {
        period: 'Sep 2024 – Aug 2025',
        title: '석사과정생 연구장려금지원사업',
        org: '과학기술정보통신부(MSIT)',
        role: 'Principal Investigator',
        status: '연구책임자',
        desc: '연구책임자(PI)로 선정된 개인 연구과제로, 작용기 정션 트리 기반 멀티태스크 분자 그래프 표현학습을 연구했습니다(SJoINT로 발전).\n지도교수: 임상수 교수.',
        tags: ['Graph Representation Learning', 'Multi-task Learning'],
      },
    ],
  },
  {
    heading: '참여 연구과제',
    items: [
      {
        period: 'Mar 2025 – Feb 2026',
        title: '멀티모달 AI 기반 노화연관 지방간질환(MASLD) 표적 발굴 및 약물 검증',
        org: '개인기초연구사업, 한국연구재단(MSIT)',
        pi: '임상수 교수 (동국대학교)',
        status: '참여연구원',
        desc: '노화연관 MASLD 표적 발굴을 위한 선행 오믹스·생물정보학 분석을 수행했습니다.\n공동연구: Gung Lee 박사 (Mayo Clinic, 미국).',
        abstract:
          '공개 데이터와 실험 in vitro 노화 assay(Mayo Clinic 협력)의 bulk·단일세포 RNA-seq를 정제·분석하여 QC → DEG → GSEA/ssGSEA → gene-set module scoring 파이프라인을 구축했습니다. 주로 노화 마우스 간에서 지질대사 재편과 세포노화 시그니처(SenMayo/SASP)를 규명하고, 공개 인간 데이터로 보조 교차 검증했습니다. 독립 데이터셋을 교차 비교하여 후보 유전자(Cd36, Psap, Ucp2, Sgpl1)와 Plin2 기반 노화세포 아형을 우선순위화하고, 후속 표적 검증을 위한 오믹스 근거를 마련했습니다.',
        moreLabel: '상세',
        tags: ['Single-cell RNA-seq', 'Bulk RNA-seq', 'Omics Analysis', 'Cellular Senescence'],
      },
      {
        period: 'Jul 2025 – Aug 2026',
        title: '개방형 AI 신약개발·데이터 분석 플랫폼 개발센터',
        org: '바이오의료기술개발사업, 한국연구재단(MSIT)',
        pi: '이민호 교수 (동국대학교, 주관)',
        status: '참여연구원',
        desc: '개방형 AI 신약개발 플랫폼(KISTI HPC)의 약물 재창출·ADMET 예측 분야를 담당했습니다.\nPRISM Lab을 통해 참여 (지도교수: 임상수 교수).',
        abstract:
          '약물 재창출: PrimeKG 기반 약물–질병–단백질 데이터를 정제하고, 5개 재창출 모델(TxGNN, DREAMWalk, DRHGCN, AMDGT, SVGA)을 190개 질환·3,379개 약물에 대해 동일 조건에서 평가하는 표준 벤치마크와 통합 실험 환경을 구축했습니다(사례: 고혈압). 질병 유사도와 임상적 약물–질병 관계를 반영한 DC-VGAE와 성능 기반 앙상블을 개발해 예측 정확도·안정성을 개선했습니다.\nADMET: 흡수·분포·대사·배설·독성 및 물리화학적 특성 예측 AI 모델을 벤치마킹·개발했으며, 분자를 하위구조(정션 트리·Murcko scaffold·BRICS)로 분해하고 cross-attention으로 통합하는 해석 가능한 ADMET 예측 모델을 포함합니다. MoleculeNet ADMET 및 MoleculeACE activity-cliff에서 원자·하위구조 수준 해석 가능성과 함께 검증했습니다.\n배포: 개발 모델을 Docker 이미지로 패키징하여 국가 바이오데이터 플랫폼(KBDI)에 배포했습니다.',
        moreLabel: '상세',
        tags: ['Drug Repurposing', 'ADMET', 'Knowledge Graph', 'Docker'],
        links: [{ label: 'KBDI ↗', href: 'https://kbdi.re.kr/main/mainVw.do' }],
      },
    ],
  },
  {
    heading: '공모전 및 응용 프로젝트',
    items: [
      {
        period: 'Aug 2024',
        title: '2024 Samsung AI Challenge — Machine Learning Force Fields',
        org: '삼성전자 SAIT · DACON',
        status: '상위 10% (11위)',
        desc: '반도체 소재 시뮬레이션을 위한 머신러닝 힘장(MLFF) 모델을 개발하여 원자 에너지·힘을 불확실성 정량화와 함께 예측하고, 고비용 DFT 계산을 대체했습니다. DAI 팀으로 전체 11위(상위 10%)를 기록했습니다.',
        tags: ['MLFF', 'Uncertainty', 'Simulation'],
        links: [
          { label: 'Competition', href: 'https://dacon.io/competitions/official/236322/overview/description' },
          { label: 'GitHub', href: 'https://github.com/myungjin00/2024_Samsung-MLFF-Challenge' },
        ],
      },
      {
        period: '2024',
        title: 'DREAM Olfactory Mixtures Prediction Challenge',
        org: '국제 DREAM Challenge · Sage Bionetworks (Synapse)',
        desc: '분자 혼합물의 화학 구조로부터 후각 유사도를 예측하는 그래프 신경망을 개발한 국제 커뮤니티 벤치마킹 챌린지입니다.',
        tags: ['Molecular ML', 'GNN', 'Olfaction'],
        links: [
          { label: 'Challenge', href: 'https://www.synapse.org/Synapse:syn53470621' },
          { label: 'GitHub', href: 'https://github.com/myungjin00/2024-DREAM-challenge' },
        ],
      },
    ],
  },
]

export const vitae: VitaeSection[] = [
  {
    heading: '연구 관심 분야',
    groups: [
      {
        title: 'AI 기반 신약개발',
        items: [
          'Molecular Graph Representation Learning',
          'ADMET Property Prediction',
          'Drug Repurposing',
          'Drug–Target Interaction (DTI)',
          'Drug Response Prediction',
          'Explainable AI (XAI)',
        ],
      },
      {
        title: '생물정보학을 위한 머신러닝·데이터마이닝',
        items: [
          'Multi-omics Data Integration',
          'Network Biology',
          'Differential Expression Analysis',
          'Dimensionality Reduction',
          'Multimodal AI for Biomedical Problems',
        ],
      },
    ],
  },
  {
    heading: '학력',
    items: [
      {
        period: 'Mar 2024 – Aug 2026',
        title: '컴퓨터·인공지능공학 석사',
        detail: '동국대학교 · 전공: AI in Healthcare and Medicine · 학점 4.04/4.5',
      },
      {
        period: 'Mar 2023 – Feb 2024',
        title: '산업경영공학 학사 (전공심화과정)',
        detail: '인덕대학교 · 딥러닝 융합 부전공 · 학점 4.43/4.5 · 수석 졸업',
      },
      {
        period: 'Mar 2020 – Feb 2023',
        title: '산업경영공학 공업전문학사',
        detail: '인덕대학교 · 학점 4.41/4.5 (전공 4.42/4.5) · 수석 졸업',
      },
    ],
  },
  {
    heading: '연구 경력',
    items: [
      {
        period: 'Mar 2024 – 현재',
        title: '대학원 연구원, PRISM Lab',
        detail:
          '동국대학교 (지도교수: [임상수 교수](https://scholar.google.com/citations?user=d19A738AAAAJ))',
      },
    ],
  },
  {
    heading: '기술 스택',
    items: [
      { period: '', title: '프로그래밍', detail: 'Python, R, Java, C#, JavaScript, SQL, HTML' },
      {
        period: '',
        title: '딥러닝',
        detail:
          'PyTorch, PyTorch Geometric, Hugging Face Transformers, scikit-learn, NumPy, Pandas',
      },
      { period: '', title: '화학정보학', detail: 'RDKit, DeepChem, TorchDrug, ChemPy' },
      {
        period: '',
        title: '생물정보학',
        detail:
          'Scanpy, Seurat, bulk & single-cell RNA-seq, differential expression (DESeq2 / PyDESeq2, MAST), GSEA / ssGSEA / GSVA, GO enrichment',
      },
      { period: '', title: '도구·데이터베이스', detail: 'Git, Linux, Docker, MySQL' },
    ],
  },
  {
    heading: '수상 및 장학',
    items: [
      {
        period: '2025',
        title: '최우수 논문상, 학부생 논문 부문 — KCC2025',
        detail: '한국컴퓨터종합학술대회(KCC), 한국정보과학회 · MAGNET (공저)',
      },
      {
        period: '2023',
        title: '최우수 학업상',
        detail: '인덕대학교',
      },
      {
        period: '2020–2023',
        title: '성적우수 장학금 — 매 학기 수혜',
        detail: '인덕대학교 · GRAPE 인재장학금 포함',
      },
    ],
  },
  {
    heading: '특허 및 SW 등록',
    items: [
      {
        period: 'Oct 2025',
        title: '분자 구조의 다중 시각 그래프 통합을 통한 임베딩 기법',
        detail: '소프트웨어 등록, 한국저작권위원회 · 제 C-2025-040207 호',
      },
      {
        period: '2025',
        title: '냄새 혼합물 데이터의 후각적 특성을 예측하는 시스템 및 동작 방법',
        detail: '국내 특허출원(심사 중), 제 10-2025-0003146 호',
      },
      {
        period: 'Nov 2024',
        title: '그래프 혼합물의 유사도 예측 딥러닝 모델',
        detail: '소프트웨어 등록, 한국저작권위원회 · 제 C-2024-042597 호',
      },
    ],
  },
  {
    heading: '어학',
    items: [
      { period: '', title: '한국어', detail: '모국어' },
      { period: '', title: '영어', detail: 'TOEIC 860 (LC 440 / RC 420)' },
    ],
  },
]

export const contact = {
  intro:
    '팀, 연구자, 동료 여러분과 언제든 소통하고 싶습니다. 아래 채널로 편하게 연락 주세요.',
  links: [
    { label: '이메일', value: 'leemj637@gmail.com', href: 'mailto:leemj637@gmail.com', desc: '언제든 연락 주세요' },
    { label: 'GitHub', value: 'github.com/myungjin00', href: 'https://github.com/myungjin00', desc: '코드·프로젝트' },
    { label: 'CV (PDF)', value: 'CV 보기', href: '/assets/cv.pdf', desc: '전체 이력서' },
  ],
}

export const ui = {
  nav: { about: '소개', projects: '프로젝트', news: '소식', vitae: '이력', contact: '연락처' },
  page: { projects: '프로젝트', news: '소식', vitae: '이력서 (CV)', contact: '연락처' },
  aboutNews: '소식',
  aboutProjects: '프로젝트',
  more: '더보기 →',
  abstract: '초록',
  piLabel: '연구책임자:',
  searchPlaceholder: '프로젝트·기술·논문 검색…',
  noMatches: '검색 결과가 없습니다.',
  emailWord: '이메일',
  vitaeNote: '요약 이력서입니다.',
  footer: '© 2026 이명진 · 동국대학교',
}
