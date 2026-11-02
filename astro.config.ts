// © 2026 Orrnob Mahmud. All rights reserved. Proprietary, see LICENSE. Build sbs-ebbd6a56dd25
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { readFileSync, globSync } from 'node:fs';
import matter from 'gray-matter';
import { site } from './src/site.config';

/**
 * Read post/case-study frontmatter once so the sitemap gets <lastmod>
 * and excludes noindex/draft content.
 */
const meta = new Map<string, { lastmod?: string; exclude: boolean }>();
for (const [dir, base] of [
  ['src/content/blog', '/blog/'],
  ['src/content/case-studies', '/case-studies/'],
  ['src/content/services', '/services/'],
  ['src/content/locations', '/service-areas/'],
] as const) {
  for (const f of globSync(`${dir}/*/index.md`)) {
    const { data } = matter(readFileSync(f, 'utf8'));
    if (!data.slug) continue;
    const d = data.updatedDate ?? data.publishDate;
    meta.set(`${site.url}${base}${data.slug}/`, {
      lastmod: d ? new Date(d).toISOString() : undefined,
      exclude: Boolean(data.noindex || data.draft),
    });
  }
}

export default defineConfig({
  site: site.url,
  trailingSlash: 'always',
  build: {
    format: 'directory', // /blog/my-post/index.html -> clean URLs on Netlify + Cloudflare Pages
  },
  integrations: [
    sitemap({
      filter: (page) =>
        !/\/(404|thank-you|search|admin)\//.test(page) && !meta.get(page)?.exclude,
      serialize(item) {
        const m = meta.get(item.url);
        if (m?.lastmod) item.lastmod = m.lastmod;
        return item;
      },
    }),
  ],
  image: {
    // Remote image domains the build may optimize (add a CDN if you host media elsewhere)
    domains: ['images.unsplash.com'],
  },
  markdown: {
    shikiConfig: { theme: 'github-light' },
  },
});
