# PL Tracker — Todos

---

## In Progress — Accumulated Positions (`pl-accumulated-stocks`)

Grouping: `symbol + direction + assetType`. Applies to both open and closed tabs.
Close at accumulated level uses FIFO — partial exits split the oldest lot.

**Build order:**
1. `lib/position-utils.ts` — `groupTrades`, `fifoClose` ← **current step**
2. `POST /api/trades/close-position` — FIFO close endpoint
3. `components/pl/AccumulatedRow.tsx` — collapsed row with chevron + expand
4. Modify `TradeTable.tsx` — run through `groupTrades`, render `AccumulatedRow`
5. Modify `TradeRow.tsx` — add `isSubRow` prop (indent, no close button)
6. Modify `AddTradePanel.tsx` — qty input on close flow, call close-position endpoint

---

## Next Up — Position Grouping (post PR #16)

- **Group same-symbol positions** — when multiple trades share the same symbol (e.g. two AAPL longs), show a single collapsed row with accumulated qty, average entry price, and combined P&L
- **Expand to individual positions** — clicking the grouped row expands it inline to show each constituent trade as a sub-row, with its own entry price, qty, and P&L
- Collapsed row should show: symbol, total qty, avg entry, combined unrealized/realized P&L, and a chevron toggle
- Sub-rows indented under the parent; same columns as the existing `TradeRow`
- Grouping applies per tab (open positions group separately from closed)

## Phase 1 — Dynamic Charting (todo)

- Use Vercel AI SDK + Claude to generate dynamic charts from trade history
- Charts should be generated on-demand, not cached — user triggers analysis
- Candidate chart types: cumulative P&L over time, win rate by asset type, monthly gains bar chart, position sizing over time
- Wire into PL Tracker UI where the Haiku summary paragraph used to live (above the stats bar)

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

## Styling

- **Header wrap + zoom warning** — at high zoom levels (125%+), the product name and subtitle in both MA and PL Tracker headers wrap to a second line. Goal: `white-space: nowrap` to prevent wrapping, and a blurred overlay warning ("Hey pls zoom out") that appears past ~200% zoom. Previous attempts with `scrollWidth`/`ResizeObserver` and `devicePixelRatio` didn't fire reliably — needs a fresh approach.

## Settings

- **User timezone preference** — `USER_TIMEZONE` in `lib/config.ts` is hardcoded to `"America/Los_Angeles"`. Store as `settings:timezone` in Redis and read it server-side so the monthly boundary and date formatting both respect the user's preference. Add a timezone selector to the PL Tracker settings panel.

## At Scale

- **`listDigests` uses `KEYS digest:*`** — blocks Redis while scanning the full keyspace. Fine at current scale (~30 digest keys max). At scale, maintain a `digest:index` sorted set (`ZADD digest:index <timestamp> <date>` on every `saveDigest`) and replace the `KEYS` call in `/api/tickers/route.ts` with `ZRANGE`.


- **Move trades storage to a relational DB** — trades are stored as Redis JSON + a List index (`trades:index`). Works for a personal tool but has structural limits: no native querying by symbol/date/asset type, and a crash between `SET` and `LPUSH` can leave orphaned keys. At scale, migrate to Postgres for proper indexed queries and atomic writes. If staying on Redis with multi-user support, replace the current pipeline in `saveTrade` with `MULTI`/`EXEC` for true atomicity.

- **Guest code generation uses `Math.random()`** — not cryptographically secure. Fine for a personal tool with short-TTL codes, but at scale replace with `crypto.randomBytes()` or `crypto.getRandomValues()` in `app/api/auth/generate/route.ts`.

- **`nanoid` collision on `saveTrade`** — `saveTrade` calls `SET trade:<id>` with no existence check. A collision silently overwrites the existing trade and `LPUSH` adds a duplicate ID to the index. At `nanoid(10)` with a 64-char alphabet (~1.15 × 10¹⁸ possibilities) this is negligible for a personal trade log, but at scale add a `redis.exists` check before writing and regenerate on conflict.
