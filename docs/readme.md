# Tessforma Assistant — Quick Deploy Guide

## What this repo contains
- `index.html` — main site
- `style.css` — all styles
- `app.js` — lightweight interactions
- `assets/` — logos, images, icons (create these folders)
- `sitemap.xml` — SEO sitemap

## How to deploy (GitHub Pages)
1. Create repo named `Tessforma Assistant` (you already have it).
2. Add all files to repo root (index.html, style.css, app.js, sitemap.xml) and the assets/ folder.
3. Commit & push.
4. In GitHub > Settings > Pages: Choose `main` branch, `/root` folder → Save.
5. GitHub will provide a URL like `https://<your-username>.github.io/Tessforma%20Assistant/`. (You can map a custom domain later.)

## Quick edits
- Replace images in `assets/images/` (recommended sizes: hero 1200×800, portfolio 800×800).
- Replace logos in `assets/logos/` (logo-gradient.png, favicon.png).
- Update WhatsApp number in `index.html` / `app.js` to your current number.

## To connect a custom domain
- Buy domain (e.g., tessformastudio.com.ng). In GitHub Pages settings add custom domain and update DNS (CNAME/A) as instructed by GitHub.

## Notes & next steps
- This is a static site (no server storage) — secure and simple.
- When ready, we can add a simple backend form or Stripe checkout for payments.
