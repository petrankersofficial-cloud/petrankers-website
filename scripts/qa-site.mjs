#!/usr/bin/env node
// © 2026 Orrnob Mahmud. All rights reserved. Proprietary, see LICENSE. Build sbs-ebbd6a56dd25
/**
 * SITE QA: crawls the built site in dist/ and checks every page.
 * Runs as the last step of `npm run check`, so a broken site never deploys.
 *
 * ERRORS (block deploy): broken internal links, missing local images, pages with 0 or 2+ H1s,
 *   missing <title>/description/canonical, invalid JSON-LD, sitemap URLs that do not exist,
 *   noindex pages listed in the sitemap.
 * WARNINGS: duplicate titles or descriptions across indexable pages, internal links without
 *   a trailing slash (they cost a redirect).
 *
 *   npm run qa            (after npm run build)
 */
import { readFileSync, existsSync, globSync, statSync } from 'node:fs';
import { join } from 'node:path';

const DIST = process.env.QA_DIST ?? 'dist'; // Next.js static export uses QA_DIST=out
if (!existsSync(DIST)) {
  console.error('dist/ not found. Run npm run build first.');
  process.exit(1);
}
const cfg = readFileSync('src/site.config.ts', 'utf8');
const SITE = cfg.match(/url:\s*'([^']+)'/)?.[1] ?? '';
const host = SITE ? new URL(SITE).host : '';

// Normalise Windows backslashes so the path checks below work on every OS.
const pages = globSync(`${DIST}/**/*.html`).map((f) => f.replaceAll('\\', '/')).filter((f) => !f.startsWith(`${DIST}/admin/`) && !f.startsWith(`${DIST}/pagefind/`));
const errors = [];
const warnings = [];
const titles = new Map();
const descs = new Map();
const noindexPaths = new Set();

const pathOf = (f) => '/' + f.slice(DIST.length + 1).replace(/index\.html$/, '').replace(/\.html$/, '/');
function resolves(p) {
  const clean = decodeURIComponent(p.split('#')[0].split('?')[0]);
  if (!clean || clean === '/') return existsSync(join(DIST, 'index.html'));
  const target = join(DIST, clean);
  if (existsSync(target) && statSync(target).isFile()) return true;
  if (existsSync(join(target, 'index.html'))) return true;
  if (existsSync(`${target.replace(/\/$/, '')}.html`)) return true;
  return false;
}

for (const f of pages) {
  const html = readFileSync(f, 'utf8');
  const path = pathOf(f);
  const is404 = path.startsWith('/404');
  const E = (m) => errors.push(`${path}  ${m}`);
  const W = (m) => warnings.push(`${path}  ${m}`);

  // Head
  const title = html.match(/<title>([^<]*)<\/title>/)?.[1]?.trim();
  if (!title) E('missing <title>');
  const desc = html.match(/<meta name="description" content="([^"]*)"/)?.[1]?.trim();
  if (!desc) E('missing meta description');
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
  if (!canonical && !is404) E('missing canonical');
  const noindex = /<meta name="robots" content="noindex/.test(html);
  if (noindex) noindexPaths.add(path);
  if (!/<html lang="/.test(html)) E('missing <html lang>');

  // Headings
  const h1s = (html.match(/<h1[\s>]/g) ?? []).length;
  if (h1s !== 1) E(`has ${h1s} <h1> tags (need exactly 1)`);

  // Structured data
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try { JSON.parse(m[1]); } catch { E('invalid JSON-LD'); }
  }

  // Links
  for (const m of html.matchAll(/<a\b[^>]*\shref="([^"]+)"/g)) {
    let href = m[1].replace(/&amp;/g, '&');
    if (/^(mailto:|tel:|#|javascript:)/.test(href)) continue;
    if (/^https?:\/\//.test(href)) {
      if (!host || new URL(href).host !== host) continue; // external
      href = new URL(href).pathname + new URL(href).hash;
    }
    if (!href.startsWith('/')) continue;
    if (!resolves(href)) E(`broken internal link: ${href}`);
    else {
      const p = href.split('#')[0].split('?')[0];
      if (p && !p.endsWith('/') && !/\.[a-z0-9]{2,5}$/i.test(p)) W(`link without trailing slash: ${href}`);
    }
  }

  // Local images
  for (const m of html.matchAll(/<img\b[^>]*\ssrc="([^"]+)"/g)) {
    const src = m[1];
    if (src.startsWith('/') && !src.startsWith('//') && !resolves(src)) E(`missing image: ${src}`);
  }
  for (const m of html.matchAll(/<img\b(?![^>]*\salt=)[^>]*>/g)) E(`image without alt attribute: ${m[0].slice(0, 80)}`);

  if (!noindex && !is404) {
    if (title) titles.set(title, [...(titles.get(title) ?? []), path]);
    if (desc) descs.set(desc, [...(descs.get(desc) ?? []), path]);
  }
}

for (const [t, list] of titles) if (list.length > 1) warnings.push(`duplicate <title> "${t}" on ${list.join(', ')}`);
for (const [d, list] of descs) if (list.length > 1) warnings.push(`duplicate meta description on ${list.join(', ')}`);

// Sitemap
const sitemapFiles = globSync(`${DIST}/sitemap-*.xml`).filter((f) => !f.endsWith('sitemap-index.xml'));
let sitemapCount = 0;
for (const f of sitemapFiles) {
  for (const m of readFileSync(f, 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)) {
    sitemapCount++;
    const p = new URL(m[1]).pathname;
    if (!resolves(p)) errors.push(`sitemap lists a URL that does not exist: ${p}`);
    if (noindexPaths.has(p)) errors.push(`sitemap lists a noindex page: ${p}`);
  }
}
for (const req of ['robots.txt', 'sitemap-index.xml', 'rss.xml', 'llms.txt', '404.html']) {
  if (!existsSync(join(DIST, req))) errors.push(`missing /${req}`);
}

if (errors.length) { console.log('\nErrors:'); errors.forEach((e) => console.log(`  ERROR  ${e}`)); }
if (warnings.length) { console.log('\nWarnings:'); warnings.slice(0, 40).forEach((w) => console.log(`  warn   ${w}`)); if (warnings.length > 40) console.log(`  ...and ${warnings.length - 40} more`); }
console.log(`\nSite QA: ${pages.length} pages, ${sitemapCount} sitemap URLs, ${errors.length} error(s), ${warnings.length} warning(s).`);
process.exit(errors.length ? 1 : 0);
