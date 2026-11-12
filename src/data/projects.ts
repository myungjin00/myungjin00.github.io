// Project pages. Each one opens with its own scene (see src/scripts/scenes/).
export type ProjectCard = {
  slug: string
  title: string
  line: string
  axis: 'mol' | 'cell' | 'bridge'
  period: string
  role: string
}

// in order of importance, which is also the order I joined them
export const projects: ProjectCard[] = [
  {
    slug: 'sjoint',
    title: 'SJoINT',
    line: 'Reading a molecule twice, as atoms and as substructures, with structure-constrained cross-attention.',
    axis: 'mol',
    period: '2024 – now',
    role: 'First author',
  },
  {
    slug: 'magnet',
    title: 'MAGNET',
    line: 'Three ways to cut a molecule into fragments, joined into one meta-graph.',
    axis: 'mol',
    period: '2025 – now',
    role: 'Second author',
  },
  {
    slug: 'aging',
    title: 'Aging liver & senescence',
    line: 'Bulk and single-cell transcriptomes of cellular senescence and aging-related MASLD.',
    axis: 'cell',
    period: 'Mar 2025 – now',
    role: 'Analysis, with Mayo Clinic',
  },
  {
    slug: 'repurposing',
    title: 'Drug repurposing',
    line: 'A knowledge-graph benchmark across 190 diseases and 3,379 drugs, deployed on KBDI.',
    axis: 'bridge',
    period: 'Jul 2025 – Aug 2026',
    role: 'Participating researcher',
  },
]
