# Roadmap — Cross-Product

Items that span both Market Analyzer and PL Tracker, or affect shared infrastructure.

---

## Market Analyzer × PL Tracker Integration

- **Cross-product context for held positions** — feed current open positions from PL Tracker into the Market Analyzer agent prompt so Haiku can flag upcoming earnings, sector risks, and relevant news for stocks currently held. The ticker watchlist in `lib/watchlist.ts` is the natural bridge — dynamically inject open position symbols so they're always prioritized in the digest.

---

## Shared UI

- **Header wrap + zoom warning** — at high zoom levels (125%+), the product name and subtitle in both MA and PL Tracker headers wrap to a second line. Goal: `white-space: nowrap` to prevent wrapping, and a blurred overlay warning that appears past ~200% zoom. Previous attempts with `scrollWidth`/`ResizeObserver` and `devicePixelRatio` didn't fire reliably — needs a fresh approach.

---

## Shared Infrastructure

- **Redis key namespacing across deployments** — all Vercel deployments (production, preview branches) share the same Redis instance and key namespace. At scale or with multiple environments, prefix keys by environment (e.g. `prod:digest:2026-04-22`, `dev:guest:abc123`) to avoid cross-deployment data bleed. Documented in both `docs/market-analyzer/scale.md` and `docs/pl-tracker/scale.md`.
