# PL Tracker — At Scale

Concerns that are negligible at single-owner scale but should be addressed before multi-user or high-volume use.

---

- **Move trades storage to a relational DB** — trades are stored as Redis JSON + a List index (`trades:index`). Works for a personal tool but has structural limits: no native querying by symbol/date/asset type, and a crash between `SET` and `LPUSH` can leave orphaned keys. At scale, migrate to Postgres for proper indexed queries and atomic writes. If staying on Redis with multi-user support, replace the current pipeline in `saveTrade` with `MULTI`/`EXEC` for true atomicity.

- **Guest code generation uses `Math.random()`** — not cryptographically secure. Fine for a personal tool with short-TTL codes, but at scale replace with `crypto.randomBytes()` or `crypto.getRandomValues()` in `app/api/auth/generate/route.ts`.

- **`close-position` is not atomic** — `Promise.all([...toUpdate, ...toCreate])` fires independent Redis SETs concurrently. If one fails mid-way, earlier writes have already landed and there's no rollback. Fine at personal-tool scale; at scale wrap in a Redis `MULTI`/`EXEC` pipeline so the whole FIFO split succeeds or fails together.

- **`updateTrade` has a GET→mutate→SET race** — concurrent edits to the same trade can silently overwrite each other. Not a real risk at single-owner scale. At scale, add optimistic locking via Redis `WATCH`/`MULTI`/`EXEC` with retry: read the trade, `WATCH` its key, mutate in JS, open a `MULTI` block, `SET` the updated value, `EXEC` — if the key changed between read and exec, `EXEC` returns null and the caller retries.

- **`nanoid` collision on `saveTrade`** — `saveTrade` calls `SET trade:<id>` with no existence check. A collision silently overwrites the existing trade and `LPUSH` adds a duplicate ID to the index. At `nanoid(10)` with a 64-char alphabet (~1.15 × 10¹⁸ possibilities) this is negligible for a personal trade log, but at scale add a `redis.exists` check before writing and regenerate on conflict.
