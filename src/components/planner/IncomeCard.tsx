import { TrendingUp } from 'lucide-react';
import { LIMITS } from '../../domain/schema';
import { formatNumber } from '../../lib/format';
import { usePlanner } from '../../state/PlannerProvider';
import { Card, CardHeader } from '../ui/Card';
import { NumberField } from '../ui/fields';

export function IncomeCard() {
  const { state, dispatch, view } = usePlanner();
  const expected = view.projections.expected;
  const recurring = expected.dailyPrimogems + expected.welkinPrimogems;

  return (
    <Card labelledBy="income-title">
      <CardHeader
        id="income-title"
        title="Recurring income"
        description="What you expect to earn each day between today and the deadline."
        icon={<TrendingUp size={16} />}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <NumberField
          id="income-daily"
          label="Daily Primogems"
          value={state.income.dailyPrimogems}
          onChange={(value) => dispatch({ type: 'setIncome', patch: { dailyPrimogems: value } })}
          min={LIMITS.dailyPrimogems.min}
          max={LIMITS.dailyPrimogems.max}
          suffix="/ day"
          hint="Daily Commissions alone are 60. Count only what recurs."
        />
        <NumberField
          id="income-welkin"
          label="Welkin Moon days left"
          value={state.income.welkinDaysRemaining}
          onChange={(value) =>
            dispatch({ type: 'setIncome', patch: { welkinDaysRemaining: value } })
          }
          min={LIMITS.welkinDays.min}
          max={LIMITS.welkinDays.max}
          suffix="days"
          hint="90 Primogems per day, capped by days remaining."
        />
      </div>

      <p className="mt-4 rounded-xl border border-line-soft bg-void/40 px-3.5 py-3 text-xs leading-relaxed text-muted">
        {view.canForecast ? (
          <>
            Recurring income adds{' '}
            <span className="num font-semibold text-ink">
              {formatNumber(recurring)} Primogems
            </span>{' '}
            over {formatNumber(expected.days)} day{expected.days === 1 ? '' : 's'} (
            {formatNumber(expected.gainedWishes)} extra wishes including listed rewards). Income is
            counted once per day, including today and the deadline.
          </>
        ) : (
          'Set valid banner dates to project recurring income.'
        )}
      </p>
      <p className="mt-2 text-[11px] leading-relaxed text-faint">
        Genesis Crystals and paid bundles are deliberately excluded. PrimoPath never suggests
        purchases.
      </p>
    </Card>
  );
}
