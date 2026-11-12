import { defineConfig } from 'astro/config'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import { visit } from 'unist-util-visit'

// Notes write figure paths as /assets/… ; this puts the configured base in front of them, so
// the same markdown builds correctly at / and at /site-lab/.
const BASE = (process.env.ASTRO_BASE ?? '/').replace(/\/$/, '')
function rehypeBase() {
  return tree => {
    visit(tree, 'element', node => {
      for (const k of ['src', 'href']) {
        const v = node.properties?.[k]
        if (typeof v === 'string' && v.startsWith('/assets/')) node.properties[k] = BASE + v
      }
    })
  }
}

// figures in the notes are written as literal HTML, which never becomes a hast element,
// so the same rewrite runs on the markdown side as well
function remarkBase() {
  return tree => visit(tree, ['html', 'image', 'link'], node => {
    if (typeof node.value === 'string') node.value = node.value.replaceAll('"/assets/', `"${BASE}/assets/`)
    if (typeof node.url === 'string' && node.url.startsWith('/assets/')) node.url = BASE + node.url
  })
}

export default defineConfig({
  site: 'https://myungjin00.github.io',
  base: (process.env.ASTRO_BASE ?? '/'),
  trailingSlash: 'always',
  markdown: {
    remarkPlugins: [remarkMath, remarkBase],
    rehypePlugins: [rehypeKatex, rehypeBase],
    shikiConfig: { theme: 'github-light' },
  },
})
