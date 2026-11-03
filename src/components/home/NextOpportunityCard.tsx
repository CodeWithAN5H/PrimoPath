import { ArrowRight, CircleDashed, Sparkles } from 'lucide-react';
import { Badge } from '../ui/Badge';

export function NextOpportunityCard({ onOpenOpportunities }: { onOpenOpportunities: () => void }) {
  return (
    <section
      aria-labelledby="next-opportunity-title"
      className="panel panel-pad lg:col-span-3"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="flex size-8 items-center justify-center rounded-lg border border-line-soft bg-raised text-accent"
          >
            <Sparkles size={15} />
          </span>
          <div>
            <h2 id="next-opportunity-title" className="text-sm font-semibold text-ink">
              Next opportunity
            </h2>
            <p className="mt-0.5 text-[11px] text-faint">
              Reward optimizer · planned for Milestone 2
            </p>
          </div>
        </div>
        <Badge tone="muted">Coming soon</Badge>
      </div>

      <div className="mt-3 flex flex-col gap-3 rounded-xl border border-dashed border-line bg-abyss/30 px-3.5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-2.5">
          <CircleDashed size={15} aria-hidden="true" className="mt-0.5 shrink-0 text-faint" />
          <div>
            <p className="text-xs font-medium text-ink">No reward data is loaded yet</p>
            <p className="mt-1 max-w-xl text-[11px] leading-relaxed text-faint">
              A ranked list of time-limited Primogem sources — with expiry, effort and prerequisites —
              is not implemented, so PrimoPath will not guess one. One-time rewards you added by hand
              in the planner still count toward every forecast above.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onOpenOpportunities}
          className="btn btn-ghost shrink-0 self-start text-xs sm:self-auto"
        >
          What is planned
          <ArrowRight size={13} aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}
