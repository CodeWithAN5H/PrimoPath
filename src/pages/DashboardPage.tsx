import { ArrowRight, Sparkles, Target } from 'lucide-react';
import { AssumptionsCard } from '../components/dashboard/AssumptionsCard';
import { BudgetSummaryCard } from '../components/dashboard/BudgetSummaryCard';
import { ForecastCard } from '../components/dashboard/ForecastCard';
import { GuaranteeCard } from '../components/dashboard/GuaranteeCard';
import { TargetSummaryCard } from '../components/dashboard/TargetSummaryCard';
import { Alert } from '../components/ui/Alert';
import { formatDisplayDate } from '../domain/dates';
import { hasTarget } from '../domain/schema';
import type { RouteId } from '../lib/useHashRoute';
import { usePlanner } from '../state/PlannerProvider';

export function DashboardPage({ onNavigate }: { onNavigate: (route: RouteId) => void }) {
  const { view, today, loadNotice, dismissNotice, storageError } = usePlanner();
  const dateErrors = view.dateIssues.filter((issue) => issue.severity === 'error');
  const dateWarnings = view.dateIssues.filter((issue) => issue.severity === 'warning');

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label">{formatDisplayDate(today)}</p>
          <h1 className="mt-1.5 font-display text-3xl leading-tight sm:text-4xl">
            {hasTarget(view.plan)
              ? `The path to ${view.plan.targetName.trim()}`
              : 'Your Primogem path'}
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
            A deadline-aware budget for the {view.plan.bannerType === 'character' ? 'character' : 'weapon'} banner,
            built only from the numbers you enter and the banner rules in the mechanics config.
          </p>
        </div>
        <button type="button" onClick={() => onNavigate('planner')} className="btn btn-primary">
          <Target size={15} aria-hidden="true" />
          {hasTarget(view.plan) ? 'Adjust plan' : 'Set your target'}
          <ArrowRight size={14} aria-hidden="true" />
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
            className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-gold hover:underline"
          >
            Fix dates in the Wish Planner
            <ArrowRight size={12} aria-hidden="true" />
          </button>
        </Alert>
      ) : null}

      {dateWarnings.length > 0 ? (
        <Alert tone="warning" title="This banner has ended">
          {dateWarnings.map((issue) => issue.message).join(' ')}
        </Alert>
      ) : null}

      {!hasTarget(view.plan) ? (
        <Alert tone="info" title="No target named yet">
          Your budget is calculated regardless, but naming a target lets PrimoPath tell you how far
          that budget is from a worst-case guarantee.
        </Alert>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-3">
        <BudgetSummaryCard />
        <TargetSummaryCard onEdit={() => onNavigate('planner')} />
        <ForecastCard />
        <GuaranteeCard />
        <AssumptionsCard />
      </div>

      <p className="flex items-center justify-center gap-2 pb-2 text-[11px] text-faint">
        <Sparkles size={12} aria-hidden="true" className="text-gold/70" />
        PrimoPath does not connect to your game account, and never asks for HoYoverse credentials.
      </p>
    </div>
  );
}
