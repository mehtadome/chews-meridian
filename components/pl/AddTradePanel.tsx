"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Trade, TradeCreate } from "@/lib/trade-types";
import { TradeFormFields } from "./TradeFormFields";

type PanelMode =
  | { kind: "closed" }
  | { kind: "add" }
  | { kind: "edit"; trade: Trade }
  | { kind: "close"; trade: Trade };

function todayIn2026(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `2026-${mm}-${dd}`;
}

function defaultForm(trade?: Trade): Partial<TradeCreate> {
  if (!trade) {
    return { assetType: "stock", direction: "long", quantity: 1, multiplier: 1, notes: "", markPrice: null, exitPrice: null, exitDate: null, entryDate: todayIn2026() };
  }
  return { ...trade };
}

interface AddTradePanelProps {
  mode: PanelMode;
  onClose: () => void;
  onSaved: () => void;
}

export function AddTradePanel({ mode, onClose, onSaved }: AddTradePanelProps) {
  const isOpen = mode.kind !== "closed";
  const trade = mode.kind === "edit" || mode.kind === "close" ? mode.trade : undefined;

  const [form, setForm] = useState<Partial<TradeCreate>>(() => defaultForm(trade));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetKey, setResetKey] = useState(0);

  const tradeId = trade?.id ?? null;
  useEffect(() => {
    if (mode.kind === "closed") return;
    setForm(defaultForm(trade));
    setError(null);
    setResetKey((k) => k + 1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode.kind, tradeId]);

  function patch(update: Partial<TradeCreate>) {
    setForm((prev) => ({ ...prev, ...update }));
  }

  async function handleSubmit() {
    setError(null);

    if (form.exitPrice != null && !form.exitDate) {
      setError("Exit date is required when exit price is set.");
      return;
    }

    setSaving(true);

    try {
      const isEdit = mode.kind === "edit" || mode.kind === "close";
      const url = isEdit ? `/api/trades/${trade!.id}` : "/api/trades";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(typeof body?.error === "string" ? body.error : "Failed to save trade.");
        return;
      }

      onSaved();
      onClose();
    } catch {
      setError("Network error.");
    } finally {
      setSaving(false);
    }
  }

  const title = mode.kind === "add" ? "Add Trade"
    : mode.kind === "edit" ? "Edit Trade"
    : mode.kind === "close" ? "Close Trade"
    : "";

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
              <span className="pl-title">{title}</span>
              <button className="pl-btn" onClick={onClose} style={{ padding: "0.3rem 0.6rem" }}>✕</button>
            </div>

            <div className="pl-panel__body">
              <TradeFormFields
                key={resetKey}
                values={form}
                onChange={patch}
                showExitFields={mode.kind === "close" || mode.kind === "edit"}
              />
              {error && (
                <p style={{
                  fontSize: "0.8125rem",
                  color: "var(--pl-red)",
                  background: "var(--pl-red-muted)",
                  border: "1px solid rgba(239,68,68,0.2)",
                  borderRadius: "var(--pl-radius-sm)",
                  padding: "0.5rem 0.75rem",
                  margin: 0,
                }}>
                  {error}
                </p>
              )}
            </div>

            <div className="pl-panel__footer">
              <button className="pl-btn" onClick={onClose} disabled={saving}>Cancel</button>
              <button className="pl-btn pl-btn--primary" onClick={handleSubmit} disabled={saving}>
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
