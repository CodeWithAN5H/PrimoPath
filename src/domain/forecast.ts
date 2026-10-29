import { addDays, incomeDays } from './dates';
import type { Confidence, Income, OneTimeReward, Resources } from './schema';
import { wishBudget, type WishBudget } from './wishes';

/** Documented Primogems granted per remaining Welkin Moon day. */
export const WELKIN_PRIMOGEMS_PER_DAY = 90;

export type ScenarioId = 'conservative' | 'expected' | 'optimistic';

export interface ScenarioMeta {
  id: ScenarioId;
  label: string;
  summary: string;
  detail: string;
}

/** How strongly each confidence level is counted into a scenario. */
export const SCENARIO_WEIGHTS: Record<ScenarioId, Record<Confidence, number>> = {
  conservative: { confirmed: 1, likely: 0, uncertain: 0 },
  expected: { confirmed: 1, likely: 1, uncertain: 0.5 },
  optimistic: { confirmed: 1, likely: 1, uncertain: 1 },
};

export const SCENARIOS: readonly ScenarioMeta[] = [
  {
    id: 'conservative',
    label: 'Conservative',
    summary: 'Confirmed rewards only',
    detail:
      'Counts only rewards you marked as confirmed. Daily and Welkin income are counted in full for every day up to the deadline.',
  },
  {
    id: 'expected',
    label: 'Expected',
    summary: 'Confirmed + likely + half of uncertain',
    detail:
      'Counts confirmed and likely rewards in full and half of the value you marked uncertain. Daily and Welkin income are counted in full.',
  },
  {
    id: 'optimistic',
    label: 'Optimistic',
    summary: 'Every listed reward',
    detail:
      'Counts every reward in your list, including uncertain ones. Treat this as a ceiling, not a promise.',
  },
] as const;

export interface PlannerInputs {
  resources: Resources;
  income: Income;
  oneTimeRewards: readonly OneTimeReward[];
}

export interface ScenarioGain {
  primogems: number;
  fates: number;
}

/** Weighted one-time reward totals for a scenario. Fates are floored. */
export function weightedRewardGain(
  rewards: readonly OneTimeReward[],
  weights: Record<Confidence, number>,
): ScenarioGain {
  let primogems = 0;
  let fates = 0;
  for (const reward of rewards) {
    const weight = weights[reward.confidence];
    primogems += reward.primogems * weight;
    fates += reward.fates * weight;
  }
  return { primogems, fates: Math.floor(fates) };
}

export interface IncomeProjection {
  scenario: ScenarioId;
  /** Daily income ticks counted, inclusive of today and the deadline. */
  days: number;
  welkinDaysApplied: number;
  dailyPrimogems: number;
  welkinPrimogems: number;
  rewardPrimogems: number;
  rewardFates: number;
  gainedWishes: number;
  projected: WishBudget;
}

/**
 * Projects the wish budget for one scenario at a deadline.
 *
 * Assumptions (also surfaced in the UI):
 * - Income accrues once per day from today through the deadline, inclusive.
 * - One-time rewards are treated as received by the deadline, not on a date.
 * - Fractional scenario weights do not create partial Fates; they are floored.
 */
export function projectScenario(
  inputs: PlannerInputs,
  fromIso: string,
  deadlineIso: string,
  scenario: ScenarioId,
): IncomeProjection {
  const days = incomeDays(fromIso, deadlineIso);
  const welkinDaysApplied = Math.min(inputs.income.welkinDaysRemaining, days);
  const dailyPrimogems = inputs.income.dailyPrimogems * days;
  const welkinPrimogems = welkinDaysApplied * WELKIN_PRIMOGEMS_PER_DAY;
  const gain = weightedRewardGain(inputs.oneTimeRewards, SCENARIO_WEIGHTS[scenario]);

  // A deadline that already passed can gain nothing — not even listed rewards,
  // which are only credited if they can be claimed before the deadline.
  if (days === 0) {
    return {
      scenario,
      days: 0,
      welkinDaysApplied: 0,
      dailyPrimogems: 0,
      welkinPrimogems: 0,
      rewardPrimogems: 0,
      rewardFates: 0,
      gainedWishes: 0,
      projected: wishBudget(
        inputs.resources.primogems,
        inputs.resources.intertwinedFates,
      ),
    };
  }

  const projected = wishBudget(
    inputs.resources.primogems + dailyPrimogems + welkinPrimogems + gain.primogems,
    inputs.resources.intertwinedFates + gain.fates,
  );
  const current = wishBudget(
    inputs.resources.primogems,
    inputs.resources.intertwinedFates,
  );

  return {
    scenario,
    days,
    welkinDaysApplied,
    dailyPrimogems,
    welkinPrimogems,
    rewardPrimogems: gain.primogems,
    rewardFates: gain.fates,
    gainedWishes: projected.wishes - current.wishes,
    projected,
  };
}

export function projectAllScenarios(
  inputs: PlannerInputs,
  fromIso: string,
  deadlineIso: string,
): Record<ScenarioId, IncomeProjection> {
  return {
    conservative: projectScenario(inputs, fromIso, deadlineIso, 'conservative'),
    expected: projectScenario(inputs, fromIso, deadlineIso, 'expected'),
    optimistic: projectScenario(inputs, fromIso, deadlineIso, 'optimistic'),
  };
}

export interface ForecastPoint {
  date: string;
  dayIndex: number;
  wishes: number;
  primogems: number;
}

/**
 * Cumulative wish forecast for a chart.
 *
 * Each point represents the end of an income day. The last point is the banner
 * deadline and always equals the scenario projection total. The first point is
 * today's starting budget (anchored one day before the first income day on the
 * date axis, so the deadline stays on the right edge). One-time rewards are
 * spread evenly across the remaining days; totals are unaffected.
 */
export function forecastSeries(
  inputs: PlannerInputs,
  fromIso: string,
  deadlineIso: string,
  scenario: ScenarioId,
  maxPoints = 32,
): ForecastPoint[] {
  const days = incomeDays(fromIso, deadlineIso);
  const gain = weightedRewardGain(inputs.oneTimeRewards, SCENARIO_WEIGHTS[scenario]);

  const valueAt = (steps: number): { wishes: number; primogems: number } => {
    const progress = days > 0 ? Math.min(1, steps / days) : 0;
    const welkinDays = Math.min(inputs.income.welkinDaysRemaining, steps);
    const primogems =
      inputs.resources.primogems +
      inputs.income.dailyPrimogems * steps +
      welkinDays * WELKIN_PRIMOGEMS_PER_DAY +
      gain.primogems * progress;
    const fates = inputs.resources.intertwinedFates + Math.floor(gain.fates * progress);
    return {
      wishes: wishBudget(primogems, fates).wishes,
      primogems: Math.round(primogems),
    };
  };

  const pointAt = (steps: number): ForecastPoint => ({
    date: days > 0 ? addDays(deadlineIso, steps - days) : deadlineIso,
    dayIndex: steps,
    ...valueAt(steps),
  });

  if (days === 0) return [pointAt(0)];

  const step = Math.max(1, Math.ceil(days / Math.max(2, maxPoints - 1)));
  const indices = new Set<number>([0, days]);
  for (let i = step; i < days; i += step) indices.add(i);

  return [...indices].sort((a, b) => a - b).map(pointAt);
}
