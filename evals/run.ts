import fs from "fs";
import path from "path";
import { config } from "dotenv";
// Loads .env.local so ANTHROPIC_API_KEY is available outside the Next.js runtime
config({ path: path.join(__dirname, "../.env.local") });
import { generateText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { buildSystemPrompt } from "@/lib/systemPrompt";
const systemPrompt = buildSystemPrompt(Date.now() - 30 * 24 * 60 * 60 * 1000);
import { parseMood, parseComponents } from "@/lib/parseResponse";

const FIXTURES_DIR = path.join(__dirname, "fixtures");
const RUBRICS_DIR = path.join(__dirname, "rubrics");

interface Assertion {
  id: string;
  description: string;
  check: string;
  type?: string;
  field?: string;
  expected: unknown;
}

interface Rubric {
  fixture: string;
  description: string;
  assertions: Assertion[];
}

interface ComponentSpec {
  type: string;
  data: Record<string, unknown>;
}

// Traverses a dot-notation path (e.g. "data.severity") on an object and returns the value
function getNestedField(obj: Record<string, unknown>, fieldPath: string): unknown {
  return fieldPath.split(".").reduce((acc: unknown, key) => {
    if (acc && typeof acc === "object") return (acc as Record<string, unknown>)[key];
    return undefined;
  }, obj);
}

// Runs a single assertion against the model's parsed output. Five check types:
//   mood_one_of        — is the mood in a list of allowed values?
//   component_count    — does exactly N of a given type exist?
//   component_min_count — does at least N exist?
//   component_field    — does the first matching component have a specific field value?
//   valid_types        — are all component types from the registered set?
function evaluate(assertion: Assertion, mood: string, components: ComponentSpec[]): { pass: boolean; reason: string } {
  switch (assertion.check) {
    case "mood_one_of": {
      const pass = (assertion.expected as string[]).includes(mood);
      return { pass, reason: pass ? `mood="${mood}"` : `mood="${mood}" not in [${(assertion.expected as string[]).join(", ")}]` };
    }
    case "component_count": {
      const count = components.filter((c) => c.type === assertion.type).length;
      const pass = count === assertion.expected;
      return { pass, reason: pass ? `found ${count}x ${assertion.type}` : `expected ${assertion.expected}x ${assertion.type}, got ${count}` };
    }
    case "component_min_count": {
      const count = components.filter((c) => c.type === assertion.type).length;
      const pass = count >= (assertion.expected as number);
      return { pass, reason: pass ? `found ${count}x ${assertion.type}` : `expected >=${assertion.expected}x ${assertion.type}, got ${count}` };
    }
    case "component_field": {
      const match = components.find((c) => c.type === assertion.type);
      if (!match) return { pass: false, reason: `no ${assertion.type} component found` };
      const value = getNestedField(match as unknown as Record<string, unknown>, assertion.field!);
      const pass = value === assertion.expected;
      return { pass, reason: pass ? `${assertion.field}="${value}"` : `${assertion.field}="${value}", expected "${assertion.expected}"` };
    }
    case "valid_types": {
      const allowed = new Set(assertion.expected as string[]);
      const invalid = components.filter((c) => !allowed.has(c.type)).map((c) => c.type);
      const pass = invalid.length === 0;
      return { pass, reason: pass ? "all types valid" : `invalid types: ${invalid.join(", ")}` };
    }
    default:
      return { pass: false, reason: `unknown check: ${assertion.check}` };
  }
}

// Sends the fixture text to Claude as a fake newsletter message, parses the response,
// then runs every rubric assertion and prints pass/fail results
async function runFixture(fixtureName: string, rubric: Rubric) {
  const fixturePath = path.join(FIXTURES_DIR, fixtureName);
  const newsletterText = fs.readFileSync(fixturePath, "utf-8");

  console.log(`\n${"─".repeat(60)}`);
  console.log(`Fixture: ${fixtureName}`);
  console.log(`Scenario: ${rubric.description}`);
  console.log(`${"─".repeat(60)}`);

  // generateText (not streamText) — no streaming needed in evals, just the final response
  const { text } = await generateText({
    model: anthropic("claude-haiku-4-5-20251001"),
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: `Here is today's newsletter content retrieved from Gmail:\n\n${newsletterText}\n\nNow produce the analysis.`,
      },
    ],
  });

  const mood = parseMood(text);
  const components = parseComponents(text) as ComponentSpec[];

  console.log(`Mood: ${mood} | Components: ${components.map((c) => c.type).join(", ")}\n`);

  let passed = 0;
  let failed = 0;

  for (const assertion of rubric.assertions) {
    const { pass, reason } = evaluate(assertion, mood, components);
    const icon = pass ? "✓" : "✗";
    console.log(`  ${icon} [${assertion.id}] ${assertion.description}`);
    if (!pass) console.log(`      → ${reason}`);
    pass ? passed++ : failed++;
  }

  console.log(`\nResult: ${passed}/${passed + failed} passed${failed > 0 ? ` (${failed} failed)` : ""}`);
  return { passed, failed };
}

// Entry point — reads all rubric files, runs each fixture, exits with code 1 if any assertion failed
async function main() {
  const rubricFiles = fs.readdirSync(RUBRICS_DIR).filter((f) => f.endsWith(".json"));

  if (rubricFiles.length === 0) {
    console.log("No rubrics found in evals/rubrics/");
    process.exit(1);
  }

  console.log(`Running ${rubricFiles.length} fixture(s)...\n`);

  let totalPassed = 0;
  let totalFailed = 0;

  for (const rubricFile of rubricFiles) {
    const rubric: Rubric = JSON.parse(fs.readFileSync(path.join(RUBRICS_DIR, rubricFile), "utf-8"));
    const { passed, failed } = await runFixture(rubric.fixture, rubric);
    totalPassed += passed;
    totalFailed += failed;
  }

  console.log(`\n${"═".repeat(60)}`);
  console.log(`Total: ${totalPassed}/${totalPassed + totalFailed} assertions passed`);
  if (totalFailed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
