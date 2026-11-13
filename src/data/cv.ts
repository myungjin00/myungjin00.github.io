// =============================================================================
//  CV CONTENT — edit this file to update the site. Nothing else needs touching.
// =============================================================================

export const profile = {
  name: 'Myungjin Lee',
  nameKo: '이명진',
  // First name is rendered bold, like the reference site.
  firstName: 'Myungjin',
  lastName: 'Lee',
  role: 'M.E. in Computer Science & Artificial Intelligence',
  major: 'AI in Healthcare and Medicine',
  // Keyword line under the name — what I do. Degree/lab shown on its own line below.
  headline: 'AI for Drug Discovery · Molecular Property Prediction · Graph Learning · XAI',
  degree: 'M.E. · Post-Master Researcher',
  location: 'Seoul, South Korea',
  lab: { label: 'PRISM Lab (Dongguk Univ.)', href: 'https://sangsoolim.notion.site' },
  // External nav link (e.g. Notion notes/blog). Opens in a new tab.
  notes: {
    label: 'blog',
    href: 'https://myungjinlee.notion.site/Myungjin-s-Notes-3baa81750c2e80388ed7e6e6676f308c',
  },
  // Place the image file at public/assets/profile_2609.jpg (portrait works best).
  photo: '/assets/profile_2609.jpg',
  email: 'leemj637@gmail.com',
  links: [
    { label: 'Email', href: 'mailto:leemj637@gmail.com' },
    { label: 'GitHub', href: 'https://github.com/myungjin00' },
    { label: 'CV (PDF)', href: 'assets/MyungjinLee_CV.pdf' },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/myungjin00' },
  ],
}


// Closing call-to-action on the About page.
// "here" links to the CV (PDF); the word "e-mail" is rendered as a mailto link.
export const aboutClosing = {
  before: 'More of the work is under',
  hereLabel: 'Research',
  hereHref: 'assets/MyungjinLee_CV.pdf',
  mid: ' \u2014 the fastest way to reach me is',
  after: '.',
}

// ---------------------------------------------------------------------------
export type NewsItem = { date: string; text: string; link?: { label: string; href: string } }

export const news: NewsItem[] = [
  {
    date: 'Nov 2026',
    text: '💬 Presenting SJoINT as a poster at BIOINFO/GIW ISCB-Asia 2026, Korea.',
    link: { label: 'BIOINFO/GIW ISCB-Asia 2026', href: 'https://giw2026.ksbi.or.kr/' },
  },
  {
    date: 'Sep 2026',
    text: '💻 Continuing at PRISM Lab, Dongguk University, as a post-master researcher.',
  },
  {
    date: 'Aug 2026',
    text: '🎓 Graduated with my M.E. in Computer Science and Artificial Intelligence from Dongguk University.',
  },
  {
    date: 'Jun 2026',
    text: '💬 Presented SJoINT as a poster at KCC2026, Korea.',
    link: { label: 'KCC2026', href: 'https://www.kiise.or.kr/conference/kcc/2026/' },
  },
  {
    date: 'Oct 2025',
    text: '💬 Presented SJoINT as a poster at BIOINFO2025, Korea.',
    link: { label: 'BIOINFO2025', href: 'http://bioinfo2025.ksbi.or.kr/' },
  },
  {
    date: 'Sep 2024',
    text: '🌱 Received a Research Subsidy for Master’s Students (IITP, MSIT) as Principal Investigator.',
  },
  {
    date: 'Jan 2024',
    text: '🚀 Joined PRISM Lab at Dongguk University as a graduate researcher.',
  },
]

// ---------------------------------------------------------------------------
// PROJECTS — grouped. Research works (manuscripts), funded research projects
// (연구과제), and competitions / applied projects.
export type Project = {
  period: string
  title: string
  authors?: string // for research works; own name in `myAuthorTokens` is highlighted
  org?: string // funding agency / venue / competition host
  pi?: string // Principal Investigator (for funded projects where I participate)
  collab?: string // Collaborator (rendered on its own line under PI)
  role?: string
  status?: string // e.g. 'Under review', 'In preparation', 'Top 10%'
  desc?: string
  abstract?: string // optional expandable long text (e.g. abstract / project details)
  moreLabel?: string // button label for the expandable text (default: 'Abstract')
  tags?: string[]
  links?: { label: string; href: string }[]
}
export type ProjectGroup = { heading: string; items: Project[]; note?: string }

// Your name as it appears in author lists (for bold/underline highlighting).

export const projectGroups: ProjectGroup[] = [
  {
    heading: 'Manuscripts',
    items: [
      {
        period: '2026',
        title: 'SJoINT: Substructure-Driven Junction Tree for Interpretable Molecular Property Prediction',
        authors: 'Lee M., Mo J., Kang M., Lim S.*',
        status: 'Under review',
        desc: 'Dual-view molecular representation learning fusing atom-level graphs and substructure-level junction trees via structure-constrained bidirectional cross-attention, with augmentation-free contrastive pretraining on ZINC250k; evaluated on the nine MoleculeNet property-prediction datasets and the MoleculeACE activity-cliff benchmark.',
        tags: ['Junction tree', 'Cross-attention', 'Interpretability', 'Contrastive pretraining'],
        links: [{ label: 'GitHub', href: 'https://github.com/sslim-aidrug/SJoINT' }],
      },
      {
        period: '2026',
        title: 'Cross-view structural consensus for interpretable molecular property prediction',
        authors: 'Mo J., Lee M., Lee S., Lim S.*',
        status: 'Under review',
        desc: 'Molecular graph learning framework integrating BRICS, junction-tree and Murcko scaffold decompositions through explicit fragment correspondences in a unified meta-graph, with multi-objective self-supervised pretraining (graph contrastive learning, descriptor prediction, graph–SMILES alignment), evaluated on molecular property benchmarks.\n**My role:** contributed to the experiments, the figures and the manuscript.',
        tags: ['Molecular graphs', 'Multi-view', 'Molecular property prediction', 'Self-supervised'],
        links: [{ label: 'GitHub', href: 'https://github.com/sslim-aidrug/MAGNET' }],
      },
      {
        period: '2026',
        title: 'Lipid abundance and lysophospholipid signaling regulate the senescence-associated secretory phenotype',
        authors: 'Lee G., Byeon S.K., Olaleye O.E., Han Y., Lee M., Vizioli M.G., Ogrodnik M., Pirius N., Sales Gomez L., Victorelli S., Khosla S., Pandey A., Passos J., Lim S., Jurk D.*',
        org: 'Collaboration with Mayo Clinic',
        status: 'In preparation',
        desc: 'How lipid abundance and lysophospholipid signalling relate to the senescence-associated secretory phenotype, across public, in vitro and in vivo senescence models.\n**My role:** the transcriptomic analysis across public, _in vitro_ and _in vivo_ senescence data.',
        tags: ['Senescence', 'SASP', 'Lipidomics', 'Aging'],
      },
    ],
    note: '* Corresponding author. My name is shown in bold.',
  },
  {
    heading: 'Publications',
    items: [
      {
        period: 'Jun 2026',
        title: 'Structure-Constrained Bidirectional Cross-Attention for Self-Supervised Molecular Representation Learning',
        authors: 'Lee M., Mo J., Lim S.*',
        org: 'Proceedings of the Korea Computer Congress (KCC) 2026, KIISE, pp. 291–293',
        status: 'Conference paper',
        desc: 'Self-supervised molecular representation learning that integrates junction-tree and molecular-graph views via structure-constrained bidirectional cross-attention, with augmentation-free contrastive pretraining; evaluated on nine MoleculeNet benchmarks.',
        tags: ['Junction tree', 'Cross-attention', 'Contrastive pretraining'],
        links: [{ label: 'DBpia', href: 'https://www.dbpia.co.kr/journal/articleDetail?nodeId=NODE12929290' }],
      },
    ],
  },
  {
    heading: 'Presentations',
    items: [
      {
        period: 'Nov 2026',
        title:
          'Cross-attentive Integration of Atom-level and Junction-tree Representations for Molecular Property Prediction',
        org: 'Poster · BIOINFO/GIW ISCB-Asia 2026, Yonsei University, Korea',
        status: 'Poster',
      },
      {
        period: 'Jun 2026',
        title:
          'Structure-Constrained Bidirectional Cross-Attention for Self-Supervised Molecular Representation Learning',
        org: 'Poster · KCC2026, KIISE, ICC Jeju, Korea',
        status: 'Poster',
      },
      {
        period: 'Oct 2025',
        title: 'Weighted Junction-Tree Nodes for Enhanced Interpretability in ADMET Tasks',
        org: 'Poster · BIOINFO2025, KSBI, Suwon Convention Center, Korea',
        status: 'Poster',
      },
    ],
  },
  {
    // Grants where Myungjin is the Principal Investigator (연구책임자).
    heading: 'Grants',
    items: [
      {
        period: 'Sep 2024 – Aug 2025',
        title: '석사과정생 연구장려금지원사업 (Research Subsidies for Master’s Students)',
        org: 'IITP (MSIT) · No. S-2025-A0434-00016',
        role: 'Principal Investigator',
        status: 'PI',
        desc: 'Individual grant for research on junction-tree-based multi-task molecular graph representation learning. The direction became SJoINT.',
        tags: ['Graph Representation Learning', 'Multi-task Learning'],
      },
    ],
  },
  {
    // 연구과제 참여 — funded projects where Myungjin did actual research (참여연구원).
    // RULE: only list projects you genuinely contributed to — not stipend-only.
    heading: 'Funded Research Projects',
    items: [
      {
        period: 'Mar 2025 – Feb 2026',
        title: '멀티모달 AI 기반 노화연관 지방간질환(MASLD) 표적 발굴 및 약물 검증 (Multimodal AI-Based Target Discovery and Drug Validation in Aging-Related Metabolic Dysfunction-Associated Steatotic Liver Disease)',
        org: 'Individual Basic Research Program, NRF (MSIT) · No. RS-2025-00560523',
        pi: 'Dr. Sangsoo Lim (Dongguk University)',
        collab: 'Dr. Gung Lee (Mayo Clinic, USA)',
        status: 'Participating Researcher',
        desc: 'Transcriptomic database construction and disease-progression analysis for aging-related MASLD.',
        abstract:
          'Curated public bulk and single-cell RNA-seq datasets into an integrated database for aging-related MASLD and defined stages of disease progression. Analyzed stage-wise gene expression changes, with functional enrichment (GSEA using GO, KEGG, Reactome, and Hallmark gene sets) and cellular-senescence gene-set analysis (SenMayo, SHGS).',
        moreLabel: 'Details',
        tags: ['Single-cell RNA-seq', 'Bulk RNA-seq', 'Omics Analysis', 'Cellular Senescence'],
      },
      {
        period: 'Jul 2025 – Present',
        title: '개방형 AI 신약개발·데이터 분석 플랫폼 개발센터 (Open Platform Center for AI-Powered Drug Discovery and Analytics)',
        org: 'Bio & Medical Technology Development Program, NRF (MSIT) · No. RS-2025-18732993',
        pi: 'Dr. Minho Lee (Dongguk University)',
        status: 'Participating Researcher',
        desc: 'Led the drug-repurposing and molecular property prediction tracks of an open-access AI drug-discovery platform on KISTI HPC.',
        abstract:
          'Drug repurposing: curated drug–disease–protein data from PrimeKG and built a standardized benchmark and unified experimental environment to evaluate five repurposing models (TxGNN, DREAMwalk, DRHGCN, AMDGT, SVGA) under identical conditions over 3,379 drugs and 935 diseases, with 190 diseases held out for testing (case study: hypertension). Developed DC-VGAE, which incorporates disease similarity and clinical drug–disease relationships, and a performance-based ensemble.\nMolecular property prediction: benchmarked 13 models for physicochemical-property and toxicity prediction on nine MoleculeNet datasets, and developed an interpretable model that decomposes molecules into substructures (junction tree, Murcko scaffold, BRICS) and integrates these views via cross-attention, validated on MoleculeNet ADMET datasets and MoleculeACE activity-cliff targets with atom- and substructure-level interpretability.\nDeployment: packaged each benchmarked model as a container carrying its weights, data and reproduction command, and registered nineteen — the eighteen benchmarked ones and DC-VGAE — together with the curated PrimeKG graph, on the national bio-data platform (KBDI).',
        moreLabel: 'Details',
        tags: ['Drug Repurposing', 'Molecular Property Prediction', 'Knowledge Graph', 'Docker'],
        links: [{ label: 'KBDI', href: 'https://kbdi.re.kr/main/mainVw.do' }],
      },
    ],
  },
  {
    heading: 'Competitions & Applied Projects',
    items: [
      {
        period: 'Aug 2024 – Sep 2024',
        title: '2024 Samsung AI Challenge — Machine Learning Force Fields',
        org: 'Samsung Electronics SAIT · DACON',
        status: 'Top 10% (11th)',
        desc: 'Built machine-learning force fields (MLFFs) to predict atomic energies and forces — with uncertainty quantification — for semiconductor-material simulation, replacing costly DFT calculations. Competed as team DAI.',
        tags: ['MLFF', 'Uncertainty', 'Simulation'],
        links: [
          { label: 'Competition', href: 'https://dacon.io/competitions/official/236322/overview/description' },
          { label: 'GitHub', href: 'https://github.com/myungjin00/2024_Samsung-MLFF-Challenge' },
        ],
      },
      {
        period: 'Apr 2024 – Aug 2024',
        title: 'DREAM Olfactory Mixtures Prediction Challenge',
        org: 'International DREAM Challenge · Sage Bionetworks (Synapse)',
        desc: 'Built a graph neural network to predict the olfactory similarity of molecular mixtures from their chemical structures, in an international benchmarking challenge.',
        tags: ['Molecular ML', 'GNN', 'Olfaction'],
        links: [
          { label: 'Challenge', href: 'https://www.synapse.org/Synapse:syn53470621' },
          { label: 'GitHub', href: 'https://github.com/myungjin00/2024-DREAM-challenge' },
        ],
      },
    ],
  },
]

// ---------------------------------------------------------------------------
export type VitaeItem = {
  period: string
  title: string
  detail?: string
  abstract?: string // optional expandable abstract (e.g. for presentations)
  links?: { label: string; href: string }[] // e.g. Poster (PDF)
}
export type VitaeSection =
  | { heading: string; keywords: string[] }
  | { heading: string; groups: { title: string; items: string[] }[] }
  | { heading: string; items: VitaeItem[] }
  | { heading: string; subsections: { subheading: string; items: VitaeItem[] }[] }

export const vitae: VitaeSection[] = [
  {
    heading: 'Research Interests',
    groups: [
      {
        title: 'AI for Drug Discovery',
        items: [
          'Molecular Graph Representation Learning',
          'Molecular Property Prediction',
          'Drug Repurposing',
          'Explainable AI (XAI)',
        ],
      },
      {
        title: 'Machine Learning & Data Mining for Bioinformatics',
        items: [
          'Network Biology',
          'Omics-based Target Discovery',
          'Multimodal AI for Biomedical Problems',
        ],
      },
    ],
  },
  {
    heading: 'Education',
    items: [
      {
        period: 'Mar 2024 – Aug 2026',
        title: 'M.E. in Computer Science and Artificial Intelligence',
        detail:
          'Dongguk University, Seoul, Korea · Advisor: Dr. Sangsoo Lim · Major: AI in Healthcare and Medicine · GPA 4.04/4.5\n**Thesis:** _Graph Substructure-Based Junction Tree Modeling for Drug ADMET Prediction_',
      },
      {
        period: 'Mar 2023 – Feb 2024',
        title: 'B.E. in Industrial & Management Engineering (Advanced Major Program)',
        detail:
          'Induk University, Seoul, Korea · Convergence Minor in Deep Learning · GPA 4.43/4.5 · Graduated with honors',
      },
      {
        period: 'Mar 2020 – Feb 2023',
        title: 'A.E. in Industrial & Management Engineering',
        detail: 'Induk University, Seoul, Korea · GPA 4.41/4.5 (Major 4.42/4.5) · Valedictorian',
      },
    ],
  },
  {
    heading: 'Research Experience',
    items: [
      {
        period: 'Jan 2024 – Present',
        title: 'PRISM Lab, Dongguk University',
        detail:
          '**Position:** Post-Master Researcher (Sep 2026 – Present) · Graduate Researcher (Jan 2024 – Aug 2026)\n**Advisor:** [Dr. Sangsoo Lim](https://scholar.google.com/citations?user=d19A738AAAAJ) · Seoul, Korea\n**Role:** Molecular graph representation learning and explainable AI for drug discovery: interpretable molecular property prediction from molecular substructures (first-author _SJoINT_; second-author _MAGNET_).\nAlso a drug-repurposing benchmark of nineteen containerised models registered on the national bio-data platform (KBDI); and bulk and single-cell RNA-seq analysis of cellular senescence and aging-related MASLD with Mayo Clinic collaborators.',
      },
    ],
  },
  {
    heading: 'Technical Skills',
    items: [
      { period: '', title: 'Programming', detail: 'Python, R (basic), Java, C#, JavaScript, SQL' },
      {
        period: '',
        title: 'Deep Learning',
        detail:
          'PyTorch, PyTorch Geometric, Hugging Face Transformers, scikit-learn, GNNExplainer',
      },
      {
        period: '',
        title: 'Data Analysis & Visualisation',
        detail: 'pandas, NumPy, anndata, NetworkX, seaborn, matplotlib',
      },
      { period: '', title: 'Cheminformatics', detail: 'RDKit, DeepChem, TorchDrug, Chemprop' },
      {
        period: '',
        title: 'Bioinformatics',
        // Non-breaking spaces keep each term intact; wraps only at the commas.
        detail:
          'Scanpy, Seurat, bulk & single-cell RNA-seq analysis, differential expression (DESeq2 / PyDESeq2, MAST), GSEA / ssGSEA / GSVA, GO enrichment',
      },
      { period: '', title: 'Tools & Databases', detail: 'Git, Linux, Docker, MySQL' },
    ],
  },
  {
    heading: 'Honors & Awards',
    items: [
      {
        period: '2023',
        title: 'Highest Academic Achievement Award',
        detail: 'Induk University, Korea',
      },
      // Merit scholarships — summarized as one line (do not list every semester).
      {
        period: '2020–2023',
        title: 'Merit-based Academic Scholarship — awarded every semester',
        detail: 'Induk University, Korea · incl. GRAPE Talent Scholarship',
      },
    ],
  },
  {
    heading: 'Patents & Software Registrations',
    items: [
      {
        period: 'Oct 2025',
        title:
          'An Embedding Method via Multi-view Graph Integration of Molecular Structures',
        detail: 'Software Registration, Korea Copyright Commission · No. C-2025-040207',
      },
      {
        period: 'Jan 2025',
        title: 'System and Method for Predicting Olfactory Characteristics of Odor Mixture Data',
        detail: 'Korean Patent Application (pending), No. 10-2025-0003146',
      },
      {
        period: 'Nov 2024',
        title: 'Deep Learning Model for Similarity Prediction of Graph-based Mixtures',
        detail: 'Software Registration, Korea Copyright Commission · No. C-2024-042597',
      },
    ],
  },
  {
    heading: 'Languages',
    items: [
      { period: '', title: 'Korean', detail: 'Native' },
      { period: '', title: 'English', detail: 'TOEIC 860 (LC 440 / RC 420) · OPIc IH' },
    ],
  },
]

// ---------------------------------------------------------------------------
export const contact = {
  intro:
    'I am glad to hear from research teams, and from anyone working on molecular or omics data.',
  links: [
    { label: 'Email', value: 'leemj637@gmail.com', href: 'mailto:leemj637@gmail.com', desc: 'Usually the quickest reply' },
    { label: 'CV (PDF)', value: 'View CV', href: 'assets/MyungjinLee_CV.pdf', desc: 'Full curriculum vitae' },
    { label: 'GitHub', value: 'myungjin00', href: 'https://github.com/myungjin00', desc: 'Code & projects' },
    { label: 'LinkedIn', value: 'myungjin00', href: 'https://www.linkedin.com/in/myungjin00', desc: 'Professional profile' },
  ],
}

