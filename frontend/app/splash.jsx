import React, { useEffect, useRef } from "react";
import { View, Animated, StyleSheet, Easing, Platform } from "react-native";
import { useRootNavigationState } from "expo-router";
import useGuardedRouter from "@/hooks/useGuardedRouter";
import * as NavigationBar from "expo-navigation-bar";
import useAuth from "@/auth/useAuth";
import organizerApi from "@/api/organizer";
import { isOrganizerSubmissionReadyForReview } from "@/utils/organizerVerification";
import KulanLogo from "../src/assets/kulan_logo.svg";

const ROLE_MEMBER = 1;
const ROLE_ORGANIZER = 2;

const BRAND_ORANGE = "#FF7B3F";
/** Expanding circle — was peach (#FFEFE5); white when fully expanded like the hold frame. */
const EXPAND_CIRCLE = "#FFFFFF";

export default function Splash() {
  const router = useGuardedRouter();
  const rootNavigationState = useRootNavigationState();
  const isNavigationReady = Boolean(rootNavigationState?.key);
  const { user, profileCompleted, isHydrated, userRole, organizerStatus } = useAuth();

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

    const finishRouting = () => {
      if (!user) {
        go("/(tabs)/explore");
        return;
      }

      if (userRole === ROLE_ORGANIZER) {
        if (organizerStatus === 'approved') {
          go("/(organizer)/dashboard");
        } else if (organizerStatus === 'rejected') {
          go("/(organizer-status)/verification-failed");
        } else {
          (async () => {
            try {
              const detail = await organizerApi.getOrganizerStatus();
              if (cancelled) return;
              const ready = isOrganizerSubmissionReadyForReview(detail);
              go(
                ready
                  ? "/(organizer-status)/pending-verification"
                  : "/(organizer-status)/resubmit-verification"
              );
            } catch {
              go("/(organizer-status)/resubmit-verification");
            }
          })();
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
        finishRouting();
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
    organizerStatus,
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
        <KulanLogo width={130} height={130} />
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
});
