import type { Trade, Direction, AssetType, TradeUpdate, TradeCreate } from "./trade-types";

export interface PositionGroup {
  symbol: string;
  direction: Direction;
  assetType: AssetType;
  multiplier: number;
  trades: Trade[];
  totalQty: number;
  avgEntryPrice: number;
}

export interface FifoCloseResult {
  toUpdate: TradeUpdate[];
  toCreate: TradeCreate[];
}

export function groupTrades(trades: Trade[]): PositionGroup[] {
  const map = new Map<string, Trade[]>();

  for (const trade of trades) {
    const key = `${trade.symbol}|${trade.direction}|${trade.assetType}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(trade);
  }

  const groups: PositionGroup[] = [];
  for (const grouped of map.values()) {
    const first = grouped[0];
    const totalQty = grouped.reduce((sum, t) => sum + t.quantity, 0);
    const avgEntryPrice =
      grouped.reduce((sum, t) => sum + t.entryPrice * t.quantity, 0) / totalQty;

    groups.push({
      symbol: first.symbol,
      direction: first.direction,
      assetType: first.assetType,
      multiplier: first.multiplier,
      trades: grouped,
      totalQty,
      avgEntryPrice,
    });
  }

  return groups;
}

// Applies FIFO: consumes oldest lots first.
// If a lot is partially consumed it is split — the existing record shrinks,
// a new closed record is created for the exited portion.
export function fifoClose(
  openTrades: Trade[],
  qty: number,
  exitPrice: number,
  exitDate: string,
): FifoCloseResult {
  const sorted = [...openTrades].sort((a, b) =>
    a.entryDate < b.entryDate ? -1 : a.entryDate > b.entryDate ? 1 : 0,
  );

  const toUpdate: TradeUpdate[] = [];
  const toCreate: TradeCreate[] = [];
  let remaining = qty;

  for (const trade of sorted) {
    if (remaining <= 0) break;

    if (trade.quantity <= remaining) {
      toUpdate.push({ id: trade.id, exitPrice, exitDate });
      remaining -= trade.quantity;
    } else {
      // Split: shrink open lot, create a closed record for the exited portion
      toUpdate.push({ id: trade.id, quantity: trade.quantity - remaining });
      toCreate.push({
        symbol: trade.symbol,
        assetType: trade.assetType,
        direction: trade.direction,
        entryPrice: trade.entryPrice,
        entryDate: trade.entryDate,
        exitPrice,
        exitDate,
        quantity: remaining,
        multiplier: trade.multiplier,
        notes: trade.notes,
        markPrice: null,
      });
      remaining = 0;
    }
  }

  return { toUpdate, toCreate };
}
