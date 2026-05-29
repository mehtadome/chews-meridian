"use client";

import { useState, useEffect } from "react";
import type { PositionGroup } from "@/lib/position-utils";
import { DatePicker } from "./DatePicker";

function todayIn2026(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `2026-${mm}-${dd}`;
}

interface ClosePositionFormProps {
  group: PositionGroup;
  onClose: () => void;
  onSaved: () => void;
}

export function ClosePositionForm({ group, onClose, onSaved }: ClosePositionFormProps) {
  const [qty, setQty] = useState<number | "">(group.totalQty);
  const [exitPrice, setExitPrice] = useState<number | "">("");
  const [exitDate, setExitDate] = useState(todayIn2026());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setQty(group.totalQty as number | "");
    setExitPrice("");
    setExitDate(todayIn2026());
    setError(null);
  }, [group.symbol, group.totalQty]);

  async function handleSubmit() {
    if (!qty || !exitPrice || !exitDate) {
      setError("Qty, exit price, and date are required.");
      return;
    }
    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/trades/close-position", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: group.symbol,
          direction: group.direction,
          assetType: group.assetType,
          qty,
          exitPrice: Number(exitPrice),
          exitDate,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? "Something went wrong.");
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

  return (
    <>
      <div className="pl-panel__body">
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--pl-text-dim)" }}>
            Closing <strong style={{ color: "var(--pl-text)" }}>{group.symbol}</strong>{" "}
            {group.direction} {group.assetType} — {group.totalQty} units total
          </p>
          <label className="pl-field">
            <span>Qty to Close</span>
            <input
              className="pl-input"
              type="number"
              min={0.01}
              max={group.totalQty}
              step="any"
              value={qty}
              onChange={e => setQty(e.target.value === "" ? "" : Number(e.target.value))}
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
              value={exitPrice}
              onChange={e => setExitPrice(e.target.value === "" ? "" : Number(e.target.value))}
            />
          </label>
          <label className="pl-field">
            <span>Exit Date</span>
            <DatePicker value={exitDate} onChange={iso => setExitDate(iso)} />
          </label>
          {error && (
            <p style={{
              fontSize: "0.8125rem", color: "var(--pl-red)", background: "var(--pl-red-muted)",
              border: "1px solid rgba(239,68,68,0.2)", borderRadius: "var(--pl-radius-sm)",
              padding: "0.5rem 0.75rem", margin: 0,
            }}>
              {error}
            </p>
          )}
        </div>
      </div>
      <div className="pl-panel__footer">
        <button className="pl-btn" onClick={onClose} disabled={saving}>Cancel</button>
        <button className="pl-btn pl-btn--primary" onClick={handleSubmit} disabled={saving || !qty}>
          {saving ? "Saving…" : "Close Position"}
        </button>
      </div>
    </>
  );
}
