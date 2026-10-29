import type {
  BannerType,
  CharacterPlan,
  Income,
  OneTimeReward,
  PlannerState,
  Resources,
  WeaponPlan,
} from '../domain/schema';

export type PlannerAction =
  | { type: 'hydrate'; state: PlannerState }
  | { type: 'reset'; state: PlannerState }
  | { type: 'setResources'; patch: Partial<Resources> }
  | { type: 'setIncome'; patch: Partial<Income> }
  | { type: 'setActiveBanner'; banner: BannerType }
  | { type: 'updateCharacterPlan'; patch: Partial<CharacterPlan> }
  | { type: 'updateWeaponPlan'; patch: Partial<WeaponPlan> }
  | { type: 'addReward'; reward: OneTimeReward }
  | { type: 'updateReward'; id: string; patch: Partial<Omit<OneTimeReward, 'id'>> }
  | { type: 'removeReward'; id: string };

export function plannerReducer(state: PlannerState, action: PlannerAction): PlannerState {
  switch (action.type) {
    case 'hydrate':
      return action.state;
    case 'reset':
      return action.state;
    case 'setResources':
      return { ...state, resources: { ...state.resources, ...action.patch } };
    case 'setIncome':
      return { ...state, income: { ...state.income, ...action.patch } };
    case 'setActiveBanner':
      return { ...state, activeBanner: action.banner };
    case 'updateCharacterPlan':
      return {
        ...state,
        characterPlan: { ...state.characterPlan, ...action.patch, bannerType: 'character' },
      };
    case 'updateWeaponPlan':
      return {
        ...state,
        weaponPlan: { ...state.weaponPlan, ...action.patch, bannerType: 'weapon' },
      };
    case 'addReward':
      if (state.oneTimeRewards.some((reward) => reward.id === action.reward.id)) return state;
      return { ...state, oneTimeRewards: [...state.oneTimeRewards, action.reward] };
    case 'updateReward':
      return {
        ...state,
        oneTimeRewards: state.oneTimeRewards.map((reward) =>
          reward.id === action.id ? { ...reward, ...action.patch, id: reward.id } : reward,
        ),
      };
    case 'removeReward':
      return {
        ...state,
        oneTimeRewards: state.oneTimeRewards.filter((reward) => reward.id !== action.id),
      };
    default:
      return state;
  }
}
