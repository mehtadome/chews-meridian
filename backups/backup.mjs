#!/usr/bin/env node
// Redis backup — PL Tracker + Market Analyzer
// Usage: node backups/backup.mjs
// Output: backups/redis-YYYYMMDD-HHMMSS.json

import Redis from "ioredis";
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dir = dirname(fileURLToPath(import.meta.url));

// Load REDIS_URL from .env.local
const envPath = join(__dir, "../.env.local");
const envLine = readFileSync(envPath, "utf8")
  .split("\n")
  .find(l => l.startsWith("REDIS_URL="));
if (!envLine) { console.error("REDIS_URL not found in .env.local"); process.exit(1); }
const REDIS_URL = envLine.split("=").slice(1).join("=").replace(/^"|"$/g, "").trim();

const redis = new Redis(REDIS_URL);

// Key groups to capture
const PL_PATTERNS    = ["trades:index", "trades:v", "trade:*"];
const MA_PATTERNS    = ["digest:*", "helios:*", "pl:summary:cache", "usage:*", "google:*"];
const AUTH_PATTERNS  = ["session:*", "guest:*"];

async function scanKeys(pattern) {
  if (!pattern.includes("*")) {
    const exists = await redis.exists(pattern);
    return exists ? [pattern] : [];
  }
  const keys = [];
  let cursor = "0";
  do {
    const [next, batch] = await redis.scan(cursor, "MATCH", pattern, "COUNT", 100);
    keys.push(...batch);
    cursor = next;
  } while (cursor !== "0");
  return keys;
}

async function dumpKey(key) {
  const type = await redis.type(key);
  const ttl  = await redis.ttl(key);
  let value;
  if (type === "string") value = await redis.get(key);
  else if (type === "list") value = await redis.lrange(key, 0, -1);
  else if (type === "hash") value = await redis.hgetall(key);
  else if (type === "set")  value = await redis.smembers(key);
  else if (type === "zset") value = await redis.zrange(key, 0, -1, "WITHSCORES");
  return { type, ttl, value };
}

console.log("Connecting to Redis...");

const allPatterns = [...PL_PATTERNS, ...MA_PATTERNS, ...AUTH_PATTERNS];
const allKeys = new Set();
for (const pattern of allPatterns) {
  const keys = await scanKeys(pattern);
  keys.forEach(k => allKeys.add(k));
}

console.log(`Found ${allKeys.size} keys. Dumping...`);

const dump = { createdAt: new Date().toISOString(), keyCount: allKeys.size, data: {} };
for (const key of allKeys) {
  dump.data[key] = await dumpKey(key);
}

const ts = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 15);
const outPath = join(__dir, `redis-${ts}.json`);
writeFileSync(outPath, JSON.stringify(dump, null, 2));

const kb = (Buffer.byteLength(JSON.stringify(dump)) / 1024).toFixed(1);
console.log(`\nBackup saved: ${outPath}`);
console.log(`  ${allKeys.size} keys  |  ${kb} KB`);

// Print summary by category
const tradeKeys  = [...allKeys].filter(k => k.startsWith("trade:") || k.startsWith("trades:"));
const digestKeys = [...allKeys].filter(k => k.startsWith("digest:") || k.startsWith("helios:"));
const otherKeys  = [...allKeys].filter(k => !tradeKeys.includes(k) && !digestKeys.includes(k));
console.log(`  PL Tracker:      ${tradeKeys.length} keys`);
console.log(`  Market Analyzer: ${digestKeys.length} keys`);
console.log(`  Other:           ${otherKeys.length} keys`);

redis.disconnect();
