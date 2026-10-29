import { Coins, Wallet } from 'lucide-react';
import { LIMITS } from '../../domain/schema';
import { MECHANICS } from '../../domain/mechanics';
import { wishBudget } from '../../domain/wishes';
import { formatNumber } from '../../lib/format';
import { usePlanner } from '../../state/PlannerProvider';
import { Badge } from '../ui/Badge';
import { Card, CardHeader } from '../ui/Card';
import { NumberField } from '../ui/fields';

export function ResourcesCard() {
  const { state, dispatch } = usePlanner();
  const budget = wishBudget(state.resources.primogems, state.resources.intertwinedFates);

  return (
    <Card labelledBy="resources-title">
      <CardHeader
        id="resources-title"
        title="What you have now"
        description="Only Intertwined Fates and Primogems can be spent on the banners you are planning."
        icon={<Wallet size={16} />}
        action={<Badge tone="gold">160 / wish</Badge>}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <NumberField
          id="resources-primogems"
          label="Primogems"
          value={state.resources.primogems}
          onChange={(value) => dispatch({ type: 'setResources', patch: { primogems: value } })}
          min={LIMITS.primogems.min}
          max={LIMITS.primogems.max}
          suffix="Primogems"
          hint={`Up to ${formatNumber(LIMITS.primogems.max)} supported.`}
        />
        <NumberField
          id="resources-fates"
          label="Intertwined Fates"
          value={state.resources.intertwinedFates}
          onChange={(value) =>
            dispatch({ type: 'setResources', patch: { intertwinedFates: value } })
          }
          min={LIMITS.fateCount.min}
          max={LIMITS.fateCount.max}
          suffix="Fates"
          hint="Acquaint Fates do not apply and are not counted."
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line-soft bg-void/40 px-3.5 py-3">
        <p className="flex items-center gap-2 text-xs text-muted">
          <Coins size={14} aria-hidden="true" className="text-gold" />
          {formatNumber(state.resources.intertwinedFates)} fates +{' '}
          {formatNumber(state.resources.primogems)} ÷ {MECHANICS.primogemsPerWish}
        </p>
        <p className="num text-sm font-semibold text-ink">
          {formatNumber(budget.wishes)} wishes
          <span className="ml-2 text-xs font-normal text-faint">
            {formatNumber(budget.leftoverPrimogems)} left over
          </span>
        </p>
      </div>
    </Card>
  );
}
