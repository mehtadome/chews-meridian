// Fetches current market prices via Yahoo Finance's unofficial quote endpoint.
// No API key required. Prices are cached by Next.js for 5 minutes to avoid hammering the endpoint.
export async function fetchCurrentPrices(symbols: string[]): Promise<Record<string, number>> {
  if (symbols.length === 0) return {};

  const unique = [...new Set(symbols)];
  const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${unique.join(",")}`;

  try {
    const res = await fetch(url, {
      next: { revalidate: 300 },
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    if (!res.ok) return {};

    const data = await res.json();
    const result: Record<string, number> = {};

    for (const quote of data?.quoteResponse?.result ?? []) {
      if (quote.symbol && quote.regularMarketPrice != null) {
        result[quote.symbol] = quote.regularMarketPrice;
      }
    }

    return result;
  } catch {
    return {};
  }
}
