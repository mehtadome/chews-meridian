# Hotfix Todo

## Active — trade-add-crash branch

### quantity undefined on first submit
`defaultForm()` in `AddTradePanel` doesn't initialize `quantity`. `NumberStepper` shows placeholder "5" but form state is `undefined` — fails `z.number().positive()` if user never touches the stepper.
- Add `quantity: 1` to `defaultForm()` defaults
- Fix `parseFloat(e.target.value) || undefined` → `isNaN(v) ? undefined : v` for `entryPrice` (same latent bug, critique #18)

---

## Dates off by one (all trades in prod)

05/09 entered → stored as 05/08. 04/30 entered → stored as 04/29. Every date in Redis is one day behind what was entered.

- **Root cause:** likely a UTC offset issue — `new Date("2026-05-09")` parsed as midnight UTC, then `.getMonth()/.getDate()` called in local time (EST = UTC-4/5) rolls back to the previous day
- **Prod data fix:** all existing trade `entryDate`/`exitDate` values in Redis need to be incremented by +1 day (write a one-off migration script)
- **Code fix:** audit `fromMD()` and anywhere dates are constructed or displayed — use date-only string arithmetic, never pass ISO date strings through `new Date()` for display

## Date entry UX is clunky

The current MM/DD text input + separate year toggle button is awkward. Needs a rethink.
- Consider a proper date picker or at minimum a single input that accepts MM/DD/YYYY
- Year toggle should not be a separate button that reveals a dropdown
