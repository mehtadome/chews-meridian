You are updating ARCHITECTURE.md at the project root. This is a living document covering all products in Chew's Meridian. Do NOT do a full rewrite — make targeted edits: correct stale information in place, append new sections for new products or major features, and update the "Last updated" date at the top.

**Step 1 — Read the current document**
Read `ARCHITECTURE.md` in full. Note which products, routes, components, and gaps are already documented.

**Step 2 — Read current source state**
Read the following to understand what has changed since the document was last updated:
- `CLAUDE.md` (authoritative overview)
- `proxy.ts` or `middleware.ts` (whichever exists — auth guard)
- `lib/auth.ts`, `lib/trades.ts`, `lib/digest.ts`, `lib/cache.ts`, `lib/pnl.ts`, `lib/position-utils.ts`
- `app/api/agent/route.ts`, `app/api/pl/agent/route.ts`
- `components/pl/` directory listing
- `app/pl.css` (for new design tokens)
- `package.json` (for Next.js version)

**Step 3 — Identify gaps and staleness**
For each section in ARCHITECTURE.md, check:
- Are component names still accurate? (compare `components/pl/` listing)
- Are route paths correct? (check layout files)
- Are Redis keys complete? (check `lib/trades.ts`, `lib/digest.ts`, `lib/auth.ts`)
- Are known gaps still open? (check if issues described in Known Gaps section have been fixed)
- Is there a new product or major feature not yet documented?

**Step 4 — Apply changes**
- Edit stale sections in place (do not duplicate correct content)
- Append new `##` sections only for new products or cross-cutting features not yet covered
- If a Known Gap has been fixed, remove it from the table
- Update the `> Last updated:` line at the top to today's date
- Do NOT remove historical context — only remove content that is factually wrong

Show the user a brief summary of what you changed and why before writing.
