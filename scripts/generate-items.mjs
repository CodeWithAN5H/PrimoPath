/**
 * Generates `src/data/items.json` from the MIT-licensed `genshin-db` package.
 *
 * Why a build-time script instead of a runtime dependency?
 * - The planner is local-first; shipping the dataset as a static JSON module keeps
 *   autocomplete instant and offline, with no API key, network call or rate limit.
 * - Regenerating after a game update is a single command, and the diff shows exactly
 *   which characters or weapons were added.
 *
 * Run with: npm run data:items
 */
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const db = require('genshin-db');

const here = dirname(fileURLToPath(import.meta.url));
const outputPath = resolve(here, '../src/data/items.json');
const pkg = require('genshin-db/package.json');

const WEAPON_TYPE_LABELS = {
  WEAPON_SWORD_ONE_HAND: 'Sword',
  WEAPON_CLAYMORE: 'Claymore',
  WEAPON_POLE: 'Polearm',
  WEAPON_BOW: 'Bow',
  WEAPON_CATALYST: 'Catalyst',
};

function weaponTypeLabel(raw, fallback) {
  return WEAPON_TYPE_LABELS[raw] ?? fallback ?? 'Unknown';
}

function uniqueSortedByName(entries) {
  const seen = new Set();
  return entries
    .filter((entry) => {
      const key = entry.name.trim().toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'en'));
}

const characterNames = db.characters('names', {
  matchCategories: true,
  resultLanguage: 'English',
});
const weaponNames = db.weapons('names', {
  matchCategories: true,
  resultLanguage: 'English',
});

if (!Array.isArray(characterNames) || !Array.isArray(weaponNames)) {
  throw new Error('genshin-db did not return name lists; check the installed version.');
}

const skipped = [];

const characters = uniqueSortedByName(
  characterNames
    .map((name) => {
      const entry = db.characters(name, { resultLanguage: 'English' });
      if (!entry || !entry.images?.filename_icon || !entry.rarity) {
        skipped.push(`character:${name}`);
        return null;
      }
      return {
        id: String(entry.id),
        name: entry.name,
        rarity: entry.rarity,
        element: entry.elementText ?? 'Unknown',
        weaponType: weaponTypeLabel(entry.weaponType, entry.weaponText),
        icon: entry.images.filename_icon,
        sideIcon: entry.images.filename_sideIcon ?? null,
      };
    })
    .filter(Boolean),
);

const weapons = uniqueSortedByName(
  weaponNames
    .map((name) => {
      const entry = db.weapons(name, { resultLanguage: 'English' });
      if (!entry || !entry.images?.filename_icon || !entry.rarity) {
        skipped.push(`weapon:${name}`);
        return null;
      }
      return {
        id: String(entry.id),
        name: entry.name,
        rarity: entry.rarity,
        weaponType: weaponTypeLabel(entry.weaponType, entry.weaponText),
        icon: entry.images.filename_icon,
        awakenIcon: entry.images.filename_awakenIcon ?? null,
      };
    })
    .filter(Boolean),
);

if (characters.length < 100) {
  throw new Error(`Only ${characters.length} characters were read; refusing to write an incomplete dataset.`);
}
if (weapons.length < 200) {
  throw new Error(`Only ${weapons.length} weapons were read; refusing to write an incomplete dataset.`);
}

const dataset = {
  meta: {
    source: 'genshin-db',
    sourceVersion: pkg.version,
    sourceLicense: pkg.license ?? 'MIT',
    generatedOn: new Date().toISOString().slice(0, 10),
    note: 'Character and weapon names, rarities and UI icon filenames only. No gameplay statistics are stored.',
    characters: characters.length,
    weapons: weapons.length,
  },
  characters,
  weapons,
};

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(dataset, null, 2)}\n`, 'utf8');

console.log(
  `Wrote ${characters.length} characters and ${weapons.length} weapons to src/data/items.json (genshin-db ${pkg.version}).`,
);
if (skipped.length > 0) {
  console.warn(`Skipped ${skipped.length} incomplete entries: ${skipped.slice(0, 10).join(', ')}`);
}
