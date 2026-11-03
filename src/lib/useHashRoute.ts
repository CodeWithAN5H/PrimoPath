import { useCallback, useEffect, useState } from 'react';

export type RouteId = 'home' | 'planner' | 'opportunities' | 'simulator' | 'account';

export const ROUTES: readonly RouteId[] = [
  'home',
  'planner',
  'opportunities',
  'simulator',
  'account',
];

/**
 * Hash aliases. `dashboard` and `planner` are kept from Milestone 1 so existing
 * bookmarks and links keep resolving to the right screen.
 */
const HASH_ALIASES: Record<string, RouteId> = {
  '': 'home',
  home: 'home',
  dashboard: 'home',
  planner: 'planner',
  'wish-planner': 'planner',
  opportunities: 'opportunities',
  simulator: 'simulator',
  'wish-simulator': 'simulator',
  account: 'account',
};

/** Maps a `window.location.hash` value to a known route, defaulting to home. */
export function resolveRoute(hash: string): RouteId {
  const raw = hash
    .replace(/^#\/?/, '')
    .split(/[?&#]/)[0]
    ?.trim()
    .toLowerCase();
  return (raw !== undefined ? HASH_ALIASES[raw] : undefined) ?? 'home';
}

export function routeHref(route: RouteId): string {
  return `#/${route}`;
}

export function useHashRoute(): [RouteId, (route: RouteId) => void] {
  const [route, setRoute] = useState<RouteId>(() => resolveRoute(window.location.hash));

  useEffect(() => {
    const onChange = () => setRoute(resolveRoute(window.location.hash));
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
