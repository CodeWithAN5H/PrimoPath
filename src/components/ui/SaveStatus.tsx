import { CloudOff, CircleCheck, Loader2, CircleAlert, HardDrive } from 'lucide-react';
import { formatClock } from '../../lib/format';
import { usePlanner } from '../../state/PlannerProvider';

const BACKEND_LABEL: Record<string, string> = {
  indexeddb: 'Stored in IndexedDB on this device.',
  localstorage: 'Stored in this browser (localStorage fallback).',
  none: 'This browser is not allowing local storage.',
};

export function SaveStatusPill({ compact = false }: { compact?: boolean }) {
  const { saveStatus, savedAt, backend } = usePlanner();

  const state =
    saveStatus === 'loading'
      ? {
          label: 'Reading saved plan…',
          icon: <Loader2 size={13} className="animate-spin" aria-hidden="true" />,
          tone: 'border-line text-muted',
        }
      : saveStatus === 'saving'
        ? {
            label: 'Saving…',
            icon: <Loader2 size={13} className="animate-spin" aria-hidden="true" />,
            tone: 'border-line text-muted',
          }
        : saveStatus === 'saved'
          ? {
              label: savedAt ? `Saved ${formatClock(savedAt)}` : 'Saved locally',
              icon: <CircleCheck size={13} aria-hidden="true" />,
              tone: 'border-mint/25 bg-mint/[0.08] text-mint',
            }
          : {
              label: 'Not saved',
              icon: <CircleAlert size={13} aria-hidden="true" />,
              tone: 'border-ember/30 bg-ember/[0.08] text-ember',
            };

  return (
    <span
      role="status"
      aria-live="polite"
      title={backend === 'none' ? BACKEND_LABEL.none : BACKEND_LABEL[backend]}
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${state.tone}`}
    >
      {state.icon}
      {compact && saveStatus === 'saved' ? 'Saved' : state.label}
    </span>
  );
}

export function StorageBadge() {
  const { backend } = usePlanner();
  const isNone = backend === 'none';
  return (
    <p className="flex items-start gap-2 text-[11px] leading-relaxed text-faint">
      {isNone ? (
        <CloudOff size={13} className="mt-0.5 shrink-0" aria-hidden="true" />
      ) : (
        <HardDrive size={13} className="mt-0.5 shrink-0" aria-hidden="true" />
      )}
      <span>
        {isNone
          ? 'Local storage is unavailable, so this plan will not survive a reload.'
          : 'Local-first: your plan stays in this browser and is never uploaded.'}
      </span>
    </p>
  );
}
