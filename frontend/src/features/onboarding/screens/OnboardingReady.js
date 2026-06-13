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
  const checkOpacity = useSharedValue(0);
  const checkY = useSharedValue(10);
  const avatarOpacity = useSharedValue(0);
  const avatarScale = useSharedValue(0.92);
  const textOpacity = useSharedValue(0);
  const textY = useSharedValue(14);
  const ctaOpacity = useSharedValue(0);
  const ctaY = useSharedValue(20);
  const rowOpacity = useSharedValue(0);
  const rowY = useSharedValue(14);

  const completionItems = useMemo(
    () => [
      { id: "profile", icon: "person-outline", label: "Profile\ncompleted" },
      { id: "interests", icon: "heart-outline", label: "Interests\nselected" },
      { id: "photo", icon: "image-outline", label: "Photo\nuploaded" },
    ],
    [],
  );

  useEffect(() => {
    checkOpacity.value = withTiming(1, { duration: 260, easing: Easing.out(Easing.cubic) });
    checkY.value = withTiming(0, { duration: 260, easing: Easing.out(Easing.cubic) });

    avatarOpacity.value = withDelay(120, withTiming(1, { duration: 320, easing: Easing.out(Easing.cubic) }));
    avatarScale.value = withDelay(120, withSpring(1, { damping: 16, stiffness: 140 }));

    textOpacity.value = withDelay(240, withTiming(1, { duration: 320, easing: Easing.out(Easing.cubic) }));
    textY.value = withDelay(240, withTiming(0, { duration: 320, easing: Easing.out(Easing.cubic) }));

    rowOpacity.value = withDelay(320, withTiming(1, { duration: 280, easing: Easing.out(Easing.cubic) }));
    rowY.value = withDelay(320, withTiming(0, { duration: 280, easing: Easing.out(Easing.cubic) }));

    ctaOpacity.value = withDelay(420, withTiming(1, { duration: 300, easing: Easing.out(Easing.cubic) }));
    ctaY.value = withDelay(420, withTiming(0, { duration: 300, easing: Easing.out(Easing.cubic) }));
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
  const checkStyle = useAnimatedStyle(() => ({
    opacity: checkOpacity.value,
    transform: [{ translateY: checkY.value }],
  }));
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
  const rowStyle = useAnimatedStyle(() => ({
    opacity: rowOpacity.value,
    transform: [{ translateY: rowY.value }],
  }));

  return (
    <Animated.View style={[styles.root, screenStyle]}>
      <Stack.Screen options={{ gestureEnabled: false, headerShown: false }} />

      <View style={styles.content}>
        <Animated.View style={[styles.successMarkWrap, checkStyle]}>
          <View style={styles.successMark}>
            <Ionicons name="checkmark" size={24} color="#FFFFFF" />
          </View>
          <Text style={styles.successLabel}>Profile complete</Text>
        </Animated.View>

        <Animated.View style={avatarStyle}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
          ) : (
            <MemberInitialAvatar name={name} size={116} borderColor="#FFFFFF" borderWidth={0} />
          )}
        </Animated.View>

        <Animated.View style={[styles.textBlock, textStyle]}>
          <Text style={styles.title}>Welcome, {firstName} 🎉</Text>
          <Text style={styles.subtitle}>You're all set. Start exploring events happening around you.</Text>
        </Animated.View>

        <Animated.View style={[styles.completionRow, rowStyle]}>
          {completionItems.map((item, index) => (
            <React.Fragment key={item.id}>
              <View style={styles.completionItem}>
                <View style={styles.itemIconWrap}>
                  <Ionicons name={item.icon} size={20} color="#1F2937" />
                </View>
                <Text style={styles.itemLabel}>{item.label}</Text>
              </View>
              {index < completionItems.length - 1 ? <View style={styles.itemDivider} /> : null}
            </React.Fragment>
          ))}
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
  successMark: {
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#22C55E",
    shadowColor: "#22C55E",
    shadowOpacity: 0.26,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  successMarkWrap: {
    alignItems: "center",
    marginBottom: 22,
  },
  successLabel: {
    marginTop: 12,
    fontSize: 32,
    lineHeight: 38,
    color: "#22A55A",
    fontWeight: "600",
    letterSpacing: 0.6,
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
  title: {
    fontSize: 48,
    lineHeight: 56,
    fontWeight: "700",
    color: "#14151A",
    letterSpacing: -1,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 17,
    lineHeight: 25,
    color: "#63666F",
    textAlign: "center",
    maxWidth: 335,
  },
  completionRow: {
    width: "100%",
    marginTop: 36,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  completionItem: {
    flex: 1,
    alignItems: "center",
  },
  itemIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#EEF4EF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  itemLabel: {
    fontSize: 16,
    lineHeight: 26,
    color: "#4B5563",
    textAlign: "center",
    fontWeight: "500",
  },
  itemDivider: {
    width: 1,
    backgroundColor: "#E5E7EB",
    marginTop: 10,
    alignSelf: "stretch",
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
