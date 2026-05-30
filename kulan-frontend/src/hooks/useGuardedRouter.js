import { useMemo, useRef } from 'react';
import { useRouter } from 'expo-router';

/**
 * Window (ms) during which a second navigation call is ignored.
 * Covers the screen transition so a rapid double-tap can't stack
 * the same screen twice.
 */
const NAVIGATION_GUARD_MS = 800;

/**
 * Drop-in replacement for expo-router's `useRouter` that debounces
 * navigation actions. Prevents the "screen opens twice" bug caused by
 * double-tapping a button before the first transition finishes.
 *
 * Same API as `useRouter` (push / replace / navigate / back / etc.),
 * so existing call sites work unchanged.
 */
export default function useGuardedRouter() {
  const router = useRouter();
  const lastNavRef = useRef(0);

  return useMemo(() => {
    const guard = (fn) => {
      if (typeof fn !== 'function') return fn;
      return (...args) => {
        const now = Date.now();
        if (now - lastNavRef.current < NAVIGATION_GUARD_MS) return undefined;
        lastNavRef.current = now;
        return fn(...args);
      };
    };

    return {
      ...router,
      push: guard(router.push),
      replace: guard(router.replace),
      navigate: guard(router.navigate),
      back: guard(router.back),
      dismiss: guard(router.dismiss),
      dismissAll: guard(router.dismissAll),
    };
  }, [router]);
}
