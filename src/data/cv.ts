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
  // Keyword line under the name — what I do, ending with current status.
  // The lab (below) is appended as a link after this text.
  headline:
    'AI for Drug Discovery · ADMET Prediction · Graph Learning · XAI · M.S.',
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
  'I hold an **M.S. in Computer Science and Artificial Intelligence** from **Dongguk University** _(major: AI in Healthcare and Medicine)_. I earned a **B.S. in Industrial & Management Engineering** from Induk University, where I graduated as **valedictorian**. I am now seeking **industry roles** where I can apply machine learning to **drug discovery** and molecular data.',
  'My work focuses on **AI for drug discovery**, centered on **ADMET prediction** and **molecular graph learning**. I build **interpretable models** that use **attention** to reveal which molecular substructures drive each prediction, so the model’s reasoning stays **transparent and traceable** rather than opaque. Building on this, I have developed models that fuse **complementary molecular views and multiple modalities** for more reliable prediction — two of which are now being **finalized for submission** and are **under peer review**.',
  'Looking ahead, I want to advance **drug discovery** through research centered on **interpretable AI** and **graph learning**. I am also comfortable working across **multiple modalities**, and I want to explore how combining these techniques can strengthen both the **capability and interpretability** of AI in real-world settings.',
]

// Closing call-to-action on the About page. The word "e-mail" is rendered as a mailto link.
export const aboutClosing = 'If you’d like to connect, feel free to reach out anytime by'

// ---------------------------------------------------------------------------
export type NewsItem = { date: string; text: string; link?: { label: string; href: string } }

export const news: NewsItem[] = [
  {
    date: 'Jun 2026',
    text: '💬 Presented SJoINT as a poster at KCC 2026, Korea.',
    link: { label: 'KCC 2026', href: 'https://www.kiise.or.kr/conference/kcc/2026/' },
  },
  {
    date: 'Oct 2025',
    text: '💬 Presented SJoINT as a poster at BIOINFO 2025, Korea.',
    link: { label: 'BIOINFO 2025', href: 'http://bioinfo2025.ksbi.or.kr/' },
  },
  {
    date: 'Jul 2025',
    text: '💬 Presented MAGNET as a poster at KCC 2025, Korea.',
    link: { label: 'KCC 2025', href: 'https://www.kiise.or.kr/conference/kcc/2025/' },
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
        desc: 'Multimodal AI for target discovery and drug validation in aging-related metabolic fatty liver disease (MASLD).',
        tags: ['Multimodal AI', 'Drug Discovery', 'Bioinformatics'],
      },
      {
        period: 'Jul 2025 – Aug 2026',
        title: 'Open AI Drug Discovery and Data Analysis Platform Center',
        org: 'Bio & Medical Technology Development Program, NRF (MSIT)',
        pi: 'Dr. Minho Lee (Dongguk University)',
        status: 'Participating Researcher',
        desc: 'Development of an open platform for AI-driven drug discovery and biomedical data analysis; participated through PRISM Lab (Co-Investigator: Dr. Sangsoo Lim).',
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
export type VitaeItem = { period: string; title: string; detail?: string }
export type VitaeSection =
  | { heading: string; keywords: string[] }
  | { heading: string; items: VitaeItem[] }
  | { heading: string; subsections: { subheading: string; items: VitaeItem[] }[] }

export const vitae: VitaeSection[] = [
  {
    heading: 'Research Interests',
    keywords: [
      'AI for Drug Discovery',
      'Molecular Graph Representation Learning',
      'Molecular Property Prediction (ADMET)',
      'Cheminformatics',
      'Bioinformatics',
      'Graph Neural Networks',
      'Deep Learning',
      'Data Mining',
      'Network Biology',
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
        title: 'Best Paper Award, Undergraduate Paper Track — KCC 2025',
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
