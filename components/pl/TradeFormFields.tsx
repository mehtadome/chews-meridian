"use client";

import { useState } from "react";
import type { TradeCreate } from "@/lib/pl/trade-types";
import { NumberStepper } from "./NumberStepper";
import { DatePicker } from "./DatePicker";

type FormState = Partial<TradeCreate>;

interface TradeFormFieldsProps {
  values: FormState;
  onChange: (patch: Partial<FormState>) => void;
  showExitFields: boolean;
  errorFields?: string[];
}

export function TradeFormFields({ values, onChange, showExitFields, errorFields = [] }: TradeFormFieldsProps) {
  const err = (field: string): React.CSSProperties =>
    errorFields.includes(field) ? { borderColor: "var(--pl-red)" } : {};
  const assetType = values.assetType ?? "stock";
  const [showExit, setShowExit] = useState(showExitFields);

  function field(label: string, children: React.ReactNode) {
    return (
      <div className="pl-field">
        <label className="pl-label">{label}</label>
        {children}
      </div>
    );
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
            style={err("symbol")}
            onChange={(e) => onChange({ symbol: e.target.value.toUpperCase() })}
          />
        )}
        {field("Asset Type",
          <select
            className="pl-select"
            value={assetType}
            onChange={(e) => {
              const t = e.target.value as TradeCreate["assetType"];
              onChange({ assetType: t, multiplier: t === "stock" ? 1 : t === "option" ? 100 : values.multiplier });
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
          <NumberStepper
            value={values.quantity}
            onChange={(v) => onChange({ quantity: v })}
            step={5}
            min={0}
            placeholder="5"
            error={errorFields.includes("quantity")}
          />
        )}
      </div>

      <div className="pl-field-row">
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {field("Entry Price",
            <input
              className="pl-input"
              type="number"
              min="0"
              step="any"
              placeholder="0.00"
              value={values.entryPrice ?? ""}
              style={err("entryPrice")}
              onChange={(e) => { const v = parseFloat(e.target.value); onChange({ entryPrice: isNaN(v) ? undefined : v }); }}
            />
          )}
          {!showExitFields && (
            <button
              type="button"
              className="pl-btn"
              style={{ fontSize: "0.8125rem" }}
              onClick={() => setShowExit(v => !v)}
            >
              {showExit ? "− Remove exit price" : "+ Include exit price"}
            </button>
          )}
        </div>
        {field("Entry Date",
          <DatePicker
            value={values.entryDate}
            onChange={(iso) => onChange({ entryDate: iso })}
            error={errorFields.includes("entryDate")}
          />
        )}
      </div>

      {assetType === "option" && field("Multiplier",
        <NumberStepper
          value={values.multiplier}
          onChange={(v) => onChange({ multiplier: v })}
          step={1}
          min={1}
          placeholder="100"
        />
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
            <DatePicker
              value={values.exitDate}
              onChange={(iso) => onChange({ exitDate: iso })}
              error={errorFields.includes("exitDate")}
            />
          )}
        </div>
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
