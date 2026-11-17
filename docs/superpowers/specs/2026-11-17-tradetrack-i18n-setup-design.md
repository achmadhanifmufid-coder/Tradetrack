# TradeTrack — Language, Trade Setup Links, Full-Width Layout

Date: 2026-11-17
Status: approved in brainstorming

## 1. Full-width layout

Drop `max-width: 1200px` from `.main` so content fills the window next to the sidebar. Mobile layout unchanged.

## 2. Trade setup + TradingView links

- Three optional trade fields: `setup` (free text, `<datalist>` suggestions from setups already used), `beforeUrl`, `afterUrl`.
- URLs must start with `http://` or `https://` (`isHttpUrl` in `src/ui.jsx`), checked in the trade form's validate. Stops `javascript:` links from being stored and clicked.
- Journal table gets a "Setup" column: setup name plus small "Before ↗" / "After ↗" links (`target="_blank" rel="noopener noreferrer"`). Clicking a link does not open the edit modal.
- In the form, each URL field shows an "Open ↗" link once it holds a valid URL.
- Old trades have none of these fields; everything treats missing as empty.

## 3. Two languages (ID / EN)

- `src/i18n.js`: one dictionary `{ id: {...}, en: {...} }`, a `LangContext`, `useT()` returning `t(key, vars)`. No library.
- Language toggle "ID | EN" in the nav above Logout (bottom bar on mobile). Choice saved in `localStorage` (wrapped in try/catch); default `id`.
- Sign-in screen is translated too (toggle not shown there; it uses the saved choice).
- Money stays `en-US` USD, dates stay `YYYY-MM-DD`. Stored values (status, cashflow type, side) are not translated; only their labels are.
- Test: every key in `id` exists in `en` and vice versa.

## 4. Journal total

Above the table: "N trade · P/L ±$X" for the trades matching the active filters.

## Out of scope

Filter / stats per setup, translated number or date formats.
