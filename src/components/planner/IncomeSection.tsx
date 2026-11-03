import { Disclosure } from '../ui/Disclosure';
import { NumberField } from '../ui/fields';
import { LIMITS } from '../../domain/schema';
import { formatNumber } from '../../lib/format';
import { usePlanner } from '../../state/PlannerProvider';
import { RewardsFields } from './RewardsSection';

export function IncomeSection() {
  const { state, dispatch, view } = usePlanner();
  const expected = view.projections.expected;
  const recurring = expected.dailyPrimogems + expected.welkinPrimogems;

  return (
    <Disclosure
      id="planner-income"
      title="D · Future income"
      subtitle="Recurring Primogems and one-time rewards before the deadline."
      summary={
        <span className="num text-[11px] font-medium text-muted">
          {formatNumber(state.income.dailyPrimogems)}/day
        </span>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <NumberField
            id="income-daily"
            label="Daily Primogems"
            srSuffix="Primogems per day"
            value={state.income.dailyPrimogems}
            onChange={(value) => dispatch({ type: 'setIncome', patch: { dailyPrimogems: value } })}
            min={LIMITS.dailyPrimogems.min}
            max={LIMITS.dailyPrimogems.max}
            suffix="/ day"
            hint="Daily Commissions alone are 60."
          />
          <NumberField
            id="income-welkin"
            label="Welkin Moon days left"
            srSuffix="days"
            value={state.income.welkinDaysRemaining}
            onChange={(value) =>
              dispatch({ type: 'setIncome', patch: { welkinDaysRemaining: value } })
            }
            min={LIMITS.welkinDays.min}
            max={LIMITS.welkinDays.max}
            suffix="days"
            hint="90 Primogems per day, capped by days left."
          />
        </div>

        <p className="rounded-xl border border-line-soft bg-abyss/40 px-3.5 py-2.5 text-[11px] leading-relaxed text-muted">
          {view.canForecast ? (
            <>
              Recurring income adds{' '}
              <span className="num font-semibold text-ink">{formatNumber(recurring)} Primogems</span>{' '}
              over {formatNumber(expected.days)} day{expected.days === 1 ? '' : 's'}. Each day is
              counted once, including today and the deadline.
            </>
          ) : (
            'Set valid banner dates to project recurring income.'
          )}
        </p>

        <div className="border-t border-line-soft pt-3.5">
          <h3 className="text-xs font-semibold text-ink">One-time rewards</h3>
          <p className="mt-0.5 text-[11px] leading-relaxed text-faint">
            Events, quests and codes you expect before the deadline.
          </p>
          <div className="mt-2.5">
            <RewardsFields />
          </div>
        </div>

        <p className="text-[11px] leading-relaxed text-faint">
          Genesis Crystals and paid bundles are deliberately excluded. PrimoPath never suggests
          purchases.
        </p>
      </div>
    </Disclosure>
  );
}
