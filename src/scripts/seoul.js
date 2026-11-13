// Seoul's local time in the footer, with a sun by day and a moon by night, so a reader abroad
// can see at a glance whether it is a sensible hour to write.

// The site's date can be moved from the contact terminal. Everything that depends on the calendar
// reads it from here, so one setting carries the season, the sky and the margins together.
const AS_OF = 'asof', AS_OF_WX = 'asof-wx'
const ls = k => { try { return localStorage.getItem(k) } catch { return null } }
const put = (k, v) => { try { v === null ? localStorage.removeItem(k) : localStorage.setItem(k, v) } catch {} }

export function asOf() {
  const v = ls(AS_OF); if (!v) return null
  const d = new Date(v); return isNaN(+d) ? null : d
}
// the instant the whole site is pretending it is
export const nowDate = () => asOf() ?? new Date()
// a chosen summer day is dry unless the reader says otherwise; a real one asks the weather service
export const asOfWeather = () => (asOf() ? ls(AS_OF_WX) : null)
export function setAsOf(d, wx = null) {
  put(AS_OF, d ? d.toISOString() : null)
  put(AS_OF_WX, d && wx ? wx : null)
  dispatchEvent(new Event('asof'))
}

// sunrise and sunset in Seoul around the 15th of each month (KST, minutes after midnight).
// ponytail: monthly values are within ~20 min of the true times; swap in a solar formula if
// the icon ever needs to flip on the exact minute.
const SUN = [
  [466, 1059], [443, 1092], [404, 1120], [359, 1147], [323, 1173], [311, 1196],
  [324, 1194], [348, 1164], [373, 1121], [399, 1078], [429, 1044], [457, 1035],
]
const SUN_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.2 5.2l1.4 1.4M17.4 17.4l1.4 1.4M18.8 5.2l-1.4 1.4M6.6 17.4l-1.4 1.4"/></svg>'

// Building a formatter costs far more than using one, and the margins ask what month it is on
// every animation frame, so the formatter is built once and the answer is kept for the minute.
const KST = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Seoul', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
let memo = { key: NaN, val: null }

// month (1-12) and minutes after midnight in Seoul, whatever the reader's own time zone
export function seoulNow(d = nowDate()) {
  const key = Math.floor(+d / 60000)
  if (key === memo.key) return memo.val
  const p = Object.fromEntries(KST.formatToParts(d).map(x => [x.type, x.value]))
  memo = { key, val: { month: +p.month, day: +p.day, hour: p.hour, minute: p.minute, mins: +p.hour * 60 + +p.minute } }
  return memo.val
}
export const isDay = ({ month, mins }) => mins >= SUN[month - 1][0] && mins < SUN[month - 1][1]
export const season = ({ month }) => ['winter', 'spring', 'summer', 'autumn'][Math.floor((month % 12) / 3)]
export const MONTHS = { winter: [12, 1, 2], spring: [3, 4, 5], summer: [6, 7, 8], autumn: [9, 10, 11] }
// picking a season from the bar moves the date to the nearest month of it, keeping the hour, so
// the same pick always lands in the same place rather than somewhere new each time
export function dateInSeason(name, from = new Date()) {
  const here = seoulNow(from).month
  const gap = m => { const g = Math.abs(m - here); return Math.min(g, 12 - g) }
  const m = MONTHS[name].reduce((a, b) => (gap(b) < gap(a) ? b : a))
  const d = new Date(from)
  d.setMonth(m - 1, Math.min(d.getDate(), 28))
  return d
}

// the moon's age as a fraction of its cycle: 0 new, 0.5 full. The phase is the same wherever you
// stand; only the side that is lit flips between hemispheres, and Seoul is in the north.
const SYNODIC = 29.530588853, NEW_MOON = Date.UTC(2000, 0, 6, 18, 14)
export const moonPhase = (d = nowDate()) => (((d - NEW_MOON) / 864e5 / SYNODIC) % 1 + 1) % 1

// the moon as Seoul sees it tonight: the dark disc faintly, and the lit part over it
function moonSvg(phase, r, cx, cy, lit, dark) {
  const k = (1 - Math.cos(2 * Math.PI * phase)) / 2, waxing = phase < 0.5   // k: how much of the face is lit
  const rx = r * Math.abs(1 - 2 * k)
  const outer = waxing ? 1 : 0, term = waxing ? (k < 0.5 ? 0 : 1) : (k < 0.5 ? 1 : 0)
  // a faint rim around the whole disc, so even a thin crescent reads as the moon
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${dark}" stroke="${lit}" stroke-opacity=".45" stroke-width="${(r / 6).toFixed(2)}"/>` +
    `<path d="M${cx} ${cy - r}A${r} ${r} 0 0 ${outer} ${cx} ${cy + r}A${rx} ${r} 0 0 ${term} ${cx} ${cy - r}Z" fill="${lit}"/>`
}
// how far through today's daylight (or tonight's dark) Seoul is, 0 at rise and 1 at set
function arcProgress(now) {
  const [rise, set] = SUN[now.month - 1], m = now.mins
  if (isDay(now)) return (m - rise) / (set - rise)
  const night = 1440 - set + rise
  return ((m >= set ? m - set : m + 1440 - set)) / night
}
// a small sky for the contents bar: a half-circle path with the sun or the moon on it
export function skySvg(d = nowDate()) {
  const now = seoulNow(d), day = isDay(now), p = Math.min(1, Math.max(0, arcProgress(now)))
  const W = 60, H = 22, R = 21, cx = W / 2, cy = H - 1, a = Math.PI * (1 - p)   // the horizon sits inside, so a body on it stays whole
  const x = (cx + Math.cos(a) * R).toFixed(1), y = (cy - Math.sin(a) * R).toFixed(1)
  const body = day
    ? `<circle cx="${x}" cy="${y}" r="9" fill="var(--ginkgo)" opacity=".22"/><circle cx="${x}" cy="${y}" r="5.4" fill="var(--ginkgo)"/>`   // the sun, with a glow
    : moonSvg(moonPhase(d), 6, +x, +y, 'var(--moon)', 'color-mix(in srgb, var(--ink) 18%, transparent)')
  return `<svg class="sky-arc" viewBox="0 -4 ${W} ${H + 10}" width="${W}" height="${H + 10}" aria-hidden="true">` +
    `<path d="M${cx - R} ${cy}A${R} ${R} 0 0 1 ${cx + R} ${cy}" fill="none" stroke="color-mix(in srgb, var(--muted) 55%, transparent)" stroke-width="1.2"/>${body}</svg>`
}

const DAY_LABEL = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Seoul', month: 'short', day: 'numeric' })

export function seoulClock() {
  const foot = document.getElementById('seoul'), bar = document.getElementById('seoul-bar')
  const tick = () => {
    const d = nowDate(), now = seoulNow(d), day = isDay(now)
    const set = asOf()
    const t = set
      ? `${DAY_LABEL.format(d)} ${now.hour}:${now.minute}`
      : `Seoul ${now.hour}:${now.minute}`
    // the chip stays short; the tooltip is where the time zone goes
    const title = (set ? 'A date set from the contact terminal — `date auto` puts it back. ' : '') +
      (day ? 'Daytime in Seoul · KST, UTC+9' : 'Night in Seoul · KST, UTC+9 · the moon tonight')
    // the footer keeps a single glyph; tonight's moon there too, in its real phase
    const glyph = day ? SUN_SVG : `<svg viewBox="0 0 24 24" aria-hidden="true">${moonSvg(moonPhase(d), 8, 12, 12, 'currentColor', 'color-mix(in srgb, currentColor 22%, transparent)')}</svg>`
    if (foot) foot.innerHTML = `${t} <span class="sky" title="${title}">${glyph}</span>`
    if (bar) bar.innerHTML = `${skySvg(d)}<span>${t}</span>`, bar.title = title
  }
  tick()
  setInterval(tick, 30_000)
  addEventListener('asof', tick)
}
