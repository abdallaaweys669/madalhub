import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import useGuardedRouter from '@/hooks/useGuardedRouter';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLORS } from '@/constants/loginSignin/authStyles';
import { AUTH_FORM_CANVAS } from '@/features/auth/components/welcome/welcomeTheme';
import {
  FONT_PLAYFAIR_BOLD,
  FONT_PLAYFAIR_SEMIBOLD,
} from '@/features/auth/theme/authTypography';

export default function AuthFormScaffold({
  title,
  titleAccent,
  subtitle,
  children,
  compact = false,
  welcomeStyle = false,
  showCloseButton = false,
  onClose,
  badge,
  badgeIcon,
}) {
  const router = useGuardedRouter();
  const insets = useSafeAreaInsets();
  const screenBg = welcomeStyle ? AUTH_FORM_CANVAS : COLORS.cardBg;
  const shouldShowClose = showCloseButton || welcomeStyle;

  const handleClose = () => {
    if (onClose) { onClose(); return; }
    router.replace('/(auth)/welcome');
  };

  return (
    <View style={[styles.screen, { backgroundColor: screenBg }]}>
      {shouldShowClose ? (
        <Pressable
          onPress={handleClose}
          hitSlop={12}
          style={[styles.closeButton, { top: insets.top + 8, left: 16 }]}
          accessibilityRole="button"
          accessibilityLabel="Close and return to welcome"
        >
          <View style={styles.closeButtonInner}>
            <Ionicons name="close" size={22} color="#6B7280" />
          </View>
        </Pressable>
      ) : null}

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + 52 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            {badge ? (
              <View style={styles.badge}>
                {badgeIcon ? (
                  <Ionicons
                    name={badgeIcon}
                    size={13}
                    color={COLORS.primary}
                    style={{ marginRight: 5 }}
                  />
                ) : null}
                <Text style={styles.badgeText}>{badge}</Text>
              </View>
            ) : null}

            <Text style={[styles.title, compact && styles.titleCompact]}>
              {title}
              {titleAccent ? (
                <Text style={styles.titleAccent}> {titleAccent}</Text>
              ) : null}
            </Text>

            <View style={styles.underline} />

            {subtitle ? (
              <Text style={styles.subtitle}>{subtitle}</Text>
            ) : null}
          </View>

          <View style={styles.fields}>
            {children}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    overflow: 'hidden',
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 123, 63, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255, 123, 63, 0.22)',
    marginBottom: 14,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
    color: COLORS.primary,
    textTransform: 'uppercase',
  },
  title: {
    fontFamily: FONT_PLAYFAIR_BOLD,
    fontSize: 32,
    color: COLORS.textDark,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  titleCompact: {
    fontSize: 28,
  },
  titleAccent: {
    fontFamily: FONT_PLAYFAIR_SEMIBOLD,
    color: COLORS.primary,
  },
  underline: {
    width: 160,
    height: 3,
    borderRadius: 2,
    backgroundColor: COLORS.primary,
    marginTop: 10,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14.5,
    lineHeight: 22,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 12,
    marginTop: 4,
  },
  fields: {
    width: '100%',
  },
  closeButton: {
    position: 'absolute',
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
});
