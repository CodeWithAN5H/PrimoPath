import {
  cycleKeyFor,
  daysUntilExpiry,
  isExpired,
  isStale,
  isUpcoming,
  normalizeOpportunityName,
  occurrencesAvailable,
  remainingReward,
  createEmptyProgress,
  type Opportunity,
  type OpportunityProgress,
} from './opportunity';
import { daysBetween } from './dates';
import { wishBudget } from './wishes';

/**
 * Transparent reward optimizer.
 *
 * Pure functions only: the UI passes catalogue + progress + a snapshot of the
 * planner, and receives evaluations, totals and a ranked list. Everything is
 * deterministic so ranking and explanations can be unit-tested.
 */

export type OpportunityDisplayState =
  | 'available'
  | 'completed'
  | 'expired'
  | 'upcoming'
  | 'unavailable'
  | 'already-counted'
  | 'duplicate';

export type Priority = 'high' | 'medium' | 'low';

export const PRIORITY_THRESHOLDS: Record<Exclude<Priority, 'low'>, number> = {
  high: 60,
  medium: 35,
};

/** Score weights, exported so the UI can explain the ranking honestly. */
export const SCORE_WEIGHTS = {
  reward: 0.4,
  effortEfficiency: 0.3,
  urgency: 0.18,
  confidence: 0.12,
} as const;

export interface PlannerSnapshot {
  today: string;
  deadline: string;
  /** Primogems per day already counted as recurring income in the planner. */
  dailyPrimogems: number;
  /** Labels of one-time rewards already listed in the planner. */
  oneTimeRewardLabels: readonly string[];
  budgetWishes: number;
  projectedWishes: number;
  guaranteeWishes: number;
  canForecast: boolean;
}

export interface OpportunityEvaluation {
  opportunity: Opportunity;
  progress: OpportunityProgress;
  state: OpportunityDisplayState;
  /** Occurrences still unclaimed before the deadline (or expiry). */
  occurrences: number;
  remainingPrimogems: number;
  remainingFates: number;
  /** Upper bound when the reward is a range, otherwise null. */
  rewardMaxPrimogems: number | null;
  effortMinutes: number;
  score: number;
  priority: Priority;
  reasons: string[];
  stale: boolean;
  currentCycleKey: string;
  completedCurrentCycle: boolean;
  stateNote: string | null;
}

export interface OpportunityTotals {
  obtainablePrimogems: number;
  obtainableFates: number;
  obtainableWishes: number;
  verifiedPrimogems: number;
  estimatedPrimogems: number;
  userEnteredPrimogems: number;
  highPriorityPrimogems: number;
  plannedPrimogems: number;
  plannedWishes: number;
  expiringSoonCount: number;
  expiringSoonPrimogems: number;
  completedCount: number;
  availableCount: number;
  totalCount: number;
}

export interface OpportunityPlanImpact {
  budgetWishes: number;
  projectedWishes: number;
  guaranteeWishes: number;
  projectedWithOpportunitiesWishes: number;
  gapAfterOpportunities: number;
  projectedWithPlannedWishes: number;
  gapAfterPlanned: number;
  canForecast: boolean;
}

export interface OpportunitySummary {
  evaluations: OpportunityEvaluation[];
  recommendations: OpportunityEvaluation[];
  totals: OpportunityTotals;
  plan: OpportunityPlanImpact;
}

const EXPIRING_SOON_DAYS = 7;

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

/** Planner labels count an opportunity if one name meaningfully contains the other. */
function isAlreadyInPlanner(opportunity: Opportunity, labels: readonly string[]): boolean {
  const target = normalizeOpportunityName(opportunity.name);
  return labels.some((label) => {
    const normalized = normalizeOpportunityName(label);
    if (normalized.length < 5 || target.length < 5) return false;
    return (
      normalized === target || target.includes(normalized) || normalized.includes(target)
    );
  });
}

function dailyShortfall(opportunity: Opportunity, plannedDaily: number): number | null {
  if (opportunity.recurrence.kind !== 'daily') return null;
  return Math.max(0, opportunity.reward.primogems - plannedDaily);
}

function scoreFor(
  remainingPrimogems: number,
  effortMinutes: number,
  opportunity: Opportunity,
  today: string,
  stale: boolean,
): number {
  const valueScore = clamp01(remainingPrimogems / 1600);
  const perMinute = remainingPrimogems / Math.max(10, effortMinutes);
  const effortScore = clamp01(perMinute / 20);
  const days = daysUntilExpiry(opportunity, today);
  const urgencyScore = days === null ? 0 : clamp01(1 - Math.max(0, days) / 14);
  const confidence =
    opportunity.verification === 'verified'
      ? 1
      : opportunity.verification === 'estimated'
        ? 0.55
        : 0.7;

  const raw =
    100 *
    (SCORE_WEIGHTS.reward * valueScore +
      SCORE_WEIGHTS.effortEfficiency * effortScore +
      SCORE_WEIGHTS.urgency * urgencyScore +
      SCORE_WEIGHTS.confidence * confidence);

  // A stale source lowers confidence without hiding the opportunity.
  return Math.round(Math.max(0, Math.min(100, raw - (stale ? 8 : 0))));
}

function priorityFor(score: number): Priority {
  if (score >= PRIORITY_THRESHOLDS.high) return 'high';
  if (score >= PRIORITY_THRESHOLDS.medium) return 'medium';
  return 'low';
}

function formatEffort(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = minutes / 60;
  return `${Number.isInteger(hours) ? hours : hours.toFixed(1)} h`;
}

function buildReasons(
  evaluation: Omit<OpportunityEvaluation, 'reasons' | 'score' | 'priority'>,
  today: string,
  plannedDaily: number,
): string[] {
  const { opportunity, remainingPrimogems, occurrences, stale } = evaluation;
  const reasons: string[] = [];
  const days = daysUntilExpiry(opportunity, today);

  if (days !== null && days <= EXPIRING_SOON_DAYS && days >= 0) {
    reasons.push(
      days === 0
        ? 'Expires today, so it is the most time-sensitive reward here.'
        : `Expires in ${days} day${days === 1 ? '' : 's'}, so there is little time left.`,
    );
  }

  if (remainingPrimogems >= 600) {
    reasons.push(`Large reward: ${remainingPrimogems.toLocaleString('en-US')} Primogems.`);
  }

  if (opportunity.effortMinutes <= 20) {
    reasons.push(`Low effort (about ${formatEffort(opportunity.effortMinutes)}).`);
  } else if (opportunity.effortMinutes >= 120) {
    reasons.push(
      `High effort (about ${formatEffort(opportunity.effortMinutes)}); best kept for a free session.`,
    );
  }

  if (opportunity.verification === 'verified') {
    reasons.push('Reward is verified against a documented source.');
  } else if (opportunity.verification === 'estimated') {
    const range = opportunity.reward.primogemsMax
      ? ` (${opportunity.reward.primogems.toLocaleString('en-US')}–${opportunity.reward.primogemsMax.toLocaleString('en-US')})`
      : '';
    reasons.push(
      `Reward is an estimate${range}; the conservative value is counted, and the maximum requires fuller completion.`,
    );
  } else {
    reasons.push('You entered this reward, so PrimoPath cannot verify it.');
  }

  if (occurrences > 1) {
    reasons.push(
      `Recurring: ${occurrences} unclaimed occurrences before your deadline.`,
    );
  }

  if (opportunity.prerequisites.length > 0) {
    reasons.push(`Requires: ${opportunity.prerequisites.join(', ')}.`);
  }

  if (stale) {
    reasons.push('The source is over six months old; re-check it before relying on this.');
  }

  const shortfall = dailyShortfall(opportunity, plannedDaily);
  if (shortfall !== null && shortfall > 0 && plannedDaily > 0) {
    reasons.push(
      `Your planner already counts ${plannedDaily}/day of daily income; only the ${shortfall}/day difference is included.`,
    );
  }

  return reasons;
}

function evaluateOne(
  opportunity: Opportunity,
  recordsById: ReadonlyMap<string, OpportunityProgress>,
  planner: PlannerSnapshot,
  duplicate: boolean,
): OpportunityEvaluation {
  const progress = recordsById.get(opportunity.id) ?? createEmptyProgress(opportunity.id);
  const stale = isStale(opportunity, planner.today);
  const currentCycleKey = cycleKeyFor(opportunity, planner.today);
  const completedCurrentCycle =
    progress.status === 'done' || progress.completedCycles.includes(currentCycleKey);

  const base = remainingReward(opportunity, progress, planner.today, planner.deadline);
  const shortfall = dailyShortfall(opportunity, planner.dailyPrimogems);
  const alreadyInPlanner = isAlreadyInPlanner(opportunity, planner.oneTimeRewardLabels);

  let remainingPrimogems = base.primogems;
  if (shortfall !== null && base.occurrences > 0) {
    remainingPrimogems = shortfall * base.occurrences;
  }

  const openCycles = occurrencesAvailable(opportunity, planner.today, planner.deadline);
  const maxPerCycle = opportunity.reward.primogemsMax ?? null;
  const rewardMaxPrimogems =
    maxPerCycle === null ? null : maxPerCycle * Math.max(0, base.occurrences);

  let state: OpportunityDisplayState;
  let stateNote: string | null = null;

  if (duplicate) {
    state = 'duplicate';
    stateNote = 'Another opportunity with this name is already counted, so this copy is ignored.';
  } else if (progress.status === 'unavailable') {
    state = 'unavailable';
    stateNote = 'Marked not applicable for your account.';
  } else if (progress.status === 'done') {
    state = 'completed';
    stateNote = 'Marked completed.';
  } else if (isExpired(opportunity, planner.today)) {
    state = 'expired';
    stateNote = `Expired on ${opportunity.availableUntil}.`;
  } else if (isUpcoming(opportunity, planner.today)) {
    state = 'upcoming';
    stateNote = `Starts on ${opportunity.availableFrom}.`;
  } else if (shortfall === 0) {
    state = 'already-counted';
    remainingPrimogems = 0;
    stateNote =
      planner.dailyPrimogems > 0
        ? `Your planner already counts ${planner.dailyPrimogems} Primogems/day of recurring income, which covers this.`
        : 'Nothing is left to claim here.';
  } else if (alreadyInPlanner) {
    state = 'already-counted';
    remainingPrimogems = 0;
    stateNote = 'A one-time reward with a matching name is already in your planner.';
  } else if (remainingPrimogems === 0 && base.fates === 0) {
    state = 'completed';
    stateNote =
      openCycles > 0
        ? 'This reset is done and no further reset falls before your deadline.'
        : 'Nothing remains before your deadline.';
  } else {
    state = 'available';
  }

  const evaluation: Omit<OpportunityEvaluation, 'reasons' | 'score' | 'priority'> = {
    opportunity,
    progress,
    state,
    occurrences: base.occurrences,
    remainingPrimogems: state === 'available' ? remainingPrimogems : 0,
    remainingFates: state === 'available' ? base.fates : 0,
    rewardMaxPrimogems,
    effortMinutes: opportunity.effortMinutes,
    stale,
    currentCycleKey,
    completedCurrentCycle,
    stateNote,
  };

  const score =
    state === 'available'
      ? scoreFor(
          evaluation.remainingPrimogems,
          opportunity.effortMinutes,
          opportunity,
          planner.today,
          stale,
        )
      : 0;

  return {
    ...evaluation,
    score,
    priority: priorityFor(score),
    reasons: state === 'available' ? buildReasons(evaluation, planner.today, planner.dailyPrimogems) : [],
  };
}

/**
 * Builds every evaluation, the totals and the ranked recommendations.
 *
 * Catalogue entries win duplicate-name conflicts, because they are the sourced
 * definitions; a user copy with the same name is displayed but never counted.
 */
export function buildOpportunitySummary(
  state: Pick<{ records: OpportunityProgress[]; custom: Opportunity[] }, 'records' | 'custom'>,
  planner: PlannerSnapshot,
  catalogue: readonly Opportunity[],
): OpportunitySummary {
  const recordsById = new Map(state.records.map((record) => [record.id, record]));
  const seenNames = new Set<string>();
  const evaluations: OpportunityEvaluation[] = [];

  for (const opportunity of [...catalogue, ...state.custom]) {
    const key = normalizeOpportunityName(opportunity.name);
    const duplicate = seenNames.has(key);
    if (!duplicate) seenNames.add(key);
    evaluations.push(evaluateOne(opportunity, recordsById, planner, duplicate));
  }

  const available = evaluations.filter((evaluation) => evaluation.state === 'available');
  const recommendations = [...available].sort(
    (a, b) =>
      b.score - a.score ||
      b.remainingPrimogems - a.remainingPrimogems ||
      a.opportunity.name.localeCompare(b.opportunity.name, 'en'),
  );

  const sumPrimogems = (list: OpportunityEvaluation[]) =>
    list.reduce((total, evaluation) => total + evaluation.remainingPrimogems, 0);
  const sumFates = (list: OpportunityEvaluation[]) =>
    list.reduce((total, evaluation) => total + evaluation.remainingFates, 0);

  const obtainablePrimogems = sumPrimogems(available);
  const obtainableFates = sumFates(available);
  const obtainableWishes = wishBudget(obtainablePrimogems, obtainableFates).wishes;

  const planned = available.filter((evaluation) => evaluation.progress.planned);
  const plannedPrimogems = sumPrimogems(planned);
  const plannedWishes = wishBudget(plannedPrimogems, sumFates(planned)).wishes;

  const expiringSoon = available.filter((evaluation) => {
    const days = daysUntilExpiry(evaluation.opportunity, planner.today);
    return days !== null && days >= 0 && days <= EXPIRING_SOON_DAYS;
  });

  const verifiedPrimogems = sumPrimogems(
    available.filter((evaluation) => evaluation.opportunity.verification === 'verified'),
  );
  const estimatedPrimogems = sumPrimogems(
    available.filter((evaluation) => evaluation.opportunity.verification === 'estimated'),
  );
  const userEnteredPrimogems = sumPrimogems(
    available.filter((evaluation) => evaluation.opportunity.verification === 'user-entered'),
  );

  const highPriorityPrimogems = sumPrimogems(
    available.filter((evaluation) => evaluation.priority === 'high'),
  );

  const projectedWithOpportunitiesWishes = planner.projectedWishes + obtainableWishes;
  const projectedWithPlannedWishes = planner.projectedWishes + plannedWishes;

  return {
    evaluations,
    recommendations,
    totals: {
      obtainablePrimogems,
      obtainableFates,
      obtainableWishes,
      verifiedPrimogems,
      estimatedPrimogems,
      userEnteredPrimogems,
      highPriorityPrimogems,
      plannedPrimogems,
      plannedWishes,
      expiringSoonCount: expiringSoon.length,
      expiringSoonPrimogems: sumPrimogems(expiringSoon),
      completedCount: evaluations.filter((evaluation) => evaluation.state === 'completed').length,
      availableCount: available.length,
      totalCount: evaluations.length,
    },
    plan: {
      budgetWishes: planner.budgetWishes,
      projectedWishes: planner.projectedWishes,
      guaranteeWishes: planner.guaranteeWishes,
      projectedWithOpportunitiesWishes,
      gapAfterOpportunities: Math.max(0, planner.guaranteeWishes - projectedWithOpportunitiesWishes),
      projectedWithPlannedWishes,
      gapAfterPlanned: Math.max(0, planner.guaranteeWishes - projectedWithPlannedWishes),
      canForecast: planner.canForecast,
    },
  };
}

/** Days between two ISO dates, re-exported for UI summaries. */
export function calendarDays(fromIso: string, toIso: string): number {
  return daysBetween(fromIso, toIso);
}
