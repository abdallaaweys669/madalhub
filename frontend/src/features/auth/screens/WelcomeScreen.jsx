import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import useGuardedRouter from '@/hooks/useGuardedRouter';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';

import useAuth from '@/auth/useAuth';
import { COLORS } from '@/constants/loginSignin/authStyles';
import { getMemberTabsReturnHref } from '@/navigation/memberTabsReturn';
import { getOrganizerEntryHref } from '@/navigation/organizerGate';
import WelcomeAnimatedBackground from '@/features/auth/components/welcome/WelcomeAnimatedBackground';
import WelcomeFloatingIcon from '@/features/auth/components/welcome/WelcomeFloatingIcon';
import WelcomeHeroIllustration from '@/features/auth/components/welcome/WelcomeHeroIllustration';
import WelcomeAuthActions from '@/features/auth/components/welcome/WelcomeAuthActions';

const FONT_HEADING = 'PlayfairDisplay_700Bold';
const FONT_HEADING_ACCENT = 'PlayfairDisplay_600SemiBold';
const FONT_BODY = 'PlusJakartaSans_400Regular';

export default function WelcomeScreen() {
  const router = useGuardedRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const { isLoggedIn, isOrganizer, organizerStatus } = useAuth();

  const [fontsLoaded] = useFonts({
    PlayfairDisplay_600SemiBold: require('@/assets/fonts/PlayfairDisplay_600SemiBold.ttf'),
    PlayfairDisplay_700Bold: require('@/assets/fonts/PlayfairDisplay_700Bold.ttf'),
    PlusJakartaSans_400Regular: require('@/assets/fonts/PlusJakartaSans_400Regular.ttf'),
  });

  const isCompact = height < 760;
  const heroWidth = Math.min(width - 28, isCompact ? 300 : 332);
  const heroHeight = Math.round(heroWidth * 0.8);

  const handleCancel = () => {
    if (isLoggedIn && isOrganizer) {
      router.replace(getOrganizerEntryHref(organizerStatus));
      return;
    }
    router.replace(getMemberTabsReturnHref());
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
      <WelcomeAnimatedBackground />

      <Pressable
        onPress={handleCancel}
        hitSlop={12}
        style={[styles.cancelButton, { top: insets.top + 6 }]}
      >
        <Text style={styles.cancelText}>Cancel</Text>
      </Pressable>

      <View
        style={[
          styles.content,
          {
            paddingTop: insets.top + 36,
            paddingBottom: insets.bottom + 12,
          },
        ]}
      >
        <View style={styles.topSection}>
          <View style={styles.heroBlock}>
            <View style={[styles.illustrationWrap, { width: heroWidth, height: heroHeight }]}>
              <WelcomeFloatingIcon
                name="calendar"
                delay={0}
                style={styles.iconCalendar}
              />
              <WelcomeHeroIllustration role="member" width={heroWidth} height={heroHeight} />
              <WelcomeFloatingIcon
                name="map-pin"
                delay={800}
                style={styles.iconLocation}
              />
              <WelcomeFloatingIcon
                name="bookmark"
                delay={1600}
                style={styles.iconSave}
              />
            </View>

            <View style={styles.copyBlock}>
              <Text
                style={[styles.heading, isCompact && styles.headingCompact]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.82}
              >
                Welcome to <Text style={styles.headingAccent}>Kulan</Text>
              </Text>
              <View style={styles.headingUnderline} />
              <Text style={[styles.subtitle, isCompact && styles.subtitleCompact]}>
                Find and join local events near you.
              </Text>
            </View>

            <View style={styles.actionsBlock}>
              <WelcomeAuthActions
                compact={isCompact}
                onGetStartedPress={() => router.push('/(auth)/signup')}
              />

              <View style={styles.footer}>
                <Pressable onPress={() => router.push('/(auth)/login')} style={styles.footerPressable}>
                  <Text style={styles.footerText}>
                    Have an account? <Text style={styles.footerLink}>Log in</Text>
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => router.push('/(auth)/organizer-signup')}
                  hitSlop={8}
                  style={styles.footerPressable}
                >
                  <Text style={styles.organizerLink}>I&apos;m an organizer</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loading: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFBF9',
  },
  cancelButton: {
    position: 'absolute',
    right: 20,
    zIndex: 10,
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#8B8E9C',
    letterSpacing: 0.3,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  topSection: {
    flexShrink: 0,
    alignItems: 'center',
    paddingTop: 4,
    width: '100%',
  },
  actionsBlock: {
    width: '100%',
    maxWidth: 360,
    marginTop: 22,
    alignItems: 'center',
    alignSelf: 'center',
  },
  heroBlock: {
    justifyContent: 'flex-start',
    alignItems: 'center',
    width: '100%',
  },
  illustrationWrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    alignSelf: 'center',
  },
  iconCalendar: {
    position: 'absolute',
    top: 6,
    left: 0,
    zIndex: 2,
  },
  iconLocation: {
    position: 'absolute',
    top: 20,
    right: 0,
    zIndex: 2,
  },
  iconSave: {
    position: 'absolute',
    bottom: 28,
    left: 2,
    zIndex: 2,
  },
  copyBlock: {
    width: '100%',
    alignItems: 'center',
    alignSelf: 'center',
    paddingHorizontal: 8,
  },
  heading: {
    fontFamily: FONT_HEADING,
    fontSize: 34,
    color: COLORS.textDark,
    textAlign: 'center',
    letterSpacing: 0.2,
    width: '100%',
  },
  headingCompact: {
    fontSize: 30,
  },
  headingAccent: {
    fontFamily: FONT_HEADING_ACCENT,
    color: COLORS.primary,
  },
  headingUnderline: {
    width: 180,
    height: 3,
    borderRadius: 2,
    backgroundColor: COLORS.primary,
    marginTop: 6,
    marginBottom: 10,
    alignSelf: 'center',
  },
  subtitle: {
    fontFamily: FONT_BODY,
    fontSize: 16,
    lineHeight: 24,
    color: '#5F6B7A',
    textAlign: 'center',
    paddingHorizontal: 16,
    maxWidth: 340,
    alignSelf: 'center',
  },
  subtitleCompact: {
    fontSize: 15,
    lineHeight: 22,
  },
  footer: {
    marginTop: 14,
    width: '100%',
    alignItems: 'center',
    gap: 12,
  },
  footerPressable: {
    alignSelf: 'center',
  },
  footerText: {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: 'center',
  },
  footerLink: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  organizerLink: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8B8E9C',
    letterSpacing: 0.15,
    textAlign: 'center',
  },
});
