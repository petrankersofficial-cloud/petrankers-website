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

Phase 2 additions (also built and verified):

- **Service pages** (`services` collection, `/services/<slug>/`, `ServiceLayout`): hero with CTA + call button, benefits, process steps, optional price range, service areas for that service, FAQ, other services. Service + WebPage + Breadcrumb + FAQ schema.
- **Location pages** (`locations` collection, `/service-areas/<slug>/`, `LocationLayout`): city hub or service-in-city (`service` set). ZIP list, neighborhoods, free Google Maps embed (no API key), same-city services, nearby areas, FAQ. Service schema with `areaServed` City + PostalAddress. Index at `/service-areas/` grouped by city.
- **Lint for locations:** primary ZIP in metaTitle and body, city in H1, valid `service`/`nearby` slugs, and a duplicate-copy check (more than 60% shared 5-word phrases with another location page = doorway risk warning).
- **Contact form** (`src/components/ContactForm.astro`): Netlify Forms, Web3Forms, or Formspree via `site.forms.provider`, honeypot spam field, redirects to `/thank-you/` (noindex, conversion tracking point). `/contact/` page with NAP + ContactPage schema.
- **Analytics** (`src/components/Analytics.astro`): GTM (with noscript), GA4, Cloudflare Web Analytics, Clarity, Google + Bing verification. All off until IDs are set in `site.analytics`.
- **Legal:** `/privacy-policy/` and `/terms/` generated from site config (mentions only the tools actually enabled). Footer links. Client must review.
- **AEO:** `/llms.txt` generated from all services, locations, case studies, and posts. WebSite schema with SearchAction. IndexNow: key file at `/indexnow-key.txt`, `scripts/indexnow.mjs`, and `.github/workflows/indexnow.yml` that waits for the deploy to go live, then pings changed URLs.
- **Search:** Pagefind (free, static) runs after `astro build`; `/search/` page with `?q=` support; only content areas are indexed (`data-pagefind-body`).
- **WordPress importer** (`npm run import:wordpress`): WXR to Markdown (tables kept), Yoast + Rank Math title/description/focus keyword with variables resolved, brand suffix stripped, media-library alt text, featured image download (converted to JPG) or generated fallback, internal links rewritten to new paths, Gutenberg comments and shortcodes stripped, body H1 demoted, em dashes replaced (colon in titles, comma in body), categories added, 301s appended to `_redirects`, review report. Tested on a sample export.
- **Featured image generator** (`npm run featured-image`): on-brand 1600x900 title card from `tokens.css` colors + site name (sharp, offline).
- **Scaffolders:** `new:service`, `new:location` (with `--city --state --zip --service`). All scaffolds validate as drafts.
- **Editor UI (optional):** Sveltia CMS at `/admin/` (`public/admin/config.yml`), GitHub token sign-in, edits the same files for all four collections. Set `backend.repo` per site.
- **Skills:** `/publish-blog`, `/publish-case-study`, `/publish-service-page`, `/publish-location-pages`, `/migrate-wordpress`.

QA round (verified):

- **`npm run qa`** crawls `dist/` after every build (part of `npm run check`, so hosts refuse to deploy a broken site): broken internal links, missing local images, images without alt, exactly one H1, title/description/canonical/lang present, JSON-LD parses, sitemap URLs exist and contain no noindex pages, required files present. Warns on duplicate titles/descriptions and missing trailing slashes.
- **Bugs found and fixed:** author box linked to a non-existent `/about/` (placeholder About page added); `.mdx` and flat `.md` files were silently dropped by the build (now Markdown-only, lint errors on stray files); scheduled-publish ignored services and locations (fixed); JSON-LD did not escape `<`, so `</script>` in a FAQ could break the page (now escaped, tested with a malicious answer); paginated archives shared one meta description (page number added); duplicate-copy lint printed one line per page pair (now one line per page, 3x faster).
- **Stress test:** 282 live posts + 12 drafts + 6 scheduled, 30 case studies (1 and 6 stat cards), 15 services, 120 locations with nearby links and a draft location. Lint 0.6 s, build 12 s for 512 pages, QA 0.5 s, 0 errors, 0 warnings. Drafts and scheduled entries absent from pages, sitemap, RSS, and llms.txt. Unicode, quotes, colons, ampersands escaped correctly. No horizontal overflow and no JS errors on 22 page types at 390 px and 1280 px.
- Builds with real photos take longer than the stress test (each image is resized into several WebP sizes), but stay well within free-tier build time for sites of this size.

## Status: what is WAITING on the user

1. **The real design.** Everything visual is a neutral placeholder. The user will send an existing Claude Design site (HTML/CSS, or a GitHub repo) plus a blog/case-study design if they have one.
2. **First live deploy test** (needs their Cloudflare/Netlify account): connect the repo, confirm the build passes on the host, submit a test form, check `/llms.txt`, `/sitemap-index.xml`, `/search/`, and `/admin/`.

## When the design arrives: integration steps

**First check which kind of design it is:**
- **Designed from scratch to `docs/CLAUDE-DESIGN-SPEC.md`** (same CSS variable names, same template class names, `.prose` styled): follow the short checklist in Part 3 of that file. Porting is mostly copy-paste.
- **Existing or freeform design** (an already-live site, Tailwind, different class names): follow the full steps below.

The design layer is isolated in `src/design/`. Do this in order:

1. **Tokens:** pull colors, fonts, radius, spacing from the design into `src/design/tokens.css`. If the design loads Google Fonts, add the `<link>` in `BaseLayout.astro` (named slot `head` or directly in `<head>`).
2. **Global CSS:** put the design's stylesheet into `src/design/global.css` (or `@import` it). Keep the "Template classes" section at the bottom, restyled to match. If the design is Tailwind, add `@tailwindcss/vite` and keep the class names in components.
3. **Header and footer:** replace the markup in `src/design/Header.astro` and `src/design/Footer.astro` with the design's. Keep links reading from `site.nav` and NAP from `site.business`.
4. **Core pages:** for each design page (home, about, services, contact...), create `src/pages/<name>.astro` (or `src/pages/<name>/index.astro`). Paste the page's `<main>` content inside `<BaseLayout metaTitle="..." metaDescription="...">`. Move its `<head>` meta into BaseLayout props. Move images to `public/` or `src/assets/`. Plain HTML works as-is in `.astro` files (watch for `class` on SVG and inline `<script>`: add `is:inline` to scripts that must not be bundled).
5. **Blog + case study templates:** if the user has a blog design, restyle `BlogPostLayout.astro`, `CaseStudyLayout.astro`, `BlogListLayout.astro`, and `src/components/blog/*` to match it. **Do not change prop names or the frontmatter schema**: agents depend on them. If no blog design is given, derive one from the site's visual language (cards, buttons, type scale).
6. **Site config:** fill `src/site.config.ts` (name, URL, title template, NAP, business type, areaServed, sameAs, nav, CTA). Replace `public/logo.svg`, `public/favicon.svg`, `public/og-default.jpg` (1200x630).
7. **Restyle the other templates** to the design: `ServiceLayout.astro`, `LocationLayout.astro`, `ContactForm.astro` (and the `.contact-form`, `.service-hero`, `.check-list`, `.steps`, `.link-grid` classes in `global.css`), `/services/`, `/service-areas/`, `/contact/`, `/search/` (Pagefind UI picks up CSS variables `--pagefind-ui-*`). If the design already has a contact or services page, keep its look and drop `<ContactForm />` into it.
8. **Clean up:** delete all sample entries in `src/content/` (2 posts, 1 case study, 1 service, 3 locations), set real authors/categories JSON, set `site.forms`, `site.analytics`, `site.indexNowKey`, `site.legal`, and `backend.repo` in `public/admin/config.yml`. Run `npm run check`, open `npm run dev` and visually check: home, `/services/`, a service, `/service-areas/`, a location, `/blog/`, a post, a category page, `/case-studies/`, a case study, `/contact/`, 404, mobile width.
9. If migrating from WordPress, run the importer (`/migrate-wordpress`) and add old page URLs to `public/_redirects`.

## Next.js version (dormant)

If the user asks for a Next.js version of this system, or to add it to an existing Next.js site (their own portfolio is Next.js), read `.nextjs-port.md` in the repo root. It has the full port plan, constraints, and acceptance tests. Do nothing with it until asked.

## Decisions already made (do not re-litigate)

- Astro over Eleventy/Hugo: content collections + Zod validation + built-in image optimization are the guardrails that make agent publishing safe.
- Markdown (`.md`) not MDX for posts: simplest format for agents; MDX glob is already allowed if components are ever needed in posts.
- One folder per post (`<slug>/index.md` + images) so media travels with the post.
- URLs: trailing slash, `/blog/<slug>/`, `/case-studies/<slug>/`, `/blog/category/<id>/`, pagination `/page/N/`.
- Sveltia CMS is included but optional; agents remain the main publishing path.
- Location URLs live under `/service-areas/<slug>/` (flat, slug carries city + service), not nested under `/services/`.
- No Cloudflare Turnstile on forms: without a server to verify tokens it gives no real protection. Honeypot + provider spam filters instead.
- No tag archive pages (thin content). Tags only feed related posts.

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
