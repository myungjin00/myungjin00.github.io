import { useState, useEffect, useMemo, useContext, createContext } from 'react'
import * as EN from './data/cv'
import type { NewsItem, Project, VitaeItem } from './data/cv'

// Language bundles share the same shape; the active one is provided via context.
type Bundle = typeof EN
const CVContext = createContext<Bundle>(EN)
const useCV = () => useContext(CVContext)
const myAuthorTokens = EN.myAuthorTokens

type Section = 'about' | 'projects' | 'news' | 'vitae' | 'contact'
const SECTIONS: Section[] = ['about', 'projects', 'news', 'vitae', 'contact']

function initials(name: string) {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
}

// Stable DOM id from a title, for search scroll-to.
const slugId = (s: string) =>
  'x-' + s.toLowerCase().replace(/[^a-z0-9가-힣]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 64)

// ---- Search index (rebuilt per language) ----
type Hit = { id: string; section: Section; title: string; where: string; text: string }
function buildSearch(cv: Bundle): Hit[] {
  const out: Hit[] = []
  cv.projectGroups.forEach((g) =>
    g.items.forEach((p) =>
      out.push({
        id: slugId(p.title),
        section: 'projects',
        title: p.title,
        where: g.heading,
        text: [p.title, p.org, p.desc, p.abstract, p.authors, p.pi, (p.tags || []).join(' ')]
          .filter(Boolean)
          .join(' ')
          .toLowerCase(),
      }),
    ),
  )
  cv.vitae.forEach((sec) => {
    if ('items' in sec)
      sec.items.forEach((it) =>
        out.push({
          id: slugId(it.title),
          section: 'vitae',
          title: it.title,
          where: sec.heading,
          text: [it.title, it.detail].filter(Boolean).join(' ').toLowerCase(),
        }),
      )
    else if ('groups' in sec)
      sec.groups.forEach((grp) =>
        out.push({
          id: slugId(grp.title),
          section: 'vitae',
          title: grp.title,
          where: sec.heading,
          text: [grp.title, ...grp.items].join(' ').toLowerCase(),
        }),
      )
    else if ('subsections' in sec)
      sec.subsections.forEach((sub) =>
        sub.items.forEach((it) =>
          out.push({
            id: slugId(it.title),
            section: 'vitae',
            title: it.title,
            where: sec.heading,
            text: [it.title, it.detail].filter(Boolean).join(' ').toLowerCase(),
          }),
        ),
      )
  })
  cv.news.forEach((n) =>
    out.push({
      id: slugId(n.text),
      section: 'news',
      title: n.text.replace(/^[^A-Za-z가-힣]+/, ''),
      where: cv.ui.aboutNews,
      text: n.text.toLowerCase(),
    }),
  )
  return out
}

// Minimal inline markup for bio/detail text: **bold**, _italic_, and [label](url).
function renderRich(text: string) {
  const nodes: Array<string | JSX.Element> = []
  const re = /\*\*(.+?)\*\*|_(.+?)_|\[([^\]]+)\]\(([^)]+)\)/g
  let last = 0
  let m: RegExpExecArray | null
  let key = 0
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index))
    if (m[1] !== undefined) {
      nodes.push(<strong key={key++}>{m[1]}</strong>)
    } else if (m[2] !== undefined) {
      nodes.push(<em key={key++}>{m[2]}</em>)
    } else {
      nodes.push(
        <a key={key++} href={m[4]} target="_blank" rel="noreferrer">
          {m[3]}
        </a>,
      )
    }
    last = m.index + m[0].length
  }
  if (last < text.length) nodes.push(text.slice(last))
  return nodes
}

function renderNews(item: NewsItem) {
  if (!item.link) return item.text
  const idx = item.text.indexOf(item.link.label)
  if (idx === -1) return item.text
  return (
    <>
      {item.text.slice(0, idx)}
      <a href={item.link.href} target="_blank" rel="noreferrer">
        {item.link.label}
      </a>
      {item.text.slice(idx + item.link.label.length)}
    </>
  )
}

function Authors({ authors }: { authors: string }) {
  return (
    <p className="pub-authors">
      {authors.split(', ').map((a, i, arr) => {
        const mine = myAuthorTokens.includes(a.trim())
        return (
          <span key={i}>
            {mine ? <span className="me">{a}</span> : a}
            {i < arr.length - 1 ? ', ' : ''}
          </span>
        )
      })}
    </p>
  )
}

function ProjectRow({ p }: { p: Project }) {
  const { ui } = useCV()
  const [open, setOpen] = useState(false)
  return (
    <div className="row proj" id={slugId(p.title)}>
      <span className="row-date">{p.period}</span>
      <div className="pub">
        {p.authors && <Authors authors={p.authors} />}
        <p className="pub-title">{p.title}</p>
        {p.org && <p className="pub-venue">{p.org}</p>}
        {p.pi && <p className="proj-pi">{ui.piLabel} {p.pi}</p>}
        {p.desc && (
          <p className="proj-desc">
            {p.desc.split('\n').map((line, i) => (
              <span key={i}>
                {i > 0 && <br />}
                {renderRich(line)}
              </span>
            ))}
          </p>
        )}
        <div className="tagrow">
          {p.status && <span className="badge">{p.status}</span>}
          {p.tags?.map((t) => (
            <span key={t} className="tag">
              {t}
            </span>
          ))}
          {p.links?.map((l) => (
            <a key={l.label} className="chip-btn" href={l.href} target="_blank" rel="noreferrer">
              {l.label}
            </a>
          ))}
          {p.abstract && (
            <button className="chip-btn" onClick={() => setOpen((o) => !o)}>
              {p.moreLabel ?? ui.abstract} {open ? '▾' : '▸'}
            </button>
          )}
        </div>
        {p.abstract && open && (
          <div className="abstract">
            {p.abstract.split('\n').map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ProjectGroups({ preview }: { preview?: boolean }) {
  const { projectGroups } = useCV()
  const groups = preview
    ? projectGroups.filter((g) => g.items.length > 0).slice(0, 1)
    : projectGroups.filter((g) => g.items.length > 0)
  return (
    <div className="stack-md">
      {groups.map((g) => (
        <div key={g.heading}>
          {!preview && <h3 className="group-title">{g.heading}</h3>}
          <div className="rows">
            {g.items.map((p, i) => (
              <ProjectRow key={i} p={p} />
            ))}
          </div>
          {!preview && g.note && <p className="group-note">{g.note}</p>}
        </div>
      ))}
    </div>
  )
}

function NewsList({ items }: { items: NewsItem[] }) {
  return (
    <div className="rows">
      {items.map((item, i) => (
        <div className="row" key={i} id={slugId(item.text)}>
          <span className="row-date">{item.date}</span>
          <p className="row-text">{renderNews(item)}</p>
        </div>
      ))}
    </div>
  )
}

function About({ go }: { go: (s: Section) => void }) {
  const { profile, bio, aboutClosing, news, ui } = useCV()
  return (
    <div className="stack-lg">
      <div>
        <div className="about-head">
          <h1 className="name">
            <b>{profile.firstName}</b> {profile.lastName}
            <span className="ko">{profile.nameKo}</span>
          </h1>
          {profile.headline && <p className="headline">{profile.headline}</p>}
          {profile.photo ? (
            <img className="portrait" src={profile.photo} alt={profile.name} />
          ) : (
            <div className="portrait portrait-fallback" aria-hidden>
              {initials(profile.name)}
            </div>
          )}
          {profile.degree && (
            <p className="standing">
              {profile.degree}
              {profile.lab && (
                <>
                  {' @ '}
                  <a href={profile.lab.href} target="_blank" rel="noreferrer">
                    {profile.lab.label}
                  </a>
                </>
              )}
            </p>
          )}
          {profile.location && <p className="location">📍 {profile.location}</p>}
          <div className="linkrow">
            {profile.links.map((l) => (
              <a
                key={l.label}
                href={l.href}
                target={l.href.startsWith('mailto') ? undefined : '_blank'}
                rel="noreferrer"
              >
                {l.label}
              </a>
            ))}
          </div>
          {bio[0] && <p className="bio">{renderRich(bio[0])}</p>}
        </div>

        {bio.slice(1).map((p, i) => (
          <p className="bio" key={i}>
            {renderRich(p)}
          </p>
        ))}
        <p className="bio">
          {aboutClosing.before}{' '}
          <a href={aboutClosing.hereHref} target="_blank" rel="noreferrer">
            {aboutClosing.hereLabel}
          </a>
          {aboutClosing.mid}{' '}
          <a href={`mailto:${profile.email}`}>{ui.emailWord}</a>
          {aboutClosing.after}
        </p>
      </div>

      <section>
        <div className="block-head">
          <h2 className="block-title">{ui.aboutNews}</h2>
          <button className="more-link" onClick={() => go('news')}>
            {ui.more}
          </button>
        </div>
        <NewsList items={news.slice(0, 3)} />
      </section>

      <section>
        <div className="block-head">
          <h2 className="block-title">{ui.aboutProjects}</h2>
          <button className="more-link" onClick={() => go('projects')}>
            {ui.more}
          </button>
        </div>
        <ProjectGroups preview />
      </section>
    </div>
  )
}

function VitaeExtras({ it }: { it: VitaeItem }) {
  const { ui } = useCV()
  const [open, setOpen] = useState(false)
  const hasAbstract = !!it.abstract
  const hasLinks = !!it.links && it.links.length > 0
  if (!hasAbstract && !hasLinks) return null
  return (
    <>
      <div className="tagrow" style={{ marginTop: 8 }}>
        {it.links?.map((l) => (
          <a key={l.label} className="chip-btn" href={l.href} target="_blank" rel="noreferrer">
            {l.label}
          </a>
        ))}
        {hasAbstract && (
          <button className="chip-btn" onClick={() => setOpen((o) => !o)}>
            {ui.abstract} {open ? '▾' : '▸'}
          </button>
        )}
      </div>
      {hasAbstract && open && <p className="abstract">{it.abstract}</p>}
    </>
  )
}

function Vitae() {
  const { vitae, ui } = useCV()
  const [active, setActive] = useState('')

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        const vis = entries.filter((e) => e.isIntersecting)
        if (!vis.length) return
        vis.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        setActive(vis[0].target.id)
      },
      { rootMargin: '-90px 0px -62% 0px', threshold: 0 },
    )
    vitae.forEach((sec) => {
      const el = document.getElementById(slugId(sec.heading))
      if (el) obs.observe(el)
    })
    return () => obs.disconnect()
  }, [vitae])

  const jump = (id: string) => {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="vitae-layout">
      <nav className="vitae-toc" aria-label="Sections on this page">
        {vitae.map((sec) => {
          const id = slugId(sec.heading)
          return (
            <button
              key={sec.heading}
              className={active === id ? 'toc-link active' : 'toc-link'}
              onClick={() => jump(id)}
            >
              {sec.heading}
            </button>
          )
        })}
      </nav>
      <div className="stack-md vitae-body">
        <p className="vitae-note">{ui.vitaeNote}</p>
        {vitae.map((sec) => (
          <div key={sec.heading} id={slugId(sec.heading)}>
            <h2 className="vitae-sec-title">{sec.heading}</h2>
          {'keywords' in sec ? (
            <div className="kw-row">
              {sec.keywords.map((k) => (
                <span className="kw" key={k}>
                  {k}
                </span>
              ))}
            </div>
          ) : 'groups' in sec ? (
            <div className="stack-md">
              {sec.groups.map((grp) => (
                <div key={grp.title} id={slugId(grp.title)}>
                  <p className="interest-cat">{grp.title}</p>
                  <div className="kw-row">
                    {grp.items.map((it) => (
                      <span className="kw" key={it}>
                        {it}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : 'subsections' in sec ? (
            <div className="stack-md">
              {sec.subsections.map((sub) => (
                <div key={sub.subheading}>
                  <p className="subhead">{sub.subheading}</p>
                  <div className="rows">
                    {sub.items.map((it, i) => (
                      <div className="row wide" key={i} id={slugId(it.title)}>
                        <span className="row-date">{it.period}</span>
                        <div>
                          <p className="row-title">{it.title}</p>
                          {it.detail && <p className="row-detail">{renderRich(it.detail)}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rows">
              {sec.items.map((it, i) => (
                <div className="row wide" key={i} id={slugId(it.title)}>
                  <span className="row-date">{it.period}</span>
                  <div>
                    <p className="row-title">{it.title}</p>
                    {it.detail && <p className="row-detail">{renderRich(it.detail)}</p>}
                    <VitaeExtras it={it} />
                  </div>
                </div>
              ))}
            </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function Contact() {
  const { contact } = useCV()
  return (
    <div className="stack-md">
      <p className="row-text muted" style={{ maxWidth: '42rem' }}>
        {contact.intro}
      </p>
      <div className="contact-grid">
        {contact.links.map((c) => (
          <a
            key={c.label}
            className="contact-card"
            href={c.href}
            target={c.href.startsWith('mailto') ? undefined : '_blank'}
            rel="noreferrer"
          >
            <p className="k">{c.label}</p>
            <p className="v">{c.value}</p>
            <p className="d">{c.desc}</p>
          </a>
        ))}
      </div>
    </div>
  )
}

export default function App() {
  const [section, setSection] = useState<Section>(() => {
    const h = window.location.hash.slice(1) as Section
    return SECTIONS.includes(h) ? h : 'about'
  })
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme')
    if (saved === 'light' || saved === 'dark') return saved
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })
  const [showTop, setShowTop] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')

  const cv = EN
  const ui = cv.ui
  const search = useMemo(() => buildSearch(cv), [cv])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 500)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const onHash = () => {
      const h = window.location.hash.slice(1) as Section
      if (SECTIONS.includes(h)) setSection(h)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSearchOpen(false)
      if ((e.key === '/' || (e.key === 'k' && (e.metaKey || e.ctrlKey))) && !searchOpen) {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener('hashchange', onHash)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('hashchange', onHash)
      window.removeEventListener('keydown', onKey)
    }
  }, [searchOpen])

  const go = (s: Section) => {
    setSection(s)
    window.location.hash = s
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const q = query.trim().toLowerCase()
  const results = q ? search.filter((h) => h.text.includes(q)).slice(0, 8) : []

  const goToHit = (h: Hit) => {
    setSearchOpen(false)
    setQuery('')
    setSection(h.section)
    window.location.hash = h.section
    setTimeout(() => {
      const el = document.getElementById(h.id)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      else window.scrollTo({ top: 0 })
    }, 70)
  }

  return (
    <CVContext.Provider value={cv}>
      <div className="shell">
        <header className="topbar">
          <div className="wrap">
            <nav className="nav">
              <button className="nav-name" onClick={() => go('about')}>
                {cv.profile.name}
              </button>
              <div className="nav-right">
                {SECTIONS.map((id) => (
                  <button
                    key={id}
                    className={section === id ? 'active' : ''}
                    onClick={() => go(id)}
                  >
                    {ui.nav[id]}
                  </button>
                ))}
                {cv.profile.notes && (
                  <a className="nav-ext" href={cv.profile.notes.href} target="_blank" rel="noreferrer">
                    {cv.profile.notes.label} ↗
                  </a>
                )}
                <button className="nav-icon" aria-label="Search" title="Search (/)" onClick={() => setSearchOpen(true)}>
                  ⌕
                </button>
                <button
                  className="nav-icon"
                  aria-label="Toggle dark mode"
                  title="Toggle theme"
                  onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
                >
                  {theme === 'dark' ? '☀' : '☾'}
                </button>
              </div>
            </nav>
          </div>
        </header>

        <main>
          <div className="wrap">
            {section === 'about' && <About go={go} />}
            {section === 'projects' && (
              <>
                <h1 className="page-title">{ui.page.projects}</h1>
                <ProjectGroups />
              </>
            )}
            {section === 'news' && (
              <>
                <h1 className="page-title">{ui.page.news}</h1>
                <NewsList items={cv.news} />
              </>
            )}
            {section === 'vitae' && (
              <>
                <h1 className="page-title">{ui.page.vitae}</h1>
                <Vitae />
              </>
            )}
            {section === 'contact' && (
              <>
                <h1 className="page-title">{ui.page.contact}</h1>
                <Contact />
              </>
            )}
          </div>
        </main>

        <footer>
          <div className="wrap">
            <p className="cred">{ui.footer}</p>
          </div>
        </footer>

        {searchOpen && (
          <div className="search-overlay" onClick={() => setSearchOpen(false)}>
            <div className="search-box" onClick={(e) => e.stopPropagation()}>
              <input
                autoFocus
                className="search-input"
                placeholder={ui.searchPlaceholder}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && results[0]) goToHit(results[0])
                }}
              />
              <div className="search-results">
                {q && results.length === 0 && <p className="search-empty">{ui.noMatches}</p>}
                {results.map((h) => (
                  <button key={h.id} className="search-hit" onClick={() => goToHit(h)}>
                    <span className="search-hit-title">{h.title}</span>
                    <span className="search-hit-where">{h.where}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {showTop && (
          <button
            className="to-top"
            aria-label="Back to top"
            title="Back to top"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            ↑
          </button>
        )}
      </div>
    </CVContext.Provider>
  )
}
