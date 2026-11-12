// Prefix a site path with the configured base ("/site-lab/" here, "/" on the real site).
export const u = (p = '') => `${import.meta.env.BASE_URL.replace(/\/$/, '')}/${p.replace(/^\//, '')}`

// Tiny inline markup used in cv.ts: **bold**, _italic_, [label](url), and line breaks.
export function md(s = '') {
  return s
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
    .replace(/(^|\s)_(.+?)_(?=[\s.,;:)]|$)/g, '$1<i>$2</i>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/\n/g, '<br>')
}

// Mark my name in an author list (styled by .me in global.css).
export const authors = (s = '') => md(s).replace(/(Lee M\.)/, '<b class="me">$1</b>')

// status reads as a coloured pill: blue in review, green out, orange pending or placed, outline in preparation
export const tone = (s = '') =>
  /review/i.test(s) ? 'blue' : /prep/i.test(s) ? 'muted' : /published|registered/.test(s) ? 'green'
  : /pending|top/i.test(s) ? 'atom' : ''

// a news line as html: the leading emoji dropped, and the event it names turned into its link,
// so a conference reads as a conference rather than as a stray arrow at the end
export function newsHtml(n: { text: string; link?: { label: string; href: string } }) {
  const esc = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const text = esc(n.text.replace(/^[^\p{L}\p{N}]+/u, ''))
  if (!n.link) return text
  const a = `<a class="venue" href="${n.link.href}">${esc(n.link.label)}</a>`
  const at = text.indexOf(esc(n.link.label))
  return at < 0 ? `${text} ${a}` : text.slice(0, at) + a + text.slice(at + esc(n.link.label).length)
}

export const readingTime = (text: string) => Math.max(1, Math.round(text.split(/\s+/).length / 220))

export const CATEGORIES = [
  { key: 'review', label: 'paper reviews', labelKo: '논문 리뷰' },
  { key: 'concept', label: 'concepts', labelKo: '개념 정리' },
  { key: 'tutorial', label: 'tutorials', labelKo: '튜토리얼' },
] as const

// shelves read in this order, not alphabetically: theory first, then the two domains, then tooling
// tooling first so guides read Linux -> Git -> Python -> R -> domain; concepts carry no
// tooling topics, so they fall through to Machine learning -> Deep learning -> the two domains
export const TOPIC_ORDER = [
  'Linux', 'Git', 'Python', 'R',
  'Machine learning', 'Graphs', 'Cheminformatics', 'Bioinformatics',
]
export const SUBTOPIC_ORDER = [
  'Basics', 'Evaluation',               // machine learning
  'Representation', 'Prediction',       // cheminformatics
  'Transcriptomics', 'Cell biology', 'Gene sets',   // bioinformatics
]
export const subRank = (t: string) => {
  const i = SUBTOPIC_ORDER.indexOf(t)
  return i === -1 ? SUBTOPIC_ORDER.length : i
}
export const topicRank = (t: string) => {
  const i = TOPIC_ORDER.indexOf(t)
  return i === -1 ? TOPIC_ORDER.length : i
}

// Collapse translations into one entry: the English version leads, others become language links.
export function mergeTranslations(posts: any[]) {
  const byGroup = new Map<string, any[]>()
  for (const p of posts) {
    const k = p.data.group ?? p.id
    byGroup.set(k, [...(byGroup.get(k) ?? []), p])
  }
  return [...byGroup.values()].map(variants => {
    const lead = variants.find(v => v.data.lang === 'en') ?? variants[0]
    return { lead, variants: variants.sort((a, b) => a.data.lang.localeCompare(b.data.lang)) }
  })
}
