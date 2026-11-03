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
import {
  createDefaultOpportunityState,
  type OpportunityState,
} from '../domain/opportunity';
import { buildOpportunitySummary, type OpportunitySummary } from '../domain/rewardOptimizer';
import { REWARD_CATALOGUE } from '../data/rewardCatalogue';
import {
  loadOpportunityState,
  saveOpportunityState,
  type OpportunitySaveResult,
} from '../lib/opportunityStorage';
import type { StorageBackend } from '../lib/storage';
import { opportunityReducer, type OpportunityAction } from './opportunityReducer';
import { usePlanner } from './PlannerProvider';

export type OpportunitySaveStatus = 'loading' | 'saving' | 'saved' | 'error';

interface OpportunityContextValue {
  state: OpportunityState;
  dispatch: (action: OpportunityAction) => void;
  summary: OpportunitySummary;
  saveStatus: OpportunitySaveStatus;
  savedAt: number | null;
  backend: StorageBackend;
  storageError: string | null;
  loadNotice: string | null;
  dismissNotice: () => void;
}

const OpportunityContext = createContext<OpportunityContextValue | null>(null);

/**
 * Progress provider. Sits inside PlannerProvider so the optimizer can read the
 * current target, deadline, projection and manually planned income — without
 * writing anything back into the planner state.
 */
export function OpportunityProvider({ children }: { children: ReactNode }) {
  const { today, view, state: plannerState } = usePlanner();
  const [state, dispatch] = useReducer(opportunityReducer, undefined, createDefaultOpportunityState);
  const [hydrated, setHydrated] = useState(false);
  const [saveStatus, setSaveStatus] = useState<OpportunitySaveStatus>('loading');
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [backend, setBackend] = useState<StorageBackend>('none');
  const [storageError, setStorageError] = useState<string | null>(null);
  const [loadNotice, setLoadNotice] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadOpportunityState()
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
        setLoadNotice(
          'Saved opportunity progress could not be read this time. Starting with an empty list.',
        );
        setSaveStatus('error');
        setHydrated(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Progress changes are discrete clicks, not continuous typing, so write them
  // straight away: a rapid refresh must not lose a completion or an undo.
  useEffect(() => {
    if (!hydrated) return;
    setSaveStatus('saving');
    let cancelled = false;
    saveOpportunityState(state)
      .then((result: OpportunitySaveResult) => {
        if (cancelled) return;
        setSaveStatus('saved');
        setSavedAt(result.savedAt);
        setBackend(result.backend);
        setStorageError(null);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setSaveStatus('error');
        setStorageError(
          error instanceof Error
            ? error.message
            : 'This browser refused to save opportunity progress locally.',
        );
      });
    return () => {
      cancelled = true;
    };
  }, [state, hydrated]);

  const latest = useRef({ state, hydrated });
  latest.current = { state, hydrated };

  useEffect(() => {
    const flush = () => {
      if (!latest.current.hydrated) return;
      void saveOpportunityState(latest.current.state).catch(() => {
        // Closing the tab is not the moment to surface storage errors.
      });
    };
    window.addEventListener('pagehide', flush);
    return () => window.removeEventListener('pagehide', flush);
  }, []);

  const summary = useMemo(
    () =>
      buildOpportunitySummary(
        state,
        {
          today,
          deadline: view.plan.endDate,
          dailyPrimogems: plannerState.income.dailyPrimogems,
          oneTimeRewardLabels: plannerState.oneTimeRewards.map((reward) => reward.label),
          budgetWishes: view.budget.wishes,
          projectedWishes: view.projections[view.activeScenario].projected.wishes,
          guaranteeWishes: view.guarantee.worstCaseWishes,
          canForecast: view.canForecast,
        },
        REWARD_CATALOGUE,
      ),
    [state, today, view, plannerState.income.dailyPrimogems, plannerState.oneTimeRewards],
  );

  const dismissNotice = useCallback(() => setLoadNotice(null), []);

  const value = useMemo<OpportunityContextValue>(
    () => ({
      state,
      dispatch,
      summary,
      saveStatus,
      savedAt,
      backend,
      storageError,
      loadNotice,
      dismissNotice,
    }),
    [state, summary, saveStatus, savedAt, backend, storageError, loadNotice, dismissNotice],
  );

  return <OpportunityContext.Provider value={value}>{children}</OpportunityContext.Provider>;
}

export function useOpportunities(): OpportunityContextValue {
  const context = useContext(OpportunityContext);
  if (!context) throw new Error('useOpportunities must be used inside OpportunityProvider');
  return context;
}
