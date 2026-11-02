# Static Blog Starter

Free, agent-first site template: Astro + GitHub + Netlify or Cloudflare Pages.
Core pages are hand-designed. Blogs and case studies are Markdown files that render through fixed templates with all SEO handled automatically.

**Cost: $0** beyond the domain. Astro is free open-source software, GitHub repos are free, and both hosts' free tiers run the build.

## How it works

```
Agent writes src/content/blog/<slug>/index.md + images
        |
   git push to GitHub (main)
        |
Netlify / Cloudflare Pages runs: npm run check  (lint + build; invalid content fails here)
        |
Static HTML goes live in about 1 to 2 minutes
```

## Local setup

Requires Node.js 22.23.4 or newer.

```
npm install
npm run dev        # http://localhost:4321
npm run check      # what the host runs before deploying
```

## Deploy (one time per site)

**Cloudflare Pages:** Workers & Pages > Create > Pages > Connect to Git > pick the repo.
- Framework preset: Astro
- Build command: `npm run check`
- Output directory: `dist`
- Environment variable: `NODE_VERSION` = `22`

**Netlify:** Add new site > Import from Git > pick the repo. `netlify.toml` sets everything.

Then add the custom domain in the host dashboard.

## New client checklist

1. Use this repo as a template on GitHub ("Use this template") or copy it.
2. Edit `src/site.config.ts` (name, URL, NAP, nav, CTA).
3. Drop in the design: `src/design/` (tokens, CSS, header, footer) and core pages in `src/pages/`. See `HANDOFF.md`.
4. Replace `public/logo.svg`, `public/favicon.svg`, `public/og-default.jpg`.
5. Set authors in `src/content/authors.json` and categories in `src/content/categories.json`.
6. Delete the sample posts in `src/content/`.
7. Connect the host. Optional: add the `DEPLOY_HOOK_URL` secret for scheduled posts.

## Publishing

Hand the content to an agent and say "publish this following AGENTS.md". Ready-made prompts: `docs/agent-prompts.md`. In Claude Code, use `/publish-blog` or `/publish-case-study`.

Manual: `npm run new:post -- "Title"`, fill the file, add `featured.jpg`, `npm run check`, commit, push.

## Free tier tips

- Batch several posts into one push. Each push is one build.
- `.github/workflows/ci.yml` checks PRs on GitHub's free minutes before the host builds.
- If a host's free build limit is ever reached, switch on `.github/workflows/deploy-cloudflare.yml` (builds on GitHub, uploads finished files).

## Key files

| Path | Purpose |
|---|---|
| `AGENTS.md` | Publishing rules every agent follows |
| `src/content.config.ts` | Frontmatter schema (the "SEO plugin") |
| `src/layouts/BlogPostLayout.astro` | Single post template |
| `src/layouts/CaseStudyLayout.astro` | Single case study template |
| `src/design/` | Design layer (swap per client) |
| `src/site.config.ts` | Per-site settings |
| `scripts/lint-content.mjs` | SEO + style checks |
| `public/_redirects` | 301 redirects |
