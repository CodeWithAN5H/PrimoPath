import { Coins, Sparkles, Wallet } from 'lucide-react';
import { MECHANICS } from '../../domain/mechanics';
import { formatNumber } from '../../lib/format';
import { useAnimatedNumber } from '../../lib/useAnimatedNumber';
import { usePlanner } from '../../state/PlannerProvider';

function Resource({
  icon,
  label,
  value,
  unit,
  accent = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  unit: string;
  accent?: boolean;
}) {
  const animated = useAnimatedNumber(value);
  return (
    <div
      className={`rounded-xl border px-3 py-2.5 ${
        accent ? 'border-accent/30 bg-accent/[0.07]' : 'border-line-soft bg-abyss/40'
      }`}
    >
      <dt className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-faint">
        <span aria-hidden="true" className={accent ? 'text-accent' : 'text-faint'}>
          {icon}
        </span>
        {label}
      </dt>
      <dd className="mt-1">
        <span className={`num text-lg font-semibold ${accent ? 'text-accent-soft' : 'text-ink'}`}>
          {formatNumber(animated)}
        </span>
        <span className="ml-1 text-[11px] text-faint">{unit}</span>
      </dd>
    </div>
  );
}

export function ResourceOverviewCard() {
  const { state, view } = usePlanner();

  return (
    <section aria-labelledby="resources-overview-title" className="panel panel-pad">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="flex size-8 items-center justify-center rounded-lg border border-line-soft bg-raised text-accent"
          >
            <Wallet size={15} />
          </span>
          <h2 id="resources-overview-title" className="text-sm font-semibold text-ink">
            Resources
          </h2>
        </div>
        <span className="chip">{MECHANICS.primogemsPerWish} / wish</span>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-2">
        <Resource
          icon={<Sparkles size={12} />}
          label="Primogems"
          value={state.resources.primogems}
          unit="Primogems"
        />
        <Resource
          icon={<Sparkles size={12} />}
          label="Intertwined Fates"
          value={state.resources.intertwinedFates}
          unit="Fates"
        />
        <Resource
          icon={<Coins size={12} />}
          label="Total wishes"
          value={view.budget.wishes}
          unit="wishes"
          accent
        />
        <Resource
          icon={<Coins size={12} />}
          label="Leftover"
          value={view.budget.leftoverPrimogems}
          unit="Primogems"
        />
      </dl>

      <p className="mt-3 text-[11px] leading-relaxed text-faint">
        Wishes = Intertwined Fates + whole Primogems ÷ {MECHANICS.primogemsPerWish}. Acquaint Fates
        cannot be spent on these banners and are not counted.
      </p>
    </section>
  );
}
