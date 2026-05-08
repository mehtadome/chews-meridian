import { nanoid } from "nanoid";
import { redis } from "@/lib/redis";
import type { Trade, TradeCreate } from "@/lib/trade-types";

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
  return raws
    .filter((r): r is string => r !== null)
    .map((r) => JSON.parse(r) as Trade);
}

async function bumpTradesVersion() {
  await redis.incr("trades:v");
}

export async function saveTrade(data: TradeCreate): Promise<Trade> {
  const trade: Trade = { id: nanoid(10), ...data };
  await redis.set(tradeKey(trade.id), JSON.stringify(trade));
  await redis.lpush("trades:index", trade.id);
  await bumpTradesVersion();
  return trade;
}

export async function updateTrade(id: string, patch: Partial<Omit<Trade, "id">>): Promise<Trade | null> {
  const existing = await getTrade(id);
  if (!existing) return null;
  const updated: Trade = { ...existing, ...patch };
  await redis.set(tradeKey(id), JSON.stringify(updated));
  await bumpTradesVersion();
  return updated;
}
