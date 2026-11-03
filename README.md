# PrimoPath

A dark, local-first Genshin Impact companion for planning wishes against a banner deadline.
Enter your Primogems, Intertwined Fates and banner state; PrimoPath shows what you can spend now,
what you will have by the deadline under three income scenarios, and how far that is from a
worst-case guarantee.

**Milestones 1, 1.5, 2 and 2.1 are complete.** Milestone 2 adds a sourced reward catalogue, local
opportunity progress and a transparent Primogem opportunity optimizer. Milestone 2.1 corrects the
Imaginarium Theater completion tiers and stores a corroborating source for the Spiral Abyss amount.
Milestone 3 — wish probability simulation — is next. No accounts, no live game data, no fabricated
reward numbers.

## Quick start

Requires Node.js 20+ (developed on Node 24) and npm.

```bash
npm install
npm run dev        # http://localhost:5173
```

| Command              | What it does                                        |
| -------------------- | --------------------------------------------------- |
| `npm run dev`        | Vite dev server with hot reload                     |
| `npm test`           | Vitest tests (single run)                           |
| `npm run test:watch` | Vitest in watch mode                                |
| `npm run typecheck`  | `tsc --noEmit` under strict settings                |
| `npm run build`      | Typecheck, then production build into `dist/`       |
| `npm run preview`    | Serve the production build locally                  |
| `npm run data:items` | Regenerate the character/weapon catalogue           |

Routes are hash-based:

| Route             | Screen                                                       |
| ----------------- | ------------------------------------------------------------ |
| `#/home`          | Home dashboard (also reachable at `#/dashboard`)             |
| `#/planner`       | Wish Planner (Milestone 1 inputs and forecast)               |
| `#/opportunities` | Reward catalogue, progress tracking and ranked opportunities |
| `#/simulator`     | Placeholder — probability engine is Milestone 3              |
| `#/account`       | Local-first storage status; no accounts exist yet            |

## What works today

- **Home** answers three questions on one screen: where you stand (target banner, available and
  projected wishes), what your chances look like (conservative, expected and optimistic projections
  against the worst-case ceiling), and what to do next. The "Next opportunity" card shows the top
  ranked unfinished reward, the total obtainable Primogems/wishes and an expiring-soon warning, with
  a route into Opportunities. Every assumption sits behind an expandable disclosure.
- **Wish Planner** groups its inputs into four labelled sections — A target banner, B current
  resources, C banner state, D future income — with the advanced ones collapsed by default and a
  live summary of each section in its header. Banner type, target, start/end dates, Primogems,
  Fates, pity, character guarantee or weapon Fate Points, recurring income, and one-time rewards
  with confidence all remain from Milestone 1.
- **Opportunities** ranks what is still obtainable before your target deadline. It shows remaining
  Primogems and wishes, expiring rewards, completion progress, the additional wishes from all
  opportunities, and the gap after them. Each row exposes reward, effort, recurrence, availability,
  prerequisites, source and verification date, plus progress controls. Category and status filters
  narrow the full list; four recommendations sit above it with a written reason.
- **Progress tracking** — not started, in progress, done, or not applicable; per-reset completion for
  daily/monthly rewards; partial progress for exploration/quest-style entries; a user reward
  correction; and custom opportunities that can be added, edited and deleted. Everything is saved
  immediately to IndexedDB (localStorage fallback) and restored on reload.
- **Searchable target selector** — search-as-you-type from one character, keyboard navigation,
  touch selection, clear and replace, no duplicate rows, artwork with a monogram fallback, and a
  labelled "custom target" path for names outside the catalogue.
- **Validation** — pity, fate-point and numeric fields reject decimals and out-of-range values with
  an inline message; an end date before the start date blocks forecasting instead of guessing.
- **Responsive shell** — compact 236 px sidebar with icons and labels on desktop; sticky header plus
  a five-item bottom bar with 56 px touch targets on mobile. No horizontal scrolling at 360 px.
- **Motion** — CSS transitions for cards, disclosures, progress bars and suggestion lists; numbers
  ease with a small `requestAnimationFrame` hook. Everything respects `prefers-reduced-motion`.

## Reward catalogue and data reliability

The catalogue lives in `src/data/rewardCatalogue.ts` and is parsed against the zod schema at module
load, so malformed data fails loudly rather than silently changing a total. It is deliberately
small: only rewards whose amounts are stable enough to attribute are bundled.

| Opportunity                        | Reward counted               | Reset             | Status    | Source                                                                                                                        |
| ---------------------------------- | ---------------------------- | ----------------- | --------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Daily Commissions                  | 60 Primogems/day             | Daily             | Verified  | [HoYoLAB — Daily Commissions guide](https://www.hoyolab.com/article/35566777)                                                  |
| Spiral Abyss — Floors 9–12         | 800 Primogems/reset          | Monthly, day 16   | Verified  | [HoYoverse Support — reset schedule](https://support.hoyoverse.com/hc/en-us/articles/50333950598553-When-does-the-Spiral-Abyss-reset-and-what-are-the-rewards) · [Fandom — 800 per reset](https://genshin-impact.fandom.com/wiki/Primogem) |
| Imaginarium Theater — Performance Tour | 620 counted; 800 through Act 10; 1,000 full Lunar | Monthly, day 1 | Estimated | [Fandom — reward table](https://genshin-impact.fandom.com/wiki/Imaginarium_Theater) · [Timesaver — 2026 tiers](https://timesaver.gg/blog/genshin-imaginarium-theater-october-2026) |

All three were re-checked on **2026-11-03** for Milestone 2.1. Notes and limitations:

- The Spiral Abyss reset is official and remains the primary source: it resets monthly on the 16th.
  The 800-Primogem amount is stored as a directly accessible corroborating Fandom source.
- Imaginarium Theater is **estimated**: 620 is the cumulative reward through Act 8 (Hard), 800
  through Act 10 (Visionary), and 1,000 for a full Lunar clear including both Arcanum challenges.
  The optimizer counts only 620 and shows 1,000 as the upper bound. The higher tiers require higher
  difficulty and a full Lunar clear; 620 is a conservative floor, not the maximum.
- Effort figures (15/120/90 minutes) are PrimoPath estimates for ranking only, not sourced data.
- A source older than 180 days is flagged stale in the row and loses 8 score points. It is not hidden.
- Catalogue updates are a code change: edit the entry, update `verifiedOn`, and run `npm test`.
  Progress records are keyed by opportunity `id` in a separate store, so a catalogue update can
  never reset completion. Never reuse or rename an existing id for a different reward.
- **Not bundled:** time-limited events, web events, redeem codes, chest counts, exploration totals,
  quest rewards and achievements. Their values and deadlines change too often to verify offline, so
  the app asks you to enter them rather than inventing them. Once entered they are labelled
  "Your entry" and ranked alongside sourced rewards.
- There is no HoYoverse account connection, scraping, cookie or token access, and no automatic
  completion detection. PrimoPath cannot know what you have already claimed in game.

## Opportunity optimizer

`src/domain/rewardOptimizer.ts` is pure TypeScript. The UI supplies the catalogue, saved progress
and a read-only snapshot of the planner (today, deadline, daily income, one-time reward labels,
budget, projection and guarantee) and receives evaluations, totals and ranked recommendations.

**Score (0–100), rounded:**

| Factor              | Weight | Normalisation                                                       |
| ------------------- | ------ | ------------------------------------------------------------------- |
| Remaining reward    | 40%    | Primogems still obtainable ÷ 1,600, capped at 1                    |
| Reward per minute   | 30%    | (Primogems ÷ max(10, effort minutes)) ÷ 20, capped at 1             |
| Urgency             | 18%    | Only with an end date: `1 − days left ÷ 14`, clamped to 0–1         |
| Confidence          | 12%    | Verified 1.0, estimated 0.55, user-entered 0.7                      |

A stale source subtracts 8 points. Scores ≥ 60 are **High priority**, ≥ 35 **Medium**, otherwise
**Low**. Every available row receives short reasons generated from the same facts — expiry, reward
size, effort, verification status, recurrence count, prerequisites, stale source, or the daily-income
shortfall — so no recommendation is unexplained.

**Exclusions and double-count protection:**

- Done, not-applicable, expired, not-yet-available and duplicate-name entries are excluded from the
  obtainable totals.
- Repeatable rewards count the open cycle plus every future reset on or before the deadline; a
  completed current cycle removes one occurrence without blocking the rest.
- Daily Commissions counts only the shortfall against the planner's `dailyPrimogems` (60/day with a
  planner already counting 60/day yields zero, not 60).
- A planner one-time reward whose normalized name meaningfully matches an opportunity also yields
  zero for that opportunity.
- A custom opportunity with the same name as a catalogue reward is displayed but counted once.
- Selecting "Include in my opportunity plan" is stored separately and adds a second, clearly-labelled
  projection. It never writes into the planner state, so the existing forecast scenarios are
  untouched.

## Storing progress

Planner data keeps its Milestone 1 format and keys. The shared IndexedDB database was bumped from
version 1 to version 2 to add a separate `opportunities` object store; existing planner records are
not rewritten. Progress is mirrored under `primopath:opportunities:v1` when IndexedDB is
unavailable. An unreadable opportunity payload is never deleted: it is copied to
`primopath:opportunities-unreadable-backup` and reported. Planner payloads keep their existing
`primopath:unreadable-backup` behaviour. Writes are immediate rather than debounced so a completion
or undo survives an immediate refresh.

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
returns duplicate rows.

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
  data/
    items.json            generated characters and weapons
    rewardCatalogue.ts    bundled, sourced reward definitions (3 entries)
  domain/                 pure business logic, no React, no DOM
    mechanics.ts          versioned mechanics config (hard pity, rates, source, verified date)
    schema.ts             planner zod schemas + inferred types + defaults
    wishes.ts             Primogems/Fates → wishes, leftover, shortfall, cost to close a gap
    forecast.ts           scenario weights, deadline projections, cumulative forecast series
    guarantee.ts          character and weapon worst-case budgets with explanations
    validation.ts         integer field parsing and banner date validation
    plannerView.ts        composes the planner into the view model the UI renders
    items.ts              typed item catalogue, lookups, artwork URLs, dataset metadata
    itemSearch.ts         fuzzy/partial name matching used by the selector
    opportunity.ts        reward/progress schemas, cycles, availability, remaining rewards
    rewardOptimizer.ts    evaluation, scoring, reasons, totals and plan impact
    dates.ts              UTC-safe ISO date helpers
  lib/
    storage.ts            planner IndexedDB store (v2) with validated envelopes + fallback
    opportunityStorage.ts separate progress store, migration, unreadable backup
    format.ts             number/date/label formatting
    useAnimatedNumber.ts  reduced-motion-aware number easing
    useHashRoute.ts       five-section routing with Milestone 1 aliases
  state/
    plannerReducer.ts     pure planner reducer
    PlannerProvider.tsx   planner context, hydration, debounced autosave
    opportunityReducer.ts pure progress reducer (status, cycles, overrides, custom entries)
    OpportunityProvider.tsx progress hydration, immediate autosave, optimizer summary
  components/
    ui/                   Card, Badge, Alert, Disclosure, SegmentedControl, Sparkline, fields,
                          SaveStatus, ItemCombobox, ItemArt
    layout/               AppShell (sidebar + bottom navigation), PlaceholderPage
    home/                 target banner, resources, forecast, guarantee, opportunity summary
    planner/              sections A–D plus the sticky at-a-glance panel
    opportunities/        overview, ranked row/details, custom form, formatting
  pages/                  HomePage, PlannerPage, OpportunitiesPage, SimulatorPage, AccountPage
  test/opportunityFactory.ts  shared domain fixture
```

Data flows one way: input → validated value → reducer → pure view/optimizer model → presentational
components. Ranking and reward arithmetic never live in a React component.

## Math and assumptions

Unchanged from Milestone 1 — no planner calculation, guarantee rule or forecast assumption was
altered by Milestone 2.

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
- Opportunity rows are `<article>` elements with labelled expand/collapse buttons, grouped sections
  with accessible names, labelled filter selects, and native checkbox/range inputs.
- Category and status filters are labelled; progress status uses a labelled segmented control.
- Inputs have associated labels plus readable units; numeric fields expose a screen-reader unit.
- Touch targets are at least 44 px; the mobile bar is 56 px tall.
- `prefers-reduced-motion: reduce` removes transitions and animations, and the number hook jumps
  straight to its final value.
- Colour pairs target readable contrast on the charcoal surfaces; state is never conveyed by colour
  alone (Verified/Estimated/Completed/Already counted always have text).

## Tests

`npm test` runs **171 tests across 21 files**:

| File | Covers |
| --- | --- |
| `domain/wishes.test.ts` | exact multiples of 160, leftovers, Fates vs Primogems, clamping |
| `domain/forecast.test.ts` | inclusive income days, scenario weighting, Welkin cap, past deadlines, series/projection agreement |
| `domain/guarantee.test.ts` | character and weapon worst cases, pity credit, Fate Points, no pity mixing |
| `domain/validation.test.ts` | decimals, out-of-range pity, impossible dates, reversed ranges, past-deadline warnings |
| `domain/plannerView.test.ts` | composed budget/projection/gap, blocked forecasting, banner switching |
| `domain/itemSearch.test.ts` | partial, case-insensitive, multi-word, typo, punctuation, duplicate and limit behaviour |
| `domain/items.test.ts` | dataset size, unique ids/names, typed lookups, artwork URL and fallback |
| `domain/opportunity.test.ts` | schema rejection cases, corroborating sources, legacy saved-state compatibility, reset cycles, availability, recurring/one-time remaining rewards, progress, overrides, expiry and staleness |
| `domain/rewardOptimizer.test.ts` | ranking order, explanations, stale penalty, exclusions, repeatable cycles, daily/label/name double-counting, totals and plan gaps |
| `data/rewardCatalogue.test.ts` | every entry validates, unique ids/names, sources and dates present, Theater completion tiers, official-plus-corroborating Abyss sources, stable categories only, expected resets |
| `state/plannerReducer.test.ts` | planner reward add/update/remove, id immutability, independent plans |
| `state/opportunityReducer.test.ts` | complete/undo, per-reset toggles, clamps, reward correction, plan selection, custom add/update/delete, hydration |
| `lib/storage.test.ts` | planner round-trip, corrupt-record rejection without data deletion, localStorage fallback |
| `lib/opportunityStorage.test.ts` | progress round-trip, planner coexistence, raw-payload preservation, legacy migration, invalid-record rejection, fallback, selective clearing |
| `lib/useHashRoute.test.ts` | five routes plus Milestone 1 aliases and unknown-hash fallback |
| `lib/useAnimatedNumber.test.ts` | reduced-motion jump and initial value |
| `components/ui/ItemCombobox.test.tsx` | typeahead, partial/typo matches, keyboard select, Escape, clear, custom target, kind filtering |
| `components/ui/Disclosure.test.tsx` | expanded state, inert/aria-hidden when collapsed |
| `components/layout/AppShell.test.tsx` | five destinations, active state, working Opportunities destination, navigation callback, skip link |
| `pages/OpportunitiesPage.test.tsx` | overview, ranking order, category/status filters, complete/undo, custom create, duplicate rejection, remount persistence, Theater tier text and source links, Abyss source links, planner link |
| `pages/HomePage.test.tsx` | live opportunity summary and navigation into Opportunities |

Storage tests run against `fake-indexeddb`; UI interaction tests use Testing Library. Layout and the
Milestone 2/2.1 flows were additionally checked in Chromium at 1280 × 900, 390 × 844 and 360 × 800:
filters, complete/undo including an immediate refresh, custom create/edit/delete, plan selection,
double-counting with daily income, the Theater tier/range and source links, the Home card, and zero
horizontal overflow with no console errors.

## Known limitations

- The bundled catalogue is intentionally tiny. Events, codes, quests and exploration depend on the
  user entering amounts; they are never inferred from progress percentages.
- Effort estimates and the 1,600-Primogem score normalisation are heuristics, not measured data.
  They rank sensibly but are not a claim about your account.
- Imaginarium Theater counts only the conservative 620 (Act 8); 800 (Visionary) and 1,000 (full Lunar) are shown but never added to totals.
- Rewards are counted to the planner's banner deadline only, and no automatic detection of
  in-game completion exists.
- Progress is local to one browser profile. Clearing site data removes it; there is no account or
  sync in this milestone.
- The production bundle is a single ~504 kB JS chunk (143 kB gzip). Vite warns about the 500 kB
  threshold; route-level code splitting is a future optimisation.

## Deliberately not built yet

Wish probability simulation and Capturing Radiance modelling (Milestone 3), a full character build
optimizer, accounts, cloud sync, third-party imports, live event/banner feeds, social features, paid
APIs, service-worker offline caching and PWA install. The Wish Simulator and Account screens remain
clearly labelled placeholders with no fake data or disabled-looking fake controls.

## Privacy

PrimoPath never asks for HoYoverse credentials, cookies or session tokens, never connects to a game
account, and never uploads your plan or progress. Both planner and opportunity data stay in the
browser. The only outbound requests are for character and weapon icons from the public asset mirror
described above.
