# HANDOFF: Static Blog Starter (for the next Claude session)

Read this first if you are picking up this project in a new conversation.

## Goal

A repeatable, **$0** system for client sites built with Claude Design, stored in GitHub, and auto-deployed to Netlify or Cloudflare Pages (free tiers). Core pages stay hand-designed. **Blogs and case studies scale through templates**, like an Elementor single-post template: an agent drops in one Markdown file + images, pushes, and the post goes live with all SEO data, in the set design.

## Status: what is DONE

Built and verified (production build passes, output checked):

- **Astro 7.4.5** project (Node 22.23.4 or newer required). Free, MIT, no paid services.
- **Content collections with Zod schemas** (`src/content.config.ts`): blog, caseStudies, authors, categories. Invalid posts **fail the build** (tested).
- **Templates:** `BlogPostLayout` (breadcrumbs, meta row, featured image, TOC, FAQ, CTA block + sidebar CTA, author box, related posts), `CaseStudyLayout` (stat cards, project facts, testimonial, FAQ, CTA, more case studies), `BlogListLayout` (archive grid, category pills, pagination).
- **Routes:** `/blog/`, `/blog/page/N/`, `/blog/category/<id>/` (+ paged), `/blog/<slug>/`, `/case-studies/`, `/case-studies/<slug>/`, `/rss.xml`, `/robots.txt`, `/sitemap-index.xml`, `/404`. Empty categories get no page.
- **SEO layer:** title template with brand suffix, meta description, canonical, robots/noindex, OG + Twitter (auto 1200x630 crop of featured image), prev/next on paginated archives, JSON-LD graph (LocalBusiness/Organization on every page, BlogPosting/Article/HowTo, BreadcrumbList, FAQPage, CollectionPage). Sitemap has `lastmod` and excludes noindex/draft.
- **Images:** co-located with posts, auto-converted to WebP with responsive `srcset`, lazy-loaded, featured image `fetchpriority=high`.
- **Scheduling + drafts:** `draft: true` hidden; future `publishDate` hidden until a build on/after that date. `.github/workflows/scheduled-publish.yml` triggers a build hook only on days a post is due.
- **Scripts:** `lint:content` (title/description length, focus keyword placement, slug/folder match, reserved and duplicate slugs, category/author ids, image existence + alt text, H1 in body, heading jumps, internal link count + trailing slash, em dash ban, TODO ban), `new:post`, `new:case-study`, `posts:index`, `check` (lint + build).
- **Agent layer:** `AGENTS.md` (full publishing manual for any agent), `CLAUDE.md` (imports AGENTS.md), skills `/publish-blog` and `/publish-case-study` in `.claude/skills/`, copy-paste prompts in `docs/agent-prompts.md`.
- **Deploy:** `netlify.toml`, `public/_headers`, `public/_redirects` (both hosts read these), CI check workflow, optional GitHub-build-then-upload workflow for Cloudflare (escape hatch for free build limits).

## Status: what is WAITING on the user

**The real design.** Everything visual is a neutral placeholder. The user will send an existing Claude Design site (HTML/CSS, or a GitHub repo) plus a blog/case-study design if they have one.

## When the design arrives: integration steps

The design layer is isolated in `src/design/`. Do this in order:

1. **Tokens:** pull colors, fonts, radius, spacing from the design into `src/design/tokens.css`. If the design loads Google Fonts, add the `<link>` in `BaseLayout.astro` (named slot `head` or directly in `<head>`).
2. **Global CSS:** put the design's stylesheet into `src/design/global.css` (or `@import` it). Keep the "Template classes" section at the bottom, restyled to match. If the design is Tailwind, add `@tailwindcss/vite` and keep the class names in components.
3. **Header and footer:** replace the markup in `src/design/Header.astro` and `src/design/Footer.astro` with the design's. Keep links reading from `site.nav` and NAP from `site.business`.
4. **Core pages:** for each design page (home, about, services, contact...), create `src/pages/<name>.astro` (or `src/pages/<name>/index.astro`). Paste the page's `<main>` content inside `<BaseLayout metaTitle="..." metaDescription="...">`. Move its `<head>` meta into BaseLayout props. Move images to `public/` or `src/assets/`. Plain HTML works as-is in `.astro` files (watch for `class` on SVG and inline `<script>`: add `is:inline` to scripts that must not be bundled).
5. **Blog + case study templates:** if the user has a blog design, restyle `BlogPostLayout.astro`, `CaseStudyLayout.astro`, `BlogListLayout.astro`, and `src/components/blog/*` to match it. **Do not change prop names or the frontmatter schema**: agents depend on them. If no blog design is given, derive one from the site's visual language (cards, buttons, type scale).
6. **Site config:** fill `src/site.config.ts` (name, URL, title template, NAP, business type, areaServed, sameAs, nav, CTA). Replace `public/logo.svg`, `public/favicon.svg`, `public/og-default.jpg` (1200x630).
7. **Clean up:** delete the three sample entries in `src/content/`, set real authors/categories JSON, run `npm run check`, open `npm run dev` and visually check: home, `/blog/`, one post, a category page, `/case-studies/`, one case study, 404, mobile width.
8. If migrating from WordPress, add old URL 301s to `public/_redirects`.

## Decisions already made (do not re-litigate)

- Astro over Eleventy/Hugo: content collections + Zod validation + built-in image optimization are the guardrails that make agent publishing safe.
- Markdown (`.md`) not MDX for posts: simplest format for agents; MDX glob is already allowed if components are ever needed in posts.
- One folder per post (`<slug>/index.md` + images) so media travels with the post.
- URLs: trailing slash, `/blog/<slug>/`, `/case-studies/<slug>/`, `/blog/category/<id>/`, pagination `/page/N/`.
- No CMS installed. Optional later: Pages CMS or Sveltia CMS (both free, Git-based, edit the same files).

## User preferences that affect this project

- Everything must stay free (only paid items: domain, Claude subscription).
- Agentic first: the user hands an agent the content, the agent publishes end to end.
- Content rules: no em dashes; white-label (no agency name in client deliverables); City + ZIP + service formula for local pages with the ZIP in the title tag and body; hyphenated compound adjectives; "instead of" not "over"; "more than"/"fewer than" for amounts.
- Case studies: lead with data, minimal prose, bold the figures.
- Replies: English, direct, terse.

## Verify after any change

```
npm install
npm run check     # 0 errors required
npm run dev       # visual check
```
