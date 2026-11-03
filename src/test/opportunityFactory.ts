import { opportunitySchema, type Opportunity } from '../domain/opportunity';

/** Shared fixture for opportunity domain tests. */
export function makeOpportunity(overrides: Partial<Opportunity> = {}): Opportunity {
  return opportunitySchema.parse({
    id: 'event-a',
    name: 'Example event',
    description: 'An example',
    category: 'event',
    reward: { primogems: 800, fates: 0 },
    effortMinutes: 60,
    recurrence: { kind: 'once' },
    prerequisites: [],
    tracking: 'completion',
    verification: 'verified',
    sourceUrl: 'https://example.com/rewards',
    sourceLabel: 'Example source',
    verifiedOn: '2026-10-01',
    isCustom: false,
    ...overrides,
  });
}
