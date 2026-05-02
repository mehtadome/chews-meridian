"use client";

import { Component, type ReactNode } from "react";
import { MacroSummaryCard } from "@/components/ui/MacroSummaryCard";
import { TickerMentionList } from "@/components/ui/TickerMentionList";
import { SectorHeatmap } from "@/components/ui/SectorHeatmap";
import { EarningsHighlight } from "@/components/ui/EarningsHighlight";
import { RiskFlag } from "@/components/ui/RiskFlag";
import { NewsletterSummary } from "@/components/ui/NewsletterSummary";
import { BriefingSummary } from "@/components/ui/BriefingSummary";
import { DynamicChart } from "@/components/ui/DynamicChart";
import { parseComponents, type DigestComponent } from "@/lib/parseResponse";

// Wraps each card — if the model returns a malformed field that throws during render,
// only that card shows the fallback instead of the entire digest going blank
class DigestErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div className="card" style={{ padding: "1rem", borderColor: "var(--dc-border-high)" }}>
          <p className="ds-meta" style={{ color: "var(--dc-border-high)" }}>
            Failed to render component — malformed model output.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}

interface ComponentRendererProps {
  content: string;
}

/**
 * Parses a JSON component spec block out of the assistant's message
 * and renders the appropriate UI components.
 */
export function ComponentRenderer({ content }: ComponentRendererProps) {
  const components = parseComponents(content);

  if (components.length === 0) {
    return (
      <p className="ds-prose" style={{ whiteSpace: "pre-wrap" }}>
        {content}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {components.map((spec, i) => (
        <DigestErrorBoundary key={i}>
          <div>{renderComponent(spec)}</div>
        </DigestErrorBoundary>
      ))}
    </div>
  );
}

function renderComponent(spec: DigestComponent) {
  switch (spec.type) {
    case "MacroSummaryCard":
      return <MacroSummaryCard {...spec.data} />;
    case "TickerMentionList":
      return <TickerMentionList {...spec.data} />;
    case "SectorHeatmap":
      return <SectorHeatmap {...spec.data} />;
    case "EarningsHighlight":
      return <EarningsHighlight {...spec.data} />;
    case "RiskFlag":
      return <RiskFlag {...spec.data} />;
    case "NewsletterSummary":
      return <NewsletterSummary {...spec.data} />;
    case "BriefingSummary":
      return <BriefingSummary {...spec.data} />;
    case "DynamicChart":
      return <DynamicChart {...spec.data} />;
    default:
      return null;
  }
}

/** Dashboard layout: full-width macro/risk/summary; tickers + sectors paired; earnings in a row.
 *  components = output of parseComponents() — each element is { type, data } from the model's JSON block. */
function DigestLayout({ components }: { components: DigestComponent[] }) {
  const rows: React.ReactNode[] = [];
  let i = 0;

  while (i < components.length) {
    const spec = components[i];
    const next = components[i + 1];

    // Both are compact cards — pair them side-by-side to avoid wasted full-width whitespace
    if (
      (spec.type === "TickerMentionList" && next?.type === "SectorHeatmap") ||
      (spec.type === "SectorHeatmap" && next?.type === "TickerMentionList")
    ) {
      const ticker =
        spec.type === "TickerMentionList" ? spec : next;
      const sector =
        spec.type === "SectorHeatmap" ? spec : next;
      rows.push(
        <div
          key={`pair-${i}`}
          className="grid gap-4 lg:grid-cols-2 lg:items-start"
        >
          <div className="min-w-0"><DigestErrorBoundary>{renderComponent(ticker)}</DigestErrorBoundary></div>
          <div className="min-w-0"><DigestErrorBoundary>{renderComponent(sector)}</DigestErrorBoundary></div>
        </div>,
      );
      i += 2;
      continue;
    }

    if (spec.type === "EarningsHighlight") {
      // Collect all consecutive EarningsHighlight cards into a group and render them
      // as a single multi-column grid row instead of stacking them full-width
      const group: DigestComponent[] = [];
      let j = i;
      while (j < components.length && components[j].type === "EarningsHighlight") {
        group.push(components[j]);
        j++;
      }
      rows.push(
        <div
          key={`earn-${i}`}
          className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
        >
          {group.map((s, k) => (
            <div key={k} className="min-w-0">
              <DigestErrorBoundary>{renderComponent(s)}</DigestErrorBoundary>
            </div>
          ))}
        </div>,
      );
      i = j;
      continue;
    }

    rows.push(
      <div key={`full-${i}`} className="w-full min-w-0">
        <DigestErrorBoundary>{renderComponent(spec)}</DigestErrorBoundary>
      </div>,
    );
    i++;
  }

  return <div className="space-y-6">{rows}</div>;
}

/** Parses the assistant JSON block and renders a Bloomberg-style digest grid. */
export function DigestRenderer({ content }: { content: string }) {
  const hasJsonFence = /```json\n[\s\S]*?\n```/.test(content);
  const components = parseComponents(content);

  if (!hasJsonFence || components.length === 0) {
    return (
      <div className="card" style={{ padding: "1.5rem" }}>
        <p className="ds-prose" style={{ whiteSpace: "pre-wrap" }}>
          {content}
        </p>
      </div>
    );
  }

  return <DigestLayout components={components} />;
}
