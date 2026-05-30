import { createInterface } from "readline";
import { readFileSync } from "fs";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split("\n")
    .filter(l => l.trim() && !l.startsWith("#"))
    .map(l => [l.split("=")[0].trim(), l.slice(l.indexOf("=") + 1).trim()])
);

const CLIENT_ID = env.SCHWAB_CLIENT_ID;
const CLIENT_SECRET = env.SCHWAB_CLIENT_SECRET;
const REDIRECT_URI = env.SCHWAB_REDIRECT_URI ?? "https://127.0.0.1";

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("Missing SCHWAB_CLIENT_ID or SCHWAB_CLIENT_SECRET in .env.local");
  process.exit(1);
}

const authUrl =
  `https://api.schwabapi.com/v1/oauth/authorize` +
  `?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;

console.log("\n1. Open this URL in your browser:\n");
console.log(authUrl);
console.log("\n2. Log in with your Schwab account and approve the app.");
console.log("3. You'll be redirected to https://127.0.0.1?code=... (page will fail — that's fine).");
console.log("4. Copy the full URL from the address bar and paste it below.\n");

const rl = createInterface({ input: process.stdin, output: process.stdout });
rl.question("Paste the redirect URL: ", async (redirected) => {
  rl.close();

  let code;
  try {
    code = new URL(redirected).searchParams.get("code");
  } catch {
    console.error("Invalid URL"); process.exit(1);
  }
  if (!code) { console.error("No code in URL"); process.exit(1); }

  const res = await fetch("https://api.schwabapi.com/v1/oauth/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ grant_type: "authorization_code", code, redirect_uri: REDIRECT_URI }),
  });

  if (!res.ok) { console.error("Token exchange failed:", res.status, await res.text()); process.exit(1); }

  const { refresh_token } = await res.json();
  console.log("\nAdd this to your .env.local:\n");
  console.log(`SCHWAB_REFRESH_TOKEN=${refresh_token}`);
  console.log("\nRefresh token rotates on every use — 7-day expiry resets each time.");
});
