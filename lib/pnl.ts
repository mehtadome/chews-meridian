import type { Trade } from "@/lib/trade-types";

// Priority: exitPrice (closed) → currentPrice (live) → markPrice (manual)
export function computePnl(trade: Trade, currentPrice?: number): number | null {
  const price = trade.exitPrice ?? currentPrice ?? trade.markPrice;
  if (price == null) return null;
  const dir = trade.direction === "long" ? 1 : -1;
  return (price - trade.entryPrice) * trade.quantity * trade.multiplier * dir;
}
