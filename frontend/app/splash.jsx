import React, { useEffect, useRef } from "react";
import { View, Animated, StyleSheet, Easing, Platform, Image } from "react-native";
import { useRootNavigationState } from "expo-router";
import useGuardedRouter from "@/hooks/useGuardedRouter";
import * as NavigationBar from "expo-navigation-bar";
import useAuth from "@/auth/useAuth";
import { GUEST_EXPLORE_HREF, hasGuestWelcomeSeen } from "@/navigation/guestWelcome";
import { getOrganizerEntryHref } from "@/navigation/organizerGate";
import { getOrganizerStatus } from "@/api/organizer";
const MadalHubLogo = require("../src/assets/madalhub_logo.png");

const ROLE_MEMBER = 1;
const ROLE_ORGANIZER = 2;
const ROLE_ADMIN = 3;

const BRAND_ORANGE = "#FF7B3F";
/** Expanding circle — was peach (#FFEFE5); white when fully expanded like the hold frame. */
const EXPAND_CIRCLE = "#FFFFFF";

export default function Splash() {
  const router = useGuardedRouter();
  const rootNavigationState = useRootNavigationState();
  const isNavigationReady = Boolean(rootNavigationState?.key);
  const { user, profileCompleted, isHydrated, userRole } = useAuth();

  const circleScale = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (Platform.OS !== "android") return undefined;
    (async () => {
      try {
        await NavigationBar.setBackgroundColorAsync(BRAND_ORANGE);
        await NavigationBar.setButtonStyleAsync("dark");
      } catch {
        /* older devices / gesture nav may ignore */
      }
    })();
    return () => {
      (async () => {
        try {
          await NavigationBar.setBackgroundColorAsync("#FFFFFF");
          await NavigationBar.setButtonStyleAsync("dark");
        } catch {
          /* ignore */
        }
      })();
    };
  }, []);

  useEffect(() => {
    if (!isHydrated || !isNavigationReady) return;

    let cancelled = false;

    const go = (href) => {
      if (cancelled) return;
      router.replace(href);
    };

    const finishRouting = async () => {
      if (!user) {
        const seenWelcome = await hasGuestWelcomeSeen();
        go(seenWelcome ? GUEST_EXPLORE_HREF : "/(auth)/welcome?firstLaunch=1");
        return;
      }

      if (userRole === ROLE_ADMIN) {
        go('/(admin)/organizers');
        return;
      }

      if (userRole === ROLE_ORGANIZER) {
        try {
          const status = await getOrganizerStatus();
          go(getOrganizerEntryHref(status?.verificationStatus));
        } catch {
          go('/(organizer-status)/welcome');
        }
        return;
      }

      if (profileCompleted === false) {
        go("/onboarding/WelcomeIntro");
        return;
      }

      go("/(tabs)/explore");
    };

    Animated.parallel([
      Animated.timing(circleScale, {
        toValue: 1,
        duration: 900,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 700,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (cancelled) return;

      Animated.timing(circleScale, {
        toValue: 12,
        duration: 900,
        easing: Easing.in(Easing.exp),
        useNativeDriver: true,
      }).start(() => {
        if (cancelled) return;
        void finishRouting();
      });
    });

    return () => {
      cancelled = true;
      circleScale.stopAnimation();
      logoOpacity.stopAnimation();
    };
  }, [
    isHydrated,
    isNavigationReady,
    profileCompleted,
    router,
    user,
    userRole,
    circleScale,
    logoOpacity,
  ]);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.circle,
          {
            transform: [{ scale: circleScale }],
          },
        ]}
      />

      <Animated.View
        style={{
          position: "absolute",
          opacity: logoOpacity,
        }}
      >
        <Image source={MadalHubLogo} style={styles.logo} resizeMode="contain" />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BRAND_ORANGE,
    justifyContent: "center",
    alignItems: "center",
  },
  circle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: EXPAND_CIRCLE,
  },
  logo: {
    width: 130,
    height: 130,
  },
});
