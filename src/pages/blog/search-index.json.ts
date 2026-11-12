import { getCollection } from 'astro:content'
import { u, CATEGORIES, mergeTranslations } from '../../lib'
import { GROUPS as LIBS } from '../../data/libraries'
import { PLOT_GROUPS as PLOTS } from '../../data/plots'
import { DB_GROUPS as DBS } from '../../data/databases'

// The whole body, with the markup taken out. Indexing only headings and bold spans tied
// discoverability to styling -- de-bolding a table cell silently dropped the term from search.
// Served as its own file, fetched on first focus, so /blog/ stays small.
const terms = (body = '') => body
  .replace(/^---[\s\S]*?^---/m, ' ')            // frontmatter
  .replace(/<[^>]+>/g, ' ')                      // html, including figure captions' tags
  .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')        // images
  .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')      // links: keep the text, drop the url
  .replace(/[#*_>|`~\\]/g, ' ')                  // markdown punctuation
  .replace(/\s+/g, ' ')
  .trim()

// prose repeats itself; keeping each word once cuts the index by a third and matches the same
const dedupe = (t: string) => [...new Set(t.toLowerCase().split(' '))].join(' ')

export async function GET() {
  const all = (await getCollection('blog', p => !p.data.draft)).sort((a, b) => +b.data.date - +a.data.date)
  const shownIn = (variants: any[], v: any) => (variants.length > 1 ? v.data.lang : 'both')

  const refs = [
    { href: 'blog/libraries/', name: 'Python libraries', topic: 'reference',
      desc: `${LIBS.reduce((n, g) => n + g.libs.length, 0)} packages by what they are for, and what is inside each.`,
      hay: LIBS.flatMap(g => g.libs.map(l => `${l.name} ${l.parts.join(' ')} ${l.en} ${l.ko}`)) },
    { href: 'blog/plots/', name: 'Which plot', topic: 'reference',
      desc: `${PLOTS.reduce((n, g) => n + g.plots.length, 0)} plot types, each with the one line that draws it.`,
      hay: PLOTS.flatMap(g => g.plots.map(x => `${x.name} ${x.en} ${x.ko}`)) },
    { href: 'blog/databases/', name: 'Databases', topic: 'reference',
      desc: 'What each database is, how big, and whether I have used it.',
      hay: DBS.flatMap(g => g.dbs.map(d => `${d.name} ${d.en} ${d.ko}`)) },
    { href: 'blog/shell/', name: 'Shell commands', topic: 'reference',
      desc: 'tmux, aliases, ssh, and the GPU checks worth memorising.',
      hay: ['tmux screen alias ssh scp rsync nvidia-smi htop GPU 단축키 세션'] },
  ]

  const docs = [
    ...mergeTranslations(all).map(({ variants }) => ({
      // one haystack per language; the client matches across both and shows the active one
      hay: Object.fromEntries(variants.map((v: any) => [v.data.lang,
        dedupe([v.data.title, v.data.description, (v.data.tags ?? []).join(' '), v.data.topic,
         v.data.subtopic, v.data.venue, terms(v.body)].filter(Boolean).join(' '))])),
      rows: variants.map((v: any) => ({
        l: shownIn(variants, v), href: u(`blog/${v.id}/`), title: v.data.title,
        venue: v.data.venue ? `${v.data.venue}${v.data.venueYear ? `, ${v.data.venueYear}` : ''}` : '',
        desc: v.data.description ?? '', topic: v.data.topic ?? '',
      })),
    })),
    ...refs.map(r => ({
      hay: { both: `${r.name} ${r.desc} ${r.hay.join(' ')}`.toLowerCase() },
      rows: [{ l: 'both', href: u(r.href), title: r.name, venue: '', desc: r.desc, topic: r.topic }],
    })),
  ]
  return new Response(JSON.stringify(docs), { headers: { 'Content-Type': 'application/json' } })
}
