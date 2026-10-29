import { isValidIsoDate } from './dates';
import type { Plan } from './schema';

export type Severity = 'error' | 'warning';

export interface FieldIssue {
  field: string;
  message: string;
  severity: Severity;
}

export interface IntegerFieldSpec {
  min: number;
  max: number;
  label: string;
}

export interface IntegerFieldResult {
  value: number | null;
  error: string | null;
}

/**
 * Parses a free-text integer field without silently accepting bad input.
 * Thousands separators and surrounding whitespace are tolerated; decimals,
 * negatives and out-of-range values are rejected with an actionable message.
 */
export function parseIntegerField(raw: string, spec: IntegerFieldSpec): IntegerFieldResult {
  const cleaned = raw.replace(/[,\s]/g, '');
  if (cleaned === '') {
    return { value: null, error: `${spec.label} is required.` };
  }
  if (!/^-?\d+(\.\d+)?$/.test(cleaned)) {
    return { value: null, error: `${spec.label} must be a whole number.` };
  }
  if (!/^-?\d+$/.test(cleaned)) {
    return { value: null, error: `${spec.label} must be a whole number, not a decimal.` };
  }
  const parsed = Number(cleaned);
  if (!Number.isSafeInteger(parsed)) {
    return { value: null, error: `${spec.label} is out of range.` };
  }
  if (parsed < spec.min || parsed > spec.max) {
    return {
      value: null,
      error: `${spec.label} must be between ${spec.min.toLocaleString('en-US')} and ${spec.max.toLocaleString('en-US')}.`,
    };
  }
  return { value: parsed, error: null };
}

export type DateField = 'startDate' | 'endDate';

/** Validates the banner date range. Errors block calculations; warnings do not. */
export function validatePlanDates(
  plan: Pick<Plan, 'startDate' | 'endDate'>,
  today: string,
): { issues: FieldIssue[]; blocking: boolean } {
  const issues: FieldIssue[] = [];

  if (!isValidIsoDate(plan.startDate)) {
    issues.push({
      field: 'startDate',
      message: 'Enter a valid banner start date.',
      severity: 'error',
    });
  }
  if (!isValidIsoDate(plan.endDate)) {
    issues.push({
      field: 'endDate',
      message: 'Enter a valid banner end date.',
      severity: 'error',
    });
  }

  const blocking =
    !isValidIsoDate(plan.startDate) || !isValidIsoDate(plan.endDate);
  if (blocking) return { issues, blocking: true };

  if (plan.endDate < plan.startDate) {
    issues.push({
      field: 'endDate',
      message: 'The end date cannot be earlier than the start date.',
      severity: 'error',
    });
    return { issues, blocking: true };
  }

  if (plan.endDate < today) {
    issues.push({
      field: 'endDate',
      message: 'This banner has already ended, so no future income is projected.',
      severity: 'warning',
    });
  }

  if (plan.startDate > plan.endDate) {
    issues.push({
      field: 'startDate',
      message: 'The start date cannot be after the end date.',
      severity: 'error',
    });
  }

  return { issues, blocking: false };
}

export function firstIssueFor(issues: readonly FieldIssue[], field: string): FieldIssue | null {
  return issues.find((issue) => issue.field === field) ?? null;
}
