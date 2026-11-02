#!/usr/bin/env node
/**
 * Print every page an agent can link to internally (core pages, services, locations, posts,
 * case studies) with title, URL, and keywords. Agents run this before writing internal links.
 *   npm run posts:index            -> readable table
 *   npm run posts:index -- --json  -> JSON
 */
import { readFileSync, globSync } from 'node:fs';
import matter from 'gray-matter';

const SKIP = /\[|404|thank-you|search|\/(blog|case-studies|services|service-areas)\/index\.astro$/;
const rows = [];
for (const f of globSync('src/pages/**/*.astro')) {
  if (SKIP.test(f)) continue;
  const path = f.replace(/^src\/pages/, '').replace(/index\.astro$/, '').replace(/\.astro$/, '/');
  const src = readFileSync(f, 'utf8');
  const found = src.match(/metaTitle=\{?[`"']([^`"']+)[`"']/)?.[1];
  const title = found && !found.includes('${') ? found : path === '' || path === '/' ? 'Home' : path;
  rows.push({ type: 'page', url: path || '/', title, keywords: '' });
}
for (const [dir, base, type] of [
  ['src/content/services', '/services/', 'service'],
  ['src/content/locations', '/service-areas/', 'location'],
  ['src/content/blog', '/blog/', 'post'],
  ['src/content/case-studies', '/case-studies/', 'case-study'],
]) {
  for (const f of globSync(`${dir}/*/index.md`)) {
    const { data } = matter(readFileSync(f, 'utf8'));
    if (data.draft || data.noindex) continue;
    rows.push({
      type,
      url: `${base}${data.slug}/`,
      title: data.title,
      keywords: [data.focusKeyword, ...(data.secondaryKeywords ?? []), data.city && `${data.city} ${data.zips?.[0] ?? ''}`.trim()]
        .filter(Boolean)
        .join(', '),
    });
  }
}
for (const [url, title] of [
  ['/services/', 'Services'],
  ['/service-areas/', 'Service Areas'],
  ['/blog/', 'Blog'],
  ['/case-studies/', 'Case Studies'],
]) rows.push({ type: 'archive', url, title, keywords: '' });

if (process.argv.includes('--json')) console.log(JSON.stringify(rows, null, 2));
else for (const r of rows) console.log(`${r.type.padEnd(11)} ${r.url.padEnd(52)} ${r.title}${r.keywords ? `  [${r.keywords}]` : ''}`);
