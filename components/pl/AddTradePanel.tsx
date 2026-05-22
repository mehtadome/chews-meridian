"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Trade, TradeCreate } from "@/lib/trade-types";
import type { PositionGroup } from "@/lib/position-utils";
import { TradeFormFields } from "./TradeFormFields";
import { DatePicker } from "./DatePicker";

type PanelMode =
  | { kind: "closed" }
  | { kind: "add" }
  | { kind: "edit"; trade: Trade }
  | { kind: "close"; group: PositionGroup };

function todayDate(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

function defaultForm(trade?: Trade): Partial<TradeCreate> {
  if (!trade) {
    return { assetType: "stock", direction: "long", quantity: 5, multiplier: 1, notes: "", markPrice: null, exitPrice: null, exitDate: null, entryDate: todayDate() };
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
  const trade = mode.kind === "edit" ? mode.trade : undefined;

  const [form, setForm] = useState<Partial<TradeCreate>>(() => defaultForm(trade));
  const [closeForm, setCloseForm] = useState({ qty: 0, exitPrice: "" as number | "", exitDate: todayIn2026() });
  const [saving, setSaving] = useState(false);
  const [errorFields, setErrorFields] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [resetKey, setResetKey] = useState(0);

  const tradeId = trade?.id ?? null;
  const groupKey = mode.kind === "close" ? `${mode.group.symbol}|${mode.group.totalQty}` : null;
  useEffect(() => {
    if (mode.kind === "closed") return;
    setError(null);
    setErrorFields([]);
    if (mode.kind === "close") {
      setCloseForm({ qty: mode.group.totalQty, exitPrice: "", exitDate: todayIn2026() });
      return;
    }
    setForm(defaultForm(trade));
    setResetKey((k) => k + 1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode.kind, tradeId, groupKey]);

  function patch(update: Partial<TradeCreate>) {
    setErrorFields((prev) => prev.filter((f) => !(f in update)));
    setForm((prev) => ({ ...prev, ...update }));
  }

  function validate(): string[] {
    const missing: string[] = [];
    if (!form.symbol?.trim()) missing.push("symbol");
    if (form.entryPrice == null) missing.push("entryPrice");
    if (!form.entryDate) missing.push("entryDate");
    if (form.quantity == null) missing.push("quantity");
    if (form.exitPrice != null && !form.exitDate) missing.push("exitDate");
    return missing;
  }

  async function handleSubmit() {
    setError(null);
    setSaving(true);

    try {
      if (mode.kind === "close") {
        if (!closeForm.exitPrice || !closeForm.exitDate) {
          setError("Exit price and date are required.");
          return;
        }
        const res = await fetch("/api/trades/close-position", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            symbol: mode.group.symbol,
            direction: mode.group.direction,
            assetType: mode.group.assetType,
            qty: closeForm.qty,
            exitPrice: Number(closeForm.exitPrice),
            exitDate: closeForm.exitDate,
          }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          setError(body.error ?? "Something went wrong.");
          return;
        }
        onSaved();
        onClose();
        return;
      }

      const missing = validate();
      if (missing.length > 0) {
        setErrorFields(missing);
        return;
      }
      setErrorFields([]);

      const isEdit = mode.kind === "edit";
      const url = isEdit ? `/api/trades/${trade!.id}` : "/api/trades";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        console.error("[AddTradePanel] save failed", body);
        setError("Something went wrong. Please check your entries.");
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

  const isClosing = mode.kind === "edit" && form.exitPrice != null && !!form.exitDate;
  const title = mode.kind === "add" ? "Add Trade" : mode.kind === "edit" ? "Edit Trade" : mode.kind === "close" ? "Close Position" : "";

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
              {mode.kind === "close" ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--pl-text-dim)" }}>
                    Closing <strong style={{ color: "var(--pl-text)" }}>{mode.group.symbol}</strong>{" "}
                    {mode.group.direction} {mode.group.assetType} — {mode.group.totalQty} units total
                  </p>
                  <label className="pl-field">
                    <span>Qty to Close</span>
                    <input
                      className="pl-input"
                      type="number"
                      min={0.01}
                      max={mode.group.totalQty}
                      step="any"
                      value={closeForm.qty}
                      onChange={e => setCloseForm(f => ({ ...f, qty: Number(e.target.value) }))}
                    />
                  </label>
                  <label className="pl-field">
                    <span>Exit Price</span>
                    <input
                      className="pl-input"
                      type="number"
                      min={0.01}
                      step="any"
                      placeholder="0.00"
                      value={closeForm.exitPrice}
                      onChange={e => setCloseForm(f => ({ ...f, exitPrice: e.target.value === "" ? "" : Number(e.target.value) }))}
                    />
                  </label>
                  <label className="pl-field">
                    <span>Exit Date</span>
                    <DatePicker
                      value={closeForm.exitDate}
                      onChange={iso => setCloseForm(f => ({ ...f, exitDate: iso }))}
                    />
                  </label>
                </div>
              ) : (
                <TradeFormFields
                  key={resetKey}
                  values={form}
                  onChange={patch}
                  showExitFields={mode.kind === "edit"}
                  errorFields={errorFields}
                />
              )}
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
                {saving ? "Saving…" : mode.kind === "close" || isClosing ? "Close Position" : "Save"}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
