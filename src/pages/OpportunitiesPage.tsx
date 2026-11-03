import { Sparkles } from 'lucide-react';
import { PlaceholderPage } from '../components/layout/PlaceholderPage';
import { usePlanner } from '../state/PlannerProvider';
import type { RouteId } from '../lib/useHashRoute';

export function OpportunitiesPage({ onNavigate }: { onNavigate: (route: RouteId) => void }) {
  const { state } = usePlanner();

  return (
    <PlaceholderPage
      icon={Sparkles}
      eyebrow="Opportunities"
      title="The reward optimizer is not built yet"
      description="This section will rank time-limited Primogem sources by what they are worth for the time they take, so the best ones stand out before they expire."
      milestone="Planned · Milestone 2"
      planned={[
        'A verified catalogue of in-game and web rewards, with expiry dates.',
        'Value per effort, prerequisite checks and reachability before each deadline.',
        'Suggestions that account for the banner you are currently planning.',
      ]}
      footnote={
        <>
          No reward data is bundled in this build, so nothing here is estimated or invented. You
          already have{' '}
          <span className="num font-semibold text-muted">
            {state.oneTimeRewards.length} one-time reward
            {state.oneTimeRewards.length === 1 ? '' : 's'}
          </span>{' '}
          listed manually in the planner, and those still count toward every forecast.
        </>
      }
      onOpenPlanner={() => onNavigate('planner')}
    />
  );
}
