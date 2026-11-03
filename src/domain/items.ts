import dataset from '../data/items.json';
import type { SearchableItem } from './itemSearch';

/**
 * Character and weapon catalogue for target selection.
 *
 * The data is generated from the MIT-licensed `genshin-db` package by
 * `npm run data:items` (see `scripts/generate-items.mjs`). It contains names,
 * rarities, categories and UI icon filenames only — no gameplay numbers, so
 * nothing here can drift out of sync with the wish maths.
 *
 * Characters and weapons stay in separate arrays and are joined by a
 * discriminated union, which keeps banner-type filtering type-safe.
 */

export type ItemKind = 'character' | 'weapon';

export interface ItemBase extends SearchableItem {
  /** Stable game id, prefixed with the kind when exposed. */
  id: string;
  name: string;
  rarity: number;
  /** Sword, Bow, Catalyst, … (already humanised by the generator). */
  weaponType: string;
}

export interface CharacterItem extends ItemBase {
  kind: 'character';
  element: string;
  sideIcon: string | null;
  icon: string | null;
}

export interface WeaponItem extends ItemBase {
  kind: 'weapon';
  icon: string | null;
  awakenIcon: string | null;
}

export type TargetItem = CharacterItem | WeaponItem;

export interface ItemDatasetMeta {
  source: string;
  sourceVersion: string;
  sourceLicense: string;
  generatedOn: string;
  note: string;
  characters: number;
  weapons: number;
}

interface RawCharacter {
  id: string;
  name: string;
  rarity: number;
  element: string;
  weaponType: string;
  icon: string | null;
  sideIcon: string | null;
}

interface RawWeapon {
  id: string;
  name: string;
  rarity: number;
  weaponType: string;
  icon: string | null;
  awakenIcon: string | null;
}

interface RawDataset {
  meta: ItemDatasetMeta;
  characters: RawCharacter[];
  weapons: RawWeapon[];
}

const raw = dataset as unknown as RawDataset;

export const ITEM_DATASET_META: ItemDatasetMeta = raw.meta;

export const CHARACTERS: readonly CharacterItem[] = raw.characters.map((character) => ({
  kind: 'character',
  id: `character-${character.id}`,
  name: character.name,
  rarity: character.rarity,
  element: character.element,
  weaponType: character.weaponType,
  icon: character.icon,
  sideIcon: character.sideIcon,
}));

export const WEAPONS: readonly WeaponItem[] = raw.weapons.map((weapon) => ({
  kind: 'weapon',
  id: `weapon-${weapon.id}`,
  name: weapon.name,
  rarity: weapon.rarity,
  weaponType: weapon.weaponType,
  icon: weapon.icon,
  awakenIcon: weapon.awakenIcon,
}));

export const TARGET_ITEMS: readonly TargetItem[] = [...CHARACTERS, ...WEAPONS];

const BY_ID = new Map(TARGET_ITEMS.map((item) => [item.id, item]));
const BY_NAME = new Map(TARGET_ITEMS.map((item) => [item.name.trim().toLowerCase(), item]));

/**
 * UI icons are read from Enka.Network, a community mirror of the game's UI
 * assets. They are referenced directly instead of being copied into this
 * repository, and every consumer must tolerate a missing image.
 */
export const ARTWORK_BASE_URL = 'https://enka.network/ui/';

export type ArtworkVariant = 'portrait' | 'compact';

/** Resolves the icon file for an item, or null when the dataset has none. */
export function itemArtwork(item: TargetItem, variant: ArtworkVariant = 'portrait'): string | null {
  const file =
    item.kind === 'character'
      ? variant === 'compact'
        ? (item.sideIcon ?? item.icon)
        : item.icon
      : item.icon;
  return file ? `${ARTWORK_BASE_URL}${file}.png` : null;
}

/** Looks an item up by exact (case-insensitive) name; saved plans store names. */
export function findItemByName(name: string): TargetItem | null {
  return BY_NAME.get(name.trim().toLowerCase()) ?? null;
}

export function findItemById(id: string): TargetItem | null {
  return BY_ID.get(id) ?? null;
}

export function itemsForKind(kind: ItemKind): readonly TargetItem[] {
  return kind === 'character' ? CHARACTERS : WEAPONS;
}

/** Short descriptor used by selector rows, e.g. "Hydro · Sword". */
export function describeItem(item: TargetItem): string {
  if (item.kind === 'character') {
    // The Traveler has no fixed element in the dataset.
    return item.element && item.element !== 'None'
      ? `${item.element} · ${item.weaponType}`
      : item.weaponType;
  }
  return item.weaponType;
}
