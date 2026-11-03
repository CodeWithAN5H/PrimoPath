import { useEffect, useId, useState } from 'react';
import {
  Check,
  ChevronDown,
  CircleSlash,
  Clock,
  ExternalLink,
  Pencil,
  Trash2,
} from 'lucide-react';
import { daysUntilExpiry, type Opportunity } from '../../domain/opportunity';
import type { OpportunityEvaluation } from '../../domain/rewardOptimizer';
import { formatDisplayDate } from '../../domain/dates';
import { useOpportunities } from '../../state/OpportunityProvider';
import { usePlanner } from '../../state/PlannerProvider';
import { Badge } from '../ui/Badge';
import { SegmentedControl } from '../ui/SegmentedControl';
import {
  availabilityLabel,
  effortLabel,
  priorityLabel,
  recurrenceLabel,
  rewardLabel,
} from './format';

const STATUS_OPTIONS = [
  { value: 'todo', label: 'Not started' },
  { value: 'in-progress', label: 'In progress' },
  { value: 'done', label: 'Done' },
  { value: 'unavailable', label: 'N/A' },
] as const;

function verificationTone(verification: Opportunity['verification']) {
  return verification === 'verified' ? 'mint' : verification === 'estimated' ? 'amber' : 'azure';
}

export function OpportunityRow({
  evaluation,
  onEdit,
  defaultOpen = false,
}: {
  evaluation: OpportunityEvaluation;
  onEdit?: (opportunity: Opportunity) => void;
  defaultOpen?: boolean;
}) {
  const { dispatch } = useOpportunities();
  const { today } = usePlanner();
  const { opportunity, progress, state } = evaluation;
  const [open, setOpen] = useState(defaultOpen);
  const detailsId = `${useId().replace(/[^a-zA-Z0-9-]/g, '')}-details`;
  const expiryDays = daysUntilExpiry(opportunity, today);

  const [overrideText, setOverrideText] = useState(
    String(progress.rewardOverridePrimogems ?? opportunity.reward.primogems),
  );
  useEffect(() => {
    setOverrideText(String(progress.rewardOverridePrimogems ?? opportunity.reward.primogems));
  }, [progress.rewardOverridePrimogems, opportunity.reward.primogems]);

  const isRepeatable = opportunity.recurrence.kind !== 'once';
  const completedNow = progress.status === 'done' || evaluation.completedCurrentCycle;
  const canComplete = state === 'available';

  const quickToggle = () => {
    if (isRepeatable) {
      dispatch({ type: 'toggleCycle', id: opportunity.id, cycleKey: evaluation.currentCycleKey });
      return;
    }
    dispatch({
      type: 'setStatus',
      id: opportunity.id,
      status: progress.status === 'done' ? 'todo' : 'done',
    });
  };

  const dimmed = state !== 'available';

  return (
    <article
      className={`rounded-xl border transition-colors ${
        dimmed ? 'border-line-soft/70 bg-abyss/25' : 'border-line-soft bg-abyss/40'
      }`}
    >
      <div className="flex items-start gap-2 p-3">
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          aria-expanded={open}
          aria-controls={detailsId}
          className="flex min-w-0 flex-1 items-start gap-2.5 text-left"
        >
          <span
            aria-hidden="true"
            className={`mt-1.5 size-2 shrink-0 rounded-full ${
              state === 'available'
                ? evaluation.priority === 'high'
                  ? 'bg-accent'
                  : evaluation.priority === 'medium'
                    ? 'bg-azure'
                    : 'bg-faint'
                : state === 'completed'
                  ? 'bg-mint'
                  : 'bg-line'
            }`}
          />
          <span className="min-w-0 flex-1">
            <span className="flex flex-wrap items-center gap-1.5">
              <span className="truncate text-sm font-medium text-ink">{opportunity.name}</span>
              {opportunity.isCustom ? <Badge tone="azure">Custom</Badge> : null}
              <Badge tone={verificationTone(opportunity.verification)}>
                {opportunity.verification === 'verified'
                  ? 'Verified'
                  : opportunity.verification === 'estimated'
                    ? 'Estimated'
                    : 'Your entry'}
              </Badge>
              {state === 'completed' ? <Badge tone="mint">Completed</Badge> : null}
              {state === 'expired' ? <Badge tone="ember">Expired</Badge> : null}
              {state === 'already-counted' ? <Badge tone="muted">Already counted</Badge> : null}
              {state === 'unavailable' ? <Badge tone="muted">Not applicable</Badge> : null}
            </span>

            <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-faint">
              <span>
                {rewardLabel(
                  opportunity,
                  state === 'available' ? evaluation.remainingPrimogems : undefined,
                  state === 'available' ? (evaluation.rewardMaxPrimogems ?? undefined) : undefined,
                )}
              </span>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1">
                <Clock size={10} aria-hidden="true" />
                {effortLabel(evaluation.effortMinutes)}
              </span>
              {opportunity.availableUntil ? (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{availabilityLabel(opportunity, expiryDays)}</span>
                </>
              ) : null}
              {evaluation.occurrences > 1 ? (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{evaluation.occurrences} occurrences left</span>
                </>
              ) : null}
            </span>

            {state === 'available' && evaluation.reasons.length > 0 ? (
              <span className="mt-1 block text-[11px] leading-relaxed text-muted">
                {evaluation.reasons[0]}
              </span>
            ) : null}
            {state !== 'available' && evaluation.stateNote ? (
              <span className="mt-1 block text-[11px] leading-relaxed text-faint">
                {evaluation.stateNote}
              </span>
            ) : null}
          </span>

          <span className="flex shrink-0 items-center gap-1.5 pl-1">
            <ChevronDown
              size={15}
              aria-hidden="true"
              className={`text-faint transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
            />
          </span>
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 px-3 pb-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {state === 'available' || (isRepeatable && completedNow) ? (
            <button
              type="button"
              onClick={quickToggle}
              disabled={!canComplete && !completedNow}
              className={`btn !min-h-9 !px-2.5 !py-1.5 text-[11px] ${completedNow ? '' : 'btn-primary'}`}
            >
              <Check size={12} aria-hidden="true" />
              {isRepeatable
                ? completedNow
                  ? 'Undo this reset'
                  : 'Mark this reset done'
                : completedNow
                  ? 'Undo completion'
                  : 'Mark done'}
            </button>
          ) : null}
          {state === 'completed' && !isRepeatable ? (
            <button
              type="button"
              onClick={quickToggle}
              className="btn !min-h-9 !px-2.5 !py-1.5 text-[11px]"
            >
              Undo
            </button>
          ) : null}
          {state === 'available' ? (
            <span className="text-[10px] font-medium text-faint">{priorityLabel(evaluation.priority)}</span>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          className="text-[11px] font-medium text-accent hover:underline"
          aria-expanded={open}
          aria-controls={detailsId}
        >
          {open ? 'Hide details' : 'Details'}
        </button>
      </div>

      {open ? (
        <div id={detailsId} className="border-t border-line-soft px-3 py-3">
          {opportunity.description ? (
            <p className="text-[11px] leading-relaxed text-muted">{opportunity.description}</p>
          ) : (
            <p className="text-[11px] leading-relaxed text-faint">No description was provided.</p>
          )}

          <dl className="mt-2.5 grid gap-x-4 gap-y-1.5 text-[11px] sm:grid-cols-2">
            <div className="flex justify-between gap-2">
              <dt className="text-faint">Reward</dt>
              <dd className="text-right font-medium text-ink">{rewardLabel(opportunity)}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-faint">Effort (estimated)</dt>
              <dd className="num text-right font-medium text-ink">{effortLabel(opportunity.effortMinutes)}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-faint">Recurrence</dt>
              <dd className="text-right text-ink">{recurrenceLabel(opportunity)}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-faint">Availability</dt>
              <dd className="text-right text-ink">{availabilityLabel(opportunity, expiryDays)}</dd>
            </div>
            {opportunity.prerequisites.length > 0 ? (
              <div className="sm:col-span-2">
                <dt className="text-faint">Prerequisites</dt>
                <dd className="mt-0.5 text-ink">{opportunity.prerequisites.join(' · ')}</dd>
              </div>
            ) : null}
            <div className="sm:col-span-2">
              <dt className="text-faint">Source</dt>
              <dd className="mt-0.5">
                {opportunity.isCustom ? (
                  <span className="text-muted">
                    Your own entry — no external verification.
                  </span>
                ) : (
                  <span className="flex flex-wrap items-center gap-1.5">
                    {opportunity.sourceUrl ? (
                      <a
                        href={opportunity.sourceUrl}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="inline-flex items-center gap-1 text-accent hover:underline"
                      >
                        {opportunity.sourceLabel ?? 'Open source'}
                        <ExternalLink size={10} aria-hidden="true" />
                      </a>
                    ) : (
                      <span className="text-muted">{opportunity.sourceLabel ?? 'No source'}</span>
                    )}
                    {opportunity.corroboratingSourceUrl ? (
                      <>
                        <span className="text-faint" aria-hidden="true">
                          ·
                        </span>
                        <a
                          href={opportunity.corroboratingSourceUrl}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="inline-flex items-center gap-1 text-accent hover:underline"
                        >
                          {opportunity.corroboratingSourceLabel ?? 'Corroborating source'}
                          <ExternalLink size={10} aria-hidden="true" />
                        </a>
                      </>
                    ) : null}
                    {opportunity.verifiedOn ? (
                      <span className="text-faint">· checked {formatDisplayDate(opportunity.verifiedOn)}</span>
                    ) : null}
                  </span>
                )}
              </dd>
            </div>
          </dl>

          {evaluation.reasons.length > 1 ? (
            <ul className="mt-2.5 space-y-1 border-t border-line-soft pt-2.5">
              {evaluation.reasons.slice(1).map((reason) => (
                <li key={reason} className="text-[11px] leading-relaxed text-muted">
                  · {reason}
                </li>
              ))}
            </ul>
          ) : null}

          <div className="mt-3 rounded-xl border border-line-soft bg-panel/50 p-3">
            <p className="label">Your progress</p>

            <div className="mt-2">
              <SegmentedControl
                label={`Progress status for ${opportunity.name}`}
                value={progress.status}
                options={STATUS_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
                onChange={(status) =>
                  dispatch({ type: 'setStatus', id: opportunity.id, status })
                }
              />
            </div>

            {isRepeatable ? (
              <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
                <p className="text-[11px] text-faint">
                  This reset ({opportunity.recurrence.kind === 'daily'
                    ? 'today'
                    : `${formatDisplayDate(evaluation.currentCycleKey.slice(2))}`})
                </p>
                <button
                  type="button"
                  onClick={quickToggle}
                  className="btn !min-h-9 !px-2.5 !py-1.5 text-[11px]"
                >
                  {evaluation.completedCurrentCycle ? 'Undo this reset' : 'Mark this reset done'}
                </button>
              </div>
            ) : null}

            {opportunity.tracking === 'progress' ? (
              <label className="mt-3 block text-[11px] text-muted">
                Estimated progress — {progress.progressPercent ?? 0}%
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={progress.progressPercent ?? 0}
                  onChange={(event) =>
                    dispatch({
                      type: 'setProgressPercent',
                      id: opportunity.id,
                      percent: Number(event.target.value),
                    })
                  }
                  className="mt-1 w-full accent-[var(--color-accent)]"
                />
                <span className="mt-1 block text-[10px] leading-relaxed text-faint">
                  Partial progress is subtracted from the reward and counted as estimated.
                </span>
              </label>
            ) : null}

            <div className="mt-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
              <label className="flex flex-col gap-1 text-[11px] text-muted">
                Reward correction (Primogems)
                <input
                  type="number"
                  min={0}
                  max={200000}
                  inputMode="numeric"
                  value={overrideText}
                  onChange={(event) => setOverrideText(event.target.value)}
                  className="field num !min-h-10"
                />
              </label>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  className="btn !min-h-10 !px-2.5 text-[11px]"
                  onClick={() => {
                    const parsed = Number.parseInt(overrideText, 10);
                    dispatch({
                      type: 'setRewardOverride',
                      id: opportunity.id,
                      primogems: Number.isFinite(parsed) && parsed >= 0 ? parsed : null,
                    });
                  }}
                >
                  Apply
                </button>
                <button
                  type="button"
                  className="btn !min-h-10 !px-2.5 text-[11px]"
                  onClick={() => dispatch({ type: 'setRewardOverride', id: opportunity.id, primogems: null })}
                >
                  Reset
                </button>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <label className="flex items-center gap-2 text-[11px] text-muted">
                <input
                  type="checkbox"
                  checked={progress.planned}
                  onChange={(event) =>
                    dispatch({ type: 'setPlanned', id: opportunity.id, planned: event.target.checked })
                  }
                  className="size-4 accent-[var(--color-accent)]"
                />
                Include in my opportunity plan
              </label>

              {opportunity.isCustom && onEdit ? (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onEdit(opportunity)}
                    className="btn !min-h-9 !px-2.5 !py-1.5 text-[11px]"
                  >
                    <Pencil size={11} aria-hidden="true" />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Remove “${opportunity.name}” and its progress?`)) {
                        dispatch({ type: 'removeCustom', id: opportunity.id });
                      }
                    }}
                    className="btn !min-h-9 !px-2.5 !py-1.5 text-[11px] hover:border-ember/40 hover:text-ember"
                  >
                    <Trash2 size={11} aria-hidden="true" />
                    Delete
                  </button>
                </div>
              ) : null}
            </div>

            {state === 'already-counted' ? (
              <p className="mt-2 flex items-start gap-1.5 text-[10px] leading-relaxed text-faint">
                <CircleSlash size={11} aria-hidden="true" className="mt-0.5 shrink-0" />
                {evaluation.stateNote}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </article>
  );
}
