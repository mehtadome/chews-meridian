# PL Tracker — Todos

---

## Phase 1 — Summary Cache + API Cost Display (current)

**Build order:**
1. `lib/trades.ts` — add `bumpTradesVersion()` (`redis.incr("trades:v")`), call in `saveTrade` and `updateTrade`
2. `lib/cost.ts` (new) — Haiku pricing constants, `addCost(product, inputTokens, outputTokens)` via `redis.incrbyfloat`, `getCost(product)`
3. `app/api/pl/agent/route.ts` — check `pl:summary:cache` against `trades:v` + current month before calling model; call `addCost("pl", ...)` after generation; write cache on miss
4. `app/api/cost/route.ts` (new) — `GET ?product=pl|ma` reads `cost:{product}` from Redis, returns `{ total: number }`
5. `components/pl/PlTrackerClient.tsx` — fetch `/api/cost?product=pl` on mount, render cost label left of `<SessionBadge />`
6. Market Analyzer — call `addCost("ma", ...)` in `onFinish` of `/api/agent/route.ts`; fetch and display cost in Market Analyzer header

## Route Group Consolidation (future, when Market Analyzer adopts dark style)

- Collapse `(pl)` and `(product)` into a single route group — once both products share the same dark stylesheet and shell structure there's no reason to keep them separate
- Single shared layout: one stylesheet, one shell, one auth gate; remove ThemeProvider entirely if everything goes dark-only
- `(landing)` stays untouched — it's already isolated and unrelated to this change

## Phase 3 — Market Analyzer Integration (future)

- **Cross-product context for held positions** — the Market Analyzer already reads newsletters and flags earnings, risk events, and macro signals. Feed the current open positions from PL Tracker into the Market Analyzer agent prompt so Haiku can flag upcoming earnings, sector risks, and relevant news for stocks currently held. The ticker watchlist in `lib/watchlist.ts` is the natural bridge — dynamically inject open position symbols so they're always prioritized in the digest.

## Phase 2 — Schwab Integration (future)
- Schwab Developer API (new post-2024 API, NOT the old TD Ameritrade one — old middleware is dead)
- User is already approved with Client ID + Client Secret at developer.schwab.com
- OAuth2 flow — same refresh token pattern as Gmail in this project
- Auto-import trades from order history
- Real-time mark price on open positions
- Price history for auto-calculating days-to-profitability
- Credentials: add `SCHWAB_CLIENT_ID`, `SCHWAB_CLIENT_SECRET`, `SCHWAB_REFRESH_TOKEN` to `.env.local` and Vercel when ready

## At Scale

- **Move trades storage to a relational DB** — trades are stored as Redis JSON + a List index (`trades:index`). Works for a personal tool but has structural limits: no native querying by symbol/date/asset type, and a crash between `SET` and `LPUSH` can leave orphaned keys. At scale, migrate to Postgres for proper indexed queries and atomic writes.

- **`nanoid` collision on `saveTrade`** — `saveTrade` calls `SET trade:<id>` with no existence check. A collision silently overwrites the existing trade and `LPUSH` adds a duplicate ID to the index. At `nanoid(10)` with a 64-char alphabet (~1.15 × 10¹⁸ possibilities) this is negligible for a personal trade log, but at scale add a `redis.exists` check before writing and regenerate on conflict.
