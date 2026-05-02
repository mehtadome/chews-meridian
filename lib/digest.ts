import { redis } from "@/lib/redis";
import type { TickerSpec, ComponentSpec } from "@/lib/types";

export interface DigestRecord {
  date: string;         // YYYY-MM-DD
  timestamp: string;    // ISO
  mood: string;
  prose: string;
  components: object[];
  rawText: string;      // full assistant message text, used to render DigestRenderer from cache
  usage: {
    inputTokens: number;
    outputTokens: number;
    costUsd: number;
  };
}

// Redis key format: digest:YYYY-MM-DD
function digestKey(date: string) {
  return `digest:${date}`;
}


// Unions ticker symbols from the existing digest with the incoming one — newer context/direction wins per symbol.
// Prevents multiple same-day briefings from overwriting earlier ticker signals.
function mergeTickerMentions(existing: ComponentSpec[], incoming: ComponentSpec[]): ComponentSpec[] {
  const existingTickers = (existing.find((c) => c.type === "TickerMentionList")?.data.tickers ?? []) as TickerSpec[];
  const incomingTickers = (incoming.find((c) => c.type === "TickerMentionList")?.data.tickers ?? []) as TickerSpec[];

  const merged = new Map<string, TickerSpec>(existingTickers.map((t) => [t.symbol, t]));
  for (const t of incomingTickers) {
    const prev = merged.get(t.symbol);
    merged.set(t.symbol, { ...t, count: (prev?.count ?? 1) + (t.count ?? 1) });
  }

  return incoming.map((c) =>
    c.type === "TickerMentionList"
      ? { ...c, data: { ...c.data, tickers: Array.from(merged.values()) } }
      : c
  );
}

// Writes today's digest to Redis. If a digest already exists for today, merges ticker mentions rather than overwriting.
export async function saveDigest(record: Omit<DigestRecord, "date" | "timestamp">): Promise<DigestRecord> {
  const now = new Date();
  const date = now.toISOString().slice(0, 10);
  const timestamp = now.toISOString();

  const existing = await getDigest(date);
  const components = existing
    ? mergeTickerMentions(existing.components as ComponentSpec[], record.components as ComponentSpec[])
    : record.components;

  const full: DigestRecord = { date, timestamp, ...record, components };
  // 30-day TTL — keeps a full month of digests, then expires automatically
  await redis.set(digestKey(date), JSON.stringify(full), "EX", 60 * 60 * 24 * 30);
  return full;
}

// Reads a digest by date (YYYY-MM-DD). Returns null if not found.
export async function getDigest(date: string): Promise<DigestRecord | null> {
  const raw = await redis.get(digestKey(date));
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// Returns the most recently saved digest, or null if none exist.
export async function getLatestDigest(): Promise<DigestRecord | null> {
  const dates = await listDigests();
  if (dates.length === 0) return null;
  return getDigest(dates[0]);
}

// Returns all digest dates as YYYY-MM-DD strings, sorted newest-first.
export async function listDigests(): Promise<string[]> {
  const keys = await redis.keys("digest:*");
  return keys
    .map((k) => k.replace("digest:", ""))
    .sort()
    .reverse();
}
