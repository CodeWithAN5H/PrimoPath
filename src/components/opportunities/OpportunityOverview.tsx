import { CalendarClock, Coins, Sparkles, Target, Trophy } from 'lucide-react';
import { formatDeadline, formatNumber } from '../../lib/format';
import { useOpportunities } from '../../state/OpportunityProvider';
import { usePlanner } from '../../state/PlannerProvider';
import { Badge } from '../ui/Badge';

function Metric({
  icon,
  label,
  value,
  unit,
  hint,
  accent = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit?: string;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border px-3 py-2.5 ${
        accent ? 'border-accent/30 bg-accent/[0.07]' : 'border-line-soft bg-abyss/40'
      }`}
    >
      <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-faint">
        <span aria-hidden="true" className={accent ? 'text-accent' : 'text-faint'}>
          {icon}
        </span>
        {label}
      </p>
      <p className="mt-1">
        <span className={`num text-lg font-semibold ${accent ? 'text-accent-soft' : 'text-ink'}`}>
          {value}
        </span>
        {unit ? <span className="ml-1 text-[11px] text-faint">{unit}</span> : null}
      </p>
      {hint ? <p className="mt-0.5 text-[11px] leading-relaxed text-faint">{hint}</p> : null}
    </div>
  );
}

function PlanRow({
  label,
  value,
  hint,
  emphasis = false,
}: {
  label: string;
  value: string;
  hint?: string;
  emphasis?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3 py-2">
      <div className="min-w-0">
        <dt className={`text-[11px] leading-relaxed ${emphasis ? 'font-medium text-ink' : 'text-muted'}`}>
          {label}
        </dt>
        {hint ? <dd className="mt-0.5 text-[10px] leading-relaxed text-faint">{hint}</dd> : null}
      </div>
      <dd className={`num shrink-0 text-sm font-semibold ${emphasis ? 'text-accent-soft' : 'text-ink'}`}>
        {value}
      </dd>
    </div>
  );
}

export function OpportunityOverview() {
  const { summary } = useOpportunities();
  const { view } = usePlanner();
  const { totals, plan } = summary;

  const verifiedShare =
    totals.obtainablePrimogems > 0
      ? Math.round((totals.verifiedPrimogems / totals.obtainablePrimogems) * 100)
      : 0;

  return (
    <section aria-labelledby="opportunity-overview-title" className="panel panel-pad">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="flex size-8 items-center justify-center rounded-lg border border-line-soft bg-raised text-accent"
          >
            <Sparkles size={15} />
          </span>
          <div>
            <h2 id="opportunity-overview-title" className="text-sm font-semibold text-ink">
              Remaining opportunities
            </h2>
            <p className="mt-0.5 text-[11px] text-faint">
              Only unfinished, currently available rewards count.
            </p>
          </div>
        </div>
        <Badge tone="muted">Local progress</Badge>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Metric
          icon={<Coins size={12} />}
          label="Primogems"
          value={formatNumber(totals.obtainablePrimogems)}
          unit="total"
          hint={`${verifiedShare}% verified · ${formatNumber(totals.estimatedPrimogems + totals.userEnteredPrimogems)} estimated`}
          accent
        />
        <Metric
          icon={<Target size={12} />}
          label="Extra wishes"
          value={formatNumber(totals.obtainableWishes)}
          unit="wishes"
          hint={
            totals.obtainableFates > 0
              ? `includes ${formatNumber(totals.obtainableFates)} Fates`
              : 'at 160 Primogems each'
          }
        />
        <Metric
          icon={<CalendarClock size={12} />}
          label="Expiring soon"
          value={formatNumber(totals.expiringSoonCount)}
          unit={totals.expiringSoonCount === 1 ? 'reward' : 'rewards'}
          hint={
            totals.expiringSoonCount > 0
              ? `${formatNumber(totals.expiringSoonPrimogems)} Primogems within 7 days`
              : 'Nothing expires this week'
          }
        />
        <Metric
          icon={<Trophy size={12} />}
          label="Completed"
          value={`${formatNumber(totals.completedCount)}/${formatNumber(totals.totalCount)}`}
          hint={
            totals.availableCount > 0
              ? `${formatNumber(totals.availableCount)} still open`
              : 'Nothing open'
          }
        />
      </dl>

      <div className="mt-3 rounded-xl border border-line-soft bg-abyss/30 px-3.5 py-2">
        <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line-soft pb-2">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-faint">
            Impact on your target
          </h3>
          <p className="text-[10px] text-faint">{formatDeadline(view.plan.endDate)}</p>
        </div>

        <dl className="divide-y divide-line-soft/60">
          <PlanRow label="Available now" value={`${formatNumber(plan.budgetWishes)} wishes`} />
          <PlanRow
            label="Projected by your deadline"
            value={plan.canForecast ? `${formatNumber(plan.projectedWishes)} wishes` : '—'}
            hint="Existing planner forecast, unchanged"
          />
          <PlanRow
            label="Additional from opportunities"
            value={plan.canForecast ? `+${formatNumber(totals.obtainableWishes)} wishes` : '—'}
            hint={`${formatNumber(totals.obtainablePrimogems)} Primogems, high priority ${formatNumber(totals.highPriorityPrimogems)}`}
            emphasis
          />
          <PlanRow
            label="With all opportunities"
            value={plan.canForecast ? `${formatNumber(plan.projectedWithOpportunitiesWishes)} wishes` : '—'}
          />
          <PlanRow
            label="Worst-case ceiling"
            value={`${formatNumber(plan.guaranteeWishes)} wishes`}
            hint="A spending ceiling, not a probability"
          />
          <PlanRow
            label="Gap after opportunities"
            value={
              !plan.canForecast
                ? '—'
                : plan.gapAfterOpportunities === 0
                  ? 'Covered'
                  : `${formatNumber(plan.gapAfterOpportunities)} short`
            }
          />
          <PlanRow
            label="Selected for your opportunity plan"
            value={`${formatNumber(totals.plannedWishes)} wishes`}
            hint={`${formatNumber(totals.plannedPrimogems)} Primogems${
              plan.canForecast
                ? plan.gapAfterPlanned === 0
                  ? ' · gap covered with your selection'
                  : ` · gap ${formatNumber(plan.gapAfterPlanned)} short with your selection`
                : ''
            }`}
          />
        </dl>
      </div>

      <p className="mt-2 text-[11px] leading-relaxed text-faint">
        Opportunities are never added to the planner forecast automatically. Tick “Include in my
        opportunity plan” on the rewards you intend to do; the planner’s own income stays untouched,
        so nothing is counted twice.
      </p>
    </section>
  );
}
