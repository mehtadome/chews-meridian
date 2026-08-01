#!/usr/bin/env node
/**
 * Full Redis backup → backups/redis-<timestamp>.json
 *
 * Read-only against Redis. Uses SCAN (never KEYS) and pipelines
 * type/ttl/value reads. Handles string, list, set, zset, hash.
 *
 * Usage:
 *   node scripts/backup-redis.mjs
 *
 * Requires REDIS_URL in .env.local.
 */

import { createRequire } from "module";
import { readFileSync, writeFileSync, mkdirSync } from "fs";
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

// SCAN the full keyspace
const keys = [];
let cursor = "0";
do {
  const [next, batch] = await redis.scan(cursor, "COUNT", 500);
  cursor = next;
  keys.push(...batch);
} while (cursor !== "0");

console.log(`Scanned ${keys.length} keys`);

// Read type + ttl for every key in one pipeline
const meta = redis.pipeline();
for (const k of keys) {
  meta.type(k);
  meta.ttl(k);
}
const metaRes = await meta.exec();

// Read values, dispatching per type
const vals = redis.pipeline();
const types = [];
for (let i = 0; i < keys.length; i++) {
  const type = metaRes[i * 2][1];
  types.push(type);
  const k = keys[i];
  if (type === "string") vals.get(k);
  else if (type === "list") vals.lrange(k, 0, -1);
  else if (type === "set") vals.smembers(k);
  else if (type === "zset") vals.zrange(k, 0, -1, "WITHSCORES");
  else if (type === "hash") vals.hgetall(k);
  else vals.echo(`__UNSUPPORTED__${type}`);
}
const valRes = await vals.exec();

const data = {};
const skipped = [];
for (let i = 0; i < keys.length; i++) {
  const value = valRes[i][1];
  if (typeof value === "string" && value.startsWith("__UNSUPPORTED__")) {
    skipped.push(`${keys[i]} (${types[i]})`);
    continue;
  }
  data[keys[i]] = { type: types[i], ttl: metaRes[i * 2 + 1][1], value };
}

const stamp = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14);
mkdirSync(resolve(process.cwd(), "backups"), { recursive: true });
const out = resolve(process.cwd(), `backups/redis-${stamp}.json`);
writeFileSync(
  out,
  JSON.stringify(
    { createdAt: new Date().toISOString(), keyCount: Object.keys(data).length, data },
    null,
    2
  )
);

console.log(`Wrote ${Object.keys(data).length} keys → backups/redis-${stamp}.json`);
if (skipped.length) console.log(`Skipped unsupported types:\n  ${skipped.join("\n  ")}`);
redis.disconnect();
