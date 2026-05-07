import { withAuth } from "@/lib/auth";

export async function GET(req: Request) {
  const { session, error } = await withAuth(req);
  if (error) return error;
  return Response.json({ session });
}
