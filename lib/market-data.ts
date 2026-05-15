// Price fetching stub — Yahoo Finance v7 endpoint is no longer accessible.
// Replace with Schwab API in Phase 2 (see docs/pl-tracker/todo.md).
export async function fetchCurrentPrices(_symbols: string[]): Promise<Record<string, number>> {
  return {};
}
