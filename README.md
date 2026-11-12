# myungjin00.github.io

Personal research site for **Myungjin Lee** — molecular machine learning and omics.
Built with [Astro](https://astro.build), deployed to GitHub Pages.

- **Live:** https://myungjin00.github.io

The base path comes from `ASTRO_BASE` and defaults to `/`, so the same source can also be
served from a sub-path.

## Layout

```
src/pages/        the pages; projects/ has one page per project
src/layouts/      Base (header, nav, search, footer) and Project
src/data/         cv.ts is the single source for the CV, news and project data
src/content/blog/ the notes, in English and Korean, paired by `group`
src/scripts/      the canvas scenes, the contact terminal, the seasonal layer
scripts/          the self-checks (figure generation lives alongside, untracked)
```

## Develop

```sh
npm install
npm run dev        # http://localhost:4321/
npm run build      # -> dist/
node scripts/check-scenes.mjs   # the molecular scenes stay well-formed
node scripts/check-seoul.mjs    # the clock's day/night and season logic
```
