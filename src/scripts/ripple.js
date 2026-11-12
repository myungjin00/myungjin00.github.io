// What the mouse leaves behind, in the colour of the season (Seoul's, or the one picked).
// Over the text: a quiet ripple of three thin rings. In the margins, something of the season —
// a blossom that lets its petals go, a fan of leaves that falls apart, a snowman that crumbles,
// and in summer a ripple, a firework or a bubble, by Seoul's weather and hour. Dragging through
// a margin leaves a trail of the same. Nothing runs until something is drawn.
import { activeSeason, summerMode, shape, formsFor, floorAt, settle } from './season.js'

const PILES = ['petal', 'petal-round', 'maple', 'ginkgo', 'snow']   // what lands and stays; sparks, bubbles and rain do not

const RING = { spring: '--spring', summer: '--rain', autumn: '--atom', winter: '--blue' }
const SPARKS = ['--maple', '--ginkgo', '--spring', '--rain']
const LAGS = [0, 0.22, 0.44]
const out = t => 1 - Math.pow(1 - t, 3)   // fast at first, settling as it spreads
const css = name => getComputedStyle(document.documentElement).getPropertyValue(name).trim()
const pick = a => a[Math.floor(Math.random() * a.length)]

let ctx = null, W = 0, H = 0, dpr = 1, running = false
const fx = []

// the text column, the same measure as the page; anything outside it is "in the margin"
export const inMargin = x => Math.abs(x - W / 2) > Math.min(W, 1060) / 2

const push = f => { fx.push(f); if (fx.length > 40) fx.shift(); if (!running) { running = true; requestAnimationFrame(frame) } }

export function addRing(x, y, reach = 110, strength = 0.38, life = 1.8) {
  if (ctx) push({ type: 'ring', x, y, t: performance.now(), reach, strength, life })
}
// loose pieces under gravity: a crumbling snowman, a firework, a popped bubble, a drag trail
function addBits(x, y, bits, life = 1.6) {
  // anything that can settle is given time to reach the floor
  if (bits.some(b => PILES.includes(b.form))) life = Math.max(life, 4.5)
  if (ctx) push({ type: 'bits', x, y, t: performance.now(), life, bits })
}
const bit = (form, paint, o = {}) => ({ form, paint, vx: 0, vy: 0, g: 120, rot: Math.random() * 6.28, vr: (Math.random() - 0.5) * 4, s: 8, ...o })

// five petals (spring) or leaves (autumn) open from the centre, hold, then let go one by one
function addFan(x, y, season) {
  const spin = Math.random() * 6.28
  const petals = Array.from({ length: 5 }, (_, k) => {
    const [form, paints] = season === 'spring' ? ['petal-round', ['--spring']] : pick(formsFor('autumn'))
    return { form, paint: pick(paints), a: spin + k * Math.PI * 2 / 5, delay: 0.12 * k + Math.random() * 0.1,
      vx: (Math.random() - 0.5) * 30, vr: (Math.random() - 0.5) * 5 }
  })
  push({ type: 'fan', x, y, t: performance.now(), life: 5.5, s: season === 'spring' ? 13 + Math.random() * 5 : 10 + Math.random() * 4, petals, centre: season === 'spring' })
}
function addSnowman(x, y) { push({ type: 'snowman', x, y, t: performance.now(), life: STAND + MELT + 0.1, shed: 0 }) }
// a few sparks, for a drag through a summer night
function addSparkle(x, y, n = 5) {
  addBits(x, y, Array.from({ length: n }, (_, k) => {
    const a = k / n * Math.PI * 2 + Math.random() * 0.4, v = 30 + Math.random() * 30
    return bit('spark', pick(SPARKS), { vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: 50, s: 3 + Math.random() * 2, drag: 1.6 })
  }), 1.2)
}
// a real firework: a rocket climbs with a tail, bursts with a flash into streaks of one colour with a
// few white ones, the streaks droop under gravity and twinkle out
const SHELL = ['--santa', '--ginkgo', '--spring', '--rain', '--maple']
function addFirework(x, y, n = 80) {
  if (!ctx) return
  const from = Math.min(H + 10, y + 170 + Math.random() * 60), main = pick(SHELL), accent = pick(SHELL.filter(c => c !== main))
  const sparks = Array.from({ length: n }, () => {
    const a = Math.random() * Math.PI * 2, v = 95 + Math.random() * 95
    return { vx: Math.cos(a) * v, vy: Math.sin(a) * v, paint: Math.random() < 0.25 ? accent : main, tw: Math.random() * 6.28 }
  })
  push({ type: 'firework', x, y, from, t: performance.now(), rise: 0.55, life: 0.55 + 2.2, sparks })
}
export const popAt = (x, y) => addPop(x, y)
function addPop(x, y) {
  addRing(x, y, 22, 0.4, 0.8)
  addBits(x, y, Array.from({ length: 7 }, (_, k) => {
    const a = k / 7 * Math.PI * 2, v = 40 + Math.random() * 30
    return bit('spark', '--rain', { vx: Math.cos(a) * v, vy: Math.sin(a) * v - 20, g: 160, s: 2.6 })
  }), 1.0)
}

// a handful of the season thrown out around a click; what can settle falls and joins the drift
function spray(x, y, s) {
  const n = 10 + Math.floor(Math.random() * 5), m = s === 'summer' ? summerMode() : null
  if (m === 'night') return   // the click's own firework is the show
  addBits(x, y, Array.from({ length: n }, () => {
    const a = Math.random() * Math.PI * 2, v = 30 + Math.random() * 70, vx = Math.cos(a) * v, vy = Math.sin(a) * v - 40
    if (s === 'winter') return bit('snow', '--snow', { vx, vy, g: 60, s: 4 + Math.random() * 4 })
    if (s === 'spring') return bit('petal', '--spring', { vx, vy, g: 55, s: 8 + Math.random() * 5 })
    if (s === 'autumn') { const [form, paints] = pick(formsFor('autumn')); return bit(form, pick(paints), { vx, vy, g: 60, s: 8 + Math.random() * 5 }) }
    if (m === 'sun') return bit('bubble', '--rain', { vx: vx * 0.5, vy: -20 - Math.random() * 30, g: -10, s: 7 + Math.random() * 8, vr: 0 })
    return bit('drop', '--rain', { vx: vx * 0.3, vy: 10 + Math.random() * 20, g: 260, s: 7 + Math.random() * 4, rot: 0, vr: 0 })   // rain
  }), m === 'sun' ? 3.5 : m === 'rain' ? 1.6 : 6)
}

// what a click in the margin brings, by season
function clickAt(x, y) {
  const s = activeSeason()
  spray(x, y, s)
  if (s === 'spring' || s === 'autumn') return addFan(x, y, s)
  if (s === 'winter') return addSnowman(x, y)
  const m = summerMode()
  if (m === 'night') addFirework(x, y)
  else if (m === 'sun') addPop(x, y)
  else addRing(x, y)
}
// what a drag through the margin leaves along its path
function trailAt(x, y) {
  const s = activeSeason()
  if (s === 'winter') return addBits(x, y, [0, 1].map(() => bit('snow', '--snow', { vx: (Math.random() - 0.5) * 20, vy: 10, g: 30, s: 4 + Math.random() * 3 })), 1.8)
  if (s === 'spring') return addBits(x, y, [bit('petal', '--spring', { vx: (Math.random() - 0.5) * 24, vy: 8, g: 40, s: 9 + Math.random() * 4 })], 1.8)
  if (s === 'autumn') { const [form, paints] = pick(formsFor('autumn')); return addBits(x, y, [bit(form, pick(paints), { vx: (Math.random() - 0.5) * 24, vy: 8, g: 50, s: 9 + Math.random() * 4 })], 1.8) }
  const m = summerMode()
  if (m === 'night') addSparkle(x, y)
  else if (m === 'sun') addBits(x, y, [bit('bubble', '--rain', { vx: (Math.random() - 0.5) * 16, vy: -14, g: -12, s: 8 + Math.random() * 6, vr: 0 })], 2.2)
  else addRing(x, y, 18, 0.32, 0.9)
}

const FDRAG = 1.3, FG = 60
const fpos = (sp, t) => { const k = (1 - Math.exp(-FDRAG * t)) / FDRAG; return [sp.vx * k, sp.vy * k + 0.5 * FG * t * t] }
function firework(f, age) {
  if (age < f.rise) {                                               // the climb, with a short fading tail
    const p = out(age / f.rise), y = f.from + (f.y - f.from) * p
    const g = ctx.createLinearGradient(f.x, y, f.x, y + 26)
    g.addColorStop(0, css('--ginkgo')); g.addColorStop(1, 'transparent')
    ctx.globalAlpha = 0.9; ctx.strokeStyle = g; ctx.lineWidth = 2
    ctx.beginPath(); ctx.moveTo(f.x, y); ctx.lineTo(f.x + Math.sin(age * 30) * 0.6, y + 26); ctx.stroke()
    return
  }
  const t = age - f.rise, span = f.life - f.rise, fade = Math.max(0, 1 - t / span)
  if (t < 0.25) {                                                   // the flash
    const r = 10 + t * 160, g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, r)
    g.addColorStop(0, css('--paper-snow')); g.addColorStop(1, 'transparent')
    ctx.globalAlpha = 0.35 * (1 - t / 0.25); ctx.fillStyle = g
    ctx.beginPath(); ctx.arc(f.x, f.y, r, 0, Math.PI * 2); ctx.fill()
  }
  ctx.lineWidth = 2; ctx.lineCap = 'round'
  for (const sp of f.sparks) {
    const [x1, y1] = fpos(sp, t), [x0, y0] = fpos(sp, Math.max(0, t - 0.16))   // a longer streak behind each spark
    // twinkle as it dies: late sparks flicker on and off
    const twinkle = fade < 0.45 ? (Math.sin(t * 28 + sp.tw) > -0.2 ? 1 : 0.15) : 1
    ctx.globalAlpha = 0.95 * fade * twinkle
    const c = css(sp.paint), grad = ctx.createLinearGradient(f.x + x0, f.y + y0, f.x + x1, f.y + y1)
    grad.addColorStop(0, 'transparent'); grad.addColorStop(1, c)
    ctx.strokeStyle = grad
    ctx.beginPath(); ctx.moveTo(f.x + x0, f.y + y0); ctx.lineTo(f.x + x1, f.y + y1); ctx.stroke()
    ctx.fillStyle = c; ctx.beginPath(); ctx.arc(f.x + x1, f.y + y1, 1.6, 0, Math.PI * 2); ctx.fill()   // the bright head
  }
}

function ring(f, age, color) {
  ctx.strokeStyle = color; ctx.lineWidth = 1
  for (const lag of LAGS) {
    const a = (age - lag) / f.life; if (a < 0 || a > 1) continue
    ctx.globalAlpha = f.strength * (1 - a) * (1 - lag)
    ctx.beginPath(); ctx.arc(f.x, f.y, 4 + out(a) * f.reach, 0, Math.PI * 2); ctx.stroke()
  }
}
function bits(f, age) {
  const fade = Math.max(0, 1 - age / f.life)
  for (const b of f.bits) {
    if (b.done) continue
    const k = b.drag ? (1 - Math.exp(-b.drag * age)) / b.drag : age   // sparks slow down as they fly
    const x = f.x + b.vx * k, y = f.y + b.vy * k + 0.5 * b.g * age * age
    if (PILES.includes(b.form) && inMargin(x) && y >= floorAt(x) && settle({ x, form: b.form, paint: b.paint, s: b.s, rot: b.rot + b.vr * age })) { b.done = true; continue }
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(b.rot + b.vr * age)
    ctx.globalAlpha = 0.7 * fade
    paint(b, css(b.paint))
    ctx.restore()
  }
}
// bubbles are outlines with a glint; everything else is filled
function paint(b, color) {
  shape(ctx, b.form, b.s)
  if (b.form === 'bubble') {
    ctx.strokeStyle = color; ctx.lineWidth = 1.2; ctx.stroke()
    ctx.globalAlpha *= 0.18; ctx.fillStyle = color; ctx.fill()
  } else { ctx.fillStyle = color; ctx.fill() }
}
const OPEN = 0.6, HOLD = 1.4
function fan(f, age) {
  const open = out(Math.min(1, age / OPEN)), s = f.s
  for (const p of f.petals) {
    const t = Math.max(0, age - HOLD - p.delay)                       // seconds since this one let go
    const fade = t ? Math.max(0.35, 1 - t / (f.life - HOLD)) : 1   // stays visible enough to land
    if (fade <= 0 || p.done) continue
    const r = s * (f.centre ? 0.55 : 0.85) * open
    const x = f.x + Math.sin(p.a) * r + (Math.sin(p.a) * 18 + p.vx) * t, y = f.y - Math.cos(p.a) * r + 42 * t * t + Math.sin(t * 3 + p.a) * 4 * t
    if (t && inMargin(x) && y >= floorAt(x) && settle({ x, form: p.form === 'petal-round' ? 'petal' : p.form, paint: p.paint, s: p.form === 'petal-round' ? s * 0.9 : s, rot: p.a + p.vr * t })) { p.done = true; continue }
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(p.a + p.vr * t)
    ctx.globalAlpha = 0.65 * fade; ctx.fillStyle = css(p.paint)
    if (p.form === 'petal-round') { ctx.beginPath(); ctx.ellipse(0, 0, s * 0.32 * open + 0.1, s * 0.55 * open + 0.1, 0, 0, Math.PI * 2) }
    else shape(ctx, p.form, s * open + 0.1)
    ctx.fill(); ctx.restore()
  }
  if (!f.centre) return
  const c = age < HOLD ? 1 : Math.max(0, 1 - (age - HOLD) / 0.8)
  if (c > 0) { ctx.globalAlpha = 0.8 * c; ctx.fillStyle = css('--ginkgo'); ctx.beginPath(); ctx.arc(f.x, f.y, 2.6 * open, 0, Math.PI * 2); ctx.fill() }
}
// pops up with a bounce, stands a moment, then comes apart from the top down, a few flakes at a
// time, drifting down while what is left grows fainter
const STAND = 1.4, MELT = 1.6, FLAKES = 34
function snowman(f, age) {
  const melt = Math.max(0, Math.min(1, (age - STAND) / MELT))
  const due = Math.floor(melt * FLAKES)
  for (; f.shed < due; f.shed++) {
    const k = f.shed / FLAKES, head = k < 0.4                       // the head goes first
    const cy = head ? -11 : 2, r = head ? 6.5 : 9, a = Math.random() * 6.28, d = Math.sqrt(Math.random()) * r
    addBits(f.x + Math.cos(a) * d, f.y + cy + Math.sin(a) * d,
      [bit('snow', '--snow', { vx: (Math.random() - 0.5) * 40, vy: 4 + Math.random() * 14, g: 45, s: 4.5 + Math.random() * 3.5 })], 6)
  }
  const pop = age < 0.35 ? out(age / 0.35) * 1.15 : 1.15 - 0.15 * Math.min(1, (age - 0.35) / 0.2)
  if (melt >= 1) return
  ctx.save(); ctx.translate(f.x, f.y); ctx.scale(pop, pop)
  ctx.fillStyle = css('--paper-snow'); ctx.strokeStyle = css('--snow'); ctx.lineWidth = 1.2
  // the head thins out over the first part of the melt, the body over the rest
  const headLeft = Math.max(0, 1 - melt / 0.45), bodyLeft = Math.max(0, 1 - Math.max(0, melt - 0.3) / 0.7)
  for (const [cy, r, left] of [[2, 9, bodyLeft], [-11, 6.5, headLeft]]) {
    if (left <= 0) continue
    ctx.globalAlpha = 0.9 * left
    ctx.beginPath(); ctx.arc(0, cy, r * (0.7 + 0.3 * left), 0, Math.PI * 2); ctx.fill(); ctx.stroke()
  }
  if (headLeft > 0) {
    ctx.globalAlpha = 0.9 * headLeft; ctx.fillStyle = css('--ink')
    for (const ex of [-2.2, 2.2]) { ctx.beginPath(); ctx.arc(ex, -12.5, 0.9, 0, Math.PI * 2); ctx.fill() }
    ctx.fillStyle = css('--maple'); ctx.beginPath(); ctx.moveTo(0, -11); ctx.lineTo(5, -10); ctx.lineTo(0, -9.4); ctx.closePath(); ctx.fill()
  }
  ctx.restore()
}

function frame(now) {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H)
  const color = css(RING[activeSeason()])   // read each frame, so a theme switch keeps the right shade
  for (let i = fx.length - 1; i >= 0; i--) {
    const f = fx[i], age = (now - f.t) / 1000
    if (age > f.life + (f.type === 'ring' ? LAGS[LAGS.length - 1] : 0)) { fx.splice(i, 1); continue }
    if (f.type === 'ring') ring(f, age, color)
    else if (f.type === 'bits') bits(f, age)
    else if (f.type === 'fan') fan(f, age)
    else if (f.type === 'firework') firework(f, age)
    else snowman(f, age)
  }
  ctx.globalAlpha = 1
  if (fx.length) requestAnimationFrame(frame)
  else { ctx.clearRect(0, 0, W, H); running = false }
}

// for the summer night: a small firework now and then, somewhere in the upper margins
export function burstInMargin() {
  if (!ctx || W < 1180) return
  const side = Math.random() < 0.5, edge = (W - Math.min(W, 1060)) / 2
  addFirework(side ? 20 + Math.random() * (edge - 40) : W - edge + 20 + Math.random() * (edge - 40), 90 + Math.random() * H * 0.4, 60)
}

export function ripple() {
  if (!matchMedia('(pointer: fine)').matches) return
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const cv = document.createElement('canvas')
  cv.setAttribute('aria-hidden', 'true')
  Object.assign(cv.style, { position: 'fixed', inset: '0', width: '100%', height: '100%', pointerEvents: 'none', zIndex: '0' })
  document.body.prepend(cv)
  ctx = cv.getContext('2d')
  const size = () => { dpr = devicePixelRatio || 1; W = innerWidth; H = innerHeight; cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr) }
  addEventListener('resize', size); size()

  let lx = 0, ly = 0
  // a drag that starts in a margin draws; it should not also select the text it passes over
  addEventListener('mousedown', e => { if (inMargin(e.clientX) && !e.target.closest('a, button, input, select, textarea, label, summary')) e.preventDefault() })
  addEventListener('pointerdown', e => {
    if (e.pointerType !== 'mouse') return
    lx = e.clientX; ly = e.clientY
    if (inMargin(lx)) clickAt(lx, ly); else addRing(lx, ly)
  })
  addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse' || !(e.buttons & 1) || !inMargin(e.clientX)) return
    if (Math.hypot(e.clientX - lx, e.clientY - ly) < 18) return    // one piece every few steps of the drag
    lx = e.clientX; ly = e.clientY
    trailAt(lx, ly)
  }, { passive: true })
}
