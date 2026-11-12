// Every meta-graph must be one connected component: an isolated fragment node means the
// molecule's own decompositions do not overlap anywhere, which is a definition bug, not a
// drawing bug. Run from the repo root: node scripts/check-scenes.mjs
import { views, molecule, caseCount, caseName } from '../src/scripts/scenes/molecule.js'
import assert from 'node:assert'

let bad = 0
for (let i = 0; i < caseCount; i++) {
  const V = views(i), m = molecule(i)
  const deg = V.nodes.map(() => 0)
  V.edges.forEach(e => { deg[e.a]++; deg[e.b]++ })
  const lone = deg.map((d, j) => (d === 0 ? `${V.nodes[j].name}{${V.nodes[j].atoms}}` : null)).filter(Boolean)

  // and the junction tree itself has to be a tree: every node but the root shares an atom with its parent
  const broken = m.subs.map((s, j) => {
    if (s.parent < 0) return null
    const shared = s.atoms.filter(a => m.subs[s.parent].atoms.includes(a))
    return shared.length ? null : `${j}:${s.name} has no atom in common with its parent ${s.parent}`
  }).filter(Boolean)

  const atomCount = m.atoms.length
  const covered = new Set(m.subs.flatMap(s => s.atoms))
  const missed = [...Array(atomCount).keys()].filter(a => !covered.has(a))

  console.log(`${caseName(i).padEnd(16)} nodes=${String(V.nodes.length).padStart(2)} edges=${String(V.edges.length).padStart(2)}` +
    `  isolated=[${lone}]  jt=[${broken}]  uncovered atoms=[${missed}]`)
  if (lone.length || broken.length || missed.length) bad++
}
assert.equal(bad, 0, `${bad} case(s) have a disconnected meta-graph, a broken junction tree, or uncovered atoms`)
console.log('ok')
