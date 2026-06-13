import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  Image,
  ScrollView,
  ActivityIndicator,
  Animated,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import useGuardedRouter from "@/hooks/useGuardedRouter";
import OnboardingHeader from "@/features/onboarding/components/OnboardingHeader";
import WelcomeAnimatedBackground from "@/features/auth/components/welcome/WelcomeAnimatedBackground";
import useOnboardingAnimation from "@/features/onboarding/hooks/useOnboardingAnimation";
import onboardingApi from "@/api/onboarding";
import useAuth from "@/auth/useAuth";
import { mergeAuthenticatedUserFromMe } from "@/auth/mergeAuthenticatedUserFromMe";
import { logApiError } from "@/api/logApiError";
import GenderSvg from "@/assets/gender.svg";

const GENDERS = [
  { key: "Male", image: require("@/assets/male.png") },
  { key: "Female", image: require("@/assets/female.png") },
];

export default function GenderScreen() {
  const router = useGuardedRouter();
  const insets = useSafeAreaInsets();
  const { setUser } = useAuth();

  const [selected, setSelected] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState("");

  const { fade, slideUp, heroFloat } = useOnboardingAnimation();

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace("/onboarding/WelcomeIntro");
  };

  const handleNext = async () => {
    if (!selected) return;

    setIsSubmitting(true);
    setApiError("");

    try {
      await onboardingApi.updateProfile({ gender: selected });
      mergeAuthenticatedUserFromMe(setUser); // fire and forget — no need to block navigation
      router.push("/onboarding/DOB");
    } catch (error) {
      logApiError(error, "PATCH onboarding/profile gender");
      setApiError("Failed to save gender. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <WelcomeAnimatedBackground />
      <OnboardingHeader
        step={2}
        total={5}
        onBack={handleBack}
        showSkip
        onSkip={() => router.push("/onboarding/DOB")}
      />

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 24,
          paddingBottom: Math.max(24, insets.bottom + 16),
        }}
      >
        <Animated.View style={{ opacity: fade, transform: [{ translateY: slideUp }], flex: 1 }}>
          <Animated.View style={[styles.heroWrap, { transform: [{ translateY: heroFloat }] }]}>
            <GenderSvg width="100%" height="100%" />
          </Animated.View>

          <Text style={styles.title}>Select your Gender</Text>
          <Text style={styles.subtitle}>Some events are for specific audiences. We'll show the right ones for you.</Text>

          {apiError ? <Text style={styles.errorText}>{apiError}</Text> : null}

          <View style={styles.cardsRow}>
            {GENDERS.map((g) => {
              const isSelected = selected === g.key;
              return (
                <Pressable
                  key={g.key}
                  onPress={() => setSelected((cur) => (cur === g.key ? null : g.key))}
                  style={[styles.card, isSelected && styles.cardSelected]}
                >
                  <Image source={g.image} style={styles.cardImage} />
                  <Text style={[styles.cardLabel, isSelected && styles.cardLabelSelected]}>
                    {g.key}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Pressable
            disabled={!selected || isSubmitting}
            onPress={handleNext}
            style={[styles.button, { opacity: !selected || isSubmitting ? 0.4 : 1, marginTop: "auto" }]}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Continue</Text>
            )}
          </Pressable>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  heroWrap: {
    width: "100%",
    maxWidth: 440,
    height: 320,
    alignSelf: "center",
    marginTop: 8,
    marginBottom: 10,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    textAlign: "center",
    color: "#222",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    textAlign: "center",
    color: "#888",
    marginBottom: 20,
    lineHeight: 22,
  },
  errorText: {
    color: "#E53E3E",
    fontSize: 13,
    marginBottom: 8,
    textAlign: "center",
  },
  cardsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 8,
  },
  card: {
    width: "48%",
    height: 140,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDDDDD",
    justifyContent: "center",
    alignItems: "center",
    elevation: 0,
  },
  cardSelected: {
    borderWidth: 2.5,
    borderColor: "#FF7B3F",
    backgroundColor: "#FFF5F0",
    elevation: 4,
  },
  cardImage: {
    width: 55,
    height: 55,
  },
  cardLabel: {
    marginTop: 12,
    fontSize: 17,
    fontWeight: "600",
    color: "#333",
  },
  cardLabelSelected: {
    color: "#FF7B3F",
  },
  button: {
    width: "100%",
    backgroundColor: "#FF7B3F",
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 20,
    alignItems: "center",
  },
  buttonText: {
    color: "#FFF",
    fontSize: 17,
    fontWeight: "700",
  },
});
