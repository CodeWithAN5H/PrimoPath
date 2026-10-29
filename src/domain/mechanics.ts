/**
 * Versioned wish mechanics configuration.
 *
 * Only documented, stable facts that Milestone 1 needs are encoded here.
 * The full probability model (soft pity curves, Capturing Radiance, joint
 * character/weapon budgets) is intentionally NOT implemented yet — it will
 * consume this same config object in Milestone 3.
 *
 * Update `version`, `verifiedOn` and `sources` whenever a game update changes
 * any value, so old saved plans can be interpreted correctly.
 */
export const MECHANICS = {
  version: '1.0.0',
  verifiedOn: '2026-10-29',
  sources: [
    'In-game Wish screen → Details (Character Event Wish)',
    'In-game Wish screen → Details (Weapon Event Wish)',
  ],
  /** One Intertwined Fate costs this many Primogems. */
  primogemsPerWish: 160,
  character: {
    /** Most wishes without a 5-star before one is guaranteed. */
    hardPity: 90,
    /** Documented featured rate on a fresh 5-star (the "50/50"). */
    featuredChance: 0.5,
  },
  weapon: {
    /** Most wishes without a 5-star weapon before one is guaranteed. */
    hardPity: 80,
    /** Fate Points needed on the Epitomized Path for the chosen weapon. */
    fatePointsToGuarantee: 2,
    /** Documented chance that a fresh 5-star weapon is one of the featured ones. */
    featuredChance: 0.75,
  },
} as const;

export type Mechanics = typeof MECHANICS;
