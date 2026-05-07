# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

## Commands

```bash
npm run dev        # start dev server at localhost:3000
npm run build      # production build
npm run lint       # ESLint
node node_modules/typescript/lib/tsc.js --noEmit   # type-check (npx tsc --noEmit also works)
```

No test suite exists. Type-check before declaring work done.

## Route structure

Routes are split into two Next.js route groups with separate layouts and stylesheets:

- `app/(landing)/` → `/` (landing) and `/about` — uses `app/landing.css`, no ThemeProvider
- `app/(product)/` → `/market-analyzer` (product) and `/settings` — uses `app/globals.css`, wrapped in ThemeProvider
- `app/api/` → all API routes, untouched

The project is named **Chew's Meridian**. The product inside it is **Market Analyzer** (shown at `/market-analyzer`).

## Architecture

### Request flow

1. User visits `/app` and clicks "Get today's briefing" → `sendMessage({ text: "What's in today's newsletter?" })`
2. `POST /api/agent` streams via Vercel AI SDK (`streamText` with `claude-haiku-4-5`)
3. Agent calls `searchEmails` then `getEmail` (Gmail OAuth via `lib/gmail.ts`) — max 10 tool steps
4. `onFinish` parses the completed text → saves to Redis (L2) and L1 memory cache
5. `app/(product)/app/page.tsx` renders the raw text through `DigestRenderer` → `DigestLayout` → individual card components

On subsequent page loads, `GET /api/digest` checks L1 (`lib/cache.ts` module-level `Map`) then L2 (Redis) and returns `rawText` without touching Gmail or the model. Cache auto-evicts non-today entries on write.

### Manual refresh behavior

The refresh button clears client state (`cachedContent`, `messages`). When the agent stream completes:
- **New emails found** → streams new components, merges ticker mentions with today's existing digest via `saveDigest`, updates L1 cache
- **No new emails** → stream completes empty → client detects `agentText === ""` with `messages.length > 0` → re-fetches `/api/digest` to restore the existing cached digest

### Generative UI

The model always responds with a single `\`\`\`json` block — no prose outside it. The block has this shape:

```json
{ "mood": "normal|alert|opportunity|danger", "components": [{ "type": "...", "data": {...} }] }
```

`lib/parseResponse.ts` extracts this block. `ComponentRenderer.tsx` maps each `type` to its React component via a `switch`. `DigestLayout` handles the grid arrangement (tickers + sectors paired side-by-side, earnings in a 3-col grid, everything else full-width).

**To add a new component type:** create the component in `components/ui/`, register it in the `renderComponent` switch in `ComponentRenderer.tsx`, and describe it with its data shape in `lib/systemPrompt.ts`.

### Ticker history

`GET /api/tickers` scans the last 7 days of digest files, aggregates `TickerMentionList` entries by symbol, and returns mention counts + most-recent direction. The `TickerMentionChart` (Recharts bar chart) and ticker chips in the drawer both read from this endpoint.

### Watchlist

Edit `lib/watchlist.ts` to change the watchlist. It's injected directly into the system prompt at startup — the model uses it to flag relevant tickers and prioritize placement.

## Styling

Two separate stylesheets — do not mix them:

**Product** (`app/globals.css`) — imported via root layout, applies everywhere as the base:
- Use CSS custom properties (`--text`, `--text-heading`, `--text-muted`, `--btn-bg`, `--btn-bg-hover`, `--border`)
- Use semantic classes: `.card`, `.card__header`, `.card__body`, `.card__footer`, `.btn`, `.tab`, `.tab--active`, `.shell__header`, `.shell__main`, `.ds-title`, `.ds-prose`, `.ds-meta`
- **Do not use Tailwind color/spacing utilities** in product pages
- Dark mode via ThemeProvider toggling `.dark` class on `<html>`

**Landing** (`app/landing.css`) — imported only in `app/(landing)/layout.tsx`:
- Free to use inline styles, gradients, Framer Motion, arbitrary values
- Palette: `#0a0a0a` bg, `#ffffff` text, `#22c55e` accent green, `#888888` muted
- Universal micro-transition rule lives here (`transform` excluded — Framer Motion owns that)

## Key files

| Path | Purpose |
|------|---------|
| `app/(landing)/page.tsx` | Landing page (`/`) — Chew's Meridian hero, how-it-works, tech stack |
| `app/(landing)/about/page.tsx` | About page (`/about`) — project + bio (content is placeholder, needs writing) |
| `app/(product)/market-analyzer/page.tsx` | Product page (`/market-analyzer`) — main digest UI |
| `app/(product)/settings/page.tsx` | Settings page (`/settings`) |
| `app/landing.css` | Marketing stylesheet — Framer Motion animations, dark palette |
| `lib/systemPrompt.ts` | Full agent instructions + component schema sent to the model |
| `lib/watchlist.ts` | Tickers the agent prioritizes |
| `lib/digest.ts` | Read/write digest records in Redis (L2 cache) |
| `lib/cache.ts` | Module-level L1 cache (memory, process lifetime) |
| `lib/gmail.ts` | Gmail OAuth + `searchEmails`/`getEmail` |
| `lib/usage.ts` | Append-only token/cost log in `usage.json` |
| `components/ComponentRenderer.tsx` | Parses JSON block → renders component grid |
| `app/api/agent/route.ts` | Streaming LLM endpoint |
| `app/api/digest/route.ts` | Cache-first digest retrieval |
| `app/api/tickers/route.ts` | 7-day ticker aggregation |

## Environment variables

Required in `.env.local`:
- `ANTHROPIC_API_KEY`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN` (Gmail OAuth)
- `OWNER_TOKEN` (auth — 32-byte hex, generate with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
- `SCHWAB_CLIENT_ID`, `SCHWAB_CLIENT_SECRET`, `SCHWAB_REFRESH_TOKEN` (PL Tracker — not yet wired in)

## Resume here (next session)

Current branch: `pl-tracker` — building PL Tracker as a new product.

**Plan:**
- Phase 1: Manual trade entry UI — Framer Motion, separate visual language from Market Analyzer
- Phase 2: Schwab API integration (user already approved at developer.schwab.com, has Client ID + Secret)
- The old TD Ameritrade API / Python middleware is dead — Schwab migrated to a new API in 2024
- Build UI and Redis data layer first, wire Schwab OAuth in a dedicated later session

**Trade data model:** symbol, asset type (stock/option/future), direction (long/short), entry price + date, exit price + date (null if open), quantity, notes. Manual fields: mark price, days to profitability, max profit reached.
