import { ArrowRight, CalendarDays, Target } from 'lucide-react';
import { describeItem, findItemByName, type TargetItem } from '../../domain/items';
import { formatDayCount, formatDeadline, formatNumber } from '../../lib/format';
import { useAnimatedNumber } from '../../lib/useAnimatedNumber';
import { usePlanner } from '../../state/PlannerProvider';
import { Badge } from '../ui/Badge';
import { ItemArt, RarityStars } from '../ui/ItemArt';

function Metric({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-line-soft bg-abyss/40 px-3 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-faint">{label}</p>
      <p className="num mt-1 text-lg font-semibold text-ink">{value}</p>
      {hint ? <p className="mt-0.5 text-[11px] text-faint">{hint}</p> : null}
    </div>
  );
}

export function TargetBannerCard({ onOpenPlanner }: { onOpenPlanner: () => void }) {
  const { view } = usePlanner();
  const { plan, deadline, budget } = view;
  const isCharacter = plan.bannerType === 'character';

  const found = findItemByName(plan.targetName);
  const item: TargetItem | null = found && found.kind === plan.bannerType ? found : null;

  const projected = view.canForecast ? view.projections[view.activeScenario].projected.wishes : null;
  const animatedAvailable = useAnimatedNumber(budget.wishes);
  const animatedProjected = useAnimatedNumber(projected ?? 0);

  return (
    <section
      aria-labelledby="target-banner-title"
      className="panel panel-pad relative overflow-hidden lg:col-span-2"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-accent/[0.09] to-transparent"
      />

      <div className="relative flex flex-wrap items-center justify-between gap-2">
        <p className="label">Target banner</p>
        <div className="flex items-center gap-2">
          <Badge tone={isCharacter ? 'accent' : 'azure'}>
            {isCharacter ? 'Character Event Wish' : 'Weapon Event Wish'}
          </Badge>
          <Badge tone={deadline.passed ? 'ember' : deadline.daysRemaining <= 7 ? 'amber' : 'muted'}>
            <CalendarDays size={11} aria-hidden="true" />
            {formatDayCount(deadline.daysRemaining)}
          </Badge>
        </div>
      </div>

      <div className="relative mt-3 flex items-start gap-3.5 sm:gap-4">
        {item ? (
          <ItemArt item={item} size="hero" priority />
        ) : (
          <div
            aria-hidden="true"
            className="flex size-24 shrink-0 items-center justify-center rounded-2xl border border-dashed border-line bg-abyss/40 text-faint sm:size-28"
          >
            <Target size={26} />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <h2
            id="target-banner-title"
            className="font-display text-xl leading-tight text-ink sm:text-2xl"
          >
            {plan.targetName.trim() || 'No target selected'}
          </h2>

          {item ? (
            <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
              <RarityStars rarity={item.rarity} />
              <span>{describeItem(item)}</span>
            </p>
          ) : (
            <p className="mt-1 max-w-sm text-xs leading-relaxed text-faint">
              {plan.targetName.trim()
                ? 'Custom target — not in the local catalogue, so no artwork or rarity is shown.'
                : 'Choose a character or weapon in the Wish Planner to attach artwork and a guarantee budget.'}
            </p>
          )}

          <p className="mt-2 text-[11px] text-faint">
            Deadline {formatDeadline(plan.endDate)}
            {deadline.passed ? ' · banner ended' : ` · ${formatDayCount(deadline.daysRemaining)}`}
          </p>
        </div>
      </div>

      <div className="relative mt-4 grid grid-cols-2 gap-2">
        <Metric
          label="Available now"
          value={view.canForecast ? formatNumber(animatedAvailable) : formatNumber(budget.wishes)}
          hint={`${formatNumber(view.budget.leftoverPrimogems)} Primogems spare`}
        />
        <Metric
          label={`Projected by ${formatDeadline(plan.endDate)}`}
          value={projected === null ? '—' : formatNumber(animatedProjected)}
          hint={
            projected === null
              ? 'Fix the banner dates'
              : `${formatNumber(Math.max(0, projected - budget.wishes))} from future income`
          }
        />
      </div>

      <button type="button" onClick={onOpenPlanner} className="btn btn-primary relative mt-3.5 w-full sm:w-auto">
        {plan.targetName.trim() ? 'Open Wish Planner' : 'Choose your target'}
        <ArrowRight size={15} aria-hidden="true" />
      </button>
    </section>
  );
}
