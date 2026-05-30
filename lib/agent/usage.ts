import { redis } from "@/lib/redis";
import { INPUT_COST_PER_TOKEN, OUTPUT_COST_PER_TOKEN } from "@/lib/config";

// All values stored as integers scaled by 1e9 to avoid float precision issues with INCRBYFLOAT.
const SCALE = 1_000_000_000;

// Atomically increments usage counters — safe under concurrent requests.
// INCR/INCRBY on Redis is atomic, eliminating the read-modify-write race in the old file-based approach.
// Pass product to also accumulate a per-product cost key (usage:ma:costUsd / usage:pl:costUsd).
export async function recordUsage(inputTokens: number, outputTokens: number, product?: "ma" | "pl"): Promise<void> {
  const cost = inputTokens * INPUT_COST_PER_TOKEN + outputTokens * OUTPUT_COST_PER_TOKEN;
  const costScaled = Math.round(cost * SCALE);
  const ops: Promise<unknown>[] = [
    redis.incrby("usage:inputTokens", inputTokens),
    redis.incrby("usage:outputTokens", outputTokens),
    redis.incrby("usage:costUsd", costScaled),
    redis.incr("usage:sessionCount"),
  ];
  if (product) ops.push(redis.incrby(`usage:${product}:costUsd`, costScaled));
  await Promise.all(ops);
}

export async function getUsage(): Promise<{
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCostUsd: number;
  sessionCount: number;
}> {
  const [input, output, cost, sessions] = await Promise.all([
    redis.get("usage:inputTokens"),
    redis.get("usage:outputTokens"),
    redis.get("usage:costUsd"),
    redis.get("usage:sessionCount"),
  ]);
  return {
    totalInputTokens: parseInt(input ?? "0", 10),
    totalOutputTokens: parseInt(output ?? "0", 10),
    totalCostUsd: parseInt(cost ?? "0", 10) / SCALE,
    sessionCount: parseInt(sessions ?? "0", 10),
  };
}

export async function getProductCost(product: "ma" | "pl"): Promise<number> {
  const val = await redis.get(`usage:${product}:costUsd`);
  return val ? parseInt(val as string, 10) / SCALE : 0;
}
