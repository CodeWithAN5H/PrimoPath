import { formatDayCount, formatNumber } from '../../lib/format';
import { formatDisplayDate } from '../../domain/dates';
import type { Opportunity } from '../../domain/opportunity';

export function rewardLabel(
  opportunity: Opportunity,
  remainingPrimogems?: number,
  remainingMaxPrimogems?: number,
): string {
  const primogems = remainingPrimogems ?? opportunity.reward.primogems;
  const maximum = remainingMaxPrimogems ?? opportunity.reward.primogemsMax;
  const parts: string[] = [
    maximum === undefined
      ? `${formatNumber(primogems)} Primogems`
      : `${formatNumber(primogems)} Primogems counted`,
  ];
  if (maximum !== undefined && maximum > primogems) {
    parts.push(`(up to ${formatNumber(maximum)} with full completion)`);
  }
  if (opportunity.reward.fates > 0) parts.push(`+ ${formatNumber(opportunity.reward.fates)} Fates`);
  return parts.join(' ');
}

export function effortLabel(minutes: number): string {
  if (minutes < 60) return `~${minutes} min`;
  const hours = minutes / 60;
  return `~${Number.isInteger(hours) ? hours : hours.toFixed(1)} h`;
}

function ordinal(day: number): string {
  if (day % 100 >= 11 && day % 100 <= 13) return `${day}th`;
  switch (day % 10) {
    case 1:
      return `${day}st`;
    case 2:
      return `${day}nd`;
    case 3:
      return `${day}rd`;
    default:
      return `${day}th`;
  }
}

export function recurrenceLabel(opportunity: Opportunity): string {
  switch (opportunity.recurrence.kind) {
    case 'daily':
      return 'Repeats daily';
    case 'monthly':
      return `Resets monthly on the ${opportunity.recurrence.days.map(ordinal).join(' & ')}`;
    case 'once':
    default:
      return 'One-time';
  }
}

export function availabilityLabel(opportunity: Opportunity, daysRemaining: number | null): string {
  if (opportunity.availableUntil) {
    return `Until ${formatDisplayDate(opportunity.availableUntil)}${
      daysRemaining !== null ? ` · ${formatDayCount(daysRemaining)}` : ''
    }`;
  }
  if (opportunity.availableFrom) {
    return `From ${formatDisplayDate(opportunity.availableFrom)}`;
  }
  return 'No end date';
}

export function priorityLabel(priority: 'high' | 'medium' | 'low'): string {
  return priority === 'high' ? 'High priority' : priority === 'medium' ? 'Medium priority' : 'Low priority';
}
