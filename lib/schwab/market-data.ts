import { fetchSchwabPrices } from "@/lib/schwab";

export async function fetchCurrentPrices(
  symbols: string[]
): Promise<Record<string, number>> {
  console.log("[market-data] fetching prices for:", symbols);
  try {
    const prices = await fetchSchwabPrices(symbols);
    console.log("[market-data] result:", prices);
    return prices;
  } catch (err) {
    console.error("[market-data] Schwab fetch failed:", err);
    return {};
  }
}
