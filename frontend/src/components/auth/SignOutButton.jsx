import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';
import useAuth from '@/auth/useAuth';
import useGuardedRouter, { resetNavigationGuard } from '@/hooks/useGuardedRouter';
import { useThemeColors } from '@/theme';

const SIGN_OUT_COLOR = '#E65A3A';

/**
 * Shared member sign-out control used on Profile and Settings.
 */
export default function SignOutButton({ redirectTo = '/(auth)/welcome', style }) {
  const colors = useThemeColors();
  const { logout } = useAuth();
  const router = useGuardedRouter();
  const [loading, setLoading] = useState(false);
  const busyRef = useRef(false);

  const onPress = useCallback(async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setLoading(true);

    try {
      resetNavigationGuard();
      router.replace(redirectTo);
      await logout();
    } catch (error) {
      Alert.alert(
        'Sign out failed',
        error?.message || 'Something went wrong. Please try again.',
      );
    } finally {
      busyRef.current = false;
      setLoading(false);
    }
  }, [logout, redirectTo, router]);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: colors.primarySoft },
        pressed && styles.buttonPressed,
        style,
      ]}
      onPress={onPress}
      disabled={loading}
      accessibilityRole="button"
      accessibilityLabel="Sign out"
      accessibilityState={{ disabled: loading, busy: loading }}
    >
      <Text style={styles.label}>Sign out</Text>
      {loading ? (
        <ActivityIndicator size="small" color={SIGN_OUT_COLOR} />
      ) : (
        <Feather name="log-out" size={20} color={SIGN_OUT_COLOR} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  buttonPressed: {
    opacity: 0.92,
  },
  label: {
    fontSize: 17,
    fontWeight: '700',
    color: SIGN_OUT_COLOR,
  },
});
