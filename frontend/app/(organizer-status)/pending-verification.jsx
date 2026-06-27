import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  useWindowDimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import useAuth from '@/auth/useAuth';
import useGuardedRouter, { resetNavigationGuard } from '@/hooks/useGuardedRouter';

const ORANGE = '#FF7B3F';
const PENDING_ICON = require('@/assets/pending2.png');

const INFO_ROWS = [
  {
    icon: 'checkmark-circle-outline',
    title: 'Status',
    detail: 'Pending Review',
  },
  {
    icon: 'time-outline',
    title: 'Review time',
    detail: 'Usually within 24 hours',
  },
];

export default function PendingVerificationScreen() {
  const { logout } = useAuth();
  const router = useGuardedRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const busyRef = useRef(false);
  const { width } = useWindowDimensions();
  const heroSize = Math.min(width - 32, 380);

  const handleLogout = useCallback(async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setLoggingOut(true);

    try {
      resetNavigationGuard();
      router.replace('/(auth)/welcome');
      await logout();
    } catch (error) {
      Alert.alert(
        'Logout failed',
        error?.message || 'Something went wrong. Please try again.',
      );
    } finally {
      busyRef.current = false;
      setLoggingOut(false);
    }
  }, [logout, router]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.screen}>
        <View style={styles.content}>
          <View style={styles.headerBlock}>
            <Image
              source={PENDING_ICON}
              style={[styles.heroIcon, { width: heroSize, height: heroSize * 0.88 }]}
              resizeMode="contain"
              accessibilityIgnoresInvertColors
            />

            <Text style={styles.title}>Verification in Review</Text>
            <Text style={styles.subtitle}>
              Your verification is still under review by our team.
            </Text>
          </View>

          <View style={styles.card}>
            {INFO_ROWS.map((row) => (
              <View key={row.title} style={styles.cardRow}>
                <View style={styles.cardIconWrap}>
                  <Ionicons name={row.icon} size={20} color={ORANGE} />
                </View>
                <View style={styles.cardTextBlock}>
                  <Text style={styles.cardTitle}>{row.title}</Text>
                  <Text style={styles.cardDetail}>{row.detail}</Text>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.noticeBanner}>
            <Text style={styles.noticeText}>
              You'll receive a notification once it's approved.
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Pressable
            style={({ pressed }) => [
              styles.logoutBtn,
              pressed && styles.logoutBtnPressed,
              loggingOut && styles.logoutBtnDisabled,
            ]}
            onPress={handleLogout}
            disabled={loggingOut}
            accessibilityRole="button"
            accessibilityState={{ disabled: loggingOut, busy: loggingOut }}
          >
            {loggingOut ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.logoutLabel}>Logout</Text>
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
  content: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 8,
  },
  headerBlock: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroIcon: {
    marginBottom: -32,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 8,
  },
  card: {
    width: '100%',
    backgroundColor: '#FFF7F3',
    borderRadius: 18,
    paddingVertical: 20,
    paddingHorizontal: 18,
    gap: 18,
    marginBottom: 12,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  cardIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTextBlock: {
    flex: 1,
    paddingTop: 2,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  cardDetail: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  noticeBanner: {
    width: '100%',
    backgroundColor: '#F3F4F6',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  noticeText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  footer: {
    paddingTop: 12,
    paddingBottom: 8,
  },
  logoutBtn: {
    width: '100%',
    backgroundColor: ORANGE,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  logoutBtnPressed: {
    opacity: 0.92,
  },
  logoutBtnDisabled: {
    opacity: 0.85,
  },
  logoutLabel: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
