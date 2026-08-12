// =============================================================================
//  CV CONTENT — edit this file to update the site. Nothing else needs touching.
//  Items marked  // TODO  are placeholders to fill in later.
// =============================================================================

export const profile = {
  name: 'Myungjin Lee',
  nameKo: '이명진',
  // First name is rendered bold, like the reference site.
  firstName: 'Myungjin',
  lastName: 'Lee',
  role: 'M.S. in Computer Science & Artificial Intelligence',
  major: 'AI in Healthcare and Medicine',
  // Keyword line under the name — what I do. Degree/lab shown on its own line below.
  headline: 'AI for Drug Discovery · ADMET Prediction · Graph Learning · XAI',
  degree: 'M.S.',
  location: 'Seoul, South Korea',
  lab: { label: 'PRISM Lab', href: 'https://sangsoolim.notion.site' },
  // Place the image file at public/assets/profile.jpg (portrait works best).
  photo: '/assets/profile.jpg',
  email: 'leemj637@gmail.com',
  links: [
    { label: 'Email', href: 'mailto:leemj637@gmail.com' },
    { label: 'GitHub', href: 'https://github.com/myungjin00' },
    // { label: 'LinkedIn', href: '' },   // TODO
    // { label: 'CV (PDF)', href: '' },    // TODO
  ],
}

// About-page bio paragraphs (rendered in order). First-person narrative.
export const bio: string[] = [
  'I hold an **M.S. in Computer Science and Artificial Intelligence** from Dongguk University _(major: AI in Healthcare and Medicine)_. I earned a B.S. in Industrial & Management Engineering from Induk University, where I graduated as **valedictorian**. I am now seeking industry roles where I can apply machine learning to **drug discovery** and molecular data.',
  'My work focuses on **AI for drug discovery**, centered on ADMET prediction and molecular graph learning. I build **interpretable models** that use attention to reveal which molecular substructures drive each prediction, so the model’s reasoning stays transparent and traceable rather than opaque. Building on this, I have developed models that fuse complementary molecular views and multiple modalities for more reliable prediction — two of which are now being finalized for submission and are **under peer review**.',
  'Looking ahead, I want to advance drug discovery through research centered on **interpretable AI** and **graph learning**. I am also comfortable working across multiple modalities, and I want to explore how combining these techniques can strengthen both the capability and interpretability of AI in real-world settings.',
]

// Closing call-to-action on the About page. The word "e-mail" is rendered as a mailto link.
export const aboutClosing = 'If you’d like to connect, feel free to reach out anytime by'

// ---------------------------------------------------------------------------
export type NewsItem = { date: string; text: string; link?: { label: string; href: string } }

export const news: NewsItem[] = [
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
    date: 'Jul 2025',
    text: '💬 Presented MAGNET as a poster at KCC2025, Korea.',
    link: { label: 'KCC2025', href: 'https://www.kiise.or.kr/conference/kcc/2025/' },
  },
  {
    date: 'Mar 2024',
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
  role?: string
  status?: string // e.g. 'Under review', 'In preparation', 'Top 10%'
  desc?: string
  abstract?: string // optional expandable abstract (e.g. for presentations)
  tags?: string[]
  links?: { label: string; href: string }[]
}
export type ProjectGroup = { heading: string; items: Project[]; note?: string }

// Your name as it appears in author lists (for bold/underline highlighting).
export const myAuthorTokens = ['Lee M.', 'M. Lee', 'Myungjin Lee']

export const projectGroups: ProjectGroup[] = [
  {
    heading: 'Research',
    items: [
      {
        period: '2026',
        title: 'MAGNET: Cross-view Molecular Graph Learning for Interpretable ADMET Prediction',
        authors: 'Mo J., Lee M., Lee S., Lim S.*',
        org: 'Bioinformatics (under review) · Poster, KCC 2025',
        status: 'Under review',
        desc: 'Multi-view molecular graph framework (MAGNET = Multi-view Aggregation of Graphs for Neural Embedding of Topologies) integrating BRICS, junction-tree, and Murcko fragmentations via cross-view meta-graphs, with multi-objective self-supervised pretraining on ZINC250K and ChemBERTa-enhanced fine-tuning across 10 MoleculeNet ADMET benchmarks.',
        tags: ['Molecular graphs', 'Multi-view', 'ADMET', 'Self-supervised'],
        links: [{ label: 'GitHub', href: 'https://github.com/sslim-aidrug/MAGNET' }],
      },
      {
        period: '2026',
        title: 'SJoINT: Substructure-Driven Junction Tree for Interpretable ADMET Prediction',
        authors: 'Lee M., Mo J., Kang M., Lim S.*',
        org: 'Manuscript in preparation',
        status: 'Preparing submission',
        desc: 'Dual-view molecular representation learning fusing atom-level graphs and substructure-level junction trees via structure-constrained bidirectional cross-attention, with augmentation-free contrastive pretraining on ZINC250K; evaluated on MoleculeNet ADMET and MoleculeACE activity-cliff tasks.',
        tags: ['Junction tree', 'Cross-attention', 'ADMET', 'Contrastive'],
        links: [{ label: 'GitHub', href: 'https://github.com/sslim-aidrug/SJoINT' }],
      },
    ],
    note: '* Corresponding author. Names in bold indicate the CV owner.',
  },
  {
    heading: 'Presentations',
    items: [
      {
        period: 'Jun 2026',
        title:
          'Structure-Constrained Bidirectional Cross-Attention for Self-Supervised Molecular Representation Learning',
        org: 'Poster · SJoINT · KCC2026, KIISE, Korea',
        status: 'Poster',
        abstract:
          'We propose a self-supervised molecular representation learning framework that represents each molecule from two perspectives — a junction tree and a molecular graph — and integrates them via structure-constrained bidirectional cross-attention. The method encodes atom–substructure correspondence as a mask so that information is exchanged only between corresponding elements, and it performs contrastive learning using the two graph representations of the same molecule as a positive pair, without any data augmentation. On nine MoleculeNet benchmarks, the method shows competitive performance against conventional GNNs, pretrained language models, and self-supervised GNNs, and ablation studies confirm the effect of the structure-constrained bidirectional cross-attention and the dual-graph representation. Attention analysis further shows that atom–substructure relationships are selectively reflected depending on the prediction task, suggesting that augmentation-free self-supervised learning reflecting structural correspondence can be effective for molecular property prediction.',
        links: [{ label: 'Poster (PDF)', href: '/assets/kcc2026.pdf' }],
      },
      {
        period: 'Oct 2025',
        title: 'Weighted Junction-Tree Nodes for Enhanced Interpretability in ADMET Tasks',
        org: 'Poster · SJoINT · BIOINFO2025, KSBI, Korea',
        status: 'Poster',
        abstract:
          'Accurate prediction of molecular properties such as absorption, distribution, metabolism, excretion, and toxicity (ADMET) is crucial in the drug discovery process; however, ensuring the interpretability of prediction models remains a significant challenge. Although existing Graph Neural Network (GNN)-based models demonstrate high predictive accuracy, they often suffer from the “black box” limitation of failing to explain which molecular substructures contribute to specific properties. We propose SJoINT, a dual-encoder model that explicitly utilizes molecular substructure information to achieve both accuracy and interpretability. SJoINT takes an atom-level molecular graph and a corresponding junction tree — representing the molecular scaffold and functional groups — as dual inputs, and learns the relationship between the two representations through an iterative cross-attention mechanism, enabling it to identify the key substructures associated with particular ADMET properties. On the MoleculeNet benchmark, SJoINT achieves state-of-the-art performance on the SIDER task for predicting toxic side effects, demonstrating the effectiveness of integrating micro-level (atomic) and macro-level (substructure) information for complex drug toxicity profiles. Overall, SJoINT provides accurate predictions while offering interpretable insights into the relationship between molecular substructures and drug properties.',
        links: [{ label: 'Poster (PDF)', href: '/assets/bioinfo2025.pdf' }],
      },
      {
        period: 'Jul 2025',
        title:
          'Integrating Triple-View Chemical Graph Aggregation with Deep Topological Embedding for ADME Property Prediction',
        org: 'Poster · MAGNET · KCC2025, KIISE, Korea',
        status: 'Poster',
        abstract:
          'We propose a molecular structure learning framework that integrates three fragmentation methods — BRICS, Murcko scaffold, and Junction Tree — to interpret SMILES-based molecular representations from multiple structural perspectives. Substructures extracted from each fragmentation method are organized into a triple-view graph and learned with a graph-transformer-based model, allowing the framework to precisely capture complex molecular structural information. On prediction tasks using the MoleculeNet benchmark, the proposed framework outperforms existing models, and ablation studies confirm that integrating the three fragmentation methods contributes crucially to the performance gains. This work demonstrates the potential for interpretable modeling of structural complexity and is expected to serve as a foundational technique for precise representation learning in drug design and molecular generation.',
        links: [{ label: 'Poster (PDF)', href: '/assets/kcc2025.pdf' }],
      },
    ],
  },
  {
    // Grants where Myungjin is the Principal Investigator (연구책임자).
    heading: 'Grants',
    items: [
      {
        period: 'Sep 2024 – Aug 2025',
        title: 'Master’s Student Research Grant (석사과정생 연구장려금지원사업)',
        org: 'Ministry of Science and ICT (MSIT)',
        role: 'Principal Investigator',
        status: 'PI',
        desc: 'Individual research grant awarded as Principal Investigator, funding my own research on functional-group junction-tree-based multi-task molecular graph representation learning — the direction developed into SJoINT.\nAdvisor: Dr. Sangsoo Lim.',
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
        title:
          'Multimodal AI-based Target Discovery and Drug Validation for Aging-related MASLD',
        org: 'Individual Basic Research Program, NRF (MSIT)',
        pi: 'Dr. Sangsoo Lim (Dongguk University)',
        status: 'Participating Researcher',
        desc: 'Multimodal AI for target discovery and drug validation in aging-related metabolic fatty liver disease (MASLD).\nCollaborator: Dr. Gung Lee (Mayo Clinic, USA).',
        tags: ['Multimodal AI', 'Drug Discovery', 'Bioinformatics'],
      },
      {
        period: 'Jul 2025 – Aug 2026',
        title: 'Open AI Drug Discovery and Data Analysis Platform Center',
        org: 'Bio & Medical Technology Development Program, NRF (MSIT)',
        pi: 'Dr. Minho Lee (Dongguk University, host)',
        status: 'Participating Researcher',
        desc: 'Development of an open platform for AI-driven drug discovery and biomedical data analysis; participated through PRISM Lab (Advisor: Dr. Sangsoo Lim).',
        tags: ['AI Drug Discovery', 'Data Analysis'],
      },
    ],
  },
  {
    heading: 'Competitions & Applied Projects',
    items: [
      {
        period: 'Aug 2024',
        title: 'Samsung AI Challenge — ML Force Fields',
        org: 'Samsung',
        status: 'Top 10%',
        desc: 'Built machine-learning force fields (MLFF) to predict atomic energies and forces for semiconductor-material simulation, replacing costly DFT calculations. Ranked top 10%.',
        tags: ['MLFF', 'Simulation', 'Deep Learning'],
        links: [{ label: 'GitHub', href: 'https://github.com/myungjin00/2024_Samsung-MLFF-Challenge' }],
      },
      {
        period: '2024',
        title: 'DREAM Challenge — Odor Similarity Prediction',
        desc: 'Built a graph neural network that predicts olfactory (odor) similarity between molecular mixtures from their chemical structures.',
        tags: ['Molecular ML', 'GNN'],
        links: [{ label: 'GitHub', href: 'https://github.com/myungjin00/2024-DREAM-challenge' }],
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
    // TODO — refine the exact sub-items with the user later.
    groups: [
      {
        title: 'AI for Drug Discovery',
        items: [
          'Molecular Graph Representation Learning',
          'ADMET Property Prediction',
          'Drug Response Prediction',
          'Generative AI for Molecular Design',
        ],
      },
      {
        title: 'Machine Learning & Data Mining for Bioinformatics',
        items: [
          'Multi-omics Data Integration',
          'Network Biology',
          'Dimensionality Reduction',
          'Virtual Cell Construction',
        ],
      },
      {
        title: 'Multimodal & Healthcare AI',
        items: [
          'Multimodal AI for Biomedical Problems',
          'Spatial Transcriptomics',
          'Biomedical Knowledge Graph Representation',
          'Agentic AI for Biomedicine',
        ],
      },
    ],
  },
  {
    heading: 'Education',
    items: [
      {
        period: 'Mar 2024 – Aug 2026',
        title: 'M.S. in Computer Science and Artificial Intelligence',
        detail:
          'Dongguk University, Seoul, Korea · Major: AI in Healthcare and Medicine · GPA 4.04/4.5',
      },
      {
        period: 'Mar 2023 – Feb 2024',
        title: 'B.S. in Industrial & Management Engineering (Advanced Major Program)',
        detail:
          'Induk University, Seoul, Korea · Convergence Minor in Deep Learning · GPA 4.43/4.5 · Valedictorian',
      },
      {
        period: 'Mar 2020 – Feb 2023',
        title: 'Associate of Engineering in Industrial & Management Engineering',
        detail: 'Induk University, Seoul, Korea · GPA 4.41/4.5 (Major 4.42/4.5) · Valedictorian',
      },
    ],
  },
  {
    heading: 'Research Experience',
    items: [
      {
        period: 'Mar 2024 – Present',
        title: 'Graduate Researcher, PRISM Lab',
        detail:
          'Dongguk University, Seoul, Korea (Advisor: [Dr. Sangsoo Lim](https://scholar.google.com/citations?user=d19A738AAAAJ))',
      },
    ],
  },
  {
    heading: 'Honors & Awards',
    items: [
      {
        period: '2025',
        title: 'Best Paper Award, Undergraduate Paper Track — KCC2025',
        detail: 'Korea Computer Congress (KCC), KIISE, Korea · MAGNET (co-author)',
      },
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
        period: '2025',
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
    heading: 'Technical Skills',
    items: [
      { period: '', title: 'Programming', detail: 'Python, R, Java, C#, JavaScript, SQL, HTML' },
      {
        period: '',
        title: 'ML / Deep Learning',
        detail: 'PyTorch, PyTorch Geometric, scikit-learn, Pandas, NumPy',
      },
      { period: '', title: 'Cheminformatics', detail: 'RDKit, DeepChem, TorchDrug, ChemPy' },
      {
        period: '',
        title: 'Bioinformatics',
        detail: 'Scanpy, differential expression analysis (PyDESeq2, MAST), GO / enrichment analysis',
      },
      { period: '', title: 'Databases', detail: 'MySQL' },
    ],
  },
  {
    heading: 'Languages',
    items: [
      { period: '', title: 'Korean', detail: 'Native' },
      { period: '', title: 'English', detail: 'TOEIC 860 (LC 440 / RC 420)' },
    ],
  },
]

// ---------------------------------------------------------------------------
export const contact = {
  intro:
    'I’m always happy to connect with teams, researchers, and fellow students. Feel free to reach out through any of the channels below.',
  links: [
    { label: 'Email', value: 'leemj637@gmail.com', href: 'mailto:leemj637@gmail.com', desc: 'Reach out anytime' },
    { label: 'GitHub', value: 'github.com/myungjin00', href: 'https://github.com/myungjin00', desc: 'Code & projects' },
    // { label: 'LinkedIn', value: '', href: '', desc: 'Professional profile' }, // TODO
    // { label: 'CV (PDF)', value: 'Download CV', href: '', desc: 'Full curriculum vitae' }, // TODO
  ],
}
