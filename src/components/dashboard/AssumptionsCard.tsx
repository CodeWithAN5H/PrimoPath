import { Info, ScrollText } from 'lucide-react';
import { MECHANICS } from '../../domain/mechanics';
import { Card, CardHeader } from '../ui/Card';
import { usePlanner } from '../../state/PlannerProvider';

export function AssumptionsCard() {
  const { view } = usePlanner();

  return (
    <Card labelledBy="assumptions-title" className="lg:col-span-3">
      <CardHeader
        id="assumptions-title"
        title="Assumptions behind these numbers"
        description="Everything below is calculated from what you entered. Nothing is fetched from the game."
        icon={<ScrollText size={16} />}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <ol className="space-y-2">
          {view.assumptions.map((line, index) => (
            <li key={line} className="flex gap-2.5 text-xs leading-relaxed text-muted">
              <span
                aria-hidden="true"
                className="num flex size-5 shrink-0 items-center justify-center rounded-full border border-line-soft bg-void/60 text-[10px] text-faint"
              >
                {index + 1}
              </span>
              {line}
            </li>
          ))}
        </ol>

        <div className="rounded-xl border border-line-soft bg-void/40 px-4 py-3">
          <p className="flex items-center gap-2 text-xs font-semibold text-ink">
            <Info size={14} aria-hidden="true" className="text-violet" />
            Mechanics configuration
          </p>
          <dl className="mt-2 space-y-1.5 text-[11px] leading-relaxed text-faint">
            <div className="flex justify-between gap-3">
              <dt>Config version</dt>
              <dd className="num text-muted">v{MECHANICS.version}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt>Verified on</dt>
              <dd className="num text-muted">{MECHANICS.verifiedOn}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt>Character hard pity</dt>
              <dd className="num text-muted">{MECHANICS.character.hardPity}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt>Weapon hard pity</dt>
              <dd className="num text-muted">{MECHANICS.weapon.hardPity}</dd>
            </div>
          </dl>
          <p className="mt-2 border-t border-line-soft pt-2 text-[11px] leading-relaxed text-faint">
            Source: {MECHANICS.sources.join('; ')}.
          </p>
          <p className="mt-2 text-[11px] leading-relaxed text-faint">
            Not yet modelled: soft-pity odds, Capturing Radiance, and joint character + weapon
            probability. Those arrive with the probability engine, which will read this same
            versioned config.
          </p>
        </div>
      </div>
    </Card>
  );
}
