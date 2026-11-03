import { describe, expect, it } from 'vitest';
import { makeOpportunity } from '../test/opportunityFactory';
import {
  createEmptyProgress,
  cycleKeyFor,
  daysUntilExpiry,
  futureResetDates,
  isExpired,
  isStale,
  isUpcoming,
  latestMonthlyReset,
  normalizeOpportunityName,
  occurrencesAvailable,
  opportunitySchema,
  remainingReward,
} from './opportunity';

const abyss = makeOpportunity({
  id: 'abyss',
  name: 'Abyss',
  category: 'spiral-abyss',
  reward: { primogems: 800, fates: 0 },
  recurrence: { kind: 'monthly', days: [16] },
});
const daily = makeOpportunity({
  id: 'daily',
  name: 'Dailies',
  category: 'daily',
  reward: { primogems: 60, fates: 0 },
  recurrence: { kind: 'daily' },
});

describe('opportunity schema', () => {
  it('accepts a sourced catalogue entry and fills optional defaults', () => {
    const parsed = opportunitySchema.parse({
      id: 'test',
      name: '  Test reward  ',
      category: 'other',
      reward: { primogems: 100, fates: 1 },
      effortMinutes: 10,
      recurrence: { kind: 'once' },
      verification: 'verified',
      sourceUrl: 'https://example.com',
    });
    expect(parsed.name).toBe('Test reward');
    expect(parsed.prerequisites).toEqual([]);
    expect(parsed.tracking).toBe('completion');
    expect(parsed.isCustom).toBe(false);
    expect(parsed.description).toBe('');
  });

  it('rejects an inverted reward range', () => {
    const result = opportunitySchema.safeParse({
      ...makeOpportunity(),
      reward: { primogems: 900, fates: 0, primogemsMax: 500 },
    });
    expect(result.success).toBe(false);
  });

  it('rejects an end date before the start date', () => {
    const result = opportunitySchema.safeParse({
      ...makeOpportunity(),
      availableFrom: '2026-11-20',
      availableUntil: '2026-11-10',
    });
    expect(result.success).toBe(false);
  });

  it('requires a source for catalogue rewards and a user-entered marker for custom ones', () => {
    const noSource = opportunitySchema.safeParse({
      ...makeOpportunity(),
      sourceUrl: undefined,
    });
    expect(noSource.success).toBe(false);

    const fakeCustom = opportunitySchema.safeParse({
      ...makeOpportunity(),
      isCustom: true,
      verification: 'verified',
    });
    expect(fakeCustom.success).toBe(false);
  });

  it('rejects negative rewards and zero effort', () => {
    expect(
      opportunitySchema.safeParse({ ...makeOpportunity(), reward: { primogems: -1, fates: 0 } })
        .success,
    ).toBe(false);
    expect(opportunitySchema.safeParse({ ...makeOpportunity(), effortMinutes: 0 }).success).toBe(
      false,
    );
  });

  it('normalises names for duplicate detection', () => {
    expect(normalizeOpportunityName('  Spiral Abyss — Floors 9–12 ')).toBe(
      'spiral abyss floors 9 12',
    );
  });
});

describe('reset cycles', () => {
  it('finds the most recent monthly reset', () => {
    expect(latestMonthlyReset([16], '2026-11-03')).toBe('2026-10-16');
    expect(latestMonthlyReset([16], '2026-11-16')).toBe('2026-11-16');
    expect(latestMonthlyReset([16], '2026-12-01')).toBe('2026-11-16');
    expect(latestMonthlyReset([1], '2026-12-01')).toBe('2026-12-01');
  });

  it('builds stable cycle keys', () => {
    expect(cycleKeyFor(abyss, '2026-11-03')).toBe('m:2026-10-16');
    expect(cycleKeyFor(daily, '2026-11-03')).toBe('d:2026-11-03');
    expect(cycleKeyFor(makeOpportunity(), '2026-11-03')).toBe('once');
  });

  it('lists future reset dates inside the window', () => {
    expect(futureResetDates(abyss, '2026-11-03', '2026-12-20')).toEqual([
      '2026-11-16',
      '2026-12-16',
    ]);
    expect(futureResetDates(abyss, '2026-11-16', '2026-12-15')).toEqual([]);
    expect(futureResetDates(daily, '2026-11-03', '2026-12-20')).toEqual([]);
  });

  it('counts the open cycle plus future resets, capped by expiry', () => {
    expect(occurrencesAvailable(abyss, '2026-11-03', '2026-12-20')).toBe(3);
    expect(occurrencesAvailable(abyss, '2026-11-17', '2026-12-20')).toBe(2);
    expect(occurrencesAvailable(daily, '2026-11-03', '2026-11-05')).toBe(3);
    expect(occurrencesAvailable(makeOpportunity(), '2026-11-03', '2026-12-20')).toBe(1);

    const expiring = makeOpportunity({ availableUntil: '2026-11-10' });
    expect(occurrencesAvailable(expiring, '2026-11-03', '2026-12-20')).toBe(1);

    const monthlyExpiring = makeOpportunity({
      recurrence: { kind: 'monthly', days: [16] },
      availableUntil: '2026-11-10',
    });
    expect(occurrencesAvailable(monthlyExpiring, '2026-11-03', '2026-12-20')).toBe(1);
  });

  it('reports expired and upcoming opportunities', () => {
    expect(isExpired(makeOpportunity({ availableUntil: '2026-11-01' }), '2026-11-03')).toBe(true);
    expect(isExpired(abyss, '2026-11-03')).toBe(false);
    expect(isUpcoming(makeOpportunity({ availableFrom: '2026-11-10' }), '2026-11-03')).toBe(true);
    expect(occurrencesAvailable(makeOpportunity({ availableUntil: '2026-11-01' }), '2026-11-03', '2026-12-20')).toBe(0);
    expect(occurrencesAvailable(makeOpportunity({ availableFrom: '2026-11-10' }), '2026-11-03', '2026-12-20')).toBe(0);
  });
});

describe('remaining rewards', () => {
  it('multiplies by the remaining occurrences', () => {
    const remaining = remainingReward(abyss, createEmptyProgress('abyss'), '2026-11-03', '2026-12-20');
    expect(remaining).toMatchObject({ primogems: 2400, fates: 0, occurrences: 3 });
  });

  it('removes a completed current cycle without blocking future resets', () => {
    const progress = {
      ...createEmptyProgress('abyss'),
      completedCycles: ['m:2026-10-16'],
    };
    const remaining = remainingReward(abyss, progress, '2026-11-03', '2026-12-20');
    expect(remaining.occurrences).toBe(2);
    expect(remaining.primogems).toBe(1600);
  });

  it('returns nothing for completed, unavailable or expired entries', () => {
    expect(
      remainingReward(abyss, { ...createEmptyProgress('abyss'), status: 'done' }, '2026-11-03', '2026-12-20'),
    ).toEqual({ primogems: 0, fates: 0, occurrences: 0, estimated: false });
    expect(
      remainingReward(
        abyss,
        { ...createEmptyProgress('abyss'), status: 'unavailable' },
        '2026-11-03',
        '2026-12-20',
      ),
    ).toEqual({ primogems: 0, fates: 0, occurrences: 0, estimated: false });
    expect(
      remainingReward(
        makeOpportunity({ availableUntil: '2026-11-01' }),
        createEmptyProgress('event-a'),
        '2026-11-03',
        '2026-12-20',
      ),
    ).toEqual({ primogems: 0, fates: 0, occurrences: 0, estimated: false });
  });

  it('applies a user reward correction', () => {
    const progress = { ...createEmptyProgress('abyss'), rewardOverridePrimogems: 100 };
    const remaining = remainingReward(abyss, progress, '2026-11-03', '2026-12-20');
    expect(remaining.primogems).toBe(300);
  });

  it('subtracts partial progress from one-time, progress-tracked rewards', () => {
    const exploration = makeOpportunity({
      id: 'exploration',
      category: 'exploration',
      tracking: 'progress',
      reward: { primogems: 500, fates: 2 },
    });
    const progress = { ...createEmptyProgress('exploration'), progressPercent: 40 };
    const remaining = remainingReward(exploration, progress, '2026-11-03', '2026-12-20');
    expect(remaining.primogems).toBe(300);
    expect(remaining.fates).toBe(0);
    expect(remaining.estimated).toBe(true);
  });

  it('does not apply partial progress to repeatable rewards', () => {
    const progress = { ...createEmptyProgress('abyss'), progressPercent: 50 };
    const remaining = remainingReward(abyss, progress, '2026-11-03', '2026-12-20');
    expect(remaining.primogems).toBe(2400);
  });
});

describe('expiry and staleness', () => {
  it('computes days to expiry only when an end date exists', () => {
    expect(daysUntilExpiry(abyss, '2026-11-03')).toBeNull();
    expect(daysUntilExpiry(makeOpportunity({ availableUntil: '2026-11-12' }), '2026-11-03')).toBe(9);
  });

  it('flags sources older than six months', () => {
    expect(isStale(makeOpportunity({ verifiedOn: '2026-10-01' }), '2026-11-03')).toBe(false);
    expect(isStale(makeOpportunity({ verifiedOn: '2025-01-01' }), '2026-11-03')).toBe(true);
    expect(
      isStale(
        makeOpportunity({ verification: 'user-entered', isCustom: true, verifiedOn: undefined }),
        '2026-11-03',
      ),
    ).toBe(false);
  });
});
