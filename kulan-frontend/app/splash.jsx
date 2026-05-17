import React, { useEffect, useRef } from "react";
import { View, Animated, StyleSheet, Dimensions, Easing, Platform } from "react-native";
import { useRouter } from "expo-router";
import * as NavigationBar from "expo-navigation-bar";
import useAuth from "@/auth/useAuth";
import organizerApi from "@/api/organizer";
import { isOrganizerSubmissionReadyForReview } from "@/utils/organizerVerification";
import KulanLogo from "../src/assets/kulan_logo.svg";

const { width, height } = Dimensions.get("window");

const ROLE_MEMBER = 1;
const ROLE_ORGANIZER = 2;

const BRAND_ORANGE = "#FF7B3F";

export default function Splash() {
  const router = useRouter();
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
    if (!isHydrated) return;

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
      Animated.timing(circleScale, {
        toValue: 12,
        duration: 900,
        easing: Easing.in(Easing.exp),
        useNativeDriver: true,
      }).start(() => {
        if (!user) {
          router.replace("/(tabs)/");
          return;
        }

        if (userRole === ROLE_ORGANIZER) {
          if (organizerStatus === 'approved') {
            router.replace("/(organizer)/dashboard");
          } else if (organizerStatus === 'rejected') {
            router.replace("/(organizer-status)/verification-failed");
          } else {
            (async () => {
              try {
                const detail = await organizerApi.getOrganizerStatus();
                const ready = isOrganizerSubmissionReadyForReview(detail);
                router.replace(
                  ready
                    ? "/(organizer-status)/pending-verification"
                    : "/(organizer-status)/resubmit-verification"
                );
              } catch {
                router.replace("/(organizer-status)/resubmit-verification");
              }
            })();
          }
          return;
        }

        if (profileCompleted === false) {
          router.replace("/onboarding/WelcomeIntro");
          return;
        }

        router.replace("/(tabs)/");
      });
    });
  }, [isHydrated, profileCompleted, router, user, userRole, organizerStatus]);

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
    backgroundColor: "#FF7B3F",
    justifyContent: "center",
    alignItems: "center",
  },
  circle: {
    width: 180,
    height: 180,
    borderRadius: 180 / 2,
    backgroundColor: "#FFEFE5",
  },
});
