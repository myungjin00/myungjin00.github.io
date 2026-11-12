import { getCollection } from 'astro:content'
import { u, mergeTranslations } from '../lib'
import { projectGroups, vitae, news } from '../data/cv'
import { projects } from '../data/projects'

// The site-wide search behind the magnifier in the header. It covers every page by title and
// summary; the full text of notes stays with the Notes search on /blog/.
type Hit = { t: string; k: string; u: string; d?: string; h: string }
const strip = (s = '') => s.replace(/\*\*|_(?=\S)|(?<=\S)_|\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/\n/g, ' ')
const hay = (...xs: (string | undefined)[]) => strip(xs.filter(Boolean).join(' ')).toLowerCase()
const id = (s: string) => s.toLowerCase().replace(/[^a-z]+/g, '-')
const group = (h: string) => projectGroups.find(g => g.heading === h)?.items ?? []
const sec = (h: string) => vitae.find(s => s.heading === h) as any

export async function GET() {
  const hits: Hit[] = []
  const add = (t: string, k: string, href: string, d?: string, ...more: (string | undefined)[]) =>
    hits.push({ t, k, u: u(href), d: d && strip(d).slice(0, 140), h: hay(t, d, ...more) })

  for (const [t, href, d] of [
    ['Research', 'research/', 'Manuscripts, publications, patents, research projects and challenges'],
    ['News', 'news/', 'Talks, degrees, grants and other news'],
    ['Notes', 'blog/', 'Paper reviews, concepts, tutorials and references'],
    ['Vitae', 'vitae/', 'Education, experience, grants, posters, honors and skills'],
    ['Contact', 'contact/', 'Email, GitHub, LinkedIn and CV'],
  ]) add(t, 'page', href, d)

  for (const p of projects) add(p.title, 'project', `projects/${p.slug}/`, p.line, p.role)

  const research: [string, string][] = [
    ['Manuscripts', 'research/#in-review'], ['Publications', 'research/#papers'],
    ['Grants', 'research/#research-projects'], ['Funded Research Projects', 'research/#research-projects'],
    ['Competitions & Applied Projects', 'research/#challenges'],
  ]
  for (const [h, href] of research)
    for (const p of group(h)) add(p.title, 'research', href, p.desc ?? p.org, p.authors, p.org, p.status, p.tags?.join(' '))
  for (const p of sec('Patents & Software Registrations')?.items ?? []) add(p.title, 'research', 'research/#patents', p.detail)

  for (const p of group('Presentations')) add(p.title, 'vitae', 'vitae/#poster-presentations', p.org?.replace('Poster · ', ''), p.period)
  for (const h of ['Education', 'Research Experience', 'Honors & Awards', 'Technical Skills', 'Languages']) {
    const s = sec(h)
    for (const i of s?.items ?? []) add(i.title, 'vitae', `vitae/#${id(h)}`, i.detail, i.period)
  }
  for (const g of sec('Research Interests')?.groups ?? []) add(g.title, 'vitae', 'vitae/#research-interests', g.items.join(' · '))

  for (const n of news) add(n.text.replace(/^[^\p{L}\p{N}]+/u, ''), 'news', `news/#y${n.date.slice(-4)}`, n.date)

  const posts = (await getCollection('blog', p => !p.data.draft)).sort((a, b) => +b.data.date - +a.data.date)
  for (const { lead, variants } of mergeTranslations(posts))
    add(lead.data.title, 'note', `blog/${lead.id}/`, lead.data.description,
      ...variants.map((v: any) => `${v.data.title} ${v.data.description ?? ''} ${v.data.tags.join(' ')} ${v.data.topic ?? ''}`))

  return new Response(JSON.stringify(hits), { headers: { 'Content-Type': 'application/json' } })
}
