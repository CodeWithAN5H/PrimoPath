import { House } from 'lucide-react';
import { BannerStateSection } from '../components/planner/BannerStateSection';
import { IncomeSection } from '../components/planner/IncomeSection';
import { ResourcesSection } from '../components/planner/ResourcesSection';
import { SummaryPanel } from '../components/planner/SummaryPanel';
import { TargetSection } from '../components/planner/TargetSection';
import { Alert } from '../components/ui/Alert';
import type { RouteId } from '../lib/useHashRoute';
import { usePlanner } from '../state/PlannerProvider';

export function PlannerPage({ onNavigate }: { onNavigate: (route: RouteId) => void }) {
  const { loadNotice, dismissNotice, storageError } = usePlanner();

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="label">Inputs</p>
          <h1 className="mt-1 font-display text-2xl leading-tight text-ink sm:text-3xl">Wish Planner</h1>
          <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-muted">
            Four sections, saved locally as you change them. Open the ones you need — every
            calculation uses all of them regardless.
          </p>
        </div>
        <button type="button" onClick={() => onNavigate('home')} className="btn">
          <House size={15} aria-hidden="true" />
          Home
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

      <div className="grid items-start gap-3.5 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)] lg:gap-4">
        <div className="flex min-w-0 flex-col gap-3">
          <TargetSection />
          <ResourcesSection />
          <BannerStateSection />
          <IncomeSection />
        </div>
        <SummaryPanel onOpenHome={() => onNavigate('home')} />
      </div>
    </div>
  );
}
