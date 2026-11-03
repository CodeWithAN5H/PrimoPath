import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createDefaultState } from '../domain/schema';
import { clearState, loadState, saveState } from './storage';

const state = {
  ...createDefaultState('2026-10-01', '2026-10-21'),
  resources: { primogems: 1234, intertwinedFates: 5 },
  income: { dailyPrimogems: 90, welkinDaysRemaining: 7 },
  characterPlan: {
    ...createDefaultState('2026-10-01', '2026-10-21').characterPlan,
    targetName: 'Furina',
    pity: 33,
    guaranteed: true,
  },
};

async function writeRawRecord(payload: unknown): Promise<void> {
  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open('primopath');
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains('planner')) {
        request.result.createObjectStore('planner');
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction('planner', 'readwrite');
    tx.objectStore('planner').put(payload, 'current');
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

async function readRawRecord(): Promise<unknown> {
  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open('primopath');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  const record = await new Promise<unknown>((resolve, reject) => {
    const tx = db.transaction('planner', 'readonly');
    const request = tx.objectStore('planner').get('current');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  db.close();
  return record;
}

beforeEach(async () => {
  localStorage.clear();
  await clearState();
});

afterEach(() => {
  localStorage.clear();
});

describe('planner persistence', () => {
  it('reports an empty store on first run', async () => {
    await clearState();
    const result = await loadState();
    expect(result.status).toBe('empty');
  });

  it('round-trips every planner input', async () => {
    await saveState(state);
    const result = await loadState();
    expect(result.status).toBe('ok');
    if (result.status !== 'ok') return;
    expect(result.state.resources).toEqual({ primogems: 1234, intertwinedFates: 5 });
    expect(result.state.income).toEqual({ dailyPrimogems: 90, welkinDaysRemaining: 7 });
    expect(result.state.characterPlan).toMatchObject({
      targetName: 'Furina',
      pity: 33,
      guaranteed: true,
    });
    expect(result.savedAt).toBeTypeOf('number');
  });

  it('rejects an unreadable record without deleting the stored copy', async () => {
    await writeRawRecord({ savedAt: Date.now(), state: { version: 99, nope: true } });
    const result = await loadState();
    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toContain('could not be read');
    }
    const stillStored = (await readRawRecord()) as { state?: { version?: number } };
    expect(stillStored.state?.version).toBe(99);
  });

  it('rejects invalid field values from storage', async () => {
    await writeRawRecord({
      savedAt: Date.now(),
      state: { ...state, characterPlan: { ...state.characterPlan, pity: 900 } },
    });
    const result = await loadState();
    expect(result.status).toBe('error');
  });

  it('falls back to localStorage when IndexedDB is unavailable', async () => {
    const original = globalThis.indexedDB;
    Object.defineProperty(globalThis, 'indexedDB', {
      value: undefined,
      configurable: true,
      writable: true,
    });
    try {
      const saved = await saveState(state);
      expect(saved.backend).toBe('localstorage');
      const loaded = await loadState();
      expect(loaded.status).toBe('ok');
      if (loaded.status === 'ok') {
        expect(loaded.backend).toBe('localstorage');
        expect(loaded.state.characterPlan.pity).toBe(33);
      }
    } finally {
      Object.defineProperty(globalThis, 'indexedDB', {
        value: original,
        configurable: true,
        writable: true,
      });
    }
  });
});
