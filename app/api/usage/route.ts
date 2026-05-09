import { getUsage, getProductCost } from "@/lib/usage";
import { withAuth } from "@/lib/auth";

export async function GET(req: Request) {
  const { error } = await withAuth(req);
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const product = searchParams.get("product");

  if (product === "pl" || product === "ma") {
    const total = await getProductCost(product);
    return Response.json({ total });
  }

  return Response.json(await getUsage());
}
