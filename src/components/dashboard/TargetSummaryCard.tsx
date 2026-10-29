import { ArrowRight, CalendarDays, ShieldCheck, Target } from 'lucide-react';
import { MECHANICS } from '../../domain/mechanics';
import { hasTarget } from '../../domain/schema';
import { formatDayCount, formatDeadline, formatNumber } from '../../lib/format';
import { usePlanner } from '../../state/PlannerProvider';
import { Badge } from '../ui/Badge';
import { Card, CardHeader } from '../ui/Card';

export function TargetSummaryCard({ onEdit }: { onEdit: () => void }) {
  const { view } = usePlanner();
  const { plan, deadline } = view;
  const hardPity =
    plan.bannerType === 'character' ? MECHANICS.character.hardPity : MECHANICS.weapon.hardPity;
  const pityPct = Math.min(100, Math.round((plan.pity / hardPity) * 100));
  const guaranteed =
    plan.bannerType === 'character'
      ? plan.guaranteed
      : plan.fatePoints >= MECHANICS.weapon.fatePointsToGuarantee;

  return (
    <Card labelledBy="target-title">
      <CardHeader
        id="target-title"
        title="Target banner"
        icon={<Target size={16} />}
        action={
          <button type="button" onClick={onEdit} className="btn btn-ghost !px-2 !py-1 text-xs">
            Edit
            <ArrowRight size={13} aria-hidden="true" />
          </button>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={plan.bannerType === 'character' ? 'violet' : 'gold'}>
          {plan.bannerType === 'character' ? 'Character Event Wish' : 'Weapon Event Wish'}
        </Badge>
        <Badge tone={deadline.passed ? 'ember' : deadline.daysRemaining <= 7 ? 'amber' : 'muted'}>
          <CalendarDays size={11} aria-hidden="true" />
          {formatDayCount(deadline.daysRemaining)}
        </Badge>
      </div>

      <p className="mt-3 text-lg font-semibold text-ink">
        {hasTarget(plan) ? plan.targetName.trim() : 'No target set yet'}
      </p>
      <p className="mt-0.5 text-xs text-faint">
        {hasTarget(plan)
          ? `Deadline ${formatDeadline(plan.endDate)}`
          : 'Name the character or weapon you are saving for.'}
      </p>

      <div className="mt-4">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted">Pity progress</span>
          <span className="num text-faint">
            {plan.pity} / {hardPity}
          </span>
        </div>
        <div
          role="progressbar"
          aria-label="Pity progress toward hard pity"
          aria-valuemin={0}
          aria-valuemax={hardPity}
          aria-valuenow={plan.pity}
          aria-valuetext={`${plan.pity} of ${hardPity} wishes since the last 5-star`}
          className="mt-1.5 h-2 overflow-hidden rounded-full bg-void/80 ring-1 ring-inset ring-line-soft"
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-gold-deep to-gold transition-[width]"
            style={{ width: `${pityPct}%` }}
          />
        </div>
        <p className="mt-1.5 text-[11px] text-faint">
          {formatNumber(view.guarantee.toNextFiveStar)} wishes to the next 5-star at worst.
        </p>
      </div>

      <div className="mt-4 flex items-start gap-2 rounded-xl border border-line-soft bg-void/40 px-3 py-2.5">
        <ShieldCheck
          size={15}
          aria-hidden="true"
          className={guaranteed ? 'mt-0.5 text-mint' : 'mt-0.5 text-faint'}
        />
        <div className="text-xs leading-relaxed">
          <p className={guaranteed ? 'font-medium text-mint' : 'font-medium text-ink'}>
            {guaranteed
              ? plan.bannerType === 'character'
                ? 'Featured character guaranteed'
                : 'Charted weapon guaranteed'
              : plan.bannerType === 'character'
                ? 'Next 5-star is a 50/50'
                : `${plan.fatePoints} of ${MECHANICS.weapon.fatePointsToGuarantee} Fate Points`}
          </p>
          <p className="mt-0.5 text-faint">
            {plan.bannerType === 'character'
              ? 'Character pity carries across concurrent character banners.'
              : 'Weapon pity and Fate Points stay on the Weapon Event Wish.'}
          </p>
        </div>
      </div>
    </Card>
  );
}
