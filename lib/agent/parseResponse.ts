import { z } from "zod";

export type Mood = "normal" | "alert" | "opportunity" | "danger";

// ── Component schemas ────────────────────────────────────────────────────────

const BriefingSummarySchema = z.object({
  type: z.literal("BriefingSummary"),
  data: z.object({ headline: z.string(), body: z.string() }),
});

const MacroSummaryCardSchema = z.object({
  type: z.literal("MacroSummaryCard"),
  data: z.object({
    title: z.string(),
    summary: z.string(),
    indicators: z.array(z.object({ label: z.string(), value: z.string() })).optional(),
  }),
});

const TickerMentionListSchema = z.object({
  type: z.literal("TickerMentionList"),
  data: z.object({
    tickers: z.array(
      z.object({
        symbol: z.string(),
        context: z.string().default(""),
        direction: z.enum(["up", "down", "neutral"]).optional(),
      })
    ),
  }),
});

const SectorHeatmapSchema = z.object({
  type: z.literal("SectorHeatmap"),
  data: z.object({
    sectors: z.array(z.object({ name: z.string(), performance: z.string() })),
  }),
});

const EarningsHighlightSchema = z.object({
  type: z.literal("EarningsHighlight"),
  data: z.object({
    company: z.string(),
    result: z.enum(["beat", "miss", "inline"]),
    detail: z.string(),
  }),
});

const RiskFlagSchema = z.object({
  type: z.literal("RiskFlag"),
  data: z.object({
    headline: z.string(),
    detail: z.string(),
    severity: z.enum(["low", "medium", "high"]),
  }),
});

const NewsletterSummarySchema = z.object({
  type: z.literal("NewsletterSummary"),
  data: z.object({ title: z.string(), summary: z.string() }),
});

const DynamicChartSchema = z.object({
  type: z.literal("DynamicChart"),
  data: z.object({
    chartType: z.enum(["bar", "line", "pie", "area", "scatter"]),
    title: z.string(),
    description: z.string().optional(),
    xKey: z.string(),
    yKey: z.string(),
    colorBy: z.string().optional(),
    orientation: z.enum(["horizontal", "vertical"]).optional(),
    dataset: z.array(z.record(z.string(), z.unknown())),
    colors: z.record(z.string(), z.string()).optional(),
  }),
});

// Data structure used to hold values that can take on different types.
// Zod uses it to validate different possible types against their respective schemas.
const ComponentSchema = z.discriminatedUnion("type", [
  BriefingSummarySchema,
  MacroSummaryCardSchema,
  TickerMentionListSchema,
  SectorHeatmapSchema,
  EarningsHighlightSchema,
  RiskFlagSchema,
  NewsletterSummarySchema,
  DynamicChartSchema,
]);

export type DigestComponent = z.infer<typeof ComponentSchema>;

// ── Risk-first ordering ──────────────────────────────────────────────────────

// Risk-first card order. Lower index = higher priority.
// The model decides which cards appear and what's in them — the app decides where they sit.
// Without this, the model might bury a RiskFlag below a SectorHeatmap on a crisis day.
const COMPONENT_PRIORITY: Record<string, number> = {
  RiskFlag: 0,
  MacroSummaryCard: 1,
  BriefingSummary: 2,
  EarningsHighlight: 3,
  TickerMentionList: 4,
  SectorHeatmap: 5,
  NewsletterSummary: 6,
};

// Sorts components by COMPONENT_PRIORITY so the most urgent cards always render first
function sortByRisk(components: DigestComponent[]): DigestComponent[] {
  return [...components].sort((a, b) => {
    const pa = COMPONENT_PRIORITY[a.type] ?? 99; // unknown types sort to the end
    const pb = COMPONENT_PRIORITY[b.type] ?? 99;
    return pa - pb;
  });
}

// ── Parsers ──────────────────────────────────────────────────────────────────

// Pulls the ```json block out of the model's raw text response and parses it
function extractJson(content: string): Record<string, unknown> | null {
  const match = content.match(/```json\n([\s\S]*?)\n```/);
  if (!match) return null;
  try {
    return JSON.parse(match[1]);
  } catch {
    return null;
  }
}

// Extracts the mood field from the JSON block; defaults to "normal" if missing or unrecognized
export function parseMood(content: string): Mood {
  const parsed = extractJson(content);
  const mood = parsed?.mood;
  if (mood === "alert" || mood === "opportunity" || mood === "danger") return mood;
  return "normal";
}

// Validates each component against Zod schemas — malformed items are silently dropped.
// Then sorts by risk priority before returning.
export function parseComponents(content: string): DigestComponent[] {
  const parsed = extractJson(content);
  if (!Array.isArray(parsed?.components)) return [];
  const valid = (parsed.components as unknown[]).flatMap((c) => {
    const result = ComponentSchema.safeParse(c);
    return result.success ? [result.data] : [];
  });
  return sortByRisk(valid);
}

// Returns any text the model wrote before the JSON block (usually empty, but preserved just in case)
export function parseProse(content: string): string {
  const match = content.match(/```json/);
  if (match?.index === undefined) return content.trim();
  return content.slice(0, match.index).trim();
}
