// Scene: how two odour mixtures are compared, in four beats.
//   1  a mixture is a set of molecules, not one molecule
//   2  each molecule is read three ways — MACCS, ECFP4 and a PubChem key
//   3  the mixture becomes a graph: molecules are nodes, similar ones joined
//   4  two mixtures, their union, and one number out: how alike they smell
// Schematic, not results.
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

  let seed = 23
  const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646 }
  const ease = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
  const lerp = (a, b, t) => a + (b - a) * t

  // two mixtures, each a handful of molecules placed on a small circle
  const mix = (n) => Array.from({ length: n }, (_, i) => {
    const a = -Math.PI / 2 + i * (Math.PI * 2 / n) + rnd() * 0.3
    return { a, r: 0.62 + rnd() * 0.3, fp: [rnd(), rnd(), rnd()] }
  })
  const A = mix(5), B = mix(4)
  // which pairs are similar enough to be joined — the code's threshold is 0.3
  const edges = (m) => {
    const out = []
    for (let i = 0; i < m.length; i++) for (let j = i + 1; j < m.length; j++)
      if (Math.abs(m[i].fp[0] - m[j].fp[0]) < 0.42) out.push([i, j])
    return out
  }
  const EA = edges(A), EB = edges(B)
  const FP = [
    { name: 'MACCS', bits: 167, col: () => GREEN },
    { name: 'ECFP4', bits: 1024, col: () => BLUE },
    { name: 'PubChem', bits: 881, col: () => ATOM },
  ]

  const DUR = [2.4, 2.8, 2.6, 3.2]
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
  // a molecule: a small ring with two stubs, enough to read as a compound
  const molecule = (x, y, s, col, a = 1) => {
    ctx.globalAlpha = a
    ctx.strokeStyle = col; ctx.lineWidth = 1.4; ctx.lineCap = 'round'
    ctx.beginPath()
    for (let i = 0; i < 6; i++) {
      const b = i * Math.PI / 3
      ctx[i ? 'lineTo' : 'moveTo'](x + Math.cos(b) * s, y + Math.sin(b) * s)
    }
    ctx.closePath(); ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(x + s, y); ctx.lineTo(x + s * 1.8, y - s * 0.5)
    ctx.moveTo(x - s, y); ctx.lineTo(x - s * 1.8, y + s * 0.5)
    ctx.stroke()
    ctx.globalAlpha = 1
  }
  // a fingerprint: a short run of bits
  const bits = (x, y, w, h, n, col, seedN, a = 1) => {
    ctx.globalAlpha = a
    for (let i = 0; i < n; i++) {
      const on = ((i * 7 + seedN * 13) % 11) < 4
      ctx.fillStyle = on ? col : LINE
      ctx.globalAlpha = a * (on ? 1 : 0.4)
      ctx.fillRect(x + i * (w / n), y, (w / n) - 1.4, h)
    }
    ctx.globalAlpha = 1
  }

  function draw(t) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, W, H)
    if (!W || !H) return
    const [beat, k] = beatOf(t)
    const e = ease(Math.min(1, k * 1.25))
    const pad = Math.max(16, W * 0.04)
    const R = Math.min(H * 0.26, W * 0.15)

    // ---- beat one: a mixture is a set of molecules ------------------------------------
    if (beat === 0) {
      const cx = W * 0.5, cy = H * 0.5
      A.forEach((m, i) => {
        const show = Math.min(1, Math.max(0, e * A.length - i))
        const x = cx + Math.cos(m.a) * R * m.r, y = cy + Math.sin(m.a) * R * m.r
        molecule(x, y, Math.min(11, R * 0.2), GREEN, show)
      })
      ctx.globalAlpha = e
      ctx.strokeStyle = LINE; ctx.setLineDash([3, 4]); ctx.lineWidth = 1
      ctx.beginPath(); ctx.arc(cx, cy, R * 1.12, 0, Math.PI * 2); ctx.stroke()
      ctx.setLineDash([]); ctx.globalAlpha = 1
      text(cx, cy + R * 1.12 + 20, 'one mixture · five compounds', 12, MUTED, 'center')
    }

    // ---- beat two: three fingerprints per molecule --------------------------------------
    if (beat === 1) {
      const cx = W * 0.3, cy = H * 0.5
      molecule(cx, cy, Math.min(15, R * 0.3), GREEN)
      const bx = W * 0.5, bw = Math.min(260, W * 0.36)
      FP.forEach((f, i) => {
        const y = cy + (i - 1) * Math.min(34, H * 0.16)
        const show = Math.min(1, Math.max(0, e * 3 - i))
        ctx.globalAlpha = show * 0.5
        ctx.strokeStyle = LINE; ctx.lineWidth = 1
        ctx.beginPath(); ctx.moveTo(cx + 26, cy); ctx.lineTo(bx - 8, y); ctx.stroke()
        ctx.globalAlpha = 1
        bits(bx, y - 5, bw, 10, 26, f.col(), i, show)
        text(bx + bw + 10, y, `${f.name} ${f.bits}`, 11.5, MUTED, 'left')
      })
      text(pad, H - 18, 'every compound read three ways', 12, MUTED)
    }

    // ---- beat three: the mixture becomes a graph -----------------------------------------
    if (beat === 2) {
      const cx = W * 0.5, cy = H * 0.48
      const pos = A.map(m => ({ x: cx + Math.cos(m.a) * R * m.r, y: cy + Math.sin(m.a) * R * m.r }))
      ctx.strokeStyle = GREEN; ctx.lineWidth = 1.6
      EA.forEach(([i, j], n) => {
        const show = Math.min(1, Math.max(0, e * EA.length - n))
        ctx.globalAlpha = show * 0.55
        ctx.beginPath(); ctx.moveTo(pos[i].x, pos[i].y); ctx.lineTo(pos[j].x, pos[j].y); ctx.stroke()
      })
      ctx.globalAlpha = 1
      pos.forEach(p => { ctx.fillStyle = PAPER; ctx.beginPath(); ctx.arc(p.x, p.y, 9, 0, Math.PI * 2); ctx.fill()
        molecule(p.x, p.y, 7, GREEN) })
      text(cx, cy + R + 26, 'joined where two compounds are alike', 12, MUTED, 'center')
      text(pad, H - 18, 'a mixture is a graph · edge if similarity > 0.3', 12, MUTED)
    }

    // ---- beat four: two mixtures, their union, one number --------------------------------
    if (beat === 3) {
      const cy = H * 0.44, rr = Math.min(R * 0.78, W * 0.1)
      const ax = W * 0.21, bx = W * 0.46
      const blob = (cxx, m, edg, col, a) => {
        const pos = m.map(p => ({ x: cxx + Math.cos(p.a) * rr * p.r, y: cy + Math.sin(p.a) * rr * p.r }))
        ctx.globalAlpha = a * 0.5; ctx.strokeStyle = col; ctx.lineWidth = 1.4
        edg.forEach(([i, j]) => { ctx.beginPath(); ctx.moveTo(pos[i].x, pos[i].y); ctx.lineTo(pos[j].x, pos[j].y); ctx.stroke() })
        ctx.globalAlpha = a
        pos.forEach(p => { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(p.x, p.y, 4.4, 0, Math.PI * 2); ctx.fill() })
        ctx.globalAlpha = 1
        return pos
      }
      blob(ax, A, EA, GREEN, 1)
      blob(bx, B, EB, BLUE, 1)
      text(ax, cy + rr + 22, 'mixture A', 12, MUTED, 'center')
      text(bx, cy + rr + 22, 'mixture B', 12, MUTED, 'center')
      // the union of the two, which the second loss term holds the pair against
      const ux = W * 0.355
      ctx.globalAlpha = e * 0.35
      ctx.strokeStyle = MUTED; ctx.setLineDash([3, 4]); ctx.lineWidth = 1
      ctx.beginPath(); ctx.ellipse(ux, cy, (bx - ax) / 2 + rr + 10, rr + 14, 0, 0, Math.PI * 2); ctx.stroke()
      ctx.setLineDash([]); ctx.globalAlpha = 1
      ctx.globalAlpha = e
      text(ux, cy - rr - 26, 'A ∪ B', 11.5, MUTED, 'center')
      ctx.globalAlpha = 1
      // attention over the three fingerprint views, then one number
      const px = W * 0.68
      FP.forEach((f, i) => {
        const y = cy + (i - 1) * 20
        const wgt = [0.52, 0.3, 0.18][i]
        ctx.globalAlpha = e
        ctx.fillStyle = f.col()
        ctx.beginPath(); ctx.roundRect(px, y - 5, Math.min(70, W * 0.08) * wgt * 2.4, 10, 2); ctx.fill()
        text(px - 8, y, f.name, 11, MUTED, 'right')
        ctx.globalAlpha = 1
      })
      text(px, cy - 42, 'attention over the three views', 11.5, MUTED, 'left')
      const sx = W * 0.9
      ctx.globalAlpha = e
      ctx.strokeStyle = LINE; ctx.lineWidth = 1
      ctx.beginPath(); ctx.moveTo(px + 86, cy); ctx.lineTo(sx - 30, cy); ctx.stroke()
      text(sx, cy - 8, '0.62', 20, INK, 'center', 600)
      text(sx, cy + 14, 'similarity', 11, MUTED, 'center')
      ctx.globalAlpha = 1
      text(pad, H - 18, 'one number: how alike the two smell', 12, MUTED)
    }

    const NAMES = ['mixture', 'fingerprints', 'graph', 'compare']
    NAMES.forEach((n, i) => {
      const x = pad + i * Math.min(92, W * 0.13)
      ctx.globalAlpha = i === beat ? 1 : 0.32
      text(x, 17, n, 11.5, i === beat ? INK : MUTED, 'left', i === beat ? 600 : 400)
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
