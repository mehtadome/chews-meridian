export const SCHWAB_TOKEN_URL = "https://api.schwabapi.com/v1/oauth/token";
export const SCHWAB_QUOTES_URL = "https://api.schwabapi.com/marketdata/v1/quotes";
export const SCHWAB_REDIS_TOKEN_KEY = "schwab:refresh_token";
export const SCHWAB_REDIS_ACCESS_KEY = "schwab:access_token";
export const SCHWAB_ACCESS_TOKEN_TTL = 28 * 60; // 28 min — access tokens last 30 min
export const SCHWAB_REDIS_LOCK_KEY = "schwab:token_lock";
export const SCHWAB_LOCK_TTL = 15; // seconds — max time allowed for a token refresh

// Permitted read-only path prefixes. schwabFetch() rejects anything not listed here.
// To add a trading path, it would require a deliberate addition to this list — there is
// no trading.ts and no trading path will ever be added to a read-only Schwab app.
export const SCHWAB_ALLOWED_PATHS = [
  "/marketdata/v1/quotes",
  "/trader/v1/accounts",
  "/trader/v1/orders",
] as const;
