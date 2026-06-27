import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import useGuardedRouter, { resetNavigationGuard } from '@/hooks/useGuardedRouter';
import useAuth from '@/auth/useAuth';
import { useOrganizerVerificationSnapshot } from '@/features/organizer/verification/components/OrganizerVerificationStatusProvider';
import {
  RESUBMIT_SECTIONS,
  inferResubmitSections,
} from '@/features/organizer/verification/utils/inferResubmitSections';

const ORANGE = '#FF7B3F';

export default function ResubmitSummaryScreen() {
  const router = useGuardedRouter();
  const { logout } = useAuth();
  const snapshot = useOrganizerVerificationSnapshot();
  const rejectionReason = snapshot?.rejectionReason?.trim() ?? '';
  const loading = !snapshot;
  const [loggingOut, setLoggingOut] = useState(false);
  const busyRef = useRef(false);

  const flaggedKeys = inferResubmitSections(rejectionReason);
  const flaggedSet = new Set(flaggedKeys);

  const openSection = (step) => {
    router.push(`/(organizer-status)/verify?step=${step}&mode=section`);
  };

  const startFullWizard = () => {
    router.replace('/(organizer-status)/verify');
  };

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

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.screen}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#374151" />
          </Pressable>
          <Text style={styles.topTitle}>Resubmit Verification</Text>
          <View style={styles.backBtn} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <Text style={styles.subtitle}>
            Let's update your information and submit again.
          </Text>

          {rejectionReason ? (
            <View style={styles.noteBanner}>
              <Ionicons name="chatbox-ellipses-outline" size={18} color={ORANGE} />
              <View style={styles.noteCopy}>
                <Text style={styles.noteLabel}>Admin note</Text>
                <Text style={styles.noteText}>{rejectionReason}</Text>
              </View>
            </View>
          ) : null}

          {loading ? (
            <ActivityIndicator color={ORANGE} style={{ marginVertical: 32 }} />
          ) : (
            <View style={styles.timeline}>
              {RESUBMIT_SECTIONS.map((section, index) => {
                const needsUpdate = flaggedSet.has(section.key);
                const isLast = index === RESUBMIT_SECTIONS.length - 1;

                return (
                  <View key={section.key} style={styles.timelineRow}>
                    <View style={styles.timelineRail}>
                      <View
                        style={[
                          styles.timelineDot,
                          needsUpdate && styles.timelineDotFlagged,
                        ]}
                      />
                      {!isLast ? <View style={styles.timelineLine} /> : null}
                    </View>

                    <Pressable
                      style={({ pressed }) => [
                        styles.sectionCard,
                        needsUpdate && styles.sectionCardFlagged,
                        pressed && styles.sectionCardPressed,
                      ]}
                      onPress={() => openSection(section.step)}
                      accessibilityRole="button"
                    >
                      <View
                        style={[styles.sectionIcon, { backgroundColor: section.iconBg }]}
                      >
                        <Ionicons name={section.icon} size={22} color={section.iconColor} />
                      </View>
                      <View style={styles.sectionCopy}>
                        <View style={styles.sectionTitleRow}>
                          <Text style={styles.sectionTitle}>{section.title}</Text>
                          {needsUpdate ? (
                            <View style={styles.updateBadge}>
                              <Text style={styles.updateBadgeText}>Update</Text>
                            </View>
                          ) : null}
                        </View>
                        <Text style={styles.sectionDesc}>{section.desc}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
                    </Pressable>
                  </View>
                );
              })}
            </View>
          )}

          <Text style={styles.hint}>
            Tap a section to fix it and resubmit. Sections marked Update match the admin note.
          </Text>
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            style={({ pressed }) => [styles.startBtn, pressed && styles.btnPressed]}
            onPress={startFullWizard}
            accessibilityRole="button"
          >
            <Text style={styles.startBtnLabel}>Start Again</Text>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
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
              <ActivityIndicator color="#374151" />
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
  screen: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    lineHeight: 22,
    marginBottom: 16,
  },
  noteBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#FFF7F3',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,123,63,0.2)',
    marginBottom: 20,
  },
  noteCopy: { flex: 1, gap: 4 },
  noteLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  noteText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  timeline: {
    gap: 0,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 12,
  },
  timelineRail: {
    width: 20,
    alignItems: 'center',
    paddingTop: 22,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#E5E7EB',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  timelineDotFlagged: {
    backgroundColor: ORANGE,
  },
  timelineLine: {
    flex: 1,
    width: 2,
    backgroundColor: '#E5E7EB',
    marginTop: 4,
    marginBottom: -4,
  },
  sectionCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#F1F5F9',
    padding: 14,
    marginBottom: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  sectionCardFlagged: {
    borderColor: 'rgba(255,123,63,0.35)',
    backgroundColor: '#FFFBF8',
  },
  sectionCardPressed: {
    opacity: 0.92,
  },
  sectionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionCopy: {
    flex: 1,
    gap: 2,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  updateBadge: {
    backgroundColor: '#FFF0E8',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  updateBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: ORANGE,
  },
  sectionDesc: {
    fontSize: 13,
    color: '#94A3B8',
    lineHeight: 18,
  },
  hint: {
    fontSize: 13,
    color: '#9CA3AF',
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 8,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  startBtn: {
    backgroundColor: ORANGE,
    borderRadius: 14,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: ORANGE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  startBtnLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  logoutBtn: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  logoutBtnPressed: {
    backgroundColor: '#F9FAFB',
  },
  logoutBtnDisabled: {
    opacity: 0.7,
  },
  logoutLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
  btnPressed: {
    opacity: 0.92,
  },
});
