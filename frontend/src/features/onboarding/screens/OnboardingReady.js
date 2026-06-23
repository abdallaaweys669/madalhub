import React, { useEffect, useMemo } from "react";
import { View, Text, Pressable, StyleSheet, Image } from "react-native";
import { Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import useGuardedRouter from "@/hooks/useGuardedRouter";
import useAuth from "@/auth/useAuth";
import { MemberInitialAvatar } from "@/components/member/MemberInitialAvatar";
import { resolveApiAssetUrl } from "@/utils/mediaUrl";

const ACCENT = "#FF7B3F";

export default function OnboardingReady() {
  const insets = useSafeAreaInsets();
  const router = useGuardedRouter();
  const { user, completeOnboarding } = useAuth();

  const name = user?.name || user?.fullName || user?.firstName || "there";
  const firstName = name.split(" ")[0];

  const avatarUrl = useMemo(() => {
    const rawAvatarUrl = user?.profileImg || user?.avatarUrl || null;
    const resolvedAvatarUrl = resolveApiAssetUrl(rawAvatarUrl);
    if (!resolvedAvatarUrl) return null;
    return `${resolvedAvatarUrl}${resolvedAvatarUrl.includes("?") ? "&" : "?"}t=${Date.now()}`;
  }, [user?.profileImg, user?.avatarUrl]);

  const screenOpacity = useSharedValue(1);
  const avatarOpacity = useSharedValue(0);
  const avatarScale = useSharedValue(0.92);
  const textOpacity = useSharedValue(0);
  const textY = useSharedValue(14);
  const ctaOpacity = useSharedValue(0);
  const ctaY = useSharedValue(20);

  useEffect(() => {
    avatarOpacity.value = withDelay(80, withTiming(1, { duration: 320, easing: Easing.out(Easing.cubic) }));
    avatarScale.value = withDelay(80, withSpring(1, { damping: 16, stiffness: 140 }));

    textOpacity.value = withDelay(220, withTiming(1, { duration: 320, easing: Easing.out(Easing.cubic) }));
    textY.value = withDelay(220, withTiming(0, { duration: 320, easing: Easing.out(Easing.cubic) }));

    ctaOpacity.value = withDelay(360, withTiming(1, { duration: 300, easing: Easing.out(Easing.cubic) }));
    ctaY.value = withDelay(360, withTiming(0, { duration: 300, easing: Easing.out(Easing.cubic) }));
  }, []);

  const navigateToTabs = async () => {
    await completeOnboarding();
    router.replace("/(tabs)");
  };

  const handleContinue = () => {
    screenOpacity.value = withTiming(0, { duration: 180 }, (finished) => {
      if (finished) runOnJS(navigateToTabs)();
    });
  };

  const screenStyle = useAnimatedStyle(() => ({ opacity: screenOpacity.value }));
  const avatarStyle = useAnimatedStyle(() => ({
    opacity: avatarOpacity.value,
    transform: [{ scale: avatarScale.value }],
  }));
  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: textY.value }],
  }));
  const ctaStyle = useAnimatedStyle(() => ({
    opacity: ctaOpacity.value,
    transform: [{ translateY: ctaY.value }],
  }));

  return (
    <Animated.View style={[styles.root, screenStyle]}>
      <Stack.Screen options={{ gestureEnabled: false, headerShown: false }} />

      <View style={styles.content}>
        <Animated.View style={avatarStyle}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
          ) : (
            <MemberInitialAvatar name={name} size={116} borderColor="#FFFFFF" borderWidth={0} />
          )}
        </Animated.View>

        <Animated.View style={[styles.textBlock, textStyle]}>
          <Text style={styles.kicker}>Welcome to</Text>
          <Text style={styles.brand}>MadalHub</Text>
          <Text style={styles.title}>Hey {firstName}, you&apos;re all set.</Text>
          <Text style={styles.subtitle}>
            Discover events around you, save the ones you love, and join in when you&apos;re ready.
          </Text>
        </Animated.View>
      </View>

      <Animated.View style={[styles.bottomCTA, ctaStyle, { paddingBottom: Math.max(16, insets.bottom + 4) }]}>
        <Pressable style={styles.button} onPress={handleContinue}>
          <Text style={styles.buttonText}>Start exploring</Text>
          <Ionicons name="arrow-forward" size={19} color="#FFFFFF" style={{ marginLeft: 8 }} />
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#F7F7F5",
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    paddingBottom: 150,
  },
  avatarImage: {
    width: 116,
    height: 116,
    borderRadius: 58,
    backgroundColor: "#EDEDED",
    borderWidth: 4,
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
  },
  textBlock: {
    alignItems: "center",
    marginTop: 28,
  },
  kicker: {
    fontSize: 15,
    fontWeight: "600",
    color: "#63666F",
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  brand: {
    fontSize: 36,
    lineHeight: 42,
    fontWeight: "800",
    color: ACCENT,
    letterSpacing: -0.5,
    marginBottom: 16,
  },
  title: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: "700",
    color: "#14151A",
    letterSpacing: -0.4,
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: "#63666F",
    textAlign: "center",
    maxWidth: 320,
  },
  bottomCTA: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 14,
    paddingHorizontal: 20,
    backgroundColor: "rgba(247,247,245,0.96)",
    borderTopWidth: 1,
    borderTopColor: "#EAEAEA",
  },
  button: {
    height: 58,
    borderRadius: 18,
    backgroundColor: ACCENT,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
});
