import { MECHANICS } from './mechanics';
import type { CharacterPlan, Plan, WeaponPlan } from './schema';

export interface GuaranteeBudget {
  bannerType: Plan['bannerType'];
  /** Wishes until the next 5-star if it arrives exactly at hard pity. */
  toNextFiveStar: number;
  /** Additional wishes needed after that 5-star for the worst case. */
  afterNextFiveStar: number;
  /** Worst-case wishes from now, counting documented hard pity only. */
  worstCaseWishes: number;
  lines: string[];
}

/**
 * Worst-case wishes to obtain the selected featured character.
 *
 * Character Event Wish pity carries across concurrent character banners, so
 * the current pity is credited. The worst case is two full 5-star cycles when
 * the next 5-star is not guaranteed, because the featured rate on a fresh
 * 5-star is a 50/50.
 */
export function characterGuarantee(plan: Pick<CharacterPlan, 'pity' | 'guaranteed'>): GuaranteeBudget {
  const hardPity = MECHANICS.character.hardPity;
  const toNextFiveStar = hardPity - plan.pity;
  const afterNextFiveStar = plan.guaranteed ? 0 : hardPity;

  const lines = [
    `${toNextFiveStar} wishes until your next 5-star at hard pity (${hardPity}), given ${plan.pity} current pity.`,
    plan.guaranteed
      ? 'Your next 5-star is guaranteed to be the featured character, so one cycle is enough.'
      : 'No guarantee: losing the 50/50 costs a second full cycle of up to 90 wishes.',
    'Capturing Radiance is not credited here — it can only reduce the real worst case, never increase it.',
  ];

  return {
    bannerType: 'character',
    toNextFiveStar,
    afterNextFiveStar,
    worstCaseWishes: toNextFiveStar + afterNextFiveStar,
    lines,
  };
}

/**
 * Worst-case wishes to obtain the selected featured weapon under the
 * Epitomized Path. Fate Points already accumulated reduce the number of
 * additional 5-star weapons the path can demand.
 */
export function weaponGuarantee(plan: Pick<WeaponPlan, 'pity' | 'fatePoints'>): GuaranteeBudget {
  const hardPity = MECHANICS.weapon.hardPity;
  const toNextFiveStar = hardPity - plan.pity;
  const remainingFatePoints = MECHANICS.weapon.fatePointsToGuarantee - plan.fatePoints;
  const afterNextFiveStar = remainingFatePoints * hardPity;

  const lines = [
    `${toNextFiveStar} wishes until your next 5-star weapon at hard pity (${hardPity}), given ${plan.pity} current pity.`,
    remainingFatePoints === 0
      ? 'You already hold 2 Fate Points, so your next 5-star weapon is the one you charted.'
      : `Epitomized Path can demand up to ${remainingFatePoints} more 5-star weapon${
          remainingFatePoints === 1 ? '' : 's'
        } before the charted weapon is guaranteed.`,
    'Weapon pity and Fate Points only apply to the Weapon Event Wish; they are never mixed with character pity.',
  ];

  return {
    bannerType: 'weapon',
    toNextFiveStar,
    afterNextFiveStar,
    worstCaseWishes: toNextFiveStar + afterNextFiveStar,
    lines,
  };
}

export function guaranteeBudget(plan: Plan): GuaranteeBudget {
  return plan.bannerType === 'character'
    ? characterGuarantee(plan)
    : weaponGuarantee(plan);
}
