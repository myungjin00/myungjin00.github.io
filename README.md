# myungjin00.github.io

Personal CV / portfolio site for **Myungjin Lee** — built with React + Vite + TypeScript,
deployed to GitHub Pages.

**Live site:** https://myungjin00.github.io

## Edit content

All CV content lives in a single file:

```
src/data/cv.ts
```

Edit the fields there (profile, education, publications, projects, skills, …) and the site
updates automatically. Items marked `// TODO` are placeholders to fill in later.

To add a profile photo: drop the image in `public/assets/` (e.g. `profile.jpg`) and set
`photo: '/assets/profile.jpg'` in `src/data/cv.ts`.

## Local development

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # production build into dist/
npm run preview   # preview the production build
```

## Deployment

Pushing to the `main` branch triggers the GitHub Actions workflow
(`.github/workflows/deploy.yml`), which builds the site and publishes it to GitHub Pages.

One-time setup on GitHub: **Settings → Pages → Build and deployment → Source → GitHub Actions**.
