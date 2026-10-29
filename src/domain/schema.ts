import { z } from 'zod';
import { isValidIsoDate } from './dates';
import { MECHANICS } from './mechanics';

/** Input ranges accepted by the planner forms. Shared by UI and persistence. */
export const LIMITS = {
  primogems: { min: 0, max: 9_999_999 },
  fateCount: { min: 0, max: 9_999 },
  dailyPrimogems: { min: 0, max: 10_000 },
  welkinDays: { min: 0, max: 365 },
  oneTimePrimogems: { min: 0, max: 1_000_000 },
  oneTimeFates: { min: 0, max: 1_000 },
  rewardLabelLength: 60,
  targetNameLength: 80,
  /** Guard so the forecast cannot try to render an absurd time span. */
  maxForecastDays: 1_200,
} as const;

export const STATE_VERSION = 1 as const;

const isoDateSchema = z
  .string()
  .refine(isValidIsoDate, { message: 'Use a valid date in YYYY-MM-DD format.' });

const integerSchema = (min: number, max: number) =>
  z.number().int().min(min).max(max);

export const bannerTypeSchema = z.enum(['character', 'weapon']);
export type BannerType = z.infer<typeof bannerTypeSchema>;

export const confidenceSchema = z.enum(['confirmed', 'likely', 'uncertain']);
export type Confidence = z.infer<typeof confidenceSchema>;

export const resourcesSchema = z.object({
  primogems: integerSchema(LIMITS.primogems.min, LIMITS.primogems.max),
  intertwinedFates: integerSchema(LIMITS.fateCount.min, LIMITS.fateCount.max),
});
export type Resources = z.infer<typeof resourcesSchema>;

export const oneTimeRewardSchema = z.object({
  id: z.string().min(1),
  label: z.string().max(LIMITS.rewardLabelLength),
  primogems: integerSchema(LIMITS.oneTimePrimogems.min, LIMITS.oneTimePrimogems.max),
  fates: integerSchema(LIMITS.oneTimeFates.min, LIMITS.oneTimeFates.max),
  confidence: confidenceSchema,
});
export type OneTimeReward = z.infer<typeof oneTimeRewardSchema>;

export const incomeSchema = z.object({
  /** Commissions, Welkin-excluded recurring Primogems per day. */
  dailyPrimogems: integerSchema(LIMITS.dailyPrimogems.min, LIMITS.dailyPrimogems.max),
  /** Days of Blessing of the Welkin Moon left; adds 90 Primogems per day used. */
  welkinDaysRemaining: integerSchema(LIMITS.welkinDays.min, LIMITS.welkinDays.max),
});
export type Income = z.infer<typeof incomeSchema>;

const planBase = {
  targetName: z.string().max(LIMITS.targetNameLength),
  startDate: isoDateSchema,
  endDate: isoDateSchema,
};

export const characterPlanSchema = z.object({
  ...planBase,
  bannerType: z.literal('character'),
  pity: integerSchema(0, MECHANICS.character.hardPity - 1),
  /** True when the next applicable 5-star is guaranteed to be the featured one. */
  guaranteed: z.boolean(),
});
export type CharacterPlan = z.infer<typeof characterPlanSchema>;

export const weaponPlanSchema = z.object({
  ...planBase,
  bannerType: z.literal('weapon'),
  pity: integerSchema(0, MECHANICS.weapon.hardPity - 1),
  /** Epitomized Path Fate Points already accumulated (0–2). */
  fatePoints: integerSchema(0, MECHANICS.weapon.fatePointsToGuarantee),
});
export type WeaponPlan = z.infer<typeof weaponPlanSchema>;

export type Plan = CharacterPlan | WeaponPlan;

export const plannerStateSchema = z.object({
  version: z.literal(STATE_VERSION),
  activeBanner: bannerTypeSchema,
  resources: resourcesSchema,
  income: incomeSchema,
  oneTimeRewards: z.array(oneTimeRewardSchema).max(50),
  characterPlan: characterPlanSchema,
  weaponPlan: weaponPlanSchema,
});
export type PlannerState = z.infer<typeof plannerStateSchema>;

/** Whether the plan carries a non-empty target name. */
export function hasTarget(plan: Plan): boolean {
  return plan.targetName.trim().length > 0;
}

export function createDefaultState(today: string, endDate: string): PlannerState {
  return {
    version: STATE_VERSION,
    activeBanner: 'character',
    resources: { primogems: 0, intertwinedFates: 0 },
    income: { dailyPrimogems: 60, welkinDaysRemaining: 0 },
    oneTimeRewards: [],
    characterPlan: {
      bannerType: 'character',
      targetName: '',
      startDate: today,
      endDate,
      pity: 0,
      guaranteed: false,
    },
    weaponPlan: {
      bannerType: 'weapon',
      targetName: '',
      startDate: today,
      endDate,
      pity: 0,
      fatePoints: 0,
    },
  };
}
