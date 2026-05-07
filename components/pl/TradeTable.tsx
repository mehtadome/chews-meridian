"use client";

import type { Trade } from "@/lib/trade-types";
import { TradeRow } from "./TradeRow";

interface TradeTableProps {
  trades: Trade[];
  tab: "open" | "closed";
  onEdit: (trade: Trade) => void;
  onClose?: (trade: Trade) => void;
  isOwner: boolean;
}

export function TradeTable({ trades, tab, onEdit, onClose, isOwner }: TradeTableProps) {
  if (trades.length === 0) {
    return (
      <p style={{ color: "var(--pl-text-muted)", fontSize: "0.9375rem", padding: "2rem 0" }}>
        No {tab} positions.
      </p>
    );
  }

  return (
    <div className="pl-table-wrap">
      <table className="pl-table">
        <thead>
          <tr>
            <th>Symbol</th>
            <th>P&amp;L</th>
            <th>Qty</th>
            <th>Entry</th>
            <th>Exit</th>
            <th>Direction</th>
            <th>Date</th>
            <th>Type</th>
            {isOwner && <th></th>}
          </tr>
        </thead>
        <tbody>
          {trades.map((trade) => (
            <TradeRow
              key={trade.id}
              trade={trade}
              tab={tab}
              onEdit={onEdit}
              onClose={onClose}
              isOwner={isOwner}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
