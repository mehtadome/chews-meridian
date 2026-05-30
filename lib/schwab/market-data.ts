import { fetchSchwabPrices } from "@/lib/schwab";

export async function fetchCurrentPrices(
  symbols: string[]
): Promise<Record<string, number>> {
  console.error("[market-data] fetching prices for:", symbols);
  try {
    const prices = await fetchSchwabPrices(symbols);
    console.error("[market-data] result:", prices);
    return prices;
  } catch (err) {
    console.error("[market-data] Schwab fetch failed:", err);
    return {};
  }
}
