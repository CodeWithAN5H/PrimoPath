import { AlertTriangle, Info, CircleAlert, X } from 'lucide-react';
import type { ReactNode } from 'react';

export type AlertTone = 'info' | 'warning' | 'error';

const TONES: Record<AlertTone, { wrapper: string; icon: ReactNode }> = {
  info: {
    wrapper: 'border-accent/25 bg-accent/[0.07] text-muted',
    icon: <Info size={16} aria-hidden="true" className="text-accent" />,
  },
  warning: {
    wrapper: 'border-amber/30 bg-amber/[0.07] text-amber/90',
    icon: <AlertTriangle size={16} aria-hidden="true" className="text-amber" />,
  },
  error: {
    wrapper: 'border-ember/30 bg-ember/[0.07] text-ember/90',
    icon: <CircleAlert size={16} aria-hidden="true" className="text-ember" />,
  },
};

export function Alert({
  tone = 'info',
  title,
  children,
  onDismiss,
}: {
  tone?: AlertTone;
  title?: string;
  children: ReactNode;
  onDismiss?: () => void;
}) {
  const styles = TONES[tone];
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={`flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-sm leading-relaxed ${styles.wrapper}`}
    >
      <span className="mt-0.5 shrink-0">{styles.icon}</span>
      <div className="min-w-0 flex-1">
        {title ? <p className="text-[13px] font-semibold text-ink">{title}</p> : null}
        <div className={`text-xs leading-relaxed ${title ? 'mt-1' : ''}`}>{children}</div>
      </div>
      {onDismiss ? (
        <button type="button" onClick={onDismiss} className="btn-icon -mr-1 -mt-1" aria-label="Dismiss notice">
          <X size={14} aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}
