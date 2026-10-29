import { describe, expect, it } from 'vitest';
import { parseIntegerField, validatePlanDates } from './validation';

describe('parseIntegerField', () => {
  const pity = { min: 0, max: 89, label: 'Current pity' };

  it('accepts whole numbers in range', () => {
    expect(parseIntegerField('42', pity)).toEqual({ value: 42, error: null });
    expect(parseIntegerField(' 0 ', pity)).toEqual({ value: 0, error: null });
  });

  it('tolerates thousands separators', () => {
    expect(
      parseIntegerField('1,750', { min: 0, max: 9_999_999, label: 'Primogems' }),
    ).toEqual({ value: 1750, error: null });
  });

  it('rejects empty input', () => {
    expect(parseIntegerField('', pity)).toEqual({
      value: null,
      error: 'Current pity is required.',
    });
  });

  it('rejects non-numeric and decimal input', () => {
    expect(parseIntegerField('abc', pity).value).toBeNull();
    expect(parseIntegerField('12.5', pity).error).toContain('decimal');
  });

  it('rejects out-of-range pity values instead of silently clamping', () => {
    expect(parseIntegerField('90', pity).error).toContain('between 0 and 89');
    expect(parseIntegerField('-1', pity).error).toContain('between 0 and 89');
  });
});

describe('validatePlanDates', () => {
  it('accepts a valid range', () => {
    const result = validatePlanDates(
      { startDate: '2026-10-01', endDate: '2026-10-21' },
      '2026-10-05',
    );
    expect(result.issues).toHaveLength(0);
    expect(result.blocking).toBe(false);
  });

  it('rejects impossible calendar dates', () => {
    const result = validatePlanDates(
      { startDate: '2026-02-31', endDate: '2026-03-10' },
      '2026-02-01',
    );
    expect(result.blocking).toBe(true);
    expect(result.issues[0]?.field).toBe('startDate');
  });

  it('rejects an end date before the start date', () => {
    const result = validatePlanDates(
      { startDate: '2026-10-21', endDate: '2026-10-01' },
      '2026-10-05',
    );
    expect(result.blocking).toBe(true);
    expect(result.issues.some((issue) => issue.message.includes('earlier than the start'))).toBe(
      true,
    );
  });

  it('warns — but does not block — when the deadline has passed', () => {
    const result = validatePlanDates(
      { startDate: '2026-09-01', endDate: '2026-09-20' },
      '2026-10-05',
    );
    expect(result.blocking).toBe(false);
    expect(result.issues[0]?.severity).toBe('warning');
    expect(result.issues[0]?.message).toContain('already ended');
  });
});
