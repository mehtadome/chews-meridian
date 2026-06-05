// ─── Read-only contract ──────────────────────────────────────────────────────
// This module is strictly read-only. The Schwab app credential (Market Data
// Production) has no trading permissions at the platform level. schwabFetch()
// enforces the same constraint in code: only GET requests to allowlisted paths.
// Order placement would require lib/schwab/trading.ts — a file that does not
// exist and must never be created without explicit architectural review.
// ─────────────────────────────────────────────────────────────────────────────

import { redis } from "@/lib/redis";
import {
  SCHWAB_TOKEN_URL,
  SCHWAB_QUOTES_URL,
  SCHWAB_REDIS_TOKEN_KEY,
  SCHWAB_REDIS_ACCESS_KEY,
  SCHWAB_ACCESS_TOKEN_TTL,
  SCHWAB_REDIS_LOCK_KEY,
  SCHWAB_LOCK_TTL,
  SCHWAB_ALLOWED_PATHS,
} from "./config";

function schwabFetch(url: string, init: RequestInit = {}): Promise<Response> {
  const isTokenEndpoint = url === SCHWAB_TOKEN_URL;

  if (!isTokenEndpoint) {
    const method = (init.method ?? "GET").toUpperCase();
    if (method !== "GET") {
      throw new Error(`[schwab] Blocked non-GET request: ${method} ${url}`);
    }
    const { pathname } = new URL(url);
    const allowed = SCHWAB_ALLOWED_PATHS.some(p => pathname.startsWith(p));
    if (!allowed) {
      throw new Error(`[schwab] Blocked request to non-allowlisted path: ${pathname}`);
    }
  }

  return fetch(url, { ...init, cache: "no-store" });
}

async function refreshAccessToken(): Promise<string> {
  const storedRefresh = await redis.get(SCHWAB_REDIS_TOKEN_KEY);
  const refreshToken = storedRefresh ?? process.env.SCHWAB_REFRESH_TOKEN;

  if (!refreshToken) throw new Error("No Schwab refresh token available");

  const credentials = Buffer.from(
    `${process.env.SCHWAB_CLIENT_ID}:${process.env.SCHWAB_CLIENT_SECRET}`
  ).toString("base64");

  const res = await schwabFetch(SCHWAB_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (!res.ok) throw new Error(`Schwab token refresh failed: ${res.status}`);

  const { access_token, refresh_token: newRefresh } = await res.json();

  await Promise.all([
    newRefresh ? redis.set(SCHWAB_REDIS_TOKEN_KEY, newRefresh) : Promise.resolve(),
    redis.set(SCHWAB_REDIS_ACCESS_KEY, access_token, "EX", SCHWAB_ACCESS_TOKEN_TTL),
  ]);

  return access_token;
}

async function getAccessToken(): Promise<string> {
  const cached = await redis.get(SCHWAB_REDIS_ACCESS_KEY);
  if (cached) return cached;

  // Acquire a distributed lock so only one instance refreshes the rotating token at a time.
  const acquired = await redis.set(SCHWAB_REDIS_LOCK_KEY, "1", "EX", SCHWAB_LOCK_TTL, "NX");

  if (!acquired) {
    // Another instance holds the lock — poll cache until it writes the new token.
    for (let i = 0; i < 10; i++) {
      await new Promise(r => setTimeout(r, 300));
      const token = await redis.get(SCHWAB_REDIS_ACCESS_KEY);
      if (token) return token;
    }
    throw new Error("Timed out waiting for Schwab token refresh");
  }

  try {
    return await refreshAccessToken();
  } finally {
    await redis.del(SCHWAB_REDIS_LOCK_KEY);
  }
}

export async function fetchSchwabPrices(
  symbols: string[]
): Promise<Record<string, number>> {
  if (!symbols.length) return {};

  const unique = [...new Set(symbols)];
  const token = await getAccessToken();
  const url = `${SCHWAB_QUOTES_URL}?symbols=${unique.join(",")}&fields=quote`;

  const res = await schwabFetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Schwab quotes failed: ${res.status} — ${body}`);
  }

  const data = await res.json();

  return Object.fromEntries(
    unique.flatMap(sym => {
      const price = (data[sym] as any)?.quote?.lastPrice;
      return price != null ? [[sym, price]] : [];
    })
  );
}
