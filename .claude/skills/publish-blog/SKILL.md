---
name: publish-blog
description: Publish a blog post to this static Astro site from a Google Doc, .docx, pasted text, or Markdown, following the site's single-post template and SEO rules. Use when the user says publish this blog, post this article, add this blog post, or hands over blog content for this site.
---

# Publish a blog post

Follow AGENTS.md exactly. This is the condensed run order.

## 1. Intake (ask only for what is missing and truly needed)
- Content: the doc / file / pasted text. If it is a Google Doc link and a Google Drive tool is available, read it there.
- Images: use the ones supplied with the content. If none and no stock allowed, ask.
- Publish date: today unless the user gave one (future date = scheduled).
- Review mode: direct to `main` (default) or PR.

## 2. Build the entry
1. Pick H1, focus keyword, slug (3 to 6 keyword-led words), category (from `src/content/categories.json`), author (from `src/content/authors.json`).
2. `npm run new:post -- "<H1>" --slug <slug> --category <id> [--date YYYY-MM-DD]`
3. Fill every frontmatter field per the AGENTS.md spec. Meta title: final `<title>` with brand suffix at 60 chars or fewer. Meta description: 120 to 160 chars.
4. Convert body to Markdown: headings from `##`, keep wording, tables and lists intact. Move FAQs into `faq` frontmatter.
5. Save images into the post folder (`featured.jpg` + descriptive names), add alt text.
6. `npm run posts:index`, add 2 or more internal links (trailing slash), plus a service page link if relevant.
7. Apply the style rules (no em dashes, hyphenated compound adjectives, "instead of", "more than"/"fewer than", City + ZIP for local).
8. `draft: false`, no TODO left.

## 3. Validate and ship
1. `npm run check` until 0 errors.
2. Commit `publish: <slug>` and push (or branch `content/<slug>` + PR if review was requested).
3. Report: URL path, H1, final title tag, meta description, word count, internal links added, warnings left.

## Batch mode
Several posts at once: build each entry, run `npm run check` once at the end, push a single commit `publish: <n> posts`.
