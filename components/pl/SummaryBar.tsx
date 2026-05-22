import type { Trade } from "@/lib/trade-types";
import { PnlBadge } from "./PnlBadge";
import { computePnl } from "@/lib/pnl";
import { USER_TIMEZONE } from "@/lib/config";

interface SummaryBarProps {
  trades: Trade[];
  prices: Record<string, number>;
}

const Dim = ({ children }: { children: React.ReactNode }) => (
  <span style={{ color: "var(--pl-text-dim)" }}>{children}</span>
);

export function SummaryBar({ trades, prices }: SummaryBarProps) {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: USER_TIMEZONE, year: "numeric", month: "2-digit" }).formatToParts(now);
  const y = parts.find(p => p.type === "year")!.value;
  const m = parts.find(p => p.type === "month")!.value;
  const monthStart = `${y}-${m}-01`;

  const monthlyGains = trades
    .filter((t) => t.exitDate && t.exitDate >= monthStart)
    .reduce((sum, t) => {
      const pnl = computePnl(t);
      return pnl !== null ? sum + pnl : sum;
    }, 0);

  const top3 = trades
    .filter(t => t.exitDate !== null)
    .map(t => ({ trade: t, pnl: computePnl(t) }))
    .filter((x): x is { trade: Trade; pnl: number } => x.pnl !== null && x.pnl > 0)
    .sort((a, b) => b.pnl - a.pnl)
    .slice(0, 3);

  return (
    <div className="pl-summary" style={{ marginBottom: "1.25rem" }}>
      <div className="pl-summary__stat">
        <span className="pl-summary__label">This Month</span>
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
    </div>
  );
}
