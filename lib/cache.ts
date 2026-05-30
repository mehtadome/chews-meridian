import type { DigestRecord } from "@/lib/agent/digest";

/**
 * Module-level L1 cache. Survives for the lifetime of the Node process.
 * Only today's digest is kept — stale dates are evicted on write.
 */
const store = new Map<string, DigestRecord>();

export function getCached(date: string): DigestRecord | null {
  return store.get(date) ?? null;
}

export function setCached(date: string, record: DigestRecord): void {
  for (const key of store.keys()) {
    if (key !== date) store.delete(key);
  }
  store.set(date, record);
}
