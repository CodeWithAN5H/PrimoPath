import { describe, expect, it } from 'vitest';
import {
  createEmptyProgress,
  createDefaultOpportunityState,
  type Opportunity,
  type OpportunityProgress,
} from './opportunity';
import {
  buildOpportunitySummary,
  type PlannerSnapshot,
} from './rewardOptimizer';
import { makeOpportunity } from '../test/opportunityFactory';

const today = '2026-11-03';
const deadline = '2026-12-20';

const planner: PlannerSnapshot = {
  today,
  deadline,
  dailyPrimogems: 0,
  oneTimeRewardLabels: [],
  budgetWishes: 100,
  projectedWishes: 120,
  guaranteeWishes: 180,
  canForecast: true,
};

function summaryFor(
  catalogue: readonly Opportunity[],
  records: OpportunityProgress[] = [],
  custom: Opportunity[] = [],
  plannerOverrides: Partial<PlannerSnapshot> = {},
) {
  return buildOpportunitySummary(
    { records, custom },
    { ...planner, ...plannerOverrides },
    catalogue,
  );
}

function planned(id: string): OpportunityProgress {
  return { ...createEmptyProgress(id), planned: true };
}

const fast = makeOpportunity({
  id: 'fast',
  name: 'Fast verified event',
  reward: { primogems: 1600, fates: 0 },
  effortMinutes: 20,
  availableUntil: '2026-11-10',
});
const slow = makeOpportunity({
  id: 'slow',
  name: 'Slow estimated grind',
  reward: { primogems: 160, fates: 0 },
  effortMinutes: 600,
  verification: 'estimated',
  verifiedOn: '2026-10-01',
});
const monthly = makeOpportunity({
  id: 'monthly',
  name: 'Monthly reset',
  category: 'spiral-abyss',
  reward: { primogems: 800, fates: 0 },
  effortMinutes: 120,
  recurrence: { kind: 'monthly', days: [16] },
});

describe('ranking', () => {
  it('ranks a large, low-effort, urgent reward above a slow grind', () => {
    const summary = summaryFor([slow, fast]);
    expect(summary.recommendations.map((entry) => entry.opportunity.id)).toEqual(['fast', 'slow']);
    expect(summary.recommendations[0]?.priority).toBe('high');
    expect(summary.recommendations[1]?.priority).toBe('low');
  });

  it('explains every recommendation with concrete reasons', () => {
    const summary = summaryFor([fast]);
    const reasons = summary.recommendations[0]!.reasons.join(' ');
    expect(reasons).toContain('Expires in 7 days');
    expect(reasons).toContain('Large reward');
    expect(reasons).toContain('Low effort');
    expect(reasons).toContain('verified');
  });

  it('explains estimates, prerequisites and high effort', () => {
    const summary = summaryFor([
      makeOpportunity({
        id: 'estimated',
        name: 'Estimated event',
        reward: { primogems: 900, fates: 0, primogemsMax: 1200 },
        effortMinutes: 180,
        verification: 'estimated',
        prerequisites: ['Adventure Rank 40'],
      }),
    ]);
    const reasons = summary.recommendations[0]!.reasons.join(' ');
    expect(reasons).toContain('estimate');
    expect(reasons).toContain('900–1,200');
    expect(reasons).toContain('High effort');
    expect(reasons).toContain('Requires: Adventure Rank 40');
  });

  it('penalises stale sources and says so', () => {
    const fresh = makeOpportunity({ id: 'fresh', name: 'Fresh', verifiedOn: '2026-10-01' });
    const stale = makeOpportunity({ id: 'stale', name: 'Stale', verifiedOn: '2025-01-01' });
    const summary = summaryFor([fresh, stale], [], [], {
      guaranteeWishes: 300,
    });
    const staleEntry = summary.evaluations.find((entry) => entry.opportunity.id === 'stale')!;
    const freshEntry = summary.evaluations.find((entry) => entry.opportunity.id === 'fresh')!;
    expect(staleEntry.stale).toBe(true);
    expect(staleEntry.score).toBe(freshEntry.score - 8);
    expect(staleEntry.reasons.join(' ')).toContain('six months old');
  });
});

describe('exclusions and repeatable rewards', () => {
  it('excludes completed, unavailable, expired and upcoming opportunities from totals', () => {
    const catalogue = [
      makeOpportunity({ id: 'done', name: 'Done', reward: { primogems: 1000, fates: 0 } }),
      makeOpportunity({ id: 'na', name: 'Not applicable', reward: { primogems: 1000, fates: 0 } }),
      makeOpportunity({
        id: 'expired',
        name: 'Expired',
        reward: { primogems: 1000, fates: 0 },
        availableUntil: '2026-11-01',
      }),
      makeOpportunity({
        id: 'upcoming',
        name: 'Upcoming',
        reward: { primogems: 1000, fates: 0 },
        availableFrom: '2026-12-01',
      }),
      makeOpportunity({ id: 'open', name: 'Open', reward: { primogems: 500, fates: 0 } }),
    ];
    const records = [
      { ...createEmptyProgress('done'), status: 'done' as const, completedCycles: ['once'] },
      { ...createEmptyProgress('na'), status: 'unavailable' as const },
    ];
    const summary = summaryFor(catalogue, records);

    expect(summary.totals.obtainablePrimogems).toBe(500);
    expect(summary.totals.availableCount).toBe(1);
    expect(summary.totals.completedCount).toBe(1);
    expect(summary.evaluations.map((entry) => entry.state)).toEqual([
      'completed',
      'unavailable',
      'expired',
      'upcoming',
      'available',
    ]);
    expect(summary.recommendations.map((entry) => entry.opportunity.id)).toEqual(['open']);
  });

  it('counts every reset before the deadline and respects completed cycles', () => {
    const initial = summaryFor([monthly]);
    expect(initial.evaluations[0]?.occurrences).toBe(3);
    expect(initial.totals.obtainablePrimogems).toBe(2400);

    const afterCurrent = summaryFor([monthly], [
      { ...createEmptyProgress('monthly'), completedCycles: ['m:2026-10-16'] },
    ]);
    expect(afterCurrent.totals.obtainablePrimogems).toBe(1600);
    expect(afterCurrent.evaluations[0]?.completedCurrentCycle).toBe(true);
    expect(afterCurrent.evaluations[0]?.state).toBe('available');
  });

  it('removes an opportunity with no remaining cycle before the deadline', () => {
    const summary = summaryFor([monthly], [], [], { deadline: '2026-11-10' });
    const withCompletion = summaryFor(
      [monthly],
      [{ ...createEmptyProgress('monthly'), completedCycles: ['m:2026-10-16'] }],
      [],
      { deadline: '2026-11-10' },
    );
    expect(summary.evaluations[0]?.state).toBe('available');
    expect(withCompletion.evaluations[0]?.state).toBe('completed');
    expect(withCompletion.totals.obtainableWishes).toBe(0);
  });
});

describe('double-counting protection', () => {
  const daily = makeOpportunity({
    id: 'daily',
    name: 'Daily Commissions',
    category: 'daily',
    reward: { primogems: 60, fates: 0 },
    effortMinutes: 15,
    recurrence: { kind: 'daily' },
  });

  it('does not count daily commissions already covered by planner income', () => {
    const summary = summaryFor([daily], [], [], { dailyPrimogems: 60, deadline: '2026-11-05' });
    expect(summary.evaluations[0]?.state).toBe('already-counted');
    expect(summary.totals.obtainablePrimogems).toBe(0);
    expect(summary.evaluations[0]?.stateNote).toContain('already counts 60');
  });

  it('counts only the shortfall when the planner under-counts daily income', () => {
    const summary = summaryFor([daily], [], [], { dailyPrimogems: 30, deadline: '2026-11-05' });
    // 3 income days × 30 Primogems shortfall.
    expect(summary.totals.obtainablePrimogems).toBe(90);
    expect(summary.evaluations[0]?.reasons.join(' ')).toContain('only the 30/day difference');
  });

  it('skips an opportunity already listed as a planner one-time reward', () => {
    const event = makeOpportunity({ id: 'web', name: 'Lantern Rite web event' });
    const summary = summaryFor([event], [], [], { oneTimeRewardLabels: ['Lantern Rite'] });
    expect(summary.evaluations[0]?.state).toBe('already-counted');
    expect(summary.evaluations[0]?.stateNote).toContain('already in your planner');
    expect(summary.totals.obtainablePrimogems).toBe(0);
  });

  it('ignores a custom copy of a catalogue reward by name', () => {
    const catalogueReward = makeOpportunity({ id: 'catalogue-1', name: 'Daily Commissions' });
    const customCopy = makeOpportunity({
      id: 'custom-1',
      name: 'daily commissions',
      isCustom: true,
      verification: 'user-entered',
      sourceUrl: undefined,
      sourceLabel: undefined,
      verifiedOn: undefined,
    });
    const summary = summaryFor([catalogueReward], [], [customCopy]);
    expect(summary.evaluations.map((entry) => entry.state)).toEqual(['available', 'duplicate']);
    expect(summary.totals.obtainablePrimogems).toBe(800);
  });
});

describe('totals and plan integration', () => {
  it('splits verified, estimated and user-entered rewards and computes wishes', () => {
    const verified = makeOpportunity({
      id: 'verified',
      name: 'Verified',
      reward: { primogems: 1600, fates: 2 },
    });
    const estimated = makeOpportunity({
      id: 'estimated',
      name: 'Estimated',
      reward: { primogems: 400, fates: 0, primogemsMax: 600 },
      verification: 'estimated',
      verifiedOn: '2026-10-01',
    });
    const custom = makeOpportunity({
      id: 'custom',
      name: 'My event',
      reward: { primogems: 320, fates: 0 },
      isCustom: true,
      verification: 'user-entered',
      sourceUrl: undefined,
      sourceLabel: undefined,
      verifiedOn: undefined,
    });

    const summary = summaryFor([verified, estimated], [], [custom]);
    expect(summary.totals.obtainablePrimogems).toBe(2320);
    expect(summary.totals.verifiedPrimogems).toBe(1600);
    expect(summary.totals.estimatedPrimogems).toBe(400);
    expect(summary.totals.userEnteredPrimogems).toBe(320);
    expect(summary.totals.obtainableFates).toBe(2);
    expect(summary.totals.obtainableWishes).toBe(16);
  });

  it('adds opportunities to the projection without touching the planner numbers', () => {
    const summary = summaryFor([makeOpportunity({ id: 'big', name: 'Big', reward: { primogems: 1600, fates: 0 } })]);
    expect(summary.plan.projectedWishes).toBe(120);
    expect(summary.plan.projectedWithOpportunitiesWishes).toBe(130);
    expect(summary.plan.gapAfterOpportunities).toBe(50);
    expect(summary.totals.obtainableWishes).toBe(10);
  });

  it('tracks the user-selected plan separately from all opportunities', () => {
    const first = makeOpportunity({ id: 'first', name: 'First', reward: { primogems: 1600, fates: 0 } });
    const second = makeOpportunity({ id: 'second', name: 'Second', reward: { primogems: 320, fates: 0 } });
    const summary = summaryFor([first, second], [planned('first')]);
    expect(summary.totals.plannedPrimogems).toBe(1600);
    expect(summary.totals.plannedWishes).toBe(10);
    expect(summary.plan.projectedWithPlannedWishes).toBe(130);
    expect(summary.plan.gapAfterPlanned).toBe(50);
    expect(summary.totals.obtainablePrimogems).toBe(1920);
  });

  it('counts expiring rewards within a seven-day window', () => {
    const summary = summaryFor([
      makeOpportunity({ id: 'soon', name: 'Soon', availableUntil: '2026-11-08' }),
      makeOpportunity({ id: 'later', name: 'Later', availableUntil: '2026-11-20' }),
      makeOpportunity({ id: 'never', name: 'Never' }),
    ]);
    expect(summary.totals.expiringSoonCount).toBe(1);
    expect(summary.totals.expiringSoonPrimogems).toBe(800);
  });

  it('reports the high-priority contribution', () => {
    const summary = summaryFor([
      fast,
      slow,
    ]);
    expect(summary.totals.highPriorityPrimogems).toBe(1600);
  });

  it('keeps totals when the planner cannot forecast and flags it', () => {
    const summary = summaryFor(
      [makeOpportunity({ id: 'open', name: 'Open' })],
      [],
      [],
      { canForecast: false },
    );
    expect(summary.plan.canForecast).toBe(false);
    expect(summary.totals.obtainablePrimogems).toBe(800);
    // 800 Primogems adds 5 wishes: 120 projected + 5 against a 180 ceiling.
    expect(summary.plan.gapAfterOpportunities).toBe(55);
  });

  it('handles an empty state without NaN or negative numbers', () => {
    const summary = buildOpportunitySummary(createDefaultOpportunityState(), planner, []);
    expect(summary.totals.obtainablePrimogems).toBe(0);
    expect(summary.totals.obtainableWishes).toBe(0);
    expect(summary.totals.completedCount).toBe(0);
    expect(summary.plan.gapAfterOpportunities).toBe(60);
    expect(summary.recommendations).toEqual([]);
  });
});
