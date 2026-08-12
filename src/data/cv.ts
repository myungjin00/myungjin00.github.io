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
  // Short "what I do" line shown under the name (replaces the lab tag).
  headline: 'Machine Learning Researcher — Molecular AI for Drug Discovery',
  lab: { label: '@PRISM Lab', href: 'https://sangsoolim.notion.site' },
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

// About-page bio paragraphs (rendered in order).
export const bio: string[] = [
  'I am a machine learning researcher focused on molecular graph representation learning for drug discovery. I design self-supervised pretraining and multi-view graph architectures that turn molecular structure into transferable, interpretable representations for ADMET and molecular property prediction. I am completing my M.S. in Computer Science and Artificial Intelligence (AI in Healthcare and Medicine) at Dongguk University.',
  'As first author, I built SJoINT, a dual-view model that fuses atom-level molecular graphs with substructure-level junction trees through structure-constrained cross-attention and augmentation-free contrastive pretraining. I also co-authored MAGNET, a multi-view fragmentation framework with self-supervised pretraining on ZINC250K for interpretable ADMET prediction — recognized with an award at KCC 2025 and currently under journal review. I led an individual research grant as Principal Investigator and contributed to national AI drug-discovery research projects.',
]

// Closing paragraph on the About page (industry-oriented).
export const aboutClosing =
  'I work end-to-end — from data curation and pretraining to fine-tuning and model interpretation — primarily in PyTorch, PyTorch Geometric, and RDKit. I am now looking for industry roles in AI for drug discovery and molecular machine learning, where I can turn chemical and biomedical data into reliable, interpretable predictions.'

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
        status: 'In preparation',
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
        period: '2024–2025', // Sep 2024 – Aug 2025
        title: 'Master’s Student Research Grant (석사과정생 연구장려금지원사업)',
        org: 'Ministry of Science and ICT (MSIT)',
        role: 'Principal Investigator',
        status: 'PI',
        desc: 'Individual research grant awarded as PI. Topic: multi-task graph representation learning centered on functional-group junction trees. Advisor: Dr. Sangsoo Lim.',
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
        status: 'Participating Researcher',
        desc: 'Multimodal AI for target discovery and drug validation in aging-related metabolic fatty liver disease (MASLD).',
        tags: ['Multimodal AI', 'Drug Discovery', 'Bioinformatics'],
      },
      {
        period: 'Jul 2025 – Aug 2026',
        title: 'Open AI Drug Discovery and Data Analysis Platform Center',
        org: 'Bio & Medical Technology Development Program, NRF (MSIT)',
        status: 'Participating Researcher',
        desc: 'Development of an open platform for AI-driven drug discovery and biomedical data analysis.',
        tags: ['AI Drug Discovery', 'Data Analysis'],
      },
    ],
  },
  {
    heading: 'Competitions & Applied Projects',
    items: [
      {
        period: '2024',
        title: 'Samsung AI Challenge — ML Force Fields',
        org: 'Samsung',
        status: 'Top 10%',
        desc: 'Machine Learning Force Fields for semiconductor material simulation.',
        tags: ['MLFF', 'Simulation'],
        links: [{ label: 'GitHub', href: 'https://github.com/myungjin00/2024_Samsung-MLFF-Challenge' }],
      },
      {
        period: '2024',
        title: 'DREAM Challenge — Odor Similarity Prediction',
        desc: 'Deep learning model for olfactory similarity between molecular mixtures.',
        tags: ['Molecular ML', 'GNN'],
        links: [{ label: 'GitHub', href: 'https://github.com/myungjin00/2024-DREAM-challenge' }],
      },
      {
        period: '2025',
        title: 'MASLD GO Enrichment Analysis',
        desc: 'Gene Ontology enrichment analysis and visualization for MASLD studies.',
        tags: ['Bioinformatics'],
        links: [{ label: 'GitHub', href: 'https://github.com/myungjin00/MASLD_GO_enrichment_plots' }],
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
        detail: 'Induk University, Seoul, Korea · GPA 4.43/4.5 · Valedictorian (1st in class)',
      },
      {
        period: 'Mar 2020 – Feb 2023',
        title: 'Associate Degree in Industrial & Management Engineering',
        detail:
          'Induk University, Seoul, Korea · GPA 4.41/4.5 (Major 4.42/4.5) · Valedictorian (1st in class)',
      },
    ],
  },
  {
    heading: 'Research Experience',
    items: [
      {
        period: 'Mar 2024 – Present',
        title: 'Graduate Researcher, PRISM Lab',
        detail: 'Dongguk University, Seoul, Korea (Advisor: Dr. Sangsoo Lim)',
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
        period: 'Aug 2024',
        title: 'Top 10% — Samsung AI Challenge (ML Force Fields)',
        detail: 'Machine Learning Force Fields for semiconductor material simulation',
      },
      // Merit scholarships — summarized as one line (do not list every semester).
      {
        period: '2020–2023',
        title: 'Merit-based Academic Scholarships (multiple semesters)',
        detail:
          'Induk University, Korea · incl. Highest Academic Excellence (2022) and GRAPE Talent Scholarship',
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
      { period: '', title: 'Programming', detail: 'Python, Java, C#, JavaScript, SQL, HTML' },
      { period: '', title: 'ML / Deep Learning', detail: 'PyTorch, PyTorch Geometric, scikit-learn, Pandas, NumPy' },
      {
        period: '',
        title: 'Cheminformatics / Bioinformatics',
        detail: 'RDKit, Scanpy, PyDESeq2, GO / Enrichment Analysis',
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
