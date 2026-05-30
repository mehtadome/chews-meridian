"use client";

import { useState, useEffect } from "react";
import type { Trade, TradeCreate } from "@/lib/trade-types";
import { TradeFormFields } from "./TradeFormFields";
import { todayIso } from "@/lib/date-utils";

function defaultForm(trade?: Trade): Partial<TradeCreate> {
  if (!trade) {
    return { assetType: "stock", direction: "long", quantity: 5, multiplier: 1, notes: "", markPrice: null, exitPrice: null, exitDate: null, entryDate: todayIso() };
  }
  return { ...trade };
}

interface AddEditFormProps {
  mode: { kind: "add" } | { kind: "edit"; trade: Trade };
  onClose: () => void;
  onSaved: () => void;
}

export function AddEditForm({ mode, onClose, onSaved }: AddEditFormProps) {
  const trade = mode.kind === "edit" ? mode.trade : undefined;

  const [form, setForm] = useState<Partial<TradeCreate>>(() => defaultForm(trade));
  const [saving, setSaving] = useState(false);
  const [errorFields, setErrorFields] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [resetKey, setResetKey] = useState(0);

  const tradeId = trade?.id ?? null;
  useEffect(() => {
    setForm(defaultForm(trade));
    setError(null);
    setErrorFields([]);
    setResetKey(k => k + 1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode.kind, tradeId]);

  function patch(update: Partial<TradeCreate>) {
    setErrorFields(prev => prev.filter(f => !(f in update)));
    setForm(prev => ({ ...prev, ...update }));
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
    const missing = validate();
    if (missing.length > 0) { setErrorFields(missing); return; }
    setErrorFields([]);
    setSaving(true);

    try {
      const isEdit = mode.kind === "edit";
      const res = await fetch(isEdit ? `/api/trades/${trade!.id}` : "/api/trades", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        console.error("[AddEditForm] save failed", body);
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

  return (
    <>
      <div className="pl-panel__body">
        <TradeFormFields
          key={resetKey}
          values={form}
          onChange={patch}
          showExitFields={mode.kind === "edit"}
          errorFields={errorFields}
        />
        {error && <ErrorBanner>{error}</ErrorBanner>}
      </div>
      <div className="pl-panel__footer">
        <button className="pl-btn" onClick={onClose} disabled={saving}>Cancel</button>
        <button className="pl-btn pl-btn--primary" onClick={handleSubmit} disabled={saving}>
          {saving ? "Saving…" : isClosing ? "Close Position" : "Save"}
        </button>
      </div>
    </>
  );
}

function ErrorBanner({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontSize: "0.8125rem", color: "var(--pl-red)", background: "var(--pl-red-muted)",
      border: "1px solid rgba(239,68,68,0.2)", borderRadius: "var(--pl-radius-sm)",
      padding: "0.5rem 0.75rem", margin: 0,
    }}>
      {children}
    </p>
  );
}
