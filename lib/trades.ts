import { nanoid } from "nanoid";
import { redis } from "@/lib/redis";
import type { Trade, TradeCreate, TradeUpdate } from "@/lib/trade-types";

function tradeKey(id: string) {
  return `trade:${id}`;
}

export async function getTrade(id: string): Promise<Trade | null> {
  const raw = await redis.get(tradeKey(id));
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function listTrades(): Promise<Trade[]> {
  const ids = await redis.lrange("trades:index", 0, -1);
  if (ids.length === 0) return [];
  const raws = await redis.mget(...ids.map(tradeKey));
  // skip corrupt entries rather than crashing the whole list
  return raws
    .filter((r): r is string => r !== null)
    .flatMap((r) => { try { return [JSON.parse(r) as Trade]; } catch { return []; } });
}

export async function saveTrade(data: TradeCreate): Promise<Trade> {
  const trade: Trade = { id: nanoid(10), ...data };
  // pipeline = one round-trip; use MULTI/EXEC instead if multi-user writes are ever needed
  const pipe = redis.pipeline();
  pipe.set(tradeKey(trade.id), JSON.stringify(trade));
  pipe.lpush("trades:index", trade.id);
  await pipe.exec();
  return trade;
}

export async function updateTrade({ id, ...patch }: TradeUpdate): Promise<Trade | null> {
  const existing = await getTrade(id);
  if (!existing) return null;
  const updated: Trade = { ...existing, ...patch };
  await redis.set(tradeKey(id), JSON.stringify(updated));
  return updated;
}
