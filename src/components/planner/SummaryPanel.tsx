import { House, Target } from 'lucide-react';
import { SCENARIOS } from '../../domain/forecast';
import { hasTarget } from '../../domain/schema';
import { formatDeadline, formatNumber, scenarioLabel } from '../../lib/format';
import { usePlanner } from '../../state/PlannerProvider';
import { Card, CardHeader } from '../ui/Card';
import { SaveStatusPill, StorageBadge } from '../ui/SaveStatus';

function Row({ label, value, hint }: { label: string; value: string; hint?: string | undefined }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2">
      <div className="min-w-0">
        <dt className="text-[11px] leading-relaxed text-muted">{label}</dt>
        {hint ? <dd className="mt-0.5 text-[10px] leading-relaxed text-faint">{hint}</dd> : null}
      </div>
      <dd className="num shrink-0 text-sm font-semibold text-ink">{value}</dd>
    </div>
  );
}

export function SummaryPanel({ onOpenHome }: { onOpenHome: () => void }) {
  const { view, activeScenario } = usePlanner();
  const active = view.projections[activeScenario];
  const targetLabel = hasTarget(view.plan) ? view.plan.targetName.trim() : 'your target';

  return (
    <div className="flex flex-col gap-3.5 lg:sticky lg:top-8">
      <Card labelledBy="summary-title">
        <CardHeader id="summary-title" title="At a glance" icon={<Target size={15} />} />

        {!hasTarget(view.plan) ? (
          <p className="mb-3 rounded-lg border border-line-soft bg-abyss/40 px-3 py-2 text-[10px] leading-relaxed text-faint">
            Name a target above to label these numbers. The budget maths works either way.
          </p>
        ) : null}

        <dl className="divide-y divide-line-soft/70">
          <Row
            label="Available now"
            value={`${formatNumber(view.budget.wishes)} wishes`}
            hint={`${formatNumber(view.budget.leftoverPrimogems)} Primogems left over`}
          />
          <Row
            label={`Projected by ${formatDeadline(view.plan.endDate)}`}
            value={view.canForecast ? `${formatNumber(active.projected.wishes)} wishes` : '—'}
            hint={`${scenarioLabel(activeScenario)} scenario`}
          />
          <Row
            label="Worst-case guarantee"
            value={`${formatNumber(view.guarantee.worstCaseWishes)} wishes`}
            hint={`for ${targetLabel}`}
          />
          <Row
            label="Gap to guarantee"
            value={
              view.canForecast
                ? view.guaranteeShortfall === 0
                  ? 'Covered'
                  : `${formatNumber(view.guaranteeShortfall)} short`
                : '—'
            }
            hint={
              view.canForecast && view.guaranteeShortfall > 0
                ? `≈ ${formatNumber(view.guaranteePrimogemsNeeded)} Primogems`
                : undefined
            }
          />
        </dl>

        {!view.canForecast ? (
          <p className="mt-3 rounded-lg border border-ember/25 bg-ember/[0.07] px-3 py-2 text-[10px] leading-relaxed text-ember/90">
            Fix the banner dates to enable projections.
          </p>
        ) : null}
      </Card>

      <Card labelledBy="scenario-title">
        <h2 id="scenario-title" className="text-[11px] font-semibold uppercase tracking-[0.12em] text-faint">
          Scenario totals
        </h2>
        <dl className="mt-2 divide-y divide-line-soft/70">
          {SCENARIOS.map((scenario) => (
            <div key={scenario.id} className="flex items-center justify-between gap-3 py-1.5">
              <dt className={`text-[11px] ${scenario.id === activeScenario ? 'text-accent' : 'text-muted'}`}>
                {scenario.label}
              </dt>
              <dd className="num text-[11px] font-medium text-ink">
                {view.canForecast
                  ? `${formatNumber(view.projections[scenario.id].projected.wishes)} wishes`
                  : '—'}
              </dd>
            </div>
          ))}
        </dl>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <SaveStatusPill />
        <button type="button" onClick={onOpenHome} className="btn btn-ghost text-xs">
          <House size={13} aria-hidden="true" />
          Home
        </button>
      </div>
      <div className="px-1">
        <StorageBadge />
      </div>
    </div>
  );
}
