import { describe, expect, it } from 'vitest';
import { editDistance, normalizeQuery, searchByKind, searchItems } from './itemSearch';

interface Item {
  id: string;
  name: string;
  kind: string;
}

const items: Item[] = [
  { id: 'character-furina', name: 'Furina', kind: 'character' },
  { id: 'character-hutao', name: 'Hu Tao', kind: 'character' },
  { id: 'character-raiden', name: 'Raiden Shogun', kind: 'character' },
  { id: 'character-kazuha', name: 'Kaedehara Kazuha', kind: 'character' },
  { id: 'character-nahida', name: 'Nahida', kind: 'character' },
  { id: 'weapon-homa', name: 'Staff of Homa', kind: 'weapon' },
  { id: 'weapon-xiphos', name: "Xiphos' Moonlight", kind: 'weapon' },
  { id: 'weapon-amos', name: "Amos' Bow", kind: 'weapon' },
  { id: 'weapon-catch', name: '"The Catch"', kind: 'weapon' },
];

describe('normalizeQuery', () => {
  it('lowercases, strips punctuation and collapses whitespace', () => {
    expect(normalizeQuery("  Xiphos'   Moonlight ")).toBe('xiphos moonlight');
    expect(normalizeQuery('"The Catch"')).toBe('the catch');
    expect(normalizeQuery('Hu Tao')).toBe('hu tao');
  });
});

describe('editDistance', () => {
  it('measures single-character mistakes', () => {
    expect(editDistance('furina', 'furinna', 2)).toBe(1);
    expect(editDistance('furina', 'furina', 2)).toBe(0);
    expect(editDistance('furina', 'zzzzzz', 2)).toBeGreaterThan(2);
  });
});

describe('searchItems', () => {
  it('matches after a few characters, regardless of case', () => {
    expect(searchItems(items, 'fur')[0]?.name).toBe('Furina');
    expect(searchItems(items, 'FURINA')[0]?.name).toBe('Furina');
    expect(searchItems(items, 'FUR')[0]?.name).toBe('Furina');
  });

  it('matches partial names in the middle of a name', () => {
    expect(searchItems(items, 'hida').map((item) => item.name)).toContain('Nahida');
    expect(searchItems(items, 'moon').map((item) => item.name)).toContain("Xiphos' Moonlight");
  });

  it('matches multi-word queries in any word order', () => {
    expect(searchItems(items, 'hu tao')[0]?.name).toBe('Hu Tao');
    expect(searchItems(items, 'tao hu')[0]?.name).toBe('Hu Tao');
    expect(searchItems(items, 'moonlight xiphos')[0]?.name).toBe("Xiphos' Moonlight");
  });

  it('tolerates a minor spelling mistake', () => {
    expect(searchItems(items, 'furinna').map((item) => item.name)).toContain('Furina');
    expect(searchItems(items, 'raided shogun').map((item) => item.name)).toContain(
      'Raiden Shogun',
    );
  });

  it('does not fuzz very short queries', () => {
    expect(searchItems(items, 'xx')).toHaveLength(0);
  });

  it('returns nothing for an unrelated query', () => {
    expect(searchItems(items, 'zzzz')).toHaveLength(0);
    expect(searchItems(items, '   ')).toHaveLength(0);
  });

  it('ignores punctuation and apostrophes in stored names', () => {
    expect(searchItems(items, 'the catch')[0]?.name).toBe('"The Catch"');
    expect(searchItems(items, 'amos bow')[0]?.name).toBe("Amos' Bow");
  });

  it('never returns duplicates and respects the limit', () => {
    const duplicated = [...items, { ...items[0]!, id: 'character-furina-copy' }];
    expect(searchItems(duplicated, 'fur')).toHaveLength(1);

    const limited = searchItems(items, 'a', { limit: 3 });
    expect(limited.length).toBeLessThanOrEqual(3);
  });

  it('filters by kind for the selector', () => {
    expect(searchByKind(items, 'a', 'character').every((item) => item.kind === 'character')).toBe(
      true,
    );
    expect(searchByKind(items, 'ur', 'weapon')).toHaveLength(0);
    expect(searchByKind(items, 'bow', 'any')[0]?.name).toBe("Amos' Bow");
  });
});
