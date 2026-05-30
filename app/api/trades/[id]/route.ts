import { withAuth } from "@/lib/auth";
import { getTrade, updateTrade } from "@/lib/pl/trades";
import { TradeUpdateSchema } from "@/lib/pl/trade-types";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await withAuth(req);
  if (error) return error;

  const { id } = await params;
  const trade = await getTrade(id);
  if (!trade) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(trade);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await withAuth(req);
  if (error) return error;

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const result = TradeUpdateSchema.safeParse({ ...body, id });
  if (!result.success) {
    return Response.json({ error: result.error.flatten() }, { status: 400 });
  }

  const trade = await updateTrade(result.data);
  if (!trade) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(trade);
}
