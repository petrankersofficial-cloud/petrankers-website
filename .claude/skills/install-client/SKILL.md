---
name: install-client
description: Install this content system into an existing client website repo on the client's own GitHub, then port the live design into it, all on a branch with a Netlify deploy preview. Use when the user says add the system to a client site, install the starter on <repo>, set up the blog system for <client>, or gives a client GitHub repo URL to work on. Also use for pulling starter updates into a client site.
---

# Install the content system into a client repo

The live site stays untouched until the user merges the PR.

## 1. Install (from this starter repo)

1. Ask for the client repo (`https://github.com/owner/repo` or `owner/repo`) if not given. Check access: `gh repo view owner/repo`. If it fails, the client must add the user's GitHub account as a collaborator first.
2. Run `npm run install:client -- <owner/repo>`. It clones next to this repo, creates branch `add-content-system`, moves the old site into `_legacy/`, merges the starter, and links remote `starter`.
   - If it stops because the site is Next.js, follow `.nextjs-port.md` (Mode B) instead and tell the user.
   - If it stops because another framework is present, show the user what was found and ask before using `--force`.
3. Do not push yet.

## 2. Port the live design (inside the client clone)

Work in the clone the script printed. Follow HANDOFF.md, "When the design arrives", using the files in `_legacy/`:

1. `npm install`.
2. Tokens and CSS into `src/design/`, header and footer into `src/design/Header.astro` and `Footer.astro`.
3. Each live page into `src/pages/` with the same URL (trailing slash). Copy text verbatim. Images into `public/`.
4. Old `_redirects` lines from `_legacy/` into `public/_redirects`. Any URL that changes gets a 301.
5. Fill `src/site.config.ts` from the live site (name, URL, NAP, nav, CTA). Ask for anything not on the site.
6. Delete the sample entries in `src/content/` and set real `authors.json` and `categories.json`.
7. Compare each new page with the old one in `npm run dev`. Then delete `_legacy/`.
8. `npm run check` must pass with 0 errors.

## 3. Preview and hand over

1. Commit (`Port <client> site into the content system`), then `git push -u origin add-content-system`.
2. Ask before opening the PR. Then `gh pr create --draft`. Netlify posts a deploy preview URL on the PR.
3. Tell the user: preview URL, pages ported, redirects added, anything left unsure. The user merges to go live.

## Later: pull starter updates

Inside a client repo: `npm run starter:update -- --pr`. It merges the latest starter on a new branch, keeps the client's content and design, drops new sample posts, and runs `npm run check`. If it lists files changed on both sides, resolve them by keeping the client's markup and styling and taking the starter's logic, then run `npm run check`.
