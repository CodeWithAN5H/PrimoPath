# PrimoPath

A dark, local-first Genshin Impact companion for planning wishes against a banner deadline.
Enter your Primogems, Intertwined Fates and banner state; PrimoPath shows what you can spend now,
what you will have by the deadline under three income scenarios, and how far that is from a
worst-case guarantee.

**Milestone 1.5 — UI/UX redesign and searchable target selector.** No accounts, no live game data,
no fabricated numbers.

## Quick start

Requires Node.js 20+ (developed on Node 24) and npm.

```bash
npm install
npm run dev        # http://localhost:5173
```

| Command             | What it does                                        |
| ------------------- | --------------------------------------------------- |
| `npm run dev`       | Vite dev server with hot reload                     |
| `npm test`          | Vitest tests (single run)                           |
| `npm run test:watch`| Vitest in watch mode                                |
| `npm run typecheck` | `tsc --noEmit` under strict settings                |
| `npm run build`     | Typecheck, then production build into `dist/`       |
| `npm run preview`   | Serve the production build locally                  |
| `npm run data:items`| Regenerate the character/weapon catalogue           |

Routes are hash-based:

| Route              | Screen                                                    |
| ------------------ | --------------------------------------------------------- |
| `#/home`           | Home dashboard (also reachable at `#/dashboard`)          |
| `#/planner`        | Wish Planner (unchanged route from Milestone 1)           |
| `#/opportunities`  | Placeholder — reward optimizer is Milestone 2             |
| `#/simulator`      | Placeholder — probability engine is Milestone 3           |
| `#/account`        | Local-first storage status; no accounts exist yet         |

## What works today

- **Home** answers three questions on one screen: where you stand (target banner card with artwork,
  deadline, available and projected wishes), what your chances look like (conservative, expected and
  optimistic projections against the worst-case ceiling), and what to do next (a clear route into the
  planner, plus an honest "coming soon" state for the reward optimizer). Every assumption is behind
  an expandable disclosure.
- **Wish Planner** groups its inputs into four labelled sections — A target banner, B current
  resources, C banner state, D future income — with the advanced ones collapsed by default and a
  live summary of each section in its header. All Milestone 1 inputs remain: banner type, target,
  start/end dates, Primogems, Fates, pity, character guarantee or weapon Fate Points, recurring
  income, and one-time rewards with confidence.
- **Searchable target selector** replaces the free-text name field: search-as-you-type from one
  character, keyboard navigation, touch selection, clear and replace, no duplicate rows, artwork
  with a monogram fallback, and a labelled "custom target" path for names outside the catalogue.
- **Validation** — pity, fate-point and numeric fields reject decimals and out-of-range values with
  an inline message; an end date before the start date blocks forecasting instead of guessing.
- **Local persistence** — unchanged format and storage keys. Every change is saved to IndexedDB
  (localStorage fallback) after a short debounce, restored on reload, and flushed on `pagehide`.
  Unreadable saved payloads are never deleted; they are copied to localStorage under
  `primopath:unreadable-backup` and reported.
- **Responsive shell** — compact 236 px sidebar with icons and labels on desktop; sticky header plus
  a five-item bottom bar with 56 px touch targets on mobile. No horizontal scrolling at 360 px.
- **Motion** — CSS transitions for cards, disclosures, progress bars and suggestion lists; numbers
  ease with a small `requestAnimationFrame` hook. Everything respects `prefers-reduced-motion`.

## Character and weapon catalogue

`src/data/items.json` holds **124 characters and 253 weapons** — names, rarities, element/weapon
category and UI icon filenames. It is generated from the MIT-licensed
[`genshin-db`](https://www.npmjs.com/package/genshin-db) package (v5.2.14, data sourced from the
GenshinData repo and the community wiki) by `scripts/generate-items.mjs`.

```bash
npm run data:items   # regenerate after a game update and review the diff
```

Why generated-and-committed rather than a runtime dependency: the planner is local-first, so the
catalogue ships with the app, needs no API key, and autocomplete works offline. Adding new
characters or weapons is a regeneration step — no component changes. Characters and weapons stay in
separate collections and are joined by a discriminated union, so banner-type filtering is type-safe.

Search (`src/domain/itemSearch.ts`) is a pure, dependency-free scorer: case-insensitive,
punctuation-insensitive, matches partial names and any word order, falls back to subsequence and
then Levenshtein matching with a typo budget of 1–2 edits depending on query length, and never
returns duplicate rows. It is covered by unit tests and is reusable for any future item picker.

### Artwork

Icons are referenced from the community UI asset mirror **Enka.Network**
(`https://enka.network/ui/<icon>.png`). They are not copied into this repository, and the base URL
is a single constant (`ARTWORK_BASE_URL` in `src/domain/items.ts`).

- Every artwork box has a fixed size, so late or missing images never shift layout.
- Images are lazy-loaded and only requested when a target card or suggestion row is rendered.
- Any failure — offline, moved asset, unknown icon — falls back to a styled monogram.
- Because artwork is fetched from that mirror, the mirror's operator sees an image request. No
  planner value, saved plan or identifier is ever included. Remove the base URL if you need a
  zero-third-party build; the UI stays fully functional with monograms.

Game art remains the property of HoYoverse; PrimoPath is an unofficial fan tool.

## Architecture

```
scripts/generate-items.mjs   builds src/data/items.json from genshin-db
src/
  data/items.json   generated characters and weapons (names, rarity, icons)
  domain/           pure business logic, no React, no DOM
    mechanics.ts    versioned mechanics config (hard pity, rates, source, verified date)
    schema.ts       zod schemas + inferred types + defaults (single source of truth)
    wishes.ts       Primogems/Fates → wishes, leftover, shortfall, cost to close a gap
    forecast.ts     scenario weights, deadline projections, cumulative forecast series
    guarantee.ts    character and weapon worst-case budgets with explanations
    validation.ts   integer field parsing and banner date validation
    plannerView.ts  composes everything into the view model the UI renders
    items.ts        typed item catalogue, lookups, artwork URLs, dataset metadata
    itemSearch.ts   fuzzy/partial name matching used by the selector
    dates.ts        UTC-safe ISO date helpers
  lib/
    storage.ts      IndexedDB store with validated envelopes and localStorage fallback
    format.ts       number/date/label formatting
    useAnimatedNumber.ts  reduced-motion-aware number easing
    useHashRoute.ts  five-section routing with Milestone 1 aliases
  state/
    plannerReducer.ts   pure reducer (add/update/remove rewards, plan patches, banner switch)
    PlannerProvider.tsx context, hydration, debounced autosave, save status
  components/
    ui/         Card, Badge, Alert, Disclosure, SegmentedControl, Sparkline, fields, SaveStatus,
                ItemCombobox, ItemArt
    layout/     AppShell (sidebar + bottom navigation), PlaceholderPage
    home/       target banner, resources, forecast, guarantee, next opportunity
    planner/    sections A–D plus the sticky at-a-glance panel
  pages/        HomePage, PlannerPage, OpportunitiesPage, SimulatorPage, AccountPage
```

Data flows one way: form input → validated value → reducer → `buildPlannerView` → presentational
components. The probability engine in Milestone 3 will consume `src/domain/mechanics.ts` and the
same plan state; no UI rewrite is needed to add it.

## Math and assumptions

Unchanged from Milestone 1 — no calculation, guarantee rule or forecast assumption was altered.

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

## Accessibility

- The selector follows the ARIA combobox/listbox pattern with `aria-expanded`,
  `aria-activedescendant`, `aria-autocomplete` and option-level selection state.
- Collapsed planner and forecast sections stay in the DOM for animation but are `inert` and
  `aria-hidden`, so they leave the tab order and screen-reader flow.
- Inputs have associated labels plus readable units; numeric fields expose a screen-reader unit.
- Touch targets are at least 44 px; the mobile bar is 56 px tall.
- `prefers-reduced-motion: reduce` removes transitions and animations, and the number hook jumps
  straight to its final value.
- Colour pairs target readable contrast on the charcoal surfaces; state is never conveyed by colour
  alone (covered / short / planned always have text).

## Tests

`npm test` runs 90 assertions across 14 files:

| File | Covers |
| --- | --- |
| `domain/wishes.test.ts` | exact multiples of 160, leftovers, Fates vs Primogems, clamping |
| `domain/forecast.test.ts` | inclusive income days, scenario weighting, Welkin cap, past deadlines, series/projection agreement |
| `domain/guarantee.test.ts` | character and weapon worst cases, pity credit, Fate Points, no pity mixing |
| `domain/validation.test.ts` | decimals, out-of-range pity, impossible dates, reversed ranges, past-deadline warnings |
| `domain/plannerView.test.ts` | composed budget/projection/gap, blocked forecasting, banner switching |
| `domain/itemSearch.test.ts` | partial, case-insensitive, multi-word, typo, punctuation, duplicate and limit behaviour |
| `domain/items.test.ts` | dataset size, unique ids/names, typed lookups, artwork URL and fallback |
| `state/plannerReducer.test.ts` | reward add/update/remove, id immutability, independent plans |
| `lib/storage.test.ts` | round-trip, corrupt-record rejection without data deletion, localStorage fallback |
| `lib/useHashRoute.test.ts` | five routes plus Milestone 1 aliases and unknown-hash fallback |
| `lib/useAnimatedNumber.test.ts` | reduced-motion jump and initial value |
| `components/ui/ItemCombobox.test.tsx` | typeahead, partial/typo matches, keyboard select, Escape, clear, custom target, kind filtering |
| `components/ui/Disclosure.test.tsx` | expanded state, inert/aria-hidden when collapsed |
| `components/layout/AppShell.test.tsx` | five destinations, active state, navigation callback, skip link |

Storage tests run against `fake-indexeddb`; UI interaction tests use Testing Library. Layout and
persistence were additionally checked in a real Chromium session at 390 × 844, 1280 × 900 and
1440 × 900 (see the milestone report for what was and was not verified).

## Deliberately not built yet

Wish probability simulation, the reward catalogue and optimizer, live event or banner feeds,
character builds, accounts, cloud sync, third-party imports, service-worker offline caching and PWA
install. The Opportunities, Wish Simulator and Account screens are clearly labelled placeholders —
they contain no fake data, disabled-looking fake controls or invented numbers.

## Privacy

PrimoPath never asks for HoYoverse credentials, cookies or session tokens, never connects to a game
account, and never uploads your plan. Planner data stays in the browser's local storage. The only
outbound requests are for character and weapon icons from the public asset mirror described above.
