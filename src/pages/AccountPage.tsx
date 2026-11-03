import { HardDrive, ShieldCheck } from 'lucide-react';
import { Card, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { usePlanner } from '../state/PlannerProvider';
import { formatClock } from '../lib/format';
import type { RouteId } from '../lib/useHashRoute';

const BACKEND_COPY: Record<string, string> = {
  indexeddb: 'IndexedDB on this device',
  localstorage: 'this browser’s localStorage fallback',
  none: 'no local storage (changes stay in this tab)',
};

export function AccountPage({ onNavigate }: { onNavigate: (route: RouteId) => void }) {
  const { backend, saveStatus, savedAt, loadNotice } = usePlanner();

  return (
    <div className="flex flex-col gap-5">
      <header>
        <p className="label">Account</p>
        <h1 className="mt-1.5 font-display text-2xl leading-tight sm:text-3xl">No account, by design</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
          PrimoPath works without signing in. Your plan is stored on this device and is never sent to
          a server, so there is no profile to manage in this milestone.
        </p>
      </header>

      <Card labelledBy="local-first-title">
        <CardHeader
          id="local-first-title"
          title="Your plan right now"
          description="Where the data lives, and how fresh it is."
          icon={<HardDrive size={16} />}
          action={<Badge tone="muted">Local only</Badge>}
        />

        <dl className="divide-y divide-line-soft/70">
          <div className="flex items-center justify-between gap-3 py-2.5">
            <dt className="text-xs text-muted">Storage</dt>
            <dd className="text-right text-xs font-medium text-ink">{BACKEND_COPY[backend] ?? backend}</dd>
          </div>
          <div className="flex items-center justify-between gap-3 py-2.5">
            <dt className="text-xs text-muted">Last save</dt>
            <dd className="num text-right text-xs font-medium text-ink">
              {saveStatus === 'error'
                ? 'Not saved'
                : savedAt
                  ? formatClock(savedAt)
                  : 'Nothing saved yet'}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3 py-2.5">
            <dt className="text-xs text-muted">Sync or cloud backup</dt>
            <dd className="text-right text-xs font-medium text-faint">Not implemented</dd>
          </div>
        </dl>

        {loadNotice ? (
          <p className="mt-3 rounded-lg border border-amber/25 bg-amber/8 px-3 py-2 text-[11px] leading-relaxed text-amber/90">
            {loadNotice}
          </p>
        ) : null}

        <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-faint">
          <ShieldCheck size={14} aria-hidden="true" className="mt-0.5 shrink-0 text-mint" />
          PrimoPath never asks for HoYoverse credentials, cookies or session tokens, and does not
          connect to your game account.
        </p>

        <button type="button" onClick={() => onNavigate('planner')} className="btn mt-4">
          Back to the Wish Planner
        </button>
      </Card>

      <Card labelledBy="account-later-title">
        <CardHeader
          id="account-later-title"
          title="If accounts are added later"
          description="Optional sign-in and cloud sync belong to a later milestone. They are not being prototyped here."
          icon={<ShieldCheck size={16} />}
          action={<Badge tone="violet">Planned</Badge>}
        />
        <ul className="space-y-2 text-xs leading-relaxed text-muted">
          <li>· Sign-in would be optional; the local planner would keep working without it.</li>
          <li>· Sync would move your saved plan, never game-account credentials.</li>
          <li>· Nothing on this page is a working login form.</li>
        </ul>
      </Card>
    </div>
  );
}
