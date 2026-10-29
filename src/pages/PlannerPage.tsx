import { LayoutDashboard } from 'lucide-react';
import { IncomeCard } from '../components/planner/IncomeCard';
import { ResourcesCard } from '../components/planner/ResourcesCard';
import { RewardsCard } from '../components/planner/RewardsCard';
import { SummaryPanel } from '../components/planner/SummaryPanel';
import { TargetFormCard } from '../components/planner/TargetFormCard';
import { Alert } from '../components/ui/Alert';
import type { RouteId } from '../lib/useHashRoute';
import { usePlanner } from '../state/PlannerProvider';

export function PlannerPage({ onNavigate }: { onNavigate: (route: RouteId) => void }) {
  const { loadNotice, dismissNotice, storageError } = usePlanner();

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label">Inputs</p>
          <h1 className="mt-1.5 font-display text-3xl leading-tight sm:text-4xl">Wish Planner</h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
            Everything here is editable and saved locally as you type. The summary updates with
            every change, and nothing is sent anywhere.
          </p>
        </div>
        <button type="button" onClick={() => onNavigate('dashboard')} className="btn">
          <LayoutDashboard size={15} aria-hidden="true" />
          Back to dashboard
        </button>
      </header>

      {loadNotice ? (
        <Alert tone="warning" title="Older saved data could not be loaded" onDismiss={dismissNotice}>
          {loadNotice}
        </Alert>
      ) : null}

      {storageError ? (
        <Alert tone="error" title="Saving is failing">
          {storageError} Your edits remain in this tab only until saving works again.
        </Alert>
      ) : null}

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-5">
          <ResourcesCard />
          <TargetFormCard />
          <IncomeCard />
          <RewardsCard />
        </div>
        <SummaryPanel onOpenDashboard={() => onNavigate('dashboard')} />
      </div>
    </div>
  );
}
