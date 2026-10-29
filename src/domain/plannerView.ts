import { daysBetween } from './dates';
import {
  projectAllScenarios,
  SCENARIOS,
  type IncomeProjection,
  type ScenarioId,
} from './forecast';
import { guaranteeBudget, type GuaranteeBudget } from './guarantee';
import type { Plan, PlannerState } from './schema';
import { validatePlanDates, type FieldIssue } from './validation';
import { primogemsToReach, wishBudget, wishesShortOf, type WishBudget } from './wishes';

export interface DeadlineInfo {
  iso: string;
  /** Calendar days from today to the deadline; negative after it passes. */
  daysRemaining: number;
  passed: boolean;
}

export interface PlannerView {
  today: string;
  plan: Plan;
  budget: WishBudget;
  deadline: DeadlineInfo;
  projections: Record<ScenarioId, IncomeProjection>;
  activeScenario: ScenarioId;
  guarantee: GuaranteeBudget;
  /** Wishes missing to reach the guarantee budget with the expected scenario. */
  guaranteeShortfall: number;
  /** Primogems missing to close that gap, accounting for leftover Primogems. */
  guaranteePrimogemsNeeded: number;
  /** Wishes missing against the current budget instead of the projection. */
  currentShortfall: number;
  dateIssues: FieldIssue[];
  canForecast: boolean;
  assumptions: string[];
}

export function selectActivePlan(state: PlannerState): Plan {
  return state.activeBanner === 'character' ? state.characterPlan : state.weaponPlan;
}

export function buildPlannerView(
  state: PlannerState,
  today: string,
  activeScenario: ScenarioId = 'expected',
): PlannerView {
  const plan = selectActivePlan(state);
  const budget = wishBudget(state.resources.primogems, state.resources.intertwinedFates);
  const { issues, blocking } = validatePlanDates(plan, today);
  const daysRemaining = daysBetween(today, plan.endDate);

  const inputs = {
    resources: state.resources,
    income: state.income,
    oneTimeRewards: state.oneTimeRewards,
  };
  const projections = projectAllScenarios(inputs, today, plan.endDate);
  const guarantee = guaranteeBudget(plan);
  const active = projections[activeScenario];

  const guaranteeShortfall = wishesShortOf(guarantee.worstCaseWishes, active.projected);
  const guaranteePrimogemsNeeded = primogemsToReach(
    guarantee.worstCaseWishes,
    active.projected,
  );

  const assumptionLines = [
    `1 wish = 160 Primogems. Intertwined Fates are added as-is; Acquaint Fates are ignored.`,
    `Daily income of ${state.income.dailyPrimogems.toLocaleString('en-US')} Primogems is counted once per day from today through the banner end date, inclusive.`,
    state.income.welkinDaysRemaining > 0
      ? `Welkin Moon: ${state.income.welkinDaysRemaining} day(s) remaining, 90 Primogems per day, capped by the days left before the deadline.`
      : 'No Welkin Moon days are counted.',
    state.oneTimeRewards.length === 0
      ? 'No one-time rewards are listed, so all scenarios project the same income.'
      : `${state.oneTimeRewards.length} one-time reward(s) are counted according to their confidence: ${
          SCENARIOS.find((scenario) => scenario.id === activeScenario)?.summary ?? ''
        }.`,
    'Banner dates and targets are entered by you. PrimoPath does not fetch live banner data.',
  ];

  return {
    today,
    plan,
    budget,
    deadline: {
      iso: plan.endDate,
      daysRemaining,
      passed: daysRemaining < 0,
    },
    projections,
    activeScenario,
    guarantee,
    guaranteeShortfall,
    guaranteePrimogemsNeeded,
    currentShortfall: wishesShortOf(guarantee.worstCaseWishes, budget),
    dateIssues: issues,
    canForecast: !blocking,
    assumptions: assumptionLines,
  };
}
