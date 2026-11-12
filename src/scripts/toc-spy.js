// Highlight the contents link for whatever section is on screen.
// Anchors that point at a hidden shelf (the search filters them away) are skipped.
export function tocSpy() {
  const nav = document.getElementById('toc')
  if (!nav) return
  const links = [...nav.querySelectorAll('a')].filter(a => a.hash)
  // keep --head-h in step with the real header, so scroll-margin-top never guesses
  const head = document.querySelector('.top')
  const setH = () => document.documentElement.style.setProperty(
    '--head-h', `${Math.round(head?.getBoundingClientRect().height ?? 0)}px`)
  setH()
  addEventListener('resize', setH)
  const targets = links
    .map(a => ({ a, el: document.getElementById(decodeURIComponent(a.hash.slice(1))) }))
    .filter(t => t.el)
  if (!targets.length) return

  // a clicked link stays current even when the page is too short to scroll its section up;
  // the reader's own scrolling hands control back to the spy
  let pinned = null
  const mark = () => {
    if (pinned) { for (const t of targets) t === pinned ? t.a.setAttribute('aria-current', 'true') : t.a.removeAttribute('aria-current'); return }
    const line = (document.querySelector('.subbar')?.getBoundingClientRect().bottom ?? 0) + 8
    let active = null
    for (const t of targets) {
      if (t.el.offsetParent === null) continue       // hidden while searching
      if (t.el.getBoundingClientRect().top <= line) active = t
    }
    // before the first heading scrolls past, highlight the first visible section
    if (!active) active = targets.find(t => t.el.offsetParent !== null) ?? null
    for (const t of targets) {
      if (t === active) t.a.setAttribute('aria-current', 'true')
      else t.a.removeAttribute('aria-current')
    }
  }

  let queued = false
  const onScroll = () => {
    if (queued) return
    queued = true
    requestAnimationFrame(() => { queued = false; mark() })
  }
  for (const t of targets) t.a.addEventListener('click', () => {
    pinned = t; mark()
    t.el.classList.remove('toc-flash'); void t.el.offsetWidth; t.el.classList.add('toc-flash')   // show where it went
  })
  for (const ev of ['wheel', 'touchmove', 'keydown']) addEventListener(ev, () => { if (pinned) { pinned = null; onScroll() } }, { passive: true })
  addEventListener('scroll', onScroll, { passive: true })
  addEventListener('resize', onScroll)
  mark()
}
