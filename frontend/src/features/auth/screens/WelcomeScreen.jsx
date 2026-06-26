import React, { useCallback } from 'react';
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import useGuardedRouter, { resetNavigationGuard } from '@/hooks/useGuardedRouter';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { Ionicons } from '@expo/vector-icons';

import useAuth from '@/auth/useAuth';
import { COLORS } from '@/constants/loginSignin/authStyles';
import { getMemberTabsReturnHref } from '@/navigation/memberTabsReturn';
import { GUEST_EXPLORE_HREF, markGuestWelcomeSeen } from '@/navigation/guestWelcome';
import { getOrganizerEntryHref } from '@/navigation/organizerGate';
import WelcomeAuthActions from '@/features/auth/components/welcome/WelcomeAuthActions';
import {
  authFontAssets,
  FONT_JAKARTA_BOLD,
  FONT_JAKARTA_REGULAR,
} from '@/features/auth/theme/authTypography';

const WELCOME_BG = require('@/assets/welcome bg.png');
const MADALHUB_LOGO = require('@/assets/madalhub_logo.png');

export default function WelcomeScreen() {
  const router = useGuardedRouter();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const { firstLaunch } = useLocalSearchParams();
  const { isLoggedIn, isOrganizer, organizerStatus } = useAuth();

  const [fontsLoaded] = useFonts(authFontAssets);

  const isCompact = height < 760;
  const isFirstLaunch = firstLaunch === '1' || firstLaunch === 'true';

  const handleBrowseAsGuest = useCallback(async () => {
    resetNavigationGuard();
    await markGuestWelcomeSeen();
    router.replace(GUEST_EXPLORE_HREF);
  }, [router]);

  const handleCancel = () => {
    resetNavigationGuard();

    if (isLoggedIn && isOrganizer) {
      router.replace(getOrganizerEntryHref(organizerStatus));
      return;
    }

    if (router.canGoBack()) {
      router.back();
      return;
    }

    const href = getMemberTabsReturnHref();
    router.replace(href === '/(tabs)' ? GUEST_EXPLORE_HREF : href);
  };

  if (!fontsLoaded) {
    return (
      <View style={[styles.screen, styles.loading]}>
        <ActivityIndicator color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ImageBackground source={WELCOME_BG} style={styles.background} resizeMode="cover">
        <View
          style={[
            styles.content,
            {
              paddingTop: insets.top + 8,
              paddingBottom: insets.bottom + 12,
            },
          ]}
        >
          {!isFirstLaunch ? (
            <Pressable
              onPress={handleCancel}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={[styles.cancelButton, { top: 8 }]}
              accessibilityRole="button"
              accessibilityLabel="Cancel and go to Discovery"
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          ) : null}

          <View style={styles.topSection}>
            <View style={styles.topBar}>
              <View style={styles.brandRow}>
                <View style={[styles.logoBox, isCompact && styles.logoBoxCompact]}>
                  <Image
                    source={MADALHUB_LOGO}
                    style={[styles.logo, isCompact && styles.logoCompact]}
                    resizeMode="contain"
                  />
                </View>
                <View style={styles.brandTextWrap}>
                  <Text style={[styles.brandTitle, isCompact && styles.brandTitleCompact]}>
                    Madal<Text style={styles.brandTitleAccent}>Hub</Text>
                  </Text>
                  <Text style={[styles.tagline, isCompact && styles.taglineCompact]}>
                    Discover • Connect • Organize
                  </Text>
                </View>
              </View>
            </View>

            <View style={[styles.heroCopy, isCompact && styles.heroCopyCompact]}>
              <Text style={[styles.heading, isCompact && styles.headingCompact]}>
                {'Discover Events\nThat Matter\nto '}
                <Text style={styles.headingAccent}>You</Text>
              </Text>
              <Text style={[styles.subtitle, isCompact && styles.subtitleCompact]}>
                {
                  'Find workshops, conferences,\nseminars and community\nevents happening\naround you.'
                }
              </Text>
            </View>
          </View>

          <View style={[styles.bottomPanel, isCompact && styles.bottomPanelCompact]}>
            <WelcomeAuthActions
              compact={isCompact}
              onGetStartedPress={() => router.push('/(auth)/signup')}
            />

            <View style={styles.orRow}>
              <View style={styles.orLine} />
              <Text style={styles.orText}>or</Text>
              <View style={styles.orLine} />
            </View>

            <Pressable onPress={() => router.push('/(auth)/login')} style={styles.loginRow}>
              <Text style={styles.loginText}>
                I already have an account{' '}
                <Text style={styles.loginLink}>Log in</Text>
              </Text>
            </Pressable>

            {!isLoggedIn ? (
              <Pressable
                onPress={() => void handleBrowseAsGuest()}
                style={styles.guestBrowseRow}
                accessibilityRole="button"
                accessibilityLabel="Browse events as guest"
              >
                <Text style={styles.guestBrowseText}>Browse events as guest</Text>
              </Pressable>
            ) : null}

            <View style={[styles.organizerCard, isCompact && styles.organizerCardCompact]}>
              <View style={styles.organizerCardTop}>
                <View style={[styles.organizerIconWrap, isCompact && styles.organizerIconWrapCompact]}>
                  <Ionicons name="calendar-outline" size={isCompact ? 18 : 20} color={COLORS.primary} />
                </View>
                <View style={styles.organizerCopy}>
                  <Text style={styles.organizerTitle}>Want to host events?</Text>
                  <Text style={styles.organizerSubtitle}>
                    Create and manage events for your community.
                  </Text>
                </View>
              </View>
              <Pressable
                onPress={() => router.push('/(auth)/organizer-signup')}
                hitSlop={8}
                style={styles.organizerCta}
              >
                <Text style={styles.organizerCtaText}>Become an Organizer →</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFF8F4',
  },
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  loading: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 22,
    justifyContent: 'space-between',
  },
  cancelButton: {
    position: 'absolute',
    right: 22,
    zIndex: 30,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  topSection: {
    flexShrink: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingRight: 68,
    marginBottom: 4,
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#8B8E9C',
    letterSpacing: 0.3,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexShrink: 1,
  },
  logoBox: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  logoBoxCompact: {
    width: 42,
    height: 42,
    borderRadius: 10,
  },
  logo: {
    width: 40,
    height: 40,
  },
  logoCompact: {
    width: 36,
    height: 36,
  },
  brandTextWrap: {
    justifyContent: 'center',
    paddingTop: 2,
  },
  brandTitle: {
    fontFamily: FONT_JAKARTA_BOLD,
    fontSize: 20,
    color: COLORS.textDark,
    letterSpacing: -0.2,
  },
  brandTitleCompact: {
    fontSize: 18,
  },
  brandTitleAccent: {
    color: COLORS.primary,
  },
  tagline: {
    marginTop: 1,
    fontFamily: FONT_JAKARTA_REGULAR,
    fontSize: 10,
    color: '#7A8494',
    letterSpacing: 0.02,
  },
  taglineCompact: {
    fontSize: 9,
  },
  heroCopy: {
    marginTop: 16,
    paddingRight: 8,
  },
  heroCopyCompact: {
    marginTop: 10,
  },
  heading: {
    fontFamily: FONT_JAKARTA_BOLD,
    fontSize: 26,
    lineHeight: 34,
    color: COLORS.textDark,
    letterSpacing: -0.4,
  },
  headingCompact: {
    fontSize: 24,
    lineHeight: 31,
  },
  headingAccent: {
    color: COLORS.primary,
  },
  subtitle: {
    marginTop: 12,
    fontFamily: FONT_JAKARTA_REGULAR,
    fontSize: 13,
    lineHeight: 20,
    color: '#5F6B7A',
    maxWidth: 280,
  },
  subtitleCompact: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 8,
  },
  bottomPanel: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    flexShrink: 0,
    paddingTop: 8,
  },
  bottomPanelCompact: {
    paddingTop: 4,
  },
  orRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 10,
    gap: 12,
  },
  orLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#D8DCE3',
  },
  orText: {
    fontFamily: FONT_JAKARTA_REGULAR,
    fontSize: 13,
    color: '#9AA3B2',
  },
  loginRow: {
    alignSelf: 'center',
    marginBottom: 10,
  },
  loginText: {
    fontFamily: FONT_JAKARTA_REGULAR,
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: 'center',
  },
  loginLink: {
    fontFamily: FONT_JAKARTA_BOLD,
    color: COLORS.primary,
  },
  guestBrowseRow: {
    alignSelf: 'center',
    marginBottom: 12,
    paddingVertical: 4,
  },
  guestBrowseText: {
    fontFamily: FONT_JAKARTA_BOLD,
    fontSize: 14,
    color: '#5F6B7A',
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
  organizerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 10,
    shadowColor: '#0F172A',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  organizerCardCompact: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 8,
  },
  organizerCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  organizerIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#FFF3EC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  organizerIconWrapCompact: {
    width: 34,
    height: 34,
  },
  organizerCopy: {
    flex: 1,
    paddingTop: 2,
  },
  organizerTitle: {
    fontFamily: FONT_JAKARTA_BOLD,
    fontSize: 14,
    color: COLORS.textDark,
  },
  organizerSubtitle: {
    marginTop: 2,
    fontFamily: FONT_JAKARTA_REGULAR,
    fontSize: 12,
    lineHeight: 16,
    color: '#6B7280',
  },
  organizerCta: {
    alignSelf: 'flex-end',
    marginTop: 6,
  },
  organizerCtaText: {
    fontFamily: FONT_JAKARTA_BOLD,
    fontSize: 13,
    color: COLORS.primary,
  },
});
