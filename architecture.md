# Architecture

## Architecture

Chews Meridian is a Next.js 16 application hosted on Vercel. The only product currently is **Market Analyzer** — an AI agent that reads financial newsletters from Gmail and surfaces market intelligence as a structured daily digest.

### High-level data flow

```
User (browser)
  └── GET /          → Landing page (static, no data)
  └── GET /app       → Product shell, triggers digest fetch
        └── GET /api/digest     → L1 (module Map) → L2 (Redis) → null
        └── POST /api/agent     → Gmail → Claude → saves to Redis + L1
  └── GET /settings  → Settings UI (reads token-info, digest timestamp)
  └── GET /api/tickers          → Redis (last 7 digest keys) → aggregated ticker data
```

### Storage

| Layer | Technology | Scope | TTL |
|-------|-----------|-------|-----|
| L1 cache | Module-level `Map` | Per Lambda instance (warm only) | Process lifetime |
| L2 cache | Redis (Upstash) | Shared across all invocations | 30 days per digest key |
| Mutex | Redis `SET NX EX` | Shared across all invocations | 120s safety TTL |

---

## AI Architecture

### Model

Claude Haiku 4.5 (`claude-haiku-4-5-20251001`) via the Vercel AI SDK (`ai`) with the Anthropic provider (`@ai-sdk/anthropic`). Haiku is used for cost efficiency — the task is structured extraction, not open-ended reasoning.

### Vercel AI SDK flow

The Vercel AI SDK (`ai`) acts as the orchestration layer between the Next.js server and Claude. It handles streaming, tool execution, and the client/server message protocol so neither side has to manage raw SSE or tool call/result serialization manually.

```
Browser (useChat)
  └── POST /api/agent  ─────────────────────────────────────────────────────┐
        streamText({ model, system, messages, tools, stopWhen })            │
          ├── Claude returns text or tool_use block                         │
          ├── SDK auto-executes matched tool, appends tool_result           │
          ├── Loop repeats until text response or stepCountIs(10)           │
          └── onFinish(text, usage) → save digest, release mutex            │
        result.toUIMessageStreamResponse()  ◄───────────────────────────────┘
  └── useChat receives streamed tokens → updates messages state in real time
```

Key SDK primitives used:

| Primitive | Purpose |
|-----------|---------|
| `streamText` | Runs the model with tool use, returns a streamable result |
| `convertToModelMessages` | Converts `UIMessage[]` (client format) to the model message format |
| `stepCountIs(10)` | Stop condition — halts the agent loop after 10 tool steps |
| `toUIMessageStreamResponse` | Serializes the stream into a format `useChat` can consume |
| `useChat` | Client-side hook — manages messages state, streaming status, and sends requests |
| `DefaultChatTransport` | Configures the transport layer (endpoint, headers) for `useChat` |

### Agent loop

`POST /api/agent` runs a `streamText` call with tool use enabled, capped at 10 steps:

1. Model receives the system prompt (watchlist + newsletter senders + component schema) and the user message
2. Model calls `searchEmails` — queries Gmail using the pre-built sender+date query
3. Model calls `getEmail` one or more times to fetch full email bodies (up to 5)
4. Model synthesizes across all emails and returns a single `\`\`\`json` block — no prose outside it

### Tools

| Tool | Description |
|------|-------------|
| `searchEmails` | Queries Gmail with a search string, returns message IDs + metadata |
| `getEmail` | Fetches the full plain-text body of a single email by message ID |

Tools are defined in `lib/tools.ts` and implemented in `lib/gmail.ts`. Keep these isolated — they are candidates for extraction to an MCP server when a second product (trading) is introduced.

### Generative UI

The model always outputs a single JSON block:

```json
{ "mood": "normal|alert|opportunity|danger", "components": [{ "type": "...", "data": {...} }] }
```

`lib/parseResponse.ts` extracts this block from the stream. `ComponentRenderer.tsx` maps each `type` to its React component via a `switch`. Available types: `BriefingSummary`, `MacroSummaryCard`, `TickerMentionList`, `SectorHeatmap`, `EarningsHighlight`.

### Prompt caching

The system prompt (~1500 tokens, includes watchlist + component schema) is marked `ephemeral` via Anthropic's cache control. Requests within 5 minutes reuse the cached transformer state, avoiding re-processing the system prompt on every call.

### Gmail anchor

The system prompt includes a pre-built Gmail query anchored to the most recent digest's timestamp, so the model only reads emails that arrived since the last briefing. On first run, falls back to the start of the calendar month.

### Digest persistence

`onFinish` in the agent route:
1. Records token usage to `usage.json`
2. Parses components from the completed text
3. Calls `saveDigest` — writes to Redis with a 30-day TTL; if a digest already exists for today, **merges** ticker mentions rather than overwriting
4. Updates the L1 cache via `setCached`

### Concurrency guard

A Redis mutex (`briefing:running`, `SET NX EX 120 NX`) prevents concurrent briefing runs across Vercel invocations. Released in `onFinish` and `onError`; TTL auto-releases it if neither fires.

---

## Frontend Architecture

### Route groups

```
app/
  layout.tsx              ← root: fonts, theme-init script
  (landing)/
    layout.tsx            ← imports landing.css, no ThemeProvider
    page.tsx              → / (landing)
  (product)/
    layout.tsx            ← wraps children in ThemeProvider
    app/page.tsx          → /app (product)
    settings/page.tsx     → /settings
  api/                    ← API routes
```

Route groups (`(landing)`, `(product)`) create layout boundaries without affecting URLs.

### Landing pages (`/`)

- **Stylesheet:** `app/landing.css` — dark palette (`#0a0a0a` bg, `#22c55e` accent, `#ffffff` text), universal micro-transition rule (excludes `transform` — Framer Motion owns that)
- **Animations:** Framer Motion — hero fade+slide on mount, `whileInView` stagger on how-it-works cards, `whileHover`/`whileTap` on CTA button
- **No ThemeProvider** — landing pages have a fixed dark visual language, no user-controlled theme

### Product pages (`/app`, `/settings`)

- **Stylesheet:** `app/globals.css` — CSS custom properties design system (`--text`, `--text-heading`, `--text-muted`, `--btn-bg`, `--border`, etc.)
- **Semantic classes:** `.card`, `.card__header`, `.card__body`, `.btn`, `.tab`, `.shell`, `.shell__header`, `.shell__main`, `.ds-title`, `.ds-prose`, `.ds-meta`
- **Dark mode:** ThemeProvider toggles `.dark` class on `<html>`; token values swap via CSS cascade
- **Do not use Tailwind color/spacing utilities** in product pages

### Product page state (`/app`)

| State | Purpose |
|-------|---------|
| `messages` | Chat history managed by `useChat` (Vercel AI SDK) |
| `cachedContent` | Today's `rawText` from `/api/digest` on mount |
| `cacheChecked` | Whether the initial digest fetch has resolved |
| `tickers` | 7-day ticker mention data from `/api/tickers` |
| `totalCost` | Cumulative API spend from `/api/usage` |
| `toast` | Transient error/info message |

On mount, `useFetchOnMount` fires three parallel fetches: `/api/digest`, `/api/tickers`, `/api/usage`. After each agent stream completes (`status === "ready"`), usage and tickers are refreshed. If the stream completes empty (no new emails), `/api/digest` is re-fetched to restore the cached digest.

### Component rendering pipeline

```
rawText (streamed or cached)
  └── parseComponents()       → ComponentSpec[]
  └── ComponentRenderer       → maps type → React component via switch
  └── DigestLayout            → grid: tickers+sectors side-by-side, earnings 3-col, else full-width
```

---

## Vercel (Prod) Architecture

### Deployment

- **Platform:** Vercel (project: `chews-meridian`)
- **Framework preset:** Next.js
- **Region:** default (US East)
- Every push to `main` triggers a production deployment; branch pushes get preview URLs

### Serverless functions

Each `app/api/*/route.ts` compiles to an isolated Lambda function. Key implications:
- **L1 cache is warm-instance only** — a cold start resets the module-level `Map`; the first request after a cold start always hits Redis (L2)
- **`isRunning` flag is per-instance** — replaced with Redis mutex to guard across invocations
- **No persistent connections** — Redis client is a global singleton to reuse TCP connections across warm invocations

### Redis (Upstash)

Shared across all deployments (production + preview branches). Current key schema:

| Key pattern | Value | TTL |
|-------------|-------|-----|
| `digest:YYYY-MM-DD` | JSON `DigestRecord` | 30 days |
| `briefing:running` | `"1"` | 120s (mutex) |
| `token:issued_at` | ISO timestamp | none |

> **Known issue:** all Vercel environments share the same Redis namespace. Preview branch deployments can read/write production digest keys. At scale, prefix keys by environment (`prod:digest:*`, `preview:digest:*`).

### Known production gaps

| Issue | Impact | Fix |
|-------|--------|-----|
| No retry logic on Gmail or Claude API calls | One flaky network call = hard failure surfaced to user | Exponential backoff in `lib/gmail.ts` and agent route |
| `KEYS` scan in `listDigests` | Blocks Redis on every `/api/tickers` call | Replace with `SCAN` cursor loop — deferred because `SCAN` requires a do/while cursor loop, must handle empty batches (not a termination signal), and must deduplicate keys (Redis can return the same key twice during a rehash). Harmless at current scale (~30 keys max). |
| No `AbortController` in `useFetchOnMount` | In-flight requests complete even after navigation | Replace boolean cancel flag with `AbortController` |
