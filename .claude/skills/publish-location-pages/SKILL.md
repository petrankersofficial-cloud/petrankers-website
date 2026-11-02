---
name: publish-location-pages
description: Create City + ZIP + service location pages (service-area pages) on this static Astro site, one or many at once, with unique local copy and interlinking. Use when the user asks for location pages, service area pages, city pages, ZIP code pages, or "[service] in [city]" pages for this site.
---

# Publish location pages

Follow AGENTS.md, section "Workflow: location pages".

1. Intake: list of cities (with state and primary ZIP), which services (or city hubs only), any real local details (neighborhoods, jobs done, reviews). Ask for missing ZIPs; never guess them.
2. For each page:
   - `npm run new:location -- "<City> <Service> <ZIP>" --city "<City>" --state XX --zip <ZIP> [--service <service-slug>]`
   - Title and metaTitle carry city + service + ZIP. Copy uses both "City Service" and "ZIP Service" forms.
   - Write unique copy per city. Use only true local details. No find-and-replace between cities.
   - Set `nearby` to 2 to 4 neighboring location slugs. Link to the service page and the city hub in the body.
3. Make sure every `service` slug exists in `src/content/services/` (create the service page first if needed).
4. `npm run check`. Treat the duplicate-copy warning as a blocker. Pages you cannot make unique stay `draft: true`.
5. One commit for the batch: `locations: <n> pages`. Push.
6. Report the URL list, any drafts left, and warnings.
