import { useMemo, useState } from 'react';
import {
  CUSTOM_CATEGORIES,
  CATEGORY_LABELS,
  opportunitySchema,
  type Opportunity,
  type RewardCategory,
} from '../../domain/opportunity';
import { createId } from '../../lib/id';
import { useOpportunities } from '../../state/OpportunityProvider';
import { usePlanner } from '../../state/PlannerProvider';

interface FormState {
  name: string;
  category: RewardCategory;
  primogems: string;
  fates: string;
  effortMinutes: string;
  expiry: string;
  description: string;
  prerequisites: string;
  trackProgress: boolean;
}

const EMPTY_FORM: FormState = {
  name: '',
  category: 'event',
  primogems: '',
  fates: '0',
  effortMinutes: '30',
  expiry: '',
  description: '',
  prerequisites: '',
  trackProgress: false,
};

function stateFromOpportunity(opportunity: Opportunity): FormState {
  return {
    name: opportunity.name,
    category: opportunity.category,
    primogems: String(opportunity.reward.primogems),
    fates: String(opportunity.reward.fates),
    effortMinutes: String(opportunity.effortMinutes),
    expiry: opportunity.availableUntil ?? '',
    description: opportunity.description,
    prerequisites: opportunity.prerequisites.join(', '),
    trackProgress: opportunity.tracking === 'progress',
  };
}

function parseIntField(value: string, fallback: number): number {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function CustomOpportunityForm({
  editing,
  onClose,
}: {
  editing: Opportunity | null;
  onClose: () => void;
}) {
  const { dispatch, summary } = useOpportunities();
  const { today } = usePlanner();
  const [form, setForm] = useState<FormState>(() =>
    editing ? stateFromOpportunity(editing) : EMPTY_FORM,
  );
  const [errors, setErrors] = useState<string[]>([]);
  const [savedName, setSavedName] = useState<string | null>(null);

  // Reset the form when the parent switches between add and edit.
  const [editingId, setEditingId] = useState<string | null>(editing?.id ?? null);
  if ((editing?.id ?? null) !== editingId) {
    setEditingId(editing?.id ?? null);
    setForm(editing ? stateFromOpportunity(editing) : EMPTY_FORM);
    setErrors([]);
  }

  const duplicateNames = useMemo(() => {
    return new Set(
      summary.evaluations
        .filter((evaluation) => evaluation.opportunity.id !== editing?.id)
        .map((evaluation) => evaluation.opportunity.name.trim().toLowerCase()),
    );
  }, [summary.evaluations, editing?.id]);

  const update = (patch: Partial<FormState>) => setForm((current) => ({ ...current, ...patch }));

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const candidate = {
      id: editing?.id ?? createId('custom'),
      name: form.name.trim(),
      description: form.description.trim(),
      category: form.category,
      reward: {
        primogems: parseIntField(form.primogems, 0),
        fates: parseIntField(form.fates, 0),
      },
      effortMinutes: parseIntField(form.effortMinutes, 30),
      recurrence: { kind: 'once' as const },
      ...(form.expiry ? { availableUntil: form.expiry } : {}),
      prerequisites: form.prerequisites
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean),
      tracking: form.trackProgress ? ('progress' as const) : ('completion' as const),
      verification: 'user-entered' as const,
      isCustom: true,
    };

    if (duplicateNames.has(form.name.trim().toLowerCase())) {
      setErrors(['An opportunity with this name already exists, so it would be counted twice.']);
      return;
    }

    const parsed = opportunitySchema.safeParse(candidate);
    if (!parsed.success) {
      setErrors(
        parsed.error.issues.map((issue) =>
          issue.path.length > 0 ? `${issue.path.join('.')}: ${issue.message}` : issue.message,
        ),
      );
      return;
    }

    if (editing) {
      const { id: _id, isCustom: _isCustom, verification: _verification, ...patch } = parsed.data;
      dispatch({ type: 'updateCustom', id: editing.id, patch });
      setSavedName(parsed.data.name);
    } else {
      dispatch({ type: 'addCustom', opportunity: parsed.data });
      setSavedName(parsed.data.name);
    }

    setErrors([]);
    setForm(EMPTY_FORM);
    setEditingId(null);
    onClose();
  };

  return (
    <section id="custom-opportunity-form" aria-labelledby="custom-opportunity-title" className="panel panel-pad">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 id="custom-opportunity-title" className="text-sm font-semibold text-ink">
            {editing ? 'Edit custom opportunity' : 'Add a custom opportunity'}
          </h2>
          <p className="mt-1 text-[11px] leading-relaxed text-faint">
            For events, codes, quests or exploration totals PrimoPath cannot verify. Enter the reward
            you actually expect; it is labelled as your own entry everywhere.
          </p>
        </div>
        {editing ? (
          <button type="button" onClick={onClose} className="btn btn-ghost !min-h-9 !px-2 text-[11px]">
            Cancel
          </button>
        ) : null}
      </div>

      <form onSubmit={submit} className="mt-3 flex flex-col gap-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-[11px] text-muted">
            Name
            <input
              type="text"
              required
              maxLength={80}
              value={form.name}
              onChange={(event) => update({ name: event.target.value })}
              placeholder="e.g. Lantern Rite web event"
              className="field"
            />
          </label>
          <label className="flex flex-col gap-1 text-[11px] text-muted">
            Category
            <select
              value={form.category}
              onChange={(event) => update({ category: event.target.value as RewardCategory })}
              className="field appearance-none bg-abyss/80"
            >
              {CUSTOM_CATEGORIES.map((category) => (
                <option key={category} value={category} className="bg-panel text-ink">
                  {CATEGORY_LABELS[category]}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <label className="flex flex-col gap-1 text-[11px] text-muted">
            Primogems
            <input
              type="number"
              min={0}
              max={200000}
              inputMode="numeric"
              required
              value={form.primogems}
              onChange={(event) => update({ primogems: event.target.value })}
              placeholder="0"
              className="field num"
            />
          </label>
          <label className="flex flex-col gap-1 text-[11px] text-muted">
            Intertwined Fates
            <input
              type="number"
              min={0}
              max={100}
              inputMode="numeric"
              value={form.fates}
              onChange={(event) => update({ fates: event.target.value })}
              className="field num"
            />
          </label>
          <label className="flex flex-col gap-1 text-[11px] text-muted">
            Effort (minutes)
            <input
              type="number"
              min={1}
              max={10000}
              inputMode="numeric"
              value={form.effortMinutes}
              onChange={(event) => update({ effortMinutes: event.target.value })}
              className="field num"
            />
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-[11px] text-muted">
            Expires (optional)
            <input
              type="date"
              min={today}
              value={form.expiry}
              onChange={(event) => update({ expiry: event.target.value })}
              className="field num"
            />
          </label>
          <label className="flex flex-col gap-1 text-[11px] text-muted">
            Prerequisites (comma separated)
            <input
              type="text"
              maxLength={300}
              value={form.prerequisites}
              onChange={(event) => update({ prerequisites: event.target.value })}
              placeholder="e.g. Adventure Rank 20, Archon Quest 3"
              className="field"
            />
          </label>
        </div>

        <label className="flex flex-col gap-1 text-[11px] text-muted">
          Notes
          <textarea
            maxLength={400}
            rows={2}
            value={form.description}
            onChange={(event) => update({ description: event.target.value })}
            placeholder="What it involves, or why you estimate this amount"
            className="field resize-y"
          />
        </label>

        <label className="flex items-center gap-2 text-[11px] text-muted">
          <input
            type="checkbox"
            checked={form.trackProgress}
            onChange={(event) => update({ trackProgress: event.target.checked })}
            className="size-4 accent-[var(--color-accent)]"
          />
          Track partial progress (exploration, quest chains)
        </label>

        {errors.length > 0 ? (
          <ul role="alert" className="rounded-lg border border-ember/30 bg-ember/[0.07] px-3 py-2 text-[11px] leading-relaxed text-ember">
            {errors.slice(0, 4).map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        ) : null}

        {savedName ? (
          <p role="status" className="text-[11px] text-mint">
            Saved “{savedName}”.
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
          <button type="submit" className="btn btn-primary">
            {editing ? 'Save changes' : 'Add opportunity'}
          </button>
          <p className="text-[10px] text-faint">Saved locally with your progress.</p>
        </div>
      </form>
    </section>
  );
}
