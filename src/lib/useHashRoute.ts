import { useCallback, useEffect, useState } from 'react';

export type RouteId = 'dashboard' | 'planner';

const ROUTES: readonly RouteId[] = ['dashboard', 'planner'];

/** Path aliases so `#/planner` and `#planner` both work. */
const HASH_ALIASES: Record<string, RouteId> = {
  dashboard: 'dashboard',
  planner: 'planner',
};

function currentRoute(): RouteId {
  const hash = window.location.hash.replace(/^#\/?/, '').split('?')[0] ?? '';
  return HASH_ALIASES[hash] ?? 'dashboard';
}

export function useHashRoute(): [RouteId, (route: RouteId) => void] {
  const [route, setRoute] = useState<RouteId>(currentRoute);

  useEffect(() => {
    const onChange = () => setRoute(currentRoute());
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  const navigate = useCallback((next: RouteId) => {
    if (!ROUTES.includes(next)) return;
    window.location.hash = `/${next}`;
    setRoute(next);
  }, []);

  return [route, navigate];
}
