// A tree drawn in characters, standing in the left margin through December on the dark theme.
// The ornaments change character and colour every so often; that is the whole of the animation.
// It leaves in January, when the margins become the penguin's.
import { seoulNow } from './seoul.js'
import { chosen, activeSeason } from './season.js'

// '@' marks an ornament, everything else is drawn as written
const ART = [
  '       *       ',
  '      /@\\      ',
  '     /.@.\\     ',
  '    /@...@\\    ',
  '   /..@....\\   ',
  '  /@...@..@.\\  ',
  ' /...@...@...\\ ',
  '      |||      ',
  '     =====     ',
]
const BAUBLE = ['o', 'o', '*', '+', 'O']
const PAINT = ['--ginkgo', '--maple', '--spring', '--rain']
const COLS = 15
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

  // one ornament in four is dark, so the tree reads as lit rather than studded
  const bauble = () => Math.random() < 0.25
    ? '<i style="color:var(--muted);opacity:.55">.</i>'
    : `<i style="color:var(${PAINT[Math.floor(Math.random() * PAINT.length)]})">${BAUBLE[Math.floor(Math.random() * BAUBLE.length)]}</i>`

  const paint = () => {
    el.innerHTML = ART.map((row, i) =>
      [...row].map(ch =>
        ch === '@' ? bauble()
        : ch === '*' ? '<i style="color:var(--ginkgo);font-weight:600">*</i>'
        : ch === '|' || ch === '=' ? `<i style="color:var(--maple);opacity:.8">${ch}</i>`
        : ch === ' ' ? ch : `<i style="color:var(--leaf);opacity:.75">${ch}</i>`
      ).join('')
    ).join('\n')
  }

  // the left margin has to be wide enough that the tree never reaches the text
  const fits = () => {
    const margin = (innerWidth - Math.min(innerWidth, 1060)) / 2
    const w = COLS * 7.3
    if (margin < w + 28) return false
    el.style.left = `${Math.round((margin - w) / 2)}px`
    return true
  }

  const dark = () => document.documentElement.dataset.theme === 'dark'
  const due = () => seoulNow().month === 12 && dark() && chosen() !== 'off' && activeSeason() === 'winter'

  function sync() {
    const on = due() && fits()
    if (on === lit) return
    lit = on
    el.style.opacity = on ? '1' : '0'
    clearInterval(timer); timer = 0
    if (!on) return
    paint()
    if (!reduce) timer = setInterval(paint, 900)
  }

  new MutationObserver(sync).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
  addEventListener('resize', sync)
  document.querySelectorAll('.season-select').forEach(p => p.addEventListener('change', sync))
  // nothing twinkles in a background tab; coming back re-evaluates from scratch
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { clearInterval(timer); timer = 0 } else { lit = false; sync() }
  })
  sync()
}
