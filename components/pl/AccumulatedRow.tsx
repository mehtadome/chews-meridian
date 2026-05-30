"use client";

import { useState } from "react";
import type { Trade } from "@/lib/trade-types";
import type { PositionGroup } from "@/lib/position-utils";
import { PnlBadge } from "./PnlBadge";
import { TradeRow } from "./TradeRow";
import { ColGroup } from "./TradeTable";

function sumPnl(trades: Trade[], prices: Record<string, number>): number | null {
  let total = 0;
  for (const t of trades) {
    const price = t.exitPrice ?? prices[t.symbol] ?? t.markPrice;
    if (price === null) return null;
    const dir = t.direction === "long" ? 1 : -1;
    total += (price - t.entryPrice) * t.quantity * t.multiplier * dir;
  }
  return total;
}

function fmt(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" });
}

const Dim = () => <span style={{ color: "var(--pl-text-dim)" }}>—</span>;

interface AccumulatedRowProps {
  group: PositionGroup;
  tab: "open" | "closed";
  onEdit: (trade: Trade) => void;
  onClose: (group: PositionGroup) => void;
  isOwner: boolean;
  prices: Record<string, number>;
}

export function AccumulatedRow({ group, tab, onEdit, onClose, isOwner, prices }: AccumulatedRowProps) {
  const [expanded, setExpanded] = useState(false);

  const pnl = sumPnl(group.trades, prices);
  const isProfit = pnl !== null && pnl > 0;
  const isLoss = pnl !== null && pnl < 0;
  const rowClass = `pl-row${isProfit ? " pl-row--profit" : isLoss ? " pl-row--loss" : ""}`;

  // Open: oldest→newest (matches FIFO close order). Closed: newest→oldest.
  const sorted = [...group.trades].sort((a, b) => {
    const cmp = a.entryDate < b.entryDate ? -1 : a.entryDate > b.entryDate ? 1 : 0;
    return tab === "closed" ? -cmp : cmp;
  });

  const entryDates = group.trades.map(t => t.entryDate).sort();
  const dateCell =
    tab === "closed"
      ? `${fmt(entryDates[0])} → ${fmt(group.trades.map(t => t.exitDate!).sort().at(-1)!)}`
      : `${fmt(entryDates[0])} → now`;

  return (
    <>
      <tr className={rowClass} onClick={() => setExpanded(e => !e)} style={{ cursor: "pointer" }}>
        <td>
          <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <span style={{ display: "inline-block", transition: "transform 0.15s", transform: expanded ? "rotate(90deg)" : "none" }}>
              ›
            </span>
            <strong>{group.symbol}</strong>
            {group.trades.length > 1 && (
              <span style={{ fontSize: "0.75rem", color: "var(--pl-text-dim)" }}>×{group.trades.length}</span>
            )}
          </span>
        </td>
        <td>{pnl !== null ? <PnlBadge value={pnl} /> : <Dim />}</td>
        <td>{group.totalQty}</td>
        <td>${group.avgEntryPrice.toFixed(2)}</td>
        <td><Dim /></td>
        <td className="pl-meta" style={{ textTransform: "capitalize" }}>{group.direction}</td>
        <td className="pl-meta">{dateCell}</td>
        <td className="pl-meta" style={{ textTransform: "capitalize" }}>{group.assetType}</td>
        {isOwner && (
          <td>
            {tab === "open" && (
              <button
                className="pl-btn"
                style={{ fontSize: "0.75rem", padding: "0.25rem 0.6rem" }}
                onClick={e => { e.stopPropagation(); onClose(group); }}
              >
                Close
              </button>
            )}
          </td>
        )}
      </tr>
      <tr className={`pl-row-expand${isProfit ? " pl-row--profit" : isLoss ? " pl-row--loss" : ""}`}>
        <td colSpan={isOwner ? 9 : 8}>
          <div className="pl-subrow-wrap" style={{ gridTemplateRows: expanded ? "1fr" : "0fr" }}>
            <div>
              <table className="pl-subrow-table">
                <ColGroup isOwner={isOwner} />
                <tbody>
                  {sorted.map(trade => (
                    <TradeRow key={trade.id} trade={trade} tab={tab} onEdit={onEdit} isOwner={isOwner} isSubRow />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </td>
      </tr>
    </>
  );
}
