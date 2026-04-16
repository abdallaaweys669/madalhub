import React, { useEffect, useRef } from "react";
import { View, Text, Image, Pressable, Animated } from "react-native";
import { useRouter } from "expo-router";

import styles from "@/constants/onboardingStyles/styles";

export default function WelcomeIntro() {
  const router = useRouter();

  const fade = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(40)).current;
  const scaleBtn = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideUp, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();

    Animated.spring(scaleBtn, { toValue: 1, friction: 3, useNativeDriver: true }).start();
  }, []);

  return (
    <View style={styles.container}>

      {/* STATIC IMAGE (NO FLOAT) */}
      <Animated.View
        style={{
          opacity: fade,
          transform: [{ translateY: slideUp }],
          marginBottom: 25,
          alignItems: "center",
        }}
      >
        <Image
          source={require("../../../src/assets/welcome_hero.png")}
          style={{
            width: 300,     // bigger image
            height: 300,
            resizeMode: "contain",
          }}
        />
      </Animated.View>

      {/* TITLE */}
      <Animated.Text
        style={[
          styles.title,
          { opacity: fade, transform: [{ translateY: slideUp }] },
        ]}
      >
        Welcome to Kulan
      </Animated.Text>

      {/* SUBTITLE */}
      <Animated.Text
        style={[
          styles.subtitle,
          { opacity: fade, transform: [{ translateY: slideUp }] },
        ]}
      >
        We personalize your experience.
        It takes less than a minute.
      </Animated.Text>

      {/* BETTER BUTTON */}
      <Animated.View style={{ width: "100%", transform: [{ scale: scaleBtn }] }}>
        <Pressable
          onPress={() => router.push("/onboarding/Location")
}
          style={{
            backgroundColor: "#FF7B3F",
            paddingVertical: 18,
            borderRadius: 14,
            alignItems: "center",
            shadowColor: "#FF7B3F",
            shadowOpacity: 0.25,
            shadowRadius: 10,
            elevation: 7,
            marginTop: 20,
          }}
        >
          <Text
            style={{
              color: "#fff",
              fontSize: 18,
              fontWeight: "700",
            }}
          >
            Start Personalizing
          </Text>
        </Pressable>
      </Animated.View>

    </View>
  );
}
