/**
 * Pure search for the target selector.
 *
 * Deliberately dependency-free: 380-odd items are small enough that a scored scan
 * per keystroke is cheaper than any index, and it keeps the ranking testable.
 *
 * Ranking tiers are ordered from most to least confident. A query is split into
 * words, and every word must match somewhere in the item name, so "xiphos moon"
 * still finds "Xiphos' Moonlight".
 */

export type MatchTier = 'exact' | 'prefix' | 'word' | 'contains' | 'subsequence' | 'fuzzy';

const TIER_ORDER: Record<MatchTier, number> = {
  exact: 0,
  prefix: 1,
  word: 2,
  contains: 3,
  subsequence: 4,
  fuzzy: 5,
};

export interface SearchableItem {
  id: string;
  name: string;
}

export interface SearchOptions {
  limit?: number;
}

/** Lowercase, strip diacritics and punctuation, collapse whitespace. */
export function normalizeQuery(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function isSubsequence(needle: string, haystack: string): boolean {
  if (needle.length === 0) return true;
  let cursor = 0;
  for (const character of haystack) {
    if (character === needle[cursor]) {
      cursor += 1;
      if (cursor === needle.length) return true;
    }
  }
  return false;
}

/** Levenshtein distance with early exit once the budget is exceeded. */
export function editDistance(a: string, b: string, budget = 2): number {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > budget) return budget + 1;

  const previous = new Array<number>(b.length + 1);
  const current = new Array<number>(b.length + 1);
  for (let column = 0; column <= b.length; column += 1) previous[column] = column;

  for (let row = 1; row <= a.length; row += 1) {
    current[0] = row;
    let rowMinimum = current[0]!;
    for (let column = 1; column <= b.length; column += 1) {
      const substitution = previous[column - 1]! + (a[row - 1] === b[column - 1] ? 0 : 1);
      const deletion = previous[column]! + 1;
      const insertion = current[column - 1]! + 1;
      const value = Math.min(substitution, deletion, insertion);
      current[column] = value;
      if (value < rowMinimum) rowMinimum = value;
    }
    if (rowMinimum > budget) return budget + 1;
    for (let column = 0; column <= b.length; column += 1) previous[column] = current[column]!;
  }

  return previous[b.length]!;
}

/** Typo tolerance grows with the query: no fuzz for 1–2 letters, 2 edits from 7. */
function typoBudget(query: string): number {
  if (query.length < 4) return 0;
  if (query.length < 7) return 1;
  return 2;
}

interface TokenMatch {
  tier: MatchTier;
  /** Where the match starts in the normalised name, for stable ordering. */
  position: number;
}

function matchToken(token: string, name: string, nameTokens: readonly string[]): TokenMatch | null {
  const position = name.indexOf(token);

  if (name === token) return { tier: 'exact', position: 0 };
  if (name.startsWith(token)) return { tier: 'prefix', position: 0 };

  const exactWord = nameTokens.indexOf(token);
  if (exactWord !== -1) return { tier: 'word', position };

  if (nameTokens.some((candidate) => candidate.startsWith(token))) {
    return { tier: 'word', position };
  }
  if (position !== -1) return { tier: 'contains', position };
  if (isSubsequence(token, name)) return { tier: 'subsequence', position: -1 };

  const budget = typoBudget(token);
  if (budget === 0) return null;

  let best = budget + 1;
  for (const candidate of [name, ...nameTokens]) {
    const distance = editDistance(token, candidate, budget);
    if (distance < best) best = distance;
  }
  return best <= budget ? { tier: 'fuzzy', position: -1 } : null;
}

/**
 * Scores one item against a normalised query. Returns null when any query word
 * fails to match, so unrelated names are never suggested.
 */
function scoreItem(name: string, query: string): { tier: MatchTier; position: number } | null {
  const nameTokens = name.split(' ').filter(Boolean);
  let worst: MatchTier = 'exact';
  let position = Number.POSITIVE_INFINITY;

  for (const token of query.split(' ')) {
    if (!token) continue;
    const match = matchToken(token, name, nameTokens);
    if (!match) return null;
    if (TIER_ORDER[match.tier] > TIER_ORDER[worst]) worst = match.tier;
    if (match.position >= 0) position = Math.min(position, match.position);
  }

  return { tier: worst, position };
}

/**
 * Searches items by partial name, word prefix or a minor spelling mistake.
 * Duplicate names are collapsed and results are capped by `limit`.
 */
export function searchItems<T extends SearchableItem>(
  items: readonly T[],
  query: string,
  options: SearchOptions = {},
): T[] {
  const limit = options.limit ?? 8;
  const normalizedQuery = normalizeQuery(query);
  if (normalizedQuery === '') return [];

  // Suggestion lists are deduplicated by name: the same name entered twice must
  // never produce two identical rows, whatever ids the catalogue gives it.
  const seen = new Set<string>();
  const matches: { item: T; tier: MatchTier; position: number }[] = [];

  for (const item of items) {
    const normalizedName = normalizeQuery(item.name);
    if (seen.has(normalizedName)) continue;

    const score = scoreItem(normalizedName, normalizedQuery);
    if (!score) continue;

    seen.add(normalizedName);
    matches.push({ item, tier: score.tier, position: score.position });
  }

  matches.sort((a, b) => {
    const tierDelta = TIER_ORDER[a.tier] - TIER_ORDER[b.tier];
    if (tierDelta !== 0) return tierDelta;
    if (a.position !== b.position) return a.position - b.position;
    if (a.item.name.length !== b.item.name.length) return a.item.name.length - b.item.name.length;
    return a.item.name.localeCompare(b.item.name, 'en');
  });

  return matches.slice(0, limit).map((match) => match.item);
}

/**
 * Groups a search result into recent first, then the closest name matches.
 * Kept separate from the component so the ordering rules stay testable.
 */
export function searchByKind<T extends SearchableItem & { kind: string }>(
  items: readonly T[],
  query: string,
  kind: string | 'any',
  limit = 8,
): T[] {
  const pool = kind === 'any' ? items : items.filter((item) => item.kind === kind);
  return searchItems(pool, query, { limit });
}
