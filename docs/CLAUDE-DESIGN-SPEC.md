# Claude Design Spec: designing a new site so it ports in minutes

Use this when designing a client site **from scratch** in Claude Design. A design built to this spec drops into the starter with almost no rework: the agent copies the CSS, the header, and the footer, and every template (blog, case study, service, location, contact) picks up the new look automatically.

Designs that do not follow the spec still work. They just take longer to port (see HANDOFF.md).

---

## Part 1: The prompt to paste into Claude Design

Copy everything in the box, fill the brackets, and attach any brand assets (logo, photos, colors).

```
Design a website for [BUSINESS NAME], a [TYPE OF BUSINESS] in [CITY, STATE].
Audience: [WHO]. Tone: [e.g. trustworthy, modern, local]. Brand colors: [HEX or "propose"]. Fonts: [names or "propose, Google Fonts only"].
Main services: [LIST]. Main cities served: [LIST]. Phone: [PHONE]. Primary CTA: [e.g. "Get a Free Quote"].

This design will be ported into an existing Astro template system, so follow these technical rules exactly:

OUTPUT
- Plain HTML + one CSS file (styles.css). No Tailwind, no CSS frameworks, no build step. Vanilla JS only, and only where needed (mobile menu, accordions).
- Fonts from Google Fonts only. Icons as inline SVG.
- Images referenced from /images/. Use descriptive file names.

CSS VARIABLES (define on :root at the top of styles.css, use them everywhere, use these exact names)
--color-primary, --color-primary-contrast, --color-accent,
--color-bg, --color-surface, --color-border, --color-text, --color-text-muted,
--font-heading, --font-body,
--fs-base, --fs-h1, --fs-h2, --fs-h3, --lh-body,
--container, --content-width, --radius, --gap, --shadow

SHARED PARTS (identical markup on every page)
- <header class="site-header"> containing .site-logo, <nav class="site-nav"><ul> links, and a phone/CTA button with class "btn"
- <footer class="site-footer"> with business name, address, phone, nav links, and links to /privacy-policy/ and /terms/
- Width wrapper: .container. Buttons: .btn (primary) and .btn--ghost (outline). Muted text: .muted

PAGES TO DESIGN (one HTML file each)
1. index.html: home page (free design)
2. about.html: about page (free design)
3. service.html: single service page (template, see classes below)
4. location.html: single city/ZIP service page (template)
5. blog.html: blog archive (template)
6. post.html: single blog post (template)
7. case-study.html: single case study (template)
8. contact.html: contact page with form (template)
9. 404.html

TEMPLATE CLASS NAMES (use these exact classes on the template pages; style them however the brand needs)
- Breadcrumbs: <nav class="breadcrumbs"><ol><li>...</li></ol></nav>
- Page intro block on archive/contact pages: .page-hero
- Blog archive: .category-pills (ul of links, active link has aria-current="page"), .post-grid containing .post-card cards, each card = img + .post-card__body > .post-card__meta, .post-card__title (h2 with a link), excerpt p. Pagination: .pagination (links, current page is a span with aria-current="page")
- Single post: .post-header (breadcrumbs, h1, .post-meta row), .post-featured (figure with the image), .post-layout (2 columns: main content + aside.post-sidebar). Main column: .prose (the article body), .faq (h2 + <details><summary> items), .cta-block (h2, p, .btn), .author-box (img, name, role, bio). Sidebar: .toc (.toc__title + ol of links) and .sidebar-cta. Below: section.related with a .post-grid
- Case study: .post-header (h1 + excerpt), .stat-cards containing .stat-card items, each with .stat-card__metric (label), .stat-card__after (big number), .stat-card__before ("from X"), .stat-card__change ("+345%"). Then dl.cs-facts (dt/dd pairs: Client, Industry, Location, Services, Timeline), .post-featured, .prose, blockquote.testimonial (p + footer), .faq, .cta-block
- Service page: .service-hero (2 columns: text with h1, intro p, .hero-actions holding a .btn and a .btn--ghost call button; image on the right), .prose, ul.check-list (benefit items), ol.steps (numbered process items: strong title + text), ul.link-grid (pill links to service areas), .faq, .cta-block. Use div.section to space sections
- Location page: same as the service page, plus iframe.map-embed (Google Map) and ul.link-grid for "Nearby areas" and "Other services in this city"
- Contact page: .contact-grid (form + NAP side by side). Form: form.contact-form with label-wrapped inputs, .form-row for two fields side by side (name + phone), a select, a textarea, and a submit .btn

ARTICLE BODY (critical)
Blog posts, case studies, service and location pages are written in Markdown, which outputs plain HTML with NO classes inside a <div class="prose">. Style these elements as descendants of .prose so any article looks right:
h2, h3, h4, p, a, strong, em, ul, ol, li, blockquote, table, th, td, img, figure, figcaption, hr, code, pre.
Put a full sample article inside .prose on post.html that uses every one of these elements, including a table, an image, a blockquote, and nested lists.

CONTENT RULES FOR THE DESIGN
- Design for real-world variation: titles that wrap to 3 lines, posts with no sidebar table of contents, case studies with 1 stat card and with 6, cards with long and short excerpts.
- Mobile first: everything must work at 390px wide, no horizontal scroll, the post sidebar moves above or below the content.
- Accessibility: visible focus states, color contrast at least 4.5:1 for body text, every image has alt text.
- No em dashes anywhere in the copy.
- Do not put any agency or vendor name in the design or copy.
```

---

## Part 2: Why each rule exists (for the porting agent and for you)

| Rule | Why |
|---|---|
| Plain HTML + one CSS file | `.astro` files accept plain HTML. One stylesheet maps to `src/design/global.css`. Tailwind would need extra setup and every template rewritten |
| Exact CSS variable names | They are the same names as `src/design/tokens.css`. Paste the `:root` block and every component re-skins |
| Exact template class names | The starter's layouts already output these classes. Matching CSS = no layout edits |
| `.prose` element styling | Markdown output has no classes. Without this, posts look unstyled |
| Header and footer as one block each | They become `src/design/Header.astro` and `Footer.astro` with links read from `site.config.ts` |
| Edge-case content | Templates render whatever agents publish, so the design must survive long titles and missing pieces |
| /images/ folder | Maps to `public/images/`. Post images live with their posts and are optimized by the build |

## Part 3: Porting a spec-compliant design (agent checklist)

1. `styles.css` goes into `src/design/global.css`. Move its `:root` block into `src/design/tokens.css`. Keep the starter's form-warning and `.visually-hidden` rules if the design lacks them.
2. Google Fonts `<link>` tags go into `<head>` in `src/layouts/BaseLayout.astro`.
3. The `<header>` markup goes into `src/design/Header.astro`. Replace hard-coded nav links with the `site.nav` loop, the phone with `site.business.phone`, and the logo link with `site.logo`.
4. The `<footer>` markup goes into `src/design/Footer.astro`, with NAP and nav from `site.config.ts`.
5. `index.html`, `about.html`, and `404.html` become `src/pages/index.astro`, `src/pages/about.astro`, and `src/pages/404.astro`. Paste the `<main>` content inside `<BaseLayout metaTitle="..." metaDescription="...">`. Add `is:inline` to any inline `<script>`.
6. Images from `/images/` go to `public/images/`.
7. Template pages (post, case study, service, location, blog, contact) need **no markup changes** when the classes match. Compare each HTML file against its layout and only adjust structure where the design added something new (for example an extra badge row). Never rename props or frontmatter fields.
8. Fill `src/site.config.ts`, delete the sample content, run `npm run check`, and visually compare every page type against the design files at desktop and 390px.

If the design broke a rule (Tailwind, different class names, no `.prose` styles), fall back to the full integration steps in HANDOFF.md and tell the user which rules were broken, so the next design brief can be tightened.
