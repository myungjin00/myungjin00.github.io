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
    period: 'Sep 2024 – now',
    role: 'First author',
  },
  {
    slug: 'magnet',
    title: 'MAGNET',
    line: 'Three ways to cut a molecule into fragments, joined into one meta-graph.',
    axis: 'mol',
    period: 'Nov 2024 – now',
    role: 'Second author',
  },
  {
    slug: 'masld',
    title: 'Aging-related MASLD',
    line: 'A curated database of public liver transcriptomes, and what they say about aging.',
    axis: 'cell',
    // the grant ran Mar 2025 – Feb 2026; the analysis and the manuscript did not stop with it
    period: 'Mar 2025 – now',
    role: 'Participating researcher',
  },
  {
    slug: 'lipid',
    title: 'Lipids and the SASP',
    line: 'How much lipid a senescent cell carries, and how loudly it signals.',
    axis: 'cell',
    period: 'May 2024 – now',
    role: 'Analysis',
  },
  {
    slug: 'repurposing',
    title: 'Drug repurposing benchmark & KBDI',
    line: 'A knowledge-graph benchmark over 3,379 drugs and 935 diseases, deployed on KBDI.',
    axis: 'bridge',
    period: 'Jul 2025 – now',
    role: 'Participating researcher',
  },
]
