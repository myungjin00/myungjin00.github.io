// Scene: what the MASLD database holds, and how the two halves are joined.
// Four kinds of assay on the left, each drawn as the thing it actually is — one pooled bar for
// bulk, a printed grid for a microarray, scattered cells for single-cell, a tissue under a grid
// for spatial. Three reference tables on the right. The scene walks the assays one at a time,
// drawing the joins each one uses and counting out its accessions.
export function masldDb(cv) {
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

  // human and mouse accessions, and which reference tables each assay is joined against
  const ASSAY = [
    { key: 'bulk', name: 'bulk RNA-seq', human: 9, mouse: 17, joins: [0, 1] },
    { key: 'array', name: 'microarray', human: 6, mouse: 13, joins: [0, 1] },
    { key: 'sc', name: 'sc / snRNA-seq', human: 3, mouse: 1, joins: [0, 1] },
    { key: 'spatial', name: 'spatial', human: 3, mouse: 1, joins: [0] },
  ]
  const REF = [
    { name: 'gene', src: 'NCBI · UniProt' },
    { name: 'pathway', src: 'GO · KEGG · Reactome · MSigDB' },
    { name: 'compound', src: 'ChEMBL · DrugBank · PubChem' },
  ]
  const FIELDS = 'age · diet period · disease stage · fibrosis stage'

  let W = 0, H = 0, dpr = 1, ready = false
  const resize = () => {
    const r = box.getBoundingClientRect()
    dpr = devicePixelRatio || 1; W = r.width; H = r.height
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr)
    if (reduce && ready) draw(0, 1)
  }
  new ResizeObserver(resize).observe(box); resize()

  const ease = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
  const text = (x, y, s, size, col, anchor = 'left', weight = 400) => {
    ctx.font = `${weight} ${size}px var(--mono), ui-monospace, monospace`
    ctx.textAlign = anchor; ctx.textBaseline = 'middle'; ctx.fillStyle = col
    ctx.fillText(s, x, y)
  }

  // ---- the four icons, each drawn in a box of side `s` centred on the origin ------------
  function icon(kind, s, col, lit) {
    ctx.save()
    ctx.strokeStyle = col; ctx.fillStyle = col
    ctx.lineWidth = 1.2; ctx.lineCap = 'round'; ctx.lineJoin = 'round'
    const a = lit ? 1 : 0.45
    if (kind === 'bulk') {
      // a tube: everything in the sample, pooled into one measurement
      ctx.globalAlpha = a * 0.5
      ctx.beginPath(); ctx.roundRect(-s * 0.26, -s * 0.46, s * 0.52, s * 0.92, s * 0.2); ctx.stroke()
      ctx.globalAlpha = a
      ctx.beginPath(); ctx.roundRect(-s * 0.19, -s * 0.02, s * 0.38, s * 0.4, s * 0.14); ctx.fill()
      ctx.globalAlpha = a * 0.55
      for (const dy of [-0.22, -0.32]) { ctx.beginPath(); ctx.moveTo(-s * 0.1, s * dy); ctx.lineTo(s * 0.1, s * dy); ctx.stroke() }
    } else if (kind === 'array') {
      // a printed grid: fixed probes, each spot one gene
      for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
        ctx.globalAlpha = a * (0.3 + ((r * 5 + c * 3) % 7) / 9)
        ctx.beginPath()
        ctx.arc(-s * 0.3 + c * s * 0.2, -s * 0.3 + r * s * 0.2, s * 0.065, 0, Math.PI * 2)
        ctx.fill()
      }
    } else if (kind === 'sc') {
      // cells, measured one at a time
      const P = [[-0.3, -0.26], [0.02, -0.36], [0.3, -0.2], [-0.34, 0.06], [-0.04, -0.02],
                 [0.26, 0.1], [-0.22, 0.32], [0.1, 0.3], [0.36, 0.34]]
      P.forEach(([px, py], i) => {
        ctx.globalAlpha = a * (i % 3 === 0 ? 1 : 0.6)
        ctx.beginPath(); ctx.arc(px * s, py * s, s * 0.085, 0, Math.PI * 2)
        i % 3 === 0 ? ctx.fill() : ctx.stroke()
      })
    } else {
      // tissue, with the grid that keeps where each reading came from
      ctx.globalAlpha = a * 0.75
      ctx.beginPath()
      ctx.moveTo(-s * 0.4, s * 0.1)
      ctx.bezierCurveTo(-s * 0.45, -s * 0.34, -s * 0.05, -s * 0.48, s * 0.18, -s * 0.3)
      ctx.bezierCurveTo(s * 0.46, -s * 0.12, s * 0.4, s * 0.34, s * 0.08, s * 0.4)
      ctx.bezierCurveTo(-s * 0.18, s * 0.44, -s * 0.36, s * 0.34, -s * 0.4, s * 0.1)
      ctx.closePath(); ctx.stroke()
      ctx.globalAlpha = a * 0.35
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath(); ctx.moveTo(i * s * 0.17, -s * 0.46); ctx.lineTo(i * s * 0.17, s * 0.44); ctx.stroke()
        ctx.beginPath(); ctx.moveTo(-s * 0.46, i * s * 0.17); ctx.lineTo(s * 0.44, i * s * 0.17); ctx.stroke()
      }
    }
    ctx.restore()
  }

  const STEP = 2.6
  const TOTAL = STEP * ASSAY.length

  function draw(t, forceAll) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, W, H)
    if (!W || !H) return
    const active = forceAll ? -1 : Math.floor(t / STEP) % ASSAY.length
    const k = forceAll ? 1 : ease(Math.min(1, ((t % STEP) / STEP) * 2.4))

    const pad = Math.max(16, W * 0.035)
    const LW = Math.min(250, W * 0.36), RW = Math.min(250, W * 0.34)
    const LX = pad, RX = W - pad - RW
    const top = H * 0.21, span = H * 0.56, rowH = span / ASSAY.length

    text(LX, top - 22, 'PUBLIC OMICS DATASETS', 10, BLUE, 'left', 600)
    text(RX, top - 22, 'REFERENCE TABLES', 10, ATOM, 'left', 600)
    ctx.strokeStyle = BLUE; ctx.globalAlpha = 0.3; ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(LX, top - 12); ctx.lineTo(LX + LW, top - 12); ctx.stroke()
    ctx.strokeStyle = ATOM
    ctx.beginPath(); ctx.moveTo(RX, top - 12); ctx.lineTo(RX + RW, top - 12); ctx.stroke()
    ctx.globalAlpha = 1

    const rowY = i => top + i * rowH + rowH / 2
    const refY = i => top + i * (span / REF.length) + (span / REF.length) / 2

    // the reference side is a chain of its own: a compound reaches a gene through a pathway,
    // which is why the compound table is there at all
    ctx.strokeStyle = ATOM; ctx.globalAlpha = 0.28; ctx.lineWidth = 1
    ctx.setLineDash([2, 3])
    for (let i = 0; i < REF.length - 1; i++) {
      ctx.beginPath()
      ctx.moveTo(RX - 9, refY(i) + 7); ctx.lineTo(RX - 9, refY(i + 1) - 7); ctx.stroke()
    }
    ctx.setLineDash([]); ctx.globalAlpha = 1

    // the joins, drawn only for the assay being walked through
    if (active >= 0) {
      const a = ASSAY[active]
      ctx.strokeStyle = LINE; ctx.lineWidth = 1.3
      for (const j of a.joins) {
        const x0 = LX + LW, y0 = rowY(active), x1 = RX, y1 = refY(j)
        ctx.globalAlpha = 0.8 * k
        ctx.beginPath()
        ctx.moveTo(x0, y0)
        ctx.bezierCurveTo(x0 + 40, y0, x1 - 40, y1, x1, y1)
        ctx.stroke()
        ctx.globalAlpha = k
        ctx.fillStyle = ATOM
        ctx.beginPath(); ctx.arc(x1, y1, 2.6, 0, Math.PI * 2); ctx.fill()
      }
      ctx.globalAlpha = 1
    }

    // left: one row per assay
    ASSAY.forEach((a, i) => {
      const y = rowY(i), lit = forceAll || i === active
      const s = Math.min(34, rowH * 0.7)
      ctx.globalAlpha = lit ? 1 : 0.55
      ctx.save(); ctx.translate(LX + s * 0.6, y); icon(a.key, s, BLUE, lit); ctx.restore()
      text(LX + s * 1.3, y - 7, a.name, 11.5, lit ? INK : MUTED, 'left', lit ? 600 : 400)
      // the counts, growing in as the row is reached
      const n = lit ? k : 1
      text(LX + s * 1.3, y + 8, `${Math.round(a.human * n)} human · ${Math.round(a.mouse * n)} mouse`, 10, MUTED)
      ctx.globalAlpha = 1
    })

    // right: the reference tables
    REF.forEach((r, i) => {
      const y = refY(i)
      const used = active < 0 || ASSAY[active].joins.includes(i)
      ctx.globalAlpha = used ? 1 : 0.4
      ctx.fillStyle = ATOM
      ctx.beginPath(); ctx.arc(RX - 9, y, 2.4, 0, Math.PI * 2); ctx.fill()
      text(RX, y - 7, r.name, 11.5, used ? INK : MUTED, 'left', used ? 600 : 400)
      text(RX, y + 8, r.src, 9.5, MUTED)
      ctx.globalAlpha = 1
    })

    // the schema, which is the point of the whole thing
    // the totals, and the schema that makes them one table
    const th = ASSAY.reduce((s, a) => s + a.human, 0), tm = ASSAY.reduce((s, a) => s + a.mouse, 0)
    ctx.strokeStyle = LINE; ctx.globalAlpha = 0.6; ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(LX, H - 34); ctx.lineTo(W - pad, H - 34); ctx.stroke()
    ctx.globalAlpha = 1
    text(LX, H - 16, 'one schema', 10.5, INK, 'left', 600)
    text(LX + 72, H - 16, FIELDS, 10, MUTED)
    text(W - pad, H - 16, `${th} human · ${tm} mouse accessions`, 10, MUTED, 'right')
    ready = true
  }

  if (reduce) { draw(0, 1); return }

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
