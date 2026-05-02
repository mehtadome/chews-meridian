import { listDigests, getDigest } from "@/lib/digest";

export interface TickerSummary {
  symbol: string;
  direction: "up" | "down" | "neutral";
  lastSeen: string; // YYYY-MM-DD
  mentions: number; // total across last 7 days
}

interface TickerSpec {
  symbol: string;
  direction?: "up" | "down" | "neutral";
  count?: number;
}

interface ComponentSpec {
  type: string;
  data: { tickers?: TickerSpec[] };
}

// Calls listDigests() to get all digest dates, filters out older than 7 days,
// then iterates over each digest, extracting TickerMentionList components and
// aggregating symbol mentions across all digests.
export async function GET() {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 7);
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  const dates = (await listDigests()).filter((d) => d >= cutoffStr);

  // symbol → aggregated data (direction = most recent since dates is newest-first)
  const map = new Map<string, TickerSummary>();

  for (const date of dates) {
    const digest = await getDigest(date);
    if (!digest) continue;
    for (const comp of digest.components as ComponentSpec[]) {
      if (comp.type !== "TickerMentionList") continue;
      for (const t of comp.data.tickers ?? []) {
        const existing = map.get(t.symbol);
        const occurrences = t.count ?? 1;
        if (existing) {
          existing.mentions += occurrences;
        } else {
          map.set(t.symbol, {
            symbol: t.symbol,
            direction: t.direction ?? "neutral",
            lastSeen: date,
            mentions: occurrences,
          });
        }
      }
    }
  }

  const tickers = Array.from(map.values()).sort((a, b) => b.mentions - a.mentions);
  return Response.json(tickers);
}
