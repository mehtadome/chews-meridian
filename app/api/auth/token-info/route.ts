import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";

export async function GET() {
  const issuedAt =
    (await redis.get("google:token_issued_at")) ??
    process.env.GOOGLE_TOKEN_ISSUED_AT ??
    null;
  return NextResponse.json({ issuedAt });
}
