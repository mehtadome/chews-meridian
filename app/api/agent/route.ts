import { streamText, convertToModelMessages, stepCountIs, UIMessage } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { tools } from "@/lib/tools";
import { recordUsage } from "@/lib/usage";
import { saveDigest, getLatestDigest } from "@/lib/digest";
import { setCached } from "@/lib/cache";
import { parseMood, parseComponents, parseProse } from "@/lib/parseResponse";
import { MODEL_ID, INPUT_COST_PER_TOKEN, OUTPUT_COST_PER_TOKEN } from "@/lib/config";
import { buildSystemPrompt } from "@/lib/systemPrompt";
import { redis } from "@/lib/redis";
import { withAuth, decrementGuestUse } from "@/lib/auth";

const MUTEX_KEY = "briefing:running";
const MUTEX_TTL_SECONDS = 120; // safety net if onFinish/onError never fires

export async function POST(req: Request) {
  const { session, guestCode, error } = await withAuth(req);
  if (error) return error;

  if (session === "guest" && guestCode) {
    const ok = await decrementGuestUse(guestCode);
    if (!ok) return new Response(JSON.stringify({ error: "Guest uses exhausted" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  const acquired = await redis.set(MUTEX_KEY, "1", "EX", MUTEX_TTL_SECONDS, "NX");
  if (acquired === null) {
    return new Response(JSON.stringify({ error: "Briefing already in progress" }), {
      status: 429,
      headers: { "Content-Type": "application/json" },
    });
  }

  // release mutex before returning — req.json() can throw if body is malformed or client disconnected
  let messages: UIMessage[];
  try {
    ({ messages } = await req.json());
  } catch {
    await redis.del(MUTEX_KEY);
    return new Response(JSON.stringify({ error: "Invalid request body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Anchor the Gmail search to the last digest's exact timestamp so the model reads everything
  // since the prior briefing with no rounding. Falls back to start of calendar month on first run.
  const latest = await getLatestDigest();
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const sinceMs = latest ? new Date(latest.timestamp).getTime() : monthStart.getTime();
  const systemPrompt = buildSystemPrompt(sinceMs);

  const result = streamText({
    model: anthropic(MODEL_ID),
    // Cache the system prompt on Anthropic's servers — subsequent requests within 5 min
    // reuse the cached transformer state instead of re-processing ~1500 tokens from scratch
    providerOptions: {
      anthropic: { cacheControl: { type: "ephemeral" } },
    },
    system: systemPrompt,
    messages: await convertToModelMessages(messages),
    tools,
    stopWhen: stepCountIs(10),
    onFinish: async ({ text, usage }) => {
      await redis.del(MUTEX_KEY);
      try {
        const inputTokens = usage.inputTokens ?? 0;
        const outputTokens = usage.outputTokens ?? 0;
        await recordUsage(inputTokens, outputTokens, "ma");
        const components = parseComponents(text);
        if (components.length === 0) return;
        const record = await saveDigest({
          mood: parseMood(text),
          prose: parseProse(text),
          components,
          rawText: text,
          usage: {
            inputTokens,
            outputTokens,
            costUsd: inputTokens * INPUT_COST_PER_TOKEN + outputTokens * OUTPUT_COST_PER_TOKEN,
          },
        });
        setCached(record.date, record);
      } catch (e) {
        console.error("[agent] onFinish save failed", e);
      }
    },
    onError: async () => { await redis.del(MUTEX_KEY); },
  });

  return result.toUIMessageStreamResponse();
}
