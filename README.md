# Market Analyzer · v1.0

A Next.js application that reads market-focused newsletter emails from Gmail, interprets their content using Claude, and renders a dynamically assembled digest UI. Instead of a static layout, the page builds itself based on what's actually in the news that day — Fed commentary gets different treatment than an earnings beat or a geopolitical risk flag.

## Changelog

### [v1.0](https://github.com/mehtadome/market-analyzer/pull/11)
- OAuth refresh script (`scripts/refresh-token.mjs`) — browser consent flow writes token to `.env.local` and Redis
- Redis-backed token storage — re-authorizing on Vercel requires no redeploy
- Settings page shows OAuth token expiry with warning colors
- Gmail lookback anchored to exact last-digest timestamp (`after:{unixSeconds}`) instead of rounded hours
- Empty-results contract — no new emails returns structured JSON instead of prose

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
```

Gmail OAuth setup: Google Cloud Console → enable Gmail API → create OAuth2 credentials → add `gmail.readonly` scope → store the resulting client ID, secret, and refresh token above.

**Token expiry:** while the app is in Google Cloud *Testing* mode, refresh tokens expire after 7 days. To renew:

1. Run `node scripts/refresh-token.mjs` — opens a browser consent flow and writes the new token directly into `.env.local`.
2. Restart the dev server.

The Settings page shows the current expiry date and warns when it's within 2 days.

---

## Architecture

```
Gmail API
    ↓
GET /api/agent  (Next.js route)
    ↓
Vercel AI SDK — streamText + tool loop
    ↓
searchEmails → getEmail × N (reads all results, up to 5)
    ↓
Claude synthesizes across all emails → emits JSON block
    ↓
onFinish: saves to digests/YYYY-MM-DD.json + L1 memory cache
    ↓
React frontend (useChat) → DigestRenderer → component grid
```

### Two-layer cache

A module-level `Map` in `lib/cache.ts` (L1) sits in front of the filesystem (L2). On page load, `GET /api/digest` checks L1 then L2 before touching Gmail or the model. A hit at either layer returns the stored `rawText` directly — a typical day costs exactly one Gmail fetch and one inference call regardless of page loads.

The cache is intentionally bypassed during two PT windows when newsletters are observed to arrive:
- **2:00am – 7:00am PT** — pre-market / overnight editions
- **1:00pm – 4:00pm PT** — midday / afternoon editions

During these windows L1 is skipped so the next briefing pulls fresh from Gmail. L2 is still served if a prior briefing exists that day, so new tabs always have something to show.

Multiple briefings on the same day **accumulate** ticker mentions — `saveDigest` merges incoming `TickerMentionList` entries with any existing ones rather than overwriting, so the 7-day ticker chart reflects all signals from the day.

### Generative UI

The model always responds with a single ` ```json ` block — no prose outside it:

```json
{
  "mood": "normal|alert|opportunity|danger",
  "components": [
    { "type": "BriefingSummary", "data": { "headline": "...", "body": "..." } },
    { "type": "RiskFlag", "data": { "headline": "...", "detail": "...", "severity": "high" } }
  ]
}
```

`parseComponents` validates this with Zod schemas (one per component type) and sorts by risk priority before rendering. `ComponentRenderer` maps each `type` to its React component via a switch. Adding a new component type requires: create the component in `components/ui/`, register it in the switch, describe it in `lib/systemPrompt.ts`.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js (App Router) |
| AI SDK | Vercel AI SDK (`ai`, `@ai-sdk/anthropic`) |
| Model | `claude-haiku-4-5-20251001` |
| Email | Gmail OAuth2 via `googleapis` |
| Styling | CSS custom properties design system (no Tailwind utilities) |
| Validation | Zod |

---

## Component Library

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

Edit `lib/watchlist.ts` to change the tickers the agent prioritizes. The watchlist is injected into the system prompt at startup — the model flags relevant tickers and gives them priority placement.

To change which newsletter senders are read, edit the `NEWSLETTER_SENDERS` array at the top of `lib/systemPrompt.ts`. Only emails from those addresses are ever fetched.

---

## What's Next

- **Historical digest recall** — surface past `digests/YYYY-MM-DD.json` files in a timeline view and feed them into model context for cross-time reasoning ("inflation narrative has shifted hawkish over the last 3 newsletters")
- **Richer ticker charts** — direction timeline per ticker, watchlist hit rate, signal strength ranking, sentiment heatmap across the 7-day window
- **Push trigger** — Gmail Pub/Sub webhook instead of manual refresh so the digest updates automatically when a newsletter arrives
- **Portfolio context** — connect a brokerage API so the model contextualizes news against actual holdings
