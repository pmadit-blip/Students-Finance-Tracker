# 💰 Student Finance Tracker

A fully accessible, responsive, vanilla HTML/CSS/JS single-page application for tracking student spending. No frameworks, no build tools, no dependencies — just clean, modular JavaScript.

**Live Demo:** https://pmadit-blip.github.io/Students-Finance-Tracker/
**Demo Link:** https://youtu.be/TdFijEu6kWs
---

## Chosen Theme

**Student Finance Tracker** — budgets, transactions, regex search.

---

## How to Run

1. **Clone the repository:**
   ```bash
   git clone https://github.com/pmadit-blip/Students-Finance-Tracker-2.git
   cd Students-Finance-Tracker-2
   ```

2. **Open in browser:**  
   Double-click `index.html` or open it in the Chrome, Firefox, or Edge.  
   No build step or server required.

3. **Load sample data:**  
   Navigate to **Transactions → Import JSON** and select `seed.json` from the project root.

### Run Tests

Open `tests.html` directly in the browser.  
All 40+ assertions render on-page with ✓ / ✗ indicators and a final pass/fail summary.

---

## Features

| Feature | Details |
|---|---|
| **Dashboard** | Total records, total spent, top category, budget remaining, animated progress bar, 7-day trend chart |
| **Transactions** | Sortable table (desktop) / cards (mobile), live regex search with `<mark>` highlight, category filter |
| **Add / Edit** | Form with real-time per-field validation; edit pre-fills all fields; Cancel restores previous state |
| **Delete** | Confirm dialog before deletion; focus managed; `Escape` to dismiss |
| **Settings** | Adjustable budget cap, manual USD-to-EUR and USD-to-KES rates, selectable USD/EUR/KES display currency, editable category list |
| **Import / Export** | JSON round-trip with structural validation and descriptive error messages |
| **Persistence** | All records and settings auto-saved to `localStorage` across sessions |
| **Accessibility** | Skip link, ARIA landmarks, live regions (polite + assertive), visible focus ring, full keyboard flow |
| **Responsive** | Mobile-first layout across 3 breakpoints: 360px, 768px, 1024px |
| **Animations** | Slide-in cards, fade-in sections, stat card hover lift, budget bar fill transition |

---

## Regex Catalog

| # | Rule | Pattern | Example match | Example reject |
|---|---|---|---|---|
| 1 | Description — no leading/trailing spaces | `/^\S(?:.*\S)?$/` | `"Lunch at cafeteria"` | `" Lunch"` |
| 2 | Amount — positive, up to 2 decimal places | `/^(0\|[1-9]\d*)(\.\d{1,2})?$/` | `"12.50"` | `"1.123"` |
| 3 | Date — YYYY-MM-DD | `/^\d{4}-(0[1-9]\|1[0-2])-(0[1-9]\|[12]\d\|3[01])$/` | `"2025-09-25"` | `"25-09-2025"` |
| 4 | Category name — letters, spaces, hyphens | `/^[A-Za-z]+(?:[ -][A-Za-z]+)*$/` | `"Food"`, `"Self-Care"` | `"Food123"` |
| 5 | Amount range — max 5 integer digits *(lookahead)* | `/^(?!0\d)\d{1,5}(\.\d{1,2})?$/` | `"99999.99"` | `"100000"` |
| 6 | Duplicate consecutive words *(back-reference)* | `/\b(\w+)\s+\1\b/i` | `"the the coffee"` | `"the coffee"` |
| 7 | Search — safe user regex compiler | `compileRegex(input)` with `try/catch` | `/(coffee\|tea)/i` | `[invalid` → `null` |
| 8 | Cents present — search example | `/\.\d{2}\b/` | `"12.50"` | `"12"` |

> Rules 5 and 6 are the **advanced patterns**: Rule 5 uses a negative lookahead to prevent leading zeros and cap the integer part; Rule 6 uses a capturing group back-reference to detect duplicate consecutive words in descriptions.

---

## Keyboard Map

| Key / Action | Behaviour |
|---|---|
| `Tab` | Move focus forward through all interactive elements |
| `Shift + Tab` | Move focus backward |
| `Enter` / `Space` | Activate buttons, submit forms |
| `Escape` | Close confirm dialogs |
| Skip link (first `Tab` on page load) | Jump directly to `#main-content` |
| Nav links | Click or `Enter` to switch sections |
| Table sort buttons | `Enter` to re-sort by that column |
| Search input | Live filtering on every keystroke |
| Import file label | `Enter` / `Space` opens file picker |

---

## Accessibility Notes

- **Landmarks:** `<header role="banner">`, `<nav aria-label="Primary navigation">`, `<main id="main-content">`, `<footer role="contentinfo">`, each `<section aria-labelledby="...">`.
- **Heading hierarchy:** One `<h1>` per section; `<h2>` for sub-sections — no skipped levels.
- **Form labels:** Every `<input>` and `<select>` has a bound `<label>` or `aria-label`; error spans linked via `aria-describedby`.
- **ARIA live regions:**
  - `role="status" aria-live="polite"` — success messages (add, update, export, import).
  - `role="alert" aria-live="assertive"` — validation errors and budget-exceeded warnings.
- **Focus management:** Confirm dialogs open with focus on the primary action button; `Escape` closes and returns focus.
- **Visible focus:** 3 px gold (`#F0A500`) outline on all focusable elements via `:focus-visible`.
- **Color contrast:** Navy `#1B2A4A` on white `#FFFFFF` = 12.6 : 1 (WCAG AAA). Gold `#F0A500` on navy = 4.7 : 1 (WCAG AA).
- **Search highlights:** `<mark>` elements retain readable contrast; screen readers announce surrounding text naturally without interruption.

---

## File Structure

```
Students-Finance-Tracker-2/
├── index.html          ← single-page app shell (all sections)
├── seed.json           ← 12 diverse sample records
├── tests.html          ← in-browser test suite (40+ assertions)
├── README.md
├── styles/
│   ├── base.css        ← CSS variables, reset, typography, utilities
│   ├── layout.css      ← mobile-first flexbox layout, 3 breakpoints
│   └── components.css  ← buttons, inputs, table, cards, animations
├── scripts/
│   ├── storage.js      ← localStorage read / write
│   ├── state.js        ← in-memory state, CRUD, stats, import/export
│   ├── validators.js   ← all 6+ regex validation rules
│   ├── search.js       ← safe regex compiler, highlight, match
│   ├── ui.js           ← DOM rendering, event handling, dialogs
│   └── main.js         ← entry point — bootstraps all modules
└── assets/
```

---

## Data Model

Each transaction record stored in `localStorage` follows this shape:

```json
{
  "id":          "txn_0001",
  "description": "Lunch at cafeteria",
  "amount":      12.50,
  "category":    "Food",
  "date":        "2025-09-25",
  "createdAt":   "2025-09-25T10:30:00.000Z",
  "updatedAt":   "2025-09-25T10:30:00.000Z"
}
```

Settings are stored separately under the key `sft:settings`:

```json
{
  "budgetCap":       1000,
  "rateEUR":         0.92,
  "rateKES":         129.5,
  "displayCurrency": "USD",
  "categories":      ["Food", "Books", "Transport", "Entertainment", "Fees", "Other"]
}
```

Transaction amounts remain stored in USD. Dashboard totals and transaction amounts are converted for display using the manually configured rate for the selected display currency.

---

## Milestones

| Milestone | Description | Status |
|---|---|---|
| M1 | Spec, wireframes, data model, a11y plan | ✅ |
| M2 | Semantic HTML + base CSS (mobile-first layout) | ✅ |
| M3 | Forms + regex validation (6 rules) + `tests.html` | ✅ |
| M4 | Render table/cards + sort + regex search + highlight | ✅ |
| M5 | Stats dashboard + budget cap + ARIA live updates | ✅ |
| M6 | `localStorage` + JSON import/export + settings | ✅ |
| M7 | Polish, a11y audit, README, demo video | ✅ |

---

## What The Demo Video Covers

- Keyboard-only navigation through all sections
- Adding, editing and deleting a transaction
- Regex search edge cases (valid pattern, invalid pattern, case toggle)
- Budget cap exceeded warning (ARIA assertive announcement)
- JSON export and re-import round-trip
- Responsive layout on mobile viewport
