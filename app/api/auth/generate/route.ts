import { withAuth } from "@/lib/auth";
import { redis } from "@/lib/redis";

const VALID_HOURS = [1, 6, 12, 24, 48] as const;
const MAX_USES = 5;

function randomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789"; // no ambiguous chars (0/O, 1/I/l)
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export async function POST(req: Request) {
  const { session, error } = await withAuth(req);
  if (error) return error;
  if (session !== "owner") return new Response("Forbidden", { status: 403 });

  const body = await req.json().catch(() => ({}));
  const hours: number = VALID_HOURS.includes(body.hours) ? body.hours : 1;
  const ttlSeconds = hours * 60 * 60;

  const code = randomCode();
  const payload = JSON.stringify({
    expiresAt: new Date(Date.now() + ttlSeconds * 1000).toISOString(),
    usesLeft: MAX_USES,
  });

  await redis.set(`guest:${code}`, payload, "EX", ttlSeconds);

  return Response.json({ code, hours });
}
