import { Dices } from 'lucide-react';
import { PlaceholderPage } from '../components/layout/PlaceholderPage';
import type { RouteId } from '../lib/useHashRoute';

export function SimulatorPage({ onNavigate }: { onNavigate: (route: RouteId) => void }) {
  return (
    <PlaceholderPage
      icon={Dices}
      eyebrow="Wish Simulator"
      title="Simulation arrives with the probability engine"
      description="PrimoPath can already tell you what a worst-case guarantee costs. Simulating actual wish sequences needs the probability model, which is not part of this milestone."
      milestone="Planned · Milestone 3"
      planned={[
        'Soft-pity chance curves and Capturing Radiance from the versioned mechanics config.',
        'Simulated wish sequences with a distribution of outcomes rather than one number.',
        'Side-by-side odds for a character target, a weapon target, or both before their deadlines.',
      ]}
      footnote="Until then, treat the guarantee budget on Home as a spending ceiling for the absolute worst case — it is not a probability and it does not predict what you will pull."
      onOpenPlanner={() => onNavigate('planner')}
    />
  );
}
