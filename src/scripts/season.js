// The season on the page: petals in spring, ginkgo and maple in autumn, snow in winter, and in summer
// fireworks on the dark theme, and on the light one rain or bubbles as Seoul's weather has it.
// Things drift in the margins and only faintly across the text column, and what lands in a margin
// piles up until a cat walks by. The season follows Seoul unless the reader picks one (or turns it
// off); the pick is remembered in this browser.
import { seoulNow, season as seoulSeason, asOf, setAsOf, asOfWeather, dateInSeason } from './seoul.js'
import { addRing, inMargin, burstInMargin, popAt } from './ripple.js'
import { cat, squirrel, santa, penguin, pickCoat, present, nutcracker,
  skier, boarder, dog, duck, swallow, sparrow, whale, dolphin, geese,
  snowman, hydrangea, persimmon, silverGrass, surf, pumpkin } from './critters.js'
import { drawSky, meteorMaybe } from './sky.js'

const KEY = 'season'
export const SEASONS = ['spring', 'summer', 'autumn', 'winter']
export function chosen() {
  try { const v = localStorage.getItem(KEY); return v && (v === 'off' || SEASONS.includes(v)) ? v : 'auto' } catch { return 'auto' }
}
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
// a hairline in the page's opposite tone, so a pale thing shows on the dark theme and vice versa
const rimNow = () => (document.documentElement.dataset.theme === 'dark' ? 'rgba(255,255,255,.32)' : 'rgba(0,0,0,.22)')
// each falling shape: its form and the colours it may take
// Each month has its own falling thing and its own night, so that walking through the year is
// twelve different pages rather than four. A rainy summer day is rain whatever the month says.
const MONTH = {
  1:  { fall: [['snow', ['--snow']]],                                        sky: ['stars', 'meteors'], guest: 'penguin', builds: 'snowman' },
  2:  { fall: [['snow', ['--snow']], ['plum', ['--spring', '--snow']]],       sky: ['winterstars', 'moon'], guest: 'skier' },
  3:  { fall: [['forsythia', ['--ginkgo']]],                                  sky: ['aurora'], guest: 'swallow', nightStops: true },
  4:  { fall: [['petal', ['--spring']]],                                      sky: ['moon'], guest: 'cat', glow: true },
  5:  { fall: [['rose', ['--spring', '--maple']]], rise: [['seed', ['--snow']]], sky: ['moon'], guest: 'sparrow' },
  6:  { fall: [['bubble', ['--rain']]],                                       sky: ['summerstars'], guest: 'duck', stand: 'hydrangea' },
  7:  { fall: [],                                                             sky: ['sun', 'milkyway'], guest: 'cat' },
  8:  { fall: [['bubble', ['--rain']]],                                       sky: ['fireworks'], guest: 'whale', shore: true },
  9:  { fall: [['acorn', ['--maple']]],                                       sky: ['moon', 'moonbig'], guest: 'squirrel' },
  10: { fall: [['maple', ['--maple', '--leaf', '--ginkgo']]],                 sky: ['moon'], guest: 'squirrel', standNight: 'grass' },
  11: { fall: [['dryleaf', ['--maple', '--ginkgo']], ['ginkgo', ['--ginkgo']]], sky: ['moon'], guest: 'dog', stand: 'persimmon' },
  12: { fall: [['snow', ['--snow']]],                                         sky: [], guest: 'santa' },
}
// Seollal and Chuseok move with the lunar calendar, so the few years that matter are written
// out. Daeboreum is the fifteenth night of the first lunar month — the full moon after Seollal.
const LUNAR = {
  2026: { daeboreum: [3, 3], chuseok: [9, 25] },
  2027: { daeboreum: [2, 20], chuseok: [9, 15] },
  2028: { daeboreum: [2, 9], chuseok: [10, 3] },
  2029: { daeboreum: [2, 27], chuseok: [9, 22] },
  2030: { daeboreum: [2, 17], chuseok: [9, 12] },
}
// what today is, if today is one of the handful of days that are their own thing
export function occasion(now = seoulNow()) {
  const { year, month, day } = now
  if (month === 1 && day === 1) return 'sunrise'
  if (month === 10 && day === 9) return 'hangul'
  if (month === 10 && day >= 25) return 'halloween'
  const l = LUNAR[year]
  if (l) {
    for (const k of ['daeboreum', 'chuseok'])
      if (month === l[k][0] && day === l[k][1]) return k
  }
  return null
}

const RAIN = [['drop', ['--rain']]]
const FORMS = {
  spring: [['petal', ['--spring']]],
  rain: RAIN,
  sun: [['bubble', ['--rain']]],
  night: [],
  autumn: [['ginkgo', ['--ginkgo']], ['maple', ['--maple', '--leaf', '--ginkgo']], ['maple', ['--maple', '--leaf', '--ginkgo']]],
  winter: [['snow', ['--snow']]],
}
// a season forced from the bar still has to pick a month to be
const monthNow = () => (SEASONS.includes(chosen()) ? { winter: 1, spring: 4, summer: 7, autumn: 10 }[chosen()] : seoulNow().month)
export const monthPlan = () => MONTH[monthNow()]
// June, July and August follow Seoul: if it is raining there, it is raining here
const wetMonth = m => m >= 6 && m <= 8
export function fallsNow() {
  const m = monthNow(), plan = MONTH[m]
  if (wetMonth(m) && raining) return RAIN
  if (plan.nightStops && darkTheme()) return []
  return plan.fall
}
export function risesNow() {
  const m = monthNow()
  if (wetMonth(m) && raining) return []
  return MONTH[m].rise ?? []
}
// nothing is in the sky on a rainy night, and nothing shares it with the fireworks
export function skyNow() {
  const m = monthNow()
  if (wetMonth(m) && raining) return []
  const want = MONTH[m].sky.filter(s => s !== 'fireworks')
  // and once a year a day takes the sky for itself
  const day = SEASONS.includes(chosen()) ? null : occasion()
  if (day === 'sunrise') return ['sunrise', 'stars']
  if (day === 'daeboreum' || day === 'chuseok') return [...new Set([...want, 'moon', 'moonbig'])]
  return want
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
  if (form === 'plum') {             // five small round petals: a plum blossom, flat on
    for (let i = 0; i < 5; i++) {
      const a = i * 1.2566 - 1.5708
      ctx.moveTo(Math.cos(a) * s * 0.42, Math.sin(a) * s * 0.42)
      ctx.arc(Math.cos(a) * s * 0.42, Math.sin(a) * s * 0.42, s * 0.3, 0, Math.PI * 2)
    }
    return
  }
  if (form === 'forsythia') {        // four narrow lobes on a cross: a forsythia floret
    for (let i = 0; i < 4; i++) {
      const a = i * 1.5708
      ctx.moveTo(0, 0)
      ctx.quadraticCurveTo(Math.cos(a + 0.3) * s * 0.7, Math.sin(a + 0.3) * s * 0.7,
                           Math.cos(a) * s * 0.85, Math.sin(a) * s * 0.85)
      ctx.quadraticCurveTo(Math.cos(a - 0.3) * s * 0.7, Math.sin(a - 0.3) * s * 0.7, 0, 0)
    }
    return
  }
  if (form === 'rose') {             // a rose petal: wide, cupped, with a rolled edge
    ctx.moveTo(0, s * 0.62)
    ctx.bezierCurveTo(-s * 0.85, s * 0.3, -s * 0.72, -s * 0.62, 0, -s * 0.52)
    ctx.bezierCurveTo(s * 0.72, -s * 0.62, s * 0.85, s * 0.3, 0, s * 0.62)
    return
  }
  if (form === 'seed') {             // a dandelion seed: a tuft of filaments over a small husk
    for (let i = 0; i < 9; i++) {
      const a = -1.5708 + (i - 4) * 0.21
      ctx.moveTo(0, s * 0.2)
      ctx.lineTo(Math.cos(a) * s * 0.8, Math.sin(a) * s * 0.8 + s * 0.2)
    }
    ctx.moveTo(0, s * 0.2); ctx.lineTo(0, s * 0.62)
    return
  }
  if (form === 'acorn') {            // an acorn: a nut under a textured cap
    ctx.moveTo(-s * 0.3, -s * 0.1)
    ctx.quadraticCurveTo(-s * 0.36, s * 0.55, 0, s * 0.6)
    ctx.quadraticCurveTo(s * 0.36, s * 0.55, s * 0.3, -s * 0.1)
    ctx.closePath()
    ctx.moveTo(-s * 0.38, -s * 0.12)
    ctx.quadraticCurveTo(0, -s * 0.62, s * 0.38, -s * 0.12)
    ctx.closePath()
    ctx.rect(-s * 0.05, -s * 0.72, s * 0.1, s * 0.16)
    return
  }
  if (form === 'dryleaf') {          // a curled, dried leaf — an oak, past its colour
    ctx.moveTo(0, -s * 0.6)
    for (const [dx, dy] of [[0.3, -0.34], [0.2, -0.1], [0.42, 0.06], [0.22, 0.26], [0.36, 0.44], [0.1, 0.52], [0, 0.66]])
      ctx.lineTo(dx * s, dy * s)
    for (const [dx, dy] of [[-0.1, 0.52], [-0.36, 0.44], [-0.22, 0.26], [-0.42, 0.06], [-0.2, -0.1], [-0.3, -0.34]])
      ctx.lineTo(dx * s, dy * s)
    ctx.closePath()
    return
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
// who comes out to clear the drift, by month. The drawings are in critters.js.
function clearer(ctx, c, t, H, dpr, kind) {
  const lift = monthPlan().shore ? 16 : 0          // a whale rides in the water, not on the sand
  ctx.setTransform(c.dir * dpr, 0, 0, dpr, c.x * dpr, (H - 2 - lift) * dpr)
  ctx.globalAlpha = 1
  // a hairline in the page's opposite tone, so a black cat shows on the dark theme and a white one on the light
  const rim = document.documentElement.dataset.theme === 'dark' ? 'rgba(255,255,255,.32)' : 'rgba(0,0,0,.22)'
  const who = monthPlan().guest
  if (who === 'santa') santa(ctx, t, rim)
  else if (who === 'penguin') penguin(ctx, t, rim, sliding(c))
  else if (who === 'skier') penguin(ctx, t, rim, sliding(c))   // the skiers are on the slope; the floor is still swept
  else if (who === 'squirrel') squirrel(ctx, t, rim, c.carry)
  else if (who === 'dog') dog(ctx, t, rim)
  else if (who === 'duck') duck(ctx, t, rim)
  else if (who === 'swallow') swallow(ctx, t, rim)
  else if (who === 'sparrow') sparrow(ctx, t, rim)
  else if (who === 'whale') (c.pod ??= Math.random() < 0.45) ? dolphin(ctx, t, rim) : whale(ctx, t, rim)
  else cat(ctx, t, c.coat ??= pickCoat(), rim, c.jump && t - c.jump < 0.45 ? (t - c.jump) / 0.45 : 0)
}

// December, in the right margin: a present turns up, the lid goes, and a nutcracker marches out of
// it and off the page, every half-minute or so; the rest of the time there is nothing there.
let gift = null
// the snowman each January margin builds for itself, and how far it has been dressed
export const snow = { up: false, bits: [0, 0], at: [0, 0] }
const resetGift = () => { gift = null }
function giftScene(ctx, t, dt, right, H, dpr, rim, dark) {
  if (!gift) gift = { phase: 'wait', until: t + (seoulNow().day >= 25 ? 3 : 8) + Math.random() * (seoulNow().day >= 25 ? 5 : 12), x: 0, mx: 0, t0: 0, day: false }
  const g = gift
  const at = (x, y = 0) => ctx.setTransform(dpr, 0, 0, dpr, x * dpr, (H - 2 + y) * dpr)
  ctx.globalAlpha = 1
  if (g.phase === 'wait') {
    if (t < g.until || !dark) return        // the theme is settled when a visit starts, not mid-stride
    g.day = seoulNow().day >= 25            // on the day itself there is more than one box
    g.x = right + 30 + Math.random() * 18
    g.phase = 'sit'; g.until = t + 2.4
  }
  const extras = (lid) => { if (!g.day) return; at(g.x - 26); present(ctx, lid, rim); at(g.x + 25); present(ctx, lid, rim) }
  if (g.phase === 'sit') {
    extras(0); at(g.x); present(ctx, 0, rim)
    if (t >= g.until) { g.phase = 'open'; g.t0 = t }
  } else if (g.phase === 'open') {
    const p = Math.min(1, (t - g.t0) / 0.7)
    extras(0); at(g.x); present(ctx, p * p * 30, rim)
    if (p === 1) { g.phase = 'rise'; g.t0 = t }
  } else if (g.phase === 'rise') {
    const p = Math.min(1, (t - g.t0) / 0.9)
    extras(0)
    at(g.x, 36 * (1 - p)); nutcracker(ctx, t, rim)     // he comes up from inside, so draw him first
    at(g.x); present(ctx, null, rim)                   // and the open box in front of his legs
    ctx.globalAlpha = 1 - p                            // the lid carries on up and out of sight
    at(g.x); present(ctx, 30 + p * 70, rim)
    ctx.globalAlpha = 1
    if (p === 1) { g.phase = 'march'; g.mx = g.x }
  } else if (g.phase === 'march') {
    g.mx += 46 * dt
    extras(0); at(g.x); present(ctx, null, rim)
    at(g.mx); nutcracker(ctx, t, rim)
    if (g.mx > innerWidth + 40) gift = null
  }
}

// Hangul Day, the ninth of October: the letters drift up through the margins, and when two of
// them pass close enough they lock into the syllable they would make and drift on as one.
const JAMO = ['\u3131', '\u3134', '\u3137', '\u3139', '\u3141', '\u3142', '\u3145', '\u3147', '\u3148', '\u314A', '\u314F', '\u3153', '\u3157', '\u315C', '\u3163']
const PAIRS = { '\u3131\u314F': '\uAC00', '\u3134\u314F': '\uB098', '\u3137\u314F': '\uB2E4', '\u3139\u314F': '\uB77C', '\u3141\u314F': '\uB9C8', '\u3142\u314F': '\uBC14', '\u3145\u314F': '\uC0AC', '\u3147\u314F': '\uC544',
  '\u3131\u3157': '\uACE0', '\u3134\u3157': '\uB178', '\u3137\u3157': '\uB3C4', '\u3141\u3157': '\uBAA8', '\u3142\u3157': '\uBCF4', '\u3147\u3157': '\uC624', '\u3147\u3163': '\uC774', '\u3141\u3163': '\uBBF8' }
let letters = []
function jamo(ctx, t, dt, W, H, left, right, col) {
  const want = Math.max(6, Math.round(W / 170))
  // the first lot are already on their way up, or the margins stay empty for a minute
  const fresh = letters.length === 0
  while (letters.length < want) letters.push({
    ch: JAMO[Math.floor(Math.random() * JAMO.length)],
    x: Math.random() < 0.5 ? Math.random() * left : right + Math.random() * (W - right),
    y: fresh ? Math.random() * H : H + 20 + Math.random() * 40,
    vy: 11 + Math.random() * 10, ph: Math.random() * 6.28,
    s: 15 + Math.random() * 10, made: 0,
  })
  for (const l of letters) {
    l.y -= l.vy * dt; l.ph += dt * 0.7
    if (l.made) l.made -= dt
    if (l.y < -30) { l.y = H + 20 + Math.random() * 40; l.x = Math.random() < 0.5 ? Math.random() * left : right + Math.random() * (W - right); l.ch = JAMO[Math.floor(Math.random() * JAMO.length)]; l.made = 0 }
  }
  // two that pass close enough become the syllable they spell
  for (let i = 0; i < letters.length; i++) for (let j = i + 1; j < letters.length; j++) {
    const a = letters[i], b = letters[j]
    if (a.made || b.made || a.ch.length > 1 || b.ch.length > 1) continue
    if (Math.abs(a.x - b.x) > 26 || Math.abs(a.y - b.y) > 20) continue
    const made = PAIRS[a.ch + b.ch] ?? PAIRS[b.ch + a.ch]
    if (!made) continue
    a.ch = made; a.made = 2.6; a.s = Math.max(a.s, b.s) * 1.25
    b.y = H + 25; b.ch = JAMO[Math.floor(Math.random() * JAMO.length)]
  }
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  for (const l of letters) {
    const x = l.x + Math.sin(l.ph) * 9
    ctx.globalAlpha = l.made > 0 ? 0.95 : 0.55
    ctx.fillStyle = col
    // canvas cannot read a CSS variable, so the stack is written out here
    ctx.font = `${l.made > 0 ? 600 : 400} ${l.s}px "IBM Plex Sans KR", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif`
    ctx.fillText(l.ch, x, l.y)
  }
  ctx.globalAlpha = 1
}

// February's margins are a slope, so the skier and the boarder come down them rather than
// walking the floor like everyone else, carving as they go and leaving a track that fades.
let glider = null
function slope(ctx, t, dt, W, H, left, right, dpr, rim) {
  if (!glider) {
    if (Math.random() > dt * 0.06) return
    const onLeft = Math.random() < 0.5
    glider = { board: Math.random() < 0.5, mid: onLeft ? left * 0.5 : right + (W - right) * 0.5,
      amp: Math.min(42, (onLeft ? left : W - right) * 0.3), y: -40, vy: 120 + Math.random() * 50,
      ph: Math.random() * 6.28, trail: [] }
  }
  const g = glider
  g.y += g.vy * dt; g.ph += dt * 1.5
  const x = g.mid + Math.sin(g.ph) * g.amp
  g.trail.push({ x, y: g.y }); if (g.trail.length > 26) g.trail.shift()
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.globalAlpha = 0.5; ctx.strokeStyle = css('--snow'); ctx.lineWidth = 1.6; ctx.lineCap = 'round'
  ctx.beginPath()
  g.trail.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)))
  ctx.stroke()
  ctx.globalAlpha = 1
  // lean into the turn, and face the way the slope is taking them
  const tilt = Math.cos(g.ph) * 0.5
  ctx.setTransform((Math.cos(g.ph) < 0 ? -1 : 1) * dpr, 0, 0, dpr, x * dpr, g.y * dpr)
  ctx.rotate(Math.abs(tilt) * 0.35)
  ;(g.board ? boarder : skier)(ctx, t, rim)
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  if (g.y > H + 50) glider = null
}

// what has landed: a small drift along the bottom of each margin, shared with the click effects
let pile = [], heights = new Map(), sweepers = [], flung = [], floorH = 0
const BUCKET_W = 10
export const MARGIN_FOR_DECOR = 150   // both December decorations appear together or not at all
const heightAt = x => heights.get(Math.floor(x / BUCKET_W)) ?? 0
export const floorAt = x => floorH - 3 - heightAt(x)
export function settle(p) {
  if (!floorH || chosen() === 'off') return false
  const top = Math.min(40, heightAt(p.x) + p.s * (p.form === 'snow' ? 0.5 : 0.3))
  pile.push({ ...p, y: floorAt(p.x), top }); heights.set(Math.floor(p.x / BUCKET_W), top)
  return true
}

// The bar is wired whatever else happens: a reader who asks for reduced motion still gets no
// drifting shapes, but the control that puts the date back has to answer them.
function seasonBar(redraw) {
  const picks = [...document.querySelectorAll('.season-select')]
  const showPick = () => {
    const legacy = chosen()
    const v = legacy === 'off' ? 'off' : SEASONS.includes(legacy) ? legacy : asOf() ? seoulSeason(seoulNow()) : 'auto'
    picks.forEach(p => { p.value = v })
  }
  picks.forEach(pick => {
    pick.addEventListener('change', () => {
      const v = pick.value
      try { v === 'off' ? localStorage.setItem(KEY, 'off') : localStorage.removeItem(KEY) } catch {}
      // picking a season moves the date to the nearest month of it, and auto goes back to today;
      // either way the asof listener below redraws. Off only stops things moving, so it leaves a
      // chosen day alone and has to ask for the redraw itself.
      if (v === 'off') redraw()
      else setAsOf(SEASONS.includes(v) ? dateInSeason(v) : null)
      showPick()
    })
  })
  showPick()
  addEventListener('asof', () => { showPick(); redraw() })
  // a day chosen in one tab should not leave the others showing yesterday
  addEventListener('storage', e => { if (e.key === 'season') { showPick(); redraw() } })
}

export function seasonFall() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return seasonBar(() => {})
  const cv = document.createElement('canvas')
  cv.setAttribute('aria-hidden', 'true')
  Object.assign(cv.style, { position: 'fixed', inset: '0', width: '100%', height: '100%', pointerEvents: 'none', zIndex: '0' })
  document.body.prepend(cv)
  const ctx = cv.getContext('2d')

  let W = 0, H = 0, dpr = 1, bits = [], kind = null, raf = 0, prev = 0
  // what has landed: a small drift along the bottom of each margin, and the sweepers who clear it
  const BUCKET = 10, PILE_CAP = 36
  const restack = () => { heights = new Map(); for (const p of pile) { const k = Math.floor(p.x / BUCKET_W); heights.set(k, Math.max(heights.get(k) ?? 0, p.top)) } }
  // how big each thing is, and how fast it falls: a snowflake drifts, a raindrop drops, a seed hangs
  const SIZE = { snow: [5, 4], plum: [6, 3], forsythia: [6, 4], seed: [8, 4], acorn: [7, 4], dryleaf: [10, 6] }
  const SPEED = { snow: 14, drop: 34, seed: -9, bubble: -16, acorn: 46, dryleaf: 15, plum: 13 }
  const spawn = (top) => {
    const pool = [...fallsNow(), ...risesNow()]
    if (!pool.length) return null
    const [form, paints] = pool[Math.floor(Math.random() * pool.length)]
    const [base, span] = SIZE[form] ?? [11, 7]
    const s = base + Math.random() * span
    const up = (SPEED[form] ?? 0) < 0
    const enter = up ? H + 20 + Math.random() * H * 0.3 : -20 - Math.random() * H * 0.3
    return { form, paint: paints[Math.floor(Math.random() * paints.length)], x: Math.random() * W,
      y: top ? enter : Math.random() * H, s, up,
      vy: (SPEED[form] ?? 18) + (up ? -1 : 1) * Math.random() * 14,
      sway: form === 'drop' ? 3 : form === 'acorn' ? 4 : 10 + Math.random() * 18,
      ph: Math.random() * 6.28, rot: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.8,
      // about a third of the raindrops land somewhere on the way down and leave a small ripple
      land: form === 'drop' && Math.random() < 0.35 ? H * (0.3 + Math.random() * 0.65) : null }
  }
  // a thing that has finished is replaced by whatever the month is dropping now
  const respawn = (b) => { const n = spawn(true); if (n) Object.assign(b, n); else b.y = -9999 }
  const size = () => {
    dpr = devicePixelRatio || 1; W = innerWidth; H = innerHeight
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr)
    pile = []; heights = new Map(); sweepers = []; flung = []; floorH = H; resetGift()   // a new size, a clean floor
    snow.up = false; snow.bits = [0, 0]; glider = null
    const any = fallsNow().length + risesNow().length
    const n = any ? Math.round(Math.min(18, Math.max(8, (W * H) / 90000))) : 0
    while (bits.length < n) { const s = spawn(false); if (!s) break; bits.push(s) }
    bits.length = Math.min(bits.length, n)
  }

  function frame(now) {
    const dt = Math.min(0.05, (now - prev) / 1000 || 0); prev = now
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H)
    const cols = {}   // read once a frame, so a theme switch recolours what is already falling
    const full = kind === 'winter' ? 0.7 : 0.4
    // the text column, where shapes pass faintly so they never sit on a line being read
    const half = Math.min(W, 1060) / 2, left = W / 2 - half, right = W / 2 + half
    // whatever is lit tonight goes in first, behind everything that falls
    const want = skyNow()
    if (want.length) {
      // the Quadrantids peak in the first days of January; the rest of the month is quieter
      if (want.includes('meteors')) meteorMaybe(W, H, (seoulNow().day <= 7 ? 0.012 : 0.0025))
      drawSky(ctx, want, { W, H, t: now / 1000, dt, left, right, dark: darkTheme() })
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    for (const b of bits) {
      b.y += b.vy * dt; b.ph += dt * 0.9; b.rot += b.vr * dt
      const x = b.x + Math.sin(b.ph) * b.sway
      ctx.globalAlpha = x > left && x < right ? full * 0.22 : full
      // petals, leaves and snow come to rest along the bottom of the margins; never over the text
      if (b.up) { if (b.y < -30) respawn(b) }
      else if (b.form !== 'drop' && inMargin(x) && b.y >= H - 3 - heightAt(x)) {
        settle({ x, form: b.form, paint: b.paint, s: b.s, rot: b.rot })
        respawn(b); continue
      }
      else if (b.y > H + 20) respawn(b)
      else if (b.land && b.y >= b.land) {
        if (inMargin(x)) { addRing(x, b.y, 26, 0.32, 1.2); respawn(b); continue }
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

    // what stands in the margins all month: a bush, a branch, grass after dark, a shoreline.
    // The loop above left its own transform behind, so put the page's back first.
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    const plan = monthPlan(), floorY = H - 2
    if (plan.shore) { ctx.globalAlpha = 1; surf(ctx, now / 1000, W, floorY, darkTheme()) }
    const today = SEASONS.includes(chosen()) ? null : occasion()
    if (today === 'halloween' && darkTheme() && left > 80) {
      ctx.globalAlpha = 1
      for (const sx of [left * 0.62, right + (W - right) * 0.38]) {
        ctx.setTransform(dpr, 0, 0, dpr, sx * dpr, floorY * dpr); pumpkin(ctx, now / 1000, rimNow())
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    // Hangul Day: the letters themselves drift in the margins, and now and then two meet
    if (today === 'hangul') {
      ctx.globalAlpha = 1
      jamo(ctx, now / 1000, dt, W, H, left, right, css('--green'))
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    if (plan.guest === 'skier' && left > 80) slope(ctx, now / 1000, dt, W, H, left, right, dpr, rimNow())
    const standing = plan.stand || (darkTheme() && plan.standNight)
    if (standing && left > 80) {
      ctx.globalAlpha = 1
      for (const [sx, seed] of [[left * 0.46, 3], [right + (W - right) * 0.54, 11]]) {
        ctx.setTransform(dpr, 0, 0, dpr, sx * dpr, floorY * dpr)
        if (standing === 'hydrangea') hydrangea(ctx, rimNow(), seed)
        else if (standing === 'persimmon') persimmon(ctx, rimNow())
        else if (standing === 'grass') silverGrass(ctx, now / 1000, rimNow(), seed)
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    // September's geese cross the night once in a while
    if (plan.sky.includes('moon') && seoulNow().month === 9 && darkTheme()) {
      flight += dt * 26
      if (flight > W + 160) flight = -160
      geese(ctx, now / 1000, flight, H * 0.17, css('--snow'), 0.5)
    }

    // the drift, drawn where each piece settled
    ctx.globalAlpha = full
    for (const p of pile) {
      ctx.setTransform(dpr, 0, 0, dpr, p.x * dpr, p.y * dpr)
      ctx.rotate(p.form === 'snow' ? 0 : p.rot)
      ctx.fillStyle = cols[p.paint] ??= css(p.paint)
      shape(ctx, p.form, p.s); ctx.fill()
    }
    // January keeps what falls: once enough snow is down it stands up as a snowman, and stays
    if (plan.builds === 'snowman') {
      if (pile.length >= 22 && !snow.up) snow.up = true
      if (snow.up) {
        ctx.globalAlpha = 1
        for (const [sx, i] of [[left * 0.5, 0], [right + (W - right) * 0.5, 1]]) {
          ctx.setTransform(dpr, 0, 0, dpr, sx * dpr, floorY * dpr)
          snowman(ctx, rimNow(), snow.bits[i])
          snow.at[i] = sx
        }
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      }
    }
    // once enough has piled up, someone of the season comes out along each margin and kicks the drift off the page
    if (!plan.builds && pile.length >= PILE_CAP && !sweepers.length && left > 60)
      sweepers = [{ x: left - 4, dir: -1, seed: Math.random() * 4 }, { x: right + 4, dir: 1, seed: Math.random() * 4 }]
    // Some months leave nothing to sweep — the sea takes August's, January's snow stands up as a
    // snowman, and June's bubbles go the other way — so their visitor comes on a timer instead of
    // waiting for a drift that will never arrive.
    const noDrift = plan.shore || plan.builds || !fallsNow().some(([f]) => f !== 'drop' && f !== 'bubble')
    if (noDrift && !sweepers.length && left > 60 && now > nextStroll) {
      if (nextStroll) sweepers = plan.shore
        ? [Math.random() < 0.5 ? { x: -30, dir: 1 } : { x: W + 30, dir: -1 }]
        : [Math.random() < 0.5 ? { x: left - 4, dir: -1 } : { x: right + 4, dir: 1 }]
      nextStroll = now + (plan.shore ? 9000 : 18000) + Math.random() * 9000
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
        if (b.form === 'bubble' && Math.abs(b.x - sw.x) < 18 && b.y > H - 80) { popAt(b.x, b.y); respawn(b); sw.jump = now / 1000 }
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
    if (kind === 'winter' && seoulNow().month === 12 && W - right >= MARGIN_FOR_DECOR)
      giftScene(ctx, now / 1000, dt, right, H, dpr, 'rgba(255,255,255,.32)', darkTheme())
    else if (gift) resetGift()
    // the summer night: a small firework now and then, up in a margin
    // Fireworks belong to August, not to every summer night — June has its bubbles and the
    // triangle, July its Milky Way. A rainy night gets none of it.
    if (plan.sky.includes('fireworks') && darkTheme() && !(wetMonth(seoulNow().month) && raining) && now > nextBurst) {
      burstInMargin(); nextBurst = now + 3500 + Math.random() * 4000
    }
    raf = requestAnimationFrame(frame)
  }
  let nextBurst = 0, nextStroll = 0, wasWet = raining, flight = -160
  // the last thing drawn left its own transform behind, and clearRect works in that transform,
  // so the identity has to go back before the canvas can actually be emptied
  const stop = () => {
    cancelAnimationFrame(raf); raf = 0; floorH = 0
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height)
  }
  const start = () => {
    stop()
    if (chosen() === 'off' || document.hidden) return
    kind = activeSeason(); wasWet = raining; bits = []; size(); prev = performance.now(); raf = requestAnimationFrame(frame)
  }
  loadWeather().then(r => { if (r && kind === 'summer') start() })   // a wet day turns summer to rain once Seoul answers
  // switching theme switches a summer between fireworks and the daytime sky, there and then
  new MutationObserver(() => { if (kind === 'summer') start() }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
  // A tap in a margin does whatever the month makes of it. Over the text it does nothing, so
  // that reading is never interrupted by something jumping.
  const scatter = (x, y, reach, up) => {
    let hit = 0
    for (const b of bits) {
      const dx = b.x - x, dy = b.y - y, d = Math.hypot(dx, dy)
      if (d > reach) continue
      const k = (1 - d / reach) * 150
      b.vy = (up ? -1 : 1) * (40 + k * 0.7) * (b.up ? -1 : 1)
      b.sway = Math.min(60, b.sway + k * 0.25)
      b.vr = (Math.random() - 0.5) * 6
      hit++
    }
    return hit
  }
  const sweepPile = (x, reach) => {
    const keep = []
    for (const p of pile) {
      if (Math.abs(p.x - x) < reach) flung.push({ ...p, vx: (p.x - x) * 2.2, vy: -(60 + Math.random() * 90), vr: (Math.random() - 0.5) * 8, age: 0 })
      else keep.push(p)
    }
    if (keep.length !== pile.length) { pile = keep; restack() }
  }
  addEventListener('pointerdown', e => {
    if (!raf || chosen() === 'off') return
    const x = e.clientX, y = e.clientY, H2 = innerHeight
    if (!inMargin(x)) return
    const m = monthNow(), dark = darkTheme(), floorY = H2 - 2
    // the frame loop's own left/right are not in scope out here, so work them out again
    const half = Math.min(W, 1060) / 2, edgeL = W / 2 - half, edgeR = W / 2 + half

    // January: the snowman is the one thing here you can dress
    if (snow.up) for (let i = 0; i < 2; i++)
      if (Math.abs(x - snow.at[i]) < 22 && y > floorY - 46) {
        if (snow.bits[i] < 4) { snow.bits[i]++; popAt(snow.at[i], floorY - 30); return }
        addRing(snow.at[i], floorY - 22, 40, 0.3, 1); popAt(snow.at[i], floorY - 26); return
      }
    // December: the present opens the moment it is asked to
    if (m === 12 && gift && (gift.phase === 'sit' || gift.phase === 'wait')) {
      if (gift.phase === 'wait') gift.until = 0
      else { gift.phase = 'open'; gift.t0 = performance.now() / 1000 }
      addRing(x, y, 50, 0.3, 1); return
    }
    // whatever is drifting gets pushed out of the way, in the direction that month's things go
    const up = m === 5 || m === 6 || m === 8
    const moved = scatter(x, y, 150, up)
    if (y > floorY - 70) sweepPile(x, 90)          // and a tap low down scuffs the drift

    if (m === 6 || m === 8) {                      // bubbles burst rather than scatter
      for (const b of bits) if (b.form === 'bubble' && Math.hypot(b.x - x, b.y - y) < 70) { popAt(b.x, b.y); respawn(b) }
    }
    if (m === 9) {                                 // September: the squirrel comes for what fell
      if (!sweepers.length && edgeL > 60) sweepers = [{ x: x < W / 2 ? edgeL - 4 : edgeR + 4, dir: x < W / 2 ? -1 : 1, carry: true }]
    }
    if (dark && (m === 7 || m === 1 || m === 2)) meteorMaybe(W, H, 1)   // a clear night answers with one
    if (dark && m === 8) burstInMargin()                                // August answers with a firework
    addRing(x, y, moved ? 90 : 60, moved ? 0.34 : 0.22, 1.2)
  })
  addEventListener('resize', () => { if (raf) size() })
  document.addEventListener('visibilitychange', start)   // nothing runs in a background tab
  start()
  // redraw at once on what is already known, and again if the weather turns out to disagree
  seasonBar(() => { start(); loadWeather().then(wet => { if (kind === 'summer' && wet !== wasWet) start() }) })
}
