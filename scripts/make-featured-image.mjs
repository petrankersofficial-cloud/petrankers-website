#!/usr/bin/env node
/**
 * Generate an on-brand featured image (1600x900 JPG) when a post has no photo.
 *   npm run featured-image -- src/content/blog/my-post            # uses the post's title
 *   npm run featured-image -- src/content/blog/my-post --label "Cost Guide"
 *   npm run featured-image -- out/file.jpg --title "Any Title"
 * Writes featured.jpg into the folder (does not overwrite unless --force).
 */
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import matter from 'gray-matter';
import { makeFeaturedImage } from './lib/featured-image.mjs';

const args = process.argv.slice(2);
const val = (n) => (args.includes(n) ? args[args.indexOf(n) + 1] : undefined);
const target = args.find((a) => !a.startsWith('--') && a !== val('--title') && a !== val('--label'));
if (!target) {
  console.error('Usage: npm run featured-image -- <post-folder | out.jpg> [--title "..."] [--label "..."] [--force]');
  process.exit(1);
}

let out = target;
let title = val('--title');
if (existsSync(target) && statSync(target).isDirectory()) {
  out = join(target, 'featured.jpg');
  const md = ['index.md', 'index.mdx'].map((f) => join(target, f)).find(existsSync);
  if (md && !title) title = matter(readFileSync(md, 'utf8')).data.title;
}
if (!title) {
  console.error('No title found. Pass --title "..."');
  process.exit(1);
}
if (existsSync(out) && !args.includes('--force')) {
  console.error(`${out} already exists (use --force to overwrite)`);
  process.exit(1);
}
await makeFeaturedImage({ title, out, label: val('--label') ?? '' });
console.log(`Created ${out}`);
