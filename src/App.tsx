import { AppShell } from './components/layout/AppShell';
import { useHashRoute, type RouteId } from './lib/useHashRoute';
import { AccountPage } from './pages/AccountPage';
import { HomePage } from './pages/HomePage';
import { OpportunitiesPage } from './pages/OpportunitiesPage';
import { PlannerPage } from './pages/PlannerPage';
import { SimulatorPage } from './pages/SimulatorPage';
import { OpportunityProvider } from './state/OpportunityProvider';
import { PlannerProvider } from './state/PlannerProvider';

function Page({ route, onNavigate }: { route: RouteId; onNavigate: (route: RouteId) => void }) {
  switch (route) {
    case 'planner':
      return <PlannerPage onNavigate={onNavigate} />;
    case 'opportunities':
      return <OpportunitiesPage onNavigate={onNavigate} />;
    case 'simulator':
      return <SimulatorPage onNavigate={onNavigate} />;
    case 'account':
      return <AccountPage onNavigate={onNavigate} />;
    case 'home':
    default:
      return <HomePage onNavigate={onNavigate} />;
  }
}

function RoutedApp() {
  const [route, navigate] = useHashRoute();

  return (
    <AppShell route={route} onNavigate={navigate}>
      <div key={route} className="animate-rise">
        <Page route={route} onNavigate={navigate} />
      </div>
    </AppShell>
  );
}

export function App() {
  return (
    <PlannerProvider>
      <OpportunityProvider>
        <RoutedApp />
      </OpportunityProvider>
    </PlannerProvider>
  );
}
