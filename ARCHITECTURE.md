# Architecture — Chew's Meridian

> Last updated: 2026-05-28

Chew's Meridian is a Next.js 16 application on Vercel with two independent products sharing a common auth layer and Redis instance.

| Product | Route | Purpose |
|---------|-------|---------|
| Market Analyzer | `/market-analyzer` | AI agent reads Gmail newsletters → structured daily digest |
| PL Tracker | `/pl-tracker` | Trade journal with FIFO P&L, live prices, and AI performance summary |

---

## Route Groups

Three Next.js route groups create isolated layout and stylesheet boundaries:

```
app/
  (landing)/            ← /, /about       landing.css, no ThemeProvider
  (product)/            ← /market-analyzer, /settings   market-analyzer.css, ThemeProvider
  (pl)/                 ← /pl-tracker     pl.css, no ThemeProvider
  api/                  ← all API routes
  login/                ← shared login page
```

Auth guard lives in `proxy.ts` (exported as `proxy`, not `middleware` — Next.js deprecation). Redirects unauthenticated requests for `/market-analyzer`, `/pl-tracker`, and `/settings` to `/login?from=<destination>`.

---

## Market Analyzer

### Data flow

```
User browser
  └── GET /market-analyzer    → page shell; triggers digest fetch on mount
        └── GET /api/digest   → L1 (module Map) → L2 (Redis) → null
        └── POST /api/agent   → Gmail → Claude → saves to Redis + L1
  └── GET /settings           → reads token-info, digest timestamp
  └── GET /api/tickers        → Redis (last 7 digest keys) → aggregated ticker data
```

### Storage

| Layer | Technology | Scope | TTL |
|-------|-----------|-------|-----|
| L1 cache | Module-level `Map` (`lib/cache.ts`) | Per Lambda instance (warm only) | Process lifetime |
| L2 cache | Redis (Upstash) | Shared across all invocations | 30 days per digest key |
| Mutex | Redis `SET NX EX` | Shared across all invocations | 120s safety TTL |

On subsequent page loads, `GET /api/digest` checks L1 then L2 and returns `rawText` without touching Gmail or the model. Cache auto-evicts non-today entries on write.

### AI Architecture

**Model:** Claude Haiku 4.5 (`claude-haiku-4-5-20251001`) via Vercel AI SDK (`ai` + `@ai-sdk/anthropic`). Haiku used for cost efficiency — the task is structured extraction, not open-ended reasoning.

**Agent loop** (`POST /api/agent`, capped at 10 steps):
1. Model receives system prompt (watchlist + newsletter senders + component schema) and user message
2. Model calls `searchEmails` — queries Gmail using the pre-built sender+date query
3. Model calls `getEmail` one or more times to fetch full email bodies (up to 5)
4. Model synthesizes and returns a single ` ```json ` block — no prose outside it

**Vercel AI SDK flow:**
```
Browser (useChat)
  └── POST /api/agent
        streamText({ model, system, messages, tools, stopWhen })
          ├── Claude returns text or tool_use block
          ├── SDK auto-executes matched tool, appends tool_result
          ├── Loop repeats until text response or stepCountIs(10)
          └── onFinish(text, usage) → save digest, release mutex
        result.toUIMessageStreamResponse()
  └── useChat receives streamed tokens → updates messages state
```

| SDK primitive | Purpose |
|---------------|---------|
| `streamText` | Runs the model with tool use, returns a streamable result |
| `convertToModelMessages` | Converts `UIMessage[]` to model message format |
| `stepCountIs(10)` | Stop condition — halts agent loop after 10 tool steps |
| `toUIMessageStreamResponse` | Serializes stream into a format `useChat` can consume |
| `useChat` | Client-side hook — messages state, streaming status, sends requests |

**Tools** (`lib/tools.ts` → `lib/gmail.ts`):

| Tool | Description |
|------|-------------|
| `searchEmails` | Queries Gmail with a search string, returns message IDs + metadata |
| `getEmail` | Fetches the full plain-text body of a single email by message ID |

Tools are candidates for MCP extraction when a second product shares them.

### Generative UI

The model always outputs a single JSON block:

```json
{ "mood": "normal|alert|opportunity|danger", "components": [{ "type": "...", "data": {...} }] }
```

`lib/parseResponse.ts` extracts the block. `ComponentRenderer.tsx` maps each `type` → React component via `switch`. `DigestLayout` handles grid arrangement (tickers+sectors side-by-side, earnings 3-col, else full-width).

Available types: `BriefingSummary`, `MacroSummaryCard`, `TickerMentionList`, `SectorHeatmap`, `EarningsHighlight`, `RiskFlag`, `NewsletterSummary`.

**To add a component type:** create it in `components/ui/`, register in `ComponentRenderer.tsx`, describe it in `lib/systemPrompt.ts`.

### Prompt caching

System prompt (~1500 tokens) marked `ephemeral` via Anthropic cache control. Requests within 5 minutes reuse the cached transformer state.

### Digest persistence

`onFinish` in the agent route:
1. Records token usage to `usage.json`
2. Parses components from completed text
3. Calls `saveDigest` — writes to Redis with 30-day TTL; if a digest already exists for today, **merges** ticker mentions rather than overwriting
4. Updates L1 cache via `setCached`

### Concurrency guard

Redis mutex (`briefing:running`, `SET NX EX 120`) prevents concurrent briefing runs across Vercel invocations. Released in `onFinish` and `onError`; TTL auto-releases if neither fires.

### Atomic Redis operations (Lua scripts)

For conditional read-modify-write on a single key (e.g. decrementing a use counter only if > 0), a Lua script is sent via `redis.eval`. Redis executes the entire script in one uninterruptible step — nothing else can run between lines.

```lua
local raw = redis.call('GET', KEYS[1])
if not raw then return nil end
local data = cjson.decode(raw)
if data.usesLeft <= 0 then return redis.error_reply('exhausted') end
data.usesLeft = data.usesLeft - 1
redis.call('SET', KEYS[1], cjson.encode(data), 'EX', ARGV[1])
return raw
```

---

## PL Tracker

### Data flow

```
User browser
  └── GET /pl-tracker     → server component fetches trades + live prices + isOwner
        └── GET /api/trades          → Redis list of all trade records
        └── GET /api/trades/prices   → Yahoo Finance live prices (revalidate: 300s)
        └── GET /api/pl/agent        → Haiku summary (cached per trades:v + month)
  └── POST /api/trades               → create trade (owner only)
  └── PATCH /api/trades/[id]         → update/close trade (owner only)
```

P&L formula: `(exitPrice ?? currentPrice ?? markPrice − entryPrice) × quantity × multiplier × (long ? 1 : −1)`

### Data model (`lib/trade-types.ts`)

`Trade`: `id`, `symbol`, `assetType` (stock/option/future), `direction` (long/short), `entryPrice`, `entryDate` (YYYY-MM-DD), `exitPrice` (null = open), `exitDate` (null = open), `quantity`, `multiplier`, `notes`, `markPrice`.

Trades are permanent records — no DELETE endpoint by design.

### FIFO matching (`lib/position-utils.ts`)

`groupTrades(trades)` accumulates open lots per symbol into `AccumulatedPosition` objects. `fifoClose(position, closeQty, exitPrice, exitDate)` distributes the close across the oldest open lots first, returning updated trade patches.

Positions with multiple lots render as an `AccumulatedRow` (expandable parent) in `TradeTable`, with individual `TradeRow` children shown on expand.

### Components (`components/pl/`)

| File | Purpose |
|------|---------|
| `PlTrackerClient.tsx` | "use client" shell — tabs, month state, panel state, summary data |
| `MonthNav.tsx` | `← May 2026 →` navigator with popover year+month grid |
| `SummaryBar.tsx` | Monthly realized P&L, per-position live P&L, Haiku summary text |
| `TradeTable.tsx` | Unified table for Open and Closed tabs |
| `AccumulatedRow.tsx` | Expandable parent row for multi-lot positions |
| `TradeRow.tsx` | Single trade row — symbol, P&L, qty, entry/exit, direction, dates |
| `PnlBadge.tsx` | `Intl.NumberFormat` with `signDisplay:"always"`, profit/loss/neutral variants |
| `AddTradePanel.tsx` | Framer Motion slide-in panel. `PanelMode` discriminated union: closed/add/edit/close |
| `TradeFormFields.tsx` | Form fields. MM/DD date inputs with year toggle button (2024/2025/2026) |
| `ClosePositionForm.tsx` | Qty-to-close input + exit price + date for closing accumulated positions |
| `PlSettingsPanel.tsx` | Owner-only settings. Generates guest codes via `POST /api/auth/generate` |
| `DatePicker.tsx` | Calendar popover. Years capped at current year (no future) |
| `NumberStepper.tsx` | +/- stepper for numeric inputs |
| `PanelShell.tsx` | Shared slide-in panel chrome |
| `AddEditForm.tsx` | Form for add/edit modes inside `AddTradePanel` |

### Month navigation

`PlTrackerClient` holds `selYear` + `selMonth` state (initialized to current month via `Intl.DateTimeFormat` + `USER_TIMEZONE`). Deriving `monthStart`/`monthEnd` as `YYYY-MM-01` strings scopes:
- Closed trades filter: `t.exitDate >= monthStart && t.exitDate < monthEnd`
- `SummaryBar` monthly/yearly gains
- Top-3 closed profits

Open positions always show regardless of selected month.

### `yearStart` / month boundary comparisons

Always use date-only strings: `` `${year}-${mm}-01` `` — never `.toISOString()`, which produces datetime strings that sort incorrectly against plain date strings. `yearEnd` = `` `${year + 1}-01-01` ``.

---

## Shared Infrastructure

### Authentication (`lib/auth.ts`)

| Session type | Cookie value | Access |
|---|---|---|
| Owner | `OWNER_TOKEN` env var value | Full read/write |
| Guest | `guest:<code>` | Read-only (no trade creation or editing) |

Guest codes stored as `guest:<code>` JSON `{ expiresAt, usesLeft }` in Redis with 1hr TTL. 5 uses max. `cm_session` cookie holds either.

Both product layouts redirect to `/login?from=<destination>` when unauthenticated. Login reads `?from` and redirects after success.

### Redis key schema

| Key pattern | Value | TTL |
|-------------|-------|-----|
| `digest:YYYY-MM-DD` | JSON `DigestRecord` | 30 days |
| `briefing:running` | `"1"` | 120s (mutex) |
| `trade:<nanoid(10)>` | JSON `Trade` | none (permanent) |
| `trades:index` | LPUSH list of trade IDs | none (permanent) |
| `trades:v` | incrementing version counter | none |
| `guest:<code>` | JSON `{ expiresAt, usesLeft }` | 1hr |

> **Note:** all Vercel environments share the same Redis namespace. Preview branch deployments can read/write production data. At scale, prefix keys by environment.

### Stylesheets

Three isolated stylesheets — never import one inside another's route group:

| File | Used in | Notes |
|------|---------|-------|
| `app/landing.css` | `(landing)` layout | Dark palette, Framer Motion, arbitrary values allowed |
| `app/market-analyzer.css` | `(product)` layout | CSS custom properties design system, no Tailwind utilities |
| `app/pl.css` | `(pl)` layout | Self-contained dark design system, `--pl-bg`, `--pl-green`, `--pl-red` tokens |

---

## Vercel (Prod) Architecture

- **Platform:** Vercel (project: `chews-meridian`)
- **Region:** default (US East)
- Every push to `main` triggers a production deployment; branch pushes get preview URLs

Each `app/api/*/route.ts` compiles to an isolated Lambda function:
- **L1 cache is warm-instance only** — cold starts reset the module-level `Map`; first request hits Redis (L2)
- **No persistent connections** — Redis client is a global singleton (`lib/redis.ts`) to reuse TCP connections across warm invocations

---

## Known Gaps

| Issue | Impact | Fix |
|-------|--------|-----|
| No retry on Gmail / Claude API calls | One flaky call = hard failure | Exponential backoff in `lib/gmail.ts` and agent route |
| `KEYS` scan in `listDigests` | Blocks Redis on every `/api/tickers` call | Replace with `SCAN` cursor loop — harmless at current scale (~30 keys max) |
| No `AbortController` in `useFetchOnMount` | In-flight requests complete after navigation | Replace boolean cancel flag with `AbortController` |
| All envs share Redis namespace | Preview branches can corrupt production data | Prefix keys by env (`prod:`, `preview:`) |
| Schwab API not wired | Live prices stubbed; `fetchCurrentPrices` returns `{}` | Phase 2 — OAuth flow in `lib/market-data.ts` |
| Mutex not released if `req.json()` throws | Redis mutex held for full 120s TTL | Wrap `req.json()` parse in try/catch, release mutex in catch |
