import { useCallback, useRef } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect, useSegments } from 'expo-router';

import { getOrganizerStatus } from '@/api/organizer';
import useGuardedRouter from '@/hooks/useGuardedRouter';
import useAuth from '@/auth/useAuth';
import { resolveOrganizerEntryHref } from '@/navigation/organizerGate';

const POLL_INTERVAL_MS = 12_000;

const SYNC_SEGMENTS = new Set([
  'verification-submitted',
  'pending-verification',
  'verification-failed',
  'resubmit-summary',
  'verification-approved',
]);

function getStatusSegment(segments) {
  for (let i = segments.length - 1; i >= 0; i -= 1) {
    if (SYNC_SEGMENTS.has(segments[i])) return segments[i];
  }
  return null;
}

function isOnScreenForStatus(segment, status) {
  if (status === 'pending') {
    return segment === 'pending-verification' || segment === 'verification-submitted';
  }
  if (status === 'rejected') {
    return segment === 'verification-failed' || segment === 'resubmit-summary';
  }
  if (status === 'approved') {
    return segment === 'verification-approved';
  }
  if (status === 'unverified') {
    return segment === 'welcome' || segment === 'verify';
  }
  return false;
}

/**
 * Polls organizer verification status while a status screen is focused and
 * navigates when admin approves, rejects, or moves the user back to pending.
 */
export default function useOrganizerVerificationStatusSync({ onStatusSnapshot } = {}) {
  const router = useGuardedRouter();
  const { user } = useAuth();
  const segments = useSegments();
  const segment = getStatusSegment(segments);
  const onSnapshotRef = useRef(onStatusSnapshot);
  onSnapshotRef.current = onStatusSnapshot;

  useFocusEffect(
    useCallback(() => {
      if (!segment) return undefined;

      let cancelled = false;
      let intervalId = null;

      const poll = async () => {
        if (cancelled || AppState.currentState !== 'active') return;

        try {
          const data = await getOrganizerStatus();
          if (cancelled || !data) return;

          const status = String(data.verificationStatus ?? 'unverified').toLowerCase();
          onSnapshotRef.current?.(data);

          if (!isOnScreenForStatus(segment, status)) {
            router.replace(await resolveOrganizerEntryHref(status, data.userId ?? user?.id));
          }
        } catch {
          // Ignore transient poll errors — next tick will retry.
        }
      };

      void poll();
      intervalId = setInterval(poll, POLL_INTERVAL_MS);

      const subscription = AppState.addEventListener('change', (nextState) => {
        if (nextState === 'active') void poll();
      });

      return () => {
        cancelled = true;
        if (intervalId) clearInterval(intervalId);
        subscription.remove();
      };
    }, [router, segment, user?.id]),
  );
}
