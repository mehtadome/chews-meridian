export const SCHWAB_TOKEN_URL = "https://api.schwabapi.com/v1/oauth/token";
export const SCHWAB_QUOTES_URL = "https://api.schwabapi.com/marketdata/v1/quotes";
export const SCHWAB_REDIS_TOKEN_KEY = "schwab:refresh_token";
export const SCHWAB_REDIS_ACCESS_KEY = "schwab:access_token";
export const SCHWAB_ACCESS_TOKEN_TTL = 28 * 60; // 28 min — access tokens last 30 min
export const SCHWAB_REDIS_LOCK_KEY = "schwab:token_lock";
export const SCHWAB_LOCK_TTL = 15; // seconds — max time allowed for a token refresh
