// Scene: how SJoINT reads one molecule, in four beats, looping over a few molecules.
//   1  a molecule
//   2  read twice — atoms below (orange), the substructures they form above (green)
//   3  membership: each atom joined only to the substructures that contain it
//   4  the two views side by side, exchanging information over those links alone
// Schematic, not data.
import { molecule, caseCount } from './molecule.js'

export function sjointFlow(cv) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
  const box = cv.parentElement, ctx = cv.getContext('2d')
  const css = getComputedStyle(document.documentElement)
  const v = n => css.getPropertyValue(n).trim()
  let MUTED, GREEN, ATOM
  const readTheme = () => { MUTED = v('--muted'); GREEN = v('--green'); ATOM = v('--atom') }
  readTheme()
  const onTheme = () => { readTheme(); if (reduce && ready) draw() }
  new MutationObserver(onTheme).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })

  let W = 0, H = 0, dpr = 1, ready = false
  const resize = () => {
    const r = box.getBoundingClientRect()
    dpr = devicePixelRatio || 1; W = r.width; H = r.height
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr)
    if (reduce && ready) draw()  // setting cv.width clears it, and there is no loop to repaint
  }
  new ResizeObserver(resize).observe(box); resize()

  let ci = 0, mol = molecule(ci)
  const HOLD = 1.25                                  // seconds each substructure holds the floor
  const LEAD = .45                                   // the two views pull apart first
  const DUR = [1.8, 1.8, 2.0, 0]
  const retime = () => { DUR[3] = LEAD + HOLD * mol.subs.length }
  retime()
  const beatOf = x => Math.min(3, Math.max(0, Math.floor(x)))
  let t = 0, last = performance.now(), running = false

  const ease = x => (x < 0 ? 0 : x > 1 ? 1 : x < .5 ? 2 * x * x : 1 - (-2 * x + 2) ** 2 / 2)
  const lerp = (a, b, k) => a + (b - a) * k

  // beats 1-3 stack the two levels on one centre; beat 4 moves them apart, left and right
  const LEFT = () => W * .27, RIGHT_X0 = () => W * .60, RIGHT_X1 = () => W * .93, MID = () => W * .50
  const RIGHT = () => (RIGHT_X0() + RIGHT_X1()) / 2
  const S = () => Math.min(W * .30, H * .80)

  // A tidy tree: depth from the root, and a row from a depth-first walk with each parent
  // centred over its children. Laying nodes out by index instead let a parent-child edge run
  // straight through an unrelated node, which read as a connection that is not there.
  function layout(m) {
    const kids = m.subs.map(() => [])
    let root = 0
    m.subs.forEach((x, j) => { if (x.parent >= 0) kids[x.parent].push(j); else root = j })
    const depth = Array(m.subs.length).fill(0), row = Array(m.subs.length).fill(0)
    let next = 0
    const walk = (j, d) => {
      depth[j] = d
      if (!kids[j].length) { row[j] = next++; return }
      const rs = kids[j].map(k => { walk(k, d + 1); return row[k] })
      row[j] = (Math.min(...rs) + Math.max(...rs)) / 2
    }
    walk(root, 0)
    return { depth, row, maxD: Math.max(1, ...depth), maxR: Math.max(1, ...row) }
  }
  let tree = layout(mol)

  function atomPos(i, split, part) {
    const a = mol.atoms[i]
    const x = lerp(lerp(MID(), MID(), split), LEFT(), part)
    const y = lerp(lerp(H * .50, H * .70, split), H * .55, part)
    const s = lerp(lerp(S(), S() * .60, split), S() * .78, part)
    return { x: x + (a.x - .55) * s, y: y + (a.y - .44) * s }
  }
  function subPos(j, split, part) {
    const d = tree.depth[j] / tree.maxD, r = tree.row[j] / tree.maxR
    // stacked above the molecule: the tree runs left to right, deepening downward
    const spread = Math.min(W * .34, H * .95)
    const x1 = MID() + (r - .5) * spread, y1 = H * (.07 + d * .17)
    // beside the molecule: the same tree turned on its side, root nearest the atoms
    const x2 = RIGHT_X0() + d * (RIGHT_X1() - RIGHT_X0())
    const y2 = H * (.18 + r * .64)
    return { x: lerp(x1, x2, part), y: lerp(y1, y2, part) }
  }

  const label = (s, x, y, col, size = 10.5, align = 'left') => {
    ctx.font = `${size}px ${v('--mono') || 'ui-monospace, monospace'}`
    ctx.textAlign = align; ctx.textBaseline = 'middle'; ctx.fillStyle = col
    ctx.fillText(s, x, y)
  }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, W, H)
    const beat = beatOf(t)
    const split = ease(t - 1)
    const member = ease((t - 2) * 1.1)
    const part = ease((t - 3) * 1.4)
    const talk = Math.max(0, Math.min(1, (t - 3 - LEAD / DUR[3] * .8) * 3))
    // which substructure currently has the floor, and how settled it is
    const nSub = mol.subs.length
    const frac = LEAD / DUR[3]                        // where the sweep starts inside beat 4
    const sweep = Math.max(0, (t - 3 - frac)) / ((1 - frac) / nSub)
    const focus = t >= 3 + frac ? Math.min(nSub - 1, Math.floor(sweep)) : -1
    const held = Math.min(1, (sweep % 1) * 4)

    ctx.lineWidth = 1.5; ctx.strokeStyle = ATOM; ctx.globalAlpha = .5
    for (const [a, b] of mol.bonds) {
      const p = atomPos(a, split, part), q = atomPos(b, split, part)
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke()
    }
    ctx.globalAlpha = 1

    if (split > .02) {
      ctx.globalAlpha = split * .55; ctx.strokeStyle = GREEN; ctx.lineWidth = 1.5
      for (let j = 0; j < mol.subs.length; j++) {
        const s = mol.subs[j]
        if (s.parent < 0) continue
        const p = subPos(j, split, part), q = subPos(s.parent, split, part)
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke()
      }
      ctx.fillStyle = GREEN
      for (let j = 0; j < mol.subs.length; j++) {
        const p = subPos(j, split, part), on = focus < 0 || j === focus
        ctx.globalAlpha = split * (on ? 1 : .3)
        ctx.beginPath(); ctx.arc(p.x, p.y, on && focus >= 0 ? 10 : 7.5, 0, 6.2832); ctx.fill()
      }
      ctx.globalAlpha = 1
    }

    if (member > .02) {
      ctx.lineWidth = 1
      mol.member.forEach(([i, j], m) => {
        const k = Math.min(1, member * 1.5 - (m % 9) * .05)
        if (k <= 0) return
        const p = atomPos(i, split, part), q = subPos(j, split, part)
        const on = focus < 0 || j === focus
        ctx.strokeStyle = on ? GREEN : MUTED
        ctx.lineWidth = on && focus >= 0 ? 1.5 : 1
        ctx.globalAlpha = (focus < 0 ? .3 : on ? .55 * held : .07) * k
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(lerp(p.x, q.x, k), lerp(p.y, q.y, k)); ctx.stroke()
      })
      ctx.globalAlpha = 1
    }

    // beat 4: packets travelling both ways, and only along membership links
    if (talk > .02 && focus >= 0) {
      const now = performance.now() / 1000
      mol.member.forEach(([i, j], m) => {
        if (j !== focus) return
        const p = atomPos(i, split, part), q = subPos(j, split, part)
        for (const dir of [0, 1]) {
          const u = (now * .7 + m * .17 + dir * .5) % 1
          const k = dir ? 1 - u : u
          ctx.globalAlpha = talk * held * Math.sin(Math.PI * u)
          ctx.fillStyle = dir ? ATOM : GREEN
          ctx.beginPath(); ctx.arc(lerp(p.x, q.x, k), lerp(p.y, q.y, k), 3, 0, 6.2832); ctx.fill()
        }
      })
      ctx.globalAlpha = 1
    }

    const inFocus = focus >= 0 ? new Set(mol.subs[focus].atoms) : null
    ctx.fillStyle = ATOM
    for (let i = 0; i < mol.atoms.length; i++) {
      const p = atomPos(i, split, part), on = !inFocus || inFocus.has(i)
      ctx.globalAlpha = on ? 1 : .32
      ctx.beginPath(); ctx.arc(p.x, p.y, on && inFocus ? 6 : 4.4, 0, 6.2832); ctx.fill()
    }
    ctx.globalAlpha = 1

    if (part > .35) {
      ctx.globalAlpha = Math.min(1, (part - .35) / .5)
      label('molecular graph', LEFT(), H * .07, ATOM, 10.5, 'center')
      if (focus < 0) label('junction tree', RIGHT(), H * .07, GREEN, 10.5, 'center')
      ctx.globalAlpha = 1
    } else if (split > .5) {
      ctx.globalAlpha = Math.min(1, (split - .5) * 2) * Math.max(0, 1 - part * 3)
      label('substructure level', 14, H * .09, GREEN, 10)
      label('atom level', 14, H * .72, ATOM, 10)
      ctx.globalAlpha = 1
    }

    const CAPS = ['one molecule', 'read twice — atoms, and the substructures they form',
      'membership: each atom joined only to the substructures containing it',
      'cross-attention: one substructure at a time, and only its own atoms answer']
    label(`${beat + 1}. ${CAPS[beat]}`, 14, H - 14, MUTED, 11)
    label(mol.name, W - 14, H - 14, MUTED, 10, 'right')
    if (focus >= 0) {
      label(mol.subs[focus].name, RIGHT(), H * .07, GREEN, 11, 'center')
      label(`${focus + 1} / ${mol.subs.length}`, RIGHT(), H * .125, MUTED, 10, 'center')
    }
  }

  function frame(now) {
    const dt = Math.max(0, Math.min(.05, (now - last) / 1000)); last = now
    if (running) {
      t += dt / DUR[beatOf(t)]
      if (t >= 4) { t = 0; ci = (ci + 1) % caseCount; mol = molecule(ci); tree = layout(mol); retime() }   // next molecule
    }
    if (running) draw()
    requestAnimationFrame(frame)
  }

  new IntersectionObserver(es => { running = es[0].isIntersecting }, { threshold: .2 }).observe(cv)
  ready = true
  if (reduce) { t = 3.9; draw() } else requestAnimationFrame(frame)
}
