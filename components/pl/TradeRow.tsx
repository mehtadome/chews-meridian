"use client";

import type { Trade } from "@/lib/trade-types";
import { PnlBadge } from "./PnlBadge";

function computePnl(trade: Trade): number | null {
  const exitPrice = trade.exitPrice ?? trade.markPrice;
  if (exitPrice === null) return null;
  const direction = trade.direction === "long" ? 1 : -1;
  return (exitPrice - trade.entryPrice) * trade.quantity * trade.multiplier * direction;
}

function fmt(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" });
}

function daysBetween(a: string, b: Date | string) {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);
}

const Dim = () => <span style={{ color: "var(--pl-text-dim)" }}>—</span>;

interface TradeRowProps {
  trade: Trade;
  tab: "open" | "closed";
  onEdit: (trade: Trade) => void;
  onClose?: (trade: Trade) => void;
  isOwner: boolean;
}

export function TradeRow({ trade, tab, onEdit, onClose, isOwner }: TradeRowProps) {
  const pnl = computePnl(trade);
  const isProfit = pnl !== null && pnl > 0;
  const isLoss = pnl !== null && pnl < 0;
  const rowClass = `pl-row${isProfit ? " pl-row--profit" : isLoss ? " pl-row--loss" : ""}`;

  const exitLabel = trade.exitDate ? fmt(trade.exitDate) : "now";
  const days = daysBetween(trade.entryDate, trade.exitDate ?? new Date());
  const dateCell = `${fmt(trade.entryDate)} → ${exitLabel} (${days}d)`;

  return (
    <tr className={rowClass}>
      <td><strong>{trade.symbol}</strong></td>
      <td>{pnl !== null ? <PnlBadge value={pnl} /> : <Dim />}</td>
      <td>{trade.quantity}</td>
      <td>${trade.entryPrice.toFixed(2)}</td>
      <td>{trade.exitPrice !== null ? `$${trade.exitPrice.toFixed(2)}` : <Dim />}</td>
      <td className="pl-meta" style={{ textTransform: "capitalize" }}>{trade.direction}</td>
      <td className="pl-meta">{dateCell}</td>
      <td className="pl-meta" style={{ textTransform: "capitalize" }}>{trade.assetType}</td>
      {isOwner && (
        <td>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {tab === "open" && onClose && (
              <button className="pl-btn" style={{ fontSize: "0.75rem", padding: "0.25rem 0.6rem" }} onClick={() => onClose(trade)}>Close</button>
            )}
            <button className="pl-btn" style={{ fontSize: "0.75rem", padding: "0.25rem 0.6rem" }} onClick={() => onEdit(trade)}>Edit</button>
          </div>
        </td>
      )}
    </tr>
  );
}
