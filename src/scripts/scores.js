// The tetris high-score table. GitHub Pages serves static files and has nowhere to write, so
// the table lives in this browser's localStorage: it survives reloads on this device and never
// leaves it. Every access is guarded — private windows and blocked site data throw on read.
const KEY = 'sitelab.tetris.scores'
const TOP = 8

export function read() {
  try {
    const raw = localStorage.getItem(KEY)
    const list = raw ? JSON.parse(raw) : []
    return Array.isArray(list) ? list.filter(e => e && typeof e.s === 'number' && typeof e.n === 'string').slice(0, TOP) : []
  } catch { return [] }
}

export function qualifies(score) {
  if (score <= 0) return false
  const list = read()
  return list.length < TOP || score > list[list.length - 1].s
}

export function save(name, score, rows) {
  const entry = { n: (name || 'you').slice(0, 8), s: score, r: rows, d: new Date().toISOString().slice(0, 10) }
  const list = [...read(), entry].sort((a, b) => b.s - a.s).slice(0, TOP)
  try { localStorage.setItem(KEY, JSON.stringify(list)) } catch { /* nothing to do: the game still played */ }
  return { list, entry }
}

// rendered by the caller's print function, so it matches the rest of the terminal
export function table(list, highlight) {
  if (!list.length) return [['  no scores yet — `tetris` to start', 'm']]
  const out = [['  #  name        score   rows   date', 'm']]
  list.forEach((e, i) => {
    const row = `  ${String(i + 1).padStart(2)}  ${e.n.padEnd(10)}${String(e.s).padStart(6)}${String(e.r).padStart(7)}   ${e.d}`
    out.push([row, e === highlight ? 'g' : ''])
  })
  out.push(['', ''])
  out.push(['  kept in this browser only', 'm'])
  return out
}
