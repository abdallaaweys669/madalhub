import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import WelcomeRoleToggle from '@/features/auth/components/welcome/WelcomeRoleToggle';
import WelcomeSocialAuth from '@/features/auth/components/welcome/WelcomeSocialAuth';

const FONT_HEADING = 'PlayfairDisplay_700Bold';
const FONT_HEADING_ACCENT = 'PlayfairDisplay_600SemiBold';
const FONT_BODY = 'PlusJakartaSans_400Regular';
const FONT_BODY_EMPHASIS = 'PlusJakartaSans_700Bold';

const WELCOME_COPY = {
  member: {
    tagline: 'Find local events',
    line: 'Connect with people who share your interests, ',
    accent: 'right around you.',
  },
  organizer: {
    tagline: 'Create & manage events',
    line: 'Reach the right audience and grow your community, ',
    accent: 'with confidence.',
  },
};

export default function WelcomeScreen() {
  const router = useGuardedRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const { isLoggedIn, isOrganizer, organizerStatus } = useAuth();
  const [role, setRole] = useState('member');

  const [fontsLoaded] = useFonts({
    PlayfairDisplay_600SemiBold: require('@/assets/fonts/PlayfairDisplay_600SemiBold.ttf'),
    PlayfairDisplay_700Bold: require('@/assets/fonts/PlayfairDisplay_700Bold.ttf'),
    PlusJakartaSans_400Regular: require('@/assets/fonts/PlusJakartaSans_400Regular.ttf'),
    PlusJakartaSans_700Bold: require('@/assets/fonts/PlusJakartaSans_700Bold.ttf'),
  });

  const isMember = role === 'member';
  const welcomeCopy = WELCOME_COPY[role];
  const isCompact = height < 760;
  const heroWidth = Math.min(width - 32, isCompact ? 280 : 320);
  const heroHeight = Math.round(heroWidth * 0.8);

  const handleCancel = () => {
    if (isLoggedIn && isOrganizer) {
      router.replace(getOrganizerEntryHref(organizerStatus));
      return;
    }
    router.replace(getMemberTabsReturnHref());
  };

  const loginHref = isMember ? '/(auth)/login' : '/(auth)/organizer-login';
  const signupHref = isMember ? '/(auth)/signup' : '/(auth)/organizer-signup';

  const handleGoogle = () => {
    Alert.alert('Coming soon', 'Google sign-in will be available in a future update.');
  };

  const handleFacebook = () => {
    Alert.alert('Coming soon', 'Facebook sign-in will be available in a future update.');
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
            paddingTop: insets.top + 32,
            paddingBottom: insets.bottom + 8,
          },
        ]}
      >
        <View style={styles.topSection}>
          <WelcomeRoleToggle role={role} onRoleChange={setRole} />

          <View style={styles.heroBlock}>
            <View
              style={[
                styles.illustrationWrap,
                { width: heroWidth, height: heroHeight },
              ]}
            >
              <WelcomeFloatingIcon
                name="calendar"
                delay={0}
                style={styles.iconCalendar}
              />
              <WelcomeHeroIllustration
                role={role}
                width={heroWidth}
                height={heroHeight}
              />
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

              <Text
                style={[styles.roleTagline, isCompact && styles.roleTaglineCompact]}
              >
                {welcomeCopy.tagline}
              </Text>
              <Text
                style={[styles.roleDescription, isCompact && styles.roleDescriptionCompact]}
              >
                {welcomeCopy.line}
                <Text style={styles.roleDescriptionAccent}>
                  {welcomeCopy.accent}
                </Text>
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.bottomSection}>
          <WelcomeSocialAuth
            onGooglePress={handleGoogle}
            onFacebookPress={handleFacebook}
            onEmailPress={() => router.push(signupHref)}
            compact={isCompact}
          />

          <View style={styles.footer}>
            <Pressable onPress={() => router.push(loginHref)}>
              <Text style={styles.footerText}>
                Have an account? <Text style={styles.footerLink}>Log in ›</Text>
              </Text>
            </Pressable>
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
    paddingHorizontal: 22,
    justifyContent: 'space-between',
  },
  topSection: {
    flexGrow: 0,
    justifyContent: 'flex-start',
  },
  bottomSection: {
    flex: 1,
    marginTop: 18,
    justifyContent: 'flex-start',
  },
  heroBlock: {
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 4,
  },
  illustrationWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 0,
    alignSelf: 'center',
  },
  iconCalendar: {
    position: 'absolute',
    top: 8,
    left: 4,
  },
  iconLocation: {
    position: 'absolute',
    top: 24,
    right: 4,
  },
  iconSave: {
    position: 'absolute',
    bottom: 36,
    left: 4,
  },
  copyBlock: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 4,
    marginTop: -6,
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
    width: 200,
    height: 3,
    borderRadius: 2,
    backgroundColor: COLORS.primary,
    marginTop: 6,
    marginBottom: 10,
  },
  roleTagline: {
    fontFamily: FONT_HEADING_ACCENT,
    fontSize: 22,
    lineHeight: 28,
    color: COLORS.textDark,
    textAlign: 'center',
    letterSpacing: 0.35,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  roleTaglineCompact: {
    fontSize: 20,
    lineHeight: 26,
    marginBottom: 6,
  },
  roleDescription: {
    fontFamily: FONT_BODY,
    fontSize: 15.5,
    lineHeight: 24,
    color: '#5F6B7A',
    textAlign: 'center',
    paddingHorizontal: 8,
    letterSpacing: 0.2,
    maxWidth: 340,
    alignSelf: 'center',
  },
  roleDescriptionCompact: {
    fontSize: 14.5,
    lineHeight: 22,
    paddingHorizontal: 4,
  },
  roleDescriptionAccent: {
    fontFamily: FONT_BODY_EMPHASIS,
    color: COLORS.primary,
    letterSpacing: 0.25,
  },
  footer: {
    marginTop: 10,
    alignItems: 'center',
    gap: 3,
  },
  footerText: {
    fontSize: 13,
    color: COLORS.textLight,
    textAlign: 'center',
  },
  footerLink: {
    color: COLORS.primary,
    fontWeight: '700',
  },
});
