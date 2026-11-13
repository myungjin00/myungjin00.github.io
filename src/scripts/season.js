// The season on the page: petals in spring, ginkgo and maple in autumn, snow in winter, and in summer
// fireworks on the dark theme, and on the light one rain or bubbles as Seoul's weather has it.
// Things drift in the margins and only faintly across the text column, and what lands in a margin
// piles up until a cat walks by. The season follows Seoul unless the reader picks one (or turns it
// off); the pick is remembered in this browser.
import { seoulNow, season as seoulSeason, asOf, setAsOf, asOfWeather, dateInSeason } from './seoul.js'
import { addRing, inMargin, burstInMargin, popAt } from './ripple.js'
import { cat, squirrel, santa, penguin, pickCoat, present, nutcracker } from './critters.js'

const KEY = 'season'
export const SEASONS = ['spring', 'summer', 'autumn', 'winter']
export function chosen() {
  try { const v = localStorage.getItem(KEY); return v && (v === 'off' || SEASONS.includes(v)) ? v : 'auto' } catch { return 'auto' }
}
// a season picked before the bar moved the date instead is converted the first time it is seen,
// so the bar and what is on screen cannot disagree
try {
  const old = localStorage.getItem(KEY)
  if (old && SEASONS.includes(old)) { localStorage.removeItem(KEY); setAsOf(dateInSeason(old)) }
} catch {}

// the season that colours things: the pick, or Seoul's own when the pick is auto or off
export const activeSeason = () => { const c = chosen(); return SEASONS.includes(c) ? c : seoulSeason(seoulNow()) }

// Seoul's weather, asked once and kept for half an hour; a failed ask counts as a dry day
let raining = false
export async function loadWeather() {
  const set = asOfWeather()
  if (set) return (raining = set === 'rain')          // the reader said what the day was like
  if (asOf()) return (raining = false)                 // a chosen day with nothing said is a dry one
  try { const c = JSON.parse(sessionStorage.getItem('seoul-wx') || 'null'); if (c && Date.now() - c.t < 30 * 60e3) return (raining = c.r) } catch {}
  try {
    const j = await (await fetch('https://api.open-meteo.com/v1/forecast?latitude=37.57&longitude=126.98&current=precipitation,weather_code')).json()
    const code = j.current.weather_code
    raining = j.current.precipitation > 0 || (code >= 51 && code <= 67) || (code >= 80 && code <= 82) || code >= 95
    try { sessionStorage.setItem('seoul-wx', JSON.stringify({ t: Date.now(), r: raining })) } catch {}
  } catch { raining = false }
  return raining
}
// summer follows the page: fireworks on the dark theme, and on the light one rain or bubbles as Seoul's
// weather has it. Most devices switch theme at their own sunset, so this is the reader's night and day.
const darkTheme = () => document.documentElement.dataset.theme === 'dark'
export const summerMode = () => (darkTheme() ? 'night' : raining ? 'rain' : 'sun')

const css = name => getComputedStyle(document.documentElement).getPropertyValue(name).trim()
// each falling shape: its form and the colours it may take
const FORMS = {
  spring: [['petal', ['--spring']]],
  rain: [['drop', ['--rain']]],
  sun: [['bubble', ['--rain']]],
  night: [],                       // the summer night has fireworks instead
  autumn: [['ginkgo', ['--ginkgo']], ['maple', ['--maple', '--leaf', '--ginkgo']], ['maple', ['--maple', '--leaf', '--ginkgo']]],
  winter: [['snow', ['--snow']]],
}
// a five-lobed maple leaf, unit size, point up
const MAPLE = [[0,-1],[.18,-.55],[.5,-.75],[.42,-.3],[.95,-.35],[.62,.05],[.8,.3],[.3,.25],[.1,.55],[0,.45],[-.1,.55],[-.3,.25],[-.8,.3],[-.62,.05],[-.95,-.35],[-.42,-.3],[-.5,-.75],[-.18,-.55]]

export const formsFor = kind => FORMS[kind === 'summer' ? summerMode() : kind]

export function shape(ctx, form, s) {
  ctx.beginPath()
  if (form === 'spark' || form === 'bubble') { ctx.arc(0, 0, s * 0.5, 0, Math.PI * 2); return }
  if (form === 'snow') { ctx.arc(0, 0, s * 0.45, 0, Math.PI * 2); return }
  if (form === 'maple') {
    MAPLE.forEach(([x, y], i) => (i ? ctx.lineTo : ctx.moveTo).call(ctx, x * s, y * s))
    ctx.closePath(); ctx.rect(-s * 0.03, s * 0.45, s * 0.06, s * 0.4); return   // and a short stem
  }
  if (form === 'petal') {            // a petal with a small notch at its tip
    ctx.moveTo(0, s * 0.7)
    ctx.bezierCurveTo(-s * 0.9, s * 0.2, -s * 0.6, -s * 0.8, -s * 0.12, -s * 0.7)
    ctx.lineTo(0, -s * 0.5); ctx.lineTo(s * 0.12, -s * 0.7)
    ctx.bezierCurveTo(s * 0.6, -s * 0.8, s * 0.9, s * 0.2, 0, s * 0.7); return
  }
  if (form === 'drop') {              // a raindrop, point up
    const r = s * 0.42
    ctx.moveTo(0, -s * 0.75)
    ctx.bezierCurveTo(r * 0.55, -s * 0.3, r, 0, r, s * 0.18)
    ctx.arc(0, s * 0.18, r, 0, Math.PI)
    ctx.bezierCurveTo(-r, 0, -r * 0.55, -s * 0.3, 0, -s * 0.75); return
  }
  // autumn: a ginkgo fan on a short stem
  ctx.moveTo(0, s * 0.55)
  ctx.lineTo(-s * 0.85, -s * 0.35)
  ctx.quadraticCurveTo(0, -s * 0.95, s * 0.85, -s * 0.35)
  ctx.closePath()
}

// who comes to clear the drift, by season: a cat in spring, a squirrel in autumn, Santa in December
// and a penguin in January and February. Summer leaves nothing behind, so on a clear day the cat just
// strolls by and jumps at the odd bubble. The drawings are in critters.js.
const sliding = c => ((performance.now() / 1000 + c.seed) % 4.2) < 1.1
function clearer(ctx, c, t, H, dpr, kind) {
  ctx.setTransform(c.dir * dpr, 0, 0, dpr, c.x * dpr, (H - 2) * dpr)
  ctx.globalAlpha = 1
  // a hairline in the page's opposite tone, so a black cat shows on the dark theme and a white one on the light
  const rim = document.documentElement.dataset.theme === 'dark' ? 'rgba(255,255,255,.32)' : 'rgba(0,0,0,.22)'
  if (kind === 'winter') seoulNow().month === 12 ? santa(ctx, t, rim) : penguin(ctx, t, rim, sliding(c))
  else if (kind === 'autumn') squirrel(ctx, t, rim)
  else cat(ctx, t, c.coat ??= pickCoat(), rim, c.jump && t - c.jump < 0.45 ? (t - c.jump) / 0.45 : 0)
}

// December, in the right margin: a present turns up, the lid goes, and a nutcracker marches out of
// it and off the page. One visit every minute or so; the rest of the time there is nothing there.
let gift = null
const resetGift = () => { gift = null }
function giftScene(ctx, t, dt, right, H, dpr, rim) {
  if (!gift) gift = { phase: 'wait', until: t + 8 + Math.random() * 12, x: 0, mx: 0, t0: 0 }
  const g = gift
  const at = (x, y = 0) => ctx.setTransform(dpr, 0, 0, dpr, x * dpr, (H - 2 + y) * dpr)
  ctx.globalAlpha = 1
  if (g.phase === 'wait') {
    if (t < g.until) return
    g.x = right + 30 + Math.random() * 18
    g.phase = 'sit'; g.until = t + 2.4
  }
  if (g.phase === 'sit') {
    at(g.x); present(ctx, 0, rim)
    if (t >= g.until) { g.phase = 'open'; g.t0 = t }
  } else if (g.phase === 'open') {
    const p = Math.min(1, (t - g.t0) / 0.7)
    at(g.x); present(ctx, p * p * 30, rim)
    if (p === 1) { g.phase = 'rise'; g.t0 = t }
  } else if (g.phase === 'rise') {
    const p = Math.min(1, (t - g.t0) / 0.9)
    at(g.x, 36 * (1 - p)); nutcracker(ctx, t, rim)     // he comes up from inside, so draw him first
    at(g.x); present(ctx, null, rim)                   // and the open box in front of his legs
    if (p === 1) { g.phase = 'march'; g.mx = g.x }
  } else if (g.phase === 'march') {
    g.mx += 46 * dt
    at(g.x); present(ctx, null, rim)
    at(g.mx); nutcracker(ctx, t, rim)
    if (g.mx > innerWidth + 40) gift = null
  }
}

// what has landed: a small drift along the bottom of each margin, shared with the click effects
let pile = [], heights = new Map(), sweepers = [], flung = [], floorH = 0
const BUCKET_W = 10
const heightAt = x => heights.get(Math.floor(x / BUCKET_W)) ?? 0
export const floorAt = x => floorH - 3 - heightAt(x)
export function settle(p) {
  if (!floorH || chosen() === 'off') return false
  const top = Math.min(40, heightAt(p.x) + p.s * (p.form === 'snow' ? 0.5 : 0.3))
  pile.push({ ...p, y: floorAt(p.x), top }); heights.set(Math.floor(p.x / BUCKET_W), top)
  return true
}

export function seasonFall() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const cv = document.createElement('canvas')
  cv.setAttribute('aria-hidden', 'true')
  Object.assign(cv.style, { position: 'fixed', inset: '0', width: '100%', height: '100%', pointerEvents: 'none', zIndex: '0' })
  document.body.prepend(cv)
  const ctx = cv.getContext('2d')

  let W = 0, H = 0, dpr = 1, bits = [], kind = null, raf = 0, prev = 0
  // what has landed: a small drift along the bottom of each margin, and the sweepers who clear it
  const BUCKET = 10, PILE_CAP = 36
  const restack = () => { heights = new Map(); for (const p of pile) { const k = Math.floor(p.x / BUCKET_W); heights.set(k, Math.max(heights.get(k) ?? 0, p.top)) } }
  const spawn = (top) => {
    const s = kind === 'winter' ? 5 + Math.random() * 4 : 11 + Math.random() * 7
    const forms = formsFor(kind), [form, paints] = forms[Math.floor(Math.random() * forms.length)]
    const enter = form === 'bubble' ? H + 20 + Math.random() * H * 0.3 : -20 - Math.random() * H * 0.3   // bubbles rise from below
    return { form, paint: paints[Math.floor(Math.random() * paints.length)], x: Math.random() * W, y: top ? enter : Math.random() * H, s,
      vy: form === 'bubble' ? -(14 + Math.random() * 14) : (kind === 'winter' ? 14 : form === 'drop' ? 34 : 18) + Math.random() * 14,
      sway: form === 'drop' ? 3 : 10 + Math.random() * 18,
      ph: Math.random() * 6.28, rot: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.8,
      // about a third of the raindrops land somewhere on the way down and leave a small ripple
      land: form === 'drop' && Math.random() < 0.35 ? H * (0.3 + Math.random() * 0.65) : null }
  }
  const size = () => {
    dpr = devicePixelRatio || 1; W = innerWidth; H = innerHeight
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr)
    pile = []; heights = new Map(); sweepers = []; flung = []; floorH = H; resetGift()   // a new size, a clean floor
    const n = formsFor(kind).length ? Math.round(Math.min(18, Math.max(8, (W * H) / 90000))) : 0   // fewer, now that each is larger
    while (bits.length < n) bits.push(spawn(false))
    bits.length = n
  }

  function frame(now) {
    const dt = Math.min(0.05, (now - prev) / 1000 || 0); prev = now
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H)
    const cols = {}   // read once a frame, so a theme switch recolours what is already falling
    const full = kind === 'winter' ? 0.7 : 0.4
    // the text column, where shapes pass faintly so they never sit on a line being read
    const half = Math.min(W, 1060) / 2, left = W / 2 - half, right = W / 2 + half
    for (const b of bits) {
      b.y += b.vy * dt; b.ph += dt * 0.9; b.rot += b.vr * dt
      const x = b.x + Math.sin(b.ph) * b.sway
      ctx.globalAlpha = x > left && x < right ? full * 0.22 : full
      // petals, leaves and snow come to rest along the bottom of the margins; never over the text
      if (b.form === 'bubble') { if (b.y < -30) Object.assign(b, spawn(true)) }
      else if (b.form !== 'drop' && inMargin(x) && b.y >= H - 3 - heightAt(x)) {
        settle({ x, form: b.form, paint: b.paint, s: b.s, rot: b.rot })
        Object.assign(b, spawn(true)); continue
      }
      else if (b.y > H + 20) Object.assign(b, spawn(true))
      else if (b.land && b.y >= b.land) {
        if (inMargin(x)) { addRing(x, b.y, 26, 0.32, 1.2); Object.assign(b, spawn(true)); continue }
        b.land = null   // over the text: keep falling rather than ripple on a line being read
      }
      ctx.setTransform(dpr, 0, 0, dpr, x * dpr, b.y * dpr)
      ctx.rotate(['snow', 'drop', 'bubble'].includes(b.form) ? 0 : b.rot)   // snow, rain and bubbles keep upright
      const c = cols[b.paint] ??= css(b.paint)
      shape(ctx, b.form, b.s)
      if (b.form === 'bubble') {                                        // a clearer rim, a faint fill, and a glint
        const a = ctx.globalAlpha
        ctx.globalAlpha = Math.min(1, a * 1.8); ctx.strokeStyle = c; ctx.lineWidth = 1.3; ctx.stroke()
        ctx.globalAlpha = a * 0.3; ctx.fillStyle = c; ctx.fill()
        ctx.globalAlpha = Math.min(1, a * 2); ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 1.2
        ctx.beginPath(); ctx.arc(0, 0, b.s * 0.32, Math.PI * 1.1, Math.PI * 1.45); ctx.stroke()
      } else { ctx.fillStyle = c; ctx.fill() }
    }

    // the drift, drawn where each piece settled
    ctx.globalAlpha = full
    for (const p of pile) {
      ctx.setTransform(dpr, 0, 0, dpr, p.x * dpr, p.y * dpr)
      ctx.rotate(p.form === 'snow' ? 0 : p.rot)
      ctx.fillStyle = cols[p.paint] ??= css(p.paint)
      shape(ctx, p.form, p.s); ctx.fill()
    }
    // once enough has piled up, someone of the season comes out along each margin and kicks the drift off the page
    if (pile.length >= PILE_CAP && !sweepers.length && left > 60)
      sweepers = [{ x: left - 4, dir: -1, seed: Math.random() * 4 }, { x: right + 4, dir: 1, seed: Math.random() * 4 }]
    // a clear summer day: now and then the cat comes out for a stroll along one margin
    if (kind === 'summer' && summerMode() === 'sun' && !sweepers.length && left > 60 && now > nextStroll) {
      if (nextStroll) sweepers = [Math.random() < 0.5 ? { x: left - 4, dir: -1 } : { x: right + 4, dir: 1 }]
      nextStroll = now + 25000 + Math.random() * 15000
    }
    for (let i = sweepers.length - 1; i >= 0; i--) {
      const sw = sweepers[i], from = sw.x
      sw.x += sw.dir * (kind === 'winter' && seoulNow().month !== 12 && sliding(sw) ? 120 : 46) * dt   // a sliding penguin is quicker
      const lo = Math.min(from, sw.x) - 8, hi = Math.max(from, sw.x) + 8
      const keep = []
      for (const p of pile) {
        if (p.x >= lo && p.x <= hi && (sw.dir < 0 ? p.x < left : p.x > right))
          flung.push({ ...p, vx: sw.dir * (40 + Math.random() * 60), vy: -(70 + Math.random() * 70), vr: (Math.random() - 0.5) * 8, age: 0 })
        else keep.push(p)
      }
      if (keep.length !== pile.length) { pile = keep; restack() }
      // in summer the cat pounces on any bubble drifting up past it
      if (kind === 'summer') for (const b of bits)
        if (b.form === 'bubble' && Math.abs(b.x - sw.x) < 18 && b.y > H - 80) { popAt(b.x, b.y); Object.assign(b, spawn(true)); sw.jump = now / 1000 }
      clearer(ctx, sw, now / 1000, H, dpr, kind)
      if (sw.x < -30 || sw.x > W + 30) sweepers.splice(i, 1)
    }
    // what the cat kicked up: a short arc, a turn, and gone
    for (let i = flung.length - 1; i >= 0; i--) {
      const f = flung[i]; f.age += dt
      if (f.age > 0.9) { flung.splice(i, 1); continue }
      f.x += f.vx * dt; f.vy += 320 * dt; f.y += f.vy * dt; f.rot += f.vr * dt
      ctx.setTransform(dpr, 0, 0, dpr, f.x * dpr, f.y * dpr); ctx.rotate(f.rot)
      ctx.globalAlpha = full * (1 - f.age / 0.9); ctx.fillStyle = cols[f.paint] ??= css(f.paint)
      shape(ctx, f.form, f.s); ctx.fill()
    }
    // December's own, on the dark theme as the tree is: a present in the right margin, and the
    // nutcracker who marches out of it
    if (kind === 'winter' && seoulNow().month === 12 && darkTheme() && W - right > 80)
      giftScene(ctx, now / 1000, dt, right, H, dpr, 'rgba(255,255,255,.32)')
    else if (gift) resetGift()
    // the summer night: a small firework now and then, up in a margin
    if (kind === 'summer' && summerMode() === 'night' && now > nextBurst) { burstInMargin(); nextBurst = now + 3500 + Math.random() * 4000 }
    raf = requestAnimationFrame(frame)
  }
  let nextBurst = 0, nextStroll = 0
  const stop = () => { cancelAnimationFrame(raf); raf = 0; floorH = 0; ctx.clearRect(0, 0, cv.width, cv.height) }
  const start = () => {
    stop()
    if (chosen() === 'off' || document.hidden) return
    kind = activeSeason(); bits = []; size(); prev = performance.now(); raf = requestAnimationFrame(frame)
  }
  loadWeather().then(r => { if (r && kind === 'summer') start() })   // a wet day turns summer to rain once Seoul answers
  // switching theme switches a summer between fireworks and the daytime sky, there and then
  new MutationObserver(() => { if (kind === 'summer') start() }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
  addEventListener('resize', () => { if (raf) size() })
  document.addEventListener('visibilitychange', start)   // nothing runs in a background tab
  start()

  // the bar shows what is on screen: off, the season of a chosen day, or auto for today
  const picks = [...document.querySelectorAll('.season-select')]
  const showPick = () => {
    const v = chosen() === 'off' ? 'off' : asOf() ? seoulSeason(seoulNow()) : 'auto'
    picks.forEach(p => { p.value = v })
  }
  picks.forEach(pick => {
    pick.addEventListener('change', () => {
      const v = pick.value
      try { v === 'off' ? localStorage.setItem(KEY, 'off') : localStorage.removeItem(KEY) } catch {}
      // picking a season moves the date to the nearest month of it; auto and off go back to today
      setAsOf(SEASONS.includes(v) ? dateInSeason(v) : null)
      showPick()
      start()
    })
  })
  showPick()
  addEventListener('asof', () => { showPick(); loadWeather().then(start) })
}
