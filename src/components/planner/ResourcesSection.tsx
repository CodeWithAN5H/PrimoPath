import { Disclosure } from '../ui/Disclosure';
import { NumberField } from '../ui/fields';
import { MECHANICS } from '../../domain/mechanics';
import { LIMITS } from '../../domain/schema';
import { formatNumber } from '../../lib/format';
import { usePlanner } from '../../state/PlannerProvider';

export function ResourcesSection() {
  const { state, dispatch, view } = usePlanner();

  return (
    <Disclosure
      id="planner-resources"
      title="B · Current resources"
      subtitle="What you can spend on this banner today."
      defaultOpen
      summary={
        <span className="num text-[11px] font-medium text-muted">
          {formatNumber(view.budget.wishes)} wishes
        </span>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <NumberField
            id="resources-primogems"
            label="Primogems"
            srSuffix="Primogems"
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
            srSuffix="Intertwined Fates"
            value={state.resources.intertwinedFates}
            onChange={(value) =>
              dispatch({ type: 'setResources', patch: { intertwinedFates: value } })
            }
            min={LIMITS.fateCount.min}
            max={LIMITS.fateCount.max}
            suffix="Fates"
            hint="Acquaint Fates are not counted."
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line-soft bg-abyss/40 px-3.5 py-2.5">
          <p className="text-[11px] text-muted">
            {formatNumber(state.resources.intertwinedFates)} Fates +{' '}
            {formatNumber(state.resources.primogems)} ÷ {MECHANICS.primogemsPerWish}
          </p>
          <p className="num text-sm font-semibold text-ink">
            {formatNumber(view.budget.wishes)} wishes
            <span className="ml-2 text-[11px] font-normal text-faint">
              {formatNumber(view.budget.leftoverPrimogems)} left over
            </span>
          </p>
        </div>
      </div>
    </Disclosure>
  );
}
