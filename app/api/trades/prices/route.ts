import { withAuth } from "@/lib/auth";
import { fetchCurrentPrices } from "@/lib/schwab/market-data";

export async function GET(req: Request) {
  const { error } = await withAuth(req);
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const raw = searchParams.get("symbols") ?? "";
  // cap at 25 to prevent unbounded upstream requests
  const symbols = raw.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 25);

  const prices = await fetchCurrentPrices(symbols);
  return Response.json(prices);
}
