import { z } from "zod";
import { withAuth } from "@/lib/auth";
import { listTrades, updateTrade, saveTrade } from "@/lib/trades";
import { fifoClose } from "@/lib/position-utils";

const ClosePositionSchema = z.object({
  symbol: z.string().min(1),
  direction: z.enum(["long", "short"]),
  assetType: z.enum(["stock", "option", "future"]),
  qty: z.number().positive(),
  exitPrice: z.number().positive(),
  exitDate: z.string().min(1),
});

export async function POST(req: Request) {
  const { error } = await withAuth(req);
  if (error) return error;

  const body = await req.json().catch(() => null);
  const result = ClosePositionSchema.safeParse(body);
  if (!result.success) {
    return Response.json({ error: result.error.issues.map(i => i.message).join(", ") }, { status: 400 });
  }

  const { symbol, direction, assetType, qty, exitPrice, exitDate } = result.data;

  const all = await listTrades();
  const openGroup = all.filter(
    t => t.symbol === symbol &&
         t.direction === direction &&
         t.assetType === assetType &&
         t.exitDate === null,
  );

  if (openGroup.length === 0)
    return Response.json({ error: "no open trades found" }, { status: 404 });

  const totalQty = openGroup.reduce((sum, t) => sum + t.quantity, 0);
  if (qty > totalQty)
    return Response.json({ error: `qty ${qty} exceeds position size ${totalQty}` }, { status: 400 });

  const { toUpdate, toCreate } = fifoClose(openGroup, qty, exitPrice, exitDate);

  await Promise.all([
    ...toUpdate.map(u => updateTrade(u)),
    ...toCreate.map(t => saveTrade(t)),
  ]);

  return Response.json({ updated: toUpdate.length, created: toCreate.length });
}
