"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface PlSettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const EXPIRY_OPTIONS = [1, 6, 12, 24, 48] as const;
type ExpiryHours = typeof EXPIRY_OPTIONS[number];

function expiryLabel(h: ExpiryHours): string {
  return h === 1 ? "1 hour" : `${h} hours`;
}

export function PlSettingsPanel({ isOpen, onClose }: PlSettingsPanelProps) {
  const [code, setCode] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [hours, setHours] = useState<ExpiryHours>(1);
  const [generatedHours, setGeneratedHours] = useState<ExpiryHours>(1);

  async function generate() {
    setGenerating(true);
    try {
      const res = await fetch("/api/auth/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hours }),
      });
      if (res.ok) {
        const data = await res.json();
        setCode(data.code);
        setGeneratedHours(data.hours ?? hours);
        setCopied(false);
      }
    } finally {
      setGenerating(false);
    }
  }

  async function copy() {
    if (!code) return;
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="pl-panel-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <motion.div
            className="pl-panel"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
          >
            <div className="pl-panel__header">
              <span className="pl-title">Settings</span>
              <button className="pl-btn" onClick={onClose} style={{ padding: "0.3rem 0.6rem" }}>✕</button>
            </div>

            <div className="pl-panel__body">
              <div>
                <p style={{ fontSize: "0.8125rem", color: "var(--pl-text-muted)", marginBottom: "0.875rem", lineHeight: 1.55 }}>
                  Guest codes give read-only access to your trades. Each code allows 5 logins.
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "0.875rem" }}>
                  <span style={{ fontSize: "0.8125rem", color: "var(--pl-text-muted)" }}>Expires in</span>
                  <select
                    className="pl-select"
                    style={{ width: "auto" }}
                    value={hours}
                    onChange={(e) => setHours(Number(e.target.value) as ExpiryHours)}
                  >
                    {EXPIRY_OPTIONS.map((h) => (
                      <option key={h} value={h}>{expiryLabel(h)}</option>
                    ))}
                  </select>
                </div>
                <button className="pl-btn pl-btn--primary" onClick={generate} disabled={generating}>
                  {generating ? "Generating…" : "Generate Guest Code"}
                </button>
              </div>

              {code && (
                <div style={{
                  padding: "1rem 1.125rem",
                  background: "var(--pl-bg)",
                  border: "1px solid var(--pl-border)",
                  borderRadius: "var(--pl-radius)",
                }}>
                  <p style={{ fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--pl-text-dim)", marginBottom: "0.625rem" }}>
                    Guest Code
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.875rem" }}>
                    <code style={{ fontSize: "1.375rem", fontWeight: 700, letterSpacing: "0.12em", color: "var(--pl-text)", fontFamily: "monospace" }}>
                      {code}
                    </code>
                    <button className="pl-btn" onClick={copy} style={{ padding: "0.3rem 0.75rem", fontSize: "0.8125rem" }}>
                      {copied ? "Copied!" : "Copy"}
                    </button>
                  </div>
                  <p style={{ fontSize: "0.75rem", color: "var(--pl-text-dim)", marginTop: "0.5rem" }}>
                    Expires in {expiryLabel(generatedHours)} · 5 uses
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
