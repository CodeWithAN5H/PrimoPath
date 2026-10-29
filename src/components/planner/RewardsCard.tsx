import { ListChecks, Plus, Trash2 } from 'lucide-react';
import type { Confidence, OneTimeReward } from '../../domain/schema';
import { LIMITS } from '../../domain/schema';
import { CONFIDENCE_LABELS, formatNumber } from '../../lib/format';
import { createId } from '../../lib/id';
import { usePlanner } from '../../state/PlannerProvider';
import { Card, CardHeader } from '../ui/Card';
import { NumberField, SelectField, TextField } from '../ui/fields';

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
    <li className="rounded-xl border border-line-soft bg-void/40 p-3">
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
        <TextField
          id={`${base}-label`}
          label={`Reward ${index + 1}`}
          value={reward.label}
          onChange={(label) => onChange({ label })}
          placeholder="e.g. Archon Quest chapter 5"
          maxLength={LIMITS.rewardLabelLength}
        />
        <div className="flex items-start gap-2 sm:items-end">
          <div className="min-w-0 flex-1 sm:w-36 sm:flex-none">
            <SelectField
              id={`${base}-confidence`}
              label="Confidence"
              value={reward.confidence}
              onChange={(value) => onChange({ confidence: value as Confidence })}
              options={CONFIDENCE_OPTIONS}
            />
          </div>
          <button
            type="button"
            onClick={onRemove}
            className="btn-icon mt-6 flex size-10 shrink-0 items-center justify-center border border-transparent text-faint hover:border-ember/30 hover:bg-ember/10 hover:text-ember"
            aria-label={`Remove reward ${reward.label.trim() || index + 1}`}
          >
            <Trash2 size={15} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <NumberField
          id={`${base}-primogems`}
          label="Primogems"
          value={reward.primogems}
          onChange={(primogems) => onChange({ primogems })}
          min={LIMITS.oneTimePrimogems.min}
          max={LIMITS.oneTimePrimogems.max}
          suffix="Primogems"
        />
        <NumberField
          id={`${base}-fates`}
          label="Intertwined Fates"
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

export function RewardsCard() {
  const { state, dispatch } = usePlanner();

  const totals = state.oneTimeRewards.reduce(
    (accumulator, reward) => ({
      primogems: accumulator.primogems + reward.primogems,
      fates: accumulator.fates + reward.fates,
    }),
    { primogems: 0, fates: 0 },
  );

  return (
    <Card labelledBy="rewards-title">
      <CardHeader
        id="rewards-title"
        title="One-time and event rewards"
        description="Add rewards you expect before the deadline and rate how sure you are. Each reward is counted once."
        icon={<ListChecks size={16} />}
        action={
          <button
            type="button"
            className="btn !px-3 !py-2 text-xs"
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
            Add
          </button>
        }
      />

      {state.oneTimeRewards.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line bg-void/30 px-4 py-8 text-center">
          <p className="text-sm font-medium text-ink">Nothing listed yet</p>
          <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-faint">
            Without one-time rewards, every scenario projects the same income. Add an event, a quest
            chain or a redemption code you are confident about.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
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

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-line-soft pt-3 text-xs text-muted">
        <p>
          Listed total:{' '}
          <span className="num font-semibold text-ink">
            {formatNumber(totals.primogems)} Primogems
            {totals.fates > 0 ? ` + ${formatNumber(totals.fates)} Fates` : ''}
          </span>
        </p>
        <p className="text-faint">
          Conservative counts confirmed only · Expected adds likely and half of uncertain.
        </p>
      </div>
    </Card>
  );
}
