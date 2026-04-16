import React, { useState } from "react";
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import styles from "@/constants/onboardingStyles/styles";
import OnboardingHeader from "@/features/onboarding/components/OnboardingHeader";
import onboardingApi from "@/api/onboarding";

import CalendarSvg from "@/assets/DOB.svg";

export default function DOB() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/onboarding/WelcomeIntro');
  };
  const [dob, setDob] = useState(null);
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState("");

  const handleDateChange = (event, selectedDate) => {
    setOpen(false);
    if (selectedDate) {
      setDob(selectedDate);
    }
  };

  const handleNext = async () => {
    if (!dob) return;

    setIsSubmitting(true);
    setApiError("");

    try {
      // Format date to YYYY-MM-DD for the backend
      const formattedDate = dob.toISOString().split("T")[0];
      await onboardingApi.updateProfile({ dob: formattedDate });
      router.push("/onboarding/Interests");
    } catch (error) {
      setApiError("Failed to save date of birth. Please try again.");
      console.error("DOB update error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <OnboardingHeader
        step={3}
        total={4}
        onBack={handleBack}
        showSkip
        onSkip={() => router.push('/onboarding/Interests')}
      />

      <View
        style={{
          flex: 1,
          paddingHorizontal: 24,
          paddingBottom: Math.max(24, insets.bottom + 16),
        }}
      >
        <CalendarSvg width={280} height={260} style={{ alignSelf: 'center', marginTop: 8, marginBottom: 10 }} />

        <Text style={styles.title}>When is your birthday?</Text>
        <Text style={styles.subtitle}>
          Only your age appears on your profile.
        </Text>

        {apiError ? <Text style={styles.errorText}>{apiError}</Text> : null}

        <Pressable onPress={() => setOpen(true)} style={styles.input}>
          <Text style={{ fontSize: 16, color: dob ? "#333" : "#E8A683" }}>
            {dob ? dob.toDateString() : "Select your date of birth"}
          </Text>
        </Pressable>

        {open && (
          <DateTimePicker
            value={dob || new Date(2000, 0, 1)}
            mode="date"
            display="spinner"
            onChange={handleDateChange}
          />
        )}

        <Pressable
          style={[styles.button, { opacity: !dob || isSubmitting ? 0.5 : 1, marginTop: 'auto' }]}
          disabled={!dob || isSubmitting}
          onPress={handleNext}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Continue</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}
