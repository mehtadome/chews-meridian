import { cookies } from "next/headers";
import { getSession } from "@/lib/auth";
import { listTrades } from "@/lib/trades";
import { fetchCurrentPrices } from "@/lib/market-data";
import { PlTrackerClient } from "@/components/pl/PlTrackerClient";

export default async function PlTrackerPage() {
  const cookieStore = await cookies();
  const session = await getSession(cookieStore.get("cm_session")?.value);

  const trades = await listTrades();
  const openSymbols = trades.filter((t) => !t.exitDate).map((t) => t.symbol);
  const prices = await fetchCurrentPrices(openSymbols);

  return (
    <PlTrackerClient
      initialTrades={trades}
      initialPrices={prices}
      isOwner={session === "owner"}
    />
  );
}
