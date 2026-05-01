"use client";

import Link from "next/link";
import { ArrowLeft, ChartCandlestick } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import type { Theme } from "@/lib/theme";
import { REFRESH_WINDOWS, NEWSLETTER_SENDERS, CONTEXT_WINDOW_DAYS } from "@/lib/config";
import { PT_TIMEZONE } from "@/lib/utils";
import { WATCHLIST } from "@/lib/watchlist";
import { useEffect, useState } from "react";

const OPTIONS: { id: Theme; label: string; description: string }[] = [
  {
    id: "light",
    label: "Light",
    description: "Default bright theme",
  },
  {
    id: "dark",
    label: "Dark",
    description: "Deep background with cool accents",
  },
];

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

export default function SettingsPage() {
  const { theme, setTheme, mounted } = useTheme();
  const [lastDigestTimestamp, setLastDigestTimestamp] = useState<string | null>(null);
  const [tokenIssuedAt, setTokenIssuedAt] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/digest")
      .then((r) => r.json())
      .then((data) => {
        if (data?.timestamp) setLastDigestTimestamp(data.timestamp);
      })
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
          href="/"
          className="btn"
          style={{ padding: "0.35rem 0.45rem", display: "flex", alignItems: "center" }}
          aria-label="Back to home"
        >
          <ArrowLeft style={{ width: "1rem", height: "1rem" }} />
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
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

        {/* Appearance */}
        <section aria-labelledby="appearance-heading">
          <SectionHeading id="appearance-heading" label="Appearance" />

          {!mounted ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }} aria-hidden>
              {[1, 2].map((i) => (
                <div
                  key={i}
                  style={{
                    height: "4.5rem",
                    borderRadius: "8px",
                    background: "var(--btn-bg)",
                    opacity: 0.65,
                  }}
                />
              ))}
            </div>
          ) : (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
              role="radiogroup"
              aria-label="Theme"
            >
              {OPTIONS.map((opt) => {
                const selected = theme === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setTheme(opt.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "1rem",
                      width: "100%",
                      padding: "0.875rem 1rem",
                      borderRadius: "8px",
                      border: selected
                        ? "2px solid var(--text-heading)"
                        : "1px solid var(--dc-border)",
                      background: selected ? "var(--btn-bg)" : "var(--background)",
                      textAlign: "left",
                      cursor: "pointer",
                      transition: "border-color 0.15s, background 0.15s",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: "0.9375rem",
                          fontWeight: 600,
                          color: "var(--text-heading)",
                        }}
                      >
                        {opt.label}
                      </div>
                      <div className="ds-meta" style={{ marginTop: "0.2rem" }}>
                        {opt.description}
                      </div>
                    </div>
                    <span
                      style={{
                        display: "flex",
                        width: "1rem",
                        height: "1rem",
                        flexShrink: 0,
                        alignItems: "center",
                        justifyContent: "center,",
                        borderRadius: "50%",
                        border: selected
                          ? "2px solid var(--text-heading)"
                          : "2px solid var(--dc-border-low)",
                        background: selected ? "var(--text-heading)" : "transparent",
                      }}
                      aria-hidden
                    >
                      {selected && (
                        <span
                          style={{
                            width: "0.375rem",
                            height: "0.375rem",
                            borderRadius: "50%",
                            background: "var(--background)",
                          }}
                        />
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </section>

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
