import type { ReactNode } from 'react';

export type BadgeTone = 'gold' | 'violet' | 'mint' | 'amber' | 'ember' | 'muted';

const TONES: Record<BadgeTone, string> = {
  gold: 'border-gold/30 bg-gold/10 text-gold',
  violet: 'border-violet/30 bg-violet/10 text-violet',
  mint: 'border-mint/30 bg-mint/10 text-mint',
  amber: 'border-amber/30 bg-amber/10 text-amber',
  ember: 'border-ember/30 bg-ember/10 text-ember',
  muted: 'border-line bg-raised/70 text-muted',
};

export function Badge({
  tone = 'muted',
  children,
  className = '',
}: {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium tracking-wide ${TONES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
