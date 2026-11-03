#!/usr/bin/env node
// © 2026 Orrnob Mahmud. All rights reserved. Proprietary, see LICENSE. Build sbs-ebbd6a56dd25
/**
 * PULL STARTER IMPROVEMENTS INTO A CLIENT SITE. Run it inside the client repo:
 *
 *   npm run starter:update [-- --push] [--pr] [--skip-check]
 *
 * What it does (on a new branch, never on main):
 *   1. Fetches the starter and merges its latest version.
 *   2. Client-owned files always keep the client's version: content, design, core pages, logos, redirects, README.
 *   3. New sample posts/pages from the starter are dropped, so they never go live on a client site.
 *   4. Runs `npm install` and `npm run check`. Stops if anything fails.
 *   5. Optional: --push pushes the branch, --pr also opens a PR (Netlify posts a deploy preview).
 * If the starter changed a system file the client also edited (for example a restyled layout),
 * the script stops and lists those files so you or an agent can resolve them.
 */
import { execFileSync, execSync } from 'node:child_process';

const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const DEFAULT_STARTER = 'https://github.com/OrrnobMahmud/static-blog-starter.git';

// Files that belong to the client site. On a conflict the client's version wins.
const CLIENT_OWNED = [
  /^src\/content\//,
  /^src\/design\//,
  /^src\/pages\/(index|about|contact|404)\.astro$/,
  /^public\/(logo\.svg|favicon\.svg|og-default\.jpg|_redirects)$/,
  /^public\/authors\//,
  /^public\/admin\/config\.yml$/,
  /^README\.md$/,
];
const isClientOwned = (f) => CLIENT_OWNED.some((re) => re.test(f));

const git = (a, opts = {}) =>
  execFileSync('git', a, { encoding: 'utf8', stdio: opts.inherit ? 'inherit' : ['ignore', 'pipe', 'pipe'] })?.trim?.() ?? '';
const ok = (fn) => {
  try {
    fn();
    return true;
  } catch {
    return false;
  }
};
const lines = (s) => s.split('\n').map((l) => l.trim()).filter(Boolean);
const fail = (msg) => {
  console.error(`\n✗ ${msg}`);
  process.exit(1);
};

// Guard rails
const origin = ok(() => git(['remote', 'get-url', 'origin'])) ? git(['remote', 'get-url', 'origin']) : '';
if (/static-blog-starter(\.git)?$/.test(origin)) fail('This is the starter repo. Run this inside a client repo.');
if (git(['status', '--porcelain'])) fail('Uncommitted changes. Commit or stash them first.');
if (ok(() => git(['rev-parse', '--verify', 'MERGE_HEAD']))) fail('A merge is already in progress. Finish or abort it first.');

if (!ok(() => git(['remote', 'get-url', 'starter']))) git(['remote', 'add', 'starter', process.env.STARTER_URL || DEFAULT_STARTER]);
console.log('Fetching starter...');
git(['fetch', 'starter', '--quiet']);

if (ok(() => git(['merge-base', '--is-ancestor', 'starter/main', 'HEAD']))) {
  console.log('✓ Already up to date with the starter.');
  process.exit(0);
}

const base = git(['rev-parse', '--abbrev-ref', 'HEAD']);
const date = new Date().toISOString().slice(0, 10);
let branch = `starter-update-${date}`;
for (let i = 2; ok(() => git(['rev-parse', '--verify', `refs/heads/${branch}`])); i++) branch = `starter-update-${date}-${i}`;
git(['checkout', '-q', '-b', branch]);
console.log(`Merging starter into new branch ${branch} (from ${base})`);

const before = new Set(lines(git(['ls-tree', '-r', '--name-only', 'HEAD'])));
ok(() => git(['merge', 'starter/main', '--no-commit', '--no-ff', '--allow-unrelated-histories']));

// Client-owned conflicts: keep the client's version (or keep it deleted)
const kept = [];
for (const f of lines(git(['diff', '--name-only', '--diff-filter=U']))) {
  if (!isClientOwned(f)) continue;
  if (before.has(f)) {
    git(['checkout', '--ours', '--', f]);
    git(['add', '--', f]);
  } else {
    git(['rm', '-q', '-f', '--', f]);
  }
  kept.push(f);
}

// Clean starter edits to client-owned files the client never touched are fine, except new sample content.
const dropped = [];
for (const f of lines(git(['diff', '--cached', '--name-only', '--diff-filter=A', 'HEAD']))) {
  if (/^src\/content\//.test(f) && !before.has(f)) {
    git(['rm', '-q', '-f', '--', f]);
    dropped.push(f);
  }
}

if (kept.length) console.log(`Kept the client's version of ${kept.length} file(s):\n  ${kept.join('\n  ')}`);
if (dropped.length) console.log(`Dropped ${dropped.length} new starter sample file(s):\n  ${dropped.join('\n  ')}`);

const remaining = lines(git(['diff', '--name-only', '--diff-filter=U']));
if (remaining.length) {
  console.error(`\n✗ These system files were changed by both the starter and this site:\n  ${remaining.join('\n  ')}
Resolve them (keep the site's design, take the starter's logic), then run:
  git add <files> && git commit --no-edit && npm install && npm run check
Or undo the whole update: git merge --abort && git checkout ${base} && git branch -D ${branch}`);
  process.exit(1);
}

git(['commit', '-q', '-m', `Update the content system from the starter (${date})`]);
console.log('✓ Merged.');

if (!flag('skip-check')) {
  try {
    execSync('npm install --no-audit --no-fund', { stdio: 'inherit' });
    execSync('npm run check', { stdio: 'inherit' });
  } catch {
    fail(`npm run check failed on branch ${branch}. Fix the errors (nothing was pushed), or go back: git checkout ${base}`);
  }
}

if (flag('push') || flag('pr')) {
  git(['push', '-u', 'origin', branch], { inherit: true });
  if (flag('pr'))
    execFileSync('gh', ['pr', 'create', '--base', base, '--head', branch, '--title', `Starter update ${date}`,
      '--body', 'Pulls the latest content-system improvements from the starter. Client content and design are unchanged. `npm run check` passed.'], { stdio: 'inherit' });
}

console.log(`\nDone. Review branch ${branch}${flag('pr') ? ' in the PR and its deploy preview' : ''}, then merge it into ${base}.`);
