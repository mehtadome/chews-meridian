import type { Trade } from "@/lib/trade-types";
import { PnlBadge } from "./PnlBadge";
import { computePnl } from "@/lib/pnl";

interface SummaryBarProps {
  trades: Trade[];
  prices: Record<string, number>;
  monthLabel: string;
  monthStart: string;
  monthEnd: string;
  yearStart: string;
}

const Dim = ({ children }: { children: React.ReactNode }) => (
  <span style={{ color: "var(--pl-text-dim)" }}>{children}</span>
);

export function SummaryBar({ trades, prices, monthLabel, monthStart, monthEnd, yearStart }: SummaryBarProps) {
  const monthlyGains = trades
    .filter((t) => t.exitDate && t.exitDate >= monthStart && t.exitDate < monthEnd)
    .reduce((sum, t) => {
      const pnl = computePnl(t);
      return pnl !== null ? sum + pnl : sum;
    }, 0);

  const yearlyGains = trades
    .filter((t) => t.exitDate && t.exitDate >= yearStart)
    .reduce((sum, t) => {
      const pnl = computePnl(t);
      return pnl !== null ? sum + pnl : sum;
    }, 0);

  const top3 = trades
    .filter(t => t.exitDate && t.exitDate >= monthStart && t.exitDate < monthEnd)
    .map(t => ({ trade: t, pnl: computePnl(t) }))
    .filter((x): x is { trade: Trade; pnl: number } => x.pnl !== null && x.pnl > 0)
    .sort((a, b) => b.pnl - a.pnl)
    .slice(0, 3);

  return (
    <div className="pl-summary" style={{ marginBottom: "1.25rem" }}>
      <div className="pl-summary__stat">
        <span className="pl-summary__label">{monthLabel}</span>
        <span className="pl-summary__value">
          <PnlBadge value={monthlyGains} />
        </span>
      </div>

      {top3.length === 0 ? (
        <div className="pl-summary__stat">
          <span className="pl-summary__label">Best Trades</span>
          <span className="pl-summary__value"><Dim>None</Dim></span>
        </div>
      ) : (
        top3.map(({ trade, pnl }) => (
          <div key={trade.id} className="pl-summary__stat">
            <span className="pl-summary__label">{trade.symbol}</span>
            <span className="pl-summary__value">
              <PnlBadge value={pnl} />
            </span>
          </div>
        ))
      )}

      <div className="pl-summary__stat" style={{ marginLeft: "auto" }}>
        <span className="pl-summary__label">This Year</span>
        <span className="pl-summary__value">
          <PnlBadge value={yearlyGains} />
        </span>
      </div>
    </div>
  );
}
