import { useEffect, useRef, useState } from 'react';

/** True when the OS asks for reduced motion. Safe on the server and in tests. */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Eases a displayed number toward its latest value with requestAnimationFrame.
 *
 * Kept in a hook rather than an animation library: this is the only animation
 * that cannot be expressed with CSS, and it must be skipped entirely for users
 * who ask for reduced motion.
 */
export function useAnimatedNumber(target: number, duration = 520): number {
  const [displayed, setDisplayed] = useState(target);
  const displayedRef = useRef(target);
  displayedRef.current = displayed;

  useEffect(() => {
    if (!Number.isFinite(target)) {
      setDisplayed(target);
      return;
    }
    if (prefersReducedMotion()) {
      setDisplayed(target);
      return;
    }

    const from = displayedRef.current;
    if (from === target) {
      setDisplayed(target);
      return;
    }

    const started = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const progress = Math.min(1, (now - started) / duration);
      const eased = 1 - (1 - progress) ** 3;
      setDisplayed(progress === 1 ? target : from + (target - from) * eased);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);

  return displayed;
}
