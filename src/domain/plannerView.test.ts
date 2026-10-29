import { describe, expect, it } from 'vitest';
import { buildPlannerView, selectActivePlan } from './plannerView';
import { createDefaultState } from './schema';

const today = '2026-10-01';

function stateWith(overrides: Partial<ReturnType<typeof createDefaultState>>) {
  return { ...createDefaultState(today, '2026-10-21'), ...overrides };
}

describe('selectActivePlan', () => {
  it('returns the plan for the active banner type', () => {
    const base = createDefaultState(today, '2026-10-21');
    expect(selectActivePlan(base).bannerType).toBe('character');
    const weaponState = { ...base, activeBanner: 'weapon' as const };
    expect(selectActivePlan(weaponState).bannerType).toBe('weapon');
  });
});

describe('buildPlannerView', () => {
  it('composes budget, projection and guarantee without double counting', () => {
    const state = stateWith({
      resources: { primogems: 800, intertwinedFates: 2 },
      income: { dailyPrimogems: 60, welkinDaysRemaining: 0 },
      characterPlan: {
        ...createDefaultState(today, '2026-10-21').characterPlan,
        targetName: 'Furina',
        pity: 20,
        guaranteed: false,
      },
    });

    const view = buildPlannerView(state, today, 'expected');
    expect(view.budget).toEqual({ wishes: 7, leftoverPrimogems: 0 });
    // 21 income days × 60 = 1260 Primogems → 7 more wishes.
    expect(view.projections.expected.projected.wishes).toBe(14);
    expect(view.guarantee.worstCaseWishes).toBe(160);
    expect(view.guaranteeShortfall).toBe(146);
    // Leftover Primogems at the deadline (140) are credited against the cost.
    expect(view.guaranteePrimogemsNeeded).toBe(146 * 160 - 140);
    expect(view.deadline.daysRemaining).toBe(20);
    expect(view.canForecast).toBe(true);
  });

  it('blocks forecasting when the date range is invalid', () => {
    const base = createDefaultState(today, '2026-10-21');
    const state = stateWith({
      characterPlan: { ...base.characterPlan, endDate: '2026-09-01' },
    });
    const view = buildPlannerView(state, today);
    expect(view.canForecast).toBe(false);
    expect(view.dateIssues.some((issue) => issue.severity === 'error')).toBe(true);
  });

  it('switches mechanics with the banner type', () => {
    const base = createDefaultState(today, '2026-10-21');
    const state = stateWith({
      activeBanner: 'weapon',
      weaponPlan: { ...base.weaponPlan, pity: 40, fatePoints: 1 },
    });
    const view = buildPlannerView(state, today);
    expect(view.plan.bannerType).toBe('weapon');
    expect(view.guarantee.worstCaseWishes).toBe(120);
  });

  it('always reports assumptions with real input values', () => {
    const state = stateWith({ income: { dailyPrimogems: 90, welkinDaysRemaining: 12 } });
    const view = buildPlannerView(state, today);
    expect(view.assumptions.join(' ')).toContain('90 Primogems');
    expect(view.assumptions.join(' ')).toContain('12 day(s) remaining');
    expect(view.assumptions.join(' ')).toContain('1 wish = 160 Primogems');
  });
});
