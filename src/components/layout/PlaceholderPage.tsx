import { ArrowRight, CircleDashed, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';

/**
 * Honest empty state for a section that exists in navigation but is not built.
 * It describes the intended scope without inventing data or offering dead buttons.
 */
export function PlaceholderPage({
  icon: Icon,
  eyebrow,
  title,
  description,
  milestone,
  planned,
  footnote,
  onOpenPlanner,
}: {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  description: string;
  milestone: string;
  planned: readonly string[];
  footnote: ReactNode;
  onOpenPlanner: () => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      <header>
        <p className="label">{eyebrow}</p>
        <h1 className="mt-1.5 font-display text-2xl leading-tight sm:text-3xl">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">{description}</p>
      </header>

      <Card labelledBy="placeholder-title">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span
              aria-hidden="true"
              className="flex size-10 items-center justify-center rounded-xl border border-line-soft bg-raised text-accent"
            >
              <Icon size={18} />
            </span>
            <div>
              <h2 id="placeholder-title" className="text-base font-semibold text-ink">
                Not available in this milestone
              </h2>
              <p className="mt-1 text-sm text-muted">Nothing on this page is simulated or estimated.</p>
            </div>
          </div>
          <Badge tone="violet">{milestone}</Badge>
        </div>

        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {planned.map((line) => (
            <li key={line} className="flex gap-2 text-xs leading-relaxed text-muted">
              <CircleDashed size={14} aria-hidden="true" className="mt-0.5 shrink-0 text-faint" />
              {line}
            </li>
          ))}
        </ul>

        <p className="mt-4 rounded-xl border border-line-soft bg-abyss/40 px-3.5 py-3 text-xs leading-relaxed text-faint">
          {footnote}
        </p>

        <button type="button" onClick={onOpenPlanner} className="btn btn-primary mt-4">
          Open the Wish Planner
          <ArrowRight size={15} aria-hidden="true" />
        </button>
      </Card>
    </div>
  );
}
