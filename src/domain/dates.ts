/** Calendar helpers. All arithmetic is done in UTC to avoid DST drift. */

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Parses a strict `YYYY-MM-DD` string into a UTC midnight Date, or null. */
export function parseIsoDate(value: string): Date | null {
  const match = ISO_DATE.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  // Rejects impossible dates such as 2026-02-31.
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return date;
}

export function isValidIsoDate(value: string): boolean {
  return parseIsoDate(value) !== null;
}

export function formatIsoDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Today's calendar date in the user's local timezone, as `YYYY-MM-DD`. */
export function todayIsoDate(now: Date = new Date()): string {
  return formatIsoDate(
    new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())),
  );
}

export function addDays(isoDate: string, days: number): string {
  const date = parseIsoDate(isoDate);
  if (!date) return isoDate;
  date.setUTCDate(date.getUTCDate() + days);
  return formatIsoDate(date);
}

/** Whole days from `from` to `to`; negative when `to` is earlier. */
export function daysBetween(fromIso: string, toIso: string): number {
  const from = parseIsoDate(fromIso);
  const to = parseIsoDate(toIso);
  if (!from || !to) return 0;
  return Math.round((to.getTime() - from.getTime()) / 86_400_000);
}

/**
 * Number of daily income ticks between today and the deadline, inclusive of
 * both ends. Returns 0 for deadlines in the past or unparseable dates.
 */
export function incomeDays(fromIso: string, deadlineIso: string): number {
  const diff = daysBetween(fromIso, deadlineIso);
  return diff < 0 ? 0 : diff + 1;
}

/** Human-friendly date, e.g. "31 Oct 2026". */
export function formatDisplayDate(isoDate: string): string {
  const date = parseIsoDate(isoDate);
  if (!date) return 'Invalid date';
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}
