import React, { useEffect, useRef } from "react";
import { View, Animated, StyleSheet, Dimensions, Easing } from "react-native";
import { useRouter } from "expo-router";
import KulanLogo from "../src/assets/kulan_logo.svg";

const { width, height } = Dimensions.get("window");

export default function Splash() {
  const router = useRouter();

  // Animations
  const circleScale = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Step 1 — Fade + scale-in the circle + logo
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
      // Step 2 — Expand ONLY the circle (logo stays the same size)
      Animated.timing(circleScale, {
        toValue: 12, // Large scale to fill screen
        duration: 900,
        easing: Easing.in(Easing.exp),
        useNativeDriver: true,
      }).start(() => {
        // Step 3 — Navigate to welcome screen (slide from top animation there)
        router.replace("/(auth)/welcome");
      });
    });
  }, []);

  return (
    <View style={styles.container}>
      {/* EXPANDING CIRCLE */}
      <Animated.View
        style={[
          styles.circle,
          {
            transform: [{ scale: circleScale }],
          },
        ]}
      />

      {/* LOGO (stays centered, does NOT expand) */}
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
    backgroundColor: "#FFEFE5", // Your brand color
  },
});
