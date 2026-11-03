---
name: publish-service-page
description: Create or update a core service page on this static Astro site (hero, benefits, process, pricing, FAQ, Service schema). Use when the user asks to add a service page, publish a service, or update an existing service on this site.
---

# Publish a service page

Follow AGENTS.md, section "Workflow: service pages".

1. `npm run new:service -- "<Service Name>"` (or edit the existing `src/content/services/<slug>/index.md`).
2. Fill `serviceName`, `serviceType`, hero `excerpt`, 4 to 8 `benefits`, 3 to 5 `process` steps, and `faq` from the source content. `priceRange` only with real prices from the client.
3. Body: what it is, who it is for, signs you need it, what is included. 2 or more internal links (`npm run posts:index`).
4. Image: client photo, else `npm run featured-image -- src/content/services/<slug>`.
5. `npm run check` until 0 errors. Commit `service: <slug>`, push. Report URL, title tag, warnings.
