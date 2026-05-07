# Styling Guide — Market Analyzer

Reference design taken from the sibling `email-summarizer` project. Use this as the ground truth for redoing all cards, themes, and layout.

---

## Color Tokens

All colors are defined as CSS custom properties on `:root`. The app supports light and dark mode via `prefers-color-scheme`.

### Light mode
```css
--text:           #374151;   /* body text */
--text-heading:   #111827;   /* headings, labels, strong text */
--text-muted:     #6b7280;   /* secondary / helper text */
--bg:             #ffffff;   /* page background */
--border:         #e5e7eb;   /* dividers, card borders */
--btn-bg:         #f3f4f6;   /* button / card header background */
--btn-bg-hover:   #e5e7eb;   /* button hover state */
--code-bg:        #f3f4f6;   /* monospace / pre blocks */
--error:          #b91c1c;
```

### Dark mode (auto via `prefers-color-scheme: dark`)
```css
--text:           #d1d5db;
--text-heading:   #f9fafb;
--text-muted:     #9ca3af;
--bg:             #111827;
--border:         #374151;
--btn-bg:         #1f2937;
--btn-bg-hover:   #374151;
--code-bg:        #1f2937;
--error:          #f87171;
```

### Card importance border tokens (used for market severity)
```css
/* Light */
--digest-card-border-default: #e5e7eb;
--digest-card-border-low:     #9ca3af;
--digest-card-border-medium:  #d97706;   /* amber */
--digest-card-border-high:    #dc2626;   /* red */
--digest-card-glow-high:      rgba(220, 38, 38, 0.18);

/* Dark */
--digest-card-border-default: #374151;
--digest-card-border-low:     #6b7280;
--digest-card-border-medium:  #f59e0b;
--digest-card-border-high:    #f87171;
--digest-card-glow-high:      rgba(248, 113, 113, 0.22);
```

---

## Typography

```css
font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
font-size:   base 1rem (16px)
line-height: 1.5 (body), 1.55 (prose), 1.35 (headings)
-webkit-font-smoothing: antialiased;
```

| Role | Size | Weight | Color token |
|---|---|---|---|
| Page title | 1.25rem / 1.875rem (large) | 600 / 700 | `--text-heading` |
| Card sender/title | 1rem | 700 | `--text-heading` |
| Card subject | 0.875rem | 600 | `--text-heading` |
| Body prose | 0.9375rem | 400 | `--text` |
| Secondary label | 0.875rem | 500–600 | `--text-heading` |
| Muted / timestamps | 0.75rem | 400 | `--text-muted` |
| Monospace | `ui-monospace, monospace` | — | — |

Letter spacing: `-0.02em` on titles, `-0.03em` on large titles.

---

## Card anatomy

Every content card follows this structure:

```
┌─────────────────────────────────────────────────────┐  ← border-radius: 8px
│ HEADER  (background: var(--btn-bg))                  │  ← border-bottom: 1px solid var(--border)
│   Sender name  (bold, --text-heading)                │
│   Subject line (semibold, smaller)       [ Action ]  │
├─────────────────────────────────────────────────────┤
│ BODY                                                 │
│   Summary prose  (0.9375rem, --text, lh 1.55)        │
├─────────────────────────────────────────────────────┤
│ FOOTER  (auto margin-top, space-between)             │
│   sender email (muted, 0.75rem)        timestamp     │
└─────────────────────────────────────────────────────┘
```

### CSS rules
```css
.card {
  display: flex;
  flex-direction: column;
  border-radius: 8px;
  background: var(--bg);
  overflow: hidden;
  border: 1px solid var(--digest-card-border-default);
}

/* Importance variants */
.card--high   { border: 2px solid var(--digest-card-border-high); box-shadow: 0 0 0 1px var(--digest-card-glow-high); }
.card--medium { border: 1px solid var(--digest-card-border-medium); }
.card--low    { border: 1px solid var(--digest-card-border-low); }

.card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.85rem 1rem 0.75rem;
  border-bottom: 1px solid var(--border);
  background: var(--btn-bg);
}

.card__body {
  flex: 1;
  padding: 0.9rem 1rem 0.5rem;
}

.card__footer {
  margin-top: auto;
  padding: 0.35rem 1rem 0.75rem;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 0.75rem;
}
```

---

## Buttons

```css
.btn {
  font: inherit;
  cursor: pointer;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  border: 1px solid var(--border);
  background: var(--btn-bg);
  color: var(--text-heading);
}
.btn:hover:not(:disabled) { background: var(--btn-bg-hover); }
.btn:disabled { opacity: 0.65; cursor: not-allowed; }
```

### Tab pills (inbox/archive tabs)
```css
.tab {
  padding: 0.4rem 0.85rem;
  border-radius: 999px;          /* pill shape */
  border: 1px solid var(--border);
  background: var(--btn-bg);
  color: var(--text-heading);
  font-size: 0.875rem;
  font-weight: 500;
}
.tab:hover  { background: var(--btn-bg-hover); }
.tab--active {
  background: var(--text-heading);
  color: var(--bg);
  border-color: var(--text-heading);
}
.tab--active:hover { opacity: 0.92; }
```

---

## Layout

### Shell
```css
.shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.shell__header {
  padding: 1rem clamp(1rem, 4vw, 2.5rem);
  border-bottom: 1px solid var(--border);
}

.shell__main {
  flex: 1;
  padding: 1.5rem clamp(1rem, 4vw, 2.5rem);
}

.shell__footer {
  padding: 0.75rem clamp(1rem, 4vw, 2.5rem);
  border-top: 1px solid var(--border);
  font-size: 0.875rem;
}
```

### Card list
```css
.card-list {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  width: 100%;
}
```

### Header row
```css
.header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}
```

---

## Animations

```css
/* Refresh / loading spinner */
@keyframes spin {
  to { transform: rotate(360deg); }
}
.spinning {
  animation: spin 0.85s linear infinite;
  transform-origin: 50% 50%;
}
```

---

## Design principles (carry into market-analyzer)

1. **No shadows by default** — borders do the work. Only `--digest-card-glow-high` adds a subtle glow on high-importance items.
2. **bg-card headers** — card headers use `var(--btn-bg)` (slightly off-background) to create depth without shadows.
3. **8px radius** on cards, **6px** on buttons and inputs — consistent, not aggressive.
4. **`clamp()` for horizontal padding** — `clamp(1rem, 4vw, 2.5rem)` on the shell so it scales gracefully without breakpoints.
5. **Importance = border color** — low/medium/high severity is communicated purely through border color and (for high) a faint glow. No icons or badges needed.
6. **Muted footer metadata** — timestamps and email addresses sit at `0.75rem` in `--text-muted` so they don't compete with content.
7. **Active tabs invert** — active pill tab flips to `background: var(--text-heading); color: var(--bg)` — a simple, high-contrast active state that works in both light and dark.
