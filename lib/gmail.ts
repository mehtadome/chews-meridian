import { google } from "googleapis";
import { gmail_v1 } from "googleapis";
import { redis } from "./redis";

const BODY_CHAR_LIMIT = 8000;
const REDIS_TOKEN_KEY = "google:refresh_token";

const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN } = process.env;

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
  throw new Error("Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET");
}

// Cached after first resolution — cleared on process restart (dev server restart / Lambda cold start).
let gmail: ReturnType<typeof google.gmail> | null = null;

async function getGmail() {
  if (gmail) return gmail;

  let refreshToken: string | null = null;
  try {
    refreshToken = await redis.get(REDIS_TOKEN_KEY);
  } catch {
    // Redis unavailable — fall through to env var
  }
  refreshToken ??= GOOGLE_REFRESH_TOKEN ?? null;

  if (!refreshToken) {
    throw new Error("No Google refresh token found in Redis or GOOGLE_REFRESH_TOKEN env var");
  }

  const oauth2Client = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET);
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  gmail = google.gmail({ version: "v1", auth: oauth2Client });
  return gmail;
}

export interface EmailSummary {
  id: string;
  subject: string;
  sender: string;
}

export interface EmailContent {
  id: string;
  subject: string;
  sender: string;
  body: string;
}

/**
 * Search Gmail for emails matching a query string.
 * Returns lightweight stubs (id, subject, sender) — no body.
 */
export async function searchEmails(
  query: string,
  maxResults: number = 1
): Promise<EmailSummary[]> {
  const gmail = await getGmail();
  const listRes = await gmail.users.messages.list({
    userId: "me",
    q: query,
    maxResults,
  });

  const stubs = listRes.data.messages ?? [];
  const results: EmailSummary[] = [];

  for (const stub of stubs) {
    if (!stub.id) continue;
    // format: "metadata" skips the body entirely — cheaper than "full", enough to identify the email
    const msg = await gmail.users.messages.get({
      userId: "me",
      id: stub.id,
      format: "metadata",
      metadataHeaders: ["Subject", "From"],
    });
    const headers = indexHeaders(msg.data.payload?.headers ?? []);
    results.push({
      id: stub.id,
      subject: headers["subject"] ?? "(no subject)",
      sender: headers["from"] ?? "",
    });
  }

  return results;
}

/**
 * Fetch the full plain-text body of an email by message ID.
 */
export async function getEmail(messageId: string): Promise<EmailContent> {
  const gmail = await getGmail();
  const msg = await gmail.users.messages.get({
    userId: "me",
    id: messageId,
    format: "full",
  });

  const headers = indexHeaders(msg.data.payload?.headers ?? []);
  const body = extractBody(msg.data.payload ?? {});

  return {
    id: messageId,
    subject: headers["subject"] ?? "(no subject)",
    sender: headers["from"] ?? "",
    body: (body || msg.data.snippet || "").slice(0, BODY_CHAR_LIMIT),
  };
}

// --- helpers ---

// Converts the Gmail headers array into a lowercase-keyed map for easy lookup.
// Gmail returns headers as [{ name: "Subject", value: "Markets Today" }, { name: "From", value: "..." }]
// rather than a plain object because headers can repeat (e.g. multiple "Received" entries).
function indexHeaders(
  headers: gmail_v1.Schema$MessagePartHeader[]
): Record<string, string> {
  return Object.fromEntries(
    headers.map((h) => [h.name?.toLowerCase() ?? "", h.value ?? ""])
  );
}

// Recursively walks a MIME message tree to find and decode the plain-text part
function extractBody(payload: gmail_v1.Schema$MessagePart): string {
  const mime = payload.mimeType ?? "";

  if (mime === "text/plain") {
    const data = payload.body?.data;
    if (data) return Buffer.from(data, "base64").toString("utf-8");
  }

  for (const part of payload.parts ?? []) {
    const result = extractBody(part);
    if (result) return result;
  }

  return "";
}
