---
name: migrate-wordpress
description: Migrate blog posts from a WordPress site into this static Astro site using a WordPress export file, keeping SEO meta, images, categories and 301 redirects. Use when the user wants to move a WordPress blog, import WordPress posts, or migrate from WP to this site.
---

# Migrate WordPress posts

Follow AGENTS.md, section "Workflow: WordPress migration".

1. Get the export: WordPress admin > Tools > Export > Posts > Download Export File (.xml). Ask for it if not provided.
2. Dry run first: `npm run import:wordpress -- <file.xml> --dry-run`. Show the user the counts.
3. Import: `npm run import:wordpress -- <file.xml> --images` (add `--include-drafts` if asked, `--author <id>` to set the author).
4. Work through the report: rewrite weak meta descriptions, review auto alt text, note generated featured images.
5. `npm run check`. Fix every error. Address warnings on the highest-traffic posts first if the user shares GSC data.
6. Check `public/_redirects`: every old post URL and category URL must 301 to its new path. Add old page URLs (about, services, contact) by hand.
7. One commit `import: wordpress posts`, push. After launch: submit the sitemap in Search Console and run `npm run indexnow -- --all`.
