// Scene: how MAGNET builds a meta-graph, in four beats.
//   1  a molecule
//   2  three decompositions of it, side by side — junction tree, Murcko scaffold, BRICS
//   3  fragments covering exactly the same atoms collapse into one node
//   4  the rest are joined wherever they share atoms, thicker where the overlap is larger
// Plays once when it comes into view, then holds. Schematic, not data.
import { molecule, views, atomsOf, caseCount } from './molecule.js'

export function magnetFlow(cv) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
  const box = cv.parentElement, ctx = cv.getContext('2d')
  const css = getComputedStyle(document.documentElement)
  const v = n => css.getPropertyValue(n).trim()
  let SOFT, MUTED, LINE, GREEN, ATOM, PAL
  const readTheme = () => {
    SOFT = v('--soft'); MUTED = v('--muted'); LINE = v('--line'); GREEN = v('--green'); ATOM = v('--atom')
    // one colour per fragment, so a blob on a copy and its node in the meta-graph are the same
    // thing seen twice. No purple, per the site's palette.
    PAL = [v('--green'), v('--blue'), v('--bio'), v('--ref'), v('--ginkgo'), v('--leaf'), v('--maple')]
  }
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

  let ci = 0, mol = molecule(ci), V = views(ci), XY = atomsOf(ci)
  const DUR = [1.6, 2.4, 2.2, 3.6]
  const beatOf = x => Math.min(3, Math.max(0, Math.floor(x)))
  let t = 0, last = performance.now(), running = false

  const ease = x => (x < 0 ? 0 : x > 1 ? 1 : x < .5 ? 2 * x * x : 1 - (-2 * x + 2) ** 2 / 2)
  const lerp = (a, b, k) => a + (b - a) * k

  // beat 1 draws one molecule centred; beat 2 draws the same molecule three times, in a row
  const ROWY = [.22, .50, .78]
  const SCALE = () => Math.min(W * .16, H * .30)
  const BIG = () => Math.min(W * .30, H * .78)
  const COPY_X = () => W * .22
  const META_X = () => W * .70

  function atomXY(i, row, k) {
    const [ax, ay] = XY[i]
    const bx = W * .42 + (ax - .55) * BIG(), by = H * .5 + (ay - .44) * BIG()
    const sx = COPY_X() + (ax - .55) * SCALE(), sy = H * ROWY[row] + (ay - .44) * SCALE()
    return { x: lerp(bx, sx, k), y: lerp(by, sy, k) }
  }

  // where each meta-graph node lands, laid out around a ring on the right
  const metaPos = j => {
    const n = V.nodes.length, a = -Math.PI / 2 + (j / n) * 6.2832
    const r = Math.min(W * .14, H * .34)
    return { x: META_X() + Math.cos(a) * r, y: H * .5 + Math.sin(a) * r * .9 }
  }

  const label = (s, x, y, col, size = 10.5, align = 'left') => {
    ctx.font = `${size}px ${v('--mono') || 'ui-monospace, monospace'}`
    ctx.textAlign = align; ctx.textBaseline = 'middle'; ctx.fillStyle = col
    ctx.fillText(s, x, y)
  }

  // a node two views agree on is no longer any single view's fragment, so it goes grey
  const nodeCol = j => (V.nodes[j].views.length > 1 ? MUTED : PAL[j % PAL.length])

  // a fragment drawn as a rounded blob over the atoms it covers
  function blob(pts, pad, col, alpha, fill) {
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9
    for (const p of pts) { x0 = Math.min(x0, p.x); y0 = Math.min(y0, p.y); x1 = Math.max(x1, p.x); y1 = Math.max(y1, p.y) }
    ctx.globalAlpha = alpha
    ctx.beginPath()
    ctx.roundRect(x0 - pad, y0 - pad, x1 - x0 + pad * 2, y1 - y0 + pad * 2, pad)
    if (fill) { ctx.fillStyle = col; ctx.fill() } else { ctx.strokeStyle = col; ctx.lineWidth = 1.4; ctx.stroke() }
    ctx.globalAlpha = 1
  }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, W, H)
    const beat = beatOf(t)
    const spread = ease(t - 1)        // one molecule becomes three copies
    const merge = ease(t - 2)         // fragments leave the copies and become meta-graph nodes
    const link = ease(t - 3)          // the meta-graph edges draw in

    // ---- the molecule (or its three copies)
    const rows = spread > .02 ? [0, 1, 2] : [1]
    for (const row of rows) {
      const k = row === 1 ? spread : spread     // all three travel together
      ctx.globalAlpha = row === 1 ? 1 : spread
      ctx.strokeStyle = ATOM; ctx.lineWidth = 1.3; ctx.globalAlpha *= 1 - merge * .55
      for (const [a, b] of mol.bonds) {
        const p = atomXY(a, row, k), q = atomXY(b, row, k)
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke()
      }
      ctx.fillStyle = ATOM
      for (let i = 0; i < mol.atoms.length; i++) {
        const p = atomXY(i, row, k)
        ctx.beginPath(); ctx.arc(p.x, p.y, row === 1 && spread < .5 ? 4 : 2.8, 0, 6.2832); ctx.fill()
      }
      ctx.globalAlpha = 1
      if (spread > .5) label(V.views[row].label, 14, H * ROWY[row] - SCALE() * .60, GREEN, 10)
    }

    // ---- fragments: outlined on their copy, then travelling to the meta-graph
    if (spread > .1) {
      for (const f of V.all) {
        const pts = f.atoms.map(i => atomXY(i, f.view, spread))
        blob(pts, 9, nodeCol(f.node), Math.min(1, (spread - .1) * 1.6), false)
      }
    }

    // ---- the meta-graph
    if (merge > .02) {
      // edges first, weighted by how much of the smaller fragment the overlap covers
      if (link > .02) {
        for (const e of V.edges) {
          const p = metaPos(e.a), q = metaPos(e.b)
          ctx.globalAlpha = link * .55
          ctx.strokeStyle = MUTED; ctx.lineWidth = 1 + e.w * 4.5
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke()
        }
        ctx.globalAlpha = 1
      }
      // each node travels out of the fragment it came from
      V.all.forEach(f => {
        const from = f.atoms.map(i => atomXY(i, f.view, spread))
        let cx = 0, cy = 0
        for (const p of from) { cx += p.x; cy += p.y }
        cx /= from.length; cy /= from.length
        const to = metaPos(f.node)
        const p = { x: lerp(cx, to.x, merge), y: lerp(cy, to.y, merge) }
        const node = V.nodes[f.node]
        const r = 6 + node.atoms.length * .55
        ctx.globalAlpha = .92
        ctx.fillStyle = nodeCol(f.node)
        ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, 6.2832); ctx.fill()
        // a node two views agree on carries a ring, which is the whole point
        if (node.views.length > 1 && merge > .6) {
          ctx.globalAlpha = (merge - .6) / .4
          ctx.strokeStyle = GREEN; ctx.lineWidth = 2
          ctx.beginPath(); ctx.arc(p.x, p.y, r + 6, 0, 6.2832); ctx.stroke()
        }
        ctx.globalAlpha = 1
      })
      if (link > .4) {
        const shared = V.nodes.filter(n => n.views.length > 1).length
        ctx.globalAlpha = Math.min(1, (link - .4) / .4)
        label('colour pairs a fragment with its node', W - 14, H * .06, MUTED, 10, 'right')
        label('grey node, green ring \u2014 the same atoms in two views', W - 14, H * .11, MUTED, 10, 'right')
        ctx.globalAlpha = 1
      }
    }

    const CAPS = ['one molecule', 'cut three ways — junction tree, Murcko scaffold, BRICS',
      'fragments covering the same atoms collapse into one node',
      'and the rest join wherever they overlap: one meta-graph']
    label(`${beat + 1}. ${CAPS[beat]}`, 14, H - 14, MUTED, 11)
    label(mol.name, W - 14, H - 14, MUTED, 10, 'right')
  }

  function frame(now) {
    const dt = Math.max(0, Math.min(.05, (now - last) / 1000)); last = now
    if (running) {
      t += dt / DUR[beatOf(t)]
      if (t >= 4) { t = 0; ci = (ci + 1) % caseCount; mol = molecule(ci); V = views(ci); XY = atomsOf(ci) }
    }
    if (running) draw()
    requestAnimationFrame(frame)
  }

  new IntersectionObserver(es => { running = es[0].isIntersecting }, { threshold: .2 }).observe(cv)

  ready = true
  if (reduce) { t = 3.9; draw() } else requestAnimationFrame(frame)
}
