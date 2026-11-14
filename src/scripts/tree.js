// A tree drawn in characters, standing in the left margin through December on the dark theme.
// The ornaments change character and colour every so often; that is the whole of the animation.
// It leaves in January, when the margins become the penguin's.
import { seoulNow } from './seoul.js'
import { chosen, activeSeason, MARGIN_FOR_DECOR } from './season.js'

// '@' marks an ornament; everything else is drawn as written. A tree is generated rather than
// written out, so a margin can hold a stand of them at whatever sizes it has room for.
function treeRows(tiers) {
  const w = tiers * 2 + 1
  // every row is padded to the same width, or the stand comes out ragged
  const centre = (s) => {
    const left = Math.floor((w - s.length) / 2)
    return ' '.repeat(left) + s + ' '.repeat(w - s.length - left)
  }
  const rows = [centre('*')]
  for (let i = 1; i <= tiers; i++) {
    let body = ''
    for (let k = 0; k < i * 2 - 1; k++) body += ((i * 7 + k * 5) % 11) < 4 ? '@' : '.'
    rows.push(centre('/' + body + '\\'))
  }
  const trunk = Math.max(1, (tiers - 3) | 1)          // odd, so it sits centred
  rows.push(centre('|'.repeat(trunk)))
  rows.push(centre('='.repeat(trunk + 2)))
  return rows
}

// stamp several trees onto one grid; a tree set further back stands a little higher and smaller
function grove(plan) {
  const width = Math.max(...plan.map(t => t.x + t.tiers * 2 + 1))
  const height = Math.max(...plan.map(t => t.lift + treeRows(t.tiers).length))
  const grid = Array.from({ length: height }, () => Array(width).fill(' '))
  // the furthest back is drawn first, so the nearest overlaps it
  for (const t of [...plan].sort((a, b) => b.lift - a.lift)) {
    const rows = treeRows(t.tiers), top = height - t.lift - rows.length
    rows.forEach((row, r) => [...row].forEach((ch, c) => {
      if (ch !== ' ') grid[top + r][t.x + c] = ch
    }))
  }
  return grid.map(r => r.join(''))
}
// the stands a margin might hold, widest first; the first that fits is the one that grows there
const STANDS = [
  [{ tiers: 4, x: 0, lift: 1 }, { tiers: 7, x: 8, lift: 0 }, { tiers: 3, x: 22, lift: 1 }],
  [{ tiers: 3, x: 0, lift: 1 }, { tiers: 7, x: 5, lift: 0 }],
  [{ tiers: 6, x: 0, lift: 0 }],
]
const BAUBLE = ['o', 'o', '*', '+', 'O']
const PAINT = ['--ginkgo', '--maple', '--spring', '--rain']
const LINE_H = 1.15

export function decemberTree() {
  const el = document.createElement('pre')
  el.setAttribute('aria-hidden', 'true')
  Object.assign(el.style, {
    position: 'fixed', left: '0', bottom: '18px', margin: '0', zIndex: '0',
    font: `12px/${LINE_H} var(--mono)`, pointerEvents: 'none', userSelect: 'none',
    whiteSpace: 'pre', transition: 'opacity .6s', opacity: '0',
  })
  document.body.prepend(el)

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
  let timer = 0, lit = false

  // The tree arrives on the first with a few lights and gains one a day, so that the
  // twenty-fifth is a day the tree arrives at rather than one more day of December.
  const litShare = () => {
    const d = seoulNow().day
    return d >= 25 ? 1 : Math.min(1, (4 + d) / 26)
  }
  const bauble = (on) => !on
    ? '<i style="color:var(--muted);opacity:.5">.</i>'
    : `<i style="color:var(${PAINT[Math.floor(Math.random() * PAINT.length)]})">${BAUBLE[Math.floor(Math.random() * BAUBLE.length)]}</i>`

  let ART = STANDS[2], COLS = 0
  const paint = () => {
    const share = litShare()
    el.innerHTML = ART.map((row, i) =>
      [...row].map(ch =>
        ch === '@' ? bauble(Math.random() < share)
        : ch === '*' ? (seoulNow().day >= 25
            ? '<i style="color:var(--ginkgo);font-weight:600">*</i>'
            : '<i style="color:var(--muted);opacity:.45">*</i>')
        : ch === '|' || ch === '=' ? `<i style="color:var(--maple);opacity:.8">${ch}</i>`
        : ch === ' ' ? ch : `<i style="color:var(--leaf);opacity:.75">${ch}</i>`
      ).join('')
    ).join('\n')
  }

  // the margin takes the whole stand if it can, one tree if it cannot, and nothing if it is narrow
  const CH = 7.26
  const fits = () => {
    const margin = (innerWidth - Math.min(innerWidth, 1060)) / 2
    if (margin < MARGIN_FOR_DECOR) return false       // the same rule the present in the other margin uses
    for (const plan of STANDS) {
      const rows = grove(plan), w = rows[0].length * CH
      if (w + 16 > margin) continue
      ART = rows; COLS = rows[0].length
      el.style.left = `${Math.round((margin - w) / 2)}px`
      return true
    }
    return false
  }

  const dark = () => document.documentElement.dataset.theme === 'dark'
  const due = () => seoulNow().month === 12 && dark() && chosen() !== 'off' && activeSeason() === 'winter'

  // `again` forces the work even when the answer has not changed, which is how a re-entry
  // (a new date, or coming back to the tab) restarts the twinkling
  function sync(again) {
    const on = due() && fits()
    if (on === lit && !again) return
    lit = on
    el.style.opacity = on ? '1' : '0'
    clearInterval(timer); timer = 0
    if (!on) return
    paint()
    if (!reduce) timer = setInterval(paint, seoulNow().day === 25 ? 450 : 900)
  }

  new MutationObserver(() => sync()).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
  addEventListener('asof', () => sync(true))
  addEventListener('storage', e => { if (e.key === 'season') sync(true) })
  addEventListener('resize', () => sync())
  document.querySelectorAll('.season-select').forEach(p => p.addEventListener('change', () => sync(true)))
  // nothing twinkles in a background tab; coming back re-evaluates from scratch
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { clearInterval(timer); timer = 0 } else sync(true)
  })
  sync()
}
