import { AppShell } from './components/layout/AppShell';
import { DashboardPage } from './pages/DashboardPage';
import { PlannerPage } from './pages/PlannerPage';
import { useHashRoute } from './lib/useHashRoute';
import { PlannerProvider } from './state/PlannerProvider';

function RoutedApp() {
  const [route, navigate] = useHashRoute();

  return (
    <AppShell route={route} onNavigate={navigate}>
      {route === 'planner' ? (
        <PlannerPage onNavigate={navigate} />
      ) : (
        <DashboardPage onNavigate={navigate} />
      )}
    </AppShell>
  );
}

export function App() {
  return (
    <PlannerProvider>
      <RoutedApp />
    </PlannerProvider>
  );
}
