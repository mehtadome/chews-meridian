"use client";

import type { TradeCreate } from "@/lib/trade-types";

type FormState = Partial<TradeCreate>;

interface TradeFormFieldsProps {
  values: FormState;
  onChange: (patch: Partial<FormState>) => void;
  showExitFields: boolean;
}

export function TradeFormFields({ values, onChange, showExitFields }: TradeFormFieldsProps) {
  const assetType = values.assetType ?? "stock";

  function field(label: string, children: React.ReactNode) {
    return (
      <div className="pl-field">
        <label className="pl-label">{label}</label>
        {children}
      </div>
    );
  }

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
            step="any"
            placeholder="5"
            value={values.quantity ?? ""}
            onChange={(e) => onChange({ quantity: parseFloat(e.target.value) || undefined })}
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
          <input
            className="pl-input"
            type="date"
            value={values.entryDate ?? ""}
            onChange={(e) => onChange({ entryDate: e.target.value })}
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

      {showExitFields && (
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
