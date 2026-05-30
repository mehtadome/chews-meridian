"use client";

import { type UIMessage } from "ai";
import { MessageCircle, X } from "lucide-react";
import { ComponentRenderer } from "@/components/ComponentRenderer";
import { getMessageText } from "@/lib/agent/getMessageText";
import { directionStyle } from "@/components/ui/DigestTickerBadge";
import type { TickerSummary } from "@/app/api/tickers/route";

interface ChatDrawerProps {
  open: boolean;
  onClose: () => void;
  tickers: TickerSummary[];
  messages: UIMessage[];
  firstAssistantId: string | undefined;
  showDigestLoading: boolean;
  isLoading: boolean;
  sendMessage: (options: { text: string }) => void;
  input: string;
  onInputChange: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function ChatDrawer({
  open,
  onClose,
  tickers,
  messages,
  firstAssistantId,
  showDigestLoading,
  isLoading,
  sendMessage,
  input,
  onInputChange,
  onSubmit,
}: ChatDrawerProps) {
  return (
    <>
      {/* Floating chat button */}
      {!open && (
        <button
          type="button"
          onClick={() => onClose()}
          style={{
            position: "fixed",
            bottom: "1.5rem",
            right: "1.5rem",
            zIndex: 30,
            width: "3.25rem",
            height: "3.25rem",
            borderRadius: "50%",
            border: "1px solid var(--dc-border)",
            background: "var(--text-heading)",
            color: "var(--background)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
            transition: "opacity 0.15s",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "0.88"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
          aria-label="Open chat"
        >
          <MessageCircle style={{ width: "1.25rem", height: "1.25rem" }} strokeWidth={1.75} />
        </button>
      )}

      {/* Drawer */}
      {open && (
        <aside
          style={{
            position: "fixed",
            bottom: "5.5rem",
            right: "1.5rem",
            zIndex: 50,
            width: "clamp(18rem, 90vw, 22rem)",
            height: "32rem",
            display: "flex",
            flexDirection: "column",
            border: "1px solid var(--dc-border)",
            borderRadius: "8px",
            background: "var(--background)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.22), 0 2px 8px rgba(0,0,0,0.12)",
            overflow: "hidden",
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="drawer-title"
        >
          {/* Header */}
          <div
            style={{
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0.75rem 1rem",
              borderBottom: "1px solid var(--dc-border)",
              background: "var(--btn-bg)",
            }}
          >
            <h2 id="drawer-title" className="ds-title" style={{ fontSize: "0.9375rem" }}>Chat</h2>
            <button
              type="button"
              onClick={onClose}
              className="btn"
              style={{ padding: "0.3rem 0.4rem", display: "flex", alignItems: "center" }}
              aria-label="Close"
            >
              <X style={{ width: "1rem", height: "1rem" }} />
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", minHeight: 0, flex: 1 }}>
            {/* Ticker chips */}
            {tickers.length > 0 && (
              <div style={{ flexShrink: 0, borderBottom: "1px solid var(--dc-border)", padding: "0.75rem 1rem" }}>
                <p className="ds-meta" style={{ marginBottom: "0.5rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  Mentioned this week
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem" }}>
                  {tickers.map((t) => (
                    <button
                      key={t.symbol}
                      type="button"
                      onClick={() => sendMessage({ text: `Tell me more about ${t.symbol}` })}
                      style={{
                        padding: "0.15rem 0.55rem",
                        borderRadius: "4px",
                        border: `1px solid ${(directionStyle[t.direction ?? "neutral"] ?? directionStyle.neutral).border}`,
                        background: (directionStyle[t.direction ?? "neutral"] ?? directionStyle.neutral).bg,
                        color: (directionStyle[t.direction ?? "neutral"] ?? directionStyle.neutral).color,
                        fontSize: "0.8125rem",
                        fontWeight: 700,
                        cursor: "pointer",
                        transition: "opacity 0.15s",
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "0.75"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
                    >
                      {t.symbol}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Messages */}
            <div style={{ minHeight: 0, flex: 1, overflowY: "auto", padding: "1rem" }}>
              <div className="space-y-4">
                {messages.map((m) => {
                  const text = getMessageText(m);
                  const isBriefingAssistant = m.role === "assistant" && m.id === firstAssistantId;

                  if (m.role === "user") {
                    return (
                      <div key={m.id} style={{ display: "flex", justifyContent: "flex-end" }}>
                        <div style={{ maxWidth: "min(100%, 18rem)", padding: "0.6rem 0.9rem", borderRadius: "12px 12px 2px 12px", background: "var(--text-heading)", color: "var(--background)", fontSize: "0.9375rem", lineHeight: 1.5 }}>
                          {text}
                        </div>
                      </div>
                    );
                  }

                  if (isBriefingAssistant) {
                    return (
                      <div key={m.id} style={{ padding: "0.6rem 0.75rem", borderRadius: "6px", border: "1px dashed var(--dc-border)", background: "var(--btn-bg)" }} className="ds-meta">
                        {showDigestLoading ? "Loading briefing…" : "Briefing is on the home page — Today's digest with the LLM summary card below."}
                      </div>
                    );
                  }

                  return (
                    <div key={m.id} style={{ display: "flex", justifyContent: "flex-start" }}>
                      <div style={{ width: "100%" }}>
                        <ComponentRenderer content={text} />
                      </div>
                    </div>
                  );
                })}
                {isLoading && messages[messages.length - 1]?.role === "user" && (
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }} className="ds-meta">
                    <span style={{ width: "0.375rem", height: "0.375rem", borderRadius: "50%", background: "var(--text-muted)", display: "inline-block", animation: "pulse 1.5s ease-in-out infinite" }} />
                    Thinking…
                  </div>
                )}
              </div>
            </div>

            {/* Input */}
            <div style={{ flexShrink: 0, borderTop: "1px solid var(--dc-border)", background: "var(--btn-bg)", padding: "0.75rem 1rem" }}>
              <form onSubmit={onSubmit} style={{ display: "flex", gap: "0.5rem" }}>
                <input
                  value={input}
                  onChange={(e) => onInputChange(e.target.value)}
                  placeholder="Ask a follow-up…"
                  style={{
                    minWidth: 0,
                    flex: 1,
                    borderRadius: "6px",
                    border: "1px solid var(--dc-border)",
                    background: "var(--background)",
                    padding: "0.5rem 0.875rem",
                    fontSize: "0.9375rem",
                    color: "var(--text)",
                    outline: "none",
                    transition: "border-color 0.15s",
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "var(--dc-border-low)"; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "var(--dc-border)"; }}
                />
                <button type="submit" disabled={isLoading || !input.trim()} className="btn" style={{ flexShrink: 0 }}>
                  Send
                </button>
              </form>
            </div>
          </div>
        </aside>
      )}
    </>
  );
}
