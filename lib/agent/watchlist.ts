export interface WatchlistEntry {
  symbol: string;
  note?: string; // optional context e.g. "long-term hold", "watching for entry"
}

export const WATCHLIST: WatchlistEntry[] = [
  { symbol: "TSLA" },
  { symbol: "PLTR" },
  { symbol: "MSFT" },
  { symbol: "GOOG" },
  { symbol: "SBUX" },
  { symbol: "SPY",  note: "broad market exposure" },
  { symbol: "ES1!", note: "S&P 500 futures" },
  { symbol: "JPM" },
  { symbol: "AMD" },
  { symbol: "AMZN" },
  { symbol: "META" },
  { symbol: "ACN" },
  { symbol: "NFLX" },
  { symbol: "GLD",  note: "gold hedge" },
];
