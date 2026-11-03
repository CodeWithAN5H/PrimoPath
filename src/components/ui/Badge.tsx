import type { ReactNode } from 'react';

export type BadgeTone =
  | 'accent'
  | 'violet'
  | 'azure'
  | 'mint'
  | 'amber'
  | 'ember'
  | 'gold'
  | 'muted';

const TONES: Record<BadgeTone, string> = {
  accent: 'border-accent/30 bg-accent/10 text-accent',
  violet: 'border-accent/30 bg-accent/10 text-accent',
  azure: 'border-azure/30 bg-azure/10 text-azure',
  mint: 'border-mint/30 bg-mint/10 text-mint',
  amber: 'border-amber/30 bg-amber/10 text-amber',
  ember: 'border-ember/30 bg-ember/10 text-ember',
  gold: 'border-gold/30 bg-gold/10 text-gold',
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
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-medium tracking-wide ${TONES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
