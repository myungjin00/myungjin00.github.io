// Reading size for the article body. Scales --fs, which the prose styles multiply into their
// own px values, so navigation and labels keep their size while the text you read grows.
const STEPS = [0.96, 1.07, 1.18, 1.3]   // 1.07 is the default, set in global.css too
const KEY = 'notes-fs'

export function textSize() {
  const group = document.querySelector('.fs')
  if (!group) return
  const btns = [...group.querySelectorAll('button')]

  let i = 1
  try {
    const raw = localStorage.getItem(KEY)      // null, not 0, when nothing is stored
    if (raw !== null && STEPS[Number(raw)] !== undefined) i = Number(raw)
  } catch {}

  const apply = () => {
    document.documentElement.style.setProperty('--fs', String(STEPS[i]))
    btns.forEach(b => { b.disabled = b.dataset.fs === '-' ? i === 0 : i === STEPS.length - 1 })
    try { localStorage.setItem(KEY, String(i)) } catch {}
  }

  group.addEventListener('click', e => {
    const b = e.target.closest('button')
    if (!b) return
    i = Math.min(STEPS.length - 1, Math.max(0, i + (b.dataset.fs === '+' ? 1 : -1)))
    apply()
  })
  apply()
}
