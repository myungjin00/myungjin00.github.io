# myungjin00.github.io

Personal site for **Myungjin Lee** — research, news, notes and CV — built with Astro,
deployed to GitHub Pages.

**Live site:** https://myungjin00.github.io

## Edit content

- CV content (papers, projects, grants, news, education, skills): `src/data/cv.ts`
- Featured projects on the home page: `src/data/projects.ts`
- Notes: Markdown files in `src/content/blog/`
- Images and PDFs: `public/assets/`

## Local development

```bash
npm install
npm run dev       # http://localhost:4321
npm run build     # production build into dist/
npm run preview   # preview the production build
```

## Deployment

Pushing to the `main` branch triggers the GitHub Actions workflow
(`.github/workflows/deploy.yml`), which builds the site and publishes it to GitHub Pages.

One-time setup on GitHub: **Settings → Pages → Build and deployment → Source → GitHub Actions**.
