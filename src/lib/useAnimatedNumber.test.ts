import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { prefersReducedMotion, useAnimatedNumber } from './useAnimatedNumber';

function stubReducedMotion(reduced: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches: reduced && query.includes('prefers-reduced-motion'),
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    })),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('useAnimatedNumber', () => {
  it('jumps straight to the target when reduced motion is requested', () => {
    stubReducedMotion(true);
    expect(prefersReducedMotion()).toBe(true);

    const { result, rerender } = renderHook(({ value }) => useAnimatedNumber(value, 200), {
      initialProps: { value: 10 },
    });
    expect(result.current).toBe(10);

    rerender({ value: 42 });
    act(() => {});
    expect(result.current).toBe(42);
  });

  it('returns the initial value without animating on mount', () => {
    stubReducedMotion(false);
    const { result } = renderHook(() => useAnimatedNumber(7));
    expect(result.current).toBe(7);
  });
});
