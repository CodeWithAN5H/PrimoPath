# PrimoPath project status

Updated 2026-11-03.

| Milestone | Scope | Status |
| --- | --- | --- |
| 1 | Local wish planner: resources, banner state, income, forecast, guarantee | Complete |
| 1.5 | UI/UX redesign and searchable character/weapon target selector | Complete |
| 2 | Sourced reward catalogue, local progress tracking and Primogem opportunity optimizer | Complete |
| 2.1 | Reward catalogue correction: Theater completion tiers and corroborating sources | Complete |
| 3 | Wish probability simulation, including Capturing Radiance modelling | Next — not started |

## Milestone 2 delivered

- Extensible reward schema with runtime validation: categories, recurrence, availability,
  prerequisites, effort, source URLs, verification date, confidence and custom entries.
- Three bundled, attributable rewards: Daily Commissions (60/day, verified), Spiral Abyss Floors
  9–12 (800/month, verified) and Imaginarium Theater (620 counted from a 620–1,000 range).
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

## Milestone 2.1 delivered

- Imaginarium Theater now documents all three completion levels: **620** through Act 8 (Hard),
  **800** through Act 10 (Visionary), and **1,000** for a full Lunar clear including both Arcanum
  challenges. The optimizer still counts only the conservative 620; 1,000 is displayed as the upper
  bound and is never added to totals.
- Theater's source is now the current Fandom reward table, with the Timesaver 2026 season guide as a
  corroborating source. The verification date is 2026-11-03.
- Spiral Abyss keeps 800 Primogems per full 9-star clear and the monthly reset on the 16th. Its
  primary source remains the official HoYoverse reset article; the Fandom Primogem page is stored as
  a directly accessible corroborating source for the amount.
- Daily Commissions is unchanged: 60 Primogems/day, daily recurrence, existing source.
- Added optional `corroboratingSourceUrl` and `corroboratingSourceLabel` fields. They are additive
  and optional, so existing saved progress and custom opportunities remain compatible without a
  schema version bump or storage migration.
- The reward label now distinguishes the value **counted** by the optimizer from the higher amount
  available **with full completion**.

## Verification

- `npm test`: **171 tests, 21 files, all passing**.
- `npx tsc --noEmit`: clean.
- `npm run build`: succeeds; Vite emits the existing >500 kB single-chunk advisory.
- Chromium checks on desktop and mobile cover the Theater tier text and counted/maximum label, both
  source links, persistence of progress and custom entries, unchanged planner forecasts, no mobile
  overflow and no console errors.
- Milestone 2 previously fixed a real persistence bug: progress used a 400 ms debounced save, so an
  undo followed immediately by a refresh could be lost. Opportunity progress now writes immediately.

## Data sources and constraints

- Daily Commissions: HoYoLAB guide, checked 2026-11-03.
- Spiral Abyss: HoYoverse Support reset schedule plus the Fandom Primogem amount, checked 2026-11-03.
- Imaginarium Theater: Fandom reward table plus the Timesaver 2026 season guide, estimated range
  620–1,000, conservative 620 counted, checked 2026-11-03.
- Events, web events, redeem codes, quests, exploration/chests and achievements are deliberately not
  bundled; the user enters those amounts. No account scraping, credentials or automatic completion
  detection exists.
- Sources older than 180 days are flagged stale and lose 8 score points.

## Known limitations

- Small catalogue; no live event or code feed.
- Effort estimates and score weights are transparent heuristics, not measured player data.
- Theater counts only the conservative 620 even though Visionary pays 800 and a full Lunar clear pays
  1,000; the higher tiers require greater roster depth and completion.
- Rewards are counted only up to the planner deadline.
- Progress is local to one browser profile; no sync.
- Single large JS chunk triggers Vite's 500 kB advisory.
