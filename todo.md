# Todo

## Features

- **Webhook ingestion endpoint** — add `POST /api/webhook` to accept pushed newsletter payloads (e.g. from a Gmail push subscription or a mail relay), so the digest triggers server-side without the user clicking "Get briefing."

- **Loading UI with React Suspense** — add route-level `loading.tsx` so page transitions show a skeleton instead of a blank shell while the digest loads.

- **Next.js revalidation + caching** — explore `unstable_cache` or `fetch` with `next: { revalidate }` for the digest and ticker endpoints so Vercel can serve cached responses without always hitting Redis.

## Polish

- **Ticker standardization in prose** — tickers (e.g. AAPL, TSLA) appear as plain text in `BriefingSummary`, `RiskFlag`, `MacroSummaryCard`, and `NewsletterSummary` body fields. Structured tickers in `TickerMentionList` are already badged via `DigestTickerBadge`. Standardizing prose requires: (1) a detection strategy — regex is noisy (hits GDP, ETF, etc.), cross-referencing the digest's `TickerMentionList` is most accurate; (2) threading the ticker+direction map down through `DigestRenderer` → card components → `renderBold` or introducing a React context to avoid prop drilling.

- **Settings navigation clears digest** — navigating to `/settings` and back remounts the page, resetting React state. The `/api/digest` fallback on remount should restore content from Redis, but this has never been verified in prod.

## At Scale

- **Replace `cancelled` flag with `AbortController`** — `useFetchOnMount` uses a boolean flag to discard stale results, but the request still completes mid-flight. `AbortController` actually cancels the network request, which matters if responses are large or the user navigates frequently.

- **`KEYS` in `listDigests` is a blocking scan** — `redis.keys("digest:*")` in `lib/digest.ts` blocks the Redis server while scanning. Fine for a personal tool with <100 keys, but at scale replace with `SCAN` which iterates in batches without blocking. See `architecture.md` for why this is non-trivial.

- **Redis key namespacing across deployments** — all Vercel deployments (production, preview branches) share the same Redis instance and key namespace. At scale or with multiple environments, prefix keys by environment (e.g. `prod:digest:2026-04-22`, `dev:guest:abc123`) to avoid cross-deployment data bleed.
