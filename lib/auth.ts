import { redis } from "@/lib/redis";

export type Session = "owner" | "guest";

interface GuestCode {
  expiresAt: string;
  usesLeft: number;
}

export async function getSession(cookieValue: string | undefined): Promise<Session | null> {
  if (!cookieValue) return null;

  if (cookieValue === process.env.OWNER_TOKEN) return "owner";

  if (cookieValue.startsWith("guest:")) {
    const code = cookieValue.slice(6);
    const raw = await redis.get(`guest:${code}`);
    if (!raw) return null;
    const data: GuestCode = JSON.parse(raw);
    if (new Date(data.expiresAt) < new Date()) return null;
    if (data.usesLeft <= 0) return null;
    return "guest";
  }

  return null;
}

// Parses cm_session from a Request's Cookie header and returns the session type.
// Returns a 401 Response if invalid — API routes return this directly, null means OK.
export async function withAuth(req: Request): Promise<{ session: Session; error: null } | { session: null; error: Response }> {
  const cookieHeader = req.headers.get("cookie") ?? "";
  const match = cookieHeader.match(/(?:^|;\s*)cm_session=([^;]+)/);
  const cookieValue = match?.[1];
  const session = await getSession(cookieValue);
  if (!session) {
    return { session: null, error: new Response("Unauthorized", { status: 401 }) };
  }
  return { session, error: null };
}
