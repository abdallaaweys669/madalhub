import { useEffect, useMemo, useRef } from 'react';
import { useRootNavigationState, useRouter } from 'expo-router';

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
 * Also defers navigation until the root navigator has mounted, which
 * avoids crashes during Fast Refresh or other early lifecycle calls.
 *
 * Same API as `useRouter` (push / replace / navigate / back / etc.),
 * so existing call sites work unchanged.
 */
export default function useGuardedRouter() {
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();
  const isNavigationReady = Boolean(rootNavigationState?.key);
  const lastNavRef = useRef(0);
  const pendingNavRef = useRef(null);
  const routerRef = useRef(router);

  routerRef.current = router;

  useEffect(() => {
    if (!isNavigationReady || !pendingNavRef.current) return;

    const { method, args } = pendingNavRef.current;
    pendingNavRef.current = null;

    const now = Date.now();
    if (now - lastNavRef.current < NAVIGATION_GUARD_MS) return;
    lastNavRef.current = now;

    routerRef.current[method](...args);
  }, [isNavigationReady]);

  return useMemo(() => {
    const guard = (method) => {
      return (...args) => {
        if (!isNavigationReady) {
          pendingNavRef.current = { method, args };
          return undefined;
        }

        const now = Date.now();
        if (now - lastNavRef.current < NAVIGATION_GUARD_MS) return undefined;
        lastNavRef.current = now;
        return router[method](...args);
      };
    };

    return {
      ...router,
      push: guard('push'),
      replace: guard('replace'),
      navigate: guard('navigate'),
      back: guard('back'),
      dismiss: guard('dismiss'),
      dismissAll: guard('dismissAll'),
    };
  }, [router, isNavigationReady]);
}
