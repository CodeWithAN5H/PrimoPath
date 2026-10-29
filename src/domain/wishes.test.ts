import { describe, expect, it } from 'vitest';
import { primogemsToReach, wishBudget, wishesShortOf } from './wishes';

describe('wishBudget', () => {
  it('converts exact multiples of 160 with no leftover', () => {
    expect(wishBudget(1600, 5)).toEqual({ wishes: 15, leftoverPrimogems: 0 });
  });

  it('keeps leftover Primogems visible', () => {
    expect(wishBudget(1750, 0)).toEqual({ wishes: 10, leftoverPrimogems: 150 });
  });

  it('adds Intertwined Fates at face value without converting them', () => {
    expect(wishBudget(0, 7)).toEqual({ wishes: 7, leftoverPrimogems: 0 });
  });

  it('floors fractional Primogems instead of rounding up', () => {
    expect(wishBudget(159.9, 0)).toEqual({ wishes: 0, leftoverPrimogems: 159 });
  });

  it('clamps negative input to zero', () => {
    expect(wishBudget(-500, -3)).toEqual({ wishes: 0, leftoverPrimogems: 0 });
  });

  it('never mixes a Fate into the leftover pool', () => {
    expect(wishBudget(320, 1)).toEqual({ wishes: 3, leftoverPrimogems: 0 });
  });
});

describe('primogemsToReach', () => {
  it('returns zero when the target is already affordable', () => {
    expect(primogemsToReach(5, { wishes: 5, leftoverPrimogems: 90 })).toBe(0);
    expect(primogemsToReach(3, { wishes: 5, leftoverPrimogems: 90 })).toBe(0);
  });

  it('credits leftover Primogems toward the cost', () => {
    expect(primogemsToReach(10, { wishes: 5, leftoverPrimogems: 80 })).toBe(720);
  });

  it('charges full wishes when nothing is left over', () => {
    expect(primogemsToReach(2, { wishes: 0, leftoverPrimogems: 0 })).toBe(320);
  });
});

describe('wishesShortOf', () => {
  it('is never negative', () => {
    expect(wishesShortOf(4, { wishes: 9, leftoverPrimogems: 0 })).toBe(0);
  });

  it('reports the exact gap', () => {
    expect(wishesShortOf(180, { wishes: 42, leftoverPrimogems: 110 })).toBe(138);
  });
});
