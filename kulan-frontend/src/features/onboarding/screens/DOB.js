import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  Animated,
  ScrollView,
  StyleSheet,
  Platform,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import useGuardedRouter from "@/hooks/useGuardedRouter";
import OnboardingHeader from "@/features/onboarding/components/OnboardingHeader";
import WelcomeAnimatedBackground from "@/features/auth/components/welcome/WelcomeAnimatedBackground";
import useOnboardingAnimation from "@/features/onboarding/hooks/useOnboardingAnimation";
import onboardingApi from "@/api/onboarding";
import useAuth from "@/auth/useAuth";
import { mergeAuthenticatedUserFromMe } from "@/auth/mergeAuthenticatedUserFromMe";
import { logApiError } from "@/api/logApiError";
import CalendarSvg from "@/assets/DOB.svg";

export default function DOB() {
  const router = useGuardedRouter();
  const insets = useSafeAreaInsets();
  const { setUser } = useAuth();

  const [dob, setDob] = useState(null);
  const [open, setOpen] = useState(false);
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

  const handleDateChange = (event, selectedDate) => {
    console.log("[DOB] onValueChange before:", {
      eventType: event?.type,
      selectedDateType: typeof selectedDate,
      isDateInstance: selectedDate instanceof Date,
      selectedDate,
    });

    if (Platform.OS === "android") setOpen(false);
    if (!selectedDate || !(selectedDate instanceof Date)) {
      console.log("[DOB] onValueChange ignored: invalid selectedDate");
      return;
    }

    setDob(selectedDate);
    console.log("[DOB] onValueChange after setDob:", selectedDate.toISOString());
  };

  const getDobDisplayText = () => {
    console.log("[DOB] before formatting dob:", {
      dobType: typeof dob,
      isDateInstance: dob instanceof Date,
      dob,
    });

    if (!(dob instanceof Date) || Number.isNaN(dob.getTime())) {
      console.log("[DOB] after formatting dob: fallback placeholder");
      return "Select your date of birth";
    }

    const formatted = dob.toDateString();
    console.log("[DOB] after formatting dob:", formatted);
    return formatted;
  };

  const handleNext = async () => {
    if (!dob) return;

    setIsSubmitting(true);
    setApiError("");

    try {
      const formattedDate = dob.toISOString().split("T")[0];
      await onboardingApi.updateProfile({ dob: formattedDate });
      mergeAuthenticatedUserFromMe(setUser); // fire and forget — no need to block navigation
      router.push("/onboarding/Interests");
    } catch (error) {
      logApiError(error, "PATCH onboarding/profile dob");
      setApiError("Failed to save date of birth. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <WelcomeAnimatedBackground />
      <OnboardingHeader
        step={3}
        total={5}
        onBack={handleBack}
        showSkip
        onSkip={() => router.push("/onboarding/Interests")}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 24,
          paddingBottom: Math.max(24, insets.bottom + 16),
        }}
      >
        <Animated.View style={{ flex: 1, opacity: fade, transform: [{ translateY: slideUp }] }}>
          <Animated.View style={[styles.heroWrap, { transform: [{ translateY: heroFloat }] }]}>
            <CalendarSvg width="100%" height="100%" />
          </Animated.View>

          <Text style={styles.title}>When is your birthday?</Text>
          <Text style={styles.subtitle}>This helps us personalise events for your age group.</Text>

          {apiError ? <Text style={styles.errorText}>{apiError}</Text> : null}

          <Pressable onPress={() => setOpen(true)} style={styles.input}>
            <Text style={{ fontSize: 16, color: dob instanceof Date ? "#333" : "#B0B0B0" }}>
              {getDobDisplayText()}
            </Text>
          </Pressable>

          {open && (
            <DateTimePicker
              value={dob || new Date(2000, 0, 1)}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
            onValueChange={handleDateChange}
            onDismiss={() => setOpen(false)}
            />
          )}

          <Pressable
            style={[styles.button, { opacity: !dob || isSubmitting ? 0.5 : 1, marginTop: "auto" }]}
            disabled={!dob || isSubmitting}
            onPress={handleNext}
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
    maxWidth: 400,
    height: 260,
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
  input: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#FF7B3F",
    padding: 15,
    borderRadius: 14,
    marginTop: 8,
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
