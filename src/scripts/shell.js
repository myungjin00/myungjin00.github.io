// A small shell for the contact page. It has a read-only filesystem built from the site's own
// data, so `ls`/`cd`/`cat` walk the same structure the nav does.
import { tetris } from './tetris.js'
import { read, qualifies, save, table } from './scores.js'
import { nowDate, seoulNow, setAsOf, asOf, storageWorks } from './seoul.js'

// days you can ask for by name rather than by number. Fixed dates only — Chuseok and Seollal
// move with the lunar calendar, so a month and a day cannot stand for them.
const NAMED = {
  christmas: [12, 25], xmas: [12, 25], newyear: [1, 1], 'new-year': [1, 1],
  halloween: [10, 31], hangul: [10, 9], hangeul: [10, 9],
}
const KST_OFFSET = 9 * 3600e3            // Seoul has had no daylight saving since 1988
const daysIn = (y, m) => new Date(Date.UTC(y, m, 0)).getUTCDate()

// a date the reader typed: 2027-01-01, 12-25, 12/25, or one of the names above
function parseDay(text) {
  const s = text.trim().toLowerCase().replace(/\s+/g, '')
  if (Object.hasOwn(NAMED, s)) return make(null, ...NAMED[s])
  const m = s.match(/^(?:(\d{4})[-/.])?(\d{1,2})[-/.](\d{1,2})$/)
  return m ? make(m[1] ? +m[1] : null, +m[2], +m[3]) : null
}
// Build the instant from Seoul's own calendar rather than the browser's, or a reader in the
// Seoul morning asks for Christmas and gets Boxing Day. The hour is kept, so a day chosen in
// the evening is still an evening.
function make(year, month, day) {
  const now = seoulNow()
  const y = year ?? now.year
  if (y < 1000 || y > 9999) return null
  if (month < 1 || month > 12 || day < 1 || day > daysIn(y, month)) return null
  return new Date(Date.UTC(y, month - 1, day, +now.hour, +now.minute) - KST_OFFSET)
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
  const prompt = () => ask(`myungjin@contact:~${cwd.length ? '/' + cwd.join('/') : ''}$`, 'Type a command, or help')
  // the visible prompt and the one a screen reader announces are the same prompt
  const ask = (text, label) => { ps1.textContent = text; cmd.setAttribute('aria-label', label) }

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
    // A short card rather than a wall: four groups of names, and `help <name>` for the detail.
    help(arg) {
      const a = (arg || '').trim().toLowerCase()
      if (a) {
        const d = DETAIL[ALIAS[a] ?? a]
        if (!d) return say(`help: ${a}: no such command`, 'w')
        say(d[0], 'h')
        for (const l of d.slice(1)) say(l)
        return
      }
      for (const [group, names] of [
        ['look around', 'ls · cd · pwd · tree · cat · open'],
        ['about me', 'whoami · vitae'],
        ['the calendar', 'date · calendar'],
        ['for fun', 'tetris · scores'],
        ['this window', 'clear · exit'],
      ]) say('  ' + group.padEnd(14) + names, group === 'the calendar' ? 'g' : '')
      say()
      say('`help <name>` says what one of them does.', 'm')
      say('tab completes · ↑ ↓ walk history', 'm')
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
        ask('date >', 'Which day? A date such as 12-25, or auto')
        return
      }
      if (['auto', 'now', 'today', 'reset'].includes(a)) {
        setAsOf(null); say('back to today.', 'g'); stamp(); return
      }
      setDay(a)
    },
    // The window holds about a dozen lines before it starts dropping them off the top, so the
    // year goes in two columns and the rules move to `help calendar`.
    calendar() {
      say('what each month puts in the margins', 'h')
      const L = [['Jan', 'snow, a snowman'], ['Feb', 'plum blossom, a skier'], ['Mar', 'forsythia, aurora'],
                 ['Apr', 'cherry blossom'], ['May', 'roses, dandelion seeds'], ['Jun', 'hydrangea, bubbles']]
      const R = [['Jul', 'sun or rain, the Milky Way'], ['Aug', 'the sea, a whale'], ['Sep', 'acorns, a full moon'],
                 ['Oct', 'maple, silver grass'], ['Nov', 'dry leaves, a dog'], ['Dec', 'snow, a tree, Santa']]
      for (let i = 0; i < 6; i++)
        say('  ' + (L[i][0] + '  ' + L[i][1]).padEnd(29) + R[i][0] + '  ' + R[i][1])
      say()
      say('christmas · newyear · halloween · hangul — days you can ask for by name', 'm')
      say('`date 3-15` to stand in a month · `date auto` to come back', 'm')
    },
    vitae() { for (const l of D.vitae) say(l); say('→ ' + D.base + 'vitae/', 'm') },
    scores() { board() },
    clear() { out.textContent = '' },
    exit() { close() },
  }
  const ALIAS = { dir: 'ls', ll: 'ls', about: 'whoami', who: 'whoami', man: 'help', '?': 'help', quit: 'exit', x: 'exit', pwd: 'pwd',
    cv: 'vitae', year: 'calendar', months: 'calendar', seasons: 'calendar' }

  // what `help <name>` prints: a line of what it is, then how it is used
  const DETAIL = {
    ls: ['ls [dir]', 'List what is in a directory. With no argument, the one you are in.'],
    cd: ['cd <dir>', 'Move into a directory. `..` goes up, `/` or `~` goes home.'],
    pwd: ['pwd', 'Print where you are.'],
    tree: ['tree', 'Print the whole structure at once.'],
    cat: ['cat <file>', 'Read a file. Most of them end with a link to the real page.'],
    open: ['open [path]', 'Leave the terminal and open the matching page in the browser.'],
    whoami: ['whoami', 'The short version of who I am.'],
    vitae: ['vitae', 'Education, positions and the rest — `cat vitae` reads it here,', '`open vitae` opens the full page.'],
    date: ['date [day]', 'With nothing, the time in Seoul, and then it asks which day you',
           'would like to see. With a day, the whole site moves to it — the',
           'season, the sky, and whatever is drifting in the margins.',
           '', '  date 12-25 · date 2027-01-01 · date christmas · date auto',
           '', 'A summer day asks whether it rained, because the forecast has',
           'nothing to say about a day that is not today. The day you pick',
           'lasts as long as this tab does.'],
    calendar: ['calendar', 'What each month of the year puts in the margins, and which days',
               'you can ask for by name.', '',
               'Night is not a second set of things but the same month after dark:',
               'what falls keeps falling, and something is lit above it.', '',
               'June, July and August follow the weather in Seoul — if it is',
               'raining there, it rains here. A rainy night is overcast, so',
               'nothing is in the sky at all, not even the moon.'],
    tetris: ['tetris', 'A game. Arrows move, up rotates, space drops, q quits.'],
    scores: ['scores', 'The high-score table. It is kept in this browser only.'],
    clear: ['clear', 'Empty the screen.'],
    exit: ['exit', 'Close the window. The laptop at the foot of the page opens it again.'],
    help: ['help [name]', 'The list of commands, or what one of them does.'],
  }

  const board = (highlight) => { for (const [line, cls] of table(read(), highlight)) say(line, cls) }

  const stamp = () => say(new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Seoul', dateStyle: 'full', timeStyle: 'short' }).format(nowDate()) + ' KST')
  // moving the date moves the season, the sky and whatever is drifting in the margins
  const setDay = (text) => {
    const d = parseDay(text)
    if (!d) { say(`date: ${text}: no such day — try 12-25, 2027-01-01, christmas, or auto`, 'w'); return }
    setAsOf(d)
    // private browsing throws on every write, and saying nothing would be a lie
    if (!asOf()) { say('this browser will not let the page remember anything,', 'w'); say('so the date cannot be moved here.', 'w'); return }
    const now = seoulNow(d)
    say('the site is now showing:', 'm')
    stamp()
    say()
    // a summer day is rain or shine, and the reader is the one who knows which
    if (now.month >= 6 && now.month <= 8) {
      say('was it raining that day, or clear?', 'm')
      pending = { kind: 'wx' }
      ask('rain / clear >', 'Was that day rainy or clear?')
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
        pending = { kind: 'name', score, rows }
        say('that makes the table. who was it?', 'm')
        ask('name >', 'Your name, for the high-score table')
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
      const day = asOf()
      // another tab may have put the date back while the question sat here
      if (!day) say('the date went back to today while you were deciding.', 'w')
      else {
        const wet = /^(r|rain|wet|비)/i.test(raw)
        setAsOf(day, wet ? 'rain' : 'sun')
        say(wet ? 'raining, then.' : 'clear, then.', 'g')
      }
      greet(seoulNow(nowDate()))
      fit(); return
    }
    if (pending && pending.kind === 'name') {
      say(ps1.textContent + ' ' + raw, 'p')
      cmd.value = ''
      const { entry } = save(raw, pending.score, pending.rows)
      pending = null
      prompt()
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
