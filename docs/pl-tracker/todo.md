# PL Tracker — Todos

---

## Data Decisions

### NVDA pre-2025 lot (intentional)
Two NVDA lots share entry date `2025-04-10` in the database. This is deliberate:
- `3x @ $106` — actual 4/10/25 purchase
- `15x @ $132` — original purchase date was **6/17/24**, faked to 4/10/25 so it falls within the app's tracking window (resurgence started ~April 2025). Note is preserved on the trade record: *"Original purchase date 6/17/24 — carried over from prior period"*.

Both lots closed 2/9/26 @ $187.81 as part of a 34-share FIFO exit.

---
## Phase 1 — Dynamic Charting (todo)

- Use Vercel AI SDK + Claude to generate dynamic charts from trade history
- Charts should be generated on-demand, not cached — user triggers analysis
- Candidate chart types: cumulative P&L over time, win rate by asset type, monthly gains bar chart, position sizing over time
- Wire into PL Tracker UI where the Haiku summary paragraph used to live (above the stats bar)

## Phase 3 — Market Analyzer Integration (future)

See [roadmap.md](../roadmap.md).

## Phase 2 — Schwab Integration (future)
- Schwab Developer API (new post-2024 API, NOT the old TD Ameritrade one — old middleware is dead)
- User is already approved with Client ID + Client Secret at developer.schwab.com
- OAuth2 flow — same refresh token pattern as Gmail in this project
- Auto-import trades from order history
- Real-time mark price on open positions
- Price history for auto-calculating days-to-profitability
- Credentials: add `SCHWAB_CLIENT_ID`, `SCHWAB_CLIENT_SECRET`, `SCHWAB_REFRESH_TOKEN` to `.env.local` and Vercel when ready

## Styling

- **Smooth expand/collapse animation on accumulated rows** — expanding and collapsing sub-rows in both Open and Closed tabs is choppy because `<table>` elements don't support height transitions. Attempts with Framer Motion `layout` prop and `motion.tr` opacity fade didn't resolve the layout snap. Needs a proper solution — likely replacing the collapsible section with a `<td colSpan={N}>` containing an animated div, or switching sub-row rendering away from native table rows entirely.

## Settings

- **User timezone preference** — `USER_TIMEZONE` in `lib/config.ts` is hardcoded to `"America/Los_Angeles"`. Store as `settings:timezone` in Redis and read it server-side so the monthly boundary and date formatting both respect the user's preference. Add a timezone selector to the PL Tracker settings panel.

## At Scale

See [scale.md](./scale.md).
