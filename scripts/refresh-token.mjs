#!/usr/bin/env node
/**
 * Re-runs the Google OAuth consent flow and writes a fresh GOOGLE_REFRESH_TOKEN
 * plus a GOOGLE_TOKEN_ISSUED_AT timestamp to .env.local.
 *
 * Usage:
 *   node scripts/refresh-token.mjs
 */

import { createServer } from "http";
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { exec } from "child_process";
import { google } from "googleapis";
import Redis from "ioredis";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ENV_PATH = join(__dirname, "..", ".env.local");
const PORT = 4747;
const REDIRECT_URI = `http://localhost:${PORT}`;
const SCOPE = "https://www.googleapis.com/auth/gmail.readonly";

function parseEnv(content) {
  const vars = {};
  for (const line of content.split("\n")) {
    if (line.startsWith("#") || !line.includes("=")) continue;
    const [key, ...rest] = line.split("=");
    let value = rest.join("=").trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    vars[key.trim()] = value;
  }
  return vars;
}

// Updates an existing KEY=value line in-place, or appends it after GOOGLE_REFRESH_TOKEN.
function setEnvVar(content, key, value) {
  const line = `${key}=${value}`;
  const regex = new RegExp(`^${key}=.*`, "m");
  if (regex.test(content)) {
    return content.replace(regex, line);
  }
  if (/^GOOGLE_REFRESH_TOKEN=/m.test(content)) {
    return content.replace(/^(GOOGLE_REFRESH_TOKEN=.*)$/m, `$1\n${line}`);
  }
  return (content.endsWith("\n") ? content : content + "\n") + line + "\n";
}

const envContent = readFileSync(ENV_PATH, "utf-8");
const env = parseEnv(envContent);
const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = env;

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
  console.error("Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET in .env.local");
  process.exit(1);
}

const oauth2 = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, REDIRECT_URI);

const authUrl = oauth2.generateAuthUrl({
  access_type: "offline",
  prompt: "consent",
  scope: [SCOPE],
});

console.log("\n─────────────────────────────────────────────");
console.log("  Google OAuth Token Refresh");
console.log("─────────────────────────────────────────────");
console.log("Opening browser — sign in and grant access...\n");

exec(`open "${authUrl}"`);

const code = await new Promise((resolve, reject) => {
  const server = createServer((req, res) => {
    const url = new URL(req.url, REDIRECT_URI);
    const code = url.searchParams.get("code");
    const error = url.searchParams.get("error");
    res.writeHead(200, { "Content-Type": "text/html" });
    if (code) {
      res.end("<h2 style='font-family:sans-serif'>Authorization complete. You may close this tab.</h2>");
      server.close();
      resolve(code);
    } else {
      res.end(`<h2 style='font-family:sans-serif;color:red'>Authorization failed: ${error}</h2>`);
      server.close();
      reject(new Error(error ?? "No code returned"));
    }
  });
  server.listen(PORT, "localhost", () => {
    console.log(`Waiting for redirect on http://localhost:${PORT} ...`);
  });
});

const { tokens } = await oauth2.getToken(code);

if (!tokens.refresh_token) {
  console.error("\nNo refresh_token in response — this usually means the account already");
  console.error("has an active grant. Revoke access at https://myaccount.google.com/permissions");
  console.error("then re-run this script.\n");
  process.exit(1);
}

const issuedAt = new Date().toISOString();
const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

let updated = setEnvVar(envContent, "GOOGLE_REFRESH_TOKEN", tokens.refresh_token);
updated = setEnvVar(updated, "GOOGLE_TOKEN_ISSUED_AT", issuedAt);
writeFileSync(ENV_PATH, updated, "utf-8");
console.log("✓ .env.local updated");

if (env.REDIS_URL) {
  const redis = new Redis(env.REDIS_URL);
  await redis.set("google:refresh_token", tokens.refresh_token);
  await redis.set("google:token_issued_at", issuedAt);
  await redis.quit();
  console.log("✓ Redis updated");
} else {
  console.log("  (REDIS_URL not set — skipped Redis write)");
}

console.log(`\n  Issued:  ${issuedAt}`);
console.log(`  Expires: ${expiresAt}`);
console.log("\nRestart your dev server (npm run dev) for changes to take effect.\n");
