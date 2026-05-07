"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import type { Trade } from "@/lib/trade-types";
import { TradeTable } from "./TradeTable";
import { SummaryBar } from "./SummaryBar";
import { AddTradePanel } from "./AddTradePanel";
import { SessionBadge } from "@/components/ui/SessionBadge";

type Tab = "open" | "closed";

type PanelMode =
  | { kind: "closed" }
  | { kind: "add" }
  | { kind: "edit"; trade: Trade }
  | { kind: "close"; trade: Trade };

interface PlTrackerClientProps {
  initialTrades: Trade[];
  initialPrices: Record<string, number>;
  isOwner: boolean;
}

export function PlTrackerClient({ initialTrades, initialPrices, isOwner }: PlTrackerClientProps) {
  const [trades, setTrades] = useState<Trade[]>(initialTrades);
  const [prices, setPrices] = useState<Record<string, number>>(initialPrices);
  const [tab, setTab] = useState<Tab>("open");
  const [panel, setPanel] = useState<PanelMode>({ kind: "closed" });
  const [summary, setSummary] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/pl/agent")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data?.summary) setSummary(data.summary); })
      .catch(() => {});
  }, []);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/trades");
    if (res.ok) {
      const updated: Trade[] = await res.json();
      setTrades(updated);
      const openSymbols = updated.filter((t) => !t.exitDate).map((t) => t.symbol);
      if (openSymbols.length > 0) {
        const priceRes = await fetch(`/api/trades/prices?symbols=${openSymbols.join(",")}`);
        if (priceRes.ok) setPrices(await priceRes.json());
      }
    }
  }, []);

  const open = trades.filter((t) => !t.exitDate);
  const closed = trades.filter((t) => !!t.exitDate);
  const visible = tab === "open" ? open : closed;

  return (
    <>
      <header className="pl-shell__header">
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <Link href="/" style={{ color: "var(--pl-text-dim)", lineHeight: 0 }} aria-label="Home">
            ←
          </Link>
          <span className="pl-title">PL Tracker</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <SessionBadge />
          {isOwner && (
            <button className="pl-btn pl-btn--primary" onClick={() => setPanel({ kind: "add" })}>
              + Add Trade
            </button>
          )}
        </div>
      </header>

      <main className="pl-shell__main">
        <SummaryBar trades={trades} prices={prices} summary={summary} />

        <div className="pl-tabs">
          <button
            className={`pl-tab${tab === "open" ? " pl-tab--active" : ""}`}
            onClick={() => setTab("open")}
          >
            Open ({open.length})
          </button>
          <button
            className={`pl-tab${tab === "closed" ? " pl-tab--active" : ""}`}
            onClick={() => setTab("closed")}
          >
            Closed ({closed.length})
          </button>
        </div>

        <TradeTable
          trades={visible}
          tab={tab}
          isOwner={isOwner}
          onEdit={(trade) => setPanel({ kind: "edit", trade })}
          onClose={(trade) => setPanel({ kind: "close", trade })}
        />
      </main>

      {isOwner && (
        <AddTradePanel
          mode={panel}
          onClose={() => setPanel({ kind: "closed" })}
          onSaved={refresh}
        />
      )}
    </>
  );
}
