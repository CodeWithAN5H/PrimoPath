import { CalendarDays, Coins, Sparkles, Wallet } from 'lucide-react';
import { MECHANICS } from '../../domain/mechanics';
import { formatDeadline, formatNumber } from '../../lib/format';
import { usePlanner } from '../../state/PlannerProvider';
import { Badge } from '../ui/Badge';
import { Card, CardHeader, Divider } from '../ui/Card';

function Breakdown({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-line-soft bg-void/40 px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-faint">
        <span aria-hidden="true">{icon}</span>
        <span className="text-[11px] font-medium uppercase tracking-[0.1em]">{label}</span>
      </div>
      <p className="num mt-1 text-sm font-semibold text-ink">{value}</p>
      {hint ? <p className="mt-0.5 text-[11px] text-faint">{hint}</p> : null}
    </div>
  );
}

export function BudgetSummaryCard() {
  const { view, state } = usePlanner();
  const active = view.projections[view.activeScenario];
  const primogemWishes = Math.floor(state.resources.primogems / MECHANICS.primogemsPerWish);
  const gained = active.gainedWishes;

  return (
    <Card labelledBy="budget-title" className="lg:col-span-2">
      <CardHeader
        id="budget-title"
        title="Wish budget"
        description="What you can spend right now, and what it becomes by the banner deadline."
        icon={<Wallet size={16} />}
        action={<Badge tone="gold">Intertwined only</Badge>}
      />

      <div className="rounded-xl border border-gold/15 bg-gradient-to-br from-gold/[0.09] via-transparent to-violet/[0.06] p-4 sm:p-5">
        <p className="label">Available now</p>
        <div className="mt-1 flex flex-wrap items-end gap-x-3 gap-y-1">
          <span className="num font-display text-5xl leading-none text-gold sm:text-6xl">
            {formatNumber(view.budget.wishes)}
          </span>
          <span className="pb-1 text-sm text-muted">
            {view.budget.wishes === 1 ? 'wish' : 'wishes'}
          </span>
          <span className="ml-auto pb-1 text-right text-xs leading-relaxed text-faint">
            {formatNumber(state.resources.intertwinedFates)} Intertwined Fates
            <br />
            {formatNumber(state.resources.primogems)} Primogems
          </span>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          <Breakdown
            icon={<Sparkles size={13} />}
            label="Fates"
            value={`${formatNumber(state.resources.intertwinedFates)} wishes`}
            hint="Counted at face value"
          />
          <Breakdown
            icon={<Coins size={13} />}
            label="From Primogems"
            value={`${formatNumber(primogemWishes)} wishes`}
            hint={`${formatNumber(state.resources.primogems)} ÷ 160, rounded down`}
          />
          <Breakdown
            icon={<Coins size={13} />}
            label="Left over"
            value={`${formatNumber(view.budget.leftoverPrimogems)} Primogems`}
            hint="Too few for another wish"
          />
        </div>
      </div>

      <Divider />

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="label flex items-center gap-1.5">
            <CalendarDays size={12} aria-hidden="true" />
            Projected by {formatDeadline(view.plan.endDate)}
          </p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="num font-display text-3xl text-ink">
              {view.canForecast ? formatNumber(active.projected.wishes) : '—'}
            </span>
            <span className="text-sm text-muted">
              {view.canForecast
                ? `${gained >= 0 ? '+' : ''}${formatNumber(gained)} from income`
                : 'Fix the banner dates to project'}
            </span>
          </div>
          <p className="mt-1 text-xs text-faint">
            {view.canForecast
              ? `${formatNumber(active.days)} income day${active.days === 1 ? '' : 's'} counted, ${
                  view.activeScenario === 'conservative'
                    ? 'confirmed rewards only'
                    : view.activeScenario === 'expected'
                      ? 'expected rewards'
                      : 'all listed rewards'
                }.`
              : 'Dates must be valid before a deadline forecast can be calculated.'}
          </p>
        </div>
        <div className="text-right">
          <p className="label">Left over at deadline</p>
          <p className="num mt-1 text-sm font-semibold text-muted">
            {view.canForecast
              ? `${formatNumber(active.projected.leftoverPrimogems)} Primogems`
              : '—'}
          </p>
        </div>
      </div>
    </Card>
  );
}
