// What is up there on a given night, drawn into the margins of the season canvas.
// The rule the whole calendar follows: by day things fall, by night something is lit. A rainy
// night is overcast, so nothing in here is drawn at all — no moon, no stars.
import { seoulNow, moonPhase, moonPath } from './seoul.js'

const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim()
const rnd = (seed) => { let s = seed; return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296 }

// Stars are fixed for a given width, so they do not swim about between frames
let field = { w: 0, h: 0, pts: [] }
function stars(W, H, n) {
  if (field.w === W && field.h === H && field.pts.length === n) return field.pts
  const r = rnd(20260101)
  field = { w: W, h: H, pts: Array.from({ length: n }, () => ({
    x: r() * W, y: r() * H * 0.62, s: 0.5 + r() * 1.2, ph: r() * 6.28, sp: 0.5 + r() * 1.4,
  })) }
  return field.pts
}

// The named shapes of two seasons, as offsets from a corner of the margin. Enough stars to be
// recognised, not a planetarium: Orion with his belt, and the summer triangle.
const ORION = [[0, 0], [1.9, 0.25], [0.75, 1.5], [1.05, 1.62], [1.35, 1.74], [0.35, 3.1], [2.1, 3.0]]
const ORION_LINES = [[0, 2], [1, 4], [2, 3], [3, 4], [2, 5], [4, 6]]
const TRIANGLE = [[0, 0], [2.2, 1.1], [0.6, 2.6]]
const TRIANGLE_LINES = [[0, 1], [1, 2], [2, 0]]

function constellation(ctx, pts, lines, x, y, k, col, a) {
  ctx.globalAlpha = a * 0.35; ctx.strokeStyle = col; ctx.lineWidth = 0.7
  ctx.beginPath()
  for (const [i, j] of lines) {
    ctx.moveTo(x + pts[i][0] * k, y + pts[i][1] * k)
    ctx.lineTo(x + pts[j][0] * k, y + pts[j][1] * k)
  }
  ctx.stroke()
  ctx.globalAlpha = a; ctx.fillStyle = col
  for (const [px, py] of pts) {
    ctx.beginPath(); ctx.arc(x + px * k, y + py * k, 1.7, 0, Math.PI * 2); ctx.fill()
  }
}

// The moon in its real phase, drawn from the same path the bar icon uses so the two cannot
// disagree about what tonight looks like.
function moon(ctx, x, y, r, phase, col, a) {
  ctx.globalAlpha = a * 0.16; ctx.fillStyle = col
  ctx.beginPath(); ctx.arc(x, y, r * 2.1, 0, Math.PI * 2); ctx.fill()        // a soft halo
  ctx.globalAlpha = a * 0.22
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill()              // the dark disc, faintly
  ctx.globalAlpha = a * 0.4; ctx.strokeStyle = col; ctx.lineWidth = Math.max(0.8, r / 7)
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke()            // a rim, so a sliver still reads
  ctx.globalAlpha = a
  ctx.fill(new Path2D(moonPath(phase, r, x, y)))
}

// Aurora: thin ribbons that slide and breathe, green through to teal with violet only at the
// top edge. Faint enough everywhere that it never has to be clipped off the text — a hard clip
// leaves a seam, and a seam is worse than a little colour behind a word.
function aurora(ctx, W, H, t, a) {
  for (let b = 0; b < 3; b++) {
    const y0 = H * (0.07 + b * 0.055), amp = 16 + b * 7, sp = 0.1 + b * 0.035, tall = 46 - b * 6
    const g = ctx.createLinearGradient(0, y0 - tall * 0.5, 0, y0 + tall)
    g.addColorStop(0, 'rgba(158,120,224,0)')
    g.addColorStop(0.22, 'rgba(158,120,224,.55)')
    g.addColorStop(0.55, 'rgba(96,214,176,.95)')
    g.addColorStop(1, 'rgba(70,200,200,0)')
    ctx.globalAlpha = a * (0.30 - b * 0.07)
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.moveTo(-20, y0 - tall * 0.5)
    for (let x = -20; x <= W + 20; x += 14)
      ctx.lineTo(x, y0 + Math.sin(x / 150 + t * sp + b) * amp + Math.sin(x / 61 - t * sp * 1.7) * (amp / 3) - tall * 0.5)
    for (let x = W + 20; x >= -20; x -= 14)
      ctx.lineTo(x, y0 + Math.sin(x / 150 + t * sp + b) * amp + Math.sin(x / 61 - t * sp * 1.7) * (amp / 3) + tall)
    ctx.closePath()
    ctx.fill()
  }
  ctx.globalAlpha = 1
}

// The Milky Way: a soft diagonal band, dusted with its own grain
function milkyway(ctx, W, H, a, col) {
  ctx.save()
  ctx.translate(W * 0.5, H * 0.3); ctx.rotate(-0.5)
  const g = ctx.createLinearGradient(0, -70, 0, 70)
  g.addColorStop(0, 'rgba(255,255,255,0)')
  g.addColorStop(0.5, 'rgba(226,232,240,.17)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.globalAlpha = a; ctx.fillStyle = g
  ctx.fillRect(-W, -70, W * 2, 140)
  const r = rnd(77)
  ctx.fillStyle = col
  for (let i = 0; i < 160; i++) {
    const x = (r() - 0.5) * W * 1.6, y = (r() - 0.5) * 120
    ctx.globalAlpha = a * (0.1 + r() * 0.35)
    ctx.beginPath(); ctx.arc(x, y, 0.5 + r() * 0.7, 0, Math.PI * 2); ctx.fill()
  }
  ctx.restore()
}

// Sunrise on the first of January: a disc climbing out of the bottom of each margin
function sunrise(ctx, x, H, t, a) {
  const p = (Math.sin(t * 0.18) + 1) / 2              // it rises and settles, slowly
  const y = H - 10 - p * 90, r = 26
  const g = ctx.createRadialGradient(x, y, 2, x, y, r * 3.4)
  g.addColorStop(0, 'rgba(255,196,110,.85)')
  g.addColorStop(0.35, 'rgba(240,140,70,.35)')
  g.addColorStop(1, 'rgba(230,110,60,0)')
  ctx.globalAlpha = a; ctx.fillStyle = g
  ctx.beginPath(); ctx.arc(x, y, r * 3.4, 0, Math.PI * 2); ctx.fill()
  ctx.fillStyle = '#FFCE86'
  ctx.beginPath(); ctx.arc(x, y, r * 0.62, 0, Math.PI * 2); ctx.fill()
}

// High summer, by day: the sun itself, up in the margin with the air shivering under it
function midday(ctx, x, H, t, a) {
  const y = H * 0.17
  const g = ctx.createRadialGradient(x, y, 4, x, y, 76)
  g.addColorStop(0, 'rgba(255,214,120,.75)')
  g.addColorStop(0.3, 'rgba(250,186,90,.26)')
  g.addColorStop(1, 'rgba(245,170,80,0)')
  ctx.globalAlpha = a; ctx.fillStyle = g
  ctx.beginPath(); ctx.arc(x, y, 76, 0, Math.PI * 2); ctx.fill()
  ctx.fillStyle = '#F6C250'
  ctx.beginPath(); ctx.arc(x, y, 17, 0, Math.PI * 2); ctx.fill()
  ctx.strokeStyle = 'rgba(246,194,80,.45)'; ctx.lineWidth = 1.2; ctx.lineCap = 'round'
  for (let i = 0; i < 12; i++) {                          // rays that breathe rather than spin
    const b = i * 0.5236, r0 = 23 + Math.sin(t * 1.3 + i) * 2
    ctx.beginPath()
    ctx.moveTo(x + Math.cos(b) * r0, y + Math.sin(b) * r0)
    ctx.lineTo(x + Math.cos(b) * (r0 + 9), y + Math.sin(b) * (r0 + 9))
    ctx.stroke()
  }
  ctx.globalAlpha = 1
}

// A meteor: born in the upper margin, gone within half a second
const shooting = []
export function meteorMaybe(W, H, chance) {
  if (Math.random() > chance) return
  const left = Math.random() < 0.5
  shooting.push({ x: left ? Math.random() * W * 0.22 : W - Math.random() * W * 0.22,
    y: Math.random() * H * 0.3, dx: (left ? 1 : -1) * (260 + Math.random() * 180),
    dy: 190 + Math.random() * 120, life: 0, max: 0.45 + Math.random() * 0.25 })
}
function meteors(ctx, dt, a, col) {
  for (let i = shooting.length - 1; i >= 0; i--) {
    const m = shooting[i]
    m.life += dt
    if (m.life > m.max) { shooting.splice(i, 1); continue }
    const k = m.life / m.max, len = 54
    const x = m.x + m.dx * m.life, y = m.y + m.dy * m.life
    const g = ctx.createLinearGradient(x, y, x - m.dx * 0.0011 * len, y - m.dy * 0.0011 * len)
    g.addColorStop(0, col); g.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.globalAlpha = a * Math.sin(k * Math.PI)
    ctx.strokeStyle = g; ctx.lineWidth = 1.6; ctx.lineCap = 'round'
    ctx.beginPath(); ctx.moveTo(x, y)
    ctx.lineTo(x - m.dx * 0.0011 * len, y - m.dy * 0.0011 * len); ctx.stroke()
  }
}

// `want` is what this month's night asks for; `inText` is the span the text column occupies, so
// the sky stays bright in the margins and only a hint of it crosses the words.
export function drawSky(ctx, want, { W, H, t, dt, left, right, dark }) {
  if (!want.length) return
  // the sun is the one thing in here that belongs to the day
  if (!dark) {
    if (want.includes('sun') && left > 90) { midday(ctx, left * 0.5, H, t, 1); midday(ctx, right + (W - right) * 0.5, H, t, 1) }
    return
  }
  const col = css('--snow') || '#EEF2F5'
  const now = seoulNow()
  const faint = () => { ctx.save(); ctx.beginPath(); ctx.rect(0, 0, left, H); ctx.rect(right, 0, W - right, H); ctx.clip() }
  const A = 1

  if (want.includes('aurora')) aurora(ctx, W, H, t, A)
  if (want.includes('milkyway')) { faint(); milkyway(ctx, W, H, A * 0.9, col); ctx.restore() }

  if (want.some(w => w.startsWith('star')) || want.includes('aurora') || want.includes('meteors')) {
    const pts = stars(W, H, 110)
    ctx.fillStyle = col
    for (const s of pts) {
      const inside = s.x > left && s.x < right
      ctx.globalAlpha = (0.25 + 0.55 * (0.5 + 0.5 * Math.sin(t * s.sp + s.ph))) * (inside ? 0.22 : 1)
      ctx.beginPath(); ctx.arc(s.x, s.y, s.s, 0, Math.PI * 2); ctx.fill()
    }
  }
  if (want.includes('winterstars') && left > 70) {
    constellation(ctx, ORION, ORION_LINES, left * 0.3, Math.max(190, H * 0.24), Math.min(26, left / 4), col, A)
  }
  if (want.includes('summerstars') && W - right > 70) {
    constellation(ctx, TRIANGLE, TRIANGLE_LINES, right + (W - right) * 0.25, Math.max(185, H * 0.22), Math.min(30, (W - right) / 4), col, A)
  }
  if (want.includes('meteors')) meteors(ctx, dt, A, col)

  if (want.includes('moon')) {
    const phase = moonPhase()
    // the full moon of Daeboreum and Chuseok is simply the moon being full; it is drawn larger
    const big = want.includes('moonbig')
    const r = big ? 21 : 13
    moon(ctx, W - Math.min(110, (W - right) * 0.55), Math.max(170, H * 0.24), r, phase, col, A)
  }
  if (want.includes('sunrise')) { sunrise(ctx, left * 0.45, H, t, A); sunrise(ctx, right + (W - right) * 0.55, H, t, A) }
  ctx.globalAlpha = 1
}
