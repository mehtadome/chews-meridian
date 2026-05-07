import { withAuth } from "@/lib/auth";
import { fetchCurrentPrices } from "@/lib/market-data";

export async function GET(req: Request) {
  const { error } = await withAuth(req);
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const raw = searchParams.get("symbols") ?? "";
  const symbols = raw.split(",").map((s) => s.trim()).filter(Boolean);

  const prices = await fetchCurrentPrices(symbols);
  return Response.json(prices);
}
