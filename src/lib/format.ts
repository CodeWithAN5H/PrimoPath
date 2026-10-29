import { formatDisplayDate } from '../domain/dates';
import type { Confidence } from '../domain/schema';
import { SCENARIOS, type ScenarioId } from '../domain/forecast';

export function formatNumber(value: number): string {
  return Math.round(value).toLocaleString('en-US');
}

export function formatWishes(value: number): string {
  return `${formatNumber(value)} ${Math.round(value) === 1 ? 'wish' : 'wishes'}`;
}

export function formatDayCount(days: number): string {
  if (days < 0) return `${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'} overdue`;
  if (days === 0) return 'Ends today';
  return `${formatNumber(days)} day${days === 1 ? '' : 's'} left`;
}

export function formatDeadline(iso: string): string {
  return formatDisplayDate(iso);
}

export function formatClock(timestamp: number): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(timestamp));
}

export const CONFIDENCE_LABELS: Record<Confidence, string> = {
  confirmed: 'Confirmed',
  likely: 'Likely',
  uncertain: 'Uncertain',
};

export function scenarioLabel(id: ScenarioId): string {
  return SCENARIOS.find((scenario) => scenario.id === id)?.label ?? id;
}

export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return count === 1 ? singular : plural;
}
