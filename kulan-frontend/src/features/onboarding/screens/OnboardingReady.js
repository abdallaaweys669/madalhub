import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  Animated,
  StyleSheet,
  Dimensions,
} from "react-native";
import { Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import useGuardedRouter from "@/hooks/useGuardedRouter";
import useAuth from "@/auth/useAuth";
import { MemberInitialAvatar } from "@/components/member/MemberInitialAvatar";

const { width: W } = Dimensions.get("window");

const CONFETTI_COLORS = ["#FF7B3F", "#FFD166", "#06D6A0", "#118AB2", "#EF476F", "#FFF"];
const PARTICLE_COUNT = 28;

function useConfetti() {
  const particles = useRef(
    Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
      x: (Math.random() * W * 1.2) - W * 0.1,
      delay: Math.random() * 800,
      dur: 1400 + Math.random() * 1200,
      size: 5 + Math.random() * 7,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      anim: new Animated.Value(0),
      rotate: new Animated.Value(0),
    }))
  ).current;

  const start = () => {
    particles.forEach(({ anim, rotate, delay, dur }) => {
      Animated.parallel([
        Animated.timing(anim, { toValue: 1, duration: dur, delay, useNativeDriver: true }),
        Animated.timing(rotate, { toValue: 1, duration: dur, delay, useNativeDriver: true }),
      ]).start();
    });
  };

  return { particles, start };
}

function useSequence(steps) {
  const anims = useRef(steps.map(() => new Animated.Value(0))).current;

  const run = () => {
    const seq = steps.map((dur, i) =>
      Animated.timing(anims[i], { toValue: 1, duration: dur, useNativeDriver: true })
    );
    Animated.stagger(120, seq).start();
  };

  return { anims, run };
}

const screenH = Dimensions.get("window").height;

export default function OnboardingReady() {
  const insets = useSafeAreaInsets();
  const router = useGuardedRouter();
  const { user, completeOnboarding } = useAuth();

  const name = user?.name || user?.fullName || user?.firstName || "there";
  const firstName = name.split(" ")[0];

  const { particles, start: startConfetti } = useConfetti();
  const { anims, run: runEntrance } = useSequence([400, 400, 350, 350, 350, 400]);

  const [pillAnim, avatarAnim, badgeAnim, titleAnim, subtitleAnim, btnAnim] = anims;

  const pulseRing = useRef(new Animated.Value(1)).current;
  const screenFade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // staggered entrance
    runEntrance();
    startConfetti();

    // pulsing ring
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseRing, { toValue: 1.18, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseRing, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const handleGetStarted = async () => {
    Animated.timing(screenFade, { toValue: 0, duration: 300, useNativeDriver: true }).start(async () => {
      await completeOnboarding();
      router.replace("/(tabs)");
    });
  };

  const toStyle = (anim) => ({
    opacity: anim,
    transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
  });

  return (
    <Animated.View style={[styles.root, { opacity: screenFade }]}>
      {/* Disable back gesture */}
      <Stack.Screen options={{ gestureEnabled: false, headerShown: false }} />

      {/* Confetti particles */}
      {particles.map((p, i) => (
        <Animated.View
          key={i}
          style={[
            styles.particle,
            {
              left: p.x,
              width: p.size,
              height: p.size * 1.4,
              backgroundColor: p.color,
              borderRadius: p.size / 4,
              transform: [
                {
                  translateY: p.anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-20, screenH + 60],
                  }),
                },
                {
                  rotate: p.rotate.interpolate({
                    inputRange: [0, 1],
                    outputRange: ["0deg", "720deg"],
                  }),
                },
              ],
              opacity: p.anim.interpolate({
                inputRange: [0, 0.1, 0.85, 1],
                outputRange: [0, 1, 1, 0],
              }),
            },
          ]}
        />
      ))}

      <View style={[styles.content, { paddingBottom: Math.max(32, insets.bottom + 16) }]}>

        {/* Status pill */}
        <Animated.View style={[styles.pill, toStyle(pillAnim)]}>
          <Ionicons name="checkmark-circle" size={16} color="#22C55E" />
          <Text style={styles.pillText}>Profile complete</Text>
        </Animated.View>

        {/* Avatar with pulsing ring */}
        <Animated.View style={[styles.avatarSection, toStyle(avatarAnim)]}>
          <Animated.View
            style={[
              styles.pulseRing,
              { transform: [{ scale: pulseRing }] },
            ]}
          />
          <MemberInitialAvatar name={name} size={100} borderColor="#FFFFFF" borderWidth={4} />

          {/* Green check badge */}
          <Animated.View style={[styles.checkBadge, toStyle(badgeAnim)]}>
            <Ionicons name="checkmark" size={16} color="#FFFFFF" />
          </Animated.View>
        </Animated.View>

        {/* Title */}
        <Animated.Text style={[styles.title, toStyle(titleAnim)]}>
          Welcome, {firstName}! 🎉
        </Animated.Text>

        {/* Subtitle */}
        <Animated.Text style={[styles.subtitle, toStyle(subtitleAnim)]}>
          You're all set. Start exploring events happening around you.
        </Animated.Text>

        {/* Button */}
        <Animated.View style={[styles.btnWrap, toStyle(btnAnim)]}>
          <Pressable style={styles.button} onPress={handleGetStarted}>
            <Text style={styles.buttonText}>Get started</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" style={{ marginLeft: 8 }} />
          </Pressable>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  particle: {
    position: "absolute",
    top: 0,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    gap: 0,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#BBF7D0",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginBottom: 32,
  },
  pillText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#16A34A",
  },
  avatarSection: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
    width: 140,
    height: 140,
  },
  pulseRing: {
    position: "absolute",
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 3,
    borderColor: "#FF7B3F",
    opacity: 0.35,
  },
  checkBadge: {
    position: "absolute",
    bottom: 6,
    right: 6,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#22C55E",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2.5,
    borderColor: "#FFFFFF",
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    textAlign: "center",
    color: "#111",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    color: "#888",
    lineHeight: 24,
    marginBottom: 44,
  },
  btnWrap: {
    width: "100%",
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FF7B3F",
    paddingVertical: 16,
    borderRadius: 14,
    width: "100%",
  },
  buttonText: {
    color: "#FFF",
    fontSize: 17,
    fontWeight: "700",
  },
});
