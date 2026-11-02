# AGENTS.md: Publishing Rules for This Site

This file is the operating manual for any AI agent (Claude Code, Claude Desktop, OpenCode, Kilo Code, Cursor, etc.) working in this repo. Read it fully before creating or editing content.

**Which task are you doing?**
- **Setting up a new client site, integrating a design, or continuing development of this starter:** read `HANDOFF.md` first (project goal, what is built, design integration steps, decisions already made), then this file.
- **Publishing content** (blog post, case study, service page, location pages, WordPress import): this file is all you need.

Requirements: Node.js 22.23.4 or newer. Run `npm install` once after cloning.

## What this repo is

A static Astro site. Core pages are `.astro` files in `src/pages/`. Blog posts and case studies are Markdown files that render through fixed templates, like a WordPress single-post template. Pushing to `main` on GitHub auto-deploys to Netlify or Cloudflare Pages.

```
src/content/blog/<slug>/index.md            <- blog post + its images        -> /blog/<slug>/
src/content/case-studies/<slug>/index.md    <- case study + its images       -> /case-studies/<slug>/
src/content/services/<slug>/index.md        <- core service page             -> /services/<slug>/
src/content/locations/<slug>/index.md       <- city hub or service-in-city   -> /service-areas/<slug>/
src/content/authors.json                    <- valid author ids
src/content/categories.json                 <- valid category ids
src/layouts/*Layout.astro                   <- templates (do not edit unless asked)
src/design/                                 <- header, footer, CSS (the design layer)
src/site.config.ts                          <- name, URL, NAP, nav, CTA, analytics, forms, IndexNow, lint rules
public/_redirects                           <- 301 redirects
```

Generated automatically on every build (never edit by hand): sitemap, RSS, robots.txt, llms.txt, schema, search index, OG images.

## Golden rules

1. **Content only.** When publishing, you create or edit files inside `src/content/` (and `public/_redirects` when a URL changes). You do not touch layouts, components, design files, or config unless the user explicitly asks.
2. **Folder name = slug.** `src/content/blog/emergency-plumber-vernon-hills/index.md` must have `slug: emergency-plumber-vernon-hills`.
3. **The template does the SEO plumbing.** Never add an H1, FAQ section, CTA block, author box, table of contents, schema, or meta tags inside the body. They come from frontmatter.
4. **Never publish what fails `npm run check`.** Fix every ERROR. Fix warnings unless there is a clear reason not to.
5. **Never invent facts.** No made-up statistics, prices, quotes, reviews, credentials, or client names. If the source content lacks something the template needs (for example a case study result), ask or leave the post as `draft: true`.

## Commands

| Command | What it does |
|---|---|
| `npm run new:post -- "Post Title"` | Scaffolds `src/content/blog/<slug>/index.md` with every field (as a draft) |
| `npm run new:case-study -- "Title"` | Same for a case study |
| `npm run new:service -- "Service Name"` | Same for a service page |
| `npm run new:location -- "Title" --city X --state IL --zip 60061 [--service slug]` | Same for a location page |
| `npm run featured-image -- <entry-folder> [--label "Cost Guide"]` | Generates an on-brand `featured.jpg` from the title when no photo exists |
| `npm run posts:index` | Lists every linkable URL on the site (use for internal links) |
| `npm run lint:content` | SEO + style checks on all content (add a path to check one entry) |
| `npm run check` | Lint + full production build (+ search index). Must pass before you commit |
| `npm run import:wordpress -- export.xml [--images]` | Imports a WordPress export (see Migration) |
| `npm run indexnow -- --since HEAD~1` | Pings IndexNow for changed URLs (CI does this automatically after deploy) |
| `npm run dev` | Local preview at http://localhost:4321 |

## Workflow: publish a blog post

Input can be a Google Doc, a .docx, pasted text, or Markdown. Steps:

1. **Read the source** and identify: H1, focus keyword, sections, images, FAQs, any CTA.
2. **Scaffold:** `npm run new:post -- "<H1>"` (pass `--slug` if the user gave one, `--category <id>` to set the category, `--date YYYY-MM-DD` to schedule).
3. **Fill the frontmatter** (spec below). Pick `category` and `author` only from the JSON files. If no category fits, ask before adding one to `categories.json`.
4. **Convert the body to Markdown:**
   - Start headings at `##`. Keep the source's heading hierarchy. Do not skip levels.
   - Keep the author's wording. Only fix what the style rules below require.
   - Tables as Markdown tables. Lists as Markdown lists.
   - FAQs found in the source go into the `faq` frontmatter field, not the body.
5. **Images** (see Image rules): save into the post folder, reference with `./file-name.jpg`.
6. **Internal links:** run `npm run posts:index`. Add at least 2 relevant internal links with natural anchor text, always with a trailing slash (`/blog/some-post/`). Link to the most relevant service page where one exists.
7. **Set `draft: false`** (unless the user asked for a draft) and remove every `TODO`.
8. **Validate:** `npm run check`. Fix every error.
9. **Commit and push** (see Git rules). Report back: URL path, title, meta title, word count, internal links added, and any warnings left.

## Workflow: publish a case study

Same as a blog post, using `npm run new:case-study`. Extra rules:

- **Lead with data.** `results` holds 1 to 6 stat cards: `metric`, `after` (required), `before`, `change`. Use the exact numbers from the source. Never round up or invent.
- `client` can be anonymized ("Plumbing company in Vernon Hills, IL") if the client is not named in the source.
- Body is short: The challenge, What we did, The result. Bold the key figures in the body.
- Testimonial only if a real quote is supplied.

## Workflow: service pages

1. `npm run new:service -- "<Service Name>"`. One page per core service.
2. Fill `serviceName`, `serviceType`, `excerpt` (hero line), `benefits` (4 to 8 short lines), `process` (3 to 5 steps), `faq`.
3. `priceRange` only when the client supplied real prices. Never estimate.
4. Body: what the service is, who it is for, signs you need it, what is included. Link to related services, relevant location pages, and 1 to 2 blog posts.
5. Image: client photo of the work if available, otherwise `npm run featured-image`.
6. `npm run check`, commit `service: <slug>`, push.

## Workflow: location pages (City + ZIP + service)

Two kinds, same collection:
- **City hub:** `npm run new:location -- "Plumber in Vernon Hills, IL 60061" --city "Vernon Hills" --state IL --zip 60061`. Lists every service for that city.
- **Service-in-city:** add `--service <service-slug>`, e.g. `"Vernon Hills Emergency Plumber 60061" --service emergency-plumbing`.

Rules:
- Primary ZIP in `metaTitle`, `title`, and body copy. City in `title`. Use both forms in the copy: "Vernon Hills emergency plumber" and "60061 emergency plumber".
- **Every location page needs unique copy.** No find-and-replace of the city name across pages. The lint flags pages that share more than 60% of their text (doorway page risk). Use real local details: neighborhoods served, local housing stock, jobs done in that area, response times, local reviews.
- `landmarks`, `neighborhoods`, and local claims only if true. Ask the user if unsure.
- Interlink: set `nearby` to 2 to 4 nearby location slugs, link to the matching service page, and link to the city hub.
- Batch creation (for example 20 cities) is fine, but every page must pass `npm run check` and carry unique copy. If you cannot write unique copy for a city, leave it as `draft: true` and say so.

## Workflow: WordPress migration

1. User exports from WordPress: Tools > Export > Posts.
2. `npm run import:wordpress -- export.xml --images` (drop `--images` if downloads fail; remote image URLs are kept).
3. The importer writes posts, pulls Yoast/Rank Math meta, adds categories, generates featured images where missing, and appends 301s to `public/_redirects`.
4. Read its report. Fix: auto alt text, generated featured images (replace with real photos when available), weak meta descriptions.
5. `npm run check`, fix errors, then commit `import: wordpress posts` in one push.
6. Pages (About, Services) are not imported automatically: rebuild them as `.astro` pages or service entries, and add their old URLs to `public/_redirects`.

## Frontmatter spec: blog

| Field | Required | Rule |
|---|---|---|
| `title` | yes | The H1. 10 to 110 characters. Contains the focus keyword |
| `metaTitle` | yes | `<title>`. The brand suffix is added automatically, so the final title must stay at 60 characters or fewer. Focus keyword near the front |
| `metaDescription` | yes | 120 to 160 characters. Focus keyword + benefit + reason to click |
| `slug` | yes | lowercase-kebab-case, 3 to 6 words, keyword-led, no stop words, no dates |
| `publishDate` | yes | `YYYY-MM-DD`. A future date schedules the post |
| `updatedDate` | no | Set when meaningfully updating an existing post |
| `author` | yes | id from `authors.json` |
| `category` | yes | id from `categories.json` |
| `tags` | no | lowercase, 0 to 5 |
| `focusKeyword` | recommended | Must appear in title, metaTitle, and first paragraph |
| `secondaryKeywords` | no | Used in schema keywords |
| `featuredImage` | yes | `./featured.jpg` (file in the post folder) |
| `featuredImageAlt` | yes | Plain description of the image |
| `excerpt` | yes | 40 to 300 characters. Shown on cards and RSS |
| `faq` | no | `- q: "..."` / `a: "..."`. Becomes the FAQ section + FAQPage schema |
| `cta` | no | Overrides the default CTA: `heading`, `text`, `buttonLabel`, `buttonHref` |
| `schemaType` | no | `BlogPosting` (default), `Article`, or `HowTo` |
| `canonical` | no | Only if the content is syndicated from another URL |
| `noindex` | no | `true` hides it from search + sitemap |
| `draft` | yes | `true` = not published |

Case studies add: `client`, `industry`, `location`, `services` (list), `duration`, `results` (list), `testimonial` (`quote`, `name`, `role`). `author`, `category`, `tags` are not used (author optional).

Services use the shared SEO fields plus: `serviceName`, `serviceType`, `excerpt`, `featuredImage`, `featuredImageAlt`, `benefits` (list), `process` (list of `title`/`text`), `priceRange`, `order`, `faq`, `cta`.

Locations use the shared SEO fields plus: `city`, `state` (2 letters), `zips` (list, primary first), `county`, `service` (service slug, optional), `excerpt`, `featuredImage` (optional, falls back to the service image), `neighborhoods`, `nearby` (location slugs), `landmarks`, `geo` (`lat`/`lng`), `showMap`, `faq`, `cta`.

## Writing style rules (apply to every post)

- **No em dashes (the long dash).** Use a comma, colon, period, or parentheses. The lint blocks them.
- Hyphenate compound adjectives before a noun: "asthma-friendly plan", "24-hour service".
- Compare options with "instead of", not "over".
- Amounts: "more than" / "smaller than" / "fewer than", not "over" / "under".
- Smooth active attribution: "as advised by the CDC", not "according to information provided by".
- Local service content: use the City + ZIP + service formula (for example "Vernon Hills Emergency Plumber" and "60061 Emergency Plumber"). Put the ZIP in the meta title and in the body.
- Short paragraphs (2 to 4 sentences). Answer the heading's question in the first sentence under it.
- External links only to authoritative sources (government, research, manufacturer docs). Open nothing in a new tab.
- White-label: never mention any agency, vendor, or tool name in client content.

## Image rules

- Featured image: `featured.jpg` (or `.webp`/`.png`), at least 1600x900, landscape 16:9. It is cropped to 1200x630 for social cards automatically.
- Body images: descriptive kebab-case names (`burst-pipe-under-sink.jpg`), at least 1200px wide.
- Keep source files smaller than 1 MB. The build converts and resizes them (WebP + responsive sizes).
- Every image needs real alt text describing what is in it. Do not stuff keywords.
- Sources, in order: images supplied with the content, then the client's own photos, then stock (Unsplash) if the user allows it, then `npm run featured-image -- <folder>` (on-brand title card generated from the design colors). Never use images of real identifiable people unless the client supplied them. Never hotlink.
- Body images are never generated. If the content references a photo you do not have, ask or leave it out.

## Updating, renaming, deleting

- **Update a post:** edit in place, set `updatedDate` to today. Keep the slug.
- **Change a slug:** rename the folder + `slug`, then add `/blog/old-slug/  /blog/new-slug/  301` to `public/_redirects`. Update internal links pointing to the old URL.
- **Delete a post:** remove the folder and add a 301 in `public/_redirects` to the most relevant remaining page. Search the content for links to it and fix them.
- **Unpublish without deleting:** `draft: true`.

## Site settings agents may change (only when asked)

All in `src/site.config.ts`:
- `analytics`: GTM, GA4, Cloudflare Web Analytics, Clarity, Search Console and Bing verification. Empty = off.
- `forms.provider`: `netlify` on Netlify, `web3forms` or `formspree` on Cloudflare Pages (add the key). Forms post to `/thank-you/` (track conversions there).
- `indexNowKey`: generate with `node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"`.
- `legal`: effective date and jurisdiction for `/privacy-policy/` and `/terms/`.

Contact forms: place `<ContactForm />` (from `src/components/ContactForm.astro`) on any `.astro` page. Optional props: `name`, `heading`, `submitLabel`, `showService`.

## Git rules

- Default: commit directly to `main` with message `publish: <slug>` (or `update: <slug>`, `case-study: <slug>`). Push. The host deploys automatically.
- If the user asks for review first, create a branch `content/<slug>` and open a PR. Netlify/Cloudflare post a preview URL on the PR.
- **Batch publishing:** when publishing several posts at once, add them all and push **one** commit (`publish: 5 posts`). Each push uses a build on the free tier.
- Never commit `dist/`, `node_modules/`, `.env`, or secrets.

## Definition of done

- [ ] `npm run check` passes with 0 errors
- [ ] Folder name equals slug
- [ ] Final `<title>` at 60 characters or fewer, meta description 120 to 160
- [ ] Focus keyword in title, metaTitle, first paragraph
- [ ] 2 or more internal links with trailing slashes
- [ ] Every image has alt text and exists in the folder
- [ ] No em dashes, no TODO, no invented facts
- [ ] Committed and pushed (or PR opened), and the user got the URL path
