# HoldEmSense — Claude Code Guidelines

## Internationalization (i18n)

**Always use next-intl for user-facing strings. Never hardcode text.**

- Client components: `useTranslations("namespace")`
- Server components / page.tsx: `getTranslations("namespace")` (async)
- Locale-aware formatting (dates, numbers): use `getLocale()` from `next-intl/server` + native `toLocaleString(locale, ...)`
- Add new keys to **both** `messages/en.json` and `messages/de.json` whenever you add a new component or page with visible text
- Group keys by feature/component namespace (e.g. `hallOfFame`, `train`, `leakFixing`)
- Month names, weekdays, etc. must NOT be hardcoded arrays — use `toLocaleString` with the current locale

## Security

- All game logic (card dealing, equity calculation, scoring) must run server-side only
- Never expose sensitive logic in client components
- Flag any client-side security risks proactively

## Architecture

- New training modules: add a `page.tsx` that renders `<EquityTraining handModule="..." />` — no new training component needed
- All training hands (including pot odds misses) flow into the leak system automatically
- Use `"use server"` files only for async functions — never export constants or objects from them
