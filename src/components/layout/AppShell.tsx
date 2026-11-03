import {
  CircleUserRound,
  Compass,
  Dices,
  House,
  Sparkles,
  Target,
  type LucideIcon,
} from 'lucide-react';
import type { ReactNode } from 'react';
import type { RouteId } from '../../lib/useHashRoute';
import { SaveStatusPill, StorageBadge } from '../ui/SaveStatus';

interface NavItem {
  id: RouteId;
  label: string;
  /** Short label for the five-column mobile bar. */
  shortLabel: string;
  icon: LucideIcon;
  /** Sections that only exist as honest placeholders in this milestone. */
  planned?: boolean;
}

export const NAV_ITEMS: readonly NavItem[] = [
  { id: 'home', label: 'Home', shortLabel: 'Home', icon: House },
  { id: 'planner', label: 'Wish Planner', shortLabel: 'Planner', icon: Target },
  {
    id: 'opportunities',
    label: 'Opportunities',
    shortLabel: 'Opportunities',
    icon: Sparkles,
    planned: true,
  },
  { id: 'simulator', label: 'Wish Simulator', shortLabel: 'Simulator', icon: Dices, planned: true },
  { id: 'account', label: 'Account', shortLabel: 'Account', icon: CircleUserRound, planned: true },
];

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        aria-hidden="true"
        className="relative flex size-9 items-center justify-center rounded-xl border border-accent/30 bg-gradient-to-br from-accent/25 via-accent/10 to-azure/10 text-accent-soft"
      >
        <Compass size={18} />
      </span>
      <span className="leading-tight">
        <span className="block font-display text-lg tracking-wide text-ink">PrimoPath</span>
        {!compact ? (
          <span className="block text-[10px] uppercase tracking-[0.18em] text-faint">
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

      {/* Desktop sidebar: compact, icon + label, one active accent bar. */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[236px] flex-col border-r border-line-soft/80 bg-panel/40 px-4 py-5 lg:flex">
        <Brand />
        <nav aria-label="Main" className="mt-7 flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const active = route === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                aria-current={active ? 'page' : undefined}
                className={`group relative flex min-h-11 items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors ${
                  active ? 'bg-raised text-ink' : 'text-muted hover:bg-raised/50 hover:text-ink'
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`absolute left-0 h-5 w-0.5 rounded-full bg-accent transition-opacity ${
                    active ? 'opacity-100' : 'opacity-0'
                  }`}
                />
                <span className={active ? 'text-accent' : 'text-faint group-hover:text-accent/80'}>
                  <Icon size={17} aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1 text-sm font-medium">{item.label}</span>
                {item.planned ? (
                  <span className="rounded-full border border-line-soft px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-faint">
                    Soon
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>

        <div className="mt-auto flex flex-col gap-3 border-t border-line-soft pt-4">
          <SaveStatusPill />
          <StorageBadge />
        </div>
      </aside>

      <div className="lg:pl-[236px]">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-line-soft/70 bg-base/85 px-4 py-2.5 backdrop-blur-md lg:hidden">
          <Brand compact />
          <SaveStatusPill compact />
        </header>

        <main
          id="main-content"
          className="mx-auto w-full max-w-6xl px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-5 sm:px-6 lg:pb-16 lg:pt-10"
        >
          {children}
        </main>
      </div>

      {/* Mobile bottom navigation: five destinations, thumb-sized targets. */}
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-line-soft/80 bg-panel/95 backdrop-blur-md lg:hidden"
        style={{ paddingBottom: 'max(0.35rem, env(safe-area-inset-bottom))' }}
      >
        <ul className="mx-auto flex max-w-lg items-stretch justify-around px-1">
          {NAV_ITEMS.map((item) => {
            const active = route === item.id;
            const Icon = item.icon;
            return (
              <li key={item.id} className="flex-1">
                <button
                  type="button"
                  onClick={() => onNavigate(item.id)}
                  aria-current={active ? 'page' : undefined}
                  aria-label={item.label}
                  className={`relative flex min-h-14 w-full flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 transition-colors ${
                    active ? 'text-accent' : 'text-faint hover:text-ink'
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`absolute inset-x-3 top-0 h-0.5 rounded-full bg-accent transition-opacity ${
                      active ? 'opacity-100' : 'opacity-0'
                    }`}
                  />
                  <Icon size={19} aria-hidden="true" />
                  <span className="text-[10px] font-medium leading-none">{item.shortLabel}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
