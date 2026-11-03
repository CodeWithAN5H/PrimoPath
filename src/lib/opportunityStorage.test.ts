import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createDefaultState } from '../domain/schema';
import {
  createDefaultOpportunityState,
  opportunitySchema,
  type OpportunityState,
} from '../domain/opportunity';
import {
  clearOpportunityState,
  loadOpportunityState,
  migrateOpportunityState,
  saveOpportunityState,
} from './opportunityStorage';
import { clearState, loadState, saveState } from './storage';

const customOpportunity = opportunitySchema.parse({
  id: 'custom-1',
  name: 'My event',
  category: 'event',
  reward: { primogems: 320, fates: 1 },
  effortMinutes: 45,
  recurrence: { kind: 'once' },
  verification: 'user-entered',
  isCustom: true,
});

const opportunityState: OpportunityState = {
  version: 1,
  custom: [customOpportunity],
  records: [
    { id: 'spiral-abyss-reset', status: 'todo', completedCycles: ['m:2026-10-16'], planned: true },
    { id: 'custom-1', status: 'in-progress', completedCycles: [], progressPercent: 40, planned: false },
  ],
};

const plannerState = {
  ...createDefaultState('2026-11-03', '2026-11-23'),
  resources: { primogems: 1234, intertwinedFates: 5 },
  characterPlan: {
    ...createDefaultState('2026-11-03', '2026-11-23').characterPlan,
    targetName: 'Furina',
    pity: 33,
  },
};

async function openRawStore(mode: IDBTransactionMode) {
  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open('primopath');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  return { db, store: db.transaction('opportunities', mode).objectStore('opportunities') };
}

async function writeRawOpportunity(payload: unknown): Promise<void> {
  const { db, store } = await openRawStore('readwrite');
  await new Promise<void>((resolve, reject) => {
    const request = store.put(payload, 'current');
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
  db.close();
}

async function readRawOpportunity(): Promise<unknown> {
  const { db, store } = await openRawStore('readonly');
  const record = await new Promise<unknown>((resolve, reject) => {
    const request = store.get('current');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  db.close();
  return record;
}

beforeEach(async () => {
  localStorage.clear();
  await clearState();
  await clearOpportunityState();
});

afterEach(() => {
  localStorage.clear();
});

describe('opportunity persistence', () => {
  it('reports an empty store on first run', async () => {
    const result = await loadOpportunityState();
    expect(result.status).toBe('empty');
  });

  it('round-trips records and custom opportunities', async () => {
    await saveOpportunityState(opportunityState);
    const result = await loadOpportunityState();
    expect(result.status).toBe('ok');
    if (result.status !== 'ok') return;
    expect(result.state.records).toHaveLength(2);
    expect(result.state.records[0]).toMatchObject({
      id: 'spiral-abyss-reset',
      completedCycles: ['m:2026-10-16'],
      planned: true,
    });
    expect(result.state.custom[0]?.name).toBe('My event');
    expect(result.savedAt).toBeTypeOf('number');
  });

  it('keeps planner data intact when opportunity progress is written', async () => {
    await saveState(plannerState);
    await saveOpportunityState(opportunityState);

    const planner = await loadState();
    expect(planner.status).toBe('ok');
    if (planner.status === 'ok') {
      expect(planner.state.resources).toEqual({ primogems: 1234, intertwinedFates: 5 });
      expect(planner.state.characterPlan.targetName).toBe('Furina');
    }

    const opportunities = await loadOpportunityState();
    expect(opportunities.status).toBe('ok');
  });

  it('never deletes an unreadable payload and keeps a backup copy', async () => {
    await writeRawOpportunity({ savedAt: Date.now(), state: { version: 99, records: [] } });
    const result = await loadOpportunityState();
    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toContain('could not be read');
    }
    expect(localStorage.getItem('primopath:opportunities-unreadable-backup')).toContain('"version":99');
    const stored = (await readRawOpportunity()) as { state?: { version?: number } };
    expect(stored.state?.version).toBe(99);
  });

  it('migrates a payload written before the version field existed', async () => {
    await writeRawOpportunity({
      savedAt: Date.now(),
      state: { records: [{ id: 'legacy' }], custom: [] },
    });
    const result = await loadOpportunityState();
    expect(result.status).toBe('ok');
    if (result.status !== 'ok') return;
    expect(result.state.version).toBe(1);
    expect(result.state.records[0]).toMatchObject({
      id: 'legacy',
      status: 'todo',
      completedCycles: [],
      planned: false,
    });
  });

  it('rejects an invalid record shape without losing the stored copy', async () => {
    await writeRawOpportunity({
      savedAt: Date.now(),
      state: { version: 1, records: [{ id: 'x', status: 'not-a-status' }], custom: [] },
    });
    const result = await loadOpportunityState();
    expect(result.status).toBe('error');
    expect(await readRawOpportunity()).toMatchObject({ state: { version: 1 } });
  });

  it('falls back to localStorage when IndexedDB is unavailable', async () => {
    const original = globalThis.indexedDB;
    Object.defineProperty(globalThis, 'indexedDB', {
      value: undefined,
      configurable: true,
      writable: true,
    });
    try {
      const saved = await saveOpportunityState(opportunityState);
      expect(saved.backend).toBe('localstorage');
      const loaded = await loadOpportunityState();
      expect(loaded.status).toBe('ok');
      if (loaded.status === 'ok') {
        expect(loaded.backend).toBe('localstorage');
        expect(loaded.state.records).toHaveLength(2);
      }
    } finally {
      Object.defineProperty(globalThis, 'indexedDB', {
        value: original,
        configurable: true,
        writable: true,
      });
    }
  });

  it('clears only opportunity progress', async () => {
    await saveState(plannerState);
    await saveOpportunityState(opportunityState);
    await clearOpportunityState();

    expect((await loadOpportunityState()).status).toBe('empty');
    const planner = await loadState();
    expect(planner.status).toBe('ok');
  });
});

describe('migrateOpportunityState', () => {
  it('adds a version and empty collections to legacy payloads', () => {
    expect(migrateOpportunityState({})).toEqual({ version: 1, records: [], custom: [] });
    expect(migrateOpportunityState({ records: [{ id: 'x' }] })).toEqual({
      version: 1,
      records: [{ id: 'x' }],
      custom: [],
    });
  });

  it('leaves current and unknown-version payloads for schema validation', () => {
    const current = { version: 1, records: [], custom: [] };
    expect(migrateOpportunityState(current)).toBe(current);
    expect(migrateOpportunityState({ version: 2 })).toEqual({ version: 2 });
    expect(migrateOpportunityState(null)).toBeNull();
  });

  it('starts from a clean default state', () => {
    expect(createDefaultOpportunityState()).toEqual({ version: 1, records: [], custom: [] });
  });
});
