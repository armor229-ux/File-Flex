# FileFlex

> Every file. Every format. Free.

FileFlex is a free suite of private, in-browser file tools. Every tool runs 100% client-side — your files never leave your browser. No backend, no uploads, no signup.

## Deploy to Vercel

1. Push this repository to GitHub/GitLab/Bitbucket.
2. Go to [vercel.com/new](https://vercel.com/new) and import the repository.
3. Vercel auto-detects Next.js. Configure the following:
   - **Build command:** `next build`
   - **Output:** default (no static export)
   - **Node version:** `22.x` (see `engines` in `package.json`)
   - **Environment variable:** set `NEXT_PUBLIC_SITE_URL` to your production URL
     (e.g. `https://file-flex-psi.vercel.app`). This is used by `app/robots.ts`
     and `app/sitemap.ts` to generate absolute canonical URLs.
4. Click **Deploy**.

## Run locally

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
npm run start    # start production server
npm run lint     # ESLint
```

## Features

- 43 file tools (PDF, Images, Office, Utilities) — all client-side
- 5 languages: English, Arabic (RTL), French, Spanish, Italian
- Dark/light theme toggle
- Real AES-256 PDF encryption via qpdf-wasm
- iLovePDF-style header with hover mega menus
- Premium 9-dot Apps popover with language selector
- GDPR cookie consent
- AdSense-ready (opt-in)
- WCAG AA accessible
- SEO: sitemap, robots, Schema.org, OG image

## Tech Stack

- Next.js 14 (App Router)
- TypeScript (strict)
- Tailwind CSS 4 + shadcn/ui (New York)
- Framer Motion
- Inter + Bebas Neue (next/font)
- Lenis smooth scroll

## License

MIT
