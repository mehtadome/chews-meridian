// ── Timezone ──────────────────────────────────────────────────────────────────
// Single source of truth for display timezone. Replace with a Redis user preference when
// multi-user or dynamic timezone support is needed (see docs/pl-tracker/todo.md).
export const USER_TIMEZONE = "America/Los_Angeles";

// ── Model ─────────────────────────────────────────────────────────────────────
export const MODEL_ID = "claude-haiku-4-5-20251001";

// Haiku pricing (per 1M tokens)
export const INPUT_COST_PER_TOKEN  = 0.80 / 1_000_000;
export const OUTPUT_COST_PER_TOKEN = 5.00 / 1_000_000;

// ── Context window ────────────────────────────────────────────────────────────
// Digest TTL in Redis and Gmail lookback on cold start — anchored to calendar month
export const CONTEXT_WINDOW_DAYS = 30;

// ── Refresh windows (PT) ──────────────────────────────────────────────────────
// Hours during which the digest cache is bypassed so the next briefing fetches fresh content.
// startHour/endHour are 24h PT (e.g. 13 = 1pm PT).
export const REFRESH_WINDOWS = [
  { startHour: 2,  endHour: 7,  label: "2:00 AM – 7:00 AM PT"  },
  { startHour: 13, endHour: 16, label: "1:00 PM – 4:00 PM PT"  },
] as const;

// ── Newsletter sources ────────────────────────────────────────────────────────
export const NEWSLETTER_SENDERS = [
  "noreply@news.bloomberg.com",
  "crewreplies@morningbrew.com",
  "newsletter@stocktwits.com",
  "account@seekingalpha.com",
  "newsletter@thedailyrip.stock-twits.com",
] as const;
