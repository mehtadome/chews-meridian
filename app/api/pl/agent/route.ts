import { generateText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { withAuth } from "@/lib/auth";
import { listTrades } from "@/lib/trades";
import { fetchCurrentPrices } from "@/lib/market-data";
import { MODEL_ID } from "@/lib/config";
import { recordUsage } from "@/lib/usage";
import { redis } from "@/lib/redis";

const SUMMARY_CACHE_KEY = "pl:summary:cache";

type SummaryCache = { text: string; version: number; month: string };

function computePnl(trade: { entryPrice: number; exitPrice: number | null; markPrice: number | null; quantity: number; multiplier: number; direction: string }, currentPrice?: number): number | null {
  const exitPrice = trade.exitPrice ?? currentPrice ?? trade.markPrice;
  if (exitPrice == null) return null;
  const dir = trade.direction === "long" ? 1 : -1;
  return (exitPrice - trade.entryPrice) * trade.quantity * trade.multiplier * dir;
}

export async function GET(req: Request) {
  const { error } = await withAuth(req);
  if (error) return error;

  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  // Check cache before doing any heavy work
  const [cachedRaw, versionRaw] = await Promise.all([
    redis.get(SUMMARY_CACHE_KEY),
    redis.get("trades:v"),
  ]);
  const currentVersion = parseInt(versionRaw ?? "0", 10);

  if (cachedRaw) {
    const cached: SummaryCache = typeof cachedRaw === "string" ? JSON.parse(cachedRaw) : cachedRaw as SummaryCache;
    if (cached.version === currentVersion && cached.month === month) {
      return Response.json({ summary: cached.text, cached: true });
    }
  }

  const trades = await listTrades();
  const monthStart = `${month}-01`;

  const closedThisMonth = trades.filter((t) => t.exitDate && t.exitDate >= monthStart);
  const open = trades.filter((t) => !t.exitDate);

  const openSymbols = open.map((t) => t.symbol);
  const prices = await fetchCurrentPrices(openSymbols);

  const monthlyGains = closedThisMonth.reduce((sum, t) => {
    const pnl = computePnl(t);
    return pnl !== null ? sum + pnl : sum;
  }, 0);

  const openLines = open.map((t) => {
    const currentPrice = prices[t.symbol];
    const pnl = computePnl(t, currentPrice);
    const pnlStr = pnl !== null ? `${pnl >= 0 ? "+" : ""}$${pnl.toFixed(2)}` : "P&L unknown";
    const priceStr = currentPrice != null ? ` @ $${currentPrice.toFixed(2)}` : "";
    return `${t.symbol} (${t.direction})${priceStr}: ${pnlStr}`;
  }).join("\n");

  const prompt = open.length > 0
    ? `Trading summary for ${now.toLocaleString("en-US", { month: "long", year: "numeric" })}:\n\nRealized gains this month: ${monthlyGains >= 0 ? "+" : ""}$${monthlyGains.toFixed(2)}\n\nOpen positions:\n${openLines}\n\nWrite a concise 2-sentence summary of this trading state. Be direct and specific with the numbers.`
    : `Trading summary for ${now.toLocaleString("en-US", { month: "long", year: "numeric" })}:\n\nRealized gains this month: ${monthlyGains >= 0 ? "+" : ""}$${monthlyGains.toFixed(2)}\nNo open positions.\n\nWrite a single sentence summarizing this month's performance.`;

  const { text, usage } = await generateText({
    model: anthropic(MODEL_ID),
    prompt,
  });

  await Promise.all([
    recordUsage(usage.inputTokens ?? 0, usage.outputTokens ?? 0, "pl"),
    redis.set(SUMMARY_CACHE_KEY, JSON.stringify({ text, version: currentVersion, month })),
  ]);

  return Response.json({ summary: text, cached: false });
}
