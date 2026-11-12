// A few schematic molecules, shared by the SJoINT and MAGNET scenes. Coordinates are 0..1 in
// both axes, heavy atoms only, and the decompositions are written out rather than computed —
// the point is to show what a decomposition is, not to re-implement RDKit in a hero figure.
//
// Each case gives: atoms, bonds, a junction tree (ring systems, the bonds that leave them, and
// the groups on the far side), a Murcko framework, and a BRICS cut.

const CASES = [
  {
    name: 'aspirin',
    atoms: [
      [.42, .36], [.56, .44], [.56, .60], [.42, .68], [.28, .60], [.28, .44],
      [.42, .20], [.29, .12], [.56, .12],
      [.70, .36], [.84, .44], [.84, .60], [.97, .36],
    ],
    bonds: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0], [0, 6], [6, 7], [6, 8], [1, 9], [9, 10], [10, 11], [10, 12]],
    jt: [
      { atoms: [0, 1, 2, 3, 4, 5], parent: -1, name: 'ring' },
      { atoms: [0, 6], parent: 0, name: 'bond' },
      { atoms: [6, 7, 8], parent: 1, name: 'carboxyl' },
      { atoms: [1, 9], parent: 0, name: 'bond' },
      { atoms: [9, 10, 11, 12], parent: 3, name: 'acetyl' },
    ],
    murcko: [{ atoms: [0, 1, 2, 3, 4, 5], name: 'scaffold' }],
    brics: [
      { atoms: [0, 1, 2, 3, 4, 5, 6, 7, 8], name: 'ring + acid' },
      { atoms: [9, 10, 11, 12], name: 'acetyl' },
    ],
  },
  {
    // two rings joined by a short linker — the case where Murcko keeps more than one ring
    name: 'biaryl amide',
    atoms: [
      [.16, .34], [.28, .27], [.40, .34], [.40, .48], [.28, .55], [.16, .48],
      [.52, .55], [.52, .69], [.64, .76],
      [.76, .69], [.88, .76], [.99, .69], [.99, .55], [.88, .48], [.76, .55],
      [.64, .90], [.04, .27],
    ],
    bonds: [
      [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0],
      [3, 6], [6, 7], [7, 8], [8, 15],
      [8, 9], [9, 10], [10, 11], [11, 12], [12, 13], [13, 14], [14, 9],
      [0, 16],
    ],
    jt: [
      { atoms: [0, 1, 2, 3, 4, 5], parent: -1, name: 'ring A' },
      { atoms: [3, 6], parent: 0, name: 'bond' },
      { atoms: [6, 7], parent: 1, name: 'linker' },
      { atoms: [7, 8, 15], parent: 2, name: 'amide' },
      { atoms: [8, 9], parent: 3, name: 'bond' },
      { atoms: [9, 10, 11, 12, 13, 14], parent: 4, name: 'ring B' },
      { atoms: [0, 16], parent: 0, name: 'bond' },
    ],
    murcko: [
      { atoms: [0, 1, 2, 3, 4, 5], name: 'ring A' },
      { atoms: [9, 10, 11, 12, 13, 14], name: 'ring B' },
      { atoms: [3, 6, 7, 8], name: 'linker' },
    ],
    brics: [
      { atoms: [0, 1, 2, 3, 4, 5, 16], name: 'ring A' },
      { atoms: [6, 7, 8, 15], name: 'amide linker' },
      { atoms: [9, 10, 11, 12, 13, 14], name: 'ring B' },
    ],
  },
  {
    // a fused bicycle with a side chain: the three views disagree most here
    name: 'fused bicycle',
    atoms: [
      [.22, .40], [.34, .32], [.46, .40], [.46, .56], [.34, .64], [.22, .56],
      [.58, .32], [.70, .40], [.70, .56], [.58, .64],
      [.82, .32], [.94, .40], [.10, .32],
    ],
    bonds: [
      [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0],
      [2, 6], [6, 7], [7, 8], [8, 9], [9, 3],
      [7, 10], [10, 11], [0, 12],
    ],
    jt: [
      { atoms: [0, 1, 2, 3, 4, 5], parent: -1, name: 'ring A' },
      { atoms: [2, 3, 6, 7, 8, 9], parent: 0, name: 'ring B' },
      { atoms: [7, 10], parent: 1, name: 'bond' },
      { atoms: [10, 11], parent: 2, name: 'chain' },
      { atoms: [0, 12], parent: 0, name: 'bond' },
    ],
    murcko: [{ atoms: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], name: 'fused scaffold' }],
    brics: [
      { atoms: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 12], name: 'bicycle' },
      { atoms: [10, 11], name: 'chain' },
    ],
  },
]

export const caseCount = CASES.length
export const caseName = i => CASES[i % CASES.length].name
const C = i => CASES[i % CASES.length]
const key = a => [...a].sort((x, y) => x - y).join(',')

// the atom graph, the junction tree above it, and which atoms belong to which tree node
export function molecule(ci = 0) {
  const c = C(ci)
  const atoms = c.atoms.map(([x, y]) => ({ x, y }))
  const n = c.jt.length
  const subs = c.jt.map((s, j) => ({ ...s, slot: n === 1 ? .5 : j / (n - 1) }))
  const member = []
  subs.forEach((s, j) => s.atoms.forEach(i => member.push([i, j])))
  return { atoms, bonds: c.bonds, subs, member, name: c.name }
}

// The three views MAGNET keeps, and the meta-graph they collapse into. Fragments covering
// exactly the same atoms become one node; the rest are joined wherever they share atoms, with
// the edge weight set by how much of the smaller fragment the overlap covers.
export function views(ci = 0) {
  const c = C(ci)
  const list = [
    { key: 'jt', label: 'junction tree', frags: c.jt.map(f => ({ atoms: f.atoms, name: f.name })) },
    { key: 'murcko', label: 'Murcko scaffold', frags: c.murcko.map(f => ({ ...f })) },
    { key: 'brics', label: 'BRICS', frags: c.brics.map(f => ({ ...f })) },
  ]
  const all = []
  list.forEach((v, vi) => v.frags.forEach(f => all.push({ ...f, view: vi, k: key(f.atoms) })))

  const byKey = new Map()
  for (const f of all) {
    if (!byKey.has(f.k)) byKey.set(f.k, { atoms: f.atoms, name: f.name, views: [] })
    byKey.get(f.k).views.push(f.view)
  }
  const nodes = [...byKey.values()]
  all.forEach(f => { f.node = nodes.findIndex(x => key(x.atoms) === f.k) })

  const edges = []
  for (let a = 0; a < nodes.length; a++) for (let b = a + 1; b < nodes.length; b++) {
    const shared = nodes[a].atoms.filter(i => nodes[b].atoms.includes(i)).length
    if (shared) edges.push({ a, b, w: shared / Math.min(nodes[a].atoms.length, nodes[b].atoms.length) })
  }
  return { views: list, all, nodes, edges }
}

export const atomsOf = ci => C(ci).atoms
