# Chew's Meridian · v1.4

A Next.js application with two products: **Market Analyzer** reads market-focused newsletter emails via Gmail, interprets them with Claude, and renders a dynamically assembled digest. **PL Tracker** is a trade journal that fetches live prices, computes realized and unrealized P&L, and generates an AI performance summary on every open.

---

## Getting Started

```bash
npm run dev       # dev server at localhost:3000
npm run build     # production build
npm run lint      # ESLint
node node_modules/typescript/lib/tsc.js --noEmit   # type-check
```

### Environment variables

Create `.env.local`:

```
ANTHROPIC_API_KEY=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REFRESH_TOKEN=
GOOGLE_TOKEN_ISSUED_AT=   # written automatically by scripts/refresh-token.mjs
OWNER_TOKEN=              # 32-byte hex — node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
KV_REST_API_URL=
KV_REST_API_TOKEN=
```

**Vercel note:** `REDIS_URL` is only configured for Production in the Vercel dashboard. Preview and Development environments need it added manually via Project Settings → Environment Variables (use the same Upstash URL as Production so the API spend counter stays consistent across environments).

Gmail OAuth setup: Google Cloud Console → enable Gmail API → create OAuth2 credentials → add `gmail.readonly` scope → store the resulting client ID, secret, and refresh token above.

**Token expiry:** while the app is in Google Cloud *Testing* mode, refresh tokens expire after 7 days. To renew:

1. Run `node scripts/refresh-token.mjs` — opens a browser consent flow and writes the new token directly into `.env.local`.
2. Restart the dev server.

The Settings page shows the current expiry date and warns when it's within 2 days.

See [ARCHITECTURE.md](./ARCHITECTURE.md) for a full breakdown of both products, Redis key schema, auth, and known gaps.

---

## Architecture

### Market Analyzer

```
Gmail API
    ↓
POST /api/agent  (Next.js route)
    ↓
Vercel AI SDK — streamText + tool loop
    ↓
searchEmails → getEmail × N (reads all results, up to 5)
    ↓
Claude synthesizes across all emails → emits JSON block
    ↓
onFinish: saves to Redis (L2) + L1 memory cache
    ↓
React frontend (useChat) → DigestRenderer → component grid
```

**Two-layer cache:** a module-level `Map` in `lib/cache.ts` (L1) sits in front of Redis (L2). On page load, `GET /api/digest` checks L1 then L2 before touching Gmail or the model. A hit at either layer returns the stored `rawText` directly — a typical day costs exactly one Gmail fetch and one inference call regardless of page loads.

Multiple briefings on the same day accumulate ticker mentions — `saveDigest` merges incoming `TickerMentionList` entries rather than overwriting, so the 7-day ticker chart reflects all signals from the day.

**Generative UI:** the model always responds with a single ` ```json ` block:

```json
{
  "mood": "normal|alert|opportunity|danger",
  "components": [
    { "type": "BriefingSummary", "data": { "headline": "...", "body": "..." } },
    { "type": "RiskFlag", "data": { "headline": "...", "detail": "...", "severity": "high" } }
  ]
}
```

`parseComponents` validates with Zod and sorts by risk priority. Adding a new component type: create it in `components/ui/`, register in `ComponentRenderer.tsx`, describe it in `lib/systemPrompt.ts`.

### PL Tracker

```
User adds/edits trade → Redis (permanent, no TTL)
    ↓
GET /api/trades/prices  (price source pending Schwab integration, revalidate: 300s)
    ↓
P&L = (exitPrice ?? markPrice ?? livePrice − entryPrice) × qty × multiplier × direction
    ↓
GET /api/pl/agent  (Haiku summary of monthly realized + open positions)
    ↓
SummaryBar renders monthly P&L, per-position live P&L, AI briefing
```

**Data model:** `Trade` — id, symbol, assetType (stock/option/future), direction (long/short), entryPrice, entryDate, exitPrice (null = open), exitDate (null = open), quantity, multiplier, notes, markPrice. Trades are permanent records — no DELETE endpoint.

**Auth:** `OWNER_TOKEN` gives full access. Guest codes (8 chars, 1hr TTL, 5 uses) give read-only access and are generated from the PL Tracker settings panel. Both products share the same `/login` page and `cm_session` cookie.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js (App Router) |
| AI SDK | Vercel AI SDK (`ai`, `@ai-sdk/anthropic`) |
| Model | `claude-haiku-4-5-20251001` |
| Email | Gmail OAuth2 via `googleapis` |
| Prices | Schwab API (Phase 2 — pending integration) |
| Storage | Upstash Redis (digests, trades, auth) |
| Styling | CSS custom properties design system (no Tailwind utilities in product pages) |
| Validation | Zod |

---

## Market Analyzer Component Library

The model selects from this set based on newsletter content:

| Component | Triggered when |
|---|---|
| `BriefingSummary` | Always — headline + 2-3 sentence synthesis |
| `MacroSummaryCard` | Fed policy, inflation, rate decisions, GDP/jobs |
| `TickerMentionList` | Specific stocks or ETFs called out with context |
| `SectorHeatmap` | Broad sector rotation or performance commentary |
| `EarningsHighlight` | Earnings results, guidance, analyst reactions |
| `RiskFlag` | Geopolitical risk, regulatory action, systemic concern |
| `NewsletterSummary` | General narrative or content that doesn't fit above |

Components are ordered risk-first by the app regardless of model output order: `RiskFlag → MacroSummaryCard → BriefingSummary → EarningsHighlight → TickerMentionList → SectorHeatmap → NewsletterSummary`.

---

## Watchlist

Edit `lib/watchlist.ts` to change the tickers the Market Analyzer agent prioritizes. The watchlist is injected into the system prompt at startup.

To change which newsletter senders are read, edit the `NEWSLETTER_SENDERS` array at the top of `lib/systemPrompt.ts`. Only emails from those addresses are ever fetched.

---

## What's Next

- **Schwab API integration** — wire `SCHWAB_CLIENT_ID` / `SCHWAB_CLIENT_SECRET` / `SCHWAB_REFRESH_TOKEN` to auto-import trades from the brokerage instead of manual entry
- **Historical digest recall** — surface past digests in a timeline view and feed them into model context for cross-time reasoning
- **Richer ticker charts** — direction timeline per ticker, watchlist hit rate, signal strength ranking, sentiment heatmap across the 7-day window
- **Push trigger** — Gmail Pub/Sub webhook instead of manual refresh so the digest updates automatically when a newsletter arrives

---

## Changelog

### v1.4
- **PL summary caching** — Haiku summary cached in Redis keyed by `trades:v` + month; any trade write auto-invalidates, skipping the model on repeated opens
- **Per-product API cost tracking** — `recordUsage` accepts optional `product` param; `GET /api/usage?product=ma|pl` returns per-product spend; both product headers show running cost
- **Post-login redirect** — edge middleware captures the entry URL as `?from=` so logging in from `/pl-tracker` lands on PL Tracker, not Market Analyzer
- **Landing page step popovers** — clicking the step number (01/02/03) in the how-it-works section opens a detail popover with expanded copy
- **Landing page hero alignment** — product title uses `min-height: 2lh` and subtitle uses `flex: 1` so both product panels keep their "Enter App" buttons at a consistent baseline
- **Font consistency** — Geist wired correctly in `globals.css` and `market-analyzer.css`; eliminated circular CSS variable reference that caused serif fallback after client-side navigation

### [v1.3](https://github.com/mehtadome/chews-meridian/pull/15)
- **PL Tracker** — second product at `/pl-tracker` for trade journaling and portfolio performance
- Redis-backed trade CRUD — permanent log of stock/option/future trades with no DELETE by design
- Live P&L — computed with quantity × multiplier × direction multiplier; live price source pending Schwab integration (Phase 2)
- Haiku trading summary — AI-generated briefing of monthly realized gains and open position performance on every open
- Add/Edit/Close Trade panel — Framer Motion slide-in with MM/DD date inputs, per-field year toggle, and exit price reveal
- Auth extended to PL Tracker — shared `/login` page and `cm_session` cookie cover both products; guest codes give read-only access
- Owner-only settings panel in PL Tracker — guest code generation without leaving the tracker
- Landing page updated — hero and how-it-works sections now cover both products

### [v1.2](https://github.com/mehtadome/chews-meridian/pull/14)
- Two-tier authentication — owner token (permanent cookie) and guest codes (1hr or 5 briefing runs, whichever expires first)
- `/login` page — dark-palette form accepting owner token or guest code
- Owner-only guest code generation in settings with copy-to-clipboard and checkmark feedback
- `SessionBadge` component — Owner/Guest pill shown in main page and settings headers
- All API routes gated — unauthenticated requests return 401

### [v1.1](https://github.com/mehtadome/chews-meridian/pull/13)
- Redis mutex replaces per-instance `isRunning` flag — concurrent briefings blocked across all Vercel invocations
- Gmail API calls wrapped in `withRetry` exponential backoff — flaky network calls no longer surface as hard failures
- `BriefingErrorBox` — detailed auto-dismissing error UI replaces generic toast; raw error logged to console
- Route renamed `/app` → `/market-analyzer`
- Chat feature removed
- Rotating quirky loading phrases + spinner skeleton in digest loading state
- UTC/local mismatch fixed in Gmail `after:` date query
- Ticker `count` field added — same-day briefing refreshes now accumulate mentions correctly
- Redis singleton guard fixed — warm Vercel instances correctly reuse the connection
- CSS typo fixed: `justifyContent: "center,"` in settings radio button

### [v1.0](https://github.com/mehtadome/chews-meridian/pull/11)
- OAuth refresh script (`scripts/refresh-token.mjs`) — browser consent flow writes token to `.env.local` and Redis
- Redis-backed token storage — re-authorizing on Vercel requires no redeploy
- Settings page shows OAuth token expiry with warning colors
- Gmail lookback anchored to exact last-digest timestamp (`after:{unixSeconds}`) instead of rounded hours
- Empty-results contract — no new emails returns structured JSON instead of prose
