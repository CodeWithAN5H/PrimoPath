import { CalendarDays, Target } from 'lucide-react';
import { MECHANICS } from '../../domain/mechanics';
import { LIMITS, type BannerType } from '../../domain/schema';
import { firstIssueFor } from '../../domain/validation';
import { formatDayCount, formatDeadline } from '../../lib/format';
import { usePlanner } from '../../state/PlannerProvider';
import { Badge } from '../ui/Badge';
import { Card, CardHeader } from '../ui/Card';
import { DateField, NumberField, TextField, Toggle } from '../ui/fields';
import { SegmentedControl } from '../ui/SegmentedControl';

const BANNER_OPTIONS: readonly { value: BannerType; label: string }[] = [
  { value: 'character', label: 'Character' },
  { value: 'weapon', label: 'Weapon' },
];

export function TargetFormCard() {
  const { state, dispatch, view } = usePlanner();
  const plan = view.plan;
  const isCharacter = plan.bannerType === 'character';
  const hardPity = isCharacter ? MECHANICS.character.hardPity : MECHANICS.weapon.hardPity;
  const startError = firstIssueFor(view.dateIssues, 'startDate');
  const endError = firstIssueFor(view.dateIssues, 'endDate');

  return (
    <Card labelledBy="target-form-title">
      <CardHeader
        id="target-form-title"
        title="Target banner"
        description="Pick the banner type first: each type has its own pity, guarantee and deadline rules."
        icon={<Target size={16} />}
        action={
          <Badge tone={view.deadline.passed ? 'ember' : 'muted'}>
            <CalendarDays size={11} aria-hidden="true" />
            {formatDayCount(view.deadline.daysRemaining)}
          </Badge>
        }
      />

      <div className="flex flex-col gap-4">
        <div>
          <p className="label mb-1.5">Banner type</p>
          <SegmentedControl
            label="Banner type"
            value={state.activeBanner}
            options={BANNER_OPTIONS}
            onChange={(banner) => dispatch({ type: 'setActiveBanner', banner })}
          />
          <p className="mt-1.5 text-xs leading-relaxed text-faint">
            {isCharacter
              ? 'Character Event Wish: 90-wish hard pity, 50/50 featured chance, pity shared between concurrent character banners.'
              : 'Weapon Event Wish: 80-wish hard pity, Epitomized Path Fate Points for the charted weapon.'}
          </p>
        </div>

        <TextField
          id="target-name"
          label={isCharacter ? 'Character name' : 'Weapon name'}
          value={plan.targetName}
          onChange={(value) =>
            isCharacter
              ? dispatch({ type: 'updateCharacterPlan', patch: { targetName: value } })
              : dispatch({ type: 'updateWeaponPlan', patch: { targetName: value } })
          }
          placeholder={isCharacter ? 'e.g. Furina' : 'e.g. Splendor of Tranquil Waters'}
          maxLength={LIMITS.targetNameLength}
          hint="Free text. Banner names and dates are not fetched automatically."
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <DateField
            id="banner-start"
            label="Banner start"
            value={plan.startDate}
            onChange={(value) =>
              isCharacter
                ? dispatch({ type: 'updateCharacterPlan', patch: { startDate: value } })
                : dispatch({ type: 'updateWeaponPlan', patch: { startDate: value } })
            }
            error={startError?.message ?? null}
          />
          <DateField
            id="banner-end"
            label="Banner end (deadline)"
            value={plan.endDate}
            onChange={(value) =>
              isCharacter
                ? dispatch({ type: 'updateCharacterPlan', patch: { endDate: value } })
                : dispatch({ type: 'updateWeaponPlan', patch: { endDate: value } })
            }
            error={endError?.message ?? null}
            min={plan.startDate}
            hint={`Deadline ${formatDeadline(plan.endDate)}`}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <NumberField
            id="banner-pity"
            label="Current pity"
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
            <div className="flex items-end">
              <div className="w-full">
                <Toggle
                  id="banner-guaranteed"
                  label="Next 5-star is guaranteed"
                  description="Turn on if you already lost the 50/50 on this banner type."
                  checked={plan.guaranteed}
                  onChange={(guaranteed) =>
                    dispatch({ type: 'updateCharacterPlan', patch: { guaranteed } })
                  }
                />
              </div>
            </div>
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
                  dispatch({
                    type: 'updateWeaponPlan',
                    patch: { fatePoints: Number(value) },
                  })
                }
              />
              <p className="mt-1.5 text-xs leading-relaxed text-faint">
                Two Fate Points guarantee the weapon you charted on your next 5-star.
              </p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
