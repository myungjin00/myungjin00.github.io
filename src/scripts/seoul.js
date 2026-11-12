// Seoul's local time in the footer, with a sun by day and a moon by night, so a reader abroad
// can see at a glance whether it is a sensible hour to write.

// sunrise and sunset in Seoul around the 15th of each month (KST, minutes after midnight).
// ponytail: monthly values are within ~20 min of the true times; swap in a solar formula if
// the icon ever needs to flip on the exact minute.
const SUN = [
  [466, 1059], [443, 1092], [404, 1120], [359, 1147], [323, 1173], [311, 1196],
  [324, 1194], [348, 1164], [373, 1121], [399, 1078], [429, 1044], [457, 1035],
]
const SUN_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.2 5.2l1.4 1.4M17.4 17.4l1.4 1.4M18.8 5.2l-1.4 1.4M6.6 17.4l-1.4 1.4"/></svg>'

// month (1-12) and minutes after midnight in Seoul, whatever the reader's own time zone
export function seoulNow(d = new Date()) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Seoul', month: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
    .formatToParts(d).map(x => [x.type, x.value]))
  return { month: +p.month, hour: p.hour, minute: p.minute, mins: +p.hour * 60 + +p.minute }
}
export const isDay = ({ month, mins }) => mins >= SUN[month - 1][0] && mins < SUN[month - 1][1]
export const season = ({ month }) => ['winter', 'spring', 'summer', 'autumn'][Math.floor((month % 12) / 3)]

// the moon's age as a fraction of its cycle: 0 new, 0.5 full. The phase is the same wherever you
// stand; only the side that is lit flips between hemispheres, and Seoul is in the north.
const SYNODIC = 29.530588853, NEW_MOON = Date.UTC(2000, 0, 6, 18, 14)
export const moonPhase = (d = new Date()) => (((d - NEW_MOON) / 864e5 / SYNODIC) % 1 + 1) % 1

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
export function skySvg(d = new Date()) {
  const now = seoulNow(d), day = isDay(now), p = Math.min(1, Math.max(0, arcProgress(now)))
  const W = 60, H = 22, R = 21, cx = W / 2, cy = H - 1, a = Math.PI * (1 - p)   // the horizon sits inside, so a body on it stays whole
  const x = (cx + Math.cos(a) * R).toFixed(1), y = (cy - Math.sin(a) * R).toFixed(1)
  const body = day
    ? `<circle cx="${x}" cy="${y}" r="9" fill="var(--ginkgo)" opacity=".22"/><circle cx="${x}" cy="${y}" r="5.4" fill="var(--ginkgo)"/>`   // the sun, with a glow
    : moonSvg(moonPhase(d), 6, +x, +y, 'var(--moon)', 'color-mix(in srgb, var(--ink) 18%, transparent)')
  return `<svg class="sky-arc" viewBox="0 -4 ${W} ${H + 10}" width="${W}" height="${H + 10}" aria-hidden="true">` +
    `<path d="M${cx - R} ${cy}A${R} ${R} 0 0 1 ${cx + R} ${cy}" fill="none" stroke="color-mix(in srgb, var(--muted) 55%, transparent)" stroke-width="1.2"/>${body}</svg>`
}

export function seoulClock() {
  const foot = document.getElementById('seoul'), bar = document.getElementById('seoul-bar')
  const tick = () => {
    const d = new Date(), now = seoulNow(d), day = isDay(now), t = `Seoul ${now.hour}:${now.minute}`
    // the chip stays short; the tooltip is where the time zone goes
    const title = day ? 'Daytime in Seoul · KST, UTC+9' : 'Night in Seoul · KST, UTC+9 · the moon tonight'
    // the footer keeps a single glyph; tonight's moon there too, in its real phase
    const glyph = day ? SUN_SVG : `<svg viewBox="0 0 24 24" aria-hidden="true">${moonSvg(moonPhase(d), 8, 12, 12, 'currentColor', 'color-mix(in srgb, currentColor 22%, transparent)')}</svg>`
    if (foot) foot.innerHTML = `${t} <span class="sky" title="${title}">${glyph}</span>`
    if (bar) bar.innerHTML = `${skySvg(d)}<span>${t}</span>`, bar.title = title
  }
  tick()
  setInterval(tick, 30_000)
}
