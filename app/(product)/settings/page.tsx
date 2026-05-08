"use client";

import Link from "next/link";
import { ArrowLeft, ChartCandlestick, Check, Copy } from "lucide-react";
import { REFRESH_WINDOWS, NEWSLETTER_SENDERS, CONTEXT_WINDOW_DAYS } from "@/lib/config";
import { PT_TIMEZONE } from "@/lib/utils";
import { WATCHLIST } from "@/lib/watchlist";
import { useEffect, useState } from "react";
import { SessionBadge } from "@/components/ui/SessionBadge";

function formatDigestTimestamp(isoString: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: PT_TIMEZONE,
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(isoString)) + " PT";
}

function getContextLabel(): string {
  const now = new Date();
  const month = now.toLocaleString("en-US", { month: "long", timeZone: PT_TIMEZONE });
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const dayOfMonth = parseInt(
    new Intl.DateTimeFormat("en-US", { day: "numeric", timeZone: PT_TIMEZONE }).format(now),
    10
  );
  const daysLeft = daysInMonth - dayOfMonth;
  return `${month} · ${daysLeft} day${daysLeft !== 1 ? "s" : ""} left`;
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
      <label
        className="ds-meta"
        style={{ fontWeight: 500, color: "var(--text-muted)", textTransform: "uppercase", fontSize: "0.7rem", letterSpacing: "0.06em" }}
      >
        {label}
      </label>
      <input
        readOnly
        disabled
        value={value}
        style={{
          padding: "0.625rem 0.75rem",
          borderRadius: "6px",
          border: "1px solid var(--border)",
          background: "var(--btn-bg)",
          color: "var(--text)",
          fontSize: "0.9rem",
          width: "100%",
          cursor: "default",
          opacity: 0.8,
        }}
      />
    </div>
  );
}

function SectionHeading({ id, label }: { id: string; label: string }) {
  return (
    <h2
      id={id}
      className="ds-label"
      style={{ marginBottom: "1rem" }}
    >
      {label}
    </h2>
  );
}

const TOKEN_LIFESPAN_MS = 7 * 24 * 60 * 60 * 1000;
const EXPIRY_WARNING_MS = 2 * 24 * 60 * 60 * 1000;

function formatTokenExpiry(issuedAt: string): { label: string; urgency: "ok" | "warning" | "expired" } {
  const issued = new Date(issuedAt).getTime();
  const expires = new Date(issued + TOKEN_LIFESPAN_MS);
  const now = Date.now();
  const msLeft = expires.getTime() - now;
  const daysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24));
  const dateStr = new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric" }).format(expires);

  if (msLeft <= 0) return { label: `Expired ${dateStr} — run scripts/refresh-token.mjs`, urgency: "expired" };
  if (msLeft <= EXPIRY_WARNING_MS) return { label: `Expires ${dateStr} · ${daysLeft} day${daysLeft !== 1 ? "s" : ""} left`, urgency: "warning" };
  return { label: `Expires ${dateStr} · ${daysLeft} day${daysLeft !== 1 ? "s" : ""} left`, urgency: "ok" };
}

function GuestAccessSection() {
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    if (!generatedCode) return;
    navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <section aria-labelledby="guest-heading">
      <SectionHeading id="guest-heading" label="Guest Access" />
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <p className="ds-meta" style={{ color: "var(--text-muted)" }}>
          Generate a one-time code valid for 1 hour or 5 briefing runs — whichever comes first.
        </p>
        <button
          type="button"
          onClick={async () => {
            setGenerating(true);
            setGeneratedCode(null);
            const res = await fetch("/api/auth/generate", { method: "POST" });
            const data = await res.json();
            setGeneratedCode(data.code ?? null);
            setGenerating(false);
          }}
          disabled={generating}
          className="btn"
          style={{ alignSelf: "flex-start", padding: "0.5rem 1rem", opacity: generating ? 0.6 : 1 }}
        >
          {generating ? "Generating…" : "Generate guest code"}
        </button>
        {generatedCode && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <code
              style={{
                padding: "0.5rem 0.875rem",
                borderRadius: "6px",
                border: "1px solid var(--border)",
                background: "var(--btn-bg)",
                fontSize: "1rem",
                fontFamily: "ui-monospace, monospace",
                letterSpacing: "0.08em",
                color: "var(--text-heading)",
              }}
            >
              {generatedCode}
            </code>
            <button
              type="button"
              className="btn"
              style={{ padding: "0.4rem 0.5rem", display: "flex", alignItems: "center" }}
              onClick={handleCopy}
            >
              {copied
                ? <Check style={{ width: "0.875rem", height: "0.875rem", color: "var(--text-heading)" }} strokeWidth={2.5} />
                : <Copy style={{ width: "0.875rem", height: "0.875rem" }} strokeWidth={1.75} />
              }
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

export default function SettingsPage() {
  const [lastDigestTimestamp, setLastDigestTimestamp] = useState<string | null>(null);
  const [tokenIssuedAt, setTokenIssuedAt] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    fetch("/api/digest")
      .then((r) => r.json())
      .then((data) => {
        if (data?.timestamp) setLastDigestTimestamp(data.timestamp);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((data) => { if (data?.session === "owner") setIsOwner(true); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/auth/token-info")
      .then((r) => r.json())
      .then((data) => {
        if (data?.issuedAt) setTokenIssuedAt(data.issuedAt);
      })
      .catch(() => {});
  }, []);

  const contextLabel = getContextLabel();

  return (
    <div className="shell" style={{ background: "var(--background)" }}>
      <header
        className="shell__header"
        style={{ display: "flex", alignItems: "center", gap: "0.875rem" }}
      >
        <Link
          href="/market-analyzer"
          className="btn"
          style={{ padding: "0.35rem 0.45rem", display: "flex", alignItems: "center" }}
          aria-label="Back to app"
        >
          <ArrowLeft style={{ width: "1rem", height: "1rem" }} />
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flex: 1 }}>
          <ChartCandlestick
            style={{ width: "1.25rem", height: "1.25rem", flexShrink: 0 }}
            strokeWidth={1.75}
            aria-hidden
          />
          <h1
            style={{
              fontSize: "1.125rem",
              fontWeight: 700,
              color: "var(--text-heading)",
              letterSpacing: "-0.02em",
            }}
          >
            Settings
          </h1>
        </div>
        <SessionBadge />
      </header>

      <main
        className="shell__main"
        style={{ maxWidth: "36rem", marginLeft: "auto", marginRight: "auto", display: "flex", flexDirection: "column", gap: "2.5rem" }}
      >
        {/* Digest */}
        <section aria-labelledby="digest-heading">
          <SectionHeading id="digest-heading" label="Digest" />
          <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
            <ReadOnlyField
              label="Last briefing"
              value={lastDigestTimestamp ? formatDigestTimestamp(lastDigestTimestamp) : "No digest yet"}
            />
            <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
              <label
                className="ds-meta"
                style={{ fontWeight: 500, color: "var(--text-muted)", textTransform: "uppercase", fontSize: "0.7rem", letterSpacing: "0.06em" }}
              >
                Refresh windows (PT)
              </label>
              {REFRESH_WINDOWS.map((w) => (
                <input
                  key={w.label}
                  readOnly
                  disabled
                  value={w.label}
                  style={{
                    padding: "0.625rem 0.75rem",
                    borderRadius: "6px",
                    border: "1px solid var(--border)",
                    background: "var(--btn-bg)",
                    color: "var(--text)",
                    fontSize: "0.9rem",
                    width: "100%",
                    cursor: "default",
                    opacity: 0.8,
                  }}
                />
              ))}
            </div>
            <ReadOnlyField
              label={`Context window (${CONTEXT_WINDOW_DAYS}-day calendar month)`}
              value={contextLabel}
            />
          </div>
        </section>

        {/* Sources */}
        <section aria-labelledby="sources-heading">
          <SectionHeading id="sources-heading" label="Newsletter Sources" />
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {NEWSLETTER_SENDERS.map((sender) => (
              <ReadOnlyField key={sender} label="" value={sender} />
            ))}
          </div>
        </section>

        {/* Watchlist */}
        <section aria-labelledby="watchlist-heading">
          <SectionHeading id="watchlist-heading" label="Watchlist" />
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            {WATCHLIST.map((entry) => (
              <span
                key={entry.symbol}
                style={{
                  padding: "0.3rem 0.7rem",
                  borderRadius: "999px",
                  border: "1px solid var(--border)",
                  background: "var(--btn-bg)",
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                  color: "var(--text-heading)",
                  letterSpacing: "0.02em",
                }}
                title={entry.note}
              >
                {entry.symbol}
              </span>
            ))}
          </div>
        </section>

        {/* Guest Access — owner only */}
        {isOwner && <GuestAccessSection />}

        {/* Google OAuth */}
        <section aria-labelledby="oauth-heading">
          <SectionHeading id="oauth-heading" label="Google OAuth" />
          {(() => {
            if (!tokenIssuedAt) {
              return (
                <p className="ds-meta" style={{ color: "var(--text-muted)" }}>
                  Token expiry unknown — run <code>node scripts/refresh-token.mjs</code> to generate a tracked token.
                </p>
              );
            }
            const { label, urgency } = formatTokenExpiry(tokenIssuedAt);
            const color =
              urgency === "expired" ? "var(--digest-card-border-high)"
              : urgency === "warning" ? "var(--digest-card-border-medium)"
              : "var(--text-muted)";
            return (
              <p className="ds-meta" style={{ color }}>
                {label}
                {urgency !== "ok" && (
                  <> — run <code>node scripts/refresh-token.mjs</code></>
                )}
              </p>
            );
          })()}
        </section>
      </main>
    </div>
  );
}
