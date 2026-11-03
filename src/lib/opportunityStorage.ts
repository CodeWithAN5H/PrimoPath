import {
  OPPORTUNITY_STATE_VERSION,
  opportunityStateSchema,
  type OpportunityState,
} from '../domain/opportunity';
import {
  OPPORTUNITY_STORE_NAME,
  hasIndexedDb,
  hasLocalStorage,
  openDatabase,
  type StorageBackend,
} from './storage';

/**
 * Progress persistence, separate from the wish planner.
 *
 * Catalogue definitions are never stored; only the user's progress records and
 * custom opportunities are. That is what lets the catalogue change without
 * resetting completion state: records are keyed by opportunity id and are read
 * back independently of whatever definitions the current app version ships.
 */
const RECORD_KEY = 'current';
const MIRROR_KEY = 'primopath:opportunities:v1';
const CORRUPT_BACKUP_KEY = 'primopath:opportunities-unreadable-backup';

interface StoredEnvelope {
  savedAt: number;
  state: unknown;
}

export type OpportunityLoadResult =
  | { status: 'empty'; backend: StorageBackend }
  | { status: 'ok'; state: OpportunityState; savedAt: number | null; backend: StorageBackend }
  | { status: 'error'; message: string; backend: StorageBackend };

export interface OpportunitySaveResult {
  backend: StorageBackend;
  savedAt: number;
}

/** Accepts the current shape and versions that predate the explicit `version` field. */
export function migrateOpportunityState(raw: unknown): unknown {
  if (typeof raw !== 'object' || raw === null) return raw;
  const record = raw as Record<string, unknown>;
  if (record.version === undefined) {
    return {
      version: OPPORTUNITY_STATE_VERSION,
      records: record.records ?? [],
      custom: record.custom ?? [],
    };
  }
  return raw;
}

function backupUnreadable(raw: string): void {
  if (!hasLocalStorage()) return;
  try {
    localStorage.setItem(CORRUPT_BACKUP_KEY, raw);
  } catch {
    // Never break loading because the backup could not be written.
  }
}

function parseEnvelope(envelope: StoredEnvelope | null, backend: StorageBackend): OpportunityLoadResult {
  if (!envelope) return { status: 'empty', backend };
  const parsed = opportunityStateSchema.safeParse(migrateOpportunityState(envelope.state));
  if (!parsed.success) {
    backupUnreadable(JSON.stringify(envelope.state));
    return {
      status: 'error',
      message:
        'Saved opportunity progress could not be read, so this section started empty. The unreadable copy was kept locally and has not been deleted.',
      backend,
    };
  }
  return {
    status: 'ok',
    state: parsed.data,
    savedAt: envelope.savedAt || null,
    backend,
  };
}

async function readIndexedDb(): Promise<StoredEnvelope | null> {
  const db = await openDatabase();
  try {
    return await new Promise<StoredEnvelope | null>((resolve, reject) => {
      const tx = db.transaction(OPPORTUNITY_STORE_NAME, 'readonly');
      const request = tx.objectStore(OPPORTUNITY_STORE_NAME).get(RECORD_KEY);
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
      const tx = db.transaction(OPPORTUNITY_STORE_NAME, 'readwrite');
      tx.objectStore(OPPORTUNITY_STORE_NAME).put(envelope, RECORD_KEY);
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

export async function loadOpportunityState(): Promise<OpportunityLoadResult> {
  if (hasIndexedDb()) {
    try {
      return parseEnvelope(await readIndexedDb(), 'indexeddb');
    } catch {
      // Fall through to the localStorage mirror.
    }
  }

  if (hasLocalStorage()) {
    try {
      const envelope = readMirror();
      if (!envelope) return { status: 'empty', backend: 'localstorage' };
      return parseEnvelope(envelope, 'localstorage');
    } catch {
      backupUnreadable(localStorage.getItem(MIRROR_KEY) ?? '');
      return {
        status: 'error',
        message:
          'Saved opportunity progress could not be read, so this section started empty. The unreadable copy was kept locally.',
        backend: 'localstorage',
      };
    }
  }

  return { status: 'empty', backend: 'none' };
}

export async function saveOpportunityState(state: OpportunityState): Promise<OpportunitySaveResult> {
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

export async function clearOpportunityState(): Promise<void> {
  if (hasIndexedDb()) {
    try {
      const db = await openDatabase();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(OPPORTUNITY_STORE_NAME, 'readwrite');
        tx.objectStore(OPPORTUNITY_STORE_NAME).delete(RECORD_KEY);
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
