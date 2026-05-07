# Todo

---

## Market Analyzer

### Features

- **Webhook ingestion endpoint** — add `POST /api/webhook` to accept pushed newsletter payloads (e.g. from a Gmail push subscription or a mail relay), so the digest triggers server-side without the user clicking "Get briefing."

- **Loading UI with React Suspense** — add route-level `loading.tsx` so page transitions show a skeleton instead of a blank shell while the digest loads.

- **Next.js revalidation + caching** — explore `unstable_cache` or `fetch` with `next: { revalidate }` for the digest and ticker endpoints so Vercel can serve cached responses without always hitting Redis.

- **Copy card to clipboard** — add a copy button to each digest card that writes a clean plain-text or markdown summary to the clipboard, making it easy to share a specific signal (e.g. a `RiskFlag` or `EarningsHighlight`) directly.

- **Favorite digest cards** — allow users to star individual cards (e.g. a `RiskFlag` or `EarningsHighlight`) and persist favorites across refreshes. Likely stored in Redis keyed by user session or a stable card ID derived from content hash. Favorited cards could be pinned to the top of the digest or surfaced in a separate view.

### Polish

- **Ticker standardization in prose** — tickers (e.g. AAPL, TSLA) appear as plain text in `BriefingSummary`, `RiskFlag`, `MacroSummaryCard`, and `NewsletterSummary` body fields. Structured tickers in `TickerMentionList` are already badged via `DigestTickerBadge`. Standardizing prose requires: (1) a detection strategy — regex is noisy (hits GDP, ETF, etc.), cross-referencing the digest's `TickerMentionList` is most accurate; (2) threading the ticker+direction map down through `DigestRenderer` → card components → `renderBold` or introducing a React context to avoid prop drilling.

- **Settings navigation clears digest** — navigating to `/settings` and back remounts the page, resetting React state. The `/api/digest` fallback on remount should restore content from Redis, but this has never been verified in prod.

### At Scale

- **Replace `cancelled` flag with `AbortController`** — `useFetchOnMount` uses a boolean flag to discard stale results, but the request still completes mid-flight. `AbortController` actually cancels the network request, which matters if responses are large or the user navigates frequently.

- **`KEYS` in `listDigests` is a blocking scan** — `redis.keys("digest:*")` in `lib/digest.ts` blocks the Redis server while scanning. Fine for a personal tool with <100 keys, but at scale replace with `SCAN` which iterates in batches without blocking. See `architecture.md` for why this is non-trivial.

- **Redis key namespacing across deployments** — all Vercel deployments (production, preview branches) share the same Redis instance and key namespace. At scale or with multiple environments, prefix keys by environment (e.g. `prod:digest:2026-04-22`, `dev:guest:abc123`) to avoid cross-deployment data bleed.


---

## PL Tracker

### Phase 1 — Manual UI (current)
- Build trade entry UI — symbol, asset type (stock/option/future), direction (long/short), entry price, entry date, quantity, exit price, exit date (null if open), notes
- Open and closed positions views
- Per-trade P&L, days held, days to profitability, max profit reached (manually entered for now)
- Summary totals — overall P&L, win rate, avg days to profit
- Framer Motion animations, separate visual language from Market Analyzer

### Phase 2 — Schwab Integration (future)
- Schwab Developer API (new post-2024 API, NOT the old TD Ameritrade one — old middleware is dead)
- User is already approved with Client ID + Client Secret at developer.schwab.com
- OAuth2 flow — same refresh token pattern as Gmail in this project
- Auto-import trades from order history
- Real-time mark price on open positions
- Price history for auto-calculating days-to-profitability
- Credentials: add `SCHWAB_CLIENT_ID`, `SCHWAB_CLIENT_SECRET`, `SCHWAB_REFRESH_TOKEN` to `.env.local` and Vercel when ready

