import { redis } from "@/lib/redis";
import { SCHWAB_TOKEN_URL, SCHWAB_QUOTES_URL, SCHWAB_REDIS_TOKEN_KEY } from "./config";

async function getAccessToken(): Promise<string> {
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

  await redis.set(SCHWAB_REDIS_TOKEN_KEY, newRefresh);

  return access_token;
}

export async function fetchSchwabPrices(
  symbols: string[]
): Promise<Record<string, number>> {
  if (!symbols.length) return {};

  const token = await getAccessToken();
  const url = `${SCHWAB_QUOTES_URL}?symbols=${symbols.join(",")}&fields=quote`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) throw new Error(`Schwab quotes failed: ${res.status}`);

  const data = await res.json();

  return Object.fromEntries(
    symbols.flatMap(sym => {
      const price = (data[sym] as any)?.quote?.lastPrice;
      return price != null ? [[sym, price]] : [];
    })
  );
}
