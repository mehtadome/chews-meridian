import { getUsage } from "@/lib/usage";
import { withAuth } from "@/lib/auth";

export async function GET(req: Request) {
  const { error } = await withAuth(req);
  if (error) return error;
  return Response.json(await getUsage());
}
