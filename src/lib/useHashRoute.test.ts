import { describe, expect, it } from 'vitest';
import { resolveRoute, routeHref } from './useHashRoute';

describe('resolveRoute', () => {
  it('resolves the main sections', () => {
    expect(resolveRoute('#/home')).toBe('home');
    expect(resolveRoute('#/planner')).toBe('planner');
    expect(resolveRoute('#/opportunities')).toBe('opportunities');
    expect(resolveRoute('#/simulator')).toBe('simulator');
    expect(resolveRoute('#/account')).toBe('account');
  });

  it('keeps Milestone 1 links working', () => {
    expect(resolveRoute('#/dashboard')).toBe('home');
    expect(resolveRoute('#planner')).toBe('planner');
    expect(resolveRoute('')).toBe('home');
  });

  it('falls back to home for unknown or malformed hashes', () => {
    expect(resolveRoute('#/nope')).toBe('home');
    expect(resolveRoute('#/simulator?mode=weapon')).toBe('simulator');
    expect(resolveRoute('#/')).toBe('home');
  });

  it('builds canonical hrefs', () => {
    expect(routeHref('planner')).toBe('#/planner');
    expect(routeHref('home')).toBe('#/home');
  });
});
