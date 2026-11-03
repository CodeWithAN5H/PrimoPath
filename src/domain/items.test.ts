import { describe, expect, it } from 'vitest';
import {
  ARTWORK_BASE_URL,
  CHARACTERS,
  ITEM_DATASET_META,
  TARGET_ITEMS,
  WEAPONS,
  describeItem,
  findItemByName,
  findItemById,
  itemArtwork,
  itemsForKind,
} from './items';

describe('item dataset', () => {
  it('covers the full supported roster rather than a sample', () => {
    expect(CHARACTERS.length).toBeGreaterThanOrEqual(100);
    expect(WEAPONS.length).toBeGreaterThanOrEqual(200);
    expect(ITEM_DATASET_META.characters).toBe(CHARACTERS.length);
    expect(ITEM_DATASET_META.weapons).toBe(WEAPONS.length);
    expect(ITEM_DATASET_META.sourceLicense).toBe('MIT');
  });

  it('has unique ids and names, with artwork for every entry', () => {
    const ids = new Set(TARGET_ITEMS.map((item) => item.id));
    const names = new Set(TARGET_ITEMS.map((item) => item.name.toLowerCase()));
    expect(ids.size).toBe(TARGET_ITEMS.length);
    expect(names.size).toBe(TARGET_ITEMS.length);
    expect(TARGET_ITEMS.every((item) => item.icon !== null)).toBe(true);
    expect(CHARACTERS.every((character) => character.rarity >= 4)).toBe(true);
    expect(WEAPONS.every((weapon) => weapon.rarity >= 1)).toBe(true);
  });

  it('keeps characters and weapons in separate collections', () => {
    expect(itemsForKind('character')).toBe(CHARACTERS);
    expect(itemsForKind('weapon')).toBe(WEAPONS);
    expect(CHARACTERS.every((item) => item.kind === 'character')).toBe(true);
    expect(WEAPONS.every((item) => item.kind === 'weapon')).toBe(true);
  });

  it('includes known characters and weapons with typed metadata', () => {
    const furina = findItemByName('furina');
    expect(furina?.kind).toBe('character');
    if (furina?.kind === 'character') {
      expect(furina.element).toBe('Hydro');
      expect(furina.weaponType).toBe('Sword');
      expect(describeItem(furina)).toBe('Hydro · Sword');
    }

    const homa = findItemByName('Staff of Homa');
    expect(homa?.kind).toBe('weapon');
    expect(homa?.rarity).toBe(5);

    expect(findItemByName('Nobody At All')).toBeNull();
    expect(findItemById('character-10000089')?.name).toBe('Furina');
  });

  it('builds artwork URLs and falls back to null without an icon', () => {
    const furina = findItemByName('Furina');
    expect(furina).not.toBeNull();
    expect(itemArtwork(furina!)).toBe(`${ARTWORK_BASE_URL}UI_AvatarIcon_Furina.png`);

    expect(
      itemArtwork({
        kind: 'weapon',
        id: 'weapon-test',
        name: 'Test Weapon',
        rarity: 4,
        weaponType: 'Sword',
        icon: null,
        awakenIcon: null,
      }),
    ).toBeNull();
  });
});
