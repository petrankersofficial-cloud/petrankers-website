# Copy-paste prompts for any agent

Works in Claude Code, Claude Desktop (with filesystem/GitHub access to the repo), OpenCode, and Kilo Code. Every tool reads `AGENTS.md` in the repo root; these prompts just point at it.

## Publish one blog post
```
Publish this blog post on this site following AGENTS.md.
Category: <id or "you pick">. Publish date: <today / YYYY-MM-DD>. Push to main.
Content: <paste text, or Google Doc link, or file path>
Images: <attached / in folder X / use Unsplash>
```

## Publish a batch
```
Publish these <N> posts following AGENTS.md. One commit, one push at the end.
Post 1: <content or link>
Post 2: ...
Schedule them <all today / one every Monday starting YYYY-MM-DD>.
```

## Publish a case study
```
Publish this case study following AGENTS.md (case study workflow).
Client: <name or anonymize>. Results: <paste numbers>. Push to main.
Notes: <paste>
```

## Create a service page
```
Create a service page for <service> following AGENTS.md. Here is the copy / notes: <paste>.
Prices: <real prices or "none">. Push to main.
```

## Create location pages in bulk
```
Create location pages following AGENTS.md (location workflow) for <service-slug> in:
- Vernon Hills, IL 60061
- Libertyville, IL 60048
- Mundelein, IL 60060
Local details per city: <paste what you know>. Unique copy per page. One push.
```

## Migrate a WordPress blog
```
Migrate this WordPress export into the site following AGENTS.md (WordPress migration).
File: <path to export.xml>. Download images. Show me the dry-run report first.
```

## Update an existing post
```
Update /blog/<slug>/ following AGENTS.md: <what to change>.
Set updatedDate to today. Keep the slug. Push to main.
```

## Review before publishing
```
Publish this post following AGENTS.md but open a PR on branch content/<slug> instead of pushing to main. Send me the PR link.
```

## Rename or delete
```
Change the slug of /blog/<old>/ to <new> following AGENTS.md (add the 301 redirect and fix internal links).
```
