import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { addDays, todayIsoDate } from '../domain/dates';
import { buildPlannerView, type PlannerView } from '../domain/plannerView';
import { createDefaultState, type PlannerState } from '../domain/schema';
import type { ScenarioId } from '../domain/forecast';
import { loadState, saveState, type StorageBackend } from '../lib/storage';
import { plannerReducer, type PlannerAction } from './plannerReducer';

export type SaveStatus = 'loading' | 'saving' | 'saved' | 'error';

interface PlannerContextValue {
  state: PlannerState;
  dispatch: (action: PlannerAction) => void;
  view: PlannerView;
  today: string;
  activeScenario: ScenarioId;
  setActiveScenario: (scenario: ScenarioId) => void;
  saveStatus: SaveStatus;
  savedAt: number | null;
  backend: StorageBackend;
  storageError: string | null;
  loadNotice: string | null;
  dismissNotice: () => void;
}

const PlannerContext = createContext<PlannerContextValue | null>(null);

export function PlannerProvider({ children }: { children: ReactNode }) {
  const today = useMemo(() => todayIsoDate(), []);
  const defaultState = useMemo(
    () => createDefaultState(today, addDays(today, 20)),
    [today],
  );

  const [state, dispatch] = useReducer(plannerReducer, defaultState);
  const [hydrated, setHydrated] = useState(false);
  const [activeScenario, setActiveScenario] = useState<ScenarioId>('expected');
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('loading');
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [backend, setBackend] = useState<StorageBackend>('none');
  const [storageError, setStorageError] = useState<string | null>(null);
  const [loadNotice, setLoadNotice] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadState()
      .then((result) => {
        if (cancelled) return;
        if (result.status === 'ok') {
          dispatch({ type: 'hydrate', state: result.state });
          setSavedAt(result.savedAt);
          setSaveStatus('saved');
        } else if (result.status === 'error') {
          setLoadNotice(result.message);
          setSaveStatus('saved');
        } else {
          setSaveStatus('saved');
        }
        setBackend(result.backend);
        setHydrated(true);
      })
      .catch(() => {
        if (cancelled) return;
        setLoadNotice('Saved data could not be read this time. Starting from a clean planner.');
        setSaveStatus('error');
        setHydrated(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    setSaveStatus('saving');
    const timer = window.setTimeout(() => {
      saveState(state)
        .then((result) => {
          setSaveStatus('saved');
          setSavedAt(result.savedAt);
          setBackend(result.backend);
          setStorageError(null);
        })
        .catch((error: unknown) => {
          setSaveStatus('error');
          setStorageError(
            error instanceof Error
              ? error.message
              : 'This browser refused to save your planner locally.',
          );
        });
    }, 400);
    return () => window.clearTimeout(timer);
  }, [state, hydrated]);

  const latest = useRef({ state, hydrated });
  latest.current = { state, hydrated };

  useEffect(() => {
    const flush = () => {
      if (!latest.current.hydrated) return;
      void saveState(latest.current.state).catch(() => {
        // Closing the tab is not a moment to surface errors.
      });
    };
    window.addEventListener('pagehide', flush);
    return () => window.removeEventListener('pagehide', flush);
  }, []);

  const view = useMemo(
    () => buildPlannerView(state, today, activeScenario),
    [state, today, activeScenario],
  );

  const dismissNotice = useCallback(() => setLoadNotice(null), []);

  const value = useMemo<PlannerContextValue>(
    () => ({
      state,
      dispatch,
      view,
      today,
      activeScenario,
      setActiveScenario,
      saveStatus,
      savedAt,
      backend,
      storageError,
      loadNotice,
      dismissNotice,
    }),
    [
      state,
      view,
      today,
      activeScenario,
      saveStatus,
      savedAt,
      backend,
      storageError,
      loadNotice,
      dismissNotice,
    ],
  );

  return <PlannerContext.Provider value={value}>{children}</PlannerContext.Provider>;
}

export function usePlanner(): PlannerContextValue {
  const context = useContext(PlannerContext);
  if (!context) throw new Error('usePlanner must be used inside PlannerProvider');
  return context;
}
