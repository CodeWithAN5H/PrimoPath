import { MECHANICS } from './mechanics';

/**
 * Primogems and Fates → wish budget.
 *
 * `Available wishes = Intertwined Fates + floor(Primogems / 160)`.
 * Acquaint Fates are deliberately not part of the model: they cannot be spent
 * on the banners PrimoPath plans for.
 */
export interface WishBudget {
  wishes: number;
  leftoverPrimogems: number;
}

export function wishBudget(primogems: number, intertwinedFates: number): WishBudget {
  const safePrimogems = Math.max(0, Math.floor(primogems));
  const safeFates = Math.max(0, Math.floor(intertwinedFates));
  const fromPrimogems = Math.floor(safePrimogems / MECHANICS.primogemsPerWish);
  return {
    wishes: safeFates + fromPrimogems,
    leftoverPrimogems: safePrimogems - fromPrimogems * MECHANICS.primogemsPerWish,
  };
}

/** Whole wishes worth of Primogems still needed to reach `targetWishes`. */
export function primogemsToReach(targetWishes: number, budget: WishBudget): number {
  const missing = Math.ceil(targetWishes) - budget.wishes;
  if (missing <= 0) return 0;
  return Math.max(0, missing * MECHANICS.primogemsPerWish - budget.leftoverPrimogems);
}

/** Wishes still missing to reach a target, never negative. */
export function wishesShortOf(targetWishes: number, budget: WishBudget): number {
  return Math.max(0, Math.ceil(targetWishes) - budget.wishes);
}

export function addWishes(budget: WishBudget, addedWishes: number): WishBudget {
  const extra = Math.max(0, Math.floor(addedWishes));
  const totalPrimogems =
    budget.wishes * MECHANICS.primogemsPerWish + budget.leftoverPrimogems + extra * MECHANICS.primogemsPerWish;
  return wishBudget(totalPrimogems, 0);
}
