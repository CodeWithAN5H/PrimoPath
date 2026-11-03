import { describe, expect, it } from 'vitest';
import { opportunitySchema, normalizeOpportunityName } from '../domain/opportunity';
import { REWARD_CATALOGUE } from './rewardCatalogue';

describe('bundled reward catalogue', () => {
  it('validates every entry against the runtime schema', () => {
    for (const entry of REWARD_CATALOGUE) {
      const result = opportunitySchema.safeParse(entry);
      expect(result.success, `${entry.id} failed validation`).toBe(true);
    }
  });

  it('has unique ids and names', () => {
    const ids = new Set(REWARD_CATALOGUE.map((entry) => entry.id));
    const names = new Set(REWARD_CATALOGUE.map((entry) => normalizeOpportunityName(entry.name)));
    expect(ids.size).toBe(REWARD_CATALOGUE.length);
    expect(names.size).toBe(REWARD_CATALOGUE.length);
  });

  it('never ships unsourced or user-entered catalogue rewards', () => {
    for (const entry of REWARD_CATALOGUE) {
      expect(entry.isCustom).toBe(false);
      expect(entry.verification).not.toBe('user-entered');
      expect(entry.sourceUrl).toMatch(/^https:\/\//);
      expect(entry.sourceLabel?.length ?? 0).toBeGreaterThan(3);
      expect(entry.verifiedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it('only bundles stable, recurring categories rather than volatile event data', () => {
    const stable = new Set(['daily', 'spiral-abyss', 'imaginarium-theater']);
    for (const entry of REWARD_CATALOGUE) {
      expect(stable.has(entry.category), `${entry.id} is not a stable category`).toBe(true);
    }
  });

  it('documents the periodic resets the optimizer relies on', () => {
    const abyss = REWARD_CATALOGUE.find((entry) => entry.id === 'spiral-abyss-reset');
    const theatre = REWARD_CATALOGUE.find((entry) => entry.id === 'imaginarium-theater-season');
    const daily = REWARD_CATALOGUE.find((entry) => entry.id === 'daily-commissions');

    expect(abyss?.recurrence).toEqual({ kind: 'monthly', days: [16] });
    expect(abyss?.reward.primogems).toBe(800);
    expect(theatre?.recurrence).toEqual({ kind: 'monthly', days: [1] });
    expect(theatre?.verification).toBe('estimated');
    expect(theatre?.reward.primogemsMax).toBeGreaterThan(theatre?.reward.primogems ?? 0);
    expect(daily?.recurrence).toEqual({ kind: 'daily' });
    expect(daily?.reward.primogems).toBe(60);
  });

  it('documents every Imaginarium Theater completion tier', () => {
    const theatre = REWARD_CATALOGUE.find((entry) => entry.id === 'imaginarium-theater-season');

    expect(theatre?.description).toContain('620 Primogems through Act 8 (Hard)');
    expect(theatre?.description).toContain('800 through Act 10 (Visionary)');
    expect(theatre?.description).toContain('1,000 for a full Lunar clear');
    expect(theatre?.reward).toEqual({ primogems: 620, fates: 0, primogemsMax: 1000 });
    expect(theatre?.sourceUrl).toBe('https://genshin-impact.fandom.com/wiki/Imaginarium_Theater');
    expect(theatre?.corroboratingSourceUrl).toBe(
      'https://timesaver.gg/blog/genshin-imaginarium-theater-october-2026',
    );
  });

  it('keeps the official Abyss reset source and corroborates the 800 amount separately', () => {
    const abyss = REWARD_CATALOGUE.find((entry) => entry.id === 'spiral-abyss-reset');

    expect(abyss?.sourceUrl).toContain('support.hoyoverse.com');
    expect(abyss?.corroboratingSourceUrl).toBe('https://genshin-impact.fandom.com/wiki/Primogem');
    expect(abyss?.reward.primogems).toBe(800);
    expect(abyss?.recurrence).toEqual({ kind: 'monthly', days: [16] });
  });

  it('keeps effort estimates positive for every entry', () => {
    for (const entry of REWARD_CATALOGUE) {
      expect(entry.effortMinutes).toBeGreaterThan(0);
      expect(entry.effortMinutes).toBeLessThanOrEqual(240);
    }
  });
});
