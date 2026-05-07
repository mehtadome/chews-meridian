# PL Tracker — Todos

---

## Phase 1 — Manual UI (current)

**Build order:**
1. `lib/trade-types.ts` — Trade interface, AssetType, Direction, Zod schemas ✓
2. `lib/trades.ts` — Redis CRUD (mirrors `lib/digest.ts` pattern, uses `mget` for batch fetch) ✓
3. `app/api/trades/route.ts` + `app/api/trades/[id]/route.ts` — GET/POST/PATCH/DELETE
4. `app/pl.css` — design tokens (`--pl-*`), semantic classes (`.pl-shell`, `.pl-table`, `.pl-row--profit/loss`)
5. `app/(pl)/layout.tsx` — auth gate + `pl.css` import, no ThemeProvider (always dark)
6. `components/pl/PnlBadge.tsx` — formatted +$/-$ with green/red
7. `components/pl/TradeRow.tsx` + `components/pl/TradeTable.tsx` — open/closed column variants
8. `components/pl/SummaryBar.tsx` — total P&L, win rate, avg days held, avg days to profit
9. `components/pl/TradeFormFields.tsx` + `components/pl/AddTradePanel.tsx` — slide-in Framer Motion panel, conditional fields by asset type
10. `app/(pl)/pl-tracker/page.tsx` — main page, tabs (open/closed/summary), panel mode state

**Key decisions:**
- Route group `(pl)` — isolated from `(product)`, never inherits ThemeProvider
- `pl.css` tokens are self-contained; do not rely on `globals.css` semantic classes
- Panel state as discriminated union: `{ kind: 'closed' | 'add' } | { kind: 'edit' | 'close', trade: Trade }`
- P&L computed in components from raw fields, not stored: `(exitPrice - entryPrice) × qty × multiplier × (long ? 1 : -1)`
- Redis index: `trades:index` List with `LPUSH` (newest-first) + `LREM` on delete
- `nanoid(10)` for IDs — already a transitive dep, no install needed
- Multiplier: 1 for stocks, 100 for options, user-entered for futures

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
