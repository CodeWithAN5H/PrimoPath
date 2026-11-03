import { useMemo, useState } from 'react';
import { ArrowRight, Plus, Sparkles } from 'lucide-react';
import { CustomOpportunityForm } from '../components/opportunities/CustomOpportunityForm';
import { OpportunityOverview } from '../components/opportunities/OpportunityOverview';
import { OpportunityRow } from '../components/opportunities/OpportunityRow';
import { Alert } from '../components/ui/Alert';
import { Badge } from '../components/ui/Badge';
import { Disclosure } from '../components/ui/Disclosure';
import {
  CATEGORY_LABELS,
  REWARD_CATEGORIES,
  type Opportunity,
  type RewardCategory,
} from '../domain/opportunity';
import { SCORE_WEIGHTS } from '../domain/rewardOptimizer';
import { formatClock } from '../lib/format';
import type { RouteId } from '../lib/useHashRoute';
import { useOpportunities } from '../state/OpportunityProvider';
import { usePlanner } from '../state/PlannerProvider';

type StatusFilter = 'all' | 'available' | 'completed' | 'other';

const STATUS_OPTIONS: readonly { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'available', label: 'Still available' },
  { value: 'completed', label: 'Completed' },
  { value: 'other', label: 'Expired or unavailable' },
];

export function OpportunitiesPage({ onNavigate }: { onNavigate: (route: RouteId) => void }) {
  const {
    state,
    summary,
    saveStatus,
    savedAt,
    storageError,
    loadNotice,
    dismissNotice,
  } = useOpportunities();
  const { view } = usePlanner();

  const [category, setCategory] = useState<RewardCategory | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [editing, setEditing] = useState<Opportunity | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const categories = useMemo(() => {
    const present = new Set(summary.evaluations.map((evaluation) => evaluation.opportunity.category));
    return REWARD_CATEGORIES.filter((value) => present.has(value));
  }, [summary.evaluations]);

  const filtered = useMemo(() => {
    return summary.evaluations
      .filter((evaluation) => category === 'all' || evaluation.opportunity.category === category)
      .filter((evaluation) => {
        if (statusFilter === 'all') return true;
        if (statusFilter === 'available') return evaluation.state === 'available';
        if (statusFilter === 'completed') return evaluation.state === 'completed';
        return ['expired', 'upcoming', 'unavailable', 'already-counted', 'duplicate'].includes(
          evaluation.state,
        );
      })
      .sort((a, b) => {
        if (a.state === 'available' && b.state !== 'available') return -1;
        if (b.state === 'available' && a.state !== 'available') return 1;
        return b.score - a.score || a.opportunity.name.localeCompare(b.opportunity.name, 'en');
      });
  }, [summary.evaluations, category, statusFilter]);

  const openForm = (opportunity: Opportunity | null) => {
    setEditing(opportunity);
    setFormOpen(true);
    window.requestAnimationFrame(() => {
      document.getElementById('custom-opportunity-form')?.scrollIntoView({ block: 'start' });
    });
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditing(null);
  };

  const recommendations = summary.recommendations.slice(0, 4);
  const expiringSoon = summary.evaluations.filter(
    (evaluation) =>
      evaluation.state === 'available' &&
      evaluation.opportunity.availableUntil !== undefined &&
      evaluation.opportunity.availableUntil >= view.today &&
      evaluation.opportunity.availableUntil <= addDaysSafe(view.today, 7),
  );

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="label">Opportunities</p>
          <h1 className="mt-1 font-display text-2xl leading-tight text-ink sm:text-3xl">
            Best use of your remaining time
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted">
            Ranked Primogem sources for {view.plan.targetName.trim() || 'your target'} before{' '}
            {view.plan.endDate}. Based only on rewards you have not finished.
          </p>
        </div>
        <div className="flex flex-col items-start gap-1.5 sm:items-end">
          <button type="button" onClick={() => openForm(null)} className="btn btn-primary">
            <Plus size={15} aria-hidden="true" />
            Add opportunity
          </button>
          <p className="text-[10px] text-faint" role="status" aria-live="polite">
            {saveStatus === 'saving'
              ? 'Saving…'
              : saveStatus === 'error'
                ? 'Progress not saved'
                : savedAt
                  ? `Progress saved ${formatClock(savedAt)}`
                  : 'Progress saved locally'}
            {state.custom.length > 0 ? ` · ${state.custom.length} custom` : ''}
          </p>
        </div>
      </header>

      {loadNotice ? (
        <Alert tone="warning" title="Saved progress could not be loaded" onDismiss={dismissNotice}>
          {loadNotice}
        </Alert>
      ) : null}

      {storageError ? (
        <Alert tone="error" title="Saving progress is failing">
          {storageError} Until this is fixed, progress lives only in this tab.
        </Alert>
      ) : null}

      {!view.canForecast ? (
        <Alert tone="info" title="Banner dates need attention">
          Opportunity totals are counted to your banner end date, so fix the dates in the Wish
          Planner before relying on the gap numbers.
        </Alert>
      ) : null}

      <OpportunityOverview />

      <section aria-labelledby="recommendations-title" className="panel panel-pad">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="flex size-8 items-center justify-center rounded-lg border border-line-soft bg-raised text-accent"
            >
              <Sparkles size={15} />
            </span>
            <div>
              <h2 id="recommendations-title" className="text-sm font-semibold text-ink">
                Recommended next
              </h2>
              <p className="mt-0.5 text-[11px] text-faint">
                Ranked by reward, reward per minute, urgency and confidence.
              </p>
            </div>
          </div>
          <Badge tone="accent">{recommendations.length} shown</Badge>
        </div>

        {expiringSoon.length > 0 ? (
          <p className="mt-3 rounded-xl border border-amber/30 bg-amber/[0.07] px-3 py-2 text-[11px] leading-relaxed text-amber/90">
            {expiringSoon.length} reward{expiringSoon.length === 1 ? '' : 's'} expire within 7 days.
            Handle those before the long-term grinds.
          </p>
        ) : null}

        {recommendations.length === 0 ? (
          <div className="mt-3 rounded-xl border border-dashed border-line bg-abyss/30 px-4 py-6 text-center">
            <p className="text-sm font-medium text-ink">Nothing left to recommend</p>
            <p className="mx-auto mt-1 max-w-md text-[11px] leading-relaxed text-faint">
              Everything currently available is completed, marked not applicable, or already counted
              by your planner income. Add an event or a reward estimate to widen the picture.
            </p>
            <button type="button" onClick={() => openForm(null)} className="btn mt-3 text-xs">
              <Plus size={13} aria-hidden="true" />
              Add an opportunity
            </button>
          </div>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {recommendations.map((evaluation) => (
              <li key={evaluation.opportunity.id}>
                <OpportunityRow
                  evaluation={evaluation}
                  onEdit={(opportunity) => openForm(opportunity)}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      {formOpen ? <CustomOpportunityForm editing={editing} onClose={closeForm} /> : null}

      <section aria-labelledby="all-opportunities-title" className="panel panel-pad">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="all-opportunities-title" className="text-sm font-semibold text-ink">
            All opportunities
          </h2>
          <p className="num text-[11px] text-faint">
            {filtered.length} of {summary.evaluations.length}
          </p>
        </div>

        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <label className="flex flex-1 flex-col gap-1 text-[11px] text-muted">
            Category
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value as RewardCategory | 'all')}
              className="field appearance-none bg-abyss/80"
            >
              <option value="all" className="bg-panel text-ink">
                All categories
              </option>
              {categories.map((value) => (
                <option key={value} value={value} className="bg-panel text-ink">
                  {CATEGORY_LABELS[value]}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-1 flex-col gap-1 text-[11px] text-muted">
            Status
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
              className="field appearance-none bg-abyss/80"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value} className="bg-panel text-ink">
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {filtered.length === 0 ? (
          <p className="mt-3 rounded-xl border border-dashed border-line bg-abyss/30 px-4 py-5 text-center text-[11px] leading-relaxed text-faint">
            No opportunities match these filters.
          </p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {filtered.map((evaluation) => (
              <li key={evaluation.opportunity.id}>
                <OpportunityRow
                  evaluation={evaluation}
                  onEdit={(opportunity) => openForm(opportunity)}
                />
              </li>
            ))}
          </ul>
        )}

        {state.custom.length === 0 ? (
          <p className="mt-3 text-[11px] leading-relaxed text-faint">
            Time-limited events, web events, redeem codes, quests and exploration totals are not
            bundled, because their rewards change too often to verify offline. Add them yourself and
            the optimizer will rank them alongside the sourced rewards.
          </p>
        ) : null}
      </section>

      <Disclosure
        id="ranking-method"
        title="How ranking works"
        subtitle="The exact factors, weights and exclusions behind every recommendation."
      >
        <ul className="space-y-1.5 text-[11px] leading-relaxed text-muted">
          <li>
            · Reward size ({Math.round(SCORE_WEIGHTS.reward * 100)}%) — Primogems still obtainable,
            normalised against 1,600.
          </li>
          <li>
            · Reward per minute ({Math.round(SCORE_WEIGHTS.effortEfficiency * 100)}%) — value divided
            by the estimated effort.
          </li>
          <li>
            · Urgency ({Math.round(SCORE_WEIGHTS.urgency * 100)}%) — only for rewards with an end
            date, rising inside 14 days.
          </li>
          <li>
            · Confidence ({Math.round(SCORE_WEIGHTS.confidence * 100)}%) — verified rewards rank above
            estimates and your own entries.
          </li>
        </ul>
        <p className="mt-3 text-[11px] leading-relaxed text-faint">
          Completed cycles, expired or not-yet-available rewards, items marked not applicable, and
          anything already counted by planner income (daily commissions or a matching one-time reward)
          are excluded entirely. Custom opportunities with a duplicate name are shown but never
          counted twice.
        </p>
        <button
          type="button"
          onClick={() => onNavigate('planner')}
          className="btn btn-ghost mt-3 text-xs"
        >
          Adjust the target in the Wish Planner
          <ArrowRight size={13} aria-hidden="true" />
        </button>
      </Disclosure>
    </div>
  );
}

function addDaysSafe(iso: string, days: number): string {
  const date = new Date(`${iso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}
