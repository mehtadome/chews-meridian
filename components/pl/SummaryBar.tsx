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

  const open = trades.filter((t) => !t.exitDate);

  return (
    <div className="pl-summary" style={{ marginBottom: "1.25rem" }}>
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
  );
}
