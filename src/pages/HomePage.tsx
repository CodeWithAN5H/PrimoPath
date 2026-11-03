import { ArrowRight, Sparkles } from 'lucide-react';
import { ForecastOverviewCard } from '../components/home/ForecastOverviewCard';
import { GuaranteeSummaryCard } from '../components/home/GuaranteeSummaryCard';
import { NextOpportunityCard } from '../components/home/NextOpportunityCard';
import { ResourceOverviewCard } from '../components/home/ResourceOverviewCard';
import { TargetBannerCard } from '../components/home/TargetBannerCard';
import { Alert } from '../components/ui/Alert';
import { formatDisplayDate } from '../domain/dates';
import { hasTarget } from '../domain/schema';
import type { RouteId } from '../lib/useHashRoute';
import { usePlanner } from '../state/PlannerProvider';

export function HomePage({ onNavigate }: { onNavigate: (route: RouteId) => void }) {
  const { view, today, loadNotice, dismissNotice, storageError } = usePlanner();
  const dateErrors = view.dateIssues.filter((issue) => issue.severity === 'error');
  const dateWarnings = view.dateIssues.filter((issue) => issue.severity === 'warning');

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="label">{formatDisplayDate(today)}</p>
          <h1 className="mt-1 font-display text-2xl leading-tight text-ink sm:text-3xl">
            Where your wishes stand
          </h1>
          <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-muted">
            {hasTarget(view.plan)
              ? `Planning for ${view.plan.targetName.trim()} · ${
                  view.plan.bannerType === 'character' ? 'character' : 'weapon'
                } banner.`
              : 'A deadline-aware budget built only from the numbers you enter.'}
          </p>
        </div>
        <button type="button" onClick={() => onNavigate('planner')} className="btn">
          {hasTarget(view.plan) ? 'Adjust plan' : 'Set your target'}
          <ArrowRight size={15} aria-hidden="true" />
        </button>
      </header>

      {loadNotice ? (
        <Alert tone="warning" title="Older saved data could not be loaded" onDismiss={dismissNotice}>
          {loadNotice}
        </Alert>
      ) : null}

      {storageError ? (
        <Alert tone="error" title="Saving is failing">
          {storageError} Until this is fixed, changes live only in this tab.
        </Alert>
      ) : null}

      {dateErrors.length > 0 ? (
        <Alert tone="error" title="Banner dates need attention">
          <ul className="list-inside list-disc space-y-1">
            {dateErrors.map((issue) => (
              <li key={`${issue.field}-${issue.message}`}>{issue.message}</li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => onNavigate('planner')}
            className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-medium text-accent hover:underline"
          >
            Fix dates in the Wish Planner
            <ArrowRight size={11} aria-hidden="true" />
          </button>
        </Alert>
      ) : null}

      {dateWarnings.length > 0 ? (
        <Alert tone="warning" title="This banner has ended">
          {dateWarnings.map((issue) => issue.message).join(' ')}
        </Alert>
      ) : null}

      <div className="grid gap-3.5 sm:gap-4 lg:grid-cols-3">
        <TargetBannerCard onOpenPlanner={() => onNavigate('planner')} />
        <ResourceOverviewCard />
        <ForecastOverviewCard />
        <GuaranteeSummaryCard />
        <NextOpportunityCard onOpenOpportunities={() => onNavigate('opportunities')} />
      </div>

      <p className="flex items-center justify-center gap-2 pb-1 text-[11px] text-faint">
        <Sparkles size={11} aria-hidden="true" className="text-accent/70" />
        No game account, no credentials, and nothing sent to a server.
      </p>
    </div>
  );
}
