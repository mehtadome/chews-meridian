import { getSession } from "@/lib/auth";

const ONE_YEAR = 60 * 60 * 24 * 365;
const ONE_HOUR = 60 * 60;

export async function POST(req: Request) {
  const { credential } = await req.json();
  if (!credential || typeof credential !== "string") {
    return new Response("Bad request", { status: 400 });
  }

  const session = await getSession(credential.trim());
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const maxAge = session === "owner" ? ONE_YEAR : ONE_HOUR;
  const cookie = [
    `cm_session=${credential.trim()}`,
    `Max-Age=${maxAge}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Strict",
    process.env.NODE_ENV === "production" ? "Secure" : "",
  ]
    .filter(Boolean)
    .join("; ");

  return new Response("OK", {
    status: 200,
    headers: { "Set-Cookie": cookie },
  });
}
