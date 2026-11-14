// Scene: what the MASLD database holds, in three beats.
//   1  mouse — what was collected, and the columns its samples are staged by
//   2  human — the same, staged by what a biopsy is actually scored on
//   3  the reference side: one SQLite file, grouped by where each table came from
// Every count here is the one the schema map and the two metadata tables give.
export function masldDb(cv) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
  const box = cv.parentElement, ctx = cv.getContext('2d')
  const css = getComputedStyle(document.documentElement)
  const v = n => css.getPropertyValue(n).trim()
  let INK, MUTED, LINE, BLUE, ATOM
  const readTheme = () => {
    INK = v('--ink'); MUTED = v('--muted'); LINE = v('--line')
    BLUE = v('--blue'); ATOM = v('--atom')
  }
  readTheme()

  const SIDE = [
    {
      who: 'Mus musculus', file: 'mouse_metadata.csv', gse: 30, gsm: 662,
      assays: [['bulk RNA-seq', 13, 'bulk'], ['scRNA-seq', 14, 'cells'], ['snRNA-seq', 3, 'cells']],
      // a mouse study is staged by its diet, how long it ran, and what the liver became
      cols: [['STATUS', 53, 'chow · HFD · WD · low-fat'], ['DIET_PERIOD', 37, '0w · 6w · 12w · 18w'],
             ['DISEASE_STATE', 20, 'healthy · NASH · HCC'], ['GENOTYPE', 14, 'LDLr-/- Leiden'],
             ['CELL_TYPE', 12, 'hepatic immune, …']],
    },
    {
      who: 'Homo sapiens', file: 'human_metadata.csv', gse: 18, gsm: 1057,
      assays: [['bulk RNA-seq', 6, 'bulk'], ['scRNA-seq', 5, 'cells'], ['snRNA-seq', 4, 'cells']],
      // a human one by what the biopsy is scored on
      cols: [['DISEASE_PROGRESSION', 31, 'healthy · NAFLD · NASH'], ['FIBROSIS_STAGE', 13, 'F0 – F4'],
             ['NAS_SCORE', 9, 'activity, 0 – 8'], ['STEATOSIS_GRADE', 4, '0 · 1 · 2 · 3'],
             ['BMI · ALT · HOMA-IR', 0, 'measured alongside']],
    },
  ]
  // The reference side is a join graph with the gene at its centre: an Entrez ID reaches KEGG
  // directly, an Ensembl ID reaches Reactome, a UniProt ID reaches both drug sources, and an
  // InChI key ties PubChem to the compounds. These are the joins the queries actually use.
  const HUB = { name: 'gene', src: 'ncbi_info · ncbi_ensembl · ncbi_synonyms · uniprot · taxon' }
  const ARMS = [
    { name: 'Reactome', what: 'pathways', via: 'ensembl_id', up: -1, side: 1 },
    { name: 'KEGG', what: 'pathway graph', via: 'entrez_id', up: -1, side: -1 },
    { name: 'DrugBank', what: 'approved drugs · actions', via: 'uniprot_id', up: 1, side: -1 },
    { name: 'ChEMBL', what: 'compounds · pChEMBL · phase', via: 'uniprot_id', up: 1, side: 1 },
  ]
  const TAIL = { name: 'PubChem', what: 'compound synonyms', via: 'inchi_key' }

  let W = 0, H = 0, dpr = 1, ready = false
  const resize = () => {
    const r = box.getBoundingClientRect()
    dpr = devicePixelRatio || 1; W = r.width; H = r.height
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr)
    if (reduce && ready) draw(0)
  }
  new ResizeObserver(resize).observe(box); resize()

  const ease = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
  const text = (x, y, s, size, col, anchor = 'left', weight = 400) => {
    ctx.font = `${weight} ${size}px var(--mono), ui-monospace, monospace`
    ctx.textAlign = anchor; ctx.textBaseline = 'middle'; ctx.fillStyle = col
    ctx.fillText(s, x, y)
  }
  // a tube where everything is pooled, or the cells that were counted one at a time
  function icon(kind, s, col, a) {
    ctx.save(); ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 1.2
    if (kind === 'bulk') {
      ctx.globalAlpha = a * 0.5
      ctx.beginPath(); ctx.roundRect(-s * 0.25, -s * 0.45, s * 0.5, s * 0.9, s * 0.2); ctx.stroke()
      ctx.globalAlpha = a
      ctx.beginPath(); ctx.roundRect(-s * 0.18, -s * 0.02, s * 0.36, s * 0.38, s * 0.13); ctx.fill()
    } else {
      const P = [[-0.28, -0.24], [0.04, -0.34], [0.3, -0.16], [-0.3, 0.1], [0, 0.02], [0.26, 0.22], [-0.14, 0.32]]
      P.forEach(([px, py], i) => {
        ctx.globalAlpha = a * (i % 2 ? 0.55 : 1)
        ctx.beginPath(); ctx.arc(px * s, py * s, s * 0.09, 0, Math.PI * 2)
        i % 2 ? ctx.stroke() : ctx.fill()
      })
    }
    ctx.restore(); ctx.globalAlpha = 1
  }

  const STEP = 3.6
  const TOTAL = STEP * 3

  function draw(t) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, W, H)
    if (!W || !H) return
    const beat = Math.floor(t / STEP) % 3
    const k = ease(Math.min(1, ((t % STEP) / STEP) * 2.2))
    const pad = Math.max(18, W * 0.04)
    const top = H * 0.23

    ;['mouse', 'human', 'reference DB'].forEach((n, i) => {
      const x = pad + i * Math.min(104, W * 0.14)
      ctx.globalAlpha = i === beat ? 1 : 0.3
      text(x, 17, n, 11.5, i === beat ? INK : MUTED, 'left', i === beat ? 600 : 400)
      ctx.globalAlpha = 1
    })

    const rule = (col, label, sub) => {
      text(pad, top - 22, label, 11, col, 'left', 600)
      text(pad + Math.min(200, W * 0.22), top - 22, sub, 10.5, MUTED)
      ctx.strokeStyle = col; ctx.globalAlpha = 0.3; ctx.lineWidth = 1
      ctx.beginPath(); ctx.moveTo(pad, top - 11); ctx.lineTo(W - pad, top - 11); ctx.stroke()
      ctx.globalAlpha = 1
    }

    if (beat < 2) {
      const s = SIDE[beat], accent = beat ? ATOM : BLUE
      rule(accent, s.who.toUpperCase(), `${s.file} · tissue: liver`)
      const rowH = Math.min(36, H * 0.135)
      s.assays.forEach((a, i) => {
        const y = top + 16 + i * rowH
        const show = Math.min(1, Math.max(0, k * 3 - i * 0.5))
        ctx.save(); ctx.translate(pad + 13, y); icon(a[2], 25, accent, show); ctx.restore()
        text(pad + 33, y - 7, a[0], 12.5, INK, 'left', 500)
        text(pad + 33, y + 8, `${Math.round(a[1] * show)} datasets`, 11, MUTED)
      })
      text(pad, top + 16 + 3 * rowH, `${s.gse} GSE · ${s.gsm.toLocaleString()} samples`, 12, accent, 'left', 600)

      // the columns the samples are staged by — the reason the curation exists
      const RX = pad + Math.min(214, W * 0.28)
      const NX = RX + Math.min(190, W * 0.2)
      text(RX, top + 2, 'STAGED BY', 10.5, MUTED, 'left', 600)
      text(NX, top + 2, 'distinct', 10, MUTED, 'right')
      s.cols.forEach((c, i) => {
        const y = top + 26 + i * Math.min(26, H * 0.097)
        const show = Math.min(1, Math.max(0, k * 4 - i * 0.6))
        ctx.globalAlpha = show
        text(RX, y, c[0], 11.5, INK, 'left', 500)
        if (c[1]) text(NX, y, String(c[1]), 12, accent, 'right', 600)
        text(NX + 12, y, c[2], 10.5, MUTED)
        ctx.globalAlpha = 1
      })
    } else {
      rule(ATOM, 'REFERENCE DB · SQLite', 'database.db · 7 public databases · 42 GB')
      // Left to right, because that is the direction a question travels: a gene name out of an
      // expression matrix, resolved to one Entrez ID, and from there to pathways and to drugs.
      const EX = pad + Math.min(74, W * 0.085)
      const cx = pad + Math.min(250, W * 0.3)
      const AX = W - pad - Math.min(210, W * 0.24)
      const cy = top + (H - 34 - top) * 0.48
      const step = Math.min(34, (H - 34 - top) * 0.2)

      // the expression side, and the join that gets it into the reference side at all
      const e0 = Math.min(1, k * 3)
      ctx.globalAlpha = e0
      ctx.strokeStyle = BLUE; ctx.lineWidth = 1.2
      ctx.beginPath(); ctx.roundRect(EX - 46, cy - 15, 92, 30, 5); ctx.stroke()
      text(EX, cy - 4, 'expression', 11.5, INK, 'center', 500)
      text(EX, cy + 8, 'h5ad · CSV', 10, MUTED, 'center')
      ctx.strokeStyle = LINE; ctx.lineWidth = 1.4
      ctx.beginPath(); ctx.moveTo(EX + 46, cy); ctx.lineTo(cx - 40, cy); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(cx - 46, cy - 4); ctx.lineTo(cx - 40, cy); ctx.lineTo(cx - 46, cy + 4); ctx.stroke()
      text((EX + cx) / 2, cy - 13, 'gene_symbol', 10, BLUE, 'center', 600)
      text((EX + cx) / 2, cy + 26, 'names differ per dataset; ncbi_synonyms resolves them', 9.5, MUTED, 'center')
      ctx.globalAlpha = 1

      // the hub every query starts from
      ctx.globalAlpha = e0
      ctx.fillStyle = ATOM
      ctx.beginPath(); ctx.roundRect(cx - 38, cy - 15, 76, 30, 5); ctx.fill()
      text(cx, cy - 4, 'gene', 12.5, v('--paper'), 'center', 600)
      text(cx, cy + 8, 'entrez_id', 10, v('--paper'), 'center')
      ctx.globalAlpha = 1

      // and what it reaches, each on the identifier the query joins by
      ctx.strokeStyle = ATOM; ctx.lineWidth = 1.2
      ARMS.forEach((arm, i) => {
        const show = Math.min(1, Math.max(0, k * 4 - 0.6 - i * 0.4))
        const ey = cy + (i - 1.5) * step
        ctx.globalAlpha = show * 0.6
        ctx.beginPath()
        ctx.moveTo(cx + 38, cy)
        ctx.bezierCurveTo(cx + 90, cy, AX - 70, ey, AX - 8, ey)
        ctx.stroke()
        ctx.globalAlpha = show
        text((cx + AX) / 2 + 6, ey + (ey < cy ? -8 : 10), arm.via, 9.5, ATOM, 'center', 600)
        text(AX, ey - 7, arm.name, 12, INK, 'left', 500)
        text(AX, ey + 7, arm.what, 10, MUTED, 'left')
        ctx.globalAlpha = 1
      })
      // PubChem hangs off ChEMBL rather than off the gene
      const py = cy + 1.5 * step
      const tshow = Math.min(1, Math.max(0, k * 4 - 2.4))
      ctx.globalAlpha = tshow * 0.5; ctx.setLineDash([2, 3]); ctx.strokeStyle = ATOM
      ctx.beginPath(); ctx.moveTo(AX + 4, py + 14); ctx.lineTo(AX + 4, py + 28); ctx.stroke()
      ctx.setLineDash([]); ctx.globalAlpha = tshow
      text(AX, py + 34, `${TAIL.via} → ${TAIL.name}`, 10, ATOM, 'left', 600)
      ctx.globalAlpha = 1
    }

    ctx.strokeStyle = LINE; ctx.globalAlpha = 0.6; ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(pad, H - 34); ctx.lineTo(W - pad, H - 34); ctx.stroke()
    ctx.globalAlpha = 1
    text(pad, H - 17, 'a gene name out of a matrix is one Entrez ID, and from there a pathway or a drug', 11, MUTED)
    text(W - pad, H - 17, 'one schema, every accession', 11.5, INK, 'right', 600)
    ready = true
  }

  if (reduce) { draw(0); return }
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
