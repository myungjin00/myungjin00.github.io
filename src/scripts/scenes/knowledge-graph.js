// Scene: what a repurposing benchmark actually does, in three beats.
//   1  a typed biomedical knowledge graph — drugs, diseases, genes, side effects, pathways
//   2  the nodes are embedded: the graph dissolves into a space where like sits with like
//   3  one disease is picked and its drugs come back ranked, with a dashed proposed link
// Hover (or tap) a disease to run the three beats for that disease. Schematic, not data.
export function knowledgeGraph(cv) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
  const box = cv.parentElement, ctx = cv.getContext('2d')
  const css = getComputedStyle(document.documentElement)
  const v = n => css.getPropertyValue(n).trim()
  let INK, SOFT, MUTED, LINE, GREEN, BLUE, ATOM, BIO, REF, PAPER
  const readTheme = () => {
    INK = v('--ink'); SOFT = v('--soft'); MUTED = v('--muted'); LINE = v('--line')
    GREEN = v('--green'); BLUE = v('--blue'); ATOM = v('--atom'); BIO = v('--bio'); REF = v('--ref'); PAPER = v('--paper')
  }
  readTheme()
  const onTheme = () => { readTheme(); if (reduce && ready) draw() }
  new MutationObserver(onTheme).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })

  // the five node types the graph carries, in the order they appear in the legend
  const TYPES = [
    { key: 'drug', label: 'drug', col: () => GREEN, shape: 'dot' },
    { key: 'disease', label: 'disease', col: () => BLUE, shape: 'square' },
    { key: 'gene', label: 'gene · protein', col: () => ATOM, shape: 'ring' },
    { key: 'effect', label: 'side effect', col: () => BIO, shape: 'tri' },
    { key: 'path', label: 'pathway', col: () => REF, shape: 'diamond' },
  ]
  const COUNT = { drug: 15, disease: 9, gene: 20, effect: 10, path: 8 }

  let W = 0, H = 0, dpr = 1, ready = false
  const resize = () => {
    const r = box.getBoundingClientRect()
    dpr = devicePixelRatio || 1; W = r.width; H = r.height
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr)
    if (reduce && ready) draw()  // setting cv.width clears it, and there is no loop to repaint
  }
  new ResizeObserver(resize).observe(box); resize()

  let seed = 11
  const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646 }

  // graph layout: genes and pathways in the middle, drugs left, diseases right, effects below
  const BAND = { drug: [.06, .24], gene: [.32, .54], path: [.34, .52], disease: [.62, .80], effect: [.08, .78] }
  const ROW = { drug: [.10, .88], gene: [.08, .70], path: [.72, .94], disease: [.10, .80], effect: [.86, .99] }
  const nodes = []
  for (const t of TYPES) for (let i = 0; i < COUNT[t.key]; i++) {
    const [x0, x1] = BAND[t.key], [y0, y1] = ROW[t.key]
    nodes.push({ t: t.key, gx: x0 + rnd() * (x1 - x0), gy: y0 + rnd() * (y1 - y0), ph: rnd() * 6.28 })
  }
  const idx = k => nodes.map((n, i) => (n.t === k ? i : -1)).filter(i => i >= 0)
  const drugs = idx('drug'), dis = idx('disease'), genes = idx('gene'), effs = idx('effect'), paths = idx('path')
  const pick = a => a[Math.floor(rnd() * a.length)]

  const edges = []
  for (const d of drugs) { for (let k = 0; k < 2; k++) edges.push([d, pick(genes)]); edges.push([d, pick(effs)]) }
  for (const g of genes) { edges.push([g, pick(dis)]); if (rnd() < .6) edges.push([g, pick(paths)]) }
  for (const p of paths) edges.push([p, pick(dis)])
  for (let k = 0; k < 7; k++) edges.push([pick(drugs), pick(dis)])        // known indications
  const nbr = nodes.map(() => new Set())
  edges.forEach(([a, b]) => { nbr[a].add(b); nbr[b].add(a) })

  // beat 2: the embedding. Each type lands in its own cluster, with a little spread.
  const CENTRE = { drug: [.22, .34], disease: [.74, .36], gene: [.47, .22], effect: [.30, .76], path: [.62, .74] }
  nodes.forEach(n => {
    const [cx, cy] = CENTRE[n.t], a = rnd() * 6.28, r = .05 + rnd() * .07
    n.ex = cx + Math.cos(a) * r; n.ey = cy + Math.sin(a) * r * .72
  })

  // beat 3: for a disease, score its drugs by how many paths of length two reach it
  const ranking = d => {
    const score = new Map()
    nbr[d].forEach(m => nbr[m].forEach(x => { if (nodes[x].t === 'drug') score.set(x, (score.get(x) || 0) + 1) }))
    const known = new Set([...nbr[d]].filter(i => nodes[i].t === 'drug'))
    const list = [...score.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0]).slice(0, 5)
    const proposed = list.find(([i]) => !known.has(i))
    return { list, known, proposed: proposed ? proposed[0] : list.length ? list[0][0] : null }
  }

  let target = dis[0], hoverLock = false
  // the three beats, as a 0..3 position; fractional parts are the cross-fades
  let t = 0, last = performance.now(), running = true
  const DUR = [2.6, 2.4, 3.4]                    // seconds per beat
  const beatOf = x => Math.min(2, Math.max(0, Math.floor(x)))

  cv.addEventListener('pointermove', e => {
    const r = cv.getBoundingClientRect(), mx = (e.clientX - r.left) / W, my = (e.clientY - r.top) / H
    let best = null, bd = .09
    for (const i of dis) {
      const p = pos(i), d = Math.hypot(p.x / W - mx, p.y / H - my)
      if (d < bd) { bd = d; best = i }
    }
    if (best !== null && best !== target) { target = best; t = 2; hoverLock = true }
    cv.style.cursor = best !== null ? 'pointer' : ''
  })
  cv.addEventListener('pointerleave', () => { hoverLock = false })

  const ease = x => x < .5 ? 2 * x * x : 1 - (-2 * x + 2) ** 2 / 2
  // where a node is right now: graph position, embedding position, or between them
  function pos(i) {
    const n = nodes[i]
    const k = t < 1 ? 0 : t < 2 ? ease(t - 1) : 1
    const x = n.gx + (n.ex - n.gx) * k, y = n.gy + (n.ey - n.gy) * k
    const drift = reduce ? 0 : Math.sin(performance.now() / 2600 + n.ph) * .004
    return { x: (x + drift) * W, y: (y + drift * .6) * H }
  }

  const dot = (x, y, r, shape, col, fill) => {
    ctx.beginPath()
    if (shape === 'square') ctx.rect(x - r, y - r, r * 2, r * 2)
    else if (shape === 'tri') { ctx.moveTo(x, y - r * 1.15); ctx.lineTo(x + r, y + r * .8); ctx.lineTo(x - r, y + r * .8); ctx.closePath() }
    else if (shape === 'diamond') { ctx.moveTo(x, y - r * 1.2); ctx.lineTo(x + r * 1.1, y); ctx.lineTo(x, y + r * 1.2); ctx.lineTo(x - r * 1.1, y); ctx.closePath() }
    else ctx.arc(x, y, r, 0, 6.2832)
    if (fill) { ctx.fillStyle = col; ctx.fill() } else { ctx.strokeStyle = col; ctx.lineWidth = 1.4; ctx.stroke() }
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
    const fade = t < 1 ? 1 : t < 2 ? 1 - ease(t - 1) : 0           // edges dissolve during beat 2
    const rank = ranking(target)

    // ---- edges
    if (fade > .02) {
      ctx.lineWidth = 1.1
      for (const [a, b] of edges) {
        const p = pos(a), q = pos(b)
        ctx.globalAlpha = .34 * fade
        ctx.strokeStyle = MUTED
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke()
      }
      ctx.globalAlpha = 1
    }

    // ---- beat 3: the paths that carry the winning drug, and the proposed link
    if (t >= 2 && rank.proposed !== null) {
      const d = pos(target), s = pos(rank.proposed)
      ctx.globalAlpha = Math.min(1, (t - 2) * 2)
      ctx.strokeStyle = GREEN; ctx.lineWidth = 1.6; ctx.setLineDash([5, 4])
      ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(d.x, d.y); ctx.stroke()
      ctx.setLineDash([])
      ctx.globalAlpha = 1
    }

    // ---- nodes
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i], ty = TYPES.find(x => x.key === n.t), p = pos(i)
      const isTarget = i === target, isTop = t >= 2 && rank.list.some(([j]) => j === i)
      ctx.globalAlpha = t >= 2 && !(isTarget || isTop) ? .3 : .95
      dot(p.x, p.y, isTarget ? 5.5 : isTop ? 4.5 : 3.4, ty.shape, ty.col(), ty.shape !== 'ring')
      ctx.globalAlpha = 1
    }

    // ---- the caption for the current beat, bottom left
    const CAPS = ['a typed knowledge graph', 'every node embedded', 'drugs ranked for one disease']
    label(`${beat + 1}. ${CAPS[beat]}`, 14, H - 14, MUTED, 11)

    // ---- beat 3: the ranked list, top right
    if (t >= 2) {
      ctx.globalAlpha = Math.min(1, (t - 2) * 1.6)
      const x = W - 14
      label('ranked for this disease', x, 18, MUTED, 10, 'right')
      rank.list.forEach(([i], k) => {
        const proposed = i === rank.proposed
        label(`${k + 1}  drug ${String(i).padStart(2, '0')}${proposed ? '  ← proposed' : ''}`,
          x, 36 + k * 15, proposed ? GREEN : SOFT, 10.5, 'right')
      })
      ctx.globalAlpha = 1
    }

    // ---- legend, top left
    TYPES.forEach((ty, k) => {
      const y = 18 + k * 15
      dot(20, y, 3.6, ty.shape, ty.col(), ty.shape !== 'ring')
      label(ty.label, 31, y, MUTED, 10)
    })
  }

  function frame(now) {
    const dt = Math.max(0, Math.min(.05, (now - last) / 1000)); last = now
    if (!hoverLock && running) {
      t += dt / DUR[beatOf(t)]
      if (t >= 3) { t = 0; target = dis[(dis.indexOf(target) + 1) % dis.length] }
    }
    if (running) draw()
    requestAnimationFrame(frame)
  }
  ready = true
  if (reduce) { t = 2.6; draw() } else requestAnimationFrame(frame)

  // stop the loop when the figure is off screen
  new IntersectionObserver(es => { running = es[0].isIntersecting }, { threshold: 0 }).observe(cv)
}
