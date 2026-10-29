# PrimoPath

A dark, local-first Genshin Impact companion for planning wishes against a banner deadline.
Enter your Primogems, Intertwined Fates and banner state; PrimoPath shows what you can spend now,
what you will have by the deadline under three income scenarios, and how far that is from a
worst-case guarantee.

**Milestone 1 — working local foundation.** No accounts, no live game data, no fabricated numbers.

## Quick start

Requires Node.js 20+ (developed on Node 24) and npm.

```bash
npm install
npm run dev        # http://localhost:5173
```

| Command             | What it does                                        |
| ------------------- | --------------------------------------------------- |
| `npm run dev`       | Vite dev server with hot reload                     |
| `npm test`          | Vitest unit tests (single run)                      |
| `npm run test:watch`| Vitest in watch mode                                |
| `npm run typecheck` | `tsc --noEmit` under strict settings                |
| `npm run build`     | Typecheck, then production build into `dist/`       |
| `npm run preview`   | Serve the production build locally                  |

Routes are hash-based: `#/dashboard` and `#/planner`.

## What works today

- **Dashboard** — available wish budget, projected budget at the deadline, scenario comparison,
  worst-case guarantee budget, gap to that guarantee, and every assumption the numbers rest on.
- **Wish Planner** — Primogems, Intertwined Fates, banner type, target name, banner start/end
  dates, pity, character guarantee toggle or weapon Fate Points, recurring income, and a list of
  one-time rewards with a confidence rating.
- **Validation** — pity, fate-point and numeric fields reject decimals and out-of-range values with
  an inline message; an end date before the start date blocks forecasting instead of guessing.
- **Local persistence** — every change is saved to IndexedDB (localStorage fallback) after a short
  debounce, restored on reload, and flushed on `pagehide`. Unreadable saved payloads are never
  deleted; they are copied to localStorage under `primopath:unreadable-backup` and reported.
- **Responsive shell** — fixed sidebar on desktop, sticky header plus bottom navigation on mobile.

## Architecture

```
src/
  domain/          pure business logic, no React, no DOM
    mechanics.ts   versioned mechanics config (hard pity, rates, source, verified date)
    schema.ts      zod schemas + inferred types + defaults (single source of truth)
    wishes.ts      Primogems/Fates → wishes, leftover, shortfall, cost to close a gap
    forecast.ts    scenario weights, deadline projections, cumulative forecast series
    guarantee.ts   character and weapon worst-case budgets with explanations
    validation.ts  integer field parsing and banner date validation
    plannerView.ts composes everything into the view model the UI renders
    dates.ts       UTC-safe ISO date helpers
  lib/
    storage.ts     IndexedDB store with validated envelopes and localStorage fallback
    format.ts      number/date/label formatting
    useHashRoute.ts, id.ts
  state/
    plannerReducer.ts   pure reducer (add/update/remove rewards, plan patches, banner switch)
    PlannerProvider.tsx context, hydration, debounced autosave, save status
  components/
    ui/            Card, Badge, Alert, SegmentedControl, Sparkline, fields, SaveStatus
    layout/        AppShell (sidebar + mobile navigation)
    dashboard/     budget, target, forecast, guarantee and assumptions cards
    planner/       resource, target, income and reward forms plus the sticky summary
  pages/           DashboardPage, PlannerPage
```

Data flows one way: form input → validated value → reducer → `buildPlannerView` → presentational
components. The probability engine in Milestone 3 will consume `src/domain/mechanics.ts` and the
same plan state; no UI rewrite is needed to add it.

## Math and assumptions

- **Wishes:** `Intertwined Fates + floor(Primogems / 160)`. Leftover Primogems are always shown.
  Acquaint Fates are not modelled because they cannot be spent on these banners.
- **Income days:** each day from today through the deadline inclusive counts once. A deadline that
  has already passed projects no future income at all.
- **Welkin:** 90 Primogems per remaining Welkin day, capped by the days left before the deadline.
- **Scenarios:** one-time rewards are weighted by confidence — conservative counts `confirmed`
  only, expected adds `likely` in full and `uncertain` at half, optimistic counts everything.
  Fractional Fate totals are floored; Primogems keep their fractional value until conversion.
- **Character guarantee:** `(90 − pity) + (guaranteed ? 0 : 90)` wishes.
- **Weapon guarantee:** `(80 − pity) + (2 − fatePoints) × 80` wishes.
- Capturing Radiance is deliberately **not** credited. It can only reduce the real worst case, so
  the displayed guarantee is a safe ceiling. Soft-pity odds are out of scope until Milestone 3.
- Guarantee totals are labelled as a spending ceiling, never as a promise of obtaining the target.

Every one of these rules lives in a pure function with a unit test; none of it is duplicated in a
component.

## Tests

`npm test` runs 55 assertions across seven files:

| File | Covers |
| --- | --- |
| `domain/wishes.test.ts` | exact multiples of 160, leftovers, Fates vs Primogems, clamping |
| `domain/forecast.test.ts` | inclusive income days, scenario weighting, Welkin cap, past deadlines, series/projection agreement |
| `domain/guarantee.test.ts` | character and weapon worst cases, pity credit, Fate Points, no pity mixing |
| `domain/validation.test.ts` | decimals, out-of-range pity, impossible dates, reversed ranges, past-deadline warnings |
| `domain/plannerView.test.ts` | composed budget/projection/gap, blocked forecasting, banner switching |
| `state/plannerReducer.test.ts` | reward add/update/remove, id immutability, independent plans |
| `lib/storage.test.ts` | round-trip, corrupt-record rejection without data deletion, localStorage fallback |

Storage tests run against `fake-indexeddb`; UI interaction was verified manually in the dev server.

## Deliberately not built yet

Probability simulation, the reward catalogue and optimizer, character roster/builds, accounts and
cloud sync, imports, event feeds, service-worker offline caching and PWA install. Milestone 1 also
ships no reset button and no settings screen.

## Privacy

PrimoPath never asks for HoYoverse credentials, cookies or session tokens, never connects to a game
account, and sends nothing to a server. All planner data stays in the browser's local storage.
