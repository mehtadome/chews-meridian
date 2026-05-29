# Market Analyzer — At Scale

Concerns that are negligible at current personal-tool scale but should be addressed before high-traffic or multi-user use.

---

- **Replace `cancelled` flag with `AbortController`** — `useFetchOnMount` uses a boolean flag to discard stale results, but the request still completes mid-flight. `AbortController` actually cancels the network request, which matters if responses are large or the user navigates frequently.

- **`KEYS` in `listDigests` is a blocking scan** — `redis.keys("digest:*")` in `lib/digest.ts` blocks the Redis server while scanning. Fine for a personal tool with <100 keys, but at scale replace with `SCAN` which iterates in batches without blocking. See `ARCHITECTURE.md` for why this is non-trivial.

- **Redis key namespacing across deployments** — see [roadmap.md](../roadmap.md#shared-infrastructure).
