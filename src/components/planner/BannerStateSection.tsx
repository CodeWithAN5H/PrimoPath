import { Disclosure } from '../ui/Disclosure';
import { NumberField, Toggle } from '../ui/fields';
import { SegmentedControl } from '../ui/SegmentedControl';
import { MECHANICS } from '../../domain/mechanics';
import { usePlanner } from '../../state/PlannerProvider';

export function BannerStateSection() {
  const { dispatch, view } = usePlanner();
  const plan = view.plan;
  const isCharacter = plan.bannerType === 'character';
  const hardPity = isCharacter ? MECHANICS.character.hardPity : MECHANICS.weapon.hardPity;
  const pityPercent = Math.min(100, Math.round((plan.pity / hardPity) * 100));

  const stateSummary = isCharacter
    ? `${plan.pity} pity · ${plan.guaranteed ? 'guaranteed' : '50/50'}`
    : `${plan.pity} pity · ${plan.fatePoints} FP`;

  return (
    <Disclosure
      id="planner-state"
      title="C · Banner state"
      subtitle="Pity and guarantee status decide the worst-case budget."
      summary={<span className="num text-[11px] font-medium text-muted">{stateSummary}</span>}
    >
      <div className="flex flex-col gap-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <NumberField
            id="banner-pity"
            label="Current pity"
            srSuffix="wishes since the last five star"
            value={plan.pity}
            onChange={(value) =>
              isCharacter
                ? dispatch({ type: 'updateCharacterPlan', patch: { pity: value } })
                : dispatch({ type: 'updateWeaponPlan', patch: { pity: value } })
            }
            min={0}
            max={hardPity - 1}
            suffix={`/ ${hardPity}`}
            hint={`Wishes since your last 5-star. Hard pity is ${hardPity}.`}
          />

          {isCharacter ? (
            <Toggle
              id="banner-guaranteed"
              label="Next 5-star is guaranteed"
              description="On if you already lost the 50/50."
              checked={plan.guaranteed}
              onChange={(guaranteed) =>
                dispatch({ type: 'updateCharacterPlan', patch: { guaranteed } })
              }
            />
          ) : (
            <div>
              <p className="label mb-1.5">Epitomized Path Fate Points</p>
              <SegmentedControl
                label="Epitomized Path Fate Points"
                value={String(plan.fatePoints)}
                options={[
                  { value: '0', label: '0' },
                  { value: '1', label: '1' },
                  { value: '2', label: '2' },
                ]}
                onChange={(value) =>
                  dispatch({ type: 'updateWeaponPlan', patch: { fatePoints: Number(value) } })
                }
              />
              <p className="mt-1.5 text-[11px] leading-relaxed text-faint">
                Two Fate Points guarantee the weapon you charted on your next 5-star.
              </p>
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-muted">Pity progress</span>
            <span className="num text-faint">
              {plan.pity} / {hardPity}
            </span>
          </div>
          <div
            role="progressbar"
            aria-label="Pity progress toward hard pity"
            aria-valuemin={0}
            aria-valuemax={hardPity}
            aria-valuenow={plan.pity}
            aria-valuetext={`${plan.pity} of ${hardPity} wishes since the last 5-star`}
            className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-void/80"
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-accent-deep to-accent transition-[width] duration-500 ease-out"
              style={{ width: `${pityPercent}%` }}
            />
          </div>
        </div>

        <p className="rounded-xl border border-line-soft bg-abyss/40 px-3.5 py-2.5 text-[11px] leading-relaxed text-faint">
          {isCharacter
            ? 'Character pity carries across concurrent character banners. Character and weapon pity are never mixed.'
            : 'Weapon pity and Fate Points only apply to the Weapon Event Wish; they are never mixed with character pity.'}
        </p>
      </div>
    </Disclosure>
  );
}
