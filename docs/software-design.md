# Software Design Notes

## Redis Lua Scripts

A Lua script is a string sent to Redis via `EVAL`. Redis runs it server-side — atomically, because Redis is single-threaded. No other command can interleave while the script executes.

```lua
-- KEYS[1] = the Redis key, e.g. "guest:ab12cd34"
`
local raw = redis.call('GET', KEYS[1])
if not raw then return 0 end
local data = cjson.decode(raw)
if data.usesLeft <= 0 then return 0 end
data.usesLeft = data.usesLeft - 1
local ttl = redis.call('TTL', KEYS[1])
if ttl > 0 then
  redis.call('SET', KEYS[1], cjson.encode(data), 'EX', ttl)
else
  redis.call('SET', KEYS[1], cjson.encode(data))
end
return 1
`
```
* The whole code block above is wrapped in `` to stringify it.

Called from Node via ioredis:
```ts
// eval(script, numkeys, ...keys_and_args)
await redis.eval(script, 1, "guest:ab12cd34");
```

---

## Redis GET/SET vs HTTP GET/POST

Unrelated — Redis just uses common English words.

**Redis GET/SET** operate on whole values at a key:
```
GET guest:ab12cd34          → '{"expiresAt":"...","usesLeft":3}'
SET guest:ab12cd34 '{"expiresAt":"...","usesLeft":2}'
```

Redis doesn't know the value is JSON. You parse it in Node, mutate the field, serialize it back, then SET. The gap between GET and SET is where race conditions live — which is why Lua scripts exist.

For field-level ops without fetching the whole value, Redis has Hashes (`HGET`/`HSET`).

**HTTP GET/POST** describe request intent: GET = read (no side effects), POST = write/trigger.
