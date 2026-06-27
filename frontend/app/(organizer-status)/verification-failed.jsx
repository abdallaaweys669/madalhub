import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import useGuardedRouter, { resetNavigationGuard } from '@/hooks/useGuardedRouter';
import useAuth from '@/auth/useAuth';
import { useOrganizerVerificationSnapshot } from '@/features/organizer/verification/components/OrganizerVerificationStatusProvider';
import RejectedSvg from '@/assets/rejected.svg';

const ORANGE = '#FF7B3F';
const RED = '#DC2626';
const DEFAULT_REASON =
  'Please provide more information or a valid supporting document.';

export default function VerificationFailedScreen() {
  const router = useGuardedRouter();
  const { logout } = useAuth();
  const { width } = useWindowDimensions();
  const heroWidth = Math.min(width - 80, 280);
  const snapshot = useOrganizerVerificationSnapshot();
  const [loggingOut, setLoggingOut] = useState(false);
  const busyRef = useRef(false);

  const reason = snapshot?.rejectionReason?.trim() ?? '';

  const handleLogout = useCallback(async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setLoggingOut(true);

    try {
      resetNavigationGuard();
      router.replace('/(auth)/welcome');
      await logout();
    } finally {
      busyRef.current = false;
      setLoggingOut(false);
    }
  }, [logout, router]);

  const displayReason = reason || DEFAULT_REASON;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.screen}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <Text style={styles.brand}>MadalHub</Text>

          <View style={styles.statusCard}>
            <View style={[styles.heroWrap, { width: heroWidth, height: heroWidth * 0.72 }]}>
              <RejectedSvg width="100%" height="100%" />
            </View>

            <Text style={styles.statusTitle}>Verification Rejected</Text>
            <Text style={styles.statusSub}>
              Please review the reason below and resubmit.
            </Text>

            <View style={styles.noteBox}>
              <Text style={styles.noteLabel}>Admin note</Text>
              <Text style={styles.noteText}>{displayReason}</Text>
            </View>
          </View>

          <Text style={styles.body}>
            Don't worry — you can fix the issue and resubmit. The review team will
            look at your new submission right away.
          </Text>
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            style={({ pressed }) => [styles.resubmitBtn, pressed && styles.btnPressed]}
            onPress={() => router.push('/(organizer-status)/resubmit-summary')}
            accessibilityRole="button"
          >
            <Text style={styles.resubmitLabel}>Resubmit Verification</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.logoutBtn,
              pressed && styles.logoutBtnPressed,
              loggingOut && styles.logoutBtnDisabled,
            ]}
            onPress={handleLogout}
            disabled={loggingOut}
            accessibilityRole="button"
          >
            {loggingOut ? (
              <ActivityIndicator color="#6B7280" />
            ) : (
              <Text style={styles.logoutLabel}>Log out</Text>
            )}
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  screen: {
    flex: 1,
    paddingHorizontal: 24,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 8,
    paddingBottom: 16,
    alignItems: 'center',
  },
  brand: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
    letterSpacing: -0.3,
    marginBottom: 20,
  },
  statusCard: {
    width: '100%',
    backgroundColor: '#FEF2F2',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#FECACA',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 22,
    alignItems: 'center',
    shadowColor: RED,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 2,
  },
  heroWrap: {
    alignSelf: 'center',
    marginBottom: 8,
  },
  statusTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: RED,
    textAlign: 'center',
    letterSpacing: -0.2,
    marginBottom: 6,
  },
  statusSub: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  noteBox: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    gap: 6,
  },
  noteLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  noteText: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
    fontWeight: '500',
  },
  body: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 20,
    paddingHorizontal: 8,
  },
  footer: {
    paddingTop: 12,
    paddingBottom: 8,
    gap: 12,
  },
  resubmitBtn: {
    width: '100%',
    backgroundColor: ORANGE,
    borderRadius: 14,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: ORANGE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 4,
  },
  resubmitLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  logoutBtn: {
    width: '100%',
    minHeight: 50,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutBtnPressed: {
    backgroundColor: '#F9FAFB',
  },
  logoutBtnDisabled: {
    opacity: 0.7,
  },
  logoutLabel: {
    fontSize: 15,
    color: '#374151',
    fontWeight: '600',
  },
  btnPressed: {
    opacity: 0.92,
  },
});
