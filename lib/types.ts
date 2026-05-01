export interface TickerSpec {
  symbol: string;
  context?: string;
  direction?: "up" | "down" | "neutral";
  count?: number; // briefing appearances on a single day; summed during same-day merges
}

export interface ComponentSpec {
  type: string;
  data: Record<string, unknown>;
}
