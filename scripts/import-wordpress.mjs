#!/usr/bin/env node
// © 2026 Orrnob Mahmud. All rights reserved. Proprietary, see LICENSE. Build sbs-ebbd6a56dd25
/**
 * WORDPRESS IMPORTER: WordPress export (WXR .xml) -> blog posts in this repo.
 *
 * In WordPress: Tools > Export > Posts > Download Export File. Then:
 *   npm run import:wordpress -- export.xml                  # publish-status posts, keeps remote image URLs
 *   npm run import:wordpress -- export.xml --images         # also download images into each post folder
 *   options: --include-drafts  --author <id>  --overwrite  --dry-run
 *
 * What it does:
 *  - Title, slug, date, categories, tags, excerpt, body (HTML -> Markdown, tables kept)
 *  - SEO meta from Yoast or Rank Math (title, description, focus keyword), variables resolved
 *  - Featured image (downloaded), or a generated on-brand image if none / download fails
 *  - Strips Gutenberg comments and shortcodes, demotes body H1 to H2, replaces em dashes
 *  - Adds missing categories to categories.json
 *  - Appends 301s from old WordPress URLs to public/_redirects
 *  - Prints a review report (auto alt text, generated images, short meta, etc.)
 * Run `npm run check` afterwards.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, appendFileSync, rmSync } from 'node:fs';
import { join, extname, basename } from 'node:path';
import { XMLParser } from 'fast-xml-parser';
import TurndownService from 'turndown';
import { gfm } from 'turndown-plugin-gfm';
import { createRequire } from 'node:module';
import { makeFeaturedImage } from './lib/featured-image.mjs';

const sharp = createRequire(import.meta.url)('sharp');
const args = process.argv.slice(2);
const flag = (n) => args.includes(n);
const val = (n) => (args.includes(n) ? args[args.indexOf(n) + 1] : undefined);
const file = args.find((a) => a.endsWith('.xml'));
if (!file || !existsSync(file)) {
  console.error('Usage: npm run import:wordpress -- <export.xml> [--images] [--include-drafts] [--author id] [--overwrite] [--dry-run]');
  process.exit(1);
}
const DRY = flag('--dry-run');
const DOWNLOAD = flag('--images');

const cfg = readFileSync('src/site.config.ts', 'utf8');
const SITE_NAME = cfg.match(/name:\s*'([^']+)'/)?.[1] ?? '';
const authorsJson = JSON.parse(readFileSync('src/content/authors.json', 'utf8'));
const AUTHOR = val('--author') ?? authorsJson[0]?.id ?? 'editorial-team';
const categoriesPath = 'src/content/categories.json';
const categories = JSON.parse(readFileSync(categoriesPath, 'utf8'));

// ---------- parse ----------
const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  cdataPropName: false,
  isArray: (name) => ['item', 'category', 'wp:postmeta', 'wp:category', 'wp:tag'].includes(name),
});
const xml = parser.parse(readFileSync(file, 'utf8'));
const channel = xml.rss?.channel;
if (!channel) {
  console.error('Not a WordPress WXR export file.');
  process.exit(1);
}
const WP_SITE_NAME = String(channel.title ?? SITE_NAME);
const WP_BASE = String(channel['wp:base_site_url'] ?? channel.link ?? '');
const items = channel.item ?? [];
const meta = (it) => Object.fromEntries((it['wp:postmeta'] ?? []).map((m) => [String(m['wp:meta_key']), String(m['wp:meta_value'] ?? '')]));
const text = (v) => (v == null ? '' : typeof v === 'object' ? String(v['#text'] ?? '') : String(v));

const attachments = new Map(); // id -> { url, alt }
const attachmentByUrl = new Map(); // url -> alt
for (const it of items) {
  if (text(it['wp:post_type']) !== 'attachment') continue;
  const url = text(it['wp:attachment_url']);
  const alt = meta(it)._wp_attachment_image_alt ?? '';
  attachments.set(text(it['wp:post_id']), { url, alt });
  attachmentByUrl.set(url, alt);
}

// Category names from the channel header
const wpCatNames = new Map();
for (const c of channel['wp:category'] ?? []) wpCatNames.set(text(c['wp:category_nicename']), text(c['wp:cat_name']));

// ---------- helpers ----------
const slugify = (s) =>
  String(s).toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/&[a-z]+;/g, ' ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
const decode = (s) =>
  String(s)
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#0?39;|&apos;|&#8217;|&rsquo;/g, "'").replace(/&#8216;|&lsquo;/g, "'")
    .replace(/&#8220;|&#8221;|&ldquo;|&rdquo;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;|&#160;/g, ' ')
    .replace(/&#8211;|&ndash;/g, '–').replace(/&#8212;|&mdash;/g, '—').replace(/&#8230;|&hellip;/g, '...');
const plain = (html) => decode(String(html).replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
const clip = (s, max) => {
  if (s.length <= max) return s;
  const cut = s.slice(0, max - 3);
  return cut.slice(0, cut.lastIndexOf(' ') > max * 0.6 ? cut.lastIndexOf(' ') : cut.length).replace(/[,;:.\s]+$/, '') + '...';
};
let emDashes = 0;
// Body text: em dash -> comma. Titles: em dash -> colon (reads naturally as a subtitle).
const noEmDash = (s, sep = ', ') =>
  String(s).replace(/\s*—\s*/g, () => {
    emDashes++;
    return sep;
  });
function seoVars(tpl, ctx) {
  return String(tpl)
    .replace(/%%title%%|%title%/g, ctx.title)
    .replace(/%%sitename%%|%sitename%/g, WP_SITE_NAME)
    .replace(/%%sep%%|%sep%/g, '|')
    .replace(/%%excerpt%%|%excerpt%/g, ctx.excerpt)
    .replace(/%%category%%|%category%|%%primary_category%%|%primary_taxonomy_terms%/g, ctx.category)
    .replace(/%%currentyear%%|%currentyear%/g, String(new Date().getFullYear()))
    .replace(/%%[a-z_]+%%|%[a-z_]+%/g, '')
    .replace(/\s+\|\s*$|\s{2,}/g, ' ')
    .trim();
}
function stripBrand(t) {
  // The template adds the brand suffix itself, so remove "| Site Name" / "- Site Name" from imported titles
  return t.replace(new RegExp(`\\s*[|\\-\\u2013\\u2014]\\s*(${[WP_SITE_NAME, SITE_NAME].filter(Boolean).map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\s*$`, 'i'), '').trim();
}

const td = new TurndownService({ headingStyle: 'atx', bulletListMarker: '-', codeBlockStyle: 'fenced', emDelimiter: '*' });
td.use(gfm);
td.remove(['script', 'style', 'iframe', 'noscript', 'form']);
td.addRule('figcaption', { filter: 'figcaption', replacement: (c) => (c.trim() ? `\n\n*${c.trim()}*\n\n` : '') });

// Old URL path -> new path, for rewriting internal links between imported posts
const oldToNew = new Map();
for (const it of items) {
  if (text(it['wp:post_type']) !== 'post') continue;
  try {
    const p = new URL(text(it.link)).pathname.replace(/\/?$/, '/');
    const s = slugify(text(it['wp:post_name']) || decode(text(it.title)));
    if (s) oldToNew.set(p, `/blog/${s}/`);
  } catch {}
}
const OLD_HOSTS = new Set(
  [WP_BASE, String(channel.link ?? '')].filter(Boolean).flatMap((u) => {
    try { const h = new URL(u).host; return [h, h.replace(/^www\./, ''), `www.${h.replace(/^www\./, '')}`]; } catch { return []; }
  }),
);
function rewriteLinks(html) {
  return html.replace(/(<a\b[^>]*\shref=["'])([^"']+)(["'])/gi, (all, a, href, b) => {
    try {
      const u = new URL(href, WP_BASE || undefined);
      if (!OLD_HOSTS.has(u.host) || /\/wp-content\//.test(u.pathname)) return all;
      const path = u.pathname.replace(/\/?$/, '/');
      return `${a}${oldToNew.get(path) ?? path}${u.hash}${b}`;
    } catch {
      return all;
    }
  });
}

function cleanHtml(html) {
  return rewriteLinks(String(html))
    .replace(/<!--[\s\S]*?-->/g, '') // Gutenberg block comments
    .replace(/\[caption[^\]]*\]\s*(<img[^>]*>)\s*([\s\S]*?)\[\/caption\]/g, (_, img, cap) => `<p>${img}</p>${cap.trim() ? `<p><em>${cap.trim()}</em></p>` : ''}`)
    .replace(/\[caption[^\]]*\]([\s\S]*?)\[\/caption\]/g, '$1')
    .replace(/\[(\/?)(et_pb_|vc_|fusion_|elementor)[^\]]*\]/g, '') // page-builder shortcodes
    .replace(/\[\/?[a-z_-]+(?:\s[^\]]*)?\]/gi, '') // remaining shortcodes
    .replace(/<h1(\s[^>]*)?>/gi, '<h2>').replace(/<\/h1>/gi, '</h2>') // template renders the H1
    .replace(/\r\n/g, '\n');
}

async function download(url, dest) {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (site migration)' } });
    if (!res.ok) return false;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 200) return false;
    if (!DRY) writeFileSync(dest, buf);
    return true;
  } catch {
    return false;
  }
}
async function downloadAsJpeg(url, dest) {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (site migration)' } });
    if (!res.ok) return false;
    const buf = Buffer.from(await res.arrayBuffer());
    if (DRY) return true;
    await sharp(buf).rotate().flatten({ background: '#ffffff' }).jpeg({ quality: 84, mozjpeg: true }).toFile(dest);
    return true;
  } catch {
    return false;
  }
}
const imgName = (url, used) => {
  let n = slugify(basename(new URL(url, WP_BASE || 'https://x.invalid').pathname, extname(url)).replace(/-\d+x\d+$/, '')) || 'image';
  let ext = extname(new URL(url, WP_BASE || 'https://x.invalid').pathname).toLowerCase();
  if (!['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif'].includes(ext)) ext = '.jpg';
  let out = `${n}${ext}`;
  for (let i = 2; used.has(out); i++) out = `${n}-${i}${ext}`;
  used.add(out);
  return out;
};
const humanAlt = (url) => basename(url, extname(url)).replace(/-\d+x\d+$/, '').replace(/[-_]+/g, ' ').replace(/\d{3,}/g, '').trim() || 'Image';

// ---------- import ----------
const report = { imported: [], skipped: [], autoAlt: 0, generatedImages: [], downloaded: 0, failedDownloads: 0, redirects: 0, shortMeta: [], newCategories: [] };
const redirectLines = [];

for (const it of items) {
  if (text(it['wp:post_type']) !== 'post') continue;
  const status = text(it['wp:status']);
  if (status !== 'publish' && !(flag('--include-drafts') && ['draft', 'pending', 'future'].includes(status))) {
    report.skipped.push(`${text(it.title)} (status: ${status})`);
    continue;
  }
  const m = meta(it);
  const title = noEmDash(decode(text(it.title)), ': ').trim() || 'Untitled';
  const slug = slugify(text(it['wp:post_name']) || title) || `post-${text(it['wp:post_id'])}`;
  const dir = join('src/content/blog', slug);
  if (existsSync(dir) && !flag('--overwrite')) {
    report.skipped.push(`${title} (already exists: ${dir})`);
    continue;
  }

  // Categories + tags
  const cats = (it.category ?? []).filter((c) => c['@_domain'] === 'category');
  const tags = (it.category ?? []).filter((c) => c['@_domain'] === 'post_tag').map((c) => slugify(c['@_nicename'] ?? text(c))).slice(0, 5);
  const primary = cats.find((c) => c['@_nicename'] !== 'uncategorized') ?? cats[0];
  let catId = primary ? slugify(primary['@_nicename'] ?? text(primary)) : categories[0]?.id ?? 'guides';
  if (catId === 'uncategorized') catId = categories[0]?.id ?? 'guides';
  if (!categories.some((c) => c.id === catId)) {
    const name = decode(wpCatNames.get(catId) ?? text(primary)) || catId;
    categories.push({ id: catId, name, description: `Articles about ${name.toLowerCase()}.` });
    report.newCategories.push(catId);
  }

  // Body
  let html = cleanHtml(text(it['content:encoded']));
  const usedNames = new Set(['featured.jpg']);
  const imgJobs = [];
  html = html.replace(/<img\b[^>]*>/gi, (tag) => {
    const src = tag.match(/\ssrc=["']([^"']+)["']/i)?.[1];
    if (!src) return '';
    const full = src.replace(/-\d+x\d+(\.[a-z]+)$/i, '$1'); // prefer original size over WP thumbnail
    let alt = tag.match(/\salt=["']([^"']*)["']/i)?.[1] || attachmentByUrl.get(full) || attachmentByUrl.get(src) || '';
    if (!alt.trim()) { alt = humanAlt(full); report.autoAlt++; }
    if (DOWNLOAD) {
      const name = imgName(full, usedNames);
      imgJobs.push({ url: full, name, fallback: src });
      return `<img src="./${name}" alt="${decode(alt).replace(/"/g, "'")}">`;
    }
    return `<img src="${src}" alt="${decode(alt).replace(/"/g, "'")}">`;
  });
  let body = noEmDash(td.turndown(html)).replace(/\n{3,}/g, '\n\n').trim();

  // Excerpt + meta
  const rawBody = text(it['content:encoded']).replace(/<!--[\s\S]*?-->/g, '');
  const paras = [...rawBody.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)].map((x) => plain(x[1]).replace(/\[[^\]]*\]/g, '').trim()).filter((p) => p.length > 30);
  const firstPara = paras[0] ?? plain(rawBody).replace(/\[[^\]]*\]/g, '').split(/(?<=[.!?])\s/).slice(0, 2).join(' ');
  let excerpt = noEmDash(plain(text(it['excerpt:encoded'])) || firstPara);
  excerpt = clip(excerpt, 280);
  if (excerpt.length < 40) excerpt = clip(`${title}. ${firstPara}`, 280);
  const ctx = { title, excerpt, category: wpCatNames.get(catId) ?? catId };
  let metaTitle = stripBrand(noEmDash(seoVars(m._yoast_wpseo_title || m.rank_math_title || '%%title%%', ctx), ': ')) || title;
  metaTitle = clip(metaTitle, 70);
  if (metaTitle.length < 10) metaTitle = clip(title, 70);
  let metaDescription = noEmDash(seoVars(m._yoast_wpseo_metadesc || m.rank_math_description || '', ctx));
  if (metaDescription.length < 70) metaDescription = firstPara || excerpt;
  metaDescription = clip(metaDescription, 160);
  if (metaDescription.length < 70) {
    metaDescription = clip(`${metaDescription} ${title}. Read the full guide from ${SITE_NAME || WP_SITE_NAME}.`.trim(), 160);
    report.shortMeta.push(slug);
  }
  const focus = (m._yoast_wpseo_focuskw || m.rank_math_focus_keyword || '').split(',')[0].trim();
  const date = text(it['wp:post_date']).slice(0, 10) || new Date().toISOString().slice(0, 10);
  const modified = text(it['wp:post_modified']).slice(0, 10);

  // Write
  if (!DRY) {
    if (existsSync(dir) && flag('--overwrite')) rmSync(dir, { recursive: true });
    mkdirSync(dir, { recursive: true });
  }
  for (const job of imgJobs) {
    const ok = await download(job.url, join(dir, job.name)) || (job.fallback !== job.url && (await download(job.fallback, join(dir, job.name))));
    if (ok) report.downloaded++;
    else {
      report.failedDownloads++;
      body = body.replaceAll(`(./${job.name})`, `(${job.fallback})`); // keep the remote URL
    }
  }

  // Featured image: WP thumbnail, else first downloaded body image, else generated
  const thumb = attachments.get(m._thumbnail_id ?? '');
  let featuredAlt = noEmDash(thumb?.alt || title);
  let haveFeatured = false;
  if (thumb?.url) haveFeatured = await downloadAsJpeg(thumb.url, join(dir, 'featured.jpg'));
  if (haveFeatured) report.downloaded++;
  if (!haveFeatured) {
    if (!DRY) await makeFeaturedImage({ title, out: join(dir, 'featured.jpg'), label: wpCatNames.get(catId) ?? '' });
    report.generatedImages.push(slug);
    featuredAlt = title;
  }

  const q = (s) => JSON.stringify(s);
  const fm = [
    '---',
    `title: ${q(title)}`,
    `metaTitle: ${q(metaTitle)}`,
    `metaDescription: ${q(metaDescription)}`,
    `slug: ${slug}`,
    `publishDate: ${date}`,
    modified && modified > date ? `updatedDate: ${modified}` : null,
    `author: ${AUTHOR}`,
    `category: ${catId}`,
    `tags: [${tags.join(', ')}]`,
    focus ? `focusKeyword: ${q(focus)}` : null,
    `featuredImage: ./featured.jpg`,
    `featuredImageAlt: ${q(featuredAlt.length >= 5 ? featuredAlt : `${featuredAlt} image`)}`,
    `excerpt: ${q(excerpt)}`,
    `draft: ${status === 'publish' ? 'false' : 'true'}`,
    '---',
  ].filter((l) => l !== null);
  if (!DRY) writeFileSync(join(dir, 'index.md'), `${fm.join('\n')}\n\n${body}\n`);

  // Redirect old URL -> new URL
  try {
    const oldPath = new URL(text(it.link)).pathname.replace(/\/?$/, '/');
    const newPath = `/blog/${slug}/`;
    if (oldPath !== newPath && oldPath !== '/') {
      redirectLines.push(`${oldPath}  ${newPath}  301`);
      report.redirects++;
    }
  } catch {}
  report.imported.push(`/blog/${slug}/`);
}

// Category archive redirects (WP /category/x/ -> /blog/category/x/)
for (const c of new Set(items.flatMap((it) => (it.category ?? []).filter((c) => c['@_domain'] === 'category').map((c) => slugify(c['@_nicename'] ?? ''))))) {
  if (c && c !== 'uncategorized' && categories.some((x) => x.id === c)) redirectLines.push(`/category/${c}/  /blog/category/${c}/  301`);
}

if (!DRY) {
  writeFileSync(categoriesPath, JSON.stringify(categories, null, 2) + '\n');
  const existing = existsSync('public/_redirects') ? readFileSync('public/_redirects', 'utf8') : '';
  const fresh = redirectLines.filter((l) => !existing.includes(l.split(/\s+/)[0] + ' '));
  if (fresh.length) appendFileSync('public/_redirects', `\n# Imported from WordPress (${new Date().toISOString().slice(0, 10)})\n${fresh.join('\n')}\n`);
}

// ---------- report ----------
console.log(`\nWordPress import ${DRY ? '(dry run) ' : ''}finished`);
console.log(`  Imported posts:        ${report.imported.length}`);
console.log(`  Skipped:               ${report.skipped.length}`);
console.log(`  Images downloaded:     ${report.downloaded}${DOWNLOAD ? `  (failed, kept remote URL: ${report.failedDownloads})` : '  (run with --images to download)'}`);
console.log(`  Generated featured:    ${report.generatedImages.length}`);
console.log(`  Auto alt text:         ${report.autoAlt}  (from file names: review these)`);
console.log(`  Em dashes replaced:    ${emDashes}`);
console.log(`  Redirects added:       ${redirectLines.length}`);
console.log(`  New categories:        ${report.newCategories.join(', ') || 'none'}`);
if (report.shortMeta.length) console.log(`  Weak meta descriptions (rewrite): ${report.shortMeta.join(', ')}`);
if (report.skipped.length) console.log(`\nSkipped:\n  ${report.skipped.join('\n  ')}`);
if (report.generatedImages.length) console.log(`\nGenerated featured images (replace with real photos when possible):\n  ${report.generatedImages.join('\n  ')}`);
console.log('\nNext: npm run check, then review the posts listed above.');
