// Scene: what the MASLD half of the work does, in four beats.
//   1  accessions arrive from GEO and SRA, each writing its metadata its own way
//   2  they are curated into one schema, so the fields line up and a query becomes possible
//   3  differential expression: the genes spread into a volcano and a few cross
//   4  a liver is a mixture, so the one bulk answer splits into cell types that disagree
// Schematic, not results.
export function masldFlow(cv) {
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
    if (reduce && ready) draw(DUR[0] + DUR[1] + DUR[2] + DUR[3] - 0.01)
  }
  new ResizeObserver(resize).observe(box); resize()

  let seed = 7
  const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646 }
  const ease = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
  const lerp = (a, b, t) => a + (b - a) * t

  // ---- the pieces, laid out once ------------------------------------------------------
  // eight accessions: where they drift in from, and where the schema puts them
  const ACC = Array.from({ length: 8 }, (_, i) => ({
    // where it comes in from, where it lands while still scattered, and how crooked it sits
    sx: -0.2 - rnd() * 0.5, sy: 0.1 + rnd() * 0.8,
    ax: 0.1 + rnd() * 0.8, ay: 0.2 + rnd() * 0.6, rot: (rnd() - 0.5) * 0.5,
    // each writes its fields at its own widths — that is the problem being solved
    fields: [0.3 + rnd() * 0.5, 0.2 + rnd() * 0.45, 0.25 + rnd() * 0.5],
    kind: i % 3,
  }))
  // the genes of beat three: a volcano, most of it flat and a few corners lit
  const GENES = Array.from({ length: 150 }, () => {
    const lfc = (rnd() + rnd() + rnd() - 1.5) * 1.5
    const p = Math.abs(lfc) > 0.9 ? rnd() * 0.45 + Math.abs(lfc) * 0.3 : rnd() * 0.5
    return { lfc, p: Math.min(1, p), sx: rnd(), sy: rnd() }
  })
  // beat four: one bulk answer, then the cell types it was averaging over
  const CELLS = [
    { n: 'hepatocyte', d: 0.78 }, { n: 'Kupffer', d: -0.42 }, { n: 'endothelial', d: 0.22 },
    { n: 'stellate', d: -0.66 }, { n: 'lymphocyte', d: -0.18 },
  ]

  const DUR = [2.4, 2.2, 2.6, 3.0]
  const TOTAL = DUR.reduce((a, b) => a + b, 0)
  const beatOf = (t) => {
    let s = 0
    for (let i = 0; i < DUR.length; i++) { if (t < s + DUR[i]) return [i, (t - s) / DUR[i]]; s += DUR[i] }
    return [DUR.length - 1, 1]
  }

  const label = (x, y, s, size = 11, col = MUTED, anchor = 'left', weight = 400) => {
    ctx.font = `${weight} ${size}px var(--mono), ui-monospace, monospace`
    ctx.textAlign = anchor; ctx.textBaseline = 'middle'
    ctx.fillStyle = col
    ctx.fillText(s, x, y)
  }
  const card = (x, y, w, h, rot, fields, accent, align) => {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot)
    ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, 3)
    ctx.fillStyle = PAPER; ctx.fill()
    ctx.strokeStyle = accent; ctx.globalAlpha = 0.5; ctx.lineWidth = 1; ctx.stroke()
    ctx.globalAlpha = 1
    // the metadata rows: ragged at first, flush once the schema has them
    ctx.fillStyle = accent; ctx.globalAlpha = 0.33
    fields.forEach((f, i) => {
      const fw = align ? [0.3, 0.42, 0.2][i] : f
      ctx.fillRect(-w / 2 + 6, -h / 2 + 7 + i * 7, (w - 12) * fw, 3)
    })
    ctx.globalAlpha = 1; ctx.restore()
  }

  function draw(t) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, W, H)
    if (!W || !H) return
    const [beat, k] = beatOf(t)
    const e = ease(Math.min(1, k * 1.25))
    const pad = Math.min(42, W * 0.06)
    const CW = Math.min(74, W * 0.1), CH = 34
    const col = [BLUE, GREEN, ATOM]

    // ---- beats one and two: the accessions, and the schema that lines them up ----------
    if (beat <= 1) {
      const arrived = beat === 0 ? ease(Math.min(1, k * 1.1)) : 1
      const settled = beat === 1 ? e : 0
      const cx = W * 0.5, top = H * 0.2, gap = Math.min(21, (H * 0.62) / ACC.length)
      ACC.forEach((a, i) => {
        // in from off-screen first, scattered; then gathered into the schema
        const sx = lerp(a.sx * W, a.ax * W, arrived), sy = lerp(a.sy * H, a.ay * H, arrived)
        const x = lerp(sx, cx, settled), y = lerp(sy, top + i * gap, settled)
        ctx.globalAlpha = arrived
        card(x, y, CW, CH * (1 - settled * 0.42), a.rot * (1 - settled), a.fields, col[a.kind], settled > 0.6)
        ctx.globalAlpha = 1
      })
      if (beat === 1 && e > 0.55) {
        ctx.globalAlpha = (e - 0.55) / 0.45
        label(cx, top - 26, 'one schema', 11, INK, 'center', 600)
        ctx.globalAlpha = 1
      }
      if (beat === 0) label(pad, H - 18, 'GEO · SRA accessions', 11, MUTED)
      else label(pad, H - 18, 'age · diet · stage · fibrosis, written once', 11, MUTED)
    }

    // ---- beat three: differential expression --------------------------------------------
    if (beat === 2) {
      const x0 = W * 0.18, x1 = W * 0.82, y0 = H * 0.78, y1 = H * 0.16
      ctx.strokeStyle = LINE; ctx.lineWidth = 1
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y0); ctx.stroke()
      ctx.beginPath(); ctx.moveTo((x0 + x1) / 2, y0); ctx.lineTo((x0 + x1) / 2, y1); ctx.stroke()
      const cut = lerp(1, 0.52, e)                        // the threshold slides in
      ctx.setLineDash([3, 3]); ctx.strokeStyle = MUTED; ctx.globalAlpha = 0.5 * e
      const ycut = lerp(y0, y1, 0.62)
      ctx.beginPath(); ctx.moveTo(x0, ycut); ctx.lineTo(x1, ycut); ctx.stroke()
      ctx.setLineDash([]); ctx.globalAlpha = 1
      for (const g of GENES) {
        const gx = lerp(W * 0.5 + (g.sx - 0.5) * 40, (x0 + x1) / 2 + g.lfc * (x1 - x0) / 4.6, e)
        const gy = lerp(H * 0.5 + (g.sy - 0.5) * 40, lerp(y0, y1, g.p), e)
        const hit = e > 0.4 && g.p > 0.62 && Math.abs(g.lfc) > 0.9
        ctx.beginPath(); ctx.arc(gx, gy, hit ? 2.6 : 1.9, 0, Math.PI * 2)
        ctx.fillStyle = hit ? (g.lfc > 0 ? ATOM : BLUE) : MUTED
        ctx.globalAlpha = hit ? 0.95 : 0.3
        ctx.fill()
      }
      ctx.globalAlpha = 1
      label((x0 + x1) / 2, y0 + 16, 'log fold change', 10.5, MUTED, 'center')
      label(x0 - 6, (y0 + y1) / 2, 'significance', 10.5, MUTED, 'right')
      label(pad, H - 18, 'differential expression · PyDESeq2, MAST', 11, MUTED)
    }

    // ---- beat four: the mixture the bulk answer was hiding -------------------------------
    if (beat === 3) {
      const split = ease(Math.min(1, k * 1.6))
      const cx = W * 0.5, mid = H * 0.46
      const bw = Math.min(150, W * 0.22), bh = 15
      // the one bar, before it is taken apart
      ctx.globalAlpha = 1 - split
      ctx.fillStyle = MUTED
      ctx.beginPath(); ctx.roundRect(cx - bw / 2, mid - bh / 2, bw * 0.55, bh, 3); ctx.fill()
      label(cx, mid - 24, 'bulk: one average', 11, MUTED, 'center')
      ctx.globalAlpha = 1
      // and the cell types it was an average of, each going its own way
      const gap = Math.min(26, (H * 0.66) / CELLS.length)
      const top = mid - (CELLS.length - 1) * gap / 2
      CELLS.forEach((c, i) => {
        const y = lerp(mid, top + i * gap, split)
        const w = bw * 0.5 * Math.abs(c.d) * split
        ctx.globalAlpha = split
        ctx.fillStyle = c.d > 0 ? ATOM : BLUE
        ctx.beginPath()
        ctx.roundRect(c.d > 0 ? cx : cx - w, y - 5, w, 10, 2); ctx.fill()
        ctx.globalAlpha = split * 0.9
        label(c.d > 0 ? cx - 8 : cx + 8, y, c.n, 10.5, MUTED, c.d > 0 ? 'right' : 'left')
        ctx.globalAlpha = 1
      })
      ctx.strokeStyle = LINE; ctx.globalAlpha = split; ctx.lineWidth = 1
      ctx.beginPath(); ctx.moveTo(cx, top - 14); ctx.lineTo(cx, top + (CELLS.length - 1) * gap + 14); ctx.stroke()
      ctx.globalAlpha = 1
      label(pad, H - 18, 'scored per cell type · ssGSEA, AddModuleScore, AUCell', 11, MUTED)
    }

    // the four beats, named along the top
    const NAMES = ['collect', 'curate', 'test', 'resolve']
    NAMES.forEach((n, i) => {
      const x = pad + i * 66
      ctx.globalAlpha = i === beat ? 1 : 0.32
      label(x, 16, n, 10.5, i === beat ? INK : MUTED, 'left', i === beat ? 600 : 400)
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
