// Scene: how two odour mixtures are compared, in four beats.
//   1  a mixture is a set of compounds, not one compound
//   2  every compound is read three ways at once — MACCS, ECFP4, a PubChem key
//   3  the mixture becomes a graph: compounds are nodes, the alike ones joined
//   4  two mixtures and their union, weighed by attention, give one number
// The compounds are the same worked structures the other molecular scenes use.
import { molecule, caseCount } from './molecule.js'

export function olfactoryFlow(cv) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
  const box = cv.parentElement, ctx = cv.getContext('2d')
  const css = getComputedStyle(document.documentElement)
  const v = n => css.getPropertyValue(n).trim()
  let INK, MUTED, LINE, GREEN, BLUE, ATOM, PAPER
  const readTheme = () => {
    INK = v('--ink'); MUTED = v('--muted'); LINE = v('--line')
    GREEN = v('--green'); BLUE = v('--blue'); ATOM = v('--atom'); PAPER = v('--paper')
  }
  readTheme()

  let W = 0, H = 0, dpr = 1, ready = false
  const resize = () => {
    const r = box.getBoundingClientRect()
    dpr = devicePixelRatio || 1; W = r.width; H = r.height
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr)
    if (reduce && ready) draw(TOTAL - 0.01)
  }
  new ResizeObserver(resize).observe(box); resize()

  let seed = 29
  const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646 }
  const ease = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
  const lerp = (a, b, t) => a + (b - a) * t

  // Draw one of the worked structures, scaled into a box of side `s` at (x, y).
  // The structures live in normalised 0–1 coordinates, so they centre and scale cleanly.
  const MOLS = Array.from({ length: caseCount }, (_, i) => molecule(i))
  function drawMol(m, x, y, s, col, a = 1, lw = 1.3) {
    // molecule() hands back atoms as {x, y} in normalised coordinates
    const xs = m.atoms.map(p => p.x), ys = m.atoms.map(p => p.y)
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys)
    const k = s / Math.max(x1 - x0, y1 - y0, 1e-6)
    const ox = x - (x0 + x1) / 2 * k, oy = y - (y0 + y1) / 2 * k
    const at = i => [m.atoms[i].x * k + ox, m.atoms[i].y * k + oy]
    ctx.globalAlpha = a
    ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.lineJoin = 'round'
    ctx.beginPath()
    for (const [i, j] of m.bonds) { const p = at(i), q = at(j); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]) }
    ctx.stroke()
    ctx.fillStyle = col
    for (let i = 0; i < m.atoms.length; i++) {
      const p = at(i)
      ctx.beginPath(); ctx.arc(p[0], p[1], lw * 1.1, 0, Math.PI * 2); ctx.fill()
    }
    ctx.globalAlpha = 1
  }

  // Two mixtures: which structure each compound uses, and where it sits on its ring
  const place = (n, start) => Array.from({ length: n }, (_, i) => ({
    mol: MOLS[(start + i) % MOLS.length],
    a: -Math.PI / 2 + i * (Math.PI * 2 / n) + (rnd() - 0.5) * 0.25,
    r: 0.74 + rnd() * 0.22,
    fp: rnd(),
  }))
  const A = place(5, 0), B = place(4, 1)
  const edges = (m) => {
    const out = []
    for (let i = 0; i < m.length; i++) for (let j = i + 1; j < m.length; j++)
      if (Math.abs(m[i].fp - m[j].fp) < 0.44) out.push([i, j])
    return out.length ? out : [[0, 1]]
  }
  const EA = edges(A), EB = edges(B)
  const FP = [
    { name: 'MACCS', bits: 167, note: '166 structural questions', col: () => GREEN },
    { name: 'ECFP4', bits: 1024, note: 'circular neighbourhoods', col: () => BLUE },
    { name: 'PubChem', bits: 881, note: 'a fixed catalogue', col: () => ATOM },
  ]

  const DUR = [2.8, 3.2, 3.0, 3.6]
  const TOTAL = DUR.reduce((a, b) => a + b, 0)
  const beatOf = (t) => {
    let s = 0
    for (let i = 0; i < DUR.length; i++) { if (t < s + DUR[i]) return [i, (t - s) / DUR[i]]; s += DUR[i] }
    return [DUR.length - 1, 1]
  }
  const text = (x, y, s, size, col, anchor = 'left', weight = 400) => {
    ctx.font = `${weight} ${size}px var(--mono), ui-monospace, monospace`
    ctx.textAlign = anchor; ctx.textBaseline = 'middle'; ctx.fillStyle = col
    ctx.fillText(s, x, y)
  }
  // a fingerprint as a run of bits, deterministic per compound and per scheme
  const bitrow = (x, y, w, h, n, col, s, a = 1) => {
    const bw = w / n
    for (let i = 0; i < n; i++) {
      const on = ((i * 7 + s * 13 + (i % 3) * 5) % 11) < 4
      ctx.globalAlpha = a * (on ? 1 : 0.22)
      ctx.fillStyle = on ? col : MUTED
      ctx.fillRect(x + i * bw, y, bw - Math.min(1.6, bw * 0.3), h)
    }
    ctx.globalAlpha = 1
  }

  function draw(t) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, W, H)
    if (!W || !H) return
    const [beat, k] = beatOf(t)
    const e = ease(Math.min(1, k * 1.3))
    const pad = Math.max(18, W * 0.045)
    const cy = H * 0.52

    // ---- 1 · a mixture is a set of compounds ------------------------------------------
    if (beat === 0) {
      const cx = W * 0.5, R = Math.min(H * 0.26, W * 0.15)
      ctx.globalAlpha = Math.min(1, e * 1.6) * 0.6
      ctx.strokeStyle = LINE; ctx.setLineDash([4, 5]); ctx.lineWidth = 1.2
      ctx.beginPath(); ctx.arc(cx, cy, R * 1.42, 0, Math.PI * 2); ctx.stroke()
      ctx.setLineDash([]); ctx.globalAlpha = 1
      A.forEach((c, i) => {
        const show = Math.min(1, Math.max(0, e * (A.length + 1) - i))
        const x = cx + Math.cos(c.a) * R * c.r, y = cy + Math.sin(c.a) * R * c.r
        drawMol(c.mol, x, y, Math.min(46, R * 0.78), GREEN, show)
      })
      text(cx, H - 40, `one mixture · ${A.length} compounds`, 12, MUTED, 'center')
      text(pad, H - 18, 'the challenge gives which compounds are in each mixture', 11.5, MUTED)
    }

    // ---- 2 · three fingerprints per compound --------------------------------------------
    if (beat === 1) {
      const mx = pad + Math.min(110, W * 0.13)
      drawMol(MOLS[0], mx, cy, Math.min(92, W * 0.13), GREEN, 1, 1.6)
      const bx = W * 0.40, bw = Math.min(300, W * 0.33)
      FP.forEach((f, i) => {
        const y = cy + (i - 1) * Math.min(46, H * 0.18)
        const show = Math.min(1, Math.max(0, e * 3.4 - i * 0.7))
        ctx.globalAlpha = show * 0.45
        ctx.strokeStyle = LINE; ctx.lineWidth = 1.2
        ctx.beginPath()
        ctx.moveTo(mx + Math.min(56, W * 0.08), cy)
        ctx.bezierCurveTo(bx - 56, cy, bx - 40, y, bx - 10, y)
        ctx.stroke()
        ctx.globalAlpha = 1
        bitrow(bx, y - 7, bw, 14, 34, f.col(), i, show)
        ctx.globalAlpha = show
        text(bx + bw + 14, y - 6, `${f.name}`, 12.5, INK, 'left', 600)
        text(bx + bw + 14, y + 8, `${f.bits} bits · ${f.note}`, 10.5, MUTED)
        ctx.globalAlpha = 1
      })
      text(pad, H - 18, 'the three disagree by design, so the model is given all of them', 11.5, MUTED)
    }

    // ---- 3 · the mixture becomes a graph -------------------------------------------------
    if (beat === 2) {
      const cx = W * 0.5, R = Math.min(H * 0.26, W * 0.15)
      const pos = A.map(c => ({ x: cx + Math.cos(c.a) * R * c.r, y: cy + Math.sin(c.a) * R * c.r }))
      ctx.strokeStyle = GREEN
      EA.forEach(([i, j], n) => {
        const show = Math.min(1, Math.max(0, e * (EA.length + 1) - n))
        ctx.globalAlpha = show * 0.5
        ctx.lineWidth = 1 + show * 2.4            // the edge carries the similarity as its weight
        ctx.beginPath(); ctx.moveTo(pos[i].x, pos[i].y); ctx.lineTo(pos[j].x, pos[j].y); ctx.stroke()
      })
      ctx.globalAlpha = 1
      pos.forEach((p, i) => {
        ctx.fillStyle = PAPER
        ctx.beginPath(); ctx.arc(p.x, p.y, Math.min(26, R * 0.44), 0, Math.PI * 2); ctx.fill()
        drawMol(A[i].mol, p.x, p.y, Math.min(34, R * 0.58), GREEN, 1, 1.1)
      })
      text(cx, H - 40, 'an edge where two compounds are alike', 12, MUTED, 'center')
      text(pad, H - 18, 'similarity over 0.3 joins them, and is the edge weight', 11.5, MUTED)
    }

    // ---- 4 · two mixtures, their union, one number ----------------------------------------
    if (beat === 3) {
      const rr = Math.min(H * 0.2, W * 0.085)
      const ax = pad + rr + Math.min(36, W * 0.04), bx = ax + rr * 2.7
      const gy = cy - H * 0.04
      const blob = (cxx, m, edg, col) => {
        const pos = m.map(p => ({ x: cxx + Math.cos(p.a) * rr * p.r, y: gy + Math.sin(p.a) * rr * p.r }))
        ctx.strokeStyle = col; ctx.globalAlpha = 0.45; ctx.lineWidth = 1.6
        edg.forEach(([i, j]) => { ctx.beginPath(); ctx.moveTo(pos[i].x, pos[i].y); ctx.lineTo(pos[j].x, pos[j].y); ctx.stroke() })
        ctx.globalAlpha = 1
        pos.forEach((p, i) => { ctx.fillStyle = PAPER
          ctx.beginPath(); ctx.arc(p.x, p.y, 11, 0, Math.PI * 2); ctx.fill()
          drawMol(m[i].mol, p.x, p.y, 15, col, 1, 0.9) })
      }
      blob(ax, A, EA, GREEN); blob(bx, B, EB, BLUE)
      text(ax, gy + rr + 20, 'A', 12, GREEN, 'center', 600)
      text(bx, gy + rr + 20, 'B', 12, BLUE, 'center', 600)
      // the union the second loss term holds the pair against
      ctx.globalAlpha = e * 0.4
      ctx.strokeStyle = MUTED; ctx.setLineDash([3, 4]); ctx.lineWidth = 1.2
      ctx.beginPath(); ctx.ellipse((ax + bx) / 2, gy, (bx - ax) / 2 + rr + 14, rr + 16, 0, 0, Math.PI * 2); ctx.stroke()
      ctx.setLineDash([]); ctx.globalAlpha = e
      text((ax + bx) / 2, gy - rr - 28, 'A ∪ B', 11.5, MUTED, 'center', 600)
      ctx.globalAlpha = 1
      // three encoders, one per fingerprint, then attention over them
      const ex = bx + rr + Math.min(74, W * 0.08)
      const bwid = Math.min(96, W * 0.1)
      const WGT = [0.52, 0.31, 0.17]
      FP.forEach((f, i) => {
        const y = gy + (i - 1) * 26
        const show = Math.min(1, Math.max(0, e * 3 - i * 0.4))
        ctx.globalAlpha = show * 0.4
        ctx.strokeStyle = LINE; ctx.lineWidth = 1
        ctx.beginPath(); ctx.moveTo(bx + rr + 16, gy); ctx.lineTo(ex - 8, y); ctx.stroke()
        ctx.globalAlpha = show
        ctx.fillStyle = f.col()
        ctx.beginPath(); ctx.roundRect(ex, y - 6, bwid * WGT[i] / 0.52, 12, 3); ctx.fill()
        text(ex + bwid + 8, y, f.name, 10.5, MUTED, 'left')
        ctx.globalAlpha = 1
      })
      text(ex, gy - 46, 'attention weighs the three', 11, MUTED, 'left')
      // and the one number that comes out
      const sx = W - pad - Math.min(52, W * 0.055)
      ctx.globalAlpha = e
      ctx.strokeStyle = LINE; ctx.lineWidth = 1
      ctx.beginPath(); ctx.moveTo(ex + bwid + 56, gy); ctx.lineTo(sx - 42, gy); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(sx - 48, gy - 4); ctx.lineTo(sx - 42, gy); ctx.lineTo(sx - 48, gy + 4); ctx.stroke()
      text(sx, gy - 10, '0.62', 22, INK, 'center', 600)
      text(sx, gy + 14, 'how alike', 10.5, MUTED, 'center')
      text(sx, gy + 28, 'they smell', 10.5, MUTED, 'center')
      ctx.globalAlpha = 1
      text(pad, H - 18, 'trained against what people actually reported', 11.5, MUTED)
    }

    const NAMES = ['mixture', 'fingerprints', 'graph', 'compare']
    NAMES.forEach((n, i) => {
      const x = pad + i * Math.min(98, W * 0.135)
      ctx.globalAlpha = i === beat ? 1 : 0.3
      text(x, 18, n, 11.5, i === beat ? INK : MUTED, 'left', i === beat ? 600 : 400)
      ctx.globalAlpha = 1
    })
    ready = true
  }

  if (reduce) { draw(TOTAL - 0.01); return }
  let raf = 0, t0 = 0, running = false
  const frame = (now) => {
    if (!t0) t0 = now
    draw(((now - t0) / 1000) % TOTAL)
    if (running) raf = requestAnimationFrame(frame)
  }
  const start = () => { if (running) return; running = true; t0 = 0; raf = requestAnimationFrame(frame) }
  const stop = () => { running = false; cancelAnimationFrame(raf); raf = 0 }
  new IntersectionObserver(es => es[0].isIntersecting ? start() : stop(), { threshold: 0.1 }).observe(cv)
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()))
  new MutationObserver(readTheme).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
}
