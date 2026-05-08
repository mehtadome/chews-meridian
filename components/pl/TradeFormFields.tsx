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

function toMD(dateStr: string | undefined | null): string {
  if (!dateStr) return "";
  const [, m, d] = dateStr.split("-");
  if (!m || !d) return "";
  return `${parseInt(m)}/${parseInt(d)}`;
}

function fromMD(md: string, year: string): string | undefined {
  const match = md.match(/^(\d{1,2})\/(\d{1,2})$/);
  if (!match) return undefined;
  return `${year}-${match[1].padStart(2, "0")}-${match[2].padStart(2, "0")}`;
}

interface DateFieldProps {
  md: string;
  year: string;
  onMDChange: (raw: string, parsed: string | undefined) => void;
  onYearChange: (year: string) => void;
}

function DateField({ md, year, onMDChange, onYearChange }: DateFieldProps) {
  return (
    <div style={{ display: "flex", gap: "0.4rem" }}>
      <input
        className="pl-input"
        type="text"
        placeholder="MM/DD"
        value={md}
        onChange={(e) => onMDChange(e.target.value, fromMD(e.target.value, year))}
        style={{ flex: 1, minWidth: 0 }}
      />
      <select
        className="pl-select"
        value={year}
        onChange={(e) => onYearChange(e.target.value)}
        style={{ width: "5.25rem", flexShrink: 0 }}
      >
        {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
      </select>
    </div>
  );
}

export function TradeFormFields({ values, onChange, showExitFields }: TradeFormFieldsProps) {
  const assetType = values.assetType ?? "stock";
  const [showExit, setShowExit] = useState(showExitFields);

  const [entryMD, setEntryMD] = useState(() => toMD(values.entryDate));
  const [entryYear, setEntryYear] = useState(() => values.entryDate?.slice(0, 4) ?? "2026");
  const [exitMD, setExitMD] = useState(() => toMD(values.exitDate));
  const [exitYear, setExitYear] = useState(() => values.exitDate?.slice(0, 4) ?? "2026");

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
          <DateField
            md={entryMD}
            year={entryYear}
            onMDChange={(raw, parsed) => {
              setEntryMD(raw);
              if (parsed) onChange({ entryDate: parsed });
              else if (!raw) onChange({ entryDate: undefined });
            }}
            onYearChange={(y) => {
              setEntryYear(y);
              if (values.entryDate) {
                const [, m, d] = values.entryDate.split("-");
                onChange({ entryDate: `${y}-${m}-${d}` });
              }
            }}
          />
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
            <DateField
              md={exitMD}
              year={exitYear}
              onMDChange={(raw, parsed) => {
                setExitMD(raw);
                if (parsed) onChange({ exitDate: parsed });
                else if (!raw) onChange({ exitDate: null });
              }}
              onYearChange={(y) => {
                setExitYear(y);
                if (values.exitDate) {
                  const [, m, d] = values.exitDate.split("-");
                  onChange({ exitDate: `${y}-${m}-${d}` });
                }
              }}
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
