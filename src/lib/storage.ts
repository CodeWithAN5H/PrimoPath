import { plannerStateSchema, type PlannerState } from '../domain/schema';

/**
 * Local persistence.
 *
 * IndexedDB is the primary store (structured, larger quota, survives cache
 * clearing better than localStorage). When IndexedDB is unavailable — some
 * private modes, or a blocked origin — a localStorage mirror keeps the planner
 * usable. Nothing leaves the device in Milestone 1.
 */
const DB_NAME = 'primopath';
/** Version 2 adds the opportunity-progress store; planner data is untouched by the upgrade. */
const DB_VERSION = 2;
const STORE_NAME = 'planner';
export const OPPORTUNITY_STORE_NAME = 'opportunities';
const RECORD_KEY = 'current';
const MIRROR_KEY = 'primopath:state:v1';
const CORRUPT_BACKUP_KEY = 'primopath:unreadable-backup';

export type LoadResult =
  | { status: 'empty'; backend: StorageBackend }
  | { status: 'ok'; state: PlannerState; savedAt: number | null; backend: StorageBackend }
  | { status: 'error'; message: string; backend: StorageBackend };

export type StorageBackend = 'indexeddb' | 'localstorage' | 'none';

export interface SaveResult {
  backend: StorageBackend;
  savedAt: number;
}

interface StoredEnvelope {
  savedAt: number;
  state: unknown;
}

export function hasIndexedDb(): boolean {
  return typeof indexedDB !== 'undefined';
}

export function hasLocalStorage(): boolean {
  try {
    return typeof localStorage !== 'undefined';
  } catch {
    return false;
  }
}

export function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
      if (!db.objectStoreNames.contains(OPPORTUNITY_STORE_NAME)) {
        db.createObjectStore(OPPORTUNITY_STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB open failed'));
    request.onblocked = () => reject(new Error('IndexedDB open blocked'));
  });
}

async function readIndexedDb(): Promise<StoredEnvelope | null> {
  const db = await openDatabase();
  try {
    return await new Promise<StoredEnvelope | null>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const request = tx.objectStore(STORE_NAME).get(RECORD_KEY);
      request.onsuccess = () => resolve((request.result as StoredEnvelope | undefined) ?? null);
      request.onerror = () => reject(request.error ?? new Error('IndexedDB read failed'));
    });
  } finally {
    db.close();
  }
}

async function writeIndexedDb(envelope: StoredEnvelope): Promise<void> {
  const db = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(envelope, RECORD_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error('IndexedDB write failed'));
      tx.onabort = () => reject(tx.error ?? new Error('IndexedDB write aborted'));
    });
  } finally {
    db.close();
  }
}

function readMirror(): StoredEnvelope | null {
  if (!hasLocalStorage()) return null;
  const raw = localStorage.getItem(MIRROR_KEY);
  if (!raw) return null;
  const savedAt = Number(localStorage.getItem(`${MIRROR_KEY}:savedAt`)) || 0;
  return { savedAt, state: JSON.parse(raw) as unknown };
}

function backupUnreadable(raw: string): void {
  if (!hasLocalStorage()) return;
  try {
    localStorage.setItem(CORRUPT_BACKUP_KEY, raw);
  } catch {
    // A full quota must never break loading; the original record stays intact.
  }
}

function parseEnvelope(envelope: StoredEnvelope | null): LoadResult {
  if (!envelope) return { status: 'empty', backend: 'indexeddb' };
  const parsed = plannerStateSchema.safeParse(envelope.state);
  if (!parsed.success) {
    backupUnreadable(JSON.stringify(envelope.state));
    return {
      status: 'error',
      message:
        'Saved planner data could not be read, so PrimoPath started from a clean slate. The unreadable copy was kept locally and has not been deleted.',
      backend: 'indexeddb',
    };
  }
  return {
    status: 'ok',
    state: parsed.data,
    savedAt: envelope.savedAt || null,
    backend: 'indexeddb',
  };
}

export async function loadState(): Promise<LoadResult> {
  if (hasIndexedDb()) {
    try {
      return parseEnvelope(await readIndexedDb());
    } catch {
      // Fall through to the localStorage mirror.
    }
  }

  if (hasLocalStorage()) {
    try {
      const envelope = readMirror();
      if (!envelope) return { status: 'empty', backend: 'localstorage' };
      const result = parseEnvelope(envelope);
      return { ...result, backend: 'localstorage' };
    } catch {
      backupUnreadable(localStorage.getItem(MIRROR_KEY) ?? '');
      return {
        status: 'error',
        message:
          'Saved planner data could not be read, so PrimoPath started from a clean slate. The unreadable copy was kept locally.',
        backend: 'localstorage',
      };
    }
  }

  return { status: 'empty', backend: 'none' };
}

export async function saveState(state: PlannerState): Promise<SaveResult> {
  const envelope: StoredEnvelope = { savedAt: Date.now(), state };

  if (hasIndexedDb()) {
    try {
      await writeIndexedDb(envelope);
      return { backend: 'indexeddb', savedAt: envelope.savedAt };
    } catch {
      // Try the mirror below.
    }
  }

  if (hasLocalStorage()) {
    localStorage.setItem(MIRROR_KEY, JSON.stringify(state));
    localStorage.setItem(`${MIRROR_KEY}:savedAt`, String(envelope.savedAt));
    return { backend: 'localstorage', savedAt: envelope.savedAt };
  }

  throw new Error('No local storage backend is available in this browser.');
}

export async function clearState(): Promise<void> {
  if (hasIndexedDb()) {
    try {
      const db = await openDatabase();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).delete(RECORD_KEY);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error ?? new Error('IndexedDB delete failed'));
      });
      db.close();
    } catch {
      // Clearing the mirror below still satisfies the request.
    }
  }
  if (hasLocalStorage()) {
    localStorage.removeItem(MIRROR_KEY);
    localStorage.removeItem(`${MIRROR_KEY}:savedAt`);
    localStorage.removeItem(CORRUPT_BACKUP_KEY);
  }
}
