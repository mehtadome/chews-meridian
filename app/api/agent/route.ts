import { streamText, convertToModelMessages, stepCountIs, UIMessage } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { tools } from "@/lib/tools";
import { recordUsage } from "@/lib/usage";
import { saveDigest, getLatestDigest } from "@/lib/digest";
import { setCached } from "@/lib/cache";
import { parseMood, parseComponents, parseProse } from "@/lib/parseResponse";
import { MODEL_ID, INPUT_COST_PER_TOKEN, OUTPUT_COST_PER_TOKEN } from "@/lib/config";
import { buildSystemPrompt } from "@/lib/systemPrompt";

// Best-effort single-stream guard. Works within a warm Lambda instance; won't block
// concurrent requests hitting separate Vercel invocations — a Redis SET NX mutex would fix that.
let isRunning = false;

export async function POST(req: Request) {
  if (isRunning) {
    return new Response(JSON.stringify({ error: "Briefing already in progress" }), {
      status: 429,
      headers: { "Content-Type": "application/json" },
    });
  }
  isRunning = true;

  const { messages }: { messages: UIMessage[] } = await req.json();

  // Anchor the Gmail search to the last digest's exact timestamp so the model reads everything
  // since the prior briefing with no rounding. Falls back to start of calendar month on first run.
  const latest = await getLatestDigest();
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
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
      isRunning = false;
      try {
        const inputTokens = usage.inputTokens ?? 0;
        const outputTokens = usage.outputTokens ?? 0;
        await recordUsage(inputTokens, outputTokens);
        const record = await saveDigest({
          mood: parseMood(text),
          prose: parseProse(text),
          components: parseComponents(text),
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
    onError: () => { isRunning = false; },
  });

  return result.toUIMessageStreamResponse();
}
