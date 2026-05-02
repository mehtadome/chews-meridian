import Redis from "ioredis";

const REDIS_URL = process.env.REDIS_URL;

if (!REDIS_URL) {
  throw new Error("REDIS_URL is not set in environment variables");
}

// Global singleton — reused across hot reloads in dev and warm Lambda invocations in prod.
// Without this, every module import would open a new TCP connection.
const globalForRedis = globalThis as typeof globalThis & { redis?: Redis };

export const redis = globalForRedis.redis ?? new Redis(REDIS_URL, {
  maxRetriesPerRequest: 3,
  lazyConnect: false,
});

globalForRedis.redis = redis;
