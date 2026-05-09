#!/usr/bin/env node
/**
 * Interactive trade deletion script.
 * Lists all trades then prompts for IDs to delete.
 *
 * Usage:
 *   node scripts/delete-trades.mjs
 *
 * Requires REDIS_URL in .env.local.
 */

import { createRequire } from "module";
import { readFileSync } from "fs";
import { createInterface } from "readline";
import { resolve } from "path";

const envPath = resolve(process.cwd(), ".env.local");
const env = readFileSync(envPath, "utf8");
for (const line of env.split("\n")) {
  const [key, ...rest] = line.split("=");
  if (key && rest.length) {
    const val = rest.join("=").trim().replace(/^["']|["']$/g, "");
    process.env[key.trim()] = val;
  }
}

const require = createRequire(import.meta.url);
const Redis = require("ioredis");
const redis = new Redis(process.env.REDIS_URL);

// List all trades
const ids = await redis.lrange("trades:index", 0, -1);
if (ids.length === 0) {
  console.log("No trades found.");
  redis.disconnect();
  process.exit(0);
}

console.log("\nID                Symbol   Entry       Exit");
console.log("──────────────────────────────────────────────");
for (const id of ids) {
  const raw = await redis.get(`trade:${id}`);
  if (!raw) continue;
  const t = JSON.parse(raw);
  console.log(`${id}   ${t.symbol.padEnd(8)} ${t.entryDate}   ${t.exitDate ?? "open"}`);
}

// Prompt for IDs to delete
const rl = createInterface({ input: process.stdin, output: process.stdout });
const answer = await new Promise((resolve) =>
  rl.question("\nEnter IDs to delete (space-separated), or press Enter to cancel: ", resolve)
);
rl.close();

const toDelete = answer.trim().split(/\s+/).filter(Boolean);
if (toDelete.length === 0) {
  console.log("Nothing deleted.");
  redis.disconnect();
  process.exit(0);
}

console.log("");
for (const id of toDelete) {
  const exists = await redis.exists(`trade:${id}`);
  if (!exists) {
    console.log(`  SKIP    ${id} — not found`);
    continue;
  }
  await redis.del(`trade:${id}`);
  await redis.lrem("trades:index", 0, id);
  console.log(`  DELETED ${id}`);
}

await redis.incr("trades:v");
console.log("\ntrades:v incremented — PL summary cache invalidated");
redis.disconnect();
