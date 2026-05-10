import { redis } from "@/lib/redis";
import { randomBytes } from "crypto";

const SESSION_TTL = 60 * 60 * 24 * 365; // 1 year

export type Session = "owner" | "guest";

interface GuestCode {
  expiresAt: string;
  usesLeft: number;
}

export async function getSession(cookieValue: string | undefined): Promise<Session | null> {
  if (!cookieValue) return null;

  const sessionType = await redis.get(`session:${cookieValue}`);
  if (sessionType === "owner") return "owner";

  const raw = await redis.get(`guest:${cookieValue}`);
  if (!raw) return null;
  const data: GuestCode = JSON.parse(raw as string);
  if (!data.expiresAt || isNaN(new Date(data.expiresAt).getTime())) return null;
  if (new Date(data.expiresAt) < new Date()) return null;
  if (data.usesLeft <= 0) return null;
  return "guest";
}

// Generates an opaque session ID, stores it in Redis, and returns it for use as the cookie value.
export async function createOwnerSession(): Promise<string> {
  const id = randomBytes(32).toString("hex");
  await redis.set(`session:${id}`, "owner", "EX", SESSION_TTL);
  return id;
}

const DECREMENT_SCRIPT = `
local raw = redis.call('GET', KEYS[1])
if not raw then return 0 end
local data = cjson.decode(raw)
if data.usesLeft <= 0 then return 0 end
data.usesLeft = data.usesLeft - 1
local ttl = redis.call('TTL', KEYS[1])
if ttl > 0 then
  redis.call('SET', KEYS[1], cjson.encode(data), 'EX', ttl)
else
  redis.call('SET', KEYS[1], cjson.encode(data))
end
return 1
`;

// Atomically decrements usesLeft for a guest code. Returns false if exhausted or missing.
export async function decrementGuestUse(code: string): Promise<boolean> {
  const result = await redis.eval(DECREMENT_SCRIPT, 1, `guest:${code}`);
  return result === 1;
}

// Parses cm_session from a Request's Cookie header and returns the session type.
// Also returns the raw cookie value so callers can pass it to decrementGuestUse without re-parsing.
export async function withAuth(req: Request): Promise<
  | { session: Session; guestCode: string | undefined; error: null }
  | { session: null; guestCode: undefined; error: Response }
> {
  const cookieHeader = req.headers.get("cookie") ?? "";
  const match = cookieHeader.match(/(?:^|;\s*)cm_session=([^;]+)/);
  const cookieValue = match?.[1];
  const session = await getSession(cookieValue);
  if (!session) {
    return { session: null, guestCode: undefined, error: new Response("Unauthorized", { status: 401 }) };
  }
  return { session, guestCode: session === "guest" ? cookieValue : undefined, error: null };
}
