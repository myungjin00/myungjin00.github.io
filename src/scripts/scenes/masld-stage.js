// Scene: how the comparisons are laid out along the disease.
// MASLD is staged, so a difference only means something against a stated pair of stages. The
// ladder is the stages; the arcs are the contrasts the analysis actually runs. No results here —
// which pair was asked, not what came back.
export function masldStage(cv) {
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

  // the six stages, as the project names them
  const STAGE = [
    ['S0', 'healthy'],
    ['S1', 'steatosis'],
    ['S2', 'MASH'],
    ['S3', 'fibrosis F1–F2'],
    ['S4', 'cirrhosis F3–F4'],
    ['S5', 'HCC · ESLD'],
  ]
  // the contrasts that are run, in the order they are reached
  const PAIRS = [
    [0, 1], [0, 2], [0, 4], [0, 5], [1, 2], [2, 4],
  ]

  let W = 0, H = 0, dpr = 1, ready = false
  const resize = () => {
    const r = box.getBoundingClientRect()
    dpr = devicePixelRatio || 1; W = r.width; H = r.height
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr)
    if (reduce && ready) draw(TOTAL - 0.01)
  }
  new ResizeObserver(resize).observe(box); resize()

  const ease = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
  const text = (x, y, s, size, col, anchor = 'left', weight = 400) => {
    ctx.font = `${weight} ${size}px var(--mono), ui-monospace, monospace`
    ctx.textAlign = anchor; ctx.textBaseline = 'middle'; ctx.fillStyle = col
    ctx.fillText(s, x, y)
  }

  const HOLD = 1.5, STEP = 1.0
  const TOTAL = 1.4 + PAIRS.length * STEP + HOLD

  function draw(t) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, W, H)
    if (!W || !H) return
    const pad = Math.max(22, W * 0.05)
    const y = H * 0.68
    const x0 = pad + 14, x1 = W - pad - 14
    const at = i => x0 + (x1 - x0) * (i / (STAGE.length - 1))
    const lay = ease(Math.min(1, t / 1.4))

    // the ladder itself: the disease, left to right
    ctx.strokeStyle = LINE; ctx.lineWidth = 1.4
    ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x0 + (x1 - x0) * lay, y); ctx.stroke()
    STAGE.forEach((s, i) => {
      const show = Math.min(1, Math.max(0, lay * STAGE.length - i))
      if (!show) return
      ctx.globalAlpha = show
      ctx.fillStyle = PAPER
      ctx.beginPath(); ctx.arc(at(i), y, 6.5, 0, Math.PI * 2); ctx.fill()
      ctx.strokeStyle = i === 0 ? GREEN : ATOM; ctx.lineWidth = 1.8
      ctx.beginPath(); ctx.arc(at(i), y, 6.5, 0, Math.PI * 2); ctx.stroke()
      text(at(i), y + 22, s[0], 12, INK, 'center', 600)
      text(at(i), y + 38, s[1], 10.5, MUTED, 'center')
      ctx.globalAlpha = 1
    })

    // and the contrasts, arcing above it
    PAIRS.forEach((pr, n) => {
      const k = (t - 1.4 - n * STEP) / STEP
      if (k <= 0) return
      const g = ease(Math.min(1, k * 1.6))
      const ax = at(pr[0]), bx = at(pr[1])
      const span = Math.abs(bx - ax)
      const lift = Math.min(H * 0.46, 26 + span * 0.26)
      const live = k < 1.25
      ctx.globalAlpha = live ? 1 : 0.4
      ctx.strokeStyle = live ? ATOM : LINE
      ctx.lineWidth = live ? 1.8 : 1.2
      ctx.beginPath()
      ctx.moveTo(ax, y - 9)
      // only draw as much of the arc as has been reached
      const steps = 40
      for (let s = 1; s <= steps * g; s++) {
        const u = s / steps
        const px = ax + (bx - ax) * u
        const py = y - 9 - Math.sin(Math.PI * u) * lift
        ctx.lineTo(px, py)
      }
      ctx.stroke()
      if (g === 1) {
        ctx.fillStyle = live ? ATOM : LINE
        ctx.beginPath(); ctx.arc(bx, y - 9, 2.6, 0, Math.PI * 2); ctx.fill()
        if (live) text((ax + bx) / 2, y - 13 - lift, `${STAGE[pr[0]][0]} vs ${STAGE[pr[1]][0]}`, 11, ATOM, 'center', 600)
      }
      ctx.globalAlpha = 1
    })

    text(pad, 18, 'MASLD is staged, so a contrast is a pair of stages', 11.5, MUTED)
    text(W - pad, 18, `${PAIRS.length} contrasts`, 11.5, MUTED, 'right')
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
