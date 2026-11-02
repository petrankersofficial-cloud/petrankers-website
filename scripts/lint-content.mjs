#!/usr/bin/env node
// © 2026 Orrnob Mahmud. All rights reserved. Proprietary, see LICENSE. Build sbs-ebbd6a56dd25
/**
 * CONTENT LINT: SEO + house-style checks the schema cannot express.
 * ERRORS block publishing (exit 1). WARNINGS are printed but do not block.
 *
 *   npm run lint:content                 -> check everything
 *   npm run lint:content -- <path/to/index.md> [...]  -> check specific entries
 */
import { readFileSync, existsSync, globSync } from 'node:fs';
import { dirname, join, relative, basename } from 'node:path';
import matter from 'gray-matter';

const root = process.cwd();
const cfgSrc = readFileSync(join(root, 'src/site.config.ts'), 'utf8');
const num = (k, d) => Number(cfgSrc.match(new RegExp(`${k}:\\s*(\\d+)`))?.[1] ?? d);
const str = (k, d) => cfgSrc.match(new RegExp(`${k}:\\s*'([^']*)'`))?.[1] ?? d;
const RULES = {
  metaTitleMax: num('metaTitleMax', 60),
  descMin: num('metaDescriptionMin', 120),
  descMax: num('metaDescriptionMax', 160),
  minInternal: num('minInternalLinks', 2),
  banEmDash: !/banEmDash:\s*false/.test(cfgSrc),
};
const SITE_NAME = str('name', '');
const SITE_URL = str('url', '');
const TITLE_TEMPLATE = str('titleTemplate', '%s');
const RESERVED = new Set(['page', 'category', 'tag', 'rss', 'feed', 'index']);

const categories = new Set(JSON.parse(readFileSync('src/content/categories.json', 'utf8')).map((c) => c.id));
const authors = new Set(JSON.parse(readFileSync('src/content/authors.json', 'utf8')).map((a) => a.id));

const TYPES = ['blog', 'case-studies', 'services', 'locations'];
const all = TYPES.flatMap((t) => globSync(`src/content/${t}/*/index.md`).map((f) => ({ f, type: t })));
const slugsOf = (t) => new Set(all.filter((e) => e.type === t).map((e) => matter(readFileSync(e.f, 'utf8')).data.slug));
const serviceSlugs = slugsOf('services');
const locationSlugs = slugsOf('locations');
const args = process.argv.slice(2).map((a) => relative(root, a));
const targets = args.length ? all.filter((e) => args.some((a) => e.f === a || dirname(e.f) === a)) : all;
if (args.length && !targets.length) {
  console.error(`No content entries matched: ${args.join(', ')}`);
  process.exit(1);
}

const slugOwners = new Map();
for (const e of all) {
  const { data } = matter(readFileSync(e.f, 'utf8'));
  const key = `${e.type}/${data.slug}`;
  slugOwners.set(key, [...(slugOwners.get(key) ?? []), e.f]);
}

let errors = 0;
let warnings = 0;

// 5-word shingles for every location page, computed once (used by the duplicate-copy check)
let _shingles;
function locationShingles() {
  if (_shingles) return _shingles;
  _shingles = new Map();
  for (const e of all.filter((x) => x.type === 'locations')) {
    const w = matter(readFileSync(e.f, 'utf8')).content.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
    const s = new Set();
    for (let i = 0; i + 5 <= w.length; i++) s.add(w.slice(i, i + 5).join(' '));
    _shingles.set(e.f, s);
  }
  return _shingles;
}

// Stray content files are silently ignored by the build, so they must fail here.
const valid = new Set(all.map((e) => e.f));
const stray = TYPES.flatMap((t) => globSync(`src/content/${t}/**/*.{md,mdx,markdown}`)).filter((f) => !valid.has(f));
if (stray.length) {
  console.log('\nStray content files (the build would silently skip these):');
  for (const f of stray) {
    const fix = f.endsWith('.mdx') || f.endsWith('.markdown')
      ? 'use .md (MDX is not enabled)'
      : 'each entry must be <folder>/index.md, e.g. src/content/blog/my-post/index.md';
    console.log(`  ERROR  ${f}: ${fix}`);
  }
  errors += stray.length;
}

for (const { f, type } of targets) {
  const src = readFileSync(f, 'utf8');
  const { data, content } = matter(src);
  const dir = dirname(f);
  const E = [];
  const W = [];

  // Slug
  if (!data.slug) E.push('missing slug');
  else {
    if (basename(dir) !== data.slug) E.push(`folder name "${basename(dir)}" must equal slug "${data.slug}"`);
    if (RESERVED.has(data.slug)) E.push(`slug "${data.slug}" is reserved`);
    if ((slugOwners.get(`${type}/${data.slug}`) ?? []).length > 1) E.push(`duplicate slug "${data.slug}"`);
    if (data.slug.split('-').length > 8) W.push('slug is long (more than 8 words); keep it short and keyword-led');
  }

  // Titles + meta
  const built = String(data.metaTitle ?? '').toLowerCase().includes(SITE_NAME.toLowerCase())
    ? String(data.metaTitle ?? '')
    : TITLE_TEMPLATE.replace('%s', data.metaTitle ?? '');
  if (built.length > RULES.metaTitleMax)
    W.push(`final <title> is ${built.length} chars (target ${RULES.metaTitleMax} or fewer): "${built}"`);
  const dl = String(data.metaDescription ?? '').length;
  if (dl < RULES.descMin || dl > RULES.descMax)
    W.push(`metaDescription is ${dl} chars (target ${RULES.descMin} to ${RULES.descMax})`);
  if (data.focusKeyword) {
    const kw = String(data.focusKeyword).toLowerCase();
    if (!String(data.metaTitle ?? '').toLowerCase().includes(kw)) W.push(`focusKeyword "${data.focusKeyword}" not in metaTitle`);
    if (!String(data.title ?? '').toLowerCase().includes(kw)) W.push(`focusKeyword "${data.focusKeyword}" not in title (H1)`);
    const firstPara = content.trim().split(/\n\s*\n/)[0]?.toLowerCase() ?? '';
    if (!firstPara.includes(kw)) W.push(`focusKeyword "${data.focusKeyword}" not in first paragraph`);
  }

  // References
  if (type === 'blog') {
    if (!categories.has(data.category)) E.push(`category "${data.category}" not in categories.json (${[...categories].join(', ')})`);
    if (!authors.has(data.author)) E.push(`author "${data.author}" not in authors.json (${[...authors].join(', ')})`);
  } else if (data.author && !authors.has(data.author)) E.push(`author "${data.author}" not in authors.json`);

  // Location pages: City + ZIP + service formula
  if (type === 'locations') {
    const zip = data.zips?.[0];
    const city = String(data.city ?? '').toLowerCase();
    if (data.service && !serviceSlugs.has(data.service)) E.push(`service "${data.service}" has no page in src/content/services`);
    for (const n of data.nearby ?? []) if (!locationSlugs.has(n)) E.push(`nearby "${n}" has no page in src/content/locations`);
    if (zip) {
      if (!String(data.metaTitle ?? '').includes(zip)) W.push(`primary ZIP ${zip} not in metaTitle (City + ZIP rule)`);
      if (!content.includes(zip)) W.push(`primary ZIP ${zip} not in body copy (City + ZIP rule)`);
    }
    if (city && !String(data.metaTitle ?? '').toLowerCase().includes(city) && !String(data.title ?? '').toLowerCase().includes(city))
      W.push(`city "${data.city}" not in title or metaTitle`);
    if (city && !String(data.title ?? '').toLowerCase().includes(city)) W.push(`city "${data.city}" not in title (H1)`);
  }

  // Thin / duplicate location copy: compare against other location pages (one line per page)
  if (type === 'locations' && content.length > 200) {
    const mine = locationShingles().get(f);
    let worst = null;
    let count = 0;
    for (const [other, theirs] of locationShingles()) {
      if (other === f || !mine?.size) continue;
      let shared = 0;
      for (const x of mine) if (theirs.has(x)) shared++;
      const ratio = shared / mine.size;
      if (ratio > 0.6) {
        count++;
        if (!worst || ratio > worst.ratio) worst = { other, ratio };
      }
    }
    if (worst)
      W.push(`${Math.round(worst.ratio * 100)}% of body text duplicates ${worst.other}${count > 1 ? ` (and ${count - 1} other location page(s))` : ''}. Write unique local copy (doorway page risk)`);
  }

  // Images exist + alt text
  if (data.featuredImage && !/^https?:/.test(data.featuredImage) && !existsSync(join(dir, data.featuredImage)))
    E.push(`featuredImage not found: ${data.featuredImage}`);
  for (const m of content.matchAll(/!\[([^\]]*)\]\(([^)\s]+)[^)]*\)/g)) {
    const [, alt, path] = m;
    if (!alt.trim()) E.push(`image without alt text: ${path}`);
    if (!/^https?:|^\//.test(path) && !existsSync(join(dir, path))) E.push(`image file not found: ${path}`);
  }

  // Headings
  if (/^#\s/m.test(content)) E.push('body contains an H1 (# ...). The template renders the H1 from `title`; start body headings at ##');
  const hs = [...content.matchAll(/^(#{2,6})\s/gm)].map((m) => m[1].length);
  hs.forEach((d, i) => { if (i && d > hs[i - 1] + 1) W.push(`heading level jumps from H${hs[i - 1]} to H${d}`); });
  if (type === 'blog' && hs.filter((d) => d === 2).length < 2) W.push('fewer than 2 H2 sections');

  // Links
  const links = [...content.matchAll(/(?<!!)\[[^\]]+\]\(([^)\s]+)[^)]*\)/g)].map((m) => m[1]);
  const host = SITE_URL.replace(/^https?:\/\//, '');
  const internal = links.filter((l) => l.startsWith('/') || (host && l.includes(host)));
  if (internal.length < RULES.minInternal) W.push(`only ${internal.length} internal link(s) (target ${RULES.minInternal} or more)`);
  for (const l of internal) if (l.startsWith('/') && !l.includes('#') && !l.includes('.') && !l.endsWith('/'))
    W.push(`internal link without trailing slash: ${l} (causes a redirect)`);

  // House style
  if (RULES.banEmDash && /—/.test(src)) E.push('contains an em dash (—). Rewrite with a comma, colon, or period');
  if (/lorem ipsum/i.test(content)) E.push('contains lorem ipsum');
  if (!data.draft && /\bTODO\b/.test(src)) E.push('contains TODO placeholders but draft is false');
  const words = content.split(/\s+/).filter(Boolean).length;
  if (type === 'blog' && words < 300) W.push(`body is only ${words} words`);
  if (data.draft) W.push('draft: true (will NOT be published)');
  if (data.publishDate && new Date(data.publishDate) > new Date()) W.push(`scheduled for ${new Date(data.publishDate).toISOString().slice(0, 10)} (goes live on the first build after that date)`);

  if (E.length || W.length) {
    console.log(`\n${f}`);
    E.forEach((m) => console.log(`  ERROR  ${m}`));
    W.forEach((m) => console.log(`  warn   ${m}`));
  }
  errors += E.length;
  warnings += W.length;
}

console.log(`\nContent lint: ${targets.length} entr${targets.length === 1 ? 'y' : 'ies'}, ${errors} error(s), ${warnings} warning(s).`);
process.exit(errors ? 1 : 0);
