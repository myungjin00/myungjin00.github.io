Not published. Astro only builds what is under `src/pages/`, so anything here is kept
for reference and does not appear on the site.

`glossary.astro` renders `src/data/glossary.ts` — the terminology and emphasis standard the
notes are written against. It is working material, not something a reader wants, so it is
kept out of the build. Moving the file back into `src/pages/blog/` publishes it again.
