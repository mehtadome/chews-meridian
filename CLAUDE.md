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

Routes are split into three Next.js route groups with separate layouts and stylesheets:

- `app/(landing)/` → `/` (landing) and `/about` — uses `app/landing.css`, no ThemeProvider
- `app/(product)/` → `/market-analyzer` and `/settings` — uses `app/market-analyzer.css`, auth-gated
- `app/(pl)/` → `/pl-tracker` — uses `app/pl.css`, auth-gated, fully isolated from Market Analyzer styles
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

**Product** (`app/market-analyzer.css`) — imported in `app/(product)/layout.tsx`:
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
| `app/(landing)/page.tsx` | Landing page (`/`) — Chew's Meridian hero, how-it-works, tech stack for both products |
| `app/(landing)/about/page.tsx` | About page (`/about`) — placeholder, needs writing |
| `app/(product)/market-analyzer/page.tsx` | Market Analyzer digest UI |
| `app/(product)/settings/page.tsx` | Settings page |
| `app/(pl)/layout.tsx` | PL Tracker layout — auth gate + `pl.css` import |
| `app/(pl)/pl-tracker/page.tsx` | PL Tracker server page — fetches trades + prices |
| `app/landing.css` | Marketing stylesheet — Framer Motion, dark palette |
| `app/pl.css` | PL Tracker design system — standalone dark theme |
| `app/login/page.tsx` | Shared login page — reads `?from=` param to redirect after auth |
| `app/api/auth/route.ts` | POST — validates credential, sets `cm_session` cookie |
| `app/api/auth/generate/route.ts` | POST owner-only — creates guest code in Redis |
| `lib/auth.ts` | `getSession`, `withAuth` — owner token + guest code validation |
| `lib/trade-types.ts` | Trade interface, Zod schemas (TradeCreateSchema, TradeUpdateSchema) |
| `lib/trades.ts` | Redis CRUD: getTrade, listTrades, saveTrade (nanoid), updateTrade |
| `lib/market-data.ts` | `fetchCurrentPrices` — stub returning `{}`; wires to Schwab in Phase 2 |
| `lib/systemPrompt.ts` | Market Analyzer agent instructions + component schema |
| `lib/watchlist.ts` | Tickers the Market Analyzer agent prioritizes |
| `lib/digest.ts` | Read/write digest records in Redis (L2 cache) |
| `lib/cache.ts` | Module-level L1 cache (memory, process lifetime) |
| `lib/gmail.ts` | Gmail OAuth + `searchEmails`/`getEmail` |
| `components/ComponentRenderer.tsx` | Parses JSON block → renders Market Analyzer component grid |
| `app/api/agent/route.ts` | Market Analyzer streaming LLM endpoint |
| `app/api/pl/agent/route.ts` | PL Tracker Haiku summary endpoint |
| `app/api/trades/route.ts` | GET list / POST create trade |
| `app/api/trades/[id]/route.ts` | GET single / PATCH update trade (no DELETE) |
| `app/api/trades/prices/route.ts` | GET live prices from Yahoo Finance |

## Environment variables

Required in `.env.local`:
- `ANTHROPIC_API_KEY`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN` (Gmail OAuth)
- `OWNER_TOKEN` (auth — 32-byte hex, generate with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
- `SCHWAB_CLIENT_ID`, `SCHWAB_CLIENT_SECRET`, `SCHWAB_REFRESH_TOKEN` (PL Tracker — not yet wired in)

## PL Tracker — architecture

PL Tracker is a second product at `/pl-tracker`, isolated from Market Analyzer. It has its own route group, stylesheet, and auth scope.

### Route group: `app/(pl)/`
- Layout: `app/(pl)/layout.tsx` — auth gate (redirects to `/login?from=/pl-tracker`), imports `app/pl.css`, wraps in `<div className="pl-shell">`. Fully isolated from `(product)` layout and `market-analyzer.css`. No ThemeProvider.
- Page: `app/(pl)/pl-tracker/page.tsx` — server component, fetches trades + live prices + passes `isOwner` to `PlTrackerClient`.

### Stylesheet: `app/pl.css`
Self-contained dark design system. **Never import market-analyzer.css or globals.css here.** Key tokens: `--pl-bg:#0d0d0d`, `--pl-green:#22c55e`, `--pl-red:#ef4444`. Key classes: `.pl-shell`, `.pl-shell__header`, `.pl-table`, `.pl-row--profit/loss`, `.pl-badge--profit/loss`, `.pl-panel`, `.pl-btn--primary`, `.pl-field`, `.pl-field-row`, `.pl-input`, `.pl-select`.

### Data model (`lib/trade-types.ts`)
`Trade`: id, symbol, assetType (stock/option/future), direction (long/short), entryPrice, entryDate (YYYY-MM-DD), exitPrice (null if open), exitDate (null if open), quantity, multiplier, notes, markPrice. A null `exitDate` means the trade is open/unrealized.

### Redis (`lib/trades.ts`)
Keys: `trade:<id>` (JSON), index: `trades:index` (LPUSH list of ids). No TTL on trades — permanent record. `saveTrade` uses `nanoid(10)`. `updateTrade` does GET→merge→SET.

### P&L formula
`(exitPrice ?? currentPrice ?? markPrice - entryPrice) × quantity × multiplier × (long ? 1 : -1)`

### monthStart comparisons
Always use date-only strings: `` `${year}-${mm}-01` `` — never `.toISOString()` which produces a datetime string that sorts incorrectly against plain date strings.

### Components (`components/pl/`)
| File | Purpose |
|------|---------|
| `PlTrackerClient.tsx` | "use client" shell — tabs, panel state, Haiku summary fetch on mount, refresh after save |
| `SummaryBar.tsx` | Monthly realized gains + per-open-position live P&L + Haiku summary text |
| `TradeTable.tsx` | Unified table for open and closed tabs |
| `TradeRow.tsx` | Symbol, P&L, Qty, Entry price, Exit price, Direction, Date range + days, Type. Action column owner-only. |
| `PnlBadge.tsx` | `Intl.NumberFormat` with `signDisplay:"always"`, variants: profit/loss/neutral |
| `AddTradePanel.tsx` | Framer Motion slide-in panel (spring). PanelMode discriminated union: closed/add/edit/close. Resets form via `resetKey` passed as `key` to TradeFormFields on each open. |
| `TradeFormFields.tsx` | Form fields. Date inputs use MM/DD text + year toggle button (2024/2025/2026). Auto-formats digits → MM/DD. Year button and "+ Include exit price" toggle are inline in the same flex row. |
| `PlSettingsPanel.tsx` | Owner-only settings slide-in. Calls `POST /api/auth/generate` to create guest codes (8-char, 1hr TTL, 5 uses). Shows code with copy button. |

### API routes
- `GET/POST /api/trades` — list all / create new (TradeCreateSchema)
- `GET/PATCH /api/trades/[id]` — single trade / update (TradeUpdateSchema). No DELETE — trades are permanent.
- `GET /api/trades/prices?symbols=X,Y` — price lookup stub, `revalidate: 300`; wires to Schwab in Phase 2
- `GET /api/pl/agent` — Haiku summary: monthly realized gains + open position P&L with live prices
- `POST /api/auth/generate` — owner-only, creates guest code in Redis

### Auth (`lib/auth.ts`)
- `OWNER_TOKEN` env var = full access
- Guest codes stored as `guest:<code>` JSON `{ expiresAt, usesLeft }` in Redis with 1hr TTL
- `cm_session` cookie holds either the owner token or `guest:<code>`
- Both product layouts redirect to `/login?from=<destination>` when unauthenticated
- Login page reads `?from` param and redirects there after success

### Guest codes
Guests get read-only access to the owner's trades. No multi-user support planned. Guest code generation is in the PL Tracker settings panel (cog icon, owner-only).

## Resume here (next session)

**Current branch: `critique-3`** — working through `docs/critique.md` issue by issue.

**Workflow:** describe fix → discuss → write → discuss → user says commit → mark done in critique.md → next issue.

**Completed on critique-3:**
- #1 — Open redirect sanitized in `app/login/page.tsx`
- #2 — Guest use count: atomic Lua decrement at request start (`lib/auth.ts`, `app/api/agent/route.ts`)
- #3 — OWNER_TOKEN replaced with opaque session ID (`lib/auth.ts` `createOwnerSession`, `app/api/auth/route.ts`). Existing owner session cookie invalidated on next deploy — re-login required.

**Also fixed in PR #17 (hotfix, merged to main):**
- React crash on trade save failure (Zod object rendered as JSX)
- Calendar date picker replacing MM/DD text input (`components/pl/DatePicker.tsx`)
- Per-field validation highlighting, quantity default, entryPrice zero bug, date UTC shift

**Next: issue #4** — `listTrades` crashes on malformed trade JSON (`lib/trades.ts:24`)

**Phase 2 (not started):** Schwab API integration. User has Client ID + Secret at developer.schwab.com. Old TD Ameritrade API is dead — Schwab migrated in 2024. Wire OAuth in a dedicated session.
