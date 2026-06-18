import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AuthView } from '@clerk/expo/native';
import useGuardedRouter from '@/hooks/useGuardedRouter';
import useClerkBackendSync from '@/features/auth/hooks/useClerkBackendSync';
import { COLORS } from '@/constants/loginSignin/authStyles';
import { AUTH_FORM_CANVAS } from '@/features/auth/components/welcome/welcomeTheme';

export default function ClerkAuthScreen({ mode = 'signInOrUp' }) {
  const router = useGuardedRouter();
  const insets = useSafeAreaInsets();
  const { error, syncing } = useClerkBackendSync();

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <Pressable
        onPress={() => router.replace('/(auth)/welcome')}
        hitSlop={12}
        style={[styles.closeButton, { top: insets.top + 8 }]}
        accessibilityRole="button"
        accessibilityLabel="Close and return to welcome"
      >
        <View style={styles.closeButtonInner}>
          <Ionicons name="close" size={22} color="#6B7280" />
        </View>
      </Pressable>

      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {syncing ? (
        <View style={styles.syncOverlay}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.syncText}>Finishing sign-in…</Text>
        </View>
      ) : null}

      <AuthView
        mode={mode}
        isDismissible={false}
        onDismiss={() => router.replace('/(auth)/welcome')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: AUTH_FORM_CANVAS,
  },
  closeButton: {
    position: 'absolute',
    left: 16,
    zIndex: 10,
  },
  closeButtonInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
  },
  errorBanner: {
    position: 'absolute',
    top: 56,
    left: 16,
    right: 16,
    zIndex: 11,
    backgroundColor: '#FEE2E2',
    borderRadius: 10,
    padding: 12,
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 13,
    textAlign: 'center',
  },
  syncOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  syncText: {
    color: '#374151',
    fontSize: 15,
  },
});
