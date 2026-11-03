import { z } from 'zod';
import { addDays, daysBetween, isValidIsoDate, parseIsoDate } from './dates';

/**
 * Reward opportunities and per-user progress.
 *
 * The catalogue (what could be earned) is kept completely separate from progress
 * (what this player has done). Regenerating or extending the catalogue therefore
 * can never reset progress, because records are keyed by opportunity id and are
 * never rewritten when an opportunity definition changes.
 */

export const REWARD_CATEGORIES = [
  'daily',
  'event',
  'web-event',
  'redeem-code',
  'spiral-abyss',
  'imaginarium-theater',
  'archon-quest',
  'world-quest',
  'exploration',
  'achievement',
  'other',
] as const;

export const rewardCategorySchema = z.enum(REWARD_CATEGORIES);
export type RewardCategory = z.infer<typeof rewardCategorySchema>;

export const CATEGORY_LABELS: Record<RewardCategory, string> = {
  daily: 'Daily commissions',
  event: 'In-game events',
  'web-event': 'Web events',
  'redeem-code': 'Redeem codes',
  'spiral-abyss': 'Spiral Abyss',
  'imaginarium-theater': 'Imaginarium Theater',
  'archon-quest': 'Archon quests',
  'world-quest': 'World quests',
  exploration: 'Exploration & chests',
  achievement: 'Achievements',
  other: 'Other sources',
};

export const verificationSchema = z.enum(['verified', 'estimated', 'user-entered']);
export type Verification = z.infer<typeof verificationSchema>;

export const VERIFICATION_LABELS: Record<Verification, string> = {
  verified: 'Verified',
  estimated: 'Estimated',
  'user-entered': 'Your entry',
};

/** Categories a custom opportunity can use in the form. */
export const CUSTOM_CATEGORIES: readonly RewardCategory[] = [
  'event',
  'web-event',
  'redeem-code',
  'exploration',
  'archon-quest',
  'world-quest',
  'achievement',
  'other',
];

/** How often an opportunity can be earned again. */
export const recurrenceSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('once') }),
  z.object({ kind: z.literal('daily') }),
  z.object({ kind: z.literal('monthly'), days: z.array(z.number().int().min(1).max(28)).min(1).max(3) }),
]);
export type Recurrence = z.infer<typeof recurrenceSchema>;

const isoDateSchema = z
  .string()
  .refine(isValidIsoDate, { message: 'Use a valid date in YYYY-MM-DD format.' });

const integerSchema = (min: number, max: number) => z.number().int().min(min).max(max);

export const rewardAmountSchema = z.object({
  primogems: integerSchema(0, 200_000),
  fates: integerSchema(0, 100),
  /**
   * Upper bound when the reward is not exact. Totals use `primogems`
   * (the conservative value); the UI shows the range.
   */
  primogemsMax: integerSchema(0, 200_000).optional(),
});
export type RewardAmount = z.infer<typeof rewardAmountSchema>;

export const OPPORTUNITY_LIMITS = {
  nameLength: 80,
  descriptionLength: 400,
  prerequisiteLength: 80,
  maxPrerequisites: 6,
  maxCatalogEntries: 100,
  maxCustomEntries: 100,
  maxRecords: 600,
  maxCycles: 400,
  maxEffortMinutes: 10_000,
} as const;

export const opportunitySchema = z
  .object({
    id: z.string().min(1).max(80),
    name: z.string().trim().min(1).max(OPPORTUNITY_LIMITS.nameLength),
    description: z.string().max(OPPORTUNITY_LIMITS.descriptionLength).default(''),
    category: rewardCategorySchema,
    reward: rewardAmountSchema,
    /** Estimated time to complete one occurrence, in minutes. Always an estimate. */
    effortMinutes: integerSchema(1, OPPORTUNITY_LIMITS.maxEffortMinutes),
    recurrence: recurrenceSchema,
    availableFrom: isoDateSchema.optional(),
    availableUntil: isoDateSchema.optional(),
    prerequisites: z
      .array(z.string().trim().min(1).max(OPPORTUNITY_LIMITS.prerequisiteLength))
      .max(OPPORTUNITY_LIMITS.maxPrerequisites)
      .default([]),
    /** `progress` lets the user record partial completion (exploration, quests). */
    tracking: z.enum(['completion', 'progress']).default('completion'),
    sourceUrl: z
      .string()
      .max(300)
      .refine((value) => /^https?:\/\//.test(value), {
        message: 'Use a full http(s) source URL.',
      })
      .optional(),
    sourceLabel: z.string().max(80).optional(),
    verifiedOn: isoDateSchema.optional(),
    verification: verificationSchema,
    isCustom: z.boolean().default(false),
  })
  .superRefine((value, ctx) => {
    if (
      value.reward.primogemsMax !== undefined &&
      value.reward.primogemsMax < value.reward.primogems
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['reward', 'primogemsMax'],
        message: 'The upper estimate cannot be below the conservative reward.',
      });
    }
    if (
      value.availableFrom !== undefined &&
      value.availableUntil !== undefined &&
      value.availableUntil < value.availableFrom
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['availableUntil'],
        message: 'The end date cannot be earlier than the start date.',
      });
    }
    if (!value.isCustom && value.verification !== 'user-entered' && !value.sourceUrl) {
      ctx.addIssue({
        code: 'custom',
        path: ['sourceUrl'],
        message: 'Catalogue rewards need a traceable source URL.',
      });
    }
    if (value.isCustom && value.verification !== 'user-entered') {
      ctx.addIssue({
        code: 'custom',
        path: ['verification'],
        message: 'Custom opportunities are always marked as your own entry.',
      });
    }
  });

export type Opportunity = z.infer<typeof opportunitySchema>;

export const opportunityStatusSchema = z.enum(['todo', 'in-progress', 'done', 'unavailable']);
export type OpportunityStatus = z.infer<typeof opportunityStatusSchema>;

export const STATUS_LABELS: Record<OpportunityStatus, string> = {
  todo: 'Not started',
  'in-progress': 'In progress',
  done: 'Completed',
  unavailable: 'Not applicable',
};

export const opportunityProgressSchema = z.object({
  id: z.string().min(1).max(80),
  status: opportunityStatusSchema.default('todo'),
  /** Cycle keys already claimed. `once` marks a one-time opportunity. */
  completedCycles: z.array(z.string().min(1).max(40)).max(OPPORTUNITY_LIMITS.maxCycles).default([]),
  /** 0–100, only meaningful for `tracking: 'progress'` opportunities. */
  progressPercent: integerSchema(0, 100).optional(),
  /** User correction when the catalogue value is wrong for their account. */
  rewardOverridePrimogems: integerSchema(0, 200_000).optional(),
  /** Selected by the user for their personal opportunity plan. */
  planned: z.boolean().default(false),
});
export type OpportunityProgress = z.infer<typeof opportunityProgressSchema>;

export const OPPORTUNITY_STATE_VERSION = 1 as const;

export const opportunityStateSchema = z.object({
  version: z.literal(OPPORTUNITY_STATE_VERSION),
  records: z.array(opportunityProgressSchema).max(OPPORTUNITY_LIMITS.maxRecords),
  custom: z.array(opportunitySchema).max(OPPORTUNITY_LIMITS.maxCustomEntries),
});
export type OpportunityState = z.infer<typeof opportunityStateSchema>;

export function createDefaultOpportunityState(): OpportunityState {
  return { version: OPPORTUNITY_STATE_VERSION, records: [], custom: [] };
}

export function createEmptyProgress(id: string): OpportunityProgress {
  return { id, status: 'todo', completedCycles: [], planned: false };
}

/** Lowercase, strip punctuation and collapse whitespace, for duplicate checks. */
export function normalizeOpportunityName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

/** Total calendar days an opportunity is claimable, or null when open-ended. */
export function availabilityWindow(
  opportunity: Opportunity,
  today: string,
  deadline: string,
): { from: string | null; until: string | null } {
  const from =
    opportunity.availableFrom && opportunity.availableFrom > today
      ? opportunity.availableFrom
      : null;
  const until =
    opportunity.availableUntil && opportunity.availableUntil < deadline
      ? opportunity.availableUntil
      : deadline;
  return { from, until };
}

export function isExpired(opportunity: Opportunity, today: string): boolean {
  return opportunity.availableUntil !== undefined && opportunity.availableUntil < today;
}

export function isUpcoming(opportunity: Opportunity, today: string): boolean {
  return opportunity.availableFrom !== undefined && opportunity.availableFrom > today;
}

/** Most recent reset day (monthly recurrence) on or before `today`. */
export function latestMonthlyReset(days: readonly number[], todayIso: string): string {
  const today = parseIsoDate(todayIso);
  if (!today) return todayIso;
  const year = today.getUTCFullYear();
  const month = today.getUTCMonth();
  const candidates: string[] = [];
  for (const candidate of [0, -1]) {
    const anchor = new Date(Date.UTC(year, month + candidate, 1));
    for (const day of days) {
      const iso = `${anchor.getUTCFullYear()}-${String(anchor.getUTCMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      if (isValidIsoDate(iso) && iso <= todayIso) candidates.push(iso);
    }
  }
  return candidates.sort().at(-1) ?? todayIso;
}

/** Cycle key that identifies the currently open occurrence. */
export function cycleKeyFor(opportunity: Opportunity, today: string): string {
  switch (opportunity.recurrence.kind) {
    case 'daily':
      return `d:${today}`;
    case 'monthly':
      return `m:${latestMonthlyReset(opportunity.recurrence.days, today)}`;
    case 'once':
    default:
      return 'once';
  }
}

/** Human-readable start of the current cycle, e.g. "16 Nov 2026". */
export function currentCycleStartedOn(opportunity: Opportunity, today: string): string | null {
  if (opportunity.recurrence.kind === 'daily') return today;
  if (opportunity.recurrence.kind === 'monthly') {
    return latestMonthlyReset(opportunity.recurrence.days, today);
  }
  return null;
}

/**
 * Reset dates strictly after `today` and on or before `until`.
 * Used to count how many future occurrences still fit before a deadline.
 */
export function futureResetDates(
  opportunity: Opportunity,
  today: string,
  until: string,
): string[] {
  if (opportunity.recurrence.kind !== 'monthly') return [];
  const dates: string[] = [];
  const start = parseIsoDate(today);
  const end = parseIsoDate(until);
  if (!start || !end) return dates;
  // Walk month by month from the current month through the deadline month.
  const cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1));
  for (let guard = 0; guard < 64; guard += 1) {
    for (const day of opportunity.recurrence.days) {
      const iso = `${cursor.getUTCFullYear()}-${String(cursor.getUTCMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      if (isValidIsoDate(iso) && iso > today && iso <= until) dates.push(iso);
    }
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
    if (cursor.getTime() > end.getTime()) break;
  }
  return dates.sort();
}

/**
 * Occurrences available between today and `until` (inclusive), ignoring
 * completion. For monthly resets this counts the currently open cycle once plus
 * every future reset that lands on or before the deadline.
 */
export function occurrencesAvailable(opportunity: Opportunity, today: string, until: string): number {
  if (isExpired(opportunity, today) || isUpcoming(opportunity, today)) return 0;
  const end = opportunity.availableUntil && opportunity.availableUntil < until
    ? opportunity.availableUntil
    : until;
  if (end < today) return 0;

  switch (opportunity.recurrence.kind) {
    case 'daily':
      return daysBetween(today, end) + 1;
    case 'monthly':
      return 1 + futureResetDates(opportunity, today, end).length;
    case 'once':
    default:
      return 1;
  }
}

export interface RemainingReward {
  primogems: number;
  fates: number;
  occurrences: number;
  /** True when the number rests on an estimate or partial progress. */
  estimated: boolean;
}

/**
 * Reward still obtainable for one opportunity, excluding cycles already claimed
 * and applying any partial-progress estimate or reward correction.
 */
export function remainingReward(
  opportunity: Opportunity,
  progress: OpportunityProgress,
  today: string,
  deadline: string,
): RemainingReward {
  if (progress.status === 'unavailable' || progress.status === 'done') {
    return { primogems: 0, fates: 0, occurrences: 0, estimated: false };
  }
  if (isExpired(opportunity, today) || isUpcoming(opportunity, today)) {
    return { primogems: 0, fates: 0, occurrences: 0, estimated: false };
  }

  const openCycles = occurrencesAvailable(opportunity, today, deadline);
  const currentKey = cycleKeyFor(opportunity, today);
  const completed = new Set(progress.completedCycles);
  let occurrences = openCycles;
  // Every cycle after the current one is unclaimed, so only the open cycle can
  // reduce the count.
  if (completed.has(currentKey)) occurrences = Math.max(0, openCycles - 1);
  if (occurrences === 0) return { primogems: 0, fates: 0, occurrences: 0, estimated: false };

  const basePrimogems =
    progress.rewardOverridePrimogems !== undefined
      ? progress.rewardOverridePrimogems
      : opportunity.reward.primogems;
  const baseFates = opportunity.reward.fates;

  let primogems = basePrimogems * occurrences;
  let fates = baseFates * occurrences;
  let estimated = opportunity.verification !== 'verified';

  // Partial progress only applies to one-time, progress-tracked opportunities;
  // repeatable rewards are claimed per cycle instead.
  if (
    opportunity.tracking === 'progress' &&
    opportunity.recurrence.kind === 'once' &&
    progress.progressPercent !== undefined &&
    progress.progressPercent > 0
  ) {
    primogems = Math.max(0, Math.round(primogems * (1 - progress.progressPercent / 100)));
    fates = 0;
    estimated = true;
  }

  return { primogems, fates, occurrences, estimated };
}

/** Days until the opportunity stops being claimable, or null when permanent. */
export function daysUntilExpiry(opportunity: Opportunity, today: string): number | null {
  if (!opportunity.availableUntil) return null;
  return daysBetween(today, opportunity.availableUntil);
}

/** A source older than this is flagged as stale in the UI and ranking. */
export const STALE_AFTER_DAYS = 180;

export function isStale(opportunity: Opportunity, today: string): boolean {
  if (opportunity.verification === 'user-entered' || !opportunity.verifiedOn) return false;
  return daysBetween(opportunity.verifiedOn, today) > STALE_AFTER_DAYS;
}

/** Date helpers re-exported for the catalogue sanity checks. */
export const opportunityDateHelpers = { addDays, daysBetween, isValidIsoDate };
