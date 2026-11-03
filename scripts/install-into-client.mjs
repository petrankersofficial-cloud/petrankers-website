#!/usr/bin/env node
// © 2026 Orrnob Mahmud. All rights reserved. Proprietary, see LICENSE. Build sbs-ebbd6a56dd25
/**
 * INSTALL THIS STARTER INTO AN EXISTING CLIENT REPO (the client's own GitHub).
 * Run it from the starter repo:
 *
 *   npm run install:client -- <client-repo> [--dir ../folder] [--branch add-content-system] [--push] [--pr] [--force]
 *
 *   <client-repo>  https://github.com/owner/repo, owner/repo, or a local path to a clone
 *   --dir          where to clone (default: next to this repo, named after the client repo)
 *   --branch       branch name (default: add-content-system)
 *   --push         push the branch to the client's GitHub
 *   --pr           push + open a draft PR (Netlify then posts a deploy preview URL)
 *   --force        install even when the client repo already uses another framework
 *
 * What it does (the live site is untouched until the PR is merged):
 *   1. Clones the client repo (or uses the local clone) and checks it is clean.
 *   2. Creates the branch and moves every current file into _legacy/ (history kept, nothing deleted).
 *   3. Merges the starter. No conflicts, because the old files are out of the way.
 *   4. Links the starter as remote "starter", so `npm run starter:update` can pull improvements later.
 * Next step: port the pages in _legacy/ into the system (HANDOFF.md "When the design arrives"), then delete _legacy/.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, mkdirSync } from 'node:fs';
import { resolve, basename, join } from 'node:path';

const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const opt = (name, d) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : d;
};
const optValues = new Set(['--dir', '--branch'].flatMap((o) => (args.includes(o) ? [args[args.indexOf(o) + 1]] : [])));
const target = args.find((a) => !a.startsWith('--') && !optValues.has(a));

if (!target) {
  console.error('Usage: npm run install:client -- <client-repo-url | owner/repo | local-path> [--push] [--pr]');
  process.exit(1);
}

const run = (cmd, a, cwd, opts = {}) =>
  execFileSync(cmd, a, { cwd, encoding: 'utf8', stdio: opts.inherit ? 'inherit' : ['ignore', 'pipe', 'pipe'] })?.trim?.() ?? '';
const git = (a, cwd, opts) => run('git', a, cwd, opts);
const ok = (fn) => {
  try {
    fn();
    return true;
  } catch {
    return false;
  }
};
const fail = (msg) => {
  console.error(`\n✗ ${msg}`);
  process.exit(1);
};

const starterRoot = process.cwd();
const STARTER_URL = process.env.STARTER_URL || git(['remote', 'get-url', 'origin'], starterRoot);
const branch = opt('branch', 'add-content-system');
const wantPr = flag('pr');
const wantPush = flag('push') || wantPr;

// 1. Get the client repo
let dir;
if (existsSync(target) && existsSync(join(target, '.git'))) {
  dir = resolve(target);
  console.log(`Using local clone: ${dir}`);
} else {
  const url = /^[\w.-]+\/[\w.-]+$/.test(target) ? `https://github.com/${target}.git` : target;
  dir = resolve(opt('dir', join('..', basename(url).replace(/\.git$/, ''))));
  if (existsSync(dir) && readdirSync(dir).length) fail(`${dir} already exists and is not empty. Pass --dir or the local path.`);
  console.log(`Cloning ${url} -> ${dir}`);
  git(['clone', url, dir], starterRoot, { inherit: true });
}
if (resolve(dir) === resolve(starterRoot)) fail('That is the starter repo itself. Point at a client repo.');
if (git(['status', '--porcelain'], dir)) fail('The client repo has uncommitted changes. Commit or stash them first.');

const hasCommits = ok(() => git(['rev-parse', '--verify', 'HEAD'], dir));
if (!hasCommits && git(['branch', '-r'], dir))
  fail('The clone has no checked-out branch but the remote has branches. Check out the live branch (git checkout main) and rerun with the local path.');
const inHead = (p) => hasCommits && ok(() => git(['cat-file', '-e', `HEAD:${p}`], dir));

if (inHead('src/content.config.ts') && inHead('scripts/lint-content.mjs'))
  fail('The content system is already installed here. Run `npm run starter:update` inside that repo instead.');

if (inHead('package.json') && !flag('force')) {
  const pkg = JSON.parse(git(['show', 'HEAD:package.json'], dir));
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  if (deps.next) fail('This client site is Next.js. Use the Next.js port plan (.nextjs-port.md, Mode B) instead, or pass --force.');
  if (!deps.astro) fail('This client repo already has a package.json for another framework. Check it by hand, or pass --force.');
}
if (ok(() => git(['rev-parse', '--verify', `refs/heads/${branch}`], dir))) fail(`Branch ${branch} already exists in the client repo.`);

// 2. Link the starter
if (ok(() => git(['remote', 'get-url', 'starter'], dir))) git(['remote', 'set-url', 'starter', STARTER_URL], dir);
else git(['remote', 'add', 'starter', STARTER_URL], dir);
console.log(`Fetching starter (${STARTER_URL})`);
git(['fetch', 'starter', '--quiet'], dir);

if (!hasCommits) {
  // Empty client repo: the branch simply starts from the starter.
  git(['checkout', '-B', branch, 'starter/main'], dir);
} else {
  git(['checkout', '-b', branch], dir);

  // 3. Move the current site into _legacy/
  const entries = git(['ls-tree', '--name-only', 'HEAD'], dir).split('\n').filter((e) => e && e !== '_legacy');
  mkdirSync(join(dir, '_legacy'), { recursive: true });
  for (const e of entries) git(['mv', e, `_legacy/${e}`], dir);
  git(['commit', '-q', '-m', 'Move the current site into _legacy/ before installing the content system'], dir);
  console.log(`Moved ${entries.length} top-level item(s) into _legacy/`);

  // 4. Merge the starter
  git(['merge', 'starter/main', '--allow-unrelated-histories', '--no-edit', '-q', '-m', 'Install the content system from the starter'], dir);
}
console.log(`✓ Content system installed on branch ${branch}`);

// 5. Optional push + draft PR
if (wantPush) {
  git(['push', '-u', 'origin', branch], dir, { inherit: true });
  if (wantPr) {
    const body = [
      'Installs the static content system (blog, case studies, services, locations, SEO, QA).',
      '',
      'The previous site files are in `_legacy/`. They still need porting into `src/pages/` and `src/design/` before merging.',
      'The live site does not change until this PR is merged. Check the Netlify deploy preview first.',
    ].join('\n');
    run('gh', ['pr', 'create', '--draft', '--head', branch, '--title', 'Install the content system', '--body', body], dir, { inherit: true });
  }
}

console.log(`
Next steps (in ${dir}):
  1. npm install
  2. Port the design: follow HANDOFF.md "When the design arrives" using the files in _legacy/
     (tokens + CSS into src/design/, header/footer, each page into src/pages/, old URLs into public/_redirects).
  3. Fill src/site.config.ts, delete the sample entries in src/content/, then delete _legacy/.
  4. npm run check  (0 errors)${wantPush ? '' : '\n  5. git push -u origin ' + branch + '  and open a PR to get the Netlify deploy preview'}
Later: run \`npm run starter:update\` in that repo to pull starter improvements.
`);
