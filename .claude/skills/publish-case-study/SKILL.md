---
name: publish-case-study
description: Publish a client case study to this static Astro site with stat cards, project facts, and schema, from notes, a doc, or a report. Use when the user says publish this case study, add a case study, or hands over client results for this site.
---

# Publish a case study

Follow AGENTS.md exactly (section "Workflow: publish a case study").

1. Extract from the source: client (or anonymized description), industry, location, services, timeline, and every before/after number. **Never invent or round numbers.** If a key result is missing, ask.
2. `npm run new:case-study -- "<headline result as title>" --slug <slug>`
3. Fill `results` with 1 to 6 stat cards (`metric`, `after`, optional `before`, `change`). Strongest result first.
4. Body: `## The challenge`, `## What we did` (bullets), `## The result` with the key figures in **bold**. Keep prose minimal.
5. Testimonial only if a real quote was supplied.
6. Featured image in the folder with alt text. Add 2 or more internal links (`npm run posts:index`), ideally the service pages used.
7. `draft: false`, `npm run check` until 0 errors, commit `case-study: <slug>`, push.
8. Report: URL path, title tag, meta description, stat cards rendered, warnings left.
