import { describe, expect, it } from 'vitest';
import { createDefaultOpportunityState, type Opportunity } from '../domain/opportunity';
import { opportunitySchema } from '../domain/opportunity';
import { opportunityReducer } from './opportunityReducer';

const customOpportunity: Opportunity = opportunitySchema.parse({
  id: 'custom-1',
  name: 'My event',
  description: 'A user entry',
  category: 'event',
  reward: { primogems: 300, fates: 0 },
  effortMinutes: 30,
  recurrence: { kind: 'once' },
  verification: 'user-entered',
  isCustom: true,
});

const base = createDefaultOpportunityState();

describe('opportunityReducer completion', () => {
  it('marks a one-time opportunity done and undoes it', () => {
    const done = opportunityReducer(base, { type: 'setStatus', id: 'daily', status: 'done' });
    expect(done.records[0]).toMatchObject({ id: 'daily', status: 'done', completedCycles: ['once'] });

    const undone = opportunityReducer(done, { type: 'setStatus', id: 'daily', status: 'todo' });
    expect(undone.records[0]).toMatchObject({ status: 'todo', completedCycles: [] });
  });

  it('toggles repeatable cycles without marking the whole opportunity done', () => {
    const completed = opportunityReducer(base, {
      type: 'toggleCycle',
      id: 'abyss',
      cycleKey: 'm:2026-10-16',
    });
    expect(completed.records[0]).toMatchObject({
      status: 'todo',
      completedCycles: ['m:2026-10-16'],
    });

    const reopened = opportunityReducer(completed, {
      type: 'toggleCycle',
      id: 'abyss',
      cycleKey: 'm:2026-10-16',
    });
    expect(reopened.records[0]).toMatchObject({ completedCycles: [] });
  });

  it('marks status done when a one-time cycle is toggled', () => {
    const toggled = opportunityReducer(base, { type: 'toggleCycle', id: 'event', cycleKey: 'once' });
    expect(toggled.records[0]).toMatchObject({ status: 'done', completedCycles: ['once'] });

    const reopened = opportunityReducer(toggled, {
      type: 'toggleCycle',
      id: 'event',
      cycleKey: 'once',
    });
    expect(reopened.records[0]).toMatchObject({ status: 'todo', completedCycles: [] });
  });

  it('does not create duplicate records', () => {
    const first = opportunityReducer(base, { type: 'setStatus', id: 'x', status: 'done' });
    const second = opportunityReducer(first, { type: 'setStatus', id: 'x', status: 'in-progress' });
    expect(second.records).toHaveLength(1);
    expect(second.records[0]?.status).toBe('in-progress');
  });
});

describe('opportunityReducer progress values', () => {
  it('clamps and clears partial progress', () => {
    const set = opportunityReducer(base, {
      type: 'setProgressPercent',
      id: 'exploration',
      percent: 140,
    });
    expect(set.records[0]?.progressPercent).toBe(100);

    const cleared = opportunityReducer(set, {
      type: 'setProgressPercent',
      id: 'exploration',
      percent: null,
    });
    expect(cleared.records[0]?.progressPercent).toBeUndefined();
  });

  it('sets and clears a reward correction', () => {
    const set = opportunityReducer(base, {
      type: 'setRewardOverride',
      id: 'event',
      primogems: 450,
    });
    expect(set.records[0]?.rewardOverridePrimogems).toBe(450);

    const cleared = opportunityReducer(set, {
      type: 'setRewardOverride',
      id: 'event',
      primogems: null,
    });
    expect(cleared.records[0]?.rewardOverridePrimogems).toBeUndefined();
  });

  it('selects and deselects an opportunity for the plan', () => {
    const selected = opportunityReducer(base, { type: 'setPlanned', id: 'event', planned: true });
    expect(selected.records[0]?.planned).toBe(true);
    const deselected = opportunityReducer(selected, {
      type: 'setPlanned',
      id: 'event',
      planned: false,
    });
    expect(deselected.records[0]?.planned).toBe(false);
  });
});

describe('opportunityReducer custom entries', () => {
  it('adds a custom entry and forces the user-entry marking', () => {
    const added = opportunityReducer(base, {
      type: 'addCustom',
      opportunity: { ...customOpportunity, verification: 'estimated' } as Opportunity,
    });
    expect(added.custom).toHaveLength(1);
    expect(added.custom[0]).toMatchObject({
      id: 'custom-1',
      isCustom: true,
      verification: 'user-entered',
    });
  });

  it('ignores a duplicate custom id', () => {
    const added = opportunityReducer(base, { type: 'addCustom', opportunity: customOpportunity });
    const again = opportunityReducer(added, { type: 'addCustom', opportunity: customOpportunity });
    expect(again.custom).toHaveLength(1);
  });

  it('updates a custom entry without losing its identity or source marking', () => {
    const added = opportunityReducer(base, { type: 'addCustom', opportunity: customOpportunity });
    const updated = opportunityReducer(added, {
      type: 'updateCustom',
      id: 'custom-1',
      patch: { name: 'Renamed event', reward: { primogems: 900, fates: 0 } },
    });
    expect(updated.custom[0]).toMatchObject({
      id: 'custom-1',
      name: 'Renamed event',
      verification: 'user-entered',
      isCustom: true,
      reward: { primogems: 900, fates: 0 },
    });
  });

  it('removes a custom entry together with its progress record', () => {
    const added = opportunityReducer(base, { type: 'addCustom', opportunity: customOpportunity });
    const withProgress = opportunityReducer(added, {
      type: 'setPlanned',
      id: 'custom-1',
      planned: true,
    });
    const removed = opportunityReducer(withProgress, { type: 'removeCustom', id: 'custom-1' });
    expect(removed.custom).toHaveLength(0);
    expect(removed.records).toHaveLength(0);
  });
});

describe('opportunityReducer hydrate', () => {
  it('replaces state wholesale', () => {
    const hydrated = opportunityReducer(base, {
      type: 'hydrate',
      state: { ...base, records: [{ id: 'x', status: 'done', completedCycles: ['once'], planned: true }] },
    });
    expect(hydrated.records[0]?.id).toBe('x');
  });
});
