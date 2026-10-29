import { Compass, LayoutDashboard, Target } from 'lucide-react';
import type { ReactNode } from 'react';
import type { RouteId } from '../../lib/useHashRoute';
import { SaveStatusPill, StorageBadge } from '../ui/SaveStatus';

const NAV_ITEMS: readonly { id: RouteId; label: string; description: string; icon: ReactNode }[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    description: 'Budget and deadline',
    icon: <LayoutDashboard size={17} aria-hidden="true" />,
  },
  {
    id: 'planner',
    label: 'Wish Planner',
    description: 'Resources and target',
    icon: <Target size={17} aria-hidden="true" />,
  },
];

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span
        aria-hidden="true"
        className="relative flex size-9 items-center justify-center rounded-xl border border-gold/30 bg-gradient-to-br from-gold/25 to-violet/15 text-gold"
      >
        <Compass size={18} />
      </span>
      <span className="leading-tight">
        <span className="block font-display text-lg tracking-wide text-ink">PrimoPath</span>
        {!compact ? (
          <span className="block text-[11px] uppercase tracking-[0.18em] text-faint">
            Wish planning
          </span>
        ) : null}
      </span>
    </div>
  );
}

export function AppShell({
  route,
  onNavigate,
  children,
}: {
  route: RouteId;
  onNavigate: (route: RouteId) => void;
  children: ReactNode;
}) {
  return (
    <div className="min-h-dvh">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-panel focus:px-4 focus:py-2 focus:text-sm focus:text-ink"
      >
        Skip to content
      </a>

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[264px] flex-col border-r border-line-soft/80 bg-panel/45 px-5 py-6 backdrop-blur-md lg:flex">
        <Brand />
        <nav aria-label="Main" className="mt-8 flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const active = route === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                aria-current={active ? 'page' : undefined}
                className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                  active
                    ? 'bg-raised text-ink'
                    : 'text-muted hover:bg-raised/60 hover:text-ink'
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`absolute left-0 h-5 w-0.5 rounded-full bg-gold transition-opacity ${
                    active ? 'opacity-100' : 'opacity-0'
                  }`}
                />
                <span className={active ? 'text-gold' : 'text-faint group-hover:text-gold/80'}>
                  {item.icon}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium">{item.label}</span>
                  <span className="block text-[11px] text-faint">{item.description}</span>
                </span>
              </button>
            );
          })}
        </nav>

        <div className="mt-auto flex flex-col gap-3 border-t border-line-soft pt-4">
          <StorageBadge />
          <SaveStatusPill />
        </div>
      </aside>

      <div className="lg:pl-[264px]">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-line-soft/70 bg-abyss/85 px-4 py-3 backdrop-blur-md lg:hidden">
          <Brand compact />
          <SaveStatusPill compact />
        </header>

        <main
          id="main-content"
          className="mx-auto w-full max-w-6xl px-4 pb-28 pt-6 sm:px-6 lg:pb-14 lg:pt-10"
        >
          {children}
        </main>
      </div>

      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-line-soft/80 bg-panel/90 px-3 pt-1.5 backdrop-blur-md lg:hidden"
        style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
      >
        <ul className="mx-auto flex max-w-md items-stretch justify-around">
          {NAV_ITEMS.map((item) => {
            const active = route === item.id;
            return (
              <li key={item.id} className="flex-1">
                <button
                  type="button"
                  onClick={() => onNavigate(item.id)}
                  aria-current={active ? 'page' : undefined}
                  className={`flex w-full min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[11px] font-medium transition ${
                    active ? 'bg-raised text-gold' : 'text-faint hover:text-ink'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
