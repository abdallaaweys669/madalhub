import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Animated,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import useGuardedRouter from "@/hooks/useGuardedRouter";
import OnboardingHeader from "@/features/onboarding/components/OnboardingHeader";
import WelcomeAnimatedBackground from "@/features/auth/components/welcome/WelcomeAnimatedBackground";
import useOnboardingAnimation from "@/features/onboarding/hooks/useOnboardingAnimation";
import Chip from "@/features/onboarding/components/Chip";
import onboardingApi from "@/api/onboarding";
import { resolveInterestIcon } from "@/components/explore/exploreCategoryIcons";
import { logApiError } from "@/api/logApiError";
import InterestSvg from "@/assets/interest img.svg";

export default function Interests() {
  const router = useGuardedRouter();
  const insets = useSafeAreaInsets();

  const [interests, setInterests] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
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

  useEffect(() => {
    (async () => {
      try {
        const list = await onboardingApi.getInterests();
        setInterests(list);
      } catch (error) {
        logApiError(error, "GET interests");
        setApiError("Could not load interests. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const toggle = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleFinish = async () => {
    if (selectedIds.length === 0) return;

    setIsSubmitting(true);
    setApiError("");

    try {
      await onboardingApi.updateInterests(selectedIds);
      router.replace("/onboarding/ProfileImage");
    } catch (error) {
      logApiError(error, "POST onboarding/interests");
      setApiError("Failed to save interests. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <WelcomeAnimatedBackground />
      <OnboardingHeader step={4} total={5} onBack={handleBack} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingBottom: Math.max(24, insets.bottom + 80),
        }}
      >
        <Animated.View style={{ opacity: fade, transform: [{ translateY: slideUp }] }}>
          <Animated.View style={[styles.heroWrap, { transform: [{ translateY: heroFloat }] }]}>
            <InterestSvg width="100%" height="100%" />
          </Animated.View>

          <Text style={styles.title}>What are you into?</Text>
          <Text style={styles.subtitle}>
            Pick your interests and we'll find events you'll love.
          </Text>

          {apiError ? (
            <Text style={styles.errorText}>{apiError}</Text>
          ) : null}

          {isLoading ? (
            <ActivityIndicator size="large" color="#FF7B3F" style={{ marginTop: 40 }} />
          ) : (
            <View style={styles.chipsWrap}>
              {interests.map((item) => (
                <Chip
                  key={item.id}
                  label={item.name}
                  ionicon={resolveInterestIcon(item)}
                  selected={selectedIds.includes(item.id)}
                  onPress={() => toggle(item.id)}
                />
              ))}
            </View>
          )}
        </Animated.View>
      </ScrollView>

      <Animated.View
        style={[styles.footer, { opacity: fade, paddingBottom: Math.max(24, insets.bottom + 16) }]}
      >
        <Pressable
          disabled={selectedIds.length === 0 || isSubmitting}
          onPress={handleFinish}
          style={[
            styles.button,
            { opacity: selectedIds.length > 0 && !isSubmitting ? 1 : 0.4 },
          ]}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Continue</Text>
          )}
        </Pressable>
      </Animated.View>
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
  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingTop: 12,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  button: {
    width: "100%",
    backgroundColor: "#FF7B3F",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  buttonText: {
    color: "#FFF",
    fontSize: 17,
    fontWeight: "700",
  },
});
