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
npm run check      # what the host runs before deploying: content lint + build + site QA crawl
```

## Deploy (one time per site)

**Cloudflare Pages:** Workers & Pages > Create > Pages > Connect to Git > pick the repo.
- Framework preset: Astro
- Build command: `npm run check`
- Output directory: `dist`
- Environment variable: `NODE_VERSION` = `22`

**Netlify:** Add new site > Import from Git > pick the repo. `netlify.toml` sets everything.

Then add the custom domain in the host dashboard.

## What one repo gives you

| Feature | Where | Cost |
|---|---|---|
| Blog, case studies, service pages, City + ZIP location pages | `src/content/*` | Free |
| SEO: titles, meta, canonical, OG, schema, sitemap, RSS, robots | automatic | Free |
| `llms.txt` for AI assistants, IndexNow pings to Bing | automatic + GitHub Action | Free |
| Site search | Pagefind, built at deploy | Free |
| Contact form | Netlify Forms / Web3Forms / Formspree | Free tiers |
| Analytics | GTM, GA4, Cloudflare Web Analytics, Clarity (config IDs) | Free |
| Privacy policy + terms | generated from config | Free |
| WordPress import | `npm run import:wordpress` | Free |
| Editor UI for writers | Sveltia CMS at `/admin/` (optional) | Free |

## Client site already on its own GitHub (the usual case)

Run from this repo. The live site does not change until you merge the PR.

```
npm run install:client -- owner/client-repo
```

It clones the client repo next to this one, creates branch `add-content-system`, moves the current site into `_legacy/`, merges this starter, and links it as remote `starter`. Add `--pr` to push the branch and open a draft PR (Netlify posts a deploy preview). Your GitHub account needs write access to the client repo (the client adds you as a collaborator).

Then port the pages in `_legacy/` into the system (checklist below, from step 2, or the `/install-client` skill), delete `_legacy/`, run `npm run check`, and merge the PR.

**Pull later starter improvements** into a client site, from inside the client repo:

```
npm run starter:update -- --pr
```

It merges the latest starter on a new branch, keeps the client's content, design, core pages, logos, and redirects, drops new sample posts, and runs `npm run check` before pushing. If a system file was changed on both sides (for example a restyled layout), it stops and lists the files.

## New client checklist

1. Client repo already exists: `npm run install:client` (above). New site with no repo: "Use this template" on GitHub, or copy this repo.
2. Edit `src/site.config.ts` (name, URL, NAP, nav, CTA).
3. Drop in the design: `src/design/` (tokens, CSS, header, footer) and core pages in `src/pages/`. See `HANDOFF.md`. **Designing from scratch?** Paste the prompt in `docs/CLAUDE-DESIGN-SPEC.md` into Claude Design first, so the design ports in minutes.
4. Replace `public/logo.svg`, `public/favicon.svg`, `public/og-default.jpg`.
5. Set authors in `src/content/authors.json` and categories in `src/content/categories.json`.
6. Delete the sample entries in `src/content/` (posts, case study, service, locations).
7. In `src/site.config.ts` set: `forms` (on Cloudflare use `web3forms` + key), `analytics` IDs, `indexNowKey`, `legal`.
8. Connect the host. Optional: add the `DEPLOY_HOOK_URL` secret for scheduled posts.
9. After launch: submit `/sitemap-index.xml` in Google Search Console and Bing Webmaster Tools, send a test form, run `npm run indexnow -- --all`.

## Optional editor UI (Sveltia CMS)

For writers who prefer a dashboard: set `backend.repo` in `public/admin/config.yml` to `owner/repo`, deploy, open `/admin/`, choose "Sign In with Token", and paste a GitHub fine-grained personal access token with Contents read/write on that repo. Saving an entry commits to GitHub and triggers the normal build.

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
| `scripts/lint-content.mjs` | SEO + style checks on content files |
| `scripts/qa-site.mjs` | Crawls the built site for broken links, missing meta, schema errors |
| `docs/CLAUDE-DESIGN-SPEC.md` | Prompt + rules for designing new sites that port in minutes |
| `public/_redirects` | 301 redirects |
