import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  ScrollView,
  useWindowDimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import useAuth from '@/auth/useAuth';
import useGuardedRouter, { resetNavigationGuard } from '@/hooks/useGuardedRouter';

const ORANGE = '#FF7B3F';
const SUBMITTED_ICON = require('@/assets/submitted.png');

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
  {
    icon: 'notifications-outline',
    title: "You'll get a notification",
    detail: "once it's approved.",
  },
];

export default function VerificationSubmittedScreen() {
  const { logout } = useAuth();
  const router = useGuardedRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const busyRef = useRef(false);
  const { width } = useWindowDimensions();
  const heroSize = Math.min(width - 48, 320);

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
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={styles.headerBlock}>
            <Image
              source={SUBMITTED_ICON}
              style={[styles.heroIcon, { width: heroSize, height: heroSize * 0.82 }]}
              resizeMode="contain"
              accessibilityIgnoresInvertColors
            />

            <Text style={styles.title}>Verification Submitted!</Text>
            <Text style={styles.subtitle}>
              Thank you! Your verification request has been received.
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
        </ScrollView>

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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerBlock: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 24,
  },
  heroIcon: {
    marginBottom: -28,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 12,
  },
  card: {
    width: '100%',
    backgroundColor: '#F3F4FF',
    borderRadius: 18,
    paddingVertical: 22,
    paddingHorizontal: 18,
    gap: 20,
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
  footer: {
    paddingTop: 12,
    paddingBottom: 8,
  },
  logoutLabel: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
