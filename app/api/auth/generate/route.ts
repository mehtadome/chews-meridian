import { withAuth } from "@/lib/auth";
import { redis } from "@/lib/redis";

const ONE_HOUR_S = 60 * 60;
const ONE_HOUR_MS = ONE_HOUR_S * 1000;
const MAX_USES = 5;

function randomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789"; // no ambiguous chars (0/O, 1/I/l)
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export async function POST(req: Request) {
  const { session, error } = await withAuth(req);
  if (error) return error;
  if (session !== "owner") return new Response("Forbidden", { status: 403 });

  const code = randomCode();
  const payload = JSON.stringify({
    expiresAt: new Date(Date.now() + ONE_HOUR_MS).toISOString(),
    usesLeft: MAX_USES,
  });

  await redis.set(`guest:${code}`, payload, "EX", ONE_HOUR_S);

  return Response.json({ code });
}
