import { useEffect, useMemo, useRef } from 'react';
import { useRootNavigationState, useRouter } from 'expo-router';

/** Short burst guard for back / dismiss actions. */
const NAVIGATION_GUARD_MS = 800;

/** Longer guard when pushing the same screen again (survives remounts). */
const SAME_ROUTE_GUARD_MS = 2000;

let globalLastNavAt = 0;
let globalLastSignature = '';

/** Clears the debounce guard (e.g. before sign-out navigation). */
export function resetNavigationGuard() {
  globalLastNavAt = 0;
  globalLastSignature = '';
}

function getNavSignature(method, args) {
  const target = args[0];
  if (typeof target === 'string') return `${method}:${target}`;
  if (target && typeof target === 'object') {
    const pathname = target.pathname ?? '';
    const params = target.params ? JSON.stringify(target.params) : '';
    return `${method}:${pathname}:${params}`;
  }
  return `${method}:${String(target ?? '')}`;
}

function isNavigationBlocked(method, args) {
  const now = Date.now();
  const signature = getNavSignature(method, args);

  if (['push', 'replace', 'navigate'].includes(method)) {
    if (signature === globalLastSignature && now - globalLastNavAt < SAME_ROUTE_GUARD_MS) {
      return true;
    }
  } else if (now - globalLastNavAt < NAVIGATION_GUARD_MS) {
    return true;
  }

  globalLastNavAt = now;
  globalLastSignature = signature;
  return false;
}

function runNavigation(router, method, args) {
  if (isNavigationBlocked(method, args)) return undefined;
  return router[method](...args);
}

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
  const pendingNavRef = useRef(null);
  const routerRef = useRef(router);

  routerRef.current = router;

  useEffect(() => {
    if (!isNavigationReady || !pendingNavRef.current) return;

    const { method, args } = pendingNavRef.current;
    pendingNavRef.current = null;
    runNavigation(routerRef.current, method, args);
  }, [isNavigationReady]);

  return useMemo(() => {
    const guard = (method) => {
      return (...args) => {
        if (!isNavigationReady) {
          pendingNavRef.current = { method, args };
          return undefined;
        }

        return runNavigation(router, method, args);
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
