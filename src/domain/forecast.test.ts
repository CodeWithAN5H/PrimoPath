import { describe, expect, it } from 'vitest';
import { incomeDays } from './dates';
import {
  forecastSeries,
  projectScenario,
  weightedRewardGain,
  SCENARIO_WEIGHTS,
} from './forecast';
import type { OneTimeReward } from './schema';

const reward = (overrides: Partial<OneTimeReward>): OneTimeReward => ({
  id: 'r',
  label: 'Reward',
  primogems: 0,
  fates: 0,
  confidence: 'confirmed',
  ...overrides,
});

describe('incomeDays', () => {
  it('counts today and the deadline as separate income days', () => {
    expect(incomeDays('2026-10-01', '2026-10-01')).toBe(1);
    expect(incomeDays('2026-10-01', '2026-10-21')).toBe(21);
  });

  it('returns zero for a deadline in the past', () => {
    expect(incomeDays('2026-10-21', '2026-10-01')).toBe(0);
  });
});

describe('weightedRewardGain', () => {
  const rewards = [
    reward({ id: 'a', primogems: 100, confidence: 'confirmed' }),
    reward({ id: 'b', primogems: 200, confidence: 'likely' }),
    reward({ id: 'c', primogems: 300, confidence: 'uncertain', fates: 2 }),
  ];

  it('conservative counts confirmed only', () => {
    expect(weightedRewardGain(rewards, SCENARIO_WEIGHTS.conservative)).toEqual({
      primogems: 100,
      fates: 0,
    });
  });

  it('expected counts likely in full and uncertain at half', () => {
    expect(weightedRewardGain(rewards, SCENARIO_WEIGHTS.expected)).toEqual({
      primogems: 450,
      fates: 1,
    });
  });

  it('optimistic counts everything once', () => {
    expect(weightedRewardGain(rewards, SCENARIO_WEIGHTS.optimistic)).toEqual({
      primogems: 600,
      fates: 2,
    });
  });
});

describe('projectScenario', () => {
  const base = {
    resources: { primogems: 1750, intertwinedFates: 4 },
    income: { dailyPrimogems: 60, welkinDaysRemaining: 10 },
    oneTimeRewards: [reward({ primogems: 320, confidence: 'confirmed' })],
  };

  it('adds daily, Welkin and reward Primogems exactly once', () => {
    // Today 2026-10-01 → 2026-10-06 is 6 income days.
    const projection = projectScenario(base, '2026-10-01', '2026-10-06', 'expected');
    expect(projection.days).toBe(6);
    expect(projection.dailyPrimogems).toBe(360);
    expect(projection.welkinDaysApplied).toBe(6);
    expect(projection.welkinPrimogems).toBe(540);
    expect(projection.rewardPrimogems).toBe(320);

    const totalPrimogems = 1750 + 360 + 540 + 320;
    expect(projection.projected.wishes).toBe(4 + Math.floor(totalPrimogems / 160));
    expect(projection.projected.leftoverPrimogems).toBe(totalPrimogems % 160);
  });

  it('caps Welkin days at the days remaining', () => {
    const projection = projectScenario(
      { ...base, income: { dailyPrimogems: 0, welkinDaysRemaining: 90 } },
      '2026-10-01',
      '2026-10-01',
      'expected',
    );
    expect(projection.welkinDaysApplied).toBe(1);
    expect(projection.welkinPrimogems).toBe(90);
  });

  it('projects no growth after the deadline', () => {
    const projection = projectScenario(base, '2026-10-10', '2026-10-01', 'optimistic');
    expect(projection.days).toBe(0);
    expect(projection.gainedWishes).toBe(0);
    expect(projection.projected).toEqual({ wishes: 14, leftoverPrimogems: 150 });
  });

  it('keeps scenarios ordered conservative <= expected <= optimistic', () => {
    const rewards = [
      reward({ id: 'a', primogems: 160, confidence: 'likely' }),
      reward({ id: 'b', primogems: 160, confidence: 'uncertain' }),
    ];
    const conservative = projectScenario(
      { ...base, oneTimeRewards: rewards },
      '2026-10-01',
      '2026-10-02',
      'conservative',
    );
    const expected = projectScenario(
      { ...base, oneTimeRewards: rewards },
      '2026-10-01',
      '2026-10-02',
      'expected',
    );
    const optimistic = projectScenario(
      { ...base, oneTimeRewards: rewards },
      '2026-10-01',
      '2026-10-02',
      'optimistic',
    );
    expect(conservative.projected.wishes).toBeLessThanOrEqual(expected.projected.wishes);
    expect(expected.projected.wishes).toBeLessThanOrEqual(optimistic.projected.wishes);
  });
});

describe('forecastSeries', () => {
  const inputs = {
    resources: { primogems: 800, intertwinedFates: 1 },
    income: { dailyPrimogems: 60, welkinDaysRemaining: 5 },
    oneTimeRewards: [reward({ primogems: 480, confidence: 'likely' })],
  };

  it('anchors the deadline on the last point and matches the projection', () => {
    const points = forecastSeries(inputs, '2026-10-01', '2026-10-21', 'expected');
    const projection = projectScenario(inputs, '2026-10-01', '2026-10-21', 'expected');
    expect(points[0]?.wishes).toBe(6);
    expect(points.at(-1)?.date).toBe('2026-10-21');
    expect(points.at(-1)?.wishes).toBe(projection.projected.wishes);
  });

  it('returns a single point when the deadline has passed', () => {
    const points = forecastSeries(inputs, '2026-10-21', '2026-10-01', 'expected');
    expect(points).toHaveLength(1);
    expect(points[0]?.wishes).toBe(6);
  });
});
