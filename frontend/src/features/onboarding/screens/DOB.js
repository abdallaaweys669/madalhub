import React, { useMemo, useState } from "react";
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
import {
  formatDateOnly,
  formatDobDisplay,
  getMaxBirthDateForMinimumAge,
  getMinBirthDate,
  getMinimumAgeError,
  isAtLeastAge,
  MIN_MEMBER_AGE,
} from "@/utils/memberAge";
import CalendarSvg from "@/assets/DOB.svg";

export default function DOB() {
  const router = useGuardedRouter();
  const insets = useSafeAreaInsets();
  const { setUser } = useAuth();

  const maxBirthDate = useMemo(() => getMaxBirthDateForMinimumAge(MIN_MEMBER_AGE), []);
  const minBirthDate = useMemo(() => getMinBirthDate(120), []);

  const [dob, setDob] = useState(null);
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState("");
  const [dobError, setDobError] = useState("");

  const { fade, slideUp, heroFloat } = useOnboardingAnimation();

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace("/onboarding/WelcomeIntro");
  };

  const validateDob = (selectedDate) => {
    if (!(selectedDate instanceof Date) || Number.isNaN(selectedDate.getTime())) {
      return "Select your date of birth";
    }
    if (!isAtLeastAge(selectedDate, MIN_MEMBER_AGE)) {
      return getMinimumAgeError(MIN_MEMBER_AGE);
    }
    return "";
  };

  const handleDateChange = (event, selectedDate) => {
    if (Platform.OS === "android") {
      setOpen(false);
    }
    if (event?.type === "dismissed") {
      return;
    }
    if (!selectedDate || !(selectedDate instanceof Date)) {
      return;
    }

    setDob(selectedDate);
    setDobError(validateDob(selectedDate));
    setApiError("");
  };

  const handleNext = async () => {
    const validationError = validateDob(dob);
    if (validationError) {
      setDobError(validationError);
      return;
    }

    setIsSubmitting(true);
    setApiError("");
    setDobError("");

    try {
      const formattedDate = formatDateOnly(dob);
      await onboardingApi.updateProfile({ dob: formattedDate });
      mergeAuthenticatedUserFromMe(setUser);
      router.push("/onboarding/Interests");
    } catch (error) {
      logApiError(error, "PATCH onboarding/profile dob");
      setApiError(error?.message || "Failed to save date of birth. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const canContinue = dob instanceof Date && !validateDob(dob);

  return (
    <View style={styles.container}>
      <WelcomeAnimatedBackground />
      <OnboardingHeader step={3} total={5} onBack={handleBack} />

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
          <Text style={styles.subtitle}>
            You must be {MIN_MEMBER_AGE} or older. This helps us personalise events for your age group.
          </Text>

          {apiError ? <Text style={styles.errorText}>{apiError}</Text> : null}
          {dobError ? <Text style={styles.errorText}>{dobError}</Text> : null}

          <Pressable onPress={() => setOpen(true)} style={styles.input}>
            <Text style={{ fontSize: 16, color: dob instanceof Date ? "#333" : "#B0B0B0" }}>
              {formatDobDisplay(dob)}
            </Text>
          </Pressable>

          {open ? (
            <DateTimePicker
              value={dob || maxBirthDate}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={handleDateChange}
              maximumDate={maxBirthDate}
              minimumDate={minBirthDate}
            />
          ) : null}

          <Pressable
            style={[styles.button, { opacity: !canContinue || isSubmitting ? 0.5 : 1, marginTop: "auto" }]}
            disabled={!canContinue || isSubmitting}
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
