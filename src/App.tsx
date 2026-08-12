import { useState, useEffect } from 'react'
import {
  profile,
  bio,
  aboutClosing,
  news,
  projectGroups,
  myAuthorTokens,
  vitae,
  contact,
  type NewsItem,
  type Project,
} from './data/cv'

type Section = 'about' | 'projects' | 'news' | 'vitae' | 'contact'

const NAV: { id: Section; label: string }[] = [
  { id: 'about', label: 'about' },
  { id: 'projects', label: 'projects' },
  { id: 'news', label: 'news' },
  { id: 'vitae', label: 'vitae' },
  { id: 'contact', label: 'contact' },
]

function initials(name: string) {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
}

// Minimal inline markup for bio/detail text: **bold** and [label](url).
function renderRich(text: string) {
  const nodes: Array<string | JSX.Element> = []
  const re = /\*\*(.+?)\*\*|\[([^\]]+)\]\(([^)]+)\)/g
  let last = 0
  let m: RegExpExecArray | null
  let key = 0
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index))
    if (m[1] !== undefined) {
      nodes.push(<strong key={key++}>{m[1]}</strong>)
    } else {
      nodes.push(
        <a key={key++} href={m[3]} target="_blank" rel="noreferrer">
          {m[2]}
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
  return (
    <div className="row proj">
      <span className="row-date">{p.period}</span>
      <div className="pub">
        {p.authors && <Authors authors={p.authors} />}
        <p className="pub-title">{p.title}</p>
        {p.org && <p className="pub-venue">{p.org}</p>}
        {p.pi && <p className="proj-pi">PI: {p.pi}</p>}
        {p.desc && <p className="proj-desc">{renderRich(p.desc)}</p>}
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
        </div>
      </div>
    </div>
  )
}

function ProjectGroups({ preview }: { preview?: boolean }) {
  const groups = preview
    ? projectGroups.filter((g) => g.items.length > 0).slice(0, 1)
    : projectGroups.filter((g) => g.items.length > 0)
  return (
    <div className="stack-md">
      {groups.map((g) => (
        <div key={g.heading}>
          {!preview && <p className="subhead">{g.heading}</p>}
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
        <div className="row" key={i}>
          <span className="row-date">{item.date}</span>
          <p className="row-text">{renderNews(item)}</p>
        </div>
      ))}
    </div>
  )
}

function About({ go }: { go: (s: Section) => void }) {
  return (
    <div className="stack-lg">
      <div>
        <div className="about-grid">
          <div>
            <h1 className="name">
              <b>{profile.firstName}</b> {profile.lastName}
              <span className="ko">{profile.nameKo}</span>
            </h1>
            {profile.headline && (
              <p className="headline">
                {profile.headline}
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

          {profile.photo ? (
            <img className="portrait" src={profile.photo} alt={profile.name} />
          ) : (
            <div className="portrait portrait-fallback" aria-hidden>
              {initials(profile.name)}
            </div>
          )}
        </div>
        {bio.slice(1).map((p, i) => (
          <p className="bio" key={i}>
            {renderRich(p)}
          </p>
        ))}
        <p className="bio">
          {aboutClosing}{' '}
          <a href={`mailto:${profile.email}`}>e-mail</a>.
        </p>
      </div>

      <section>
        <div className="block-head">
          <h2 className="block-title">News</h2>
          <button className="more-link" onClick={() => go('news')}>
            more →
          </button>
        </div>
        <NewsList items={news.slice(0, 3)} />
      </section>

      <section>
        <div className="block-head">
          <h2 className="block-title">Projects</h2>
          <button className="more-link" onClick={() => go('projects')}>
            more →
          </button>
        </div>
        <ProjectGroups preview />
      </section>
    </div>
  )
}

function Vitae() {
  return (
    <div className="stack-md">
      <p className="vitae-note">Abbreviated curriculum vitae.</p>
      {vitae.map((sec) => (
        <div key={sec.heading}>
          <h2 className="vitae-sec-title">{sec.heading}</h2>
          {'keywords' in sec ? (
            <div className="kw-row">
              {sec.keywords.map((k) => (
                <span className="kw" key={k}>
                  {k}
                </span>
              ))}
            </div>
          ) : 'subsections' in sec ? (
            <div className="stack-md">
              {sec.subsections.map((sub) => (
                <div key={sub.subheading}>
                  <p className="subhead">{sub.subheading}</p>
                  <div className="rows">
                    {sub.items.map((it, i) => (
                      <div className="row wide" key={i}>
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
                <div className="row wide" key={i}>
                  <span className="row-date">{it.period}</span>
                  <div>
                    <p className="row-title">{it.title}</p>
                    {it.detail && <p className="row-detail">{renderRich(it.detail)}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function Contact() {
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
    return NAV.some((n) => n.id === h) ? h : 'about'
  })

  useEffect(() => {
    const onHash = () => {
      const h = window.location.hash.slice(1) as Section
      if (NAV.some((n) => n.id === h)) setSection(h)
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const go = (s: Section) => {
    setSection(s)
    window.location.hash = s
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="shell">
      <header className="topbar">
        <div className="wrap">
          <nav className="nav">
            {NAV.map((n) => (
              <button
                key={n.id}
                className={section === n.id ? 'active' : ''}
                onClick={() => go(n.id)}
              >
                {n.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main>
        <div className="wrap">
          {section === 'about' && <About go={go} />}
          {section === 'projects' && (
            <>
              <h1 className="page-title">Projects</h1>
              <ProjectGroups />
            </>
          )}
          {section === 'news' && (
            <>
              <h1 className="page-title">News</h1>
              <NewsList items={news} />
            </>
          )}
          {section === 'vitae' && (
            <>
              <h1 className="page-title">Curriculum Vitae</h1>
              <Vitae />
            </>
          )}
          {section === 'contact' && (
            <>
              <h1 className="page-title">Contact</h1>
              <Contact />
            </>
          )}
        </div>
      </main>

      <footer>
        <div className="wrap">
          <p className="cred">© 2026 {profile.name} · Dongguk University</p>
        </div>
      </footer>
    </div>
  )
}
