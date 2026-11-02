#!/usr/bin/env node
// © 2026 Orrnob Mahmud. All rights reserved. Proprietary, see LICENSE. Build sbs-ebbd6a56dd25
/**
 * IndexNow: tell Bing (which feeds ChatGPT search), Yandex, Seznam and others about new or
 * updated URLs right after a deploy. Free. Google does not use IndexNow (use the sitemap in GSC).
 *
 *   npm run indexnow -- --since HEAD~1          # URLs for content changed in the last commit
 *   npm run indexnow -- --since <sha> --wait    # wait until the new URLs are live, then ping
 *   npm run indexnow -- --all                   # every content URL (after a launch or migration)
 *   npm run indexnow -- /blog/my-post/ /services/x/
 *   add --dry-run to print without sending
 *
 * Requires `indexNowKey` in src/site.config.ts (the key file is served at /indexnow-key.txt).
 */
import { readFileSync, existsSync, globSync } from 'node:fs';
import { execSync } from 'node:child_process';
import matter from 'gray-matter';

const cfg = readFileSync('src/site.config.ts', 'utf8');
const SITE = cfg.match(/url:\s*'([^']+)'/)?.[1];
const KEY = cfg.match(/indexNowKey:\s*'([^']*)'/)?.[1];
const args = process.argv.slice(2);
const flag = (n) => args.includes(n);
const val = (n) => (args.includes(n) ? args[args.indexOf(n) + 1] : undefined);

if (!KEY) {
  console.log('IndexNow skipped: set indexNowKey in src/site.config.ts');
  process.exit(0);
}
if (!SITE || SITE.includes('example.com')) {
  console.log('IndexNow skipped: site.url is still the example domain');
  process.exit(0);
}

const BASES = { blog: '/blog/', 'case-studies': '/case-studies/', services: '/services/', locations: '/service-areas/' };

function urlForContentFile(f) {
  const type = f.split('/')[2];
  if (!BASES[type] || !existsSync(f)) return null;
  const { data } = matter(readFileSync(f, 'utf8'));
  if (data.draft || data.noindex || !data.slug) return null;
  if (data.publishDate && new Date(data.publishDate) > new Date()) return null; // scheduled, not live yet
  return `${BASES[type]}${data.slug}/`;
}

function urlForPageFile(f) {
  if (/\[|404|thank-you|search|\.ts$/.test(f)) return null;
  return f.replace(/^src\/pages/, '').replace(/index\.astro$/, '').replace(/\.astro$/, '/') || '/';
}

let paths = new Set(args.filter((a) => a.startsWith('/')));

if (flag('--all')) {
  for (const f of globSync('src/content/{blog,case-studies,services,locations}/*/index.md')) {
    const u = urlForContentFile(f);
    if (u) paths.add(u);
  }
  for (const f of globSync('src/pages/**/*.astro')) {
    const u = urlForPageFile(f);
    if (u) paths.add(u);
  }
} else if (val('--since')) {
  const since = val('--since');
  let changed = [];
  try {
    changed = execSync(`git diff --name-only --diff-filter=AMR ${since} HEAD`, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).split('\n').filter(Boolean);
  } catch {
    console.log(`Could not diff against ${since}; nothing sent.`);
    process.exit(0);
  }
  let archives = false;
  for (const f of changed) {
    if (f.startsWith('src/content/') && /index\.mdx?$/.test(f)) {
      const u = urlForContentFile(f);
      if (u) { paths.add(u); archives = true; }
    } else if (f.startsWith('src/pages/') && f.endsWith('.astro')) {
      const u = urlForPageFile(f);
      if (u) paths.add(u);
    }
  }
  if (archives) ['/blog/', '/services/', '/service-areas/', '/case-studies/'].forEach((p) => paths.add(p));
}

const urls = [...paths].map((p) => new URL(p, SITE).toString());
if (!urls.length) {
  console.log('IndexNow: no new or changed URLs.');
  process.exit(0);
}

if (flag('--wait')) {
  // Wait for the host to finish deploying: every URL must return 200 (max 10 minutes).
  const deadline = Date.now() + 10 * 60 * 1000;
  await new Promise((r) => setTimeout(r, 60_000));
  let pending = [...urls];
  while (pending.length && Date.now() < deadline) {
    const results = await Promise.all(pending.map(async (u) => [u, (await fetch(u, { method: 'HEAD' }).catch(() => ({ status: 0 }))).status]));
    pending = results.filter(([, s]) => s !== 200).map(([u]) => u);
    if (pending.length) await new Promise((r) => setTimeout(r, 30_000));
  }
  if (pending.length) console.log(`Not live after 10 minutes, still sending: ${pending.join(', ')}`);
  await new Promise((r) => setTimeout(r, 60_000)); // let the CDN settle for updated pages
}

const host = new URL(SITE).host;
const body = { host, key: KEY, keyLocation: `${SITE}/indexnow-key.txt`, urlList: urls.slice(0, 10000) };
console.log(`IndexNow: ${urls.length} URL(s)\n  ${urls.join('\n  ')}`);
if (flag('--dry-run')) process.exit(0);

const res = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify(body),
});
console.log(`IndexNow response: ${res.status} ${res.statusText}`);
// 200/202 = accepted. 403 = key file not reachable yet (deploy first). 422 = URL host mismatch.
process.exit(res.status === 200 || res.status === 202 ? 0 : 1);
