# Todo

## Landing Page & Marketing Routes

Steps to build the landing page and decouple marketing vs. product styling.

1. **Install Framer Motion** — `npm install framer-motion`
2. **Restructure routes into groups** — move files into `app/(marketing)/` and `app/(product)/` so each group gets its own layout without affecting URLs
   - `app/(marketing)/layout.tsx` — imports `marketing.css`, no ThemeProvider
   - `app/(marketing)/page.tsx` — `/` (new landing page)
   - `app/(marketing)/about/page.tsx` — move current `app/about/page.tsx` here
   - `app/(product)/layout.tsx` — wraps with ThemeProvider, product styles
   - `app/(product)/app/page.tsx` — move current `app/page.tsx` here → route becomes `/app`
   - `app/(product)/settings/page.tsx` — move current `app/settings/page.tsx` here
3. **Create `app/marketing.css`** — separate stylesheet for landing + about (gradients, animation classes, looser visual rules)
4. **Update internal links**
   - Settings back button: `/` → `/app`
   - About back button: stays `/`
   - Landing CTA: points to `/app`
5. **Build landing page** — hero, project description, "Enter App" CTA; Framer Motion for scroll reveals and micro-interactions
6. **Polish `/about`** — replace placeholder paragraphs, apply marketing styles

## Architecturally Imperfect

- **Ticker standardization in prose** — tickers (e.g. AAPL, TSLA) appear as plain text in `BriefingSummary`, `RiskFlag`, `MacroSummaryCard`, and `NewsletterSummary` body fields. Structured tickers in `TickerMentionList` and `ChatDrawer` are already badged via `DigestTickerBadge`. Standardizing prose requires: (1) a detection strategy — regex is noisy (hits GDP, ETF, etc.), cross-referencing the digest's `TickerMentionList` is most accurate; (2) threading the ticker+direction map down through `DigestRenderer` → card components → `renderBold`; or introducing a React context to avoid prop drilling. Best approached as an extension to `renderBold` once the data threading story is clear.

## Next Session

- **Next.js revalidation + caching** — explore `fetch` with `next: { revalidate }` and `unstable_cache` for the digest and ticker endpoints so Vercel can serve cached responses without always hitting Redis. Ref: https://nextjs.org/docs/14/app/building-your-application/data-fetching/fetching-caching-and-revalidating

- **Loading UI with React Suspense** — add `app/loading.tsx` (or route-level `loading.tsx`) so page transitions show a skeleton instead of a blank shell while the digest loads. Ref: https://nextjs.org/docs/app/api-reference/file-conventions/loading

- **Webhook ingestion endpoint** — look into `POST /api/webhook` to accept pushed newsletter payloads (e.g. from a Gmail push subscription or a mail relay), so the digest can be triggered server-side without a user clicking "Get briefing."

## Vercel / Production

- **Replace `isRunning` guard with Redis mutex** — the module-level `isRunning` flag in `app/api/agent/route.ts` resets on every Vercel invocation (separate processes), so the concurrent request guard does nothing in production. Replace with a `briefing:running` key in Redis using `SET NX EX` so the lock works across invocations.

- **Settings navigation clears digest** — navigating to `/settings` and back remounts the page, resetting all React state. The return `/api/digest` call then hits Redis (now fixed), so this should be resolved — verify in prod.


- **Add retry logic for Gmail and Claude API calls** — transient timeouts are more common in production. Neither `lib/gmail.ts` nor `app/api/agent/route.ts` has any retry or backoff, so one flaky network call surfaces as a hard failure to the user.

## At Scale

- **Replace `cancelled` flag with `AbortController`** — `useFetchOnMount` uses a boolean flag to discard stale results, but the request still completes mid-flight. `AbortController` actually cancels the network request, which matters if responses are large or the user navigates frequently.


- **`KEYS` in `listDigests` is a blocking scan** — `redis.keys("digest:*")` in `lib/digest.ts` blocks the Redis server while scanning. Fine for a personal tool with <100 keys, but at scale replace with `SCAN` which iterates in batches without blocking.

- **Redis key namespacing across deployments** — all Vercel deployments (production, preview branches) share the same Redis instance and key namespace. At scale or with multiple environments, prefix keys by environment (e.g. `prod:digest:2026-04-22` vs `preview:digest:2026-04-22`) to avoid cross-deployment data bleed.
