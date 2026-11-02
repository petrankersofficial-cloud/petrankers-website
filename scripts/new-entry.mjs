#!/usr/bin/env node
/**
 * Scaffold a new post or case study folder with every required field.
 *   npm run new:post -- "Emergency Plumber in Vernon Hills 60061"
 *   npm run new:case-study -- "345% More Calls for a Vernon Hills Plumber"
 * Optional: --slug custom-slug --category guides --date 2026-12-01
 */
import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const [type, ...rest] = process.argv.slice(2);
if (!['blog', 'case-studies'].includes(type)) {
  console.error('Usage: node scripts/new-entry.mjs <blog|case-studies> "Title" [--slug x] [--category y] [--date YYYY-MM-DD]');
  process.exit(1);
}
const flags = {};
const words = [];
for (let i = 0; i < rest.length; i++) {
  if (rest[i].startsWith('--')) flags[rest[i].slice(2)] = rest[++i];
  else words.push(rest[i]);
}
const title = words.join(' ').trim();
if (!title) {
  console.error('Give a title, e.g. npm run new:post -- "My Post Title"');
  process.exit(1);
}
const STOP = new Set(['a', 'an', 'the', 'and', 'or', 'of', 'to', 'in', 'for', 'on', 'with', 'is', 'are', 'your', 'you', 'how', 'what', 'why']);
const slug =
  flags.slug ??
  title
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9\s-]/g, '')
    .split(/\s+/)
    .filter((w, i, arr) => w && (!STOP.has(w) || arr.length <= 4))
    .slice(0, 7)
    .join('-');
const date = flags.date ?? new Date().toISOString().slice(0, 10);
const dir = join('src/content', type, slug);
if (existsSync(dir)) {
  console.error(`Already exists: ${dir}`);
  process.exit(1);
}
const firstCategory = JSON.parse(readFileSync('src/content/categories.json', 'utf8'))[0]?.id ?? 'guides';
const firstAuthor = JSON.parse(readFileSync('src/content/authors.json', 'utf8'))[0]?.id ?? 'editorial-team';
const q = (s) => JSON.stringify(s);

const blog = `---
title: ${q(title)}
metaTitle: ${q(title.slice(0, 60))}
metaDescription: "TODO: 120 to 160 characters. Lead with the focus keyword and the benefit, end with a reason to click."
slug: ${slug}
publishDate: ${date}
author: ${firstAuthor}
category: ${flags.category ?? firstCategory}
tags: []
focusKeyword: ""
secondaryKeywords: []
featuredImage: ./featured.jpg
featuredImageAlt: "TODO: describe the image in plain words"
excerpt: "TODO: 1 to 2 sentence summary for cards and RSS."
faq: []
draft: true
---

TODO intro paragraph. Include the focus keyword and link to at least two internal pages.

## First section

## Second section
`;

const cs = `---
title: ${q(title)}
metaTitle: ${q(title.slice(0, 60))}
metaDescription: "TODO: 120 to 160 characters. Lead with the headline result."
slug: ${slug}
publishDate: ${date}
client: "TODO: client name or anonymized description"
industry: "TODO"
location: ""
services: ["TODO"]
duration: ""
results:
  - metric: "TODO metric"
    before: ""
    after: "TODO"
    change: ""
featuredImage: ./featured.jpg
featuredImageAlt: "TODO"
excerpt: "TODO: one sentence with the headline result."
faq: []
draft: true
---

## The challenge

## What we did

## The result
`;

mkdirSync(dir, { recursive: true });
writeFileSync(join(dir, 'index.md'), type === 'blog' ? blog : cs);
console.log(`Created ${join(dir, 'index.md')}`);
console.log(`Next: add ${join(dir, 'featured.jpg')} (1600x900 recommended), fill every TODO, set draft: false, run npm run check.`);
