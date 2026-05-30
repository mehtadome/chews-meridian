import { redis } from "@/lib/redis";
import { SCHWAB_TOKEN_URL, SCHWAB_QUOTES_URL, SCHWAB_REDIS_TOKEN_KEY, SCHWAB_REDIS_ACCESS_KEY, SCHWAB_ACCESS_TOKEN_TTL } from "./config";

async function getAccessToken(): Promise<string> {
  const cached = await redis.get(SCHWAB_REDIS_ACCESS_KEY);
  if (cached) return cached;

  const storedRefresh = await redis.get(SCHWAB_REDIS_TOKEN_KEY);
  const refreshToken = storedRefresh ?? process.env.SCHWAB_REFRESH_TOKEN;

  if (!refreshToken) throw new Error("No Schwab refresh token available");

  const credentials = Buffer.from(
    `${process.env.SCHWAB_CLIENT_ID}:${process.env.SCHWAB_CLIENT_SECRET}`
  ).toString("base64");

  const res = await fetch(SCHWAB_TOKEN_URL, {
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
    redis.set(SCHWAB_REDIS_TOKEN_KEY, newRefresh),
    redis.set(SCHWAB_REDIS_ACCESS_KEY, access_token, "EX", SCHWAB_ACCESS_TOKEN_TTL),
  ]);

  return access_token;
}

export async function fetchSchwabPrices(
  symbols: string[]
): Promise<Record<string, number>> {
  if (!symbols.length) return {};

  const unique = [...new Set(symbols)];
  const token = await getAccessToken();
  const url = `${SCHWAB_QUOTES_URL}?symbols=${unique.join(",")}&fields=quote`;

  const res = await fetch(url, {
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
