import { opportunitySchema, type Opportunity } from '../domain/opportunity';

/**
 * Bundled reward catalogue.
 *
 * Deliberately small: only rewards whose amounts are stable enough to attribute
 * to a source are shipped here. Time-limited events, web events, redeem codes,
 * chest counts, quest rewards and achievements change too often (and are too
 * account-specific) to bundle safely, so those categories are filled in by the
 * user through the custom-opportunity form. PrimoPath would rather show one
 * verified reward than a page of invented ones.
 *
 * Every entry records where the number came from and when it was checked.
 * Effort estimates are always PrimoPath estimates, never sourced data.
 */
const CATALOGUE_ENTRIES: readonly Opportunity[] = [
  {
    id: 'daily-commissions',
    name: 'Daily Commissions',
    description:
      'Four commissions plus the Katheryne completion bonus. Counted once per day up to your banner deadline.',
    category: 'daily',
    reward: { primogems: 60, fates: 0 },
    effortMinutes: 15,
    recurrence: { kind: 'daily' },
    prerequisites: [],
    tracking: 'completion',
    verification: 'verified',
    sourceUrl: 'https://www.hoyolab.com/article/35566777',
    sourceLabel: 'HoYoLAB — Daily Commissions guide',
    verifiedOn: '2026-11-03',
    isCustom: false,
  },
  {
    id: 'spiral-abyss-reset',
    name: 'Spiral Abyss — Floors 9–12',
    description:
      'Star’s Bounty from the twelve chambers of Floors 9–12. Resets monthly, so only the current and future resets before your deadline are counted.',
    category: 'spiral-abyss',
    reward: { primogems: 800, fates: 0 },
    effortMinutes: 120,
    recurrence: { kind: 'monthly', days: [16] },
    prerequisites: ['Floors 9–12 unlocked', 'Two capable teams'],
    tracking: 'completion',
    verification: 'verified',
    sourceUrl:
      'https://support.hoyoverse.com/hc/en-us/articles/50333950598553-When-does-the-Spiral-Abyss-reset-and-what-are-the-rewards',
    sourceLabel: 'HoYoverse Support — reset schedule; Hu Tao guide — 800 Primogems per reset',
    verifiedOn: '2026-11-03',
    isCustom: false,
  },
  {
    id: 'imaginarium-theater-season',
    name: 'Imaginarium Theater — Performance Tour',
    description:
      'Recurring Performance Tour rewards for clearing the season. Community guides report 620 Primogems for all eight acts, while newer sources list up to 1,000, so the conservative 620 is counted and the range is shown.',
    category: 'imaginarium-theater',
    reward: { primogems: 620, fates: 0, primogemsMax: 1000 },
    effortMinutes: 90,
    recurrence: { kind: 'monthly', days: [1] },
    prerequisites: ['Imaginarium Theater unlocked', 'Enough qualifying characters for the season'],
    tracking: 'completion',
    verification: 'estimated',
    sourceUrl: 'https://hutaobot.moe/guides/imaginarium-theater/rewards',
    sourceLabel: 'Hu Tao guide — Imaginarium Theater rewards',
    verifiedOn: '2026-11-03',
    isCustom: false,
  },
];

/** Parsed at module load so malformed catalogue data fails loudly, not silently. */
export const REWARD_CATALOGUE: readonly Opportunity[] = CATALOGUE_ENTRIES.map((entry) =>
  opportunitySchema.parse(entry),
);

export const REWARD_CATALOGUE_SOURCE_NOTE =
  'Only stable, documented rewards are bundled. Events, codes, exploration and quest rewards are entered by you.';
