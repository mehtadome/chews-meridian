import { fetchSchwabPrices } from "@/lib/schwab";

export async function fetchCurrentPrices(
  symbols: string[]
): Promise<Record<string, number>> {
  try {
    return await fetchSchwabPrices(symbols);
  } catch (err) {
    console.error("[market-data] Schwab fetch failed:", err);
    return {};
  }
}
