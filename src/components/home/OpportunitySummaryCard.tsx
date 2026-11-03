import { ArrowRight, CalendarClock, Coins, Sparkles } from 'lucide-react';
import { formatNumber } from '../../lib/format';
import { useOpportunities } from '../../state/OpportunityProvider';
import { Badge } from '../ui/Badge';

export function OpportunitySummaryCard({
  onOpenOpportunities,
}: {
  onOpenOpportunities: () => void;
}) {
  const { summary } = useOpportunities();
  const top = summary.recommendations[0];
  const { totals } = summary;

  return (
    <section
      aria-labelledby="next-opportunity-title"
      className="panel panel-pad lg:col-span-3"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="flex size-8 items-center justify-center rounded-lg border border-line-soft bg-raised text-accent"
          >
            <Sparkles size={15} />
          </span>
          <div>
            <h2 id="next-opportunity-title" className="text-sm font-semibold text-ink">
              Next opportunity
            </h2>
            <p className="mt-0.5 text-[11px] text-faint">
              Unfinished rewards ranked against your deadline
            </p>
          </div>
        </div>
        <Badge tone={totals.expiringSoonCount > 0 ? 'amber' : 'muted'}>
          <CalendarClock size={11} aria-hidden="true" />
          {totals.expiringSoonCount > 0
            ? `${totals.expiringSoonCount} expiring soon`
            : 'None expiring this week'}
        </Badge>
      </div>

      {top ? (
        <div className="mt-3 flex flex-col gap-3 rounded-xl border border-line-soft bg-abyss/30 px-3.5 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="flex flex-wrap items-center gap-1.5">
              <span className="text-sm font-medium text-ink">{top.opportunity.name}</span>
              <Badge tone={top.priority === 'high' ? 'accent' : 'muted'}>
                {top.priority === 'high' ? 'High priority' : 'Medium priority'}
              </Badge>
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-muted">
              {formatNumber(top.remainingPrimogems)} Primogems · {top.reasons[0] ?? 'Unfinished reward.'}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-4">
            <div className="text-right">
              <p className="num text-lg font-semibold text-accent-soft">
                +{formatNumber(totals.obtainableWishes)}
              </p>
              <p className="flex items-center justify-end gap-1 text-[10px] text-faint">
                <Coins size={10} aria-hidden="true" />
                wishes from {formatNumber(totals.obtainablePrimogems)} Primogems
              </p>
            </div>
            <button type="button" onClick={onOpenOpportunities} className="btn text-xs">
              Open
              <ArrowRight size={13} aria-hidden="true" />
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-3 flex flex-col gap-3 rounded-xl border border-dashed border-line bg-abyss/30 px-3.5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-xl text-[11px] leading-relaxed text-faint">
            Nothing is currently recommended: available rewards are completed, marked not applicable,
            or already counted by your planner income. Add an event, code or exploration estimate to
            see it ranked here.
          </p>
          <button type="button" onClick={onOpenOpportunities} className="btn btn-ghost text-xs">
            Open Opportunities
            <ArrowRight size={13} aria-hidden="true" />
          </button>
        </div>
      )}

      <p className="mt-2 text-[10px] leading-relaxed text-faint">
        These rewards are not added to the planner forecast automatically. Open Opportunities to pick
        the ones you intend to do.
      </p>
    </section>
  );
}
