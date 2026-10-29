import { CircleCheck, ShieldCheck } from 'lucide-react';
import { formatDeadline, formatNumber } from '../../lib/format';
import { usePlanner } from '../../state/PlannerProvider';
import { Badge } from '../ui/Badge';
import { Card, CardHeader } from '../ui/Card';

export function GuaranteeCard() {
  const { view } = usePlanner();
  const { guarantee } = view;
  const covered = view.guaranteeShortfall === 0;

  return (
    <Card labelledBy="guarantee-title">
      <CardHeader
        id="guarantee-title"
        title="Guarantee budget"
        description="Worst case, assuming every 5-star arrives at hard pity and you lose every 50/50."
        icon={<ShieldCheck size={16} />}
        action={<Badge tone="muted">No luck assumed</Badge>}
      />

      <div className="flex items-baseline gap-2">
        <span className="num font-display text-4xl text-ink">
          {formatNumber(guarantee.worstCaseWishes)}
        </span>
        <span className="text-sm text-muted">wishes</span>
      </div>
      <p className="mt-1 text-xs text-faint">
        {formatNumber(guarantee.toNextFiveStar)} to the next 5-star
        {guarantee.afterNextFiveStar > 0
          ? ` + ${formatNumber(guarantee.afterNextFiveStar)} after it`
          : ' · nothing further needed'}
      </p>

      <ul className="mt-4 space-y-2">
        {guarantee.lines.map((line) => (
          <li key={line} className="flex gap-2 text-xs leading-relaxed text-muted">
            <span
              aria-hidden="true"
              className="mt-1.5 size-1 shrink-0 rounded-full bg-gold/70"
            />
            {line}
          </li>
        ))}
      </ul>

      <div
        className={`mt-4 rounded-xl border px-3.5 py-3 text-xs leading-relaxed ${
          covered
            ? 'border-mint/25 bg-mint/8 text-mint'
            : 'border-amber/25 bg-amber/8 text-amber/90'
        }`}
      >
        <p className="flex items-center gap-1.5 font-semibold">
          <CircleCheck size={14} aria-hidden="true" />
          {covered ? 'Worst case covered' : 'Gap to the worst case'}
        </p>
        <p className="mt-1">
          {covered
            ? `Your projected budget by ${formatDeadline(view.plan.endDate)} reaches ${formatNumber(
                view.projections[view.activeScenario].projected.wishes,
              )} wishes, which meets the worst case.`
            : `You are ${formatNumber(view.guaranteeShortfall)} wishes short by ${formatDeadline(
                view.plan.endDate,
              )} — about ${formatNumber(view.guaranteePrimogemsNeeded)} Primogems.`}
        </p>
        <p className="mt-1 opacity-80">
          This is a spending ceiling, not a promise: the real cost can land lower, and anything you
          spend elsewhere changes it.
        </p>
      </div>
    </Card>
  );
}
