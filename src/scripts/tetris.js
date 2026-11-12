// Tetris, drawn as text into a <pre>. Each cell is two characters wide so it comes out square.
const W = 10, H = 18
const PIECES = [
  [[1, 1, 1, 1]],
  [[1, 1], [1, 1]],
  [[0, 1, 0], [1, 1, 1]],
  [[0, 1, 1], [1, 1, 0]],
  [[1, 1, 0], [0, 1, 1]],
  [[1, 0, 0], [1, 1, 1]],
  [[0, 0, 1], [1, 1, 1]],
]
const SPEED = [620, 520, 430, 350, 280, 220, 170, 130, 100]
const rot = m => m[0].map((_, i) => m.map(r => r[i]).reverse())
const pick = () => PIECES[(Math.random() * PIECES.length) | 0]

export function tetris(out, done) {
  const board = Array.from({ length: H }, () => Array(W).fill(0))
  let piece = pick(), next = pick(), px = 3, py = 0, score = 0, rows = 0, over = false, id

  const fits = (m, y, x) => m.every((row, r) => row.every((v, c) =>
    !v || (y + r >= 0 && y + r < H && x + c >= 0 && x + c < W && !board[y + r][x + c])))

  const spawn = () => {
    piece = next; next = pick()
    px = ((W - piece[0].length) / 2) | 0; py = 0
    if (!fits(piece, py, px)) { over = true; stop() }
  }

  const lock = () => {
    piece.forEach((row, r) => row.forEach((v, c) => { if (v) board[py + r][px + c] = 1 }))
    let cleared = 0
    for (let r = H - 1; r >= 0; r--) {
      if (board[r].every(Boolean)) { board.splice(r, 1); board.unshift(Array(W).fill(0)); cleared++; r++ }
    }
    // the usual reward for clearing several rows at once
    if (cleared) { rows += cleared; score += [0, 100, 300, 500, 800][cleared] }
    spawn()
    if (!over) retime()
  }

  const drop = () => {
    if (fits(piece, py + 1, px)) { py++; return true }
    lock(); return false
  }

  const level = () => Math.min(SPEED.length - 1, (rows / 8) | 0)
  const retime = () => { clearInterval(id); id = setInterval(() => { if (over) return; drop(); if (!over) draw() }, SPEED[level()]) }

  const draw = () => {
    const g = board.map(r => r.slice())
    if (!over) piece.forEach((row, r) => row.forEach((v, c) => { if (v && py + r >= 0) g[py + r][px + c] = 2 }))
    const cell = v => v ? '██' : '  '
    // the side panel: score, the next piece, and the keys
    const side = ['', `  score  ${score}`, `  rows   ${rows}`, `  level  ${level() + 1}`, '', '  next']
    next.forEach(row => side.push('   ' + row.map(cell).join('')))
    side.push('', '  ← →  move', '  ↑    rotate', '  ↓    soft drop', '  space hard drop', '  q    quit')

    const lines = ['┌' + '─'.repeat(W * 2) + '┐']
    g.forEach(r => lines.push('│' + r.map(cell).join('') + '│'))
    lines.push('└' + '─'.repeat(W * 2) + '┘')
    out.textContent = lines.map((l, i) => l + (side[i] ?? '')).join('\n')
  }

  const keys = e => {
    const k = e.key.toLowerCase()
    if (k === 'q' || k === 'escape') return stop()
    if (over) return
    if (['arrowleft', 'arrowright', 'arrowdown', 'arrowup', ' '].includes(k)) e.preventDefault()
    let moved = true
    if (k === 'arrowleft' && fits(piece, py, px - 1)) px--
    else if (k === 'arrowright' && fits(piece, py, px + 1)) px++
    else if (k === 'arrowdown') drop()
    else if (k === 'arrowup') { const r = rot(piece); if (fits(r, py, px)) piece = r }
    else if (k === ' ') { while (fits(piece, py + 1, px)) py++; lock() }
    else moved = false
    if (moved && !over) draw()
  }

  function stop() {
    clearInterval(id)
    removeEventListener('keydown', keys)
    done(score, rows, over)
  }

  addEventListener('keydown', keys)
  spawn()
  if (!over) retime()
  draw()
  return stop                      // the caller closes the window; the game has to go with it
}
