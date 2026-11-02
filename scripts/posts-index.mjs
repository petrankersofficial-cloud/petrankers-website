#!/usr/bin/env node
/**
 * Print every page an agent can link to internally (core pages, posts, case studies)
 * with title, URL, category, and keywords. Agents run this before writing internal links.
 *   npm run posts:index            -> readable table
 *   npm run posts:index -- --json  -> JSON
 */
import { readFileSync, globSync } from 'node:fs';
import matter from 'gray-matter';

const rows = [];
for (const f of globSync('src/pages/**/*.astro')) {
  if (/\[|404|\/blog\/|\/case-studies\//.test(f)) continue;
  const path = f.replace(/^src\/pages/, '').replace(/index\.astro$/, '').replace(/\.astro$/, '/');
  const src = readFileSync(f, 'utf8');
  const found = src.match(/metaTitle=\{?[`"']([^`"']+)[`"']/)?.[1];
  const title = found && !found.includes('${') ? found : path === '' ? 'Home' : path;
  rows.push({ type: 'page', url: path || '/', title, category: '', keywords: '' });
}
for (const [dir, base, type] of [
  ['src/content/blog', '/blog/', 'post'],
  ['src/content/case-studies', '/case-studies/', 'case-study'],
]) {
  for (const f of globSync(`${dir}/*/index.{md,mdx}`)) {
    const { data } = matter(readFileSync(f, 'utf8'));
    if (data.draft || data.noindex) continue;
    rows.push({
      type,
      url: `${base}${data.slug}/`,
      title: data.title,
      category: data.category ?? data.industry ?? '',
      keywords: [data.focusKeyword, ...(data.secondaryKeywords ?? [])].filter(Boolean).join(', '),
    });
  }
}
rows.push({ type: 'archive', url: '/blog/', title: 'Blog', category: '', keywords: '' });
rows.push({ type: 'archive', url: '/case-studies/', title: 'Case Studies', category: '', keywords: '' });

if (process.argv.includes('--json')) console.log(JSON.stringify(rows, null, 2));
else for (const r of rows) console.log(`${r.type.padEnd(11)} ${r.url.padEnd(52)} ${r.title}${r.keywords ? `  [${r.keywords}]` : ''}`);
