import { DateField } from '../ui/fields';
import { Disclosure } from '../ui/Disclosure';
import { ItemCombobox } from '../ui/ItemCombobox';
import { SegmentedControl } from '../ui/SegmentedControl';
import type { BannerType } from '../../domain/schema';
import { firstIssueFor } from '../../domain/validation';
import { formatDayCount } from '../../lib/format';
import { usePlanner } from '../../state/PlannerProvider';

const BANNER_OPTIONS: readonly { value: BannerType; label: string }[] = [
  { value: 'character', label: 'Character' },
  { value: 'weapon', label: 'Weapon' },
];

export function TargetSection() {
  const { state, dispatch, view } = usePlanner();
  const plan = view.plan;
  const isCharacter = plan.bannerType === 'character';
  const startIssue = firstIssueFor(view.dateIssues, 'startDate');
  const endIssue = firstIssueFor(view.dateIssues, 'endDate');

  const updateTarget = (targetName: string) =>
    isCharacter
      ? dispatch({ type: 'updateCharacterPlan', patch: { targetName } })
      : dispatch({ type: 'updateWeaponPlan', patch: { targetName } });

  const updateStart = (startDate: string) =>
    isCharacter
      ? dispatch({ type: 'updateCharacterPlan', patch: { startDate } })
      : dispatch({ type: 'updateWeaponPlan', patch: { startDate } });

  const updateEnd = (endDate: string) =>
    isCharacter
      ? dispatch({ type: 'updateCharacterPlan', patch: { endDate } })
      : dispatch({ type: 'updateWeaponPlan', patch: { endDate } });

  return (
    <Disclosure
      id="planner-target"
      title="A · Target banner"
      subtitle="Banner type, the target you are saving for, and its dates."
      defaultOpen
      summary={
        <span className="hidden max-w-[8rem] truncate text-[11px] text-faint sm:inline">
          {plan.targetName.trim() || 'No target yet'}
        </span>
      }
    >
      <div className="flex flex-col gap-4">
        <div>
          <p className="label mb-1.5">Banner type</p>
          <SegmentedControl
            label="Banner type"
            value={state.activeBanner}
            options={BANNER_OPTIONS}
            onChange={(banner) => dispatch({ type: 'setActiveBanner', banner })}
          />
          <p className="mt-1.5 text-[11px] leading-relaxed text-faint">
            {isCharacter
              ? 'Character Event Wish: 90-wish hard pity, 50/50 featured chance, pity shared between concurrent character banners.'
              : 'Weapon Event Wish: 80-wish hard pity, Epitomized Path Fate Points for the charted weapon.'}
          </p>
        </div>

        <ItemCombobox
          id="target-name"
          label={isCharacter ? 'Character target' : 'Weapon target'}
          kind={isCharacter ? 'character' : 'weapon'}
          value={plan.targetName}
          onChange={updateTarget}
          hint="Search by part of the name. A typo is tolerated; anything else can be kept as a custom target."
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <DateField
            id="banner-start"
            label="Banner start"
            value={plan.startDate}
            onChange={updateStart}
            error={startIssue?.message ?? null}
          />
          <DateField
            id="banner-end"
            label="Banner end (deadline)"
            value={plan.endDate}
            onChange={updateEnd}
            error={endIssue?.message ?? null}
            min={plan.startDate}
            hint={formatDayCount(view.deadline.daysRemaining)}
          />
        </div>

        <p className="text-[11px] leading-relaxed text-faint">
          Banner dates are entered by hand. PrimoPath does not fetch live banner schedules.
        </p>
      </div>
    </Disclosure>
  );
}
