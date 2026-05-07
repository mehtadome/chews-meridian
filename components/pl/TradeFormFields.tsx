"use client";

import { useState } from "react";
import type { TradeCreate } from "@/lib/trade-types";

type FormState = Partial<TradeCreate>;

interface TradeFormFieldsProps {
  values: FormState;
  onChange: (patch: Partial<FormState>) => void;
  showExitFields: boolean;
}

const YEARS = ["2024", "2025", "2026"];

export function TradeFormFields({ values, onChange, showExitFields }: TradeFormFieldsProps) {
  const assetType = values.assetType ?? "stock";
  const [showExit, setShowExit] = useState(showExitFields);
  const [entryYear, setEntryYear] = useState(() =>
    values.entryDate ? values.entryDate.slice(0, 4) : "2026"
  );

  function field(label: string, children: React.ReactNode) {
    return (
      <div className="pl-field">
        <label className="pl-label">{label}</label>
        {children}
      </div>
    );
  }

  function handleEntryDateChange(fullDate: string) {
    if (!fullDate) { onChange({ entryDate: undefined }); return; }
    const newYear = fullDate.slice(0, 4);
    if (newYear !== entryYear) setEntryYear(newYear);
    onChange({ entryDate: fullDate });
  }

  function handleEntryYearChange(year: string) {
    setEntryYear(year);
    if (values.entryDate) {
      const [, m, d] = values.entryDate.split("-");
      onChange({ entryDate: `${year}-${m}-${d}` });
    }
  }

  const showExitSection = showExit || showExitFields;

  return (
    <>
      <div className="pl-field-row">
        {field("Symbol",
          <input
            className="pl-input"
            placeholder="AAPL"
            value={values.symbol ?? ""}
            onChange={(e) => onChange({ symbol: e.target.value.toUpperCase() })}
          />
        )}
        {field("Asset Type",
          <select
            className="pl-select"
            value={assetType}
            onChange={(e) => {
              const t = e.target.value as TradeCreate["assetType"];
              onChange({
                assetType: t,
                multiplier: t === "stock" ? 1 : t === "option" ? 100 : values.multiplier,
              });
            }}
          >
            <option value="stock">Stock</option>
            <option value="option">Option</option>
            <option value="future">Future</option>
          </select>
        )}
      </div>

      <div className="pl-field-row">
        {field("Direction",
          <select
            className="pl-select"
            value={values.direction ?? "long"}
            onChange={(e) => onChange({ direction: e.target.value as TradeCreate["direction"] })}
          >
            <option value="long">Long</option>
            <option value="short">Short</option>
          </select>
        )}
        {field("Quantity",
          <input
            className="pl-input"
            type="number"
            min="0"
            step="5"
            placeholder="5"
            value={values.quantity ?? ""}
            onChange={(e) => onChange({ quantity: parseFloat(e.target.value) || undefined })}
            onFocus={(e) => { if (!values.quantity) e.target.value = "5"; }}
          />
        )}
      </div>

      <div className="pl-field-row">
        {field("Entry Price",
          <input
            className="pl-input"
            type="number"
            min="0"
            step="any"
            placeholder="0.00"
            value={values.entryPrice ?? ""}
            onChange={(e) => onChange({ entryPrice: parseFloat(e.target.value) || undefined })}
          />
        )}
        {field("Entry Date",
          <div style={{ display: "flex", gap: "0.4rem" }}>
            <input
              className="pl-input"
              type="date"
              value={values.entryDate ?? ""}
              onChange={(e) => handleEntryDateChange(e.target.value)}
              style={{ flex: 1, minWidth: 0 }}
            />
            <select
              className="pl-select"
              value={entryYear}
              onChange={(e) => handleEntryYearChange(e.target.value)}
              style={{ width: "5.25rem", flexShrink: 0 }}
            >
              {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        )}
      </div>

      {assetType === "future" && field("Multiplier",
        <input
          className="pl-input"
          type="number"
          min="1"
          step="any"
          placeholder="e.g. 50 for /ES"
          value={values.multiplier ?? ""}
          onChange={(e) => onChange({ multiplier: parseFloat(e.target.value) || undefined })}
        />
      )}

      {!showExitFields && (
        <button
          type="button"
          className="pl-btn"
          style={{ fontSize: "0.8125rem", alignSelf: "flex-start" }}
          onClick={() => setShowExit((v) => !v)}
        >
          {showExit ? "− Remove exit price" : "+ Include exit price"}
        </button>
      )}

      {showExitSection && (
        <div className="pl-field-row">
          {field("Exit Price",
            <input
              className="pl-input"
              type="number"
              min="0"
              step="any"
              placeholder="0.00"
              value={values.exitPrice ?? ""}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                onChange({ exitPrice: isNaN(v) ? null : v });
              }}
            />
          )}
          {field("Exit Date",
            <input
              className="pl-input"
              type="date"
              value={values.exitDate ?? ""}
              onChange={(e) => onChange({ exitDate: e.target.value || null })}
            />
          )}
        </div>
      )}

      {field("Mark Price (optional)",
        <input
          className="pl-input"
          type="number"
          min="0"
          step="any"
          placeholder="Current market price"
          value={values.markPrice ?? ""}
          onChange={(e) => {
            const v = parseFloat(e.target.value);
            onChange({ markPrice: isNaN(v) ? null : v });
          }}
        />
      )}

      {field("Notes (optional)",
        <textarea
          className="pl-textarea"
          placeholder="Thesis, catalyst, anything relevant..."
          value={values.notes ?? ""}
          onChange={(e) => onChange({ notes: e.target.value })}
        />
      )}
    </>
  );
}
