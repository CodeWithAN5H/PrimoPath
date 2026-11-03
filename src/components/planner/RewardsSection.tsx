import { Plus, Trash2 } from 'lucide-react';
import { NumberField, SelectField, TextField } from '../ui/fields';
import type { Confidence, OneTimeReward } from '../../domain/schema';
import { LIMITS } from '../../domain/schema';
import { CONFIDENCE_LABELS, formatNumber } from '../../lib/format';
import { createId } from '../../lib/id';
import { usePlanner } from '../../state/PlannerProvider';

const CONFIDENCE_OPTIONS = (['confirmed', 'likely', 'uncertain'] as const).map((value) => ({
  value,
  label: CONFIDENCE_LABELS[value],
}));

function RewardRow({
  reward,
  index,
  onChange,
  onRemove,
}: {
  reward: OneTimeReward;
  index: number;
  onChange: (patch: Partial<Omit<OneTimeReward, 'id'>>) => void;
  onRemove: () => void;
}) {
  const base = `reward-${reward.id}`;

  return (
    <li className="rounded-xl border border-line-soft bg-abyss/40 p-3">
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,10rem)_auto] sm:items-end">
        <TextField
          id={`${base}-label`}
          label={`Reward ${index + 1}`}
          value={reward.label}
          onChange={(label) => onChange({ label })}
          placeholder="e.g. Archon Quest chapter 5"
          maxLength={LIMITS.rewardLabelLength}
        />
        <SelectField
          id={`${base}-confidence`}
          label="Confidence"
          value={reward.confidence}
          onChange={(value) => onChange({ confidence: value as Confidence })}
          options={CONFIDENCE_OPTIONS}
        />
        <button
          type="button"
          onClick={onRemove}
          className="btn-icon mb-0.5 border border-transparent text-faint hover:border-ember/30 hover:bg-ember/10 hover:text-ember"
          aria-label={`Remove reward ${reward.label.trim() || index + 1}`}
        >
          <Trash2 size={15} aria-hidden="true" />
        </button>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <NumberField
          id={`${base}-primogems`}
          label="Primogems"
          srSuffix="Primogems"
          value={reward.primogems}
          onChange={(primogems) => onChange({ primogems })}
          min={LIMITS.oneTimePrimogems.min}
          max={LIMITS.oneTimePrimogems.max}
          suffix="Primogems"
        />
        <NumberField
          id={`${base}-fates`}
          label="Intertwined Fates"
          srSuffix="Intertwined Fates"
          value={reward.fates}
          onChange={(fates) => onChange({ fates })}
          min={LIMITS.oneTimeFates.min}
          max={LIMITS.oneTimeFates.max}
          suffix="Fates"
        />
      </div>
    </li>
  );
}

/** One-time reward entries rendered inside planner section D. */
export function RewardsFields() {
  const { state, dispatch } = usePlanner();

  const totals = state.oneTimeRewards.reduce(
    (accumulator, reward) => ({
      primogems: accumulator.primogems + reward.primogems,
      fates: accumulator.fates + reward.fates,
    }),
    { primogems: 0, fates: 0 },
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] leading-relaxed text-faint">
          Rate each entry so conservative and optimistic forecasts stay honest.
        </p>
        <button
          type="button"
          className="btn shrink-0 text-xs"
          onClick={() =>
            dispatch({
              type: 'addReward',
              reward: {
                id: createId(),
                label: 'Event reward',
                primogems: 0,
                fates: 0,
                confidence: 'likely',
              },
            })
          }
        >
          <Plus size={14} aria-hidden="true" />
          Add reward
        </button>
      </div>

      {state.oneTimeRewards.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line bg-abyss/30 px-4 py-6 text-center">
          <p className="text-sm font-medium text-ink">Nothing listed yet</p>
          <p className="mx-auto mt-1 max-w-sm text-[11px] leading-relaxed text-faint">
            Without one-time rewards every scenario projects the same income. Add something you are
            confident about.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {state.oneTimeRewards.map((reward, index) => (
            <RewardRow
              key={reward.id}
              reward={reward}
              index={index}
              onChange={(patch) => dispatch({ type: 'updateReward', id: reward.id, patch })}
              onRemove={() => dispatch({ type: 'removeReward', id: reward.id })}
            />
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line-soft pt-3 text-[11px] text-muted">
        <p>
          Listed total:{' '}
          <span className="num font-semibold text-ink">
            {formatNumber(totals.primogems)} Primogems
            {totals.fates > 0 ? ` + ${formatNumber(totals.fates)} Fates` : ''}
          </span>
        </p>
        <p className="text-faint">Conservative counts confirmed only.</p>
      </div>
    </div>
  );
}
