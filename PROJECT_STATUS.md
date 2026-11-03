# PrimoPath project status

Updated 2026-11-03.

| Milestone | Scope | Status |
| --- | --- | --- |
| 1 | Local wish planner: resources, banner state, income, forecast, guarantee | Complete |
| 1.5 | UI/UX redesign and searchable character/weapon target selector | Complete |
| 2 | Sourced reward catalogue, local progress tracking and Primogem opportunity optimizer | Complete |
| 3 | Wish probability simulation, including Capturing Radiance modelling | Next — not started |

## Milestone 2 delivered

- Extensible reward schema with runtime validation: categories, recurrence, availability,
  prerequisites, effort, source URL, verification date, confidence and custom entries.
- Three bundled, attributable rewards: Daily Commissions (60/day, verified), Spiral Abyss Floors
  9–12 (800/month, verified) and Imaginarium Theater (620 counted from a 620–1,000 estimated range).
- Progress tracking by status, per-reset cycles, partial progress, reward corrections and
  user-created opportunities; persisted in a separate IndexedDB store (DB v2) with a localStorage
  fallback and migration.
- Pure optimizer with transparent weights (reward 40%, reward/minute 30%, urgency 18%, confidence
  12%), written reasons, exclusions, double-count protection against planner income and duplicate
  names, and conservative handling of estimates.
- Opportunities UI: overview, ranked recommendations, category/status filters, expandable details,
  progress controls, custom form, ranking-method disclosure.
- Planner integration: opportunity impact is shown as a separate projection; selection for the
  personal opportunity plan never mutates planner state or forecast scenarios.
- Home integration: "Next opportunity" card with top reward, total obtainable wishes and expiry
  warning.
- Navigation no longer labels Opportunities as "Soon".

## Verification

- `npm test`: **165 tests, 21 files, all passing**.
- `npx tsc --noEmit`: clean.
- `npm run build`: succeeds (JS 503.84 kB / 142.98 kB gzip, CSS 48.22 kB / 8.59 kB gzip; Vite emits
  the >500 kB chunk advisory).
- Chromium checks at 1280 × 900, 390 × 844 and 360 × 800: desktop and mobile rendering, category and
  status filtering, completing and undoing a reset, persistence across reload (including an
  immediate reload after undo), custom create/edit/delete, recommendation ordering, plan selection,
  daily double-count protection, the Home summary card, no horizontal overflow and no console
  errors.
- A real bug was found and fixed during browser verification: progress used a 400 ms debounced save,
  so an undo followed immediately by a refresh could be lost. Opportunity progress now writes
  immediately.

## Data sources and constraints

- Daily Commissions: HoYoLAB guide, checked 2026-11-03.
- Spiral Abyss: HoYoverse Support reset article plus the Hu Tao guide amount, checked 2026-11-03.
- Imaginarium Theater: Hu Tao guide, estimated range 620–1,000, conservative 620 counted, checked
  2026-11-03.
- Events, web events, redeem codes, quests, exploration/chests and achievements are deliberately not
  bundled; the user enters those amounts. No account scraping, credentials or automatic completion
  detection exists.
- Sources older than 180 days are flagged stale and lose 8 score points.

## Known limitations

- Small catalogue; no live event or code feed.
- Effort estimates and score weights are transparent heuristics, not measured player data.
- Rewards are counted only up to the planner deadline.
- Progress is local to one browser profile; no sync.
- Single large JS chunk triggers Vite's 500 kB advisory.
