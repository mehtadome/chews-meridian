"use client";

import type { Trade } from "@/lib/trade-types";
import { groupTrades, type PositionGroup } from "@/lib/position-utils";
import { AccumulatedRow } from "./AccumulatedRow";

interface TradeTableProps {
  trades: Trade[];
  prices: Record<string, number>;
  tab: "open" | "closed";
  onEdit: (trade: Trade) => void;
  onClose: (group: PositionGroup) => void;
  isOwner: boolean;
}

export function ColGroup({ isOwner }: { isOwner: boolean }) {
  return (
    <colgroup>
      <col style={{ width: "16%" }} />
      <col style={{ width: "12%" }} />
      <col style={{ width: "7%" }} />
      <col style={{ width: "9%" }} />
      <col style={{ width: "9%" }} />
      <col style={{ width: "9%" }} />
      {isOwner ? (
        <>
          <col style={{ width: "20%" }} />
          <col style={{ width: "8%" }} />
          <col style={{ width: "10%" }} />
        </>
      ) : (
        <>
          <col style={{ width: "29%" }} />
          <col style={{ width: "9%" }} />
        </>
      )}
    </colgroup>
  );
}

export function TradeTable({ trades, prices, tab, onEdit, onClose, isOwner }: TradeTableProps) {
  if (trades.length === 0) {
    return (
      <p style={{ color: "var(--pl-text-muted)", fontSize: "0.9375rem", padding: "2rem 0" }}>
        No {tab} positions.
      </p>
    );
  }

  const groups = groupTrades(trades);

  return (
    <div className="pl-table-wrap">
      <table className="pl-table">
        <ColGroup isOwner={isOwner} />
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
          {groups.map(group => (
            <AccumulatedRow
              key={`${group.symbol}|${group.direction}|${group.assetType}`}
              group={group}
              tab={tab}
              onEdit={onEdit}
              onClose={onClose}
              isOwner={isOwner}
              prices={prices}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
