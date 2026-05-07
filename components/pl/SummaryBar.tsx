import type { Trade } from "@/lib/trade-types";
import { PnlBadge } from "./PnlBadge";

function computePnl(trade: Trade, currentPrice?: number): number | null {
  const exitPrice = trade.exitPrice ?? currentPrice ?? trade.markPrice;
  if (exitPrice == null) return null;
  const dir = trade.direction === "long" ? 1 : -1;
  return (exitPrice - trade.entryPrice) * trade.quantity * trade.multiplier * dir;
}

interface SummaryBarProps {
  trades: Trade[];
  prices: Record<string, number>;
  summary: string | null;
}

const Dim = ({ children }: { children: React.ReactNode }) => (
  <span style={{ color: "var(--pl-text-dim)" }}>{children}</span>
);

export function SummaryBar({ trades, prices, summary }: SummaryBarProps) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const monthlyGains = trades
    .filter((t) => t.exitDate && t.exitDate >= monthStart)
    .reduce((sum, t) => {
      const pnl = computePnl(t);
      return pnl !== null ? sum + pnl : sum;
    }, 0);

  const open = trades.filter((t) => !t.exitDate);

  return (
    <div style={{ marginBottom: "1.25rem" }}>
      {summary ? (
        <p style={{ color: "var(--pl-text-muted)", fontSize: "0.9375rem", lineHeight: 1.6, marginBottom: "1rem" }}>
          {summary}
        </p>
      ) : (
        <p style={{ color: "var(--pl-text-dim)", fontSize: "0.9375rem", marginBottom: "1rem" }}>
          Generating summary…
        </p>
      )}
    <div className="pl-summary">
      <div className="pl-summary__stat">
        <span className="pl-summary__label">This Month</span>
        <span className="pl-summary__value">
          <PnlBadge value={monthlyGains} />
        </span>
      </div>

      {open.length === 0 ? (
        <div className="pl-summary__stat">
          <span className="pl-summary__label">Open</span>
          <span className="pl-summary__value"><Dim>None</Dim></span>
        </div>
      ) : (
        open.map((trade) => {
          const currentPrice = prices[trade.symbol];
          const pnl = computePnl(trade, currentPrice);
          return (
            <div key={trade.id} className="pl-summary__stat">
              <span className="pl-summary__label">{trade.symbol}</span>
              <span className="pl-summary__value" style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                {pnl !== null ? <PnlBadge value={pnl} /> : <Dim>—</Dim>}
                {currentPrice != null && (
                  <span className="pl-meta">${currentPrice.toFixed(2)}</span>
                )}
              </span>
            </div>
          );
        })
      )}
    </div>
    </div>
  );
}
