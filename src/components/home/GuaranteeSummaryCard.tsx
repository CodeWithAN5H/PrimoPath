import { CircleCheck, ShieldCheck } from 'lucide-react';
import { formatDeadline, formatNumber } from '../../lib/format';
import { useAnimatedNumber } from '../../lib/useAnimatedNumber';
import { usePlanner } from '../../state/PlannerProvider';

export function GuaranteeSummaryCard() {
  const { view } = usePlanner();
  const { guarantee } = view;
  const covered = view.guaranteeShortfall === 0;
  const animatedWorstCase = useAnimatedNumber(guarantee.worstCaseWishes);
  const animatedGap = useAnimatedNumber(view.guaranteeShortfall);

  return (
    <section aria-labelledby="guarantee-summary-title" className="panel panel-pad">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="flex size-8 items-center justify-center rounded-lg border border-line-soft bg-raised text-accent"
          >
            <ShieldCheck size={15} />
          </span>
          <h2 id="guarantee-summary-title" className="text-sm font-semibold text-ink">
            Worst-case budget
          </h2>
        </div>
        <span className="chip">Ceiling, not odds</span>
      </div>

      <p className="mt-3 flex items-baseline gap-1.5">
        <span className="num font-display text-3xl leading-none text-ink">
          {formatNumber(animatedWorstCase)}
        </span>
        <span className="text-xs text-muted">wishes</span>
      </p>
      <p className="mt-1 text-[11px] leading-relaxed text-faint">
        {formatNumber(guarantee.toNextFiveStar)} to the next 5-star
        {guarantee.afterNextFiveStar > 0
          ? ` + ${formatNumber(guarantee.afterNextFiveStar)} if you lose the next one`
          : ' · one cycle is enough'}
      </p>

      <div
        className={`mt-3 rounded-xl border px-3 py-2.5 text-xs leading-relaxed ${
          covered
            ? 'border-mint/25 bg-mint/[0.07] text-mint'
            : 'border-amber/25 bg-amber/[0.07] text-amber/90'
        }`}
      >
        <p className="flex items-center gap-1.5 font-semibold">
          <CircleCheck size={13} aria-hidden="true" />
          {covered ? 'Worst case covered' : 'Remaining gap'}
        </p>
        <p className="mt-1">
          {!view.canForecast
            ? 'Set valid banner dates to compare your projection with this ceiling.'
            : covered
              ? `Your ${view.activeScenario} projection reaches the worst case by ${formatDeadline(view.plan.endDate)}.`
              : `${formatNumber(animatedGap)} wishes short by ${formatDeadline(view.plan.endDate)} — about ${formatNumber(view.guaranteePrimogemsNeeded)} Primogems.`}
        </p>
      </div>

      <p className="mt-2.5 text-[11px] leading-relaxed text-faint">
        This is a spending ceiling, not a probability or a promise. It assumes every 5-star arrives
        at hard pity and every 50/50 is lost, so the real cost can only land lower.
      </p>
    </section>
  );
}
