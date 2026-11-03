import {
  createEmptyProgress,
  OPPORTUNITY_LIMITS,
  type Opportunity,
  type OpportunityProgress,
  type OpportunityState,
  type OpportunityStatus,
} from '../domain/opportunity';

export type OpportunityAction =
  | { type: 'hydrate'; state: OpportunityState }
  | { type: 'setStatus'; id: string; status: OpportunityStatus }
  | { type: 'toggleCycle'; id: string; cycleKey: string }
  | { type: 'setProgressPercent'; id: string; percent: number | null }
  | { type: 'setRewardOverride'; id: string; primogems: number | null }
  | { type: 'setPlanned'; id: string; planned: boolean }
  | { type: 'addCustom'; opportunity: Opportunity }
  | { type: 'updateCustom'; id: string; patch: Partial<Omit<Opportunity, 'id' | 'isCustom'>> }
  | { type: 'removeCustom'; id: string };

function updateRecord(
  state: OpportunityState,
  id: string,
  update: (record: OpportunityProgress) => OpportunityProgress,
): OpportunityState {
  const existing = state.records.find((record) => record.id === id);
  const next = update(existing ?? createEmptyProgress(id));
  if (!existing) {
    if (state.records.length >= OPPORTUNITY_LIMITS.maxRecords) return state;
    return { ...state, records: [...state.records, next] };
  }
  return {
    ...state,
    records: state.records.map((record) => (record.id === id ? next : record)),
  };
}

function withoutKey(record: OpportunityProgress, key: 'progressPercent' | 'rewardOverridePrimogems'): OpportunityProgress {
  const { [key]: _removed, ...rest } = record;
  return rest;
}

export function opportunityReducer(
  state: OpportunityState,
  action: OpportunityAction,
): OpportunityState {
  switch (action.type) {
    case 'hydrate':
      return action.state;

    case 'setStatus': {
      return updateRecord(state, action.id, (record) => {
        const completedCycles =
          action.status === 'done'
            ? record.completedCycles.includes('once')
              ? record.completedCycles
              : [...record.completedCycles, 'once']
            : record.completedCycles.filter((key) => key !== 'once');
        return { ...record, status: action.status, completedCycles };
      });
    }

    case 'toggleCycle': {
      return updateRecord(state, action.id, (record) => {
        const has = record.completedCycles.includes(action.cycleKey);
        if (has) {
          return {
            ...record,
            completedCycles: record.completedCycles.filter((key) => key !== action.cycleKey),
            status:
              action.cycleKey === 'once' && record.status === 'done' ? 'todo' : record.status,
          };
        }
        if (record.completedCycles.length >= OPPORTUNITY_LIMITS.maxCycles) return record;
        return {
          ...record,
          completedCycles: [...record.completedCycles, action.cycleKey],
          status: action.cycleKey === 'once' ? 'done' : record.status,
        };
      });
    }

    case 'setProgressPercent': {
      return updateRecord(state, action.id, (record) =>
        action.percent === null
          ? withoutKey(record, 'progressPercent')
          : { ...record, progressPercent: Math.min(100, Math.max(0, Math.round(action.percent))) },
      );
    }

    case 'setRewardOverride': {
      return updateRecord(state, action.id, (record) =>
        action.primogems === null
          ? withoutKey(record, 'rewardOverridePrimogems')
          : {
              ...record,
              rewardOverridePrimogems: Math.min(200_000, Math.max(0, Math.round(action.primogems))),
            },
      );
    }

    case 'setPlanned': {
      return updateRecord(state, action.id, (record) => ({
        ...record,
        planned: action.planned,
      }));
    }

    case 'addCustom': {
      if (state.custom.length >= OPPORTUNITY_LIMITS.maxCustomEntries) return state;
      if (state.custom.some((entry) => entry.id === action.opportunity.id)) return state;
      return {
        ...state,
        custom: [
          ...state.custom,
          { ...action.opportunity, isCustom: true, verification: 'user-entered' },
        ],
      };
    }

    case 'updateCustom': {
      return {
        ...state,
        custom: state.custom.map((entry) =>
          entry.id === action.id
            ? {
                ...entry,
                ...action.patch,
                id: entry.id,
                isCustom: true,
                verification: 'user-entered',
              }
            : entry,
        ),
      };
    }

    case 'removeCustom': {
      return {
        ...state,
        custom: state.custom.filter((entry) => entry.id !== action.id),
        records: state.records.filter((record) => record.id !== action.id),
      };
    }

    default:
      return state;
  }
}
