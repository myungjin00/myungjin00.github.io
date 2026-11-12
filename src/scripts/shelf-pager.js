// Each shelf pages on its own. Every topic stays visible on the page, and walking deeper
// into one does not push the others off. Done in the browser rather than in the build
// because the language toggle changes how many rows a shelf has — a server-side cut would
// be right for one language and wrong for the other.
const PER = 5

export function shelfPager() {
  const shelves = [...document.querySelectorAll('.shelf')]
  if (!shelves.length) return
  const root = document.getElementById('notes')
  const langNow = () => (root?.dataset.lang === 'ko' ? 'ko' : 'en')
  const inLang = (r, lang) => r.dataset.l === 'both' || r.dataset.l === lang

  const draw = shelf => {
    const lang = langNow()
    const rows = [...shelf.querySelectorAll('tbody tr')]
    const live = rows.filter(r => inLang(r, lang))
    const pages = Math.max(1, Math.ceil(live.length / PER))
    const page = Math.min(Math.max(1, Number(shelf.dataset.page) || 1), pages)
    shelf.dataset.page = String(page)

    const from = (page - 1) * PER
    rows.forEach(r => r.classList.remove('pg-off'))
    live.forEach((r, i) => r.classList.toggle('pg-off', i < from || i >= from + PER))
    // a subtopic run with nothing left on this page should not leave its label behind
    shelf.querySelectorAll('.sub-group').forEach(g => {
      g.hidden = ![...g.querySelectorAll('tbody tr')].some(r => inLang(r, lang) && !r.classList.contains('pg-off'))
    })

    let nav = shelf.querySelector('.shelf-pager')
    if (pages < 2) { nav?.remove(); return }
    if (!nav) {
      nav = document.createElement('nav')
      nav.className = 'shelf-pager'
      nav.setAttribute('aria-label', 'More in this section')
      shelf.appendChild(nav)
    }
    nav.textContent = ''
    const add = (label, to, current) => {
      const b = document.createElement('button')
      b.type = 'button'
      b.textContent = label
      if (current) b.setAttribute('aria-current', 'page')
      if (to === null) b.disabled = true
      else b.addEventListener('click', () => {
        shelf.dataset.page = String(to)
        draw(shelf)
        shelf.scrollIntoView({ block: 'start' })
      })
      nav.appendChild(b)
    }
    add('←', page > 1 ? page - 1 : null, false)
    for (let n = 1; n <= pages; n++) add(String(n), n, n === page)
    add('→', page < pages ? page + 1 : null, false)
  }

  const all = () => shelves.forEach(draw)
  all()
  if (root) new MutationObserver(all).observe(root, { attributes: true, attributeFilter: ['data-lang'] })
}
