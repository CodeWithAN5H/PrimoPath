import { describe, expect, it } from 'vitest';
import { characterGuarantee, weaponGuarantee } from './guarantee';

describe('characterGuarantee', () => {
  it('is two full cycles at 0 pity without a guarantee', () => {
    expect(characterGuarantee({ pity: 0, guaranteed: false }).worstCaseWishes).toBe(180);
  });

  it('is one cycle at 0 pity with the guarantee', () => {
    expect(characterGuarantee({ pity: 0, guaranteed: true }).worstCaseWishes).toBe(90);
  });

  it('credits current pity', () => {
    expect(characterGuarantee({ pity: 89, guaranteed: true }).worstCaseWishes).toBe(1);
    expect(characterGuarantee({ pity: 40, guaranteed: false }).worstCaseWishes).toBe(140);
    expect(characterGuarantee({ pity: 40, guaranteed: true }).worstCaseWishes).toBe(50);
  });

  it('explains the worst case and refuses to credit Capturing Radiance', () => {
    const budget = characterGuarantee({ pity: 0, guaranteed: false });
    expect(budget.lines.join(' ')).toContain('Capturing Radiance');
    expect(budget.lines.join(' ')).toContain('50/50');
    expect(budget.toNextFiveStar).toBe(90);
    expect(budget.afterNextFiveStar).toBe(90);
  });
});

describe('weaponGuarantee', () => {
  it('needs three 5-star weapons at 0 pity and 0 Fate Points', () => {
    expect(weaponGuarantee({ pity: 0, fatePoints: 0 }).worstCaseWishes).toBe(240);
  });

  it('removes one cycle per Fate Point already held', () => {
    expect(weaponGuarantee({ pity: 0, fatePoints: 1 }).worstCaseWishes).toBe(160);
    expect(weaponGuarantee({ pity: 0, fatePoints: 2 }).worstCaseWishes).toBe(80);
  });

  it('credits current weapon pity', () => {
    expect(weaponGuarantee({ pity: 79, fatePoints: 2 }).worstCaseWishes).toBe(1);
    expect(weaponGuarantee({ pity: 60, fatePoints: 1 }).worstCaseWishes).toBe(100);
  });

  it('uses weapon hard pity, not character hard pity', () => {
    expect(weaponGuarantee({ pity: 0, fatePoints: 2 }).toNextFiveStar).toBe(80);
  });
});
