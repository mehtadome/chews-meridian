import { withAuth } from "@/lib/auth";
import { listTrades, saveTrade } from "@/lib/trades";
import { TradeCreateSchema } from "@/lib/trade-types";

export async function GET(req: Request) {
  const { error } = await withAuth(req);
  if (error) return error;

  const trades = await listTrades();
  return Response.json(trades);
}

export async function POST(req: Request) {
  const { error } = await withAuth(req);
  if (error) return error;

  const body = await req.json().catch(() => null);
  const result = TradeCreateSchema.safeParse(body);
  if (!result.success) {
    return Response.json({ error: result.error.flatten() }, { status: 400 });
  }

  const trade = await saveTrade(result.data);
  return Response.json(trade, { status: 201 });
}
