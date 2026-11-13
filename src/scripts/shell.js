// A small shell for the contact page. It has a read-only filesystem built from the site's own
// data, so `ls`/`cd`/`cat` walk the same structure the nav does.
import { tetris } from './tetris.js'
import { read, qualifies, save, table } from './scores.js'
import { nowDate, seoulNow, setAsOf, asOf } from './seoul.js'

// days you can ask for by name rather than by number
const NAMED = {
  christmas: [12, 25], xmas: [12, 25], newyear: [1, 1], 'new-year': [1, 1],
  halloween: [10, 31], hangul: [10, 9], hangeul: [10, 9], chuseok: [9, 17],
}
// a date the reader typed: 2027-01-01, 12-25, 12/25, or one of the names above
function parseDay(text) {
  const s = text.trim().toLowerCase().replace(/\s+/g, '')
  if (NAMED[s]) { const [m, d] = NAMED[s]; return make(null, m, d) }
  const m = s.match(/^(?:(\d{4})[-/.])?(\d{1,2})[-/.](\d{1,2})$/)
  if (!m) return null
  return make(m[1] && +m[1], +m[2], +m[3])
}
function make(year, month, day) {
  if (month < 1 || month > 12 || day < 1 || day > 31) return null
  const now = nowDate()
  // keep the hour, so a day chosen in the evening is still an evening
  const d = new Date(Date.UTC(year ?? new Date().getUTCFullYear(), month - 1, day, 3, 0, 0))
  d.setUTCHours(now.getUTCHours(), now.getUTCMinutes())
  const got = seoulNow(d)
  return got.month === month && got.day === day ? d : new Date(+d + 6 * 3600e3)
}
const SANTA = [
  '      ___       ', '    _/   \\_     ', "   ( o   o )    ", '    \\  ^  /     ',
  "   {'-...-'}    ", '   /       \\    ', '  ~~~~~~~~~~~   ',
]

const dir = c => ({ d: true, c })
const file = (lines, url) => ({ lines, url })

export function shell(el, D) {
  const { term, screen, out, line, cmd, ps1, dock } = el

  const FS = dir({
    about: dir({
      whoami: file(D.whoami),
      now: file(D.now),
    }),
    research: dir(Object.fromEntries(D.research.map(p => [p.slug, file(
      [p.title, '', p.line, '', `period   ${p.period}`, `role     ${p.role}`],
      D.base + 'projects/' + p.slug + '/')]))),
    notes: file(['Notes — what I read and work out in writing,', 'in English and Korean.', '', 'type `open notes` to read them.'], D.base + 'blog/'),
    vitae: file(D.vitae, D.base + 'vitae/'),
    contact: dir(Object.fromEntries(D.contact.map(c => [c.k, file([c.v], c.href)]))),
  })

  let cwd = []            // path as an array of names
  const hist = []
  let hi = 0

  const at = path => path.reduce((n, k) => (n && n.d ? n.c[k] : null), FS)
  const here = () => at(cwd)
  const prompt = () => { ps1.textContent = `myungjin@contact:~${cwd.length ? '/' + cwd.join('/') : ''}$` }

  // every print is one span, so trimming the top is just removing the first child
  const say = (s = '', cls = '') => {
    const n = document.createElement('span')
    if (cls) n.className = cls
    n.textContent = s + '\n'
    out.append(n)
  }
  // the window never scrolls: once it is full, the oldest lines fall off the top
  const fit = () => {
    let guard = 400
    while (guard-- > 0 && out.childNodes.length > 1 && screen.scrollHeight > screen.clientHeight) out.firstChild.remove()
  }

  const resolve = (arg) => {
    if (!arg) return cwd.slice()
    const parts = (arg.startsWith('/') || arg.startsWith('~') ? [] : cwd.slice())
    for (const p of arg.replace(/^~/, '').split('/')) {
      if (!p || p === '.') continue
      if (p === '..') parts.pop()
      else parts.push(p)
    }
    return parts
  }

  const CMD = {
    help() {
      say('commands', 'h')
      for (const [k, v] of [
        ['ls [dir]', 'list a directory'],
        ['cd <dir>', 'go there — .. and / work'],
        ['cat <file>', 'read a file'],
        ['pwd', 'where you are'],
        ['tree', 'the whole thing at once'],
        ['open [path]', 'open the matching page in the browser'],
        ['whoami', 'short version'],
        ['date', 'the time in Seoul — `date 12-25` looks at another day'],
        ['tetris', 'a game — arrows and space'],
        ['scores', 'the high-score table'],
        ['clear', 'clear the screen'],
        ['exit', 'close the window'],
      ]) say('  ' + k.padEnd(13) + v)
      say()
      say('tab completes · ↑ ↓ for history', 'm')
    },
    ls(arg) {
      const n = at(resolve(arg))
      if (!n) return say(`ls: ${arg}: no such file or directory`, 'w')
      if (!n.d) return say(arg)
      const names = Object.keys(n.c)
      for (const k of names) say('  ' + (n.c[k].d ? k + '/' : k), n.c[k].d ? 'g' : '')
    },
    cd(arg) {
      const path = resolve(arg)
      const n = at(path)
      if (!n) return say(`cd: ${arg}: no such file or directory`, 'w')
      if (!n.d) return say(`cd: ${arg}: not a directory`, 'w')
      cwd = path
      prompt()
    },
    cat(arg) {
      if (!arg) return say('cat: which file?', 'w')
      const n = at(resolve(arg))
      if (!n) return say(`cat: ${arg}: no such file or directory`, 'w')
      if (n.d) return say(`cat: ${arg}: is a directory`, 'w')
      for (const l of n.lines) say(l)
      if (n.url) say('→ ' + n.url, 'm')
    },
    tree() {
      const walk = (n, pad) => {
        const keys = Object.keys(n.c)
        keys.forEach((k, i) => {
          const last = i === keys.length - 1
          say(pad + (last ? '└── ' : '├── ') + k + (n.c[k].d ? '/' : ''), n.c[k].d ? 'g' : '')
          if (n.c[k].d) walk(n.c[k], pad + (last ? '    ' : '│   '))
        })
      }
      say('~', 'g')
      walk(FS, '')
    },
    open(arg) {
      const n = at(resolve(arg))
      const url = n && n.url ? n.url : D.base
      say('opening ' + url + ' …', 'm')
      setTimeout(() => { location.href = url }, 400)
    },
    whoami() { for (const l of D.whoami) say(l) },
    date(arg) {
      const a = (arg || '').trim().toLowerCase()
      if (!a) {
        stamp()
        if (asOf()) say('`date auto` puts it back to today.', 'm')
        say()
        say('you can look at the site on another day — the background follows.', 'm')
        say('which day? (try 12-25, 2027-01-01, christmas, hangul — or auto)', 'm')
        pending = { kind: 'date' }
        ps1.textContent = 'date >'
        return
      }
      if (['auto', 'now', 'today', 'reset'].includes(a)) {
        setAsOf(null); say('back to today.', 'g'); stamp(); return
      }
      setDay(a)
    },
    scores() { board() },
    clear() { out.textContent = '' },
    exit() { close() },
  }
  const ALIAS = { dir: 'ls', ll: 'ls', about: 'whoami', who: 'whoami', man: 'help', '?': 'help', quit: 'exit', x: 'exit', pwd: 'pwd' }

  const board = (highlight) => { for (const [line, cls] of table(read(), highlight)) say(line, cls) }

  const stamp = () => say(new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Seoul', dateStyle: 'full', timeStyle: 'short' }).format(nowDate()) + ' KST')
  // moving the date moves the season, the sky and whatever is drifting in the margins
  const setDay = (text) => {
    const d = parseDay(text)
    if (!d) { say(`date: ${text}: cannot read that — try 12-25, 2027-01-01, christmas, or auto`, 'w'); return }
    setAsOf(d)
    const now = seoulNow(d)
    say('the site is now showing:', 'm')
    stamp()
    say()
    // a summer day is rain or shine, and the reader is the one who knows which
    if (now.month >= 6 && now.month <= 8) {
      say('was it raining that day, or clear?', 'm')
      pending = { kind: 'wx' }
      ps1.textContent = 'rain / clear >'
      return
    }
    greet(now)
  }
  // two days say something back
  const greet = (now) => {
    if (now.month === 12 && now.day === 25) {
      SANTA.forEach(l => say(l, 'g')); say(); say('  merry christmas', 'h')
    } else if (now.month === 1 && now.day === 1) {
      say('  happy new year', 'h'); say('  the sun comes up over the margin today.', 'm')
    }
    say()
    say('scroll up, or `open` to see the front page on that day.', 'm')
  }

  // after a run that makes the table, the prompt takes a name instead of a command
  let pending = null, quitGame = null
  const playTetris = () => {
    line.hidden = true
    out.classList.add('game')
    out.textContent = ''
    out.setAttribute('aria-live', 'off')   // the board rewrites twice a second
    quitGame = tetris(out, (score, rows, over) => {
      quitGame = null
      out.setAttribute('aria-live', 'polite')
      line.hidden = false
      out.classList.remove('game')
      out.textContent = ''                    // the board has had its moment; the result gets a clean screen
      say()
      say(`${over ? 'game over' : 'stopped'} \u2014 ${score} point${score === 1 ? '' : 's'}, ${rows} row${rows === 1 ? '' : 's'}`, 'h')
      say()
      if (qualifies(score)) {
        pending = { score, rows }
        say('that makes the table. who was it?', 'm')
        ps1.textContent = 'name >'
      } else {
        board()
        prompt()
      }
      fit()
      cmd.focus()
    })
  }

  const run = (raw) => {
    const [head, ...rest] = raw.split(/\s+/)
    const arg = rest.join(' ')
    const name = ALIAS[head] ?? head
    if (!head) return
    if (name === 'pwd') return say('~' + (cwd.length ? '/' + cwd.join('/') : ''))
    if (name === 'tetris') return playTetris()
    if (CMD[name]) CMD[name](arg)
    else say(`${head}: command not found — try \`help\``, 'w')
    say()
  }

  const submit = () => {
    const raw = cmd.value.trim()
    if (pending && pending.kind === 'date') {
      say(ps1.textContent + ' ' + raw, 'p'); cmd.value = ''; pending = null; prompt()
      if (raw) (['auto', 'now', 'today', 'reset'].includes(raw.toLowerCase()) ? (setAsOf(null), say('back to today.', 'g'), stamp()) : setDay(raw))
      say(); fit(); return
    }
    if (pending && pending.kind === 'wx') {
      say(ps1.textContent + ' ' + raw, 'p'); cmd.value = ''; pending = null; prompt()
      const wet = /^(r|rain|wet|비)/i.test(raw)
      setAsOf(asOf(), wet ? 'rain' : 'sun')
      say(wet ? 'raining, then.' : 'clear, then.', 'g')
      greet(seoulNow(nowDate()))
      fit(); return
    }
    if (pending) {
      cmd.value = ''
      const { list, entry } = save(raw, pending.score, pending.rows)
      pending = null
      prompt()
      say(ps1.textContent, 'p')
      say()
      board(entry)
      say()
      fit()
      return
    }
    say(ps1.textContent + ' ' + raw, 'p')
    cmd.value = ''
    if (raw) { hist.push(raw); hi = hist.length }
    run(raw)
    fit()
  }

  const complete = () => {
    const parts = cmd.value.split(/\s+/)
    const word = parts[parts.length - 1]
    const pool = parts.length === 1
      ? [...Object.keys(CMD), 'tetris', 'pwd']
      : Object.keys(here()?.c ?? {})
    const hits = pool.filter(k => k.startsWith(word))
    if (hits.length === 1) { parts[parts.length - 1] = hits[0]; cmd.value = parts.join(' ') }
    else if (hits.length > 1) { say(ps1.textContent + ' ' + cmd.value, 'p'); say('  ' + hits.join('  '), 'm'); say(); fit() }
  }

  cmd.addEventListener('keydown', e => {
    if (e.key === 'Enter') submit()
    else if (e.key === 'Tab') { e.preventDefault(); complete() }
    else if (e.key === 'ArrowUp' && hi > 0) { e.preventDefault(); cmd.value = hist[--hi] }
    else if (e.key === 'ArrowDown') { e.preventDefault(); hi = Math.min(hist.length, hi + 1); cmd.value = hist[hi] ?? '' }
  })
  screen.addEventListener('click', () => { if (!line.hidden) cmd.focus() })

  // window chrome: red closes, yellow rolls up into the title bar, green makes it taller
  const close = () => { quitGame?.(); term.hidden = true; dock.classList.add('on') }
  const openUp = () => { term.hidden = false; term.classList.remove('rolled'); cmd.focus(); term.scrollIntoView({ block: 'center', behavior: 'smooth' }) }
  el.red.addEventListener('click', close)
  el.yellow.addEventListener('click', () => { quitGame?.(); term.classList.toggle('rolled') })
  el.green.addEventListener('click', () => { term.classList.toggle('big'); fit() })
  dock.addEventListener('click', openUp)

  prompt()
  const banner = [
    '', '  M Y U N G J I N   L E E', '  molecular ML · omics · Seoul', '',
    'hello — thanks for scrolling this far.',
    'email is always welcome. `help` lists the rest.', '',
  ]
  const show = () => { banner.forEach(l => say(l)); fit() }
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) show()
  else {
    const io = new IntersectionObserver(es => {
      if (!es[0].isIntersecting) return
      io.disconnect()
      let i = 0
      const step = () => { say(banner[i++]); fit(); if (i < banner.length) setTimeout(step, 85) }
      step()
    }, { threshold: 0.3 })
    io.observe(term)
  }
}
