// 16px line icons, stroke: currentColor. Inline so there is no icon font or sprite to load.
const wrap = (d: string) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`

export const ICONS: Record<string, string> = {
  // paper reviews — a page with a folded corner
  review: wrap('<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M9 13h6M9 17h4"/>'),
  // concepts — three linked nodes
  concept: wrap('<circle cx="6" cy="17" r="2.4"/><circle cx="18" cy="17" r="2.4"/><circle cx="12" cy="6" r="2.4"/><path d="M10.6 8.1 7.4 14.9M13.4 8.1l3.2 6.8M8.4 17h7.2"/>'),
  // tutorials — numbered steps to follow (the terminal belongs to the shell page)
  tutorial: wrap('<path d="M4.5 6h2M4.5 12h2M4.5 18h2"/><path d="M10 6h9.5M10 12h9.5M10 18h6"/>'),
  // reference — stacked cards
  reference: wrap('<rect x="3" y="7" width="13" height="13" rx="2"/><path d="M8 4h11a2 2 0 0 1 2 2v11"/>'),

  libraries: wrap('<path d="M4 19V6a2 2 0 0 1 2-2h2v16H6a2 2 0 0 1-2-2Z"/><path d="M8 4h3a2 2 0 0 1 2 2v14H8z"/><path d="m15 6.6 2.9-.8a1 1 0 0 1 1.2.7l2.4 9a1 1 0 0 1-.7 1.2l-2.3.6"/>'),
  plots: wrap('<path d="M4 20V4"/><path d="M4 20h16"/><rect x="7" y="12" width="3" height="5"/><rect x="12" y="8" width="3" height="9"/><rect x="17" y="5" width="3" height="12"/>'),
  databases: wrap('<ellipse cx="12" cy="6" rx="7.5" ry="3"/><path d="M4.5 6v12c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3V6"/><path d="M19.5 12c0 1.7-3.4 3-7.5 3s-7.5-1.3-7.5-3"/>'),
  shell: wrap('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="m7.5 10 2.5 2-2.5 2M13 14h3.5"/>'),
  glossary: wrap('<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H19v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H19v3H6.5A2.5 2.5 0 0 1 4 20.5Z"/><path d="M9 8h6M9 11.5h4"/>'),

  // manuscripts — a page with a pen across it
  draft: wrap('<path d="M13 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h4"/><path d="M13 3v5h5v3"/><path d="M9 13h4M9 17h2"/><path d="m14.5 21 .6-2.6 4.8-4.8a1.4 1.4 0 0 1 2 2l-4.8 4.8z"/>'),
  // contact — an envelope
  mail: wrap('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3.5 6.5 8.5 6.5 8.5-6.5"/>'),
  // research projects — a folder
  project: wrap('<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>'),
  // news — talk, degree, grant, and the computer (the lab is a CS lab)
  talk: wrap('<path d="M20 12a8 8 0 0 1-11.6 7.1L4 20l1-4.4A8 8 0 1 1 20 12Z"/>'),
  degree: wrap('<path d="m2 9 10-5 10 5-10 5z"/><path d="M6 11v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5"/><path d="M22 9v5"/>'),
  grant: wrap('<circle cx="12" cy="9" r="5"/><path d="m8.5 13-1.5 8 5-3 5 3-1.5-8"/>'),
  computer: wrap('<rect x="4" y="4" width="16" height="11" rx="1.5"/><path d="M12 15v4M8 19.5h8"/>'),
}

// the two brand marks, as their owners draw them (filled, not line icons)
export const GITHUB = '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>'
export const LINKEDIN = '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M0 1.15C0 .51.53 0 1.18 0h13.64C15.47 0 16 .51 16 1.15v13.7c0 .64-.53 1.15-1.18 1.15H1.18C.53 16 0 15.49 0 14.85zm4.94 12.24V6.17h-2.4v7.22zm-1.2-8.21c.84 0 1.36-.55 1.36-1.25-.02-.71-.52-1.25-1.34-1.25-.82 0-1.36.54-1.36 1.25 0 .7.52 1.25 1.33 1.25zm4.91 8.21V9.36c0-.22.02-.43.08-.59.17-.43.57-.88 1.23-.88.87 0 1.22.66 1.22 1.63v3.87h2.4V9.25c0-2.22-1.18-3.25-2.76-3.25-1.28 0-1.85.7-2.17 1.19V6.17h-2.4c.03.68 0 7.22 0 7.22z"/></svg>'

// news items in cv.ts open with an emoji (kept for the old site); read it as a line icon here
const NEWS: Record<string, string> = { '💬': 'talk', '🎓': 'degree', '🌱': 'grant', '💻': 'computer', '🚀': 'computer' }
export const newsIcon = (text: string) => ICONS[NEWS[[...text][0]] ?? 'computer']
