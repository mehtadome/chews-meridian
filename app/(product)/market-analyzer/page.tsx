"use client";

import { useState, useEffect } from "react";
import { useFetchOnMount } from "@/hooks/useFetchOnMount";
import Link from "next/link";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { RefreshCw, Settings, X, ChartCandlestick, Info } from "lucide-react";
import { DigestPanel } from "@/components/DigestPanel";
import { TickersPanel } from "@/components/TickersPanel";
import { parseMood } from "@/lib/parseResponse";
import type { Mood } from "@/lib/parseResponse";
import { getMessageText } from "@/lib/getMessageText";
import type { TickerSummary } from "@/app/api/tickers/route";

const BRIEFING_PROMPT = "What's in today's newsletter?";

const moodStyles: Record<Mood, string> = {
  normal:      "",
  alert:       "bg-amber-950/20",
  opportunity: "bg-emerald-950/20",
  danger:      "bg-red-950/25",
};

const transport = new DefaultChatTransport({ api: "/api/agent" });

function BriefingErrorBox({ onDismiss }: { onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 10_000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <div
      role="alert"
      style={{
        position: "fixed",
        top: "1.25rem",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 100,
        width: "min(90vw, 22rem)",
        borderRadius: "10px",
        border: "1px solid var(--dc-border-high)",
        background: "var(--background)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.28)",
        padding: "1.25rem 1.25rem 1rem",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
        <span style={{ fontWeight: 700, fontSize: "0.9375rem", color: "var(--text-heading)" }}>
          Briefing failed
        </span>
        <button
          onClick={onDismiss}
          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 0, lineHeight: 1, marginLeft: "0.75rem", flexShrink: 0 }}
          aria-label="Dismiss"
        >
          <X style={{ width: "1rem", height: "1rem" }} />
        </button>
      </div>

      <p className="ds-meta" style={{ marginBottom: "0.5rem", color: "var(--text-muted)" }}>
        This may be caused by:
      </p>
      <ul style={{ margin: "0 0 0.875rem", paddingLeft: "1.1rem", display: "flex", flexDirection: "column", gap: "0.3rem" }}>
        {[
          "Anthropic servers temporarily overloaded",
          "Request timed out before a response arrived",
          "Unexpected or malformed response from the model",
        ].map((cause) => (
          <li key={cause} className="ds-meta" style={{ color: "var(--text)" }}>{cause}</li>
        ))}
      </ul>

      <p className="ds-meta" style={{ color: "var(--text-muted)", borderTop: "1px solid var(--dc-border)", paddingTop: "0.75rem" }}>
        Wait 30 seconds, then try again.
      </p>
    </div>
  );
}

function Toast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <div
      role="alert"
      style={{
        position: "fixed",
        top: "1.25rem",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        padding: "0.75rem 1.25rem",
        borderRadius: "8px",
        background: "var(--text-heading)",
        color: "var(--background)",
        fontSize: "0.9375rem",
        boxShadow: "0 4px 16px rgba(0,0,0,0.22)",
        maxWidth: "min(90vw, 28rem)",
      }}
    >
      <span style={{ flex: 1 }}>{message}</span>
      <button
        onClick={onDismiss}
        style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", padding: 0, lineHeight: 1 }}
        aria-label="Dismiss"
      >
        <X style={{ width: "1rem", height: "1rem" }} />
      </button>
    </div>
  );
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<"digest" | "tickers">("digest");
  const [totalCost, setTotalCost] = useState<number | null>(null);            // cumulative API spend from /api/usage
  const [cachedContent, setCachedContent] = useState<string | null>(null);   // today's digest rawText from L2 cache
  const [cacheChecked, setCacheChecked] = useState(false);                   // whether the cache check on mount has completed
  const [tickers, setTickers] = useState<TickerSummary[]>([]);               // 7-day ticker mention data for the chart
  const [toast, setToast] = useState<string | null>(null);                   // transient error/info message shown at top
  const [briefingError, setBriefingError] = useState(false);                 // detailed error box for agent failures

  function showToast(message: string) {
    setToast(message);
    setTimeout(() => setToast(null), 6000);
  }

  const { messages, sendMessage, setMessages, status } = useChat({
    transport,
    onError: (error) => {
      const msg = error?.message ?? "";
      if (msg.includes("429") || msg.toLowerCase().includes("already in progress")) {
        showToast("Briefing in progress. Refresh after ~30s.");
      } else {
        setBriefingError(true);
      }
    },
  });
  const isLoading = status === "streaming" || status === "submitted";

  const firstAssistant = messages.find((m) => m.role === "assistant");
  const agentText = firstAssistant ? getMessageText(firstAssistant) : "";
  const briefingText = agentText || cachedContent || "";
  const mood: Mood = parseMood(briefingText);
  const showDigestLoading = isLoading && !briefingText.trim();

  useFetchOnMount<{ totalCostUsd: number }>("/api/usage", (data) => setTotalCost(data.totalCostUsd));
  useFetchOnMount<{ rawText?: string }>("/api/digest", (data) => { if (data?.rawText) setCachedContent(data.rawText); }, { onFinally: () => setCacheChecked(true) });
  useFetchOnMount<TickerSummary[]>("/api/tickers", (data) => { if (Array.isArray(data)) setTickers(data); });

  useEffect(() => {
    if (status !== "ready") return;
    // If the agent completed but returned no content (e.g. no new emails since last briefing),
    // restore the existing cached digest rather than leaving the UI empty.
    if (!agentText.trim() && messages.length > 0) {
      void fetch("/api/digest").then((r) => r.json()).then((data) => { if (data?.rawText) setCachedContent(data.rawText); }).catch(() => {});
    }
    void fetch("/api/usage").then((r) => r.json()).then((d) => setTotalCost(d.totalCostUsd)).catch(console.error);
    void fetch("/api/tickers").then((r) => r.json()).then((d) => { if (Array.isArray(d)) setTickers(d); }).catch(console.error);
  }, [status]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      className={`flex h-screen flex-col transition-colors duration-700 ${moodStyles[mood]}`}
      style={{ background: "var(--background)" }}
    >
      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
      {briefingError && <BriefingErrorBox onDismiss={() => setBriefingError(false)} />}

      <header
        className="shell__header shrink-0"
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}
      >
        <div>
          <h1
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              fontSize: "clamp(1.5rem, 3.5vw, 2.25rem)",
              fontWeight: 700,
              color: "var(--text-heading)",
              letterSpacing: "-0.03em",
              lineHeight: 1.15,
            }}
          >
            <ChartCandlestick style={{ width: "2rem", height: "2rem", flexShrink: 0 }} strokeWidth={1.75} aria-hidden />
            Market Analyzer
          </h1>
          <p style={{ marginTop: "0.35rem", fontSize: "1rem", color: "var(--text-muted)" }}>
            Reads your newsletters, surfaces what matters
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexShrink: 0 }}>
          {briefingText.trim() && (
            <button
              type="button"
              onClick={() => { console.log("[refresh] clicked — briefingText:", briefingText.length, "agentText:", agentText.length, "cachedContent:", cachedContent?.length ?? null); setCachedContent(null); setMessages([]); }}
              disabled={isLoading}
              title="Refresh briefing"
              className="btn"
              style={{ padding: "0.4rem 0.5rem", display: "flex", alignItems: "center" }}
            >
              <RefreshCw style={{ width: "1rem", height: "1rem" }} strokeWidth={1.75} />
            </button>
          )}
          {totalCost !== null && (
            <div style={{ textAlign: "right" }}>
              <div className="ds-meta" style={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>API spend</div>
              <div style={{ fontFamily: "ui-monospace, monospace", fontSize: "0.9375rem", fontVariantNumeric: "tabular-nums", color: "var(--text-heading)" }}>
                ${totalCost.toFixed(4)}
              </div>
            </div>
          )}
          <Link href="/" className="btn" style={{ padding: "0.4rem 0.5rem", display: "flex", alignItems: "center" }} aria-label="Home">
            <Info style={{ width: "1.125rem", height: "1.125rem" }} strokeWidth={1.75} />
          </Link>
          <Link href="/settings" className="btn" style={{ padding: "0.4rem 0.5rem", display: "flex", alignItems: "center" }} aria-label="Settings" onClick={() => console.log("[settings] clicked")}>
            <Settings style={{ width: "1.125rem", height: "1.125rem" }} strokeWidth={1.75} />
          </Link>
        </div>
      </header>

      <main className="shell__main min-h-0 flex-1 overflow-y-auto">
        <div style={{ maxWidth: "72rem", margin: "0 auto" }}>
          <div className="space-y-6">
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }} role="tablist" aria-label="Briefing">
              {(["digest", "tickers"] as const).map((tab) => (
                <div
                  key={tab}
                  role="tab"
                  aria-selected={activeTab === tab}
                  tabIndex={0}
                  id={`briefing-tab-${tab}`}
                  aria-controls={`briefing-panel-${tab}`}
                  className={`tab${activeTab === tab ? " tab--active" : ""}`}
                  onClick={() => { console.log("[tab] clicked:", tab); setActiveTab(tab); }}
                  onKeyDown={(e) => e.key === "Enter" && setActiveTab(tab)}
                >
                  {tab === "digest" ? "Today\u2019s digest" : "Today\u2019s tickers"}
                </div>
              ))}
            </div>

            <div id="briefing-panel-digest" role="tabpanel" aria-labelledby="briefing-tab-digest" hidden={activeTab !== "digest"}>
              <DigestPanel
                isLoading={isLoading}
                briefingText={briefingText}
                cacheChecked={cacheChecked}
                onRequestBriefing={() => { console.log("[briefing] requested — isLoading:", isLoading, "cacheChecked:", cacheChecked); if (!isLoading) sendMessage({ text: BRIEFING_PROMPT }); }}
              />
            </div>

            <div id="briefing-panel-tickers" role="tabpanel" aria-labelledby="briefing-tab-tickers" hidden={activeTab !== "tickers"}>
              <TickersPanel tickers={tickers} />
            </div>
          </div>
        </div>
      </main>

    </div>
  );
}
