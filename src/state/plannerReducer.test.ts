import { describe, expect, it } from 'vitest';
import { createDefaultState, type OneTimeReward } from '../domain/schema';
import { plannerReducer } from './plannerReducer';

const base = createDefaultState('2026-10-01', '2026-10-21');

const reward: OneTimeReward = {
  id: 'reward-1',
  label: 'Web event',
  primogems: 120,
  fates: 0,
  confidence: 'confirmed',
};

describe('plannerReducer rewards', () => {
  it('adds a reward once and ignores duplicate ids', () => {
    const added = plannerReducer(base, { type: 'addReward', reward });
    expect(added.oneTimeRewards).toHaveLength(1);
    const duplicated = plannerReducer(added, { type: 'addReward', reward });
    expect(duplicated.oneTimeRewards).toHaveLength(1);
  });

  it('updates reward values without changing the id', () => {
    const added = plannerReducer(base, { type: 'addReward', reward });
    const updated = plannerReducer(added, {
      type: 'updateReward',
      id: 'reward-1',
      patch: { primogems: 300, confidence: 'uncertain', id: 'hijacked' } as never,
    });
    expect(updated.oneTimeRewards[0]).toMatchObject({
      id: 'reward-1',
      primogems: 300,
      confidence: 'uncertain',
    });
  });

  it('removes only the targeted reward', () => {
    const added = plannerReducer(
      plannerReducer(base, { type: 'addReward', reward }),
      { type: 'addReward', reward: { ...reward, id: 'reward-2', label: 'Second' } },
    );
    const removed = plannerReducer(added, { type: 'removeReward', id: 'reward-1' });
    expect(removed.oneTimeRewards.map((item) => item.id)).toEqual(['reward-2']);
  });
});

describe('plannerReducer plans', () => {
  it('keeps character and weapon plans independent', () => {
    const withCharacter = plannerReducer(base, {
      type: 'updateCharacterPlan',
      patch: { pity: 55, guaranteed: true, targetName: 'Furina' },
    });
    const withWeapon = plannerReducer(withCharacter, {
      type: 'updateWeaponPlan',
      patch: { pity: 12, fatePoints: 2, targetName: 'Key of Khaj-Nisut' },
    });

    expect(withWeapon.characterPlan.pity).toBe(55);
    expect(withWeapon.characterPlan.guaranteed).toBe(true);
    expect(withWeapon.weaponPlan.pity).toBe(12);
    expect(withWeapon.weaponPlan.fatePoints).toBe(2);
    expect(withWeapon.activeBanner).toBe('character');
  });

  it('cannot change a plan banner type through a patch', () => {
    const updated = plannerReducer(base, {
      type: 'updateCharacterPlan',
      patch: { bannerType: 'weapon' } as never,
    });
    expect(updated.characterPlan.bannerType).toBe('character');
  });

  it('switches the active banner without touching stored plans', () => {
    const switched = plannerReducer(base, { type: 'setActiveBanner', banner: 'weapon' });
    expect(switched.activeBanner).toBe('weapon');
    expect(switched.characterPlan).toEqual(base.characterPlan);
  });
});
