"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { DigestRenderer } from "@/components/ComponentRenderer";

const LOADING_PHRASES = [
  "Chestating the markets...",
  "Amplifying the signal...",
  "Front-running your inbox...",
  "Squeezing out the alpha...",
  "Scanning for catalysts...",
  "Pricing in the news...",
  "Decoding the tape...",
  "Calibrating conviction...",
  "Reading the float...",
  "Arbitraging the noise...",
];

function DigestLoading() {
  const [phraseIndex, setPhraseIndex] = useState(() => Math.floor(Math.random() * LOADING_PHRASES.length));

  useEffect(() => {
    const t = setInterval(() => {
      setPhraseIndex((i) => (i + 1) % LOADING_PHRASES.length);
    }, 2500);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="card" style={{ padding: "2rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontFamily: "ui-monospace, monospace", fontSize: "0.875rem", color: "var(--text-muted)" }}>
        <Loader2
          className="spinning"
          style={{ width: "0.875rem", height: "0.875rem", flexShrink: 0 }}
          aria-hidden
        />
        {LOADING_PHRASES[phraseIndex]}
      </div>
      <div style={{ marginTop: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div className="skeleton-block" style={{ height: "7rem", borderRadius: "6px", background: "var(--btn-bg)", opacity: 0.7 }} />
        <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "repeat(2, 1fr)" }}>
          <div className="skeleton-block" style={{ height: "11rem", borderRadius: "6px", background: "var(--btn-bg)", opacity: 0.7 }} />
          <div className="skeleton-block" style={{ height: "11rem", borderRadius: "6px", background: "var(--btn-bg)", opacity: 0.7 }} />
        </div>
        <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "repeat(3, 1fr)" }}>
          <div className="skeleton-block" style={{ height: "8rem", borderRadius: "6px", background: "var(--btn-bg)", opacity: 0.7 }} />
          <div className="skeleton-block" style={{ height: "8rem", borderRadius: "6px", background: "var(--btn-bg)", opacity: 0.7 }} />
          <div className="skeleton-block" style={{ height: "8rem", borderRadius: "6px", background: "var(--btn-bg)", opacity: 0.7 }} />
        </div>
      </div>
    </div>
  );
}

interface DigestPanelProps {
  showLoading: boolean;
  briefingText: string;
  cacheChecked: boolean;
  onRequestBriefing: () => void;
}

export function DigestPanel({ showLoading, briefingText, cacheChecked, onRequestBriefing }: DigestPanelProps) {
  if (showLoading) return <DigestLoading />;

  if (briefingText.trim()) return <DigestRenderer content={briefingText} />;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "4rem 1.5rem" }}>
      {!cacheChecked ? (
        <span
          style={{
            width: "0.5rem",
            height: "0.5rem",
            borderRadius: "50%",
            background: "var(--text-muted)",
            display: "inline-block",
            animation: "pulse 1.5s ease-in-out infinite",
          }}
          aria-hidden
        />
      ) : (
        <button
          type="button"
          onClick={onRequestBriefing}
          disabled={showLoading}
          style={{
            padding: "0.75rem 2rem",
            borderRadius: "6px",
            border: "1px solid var(--dc-border)",
            background: "var(--text-heading)",
            color: "var(--background)",
            fontSize: "1rem",
            fontWeight: 600,
            cursor: "pointer",
            transition: "opacity 0.15s",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "0.88"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
        >
          Get today&apos;s briefing
        </button>
      )}
    </div>
  );
}
