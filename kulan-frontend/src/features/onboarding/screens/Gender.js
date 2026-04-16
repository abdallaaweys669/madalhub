import React, { useState } from "react";
import { View, Text, Pressable, Image, ScrollView, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import OnboardingHeader from "@/features/onboarding/components/OnboardingHeader";
import onboardingApi from "@/api/onboarding";
import styles from "@/constants/onboardingStyles/styles";

import GenderSvg from "@/assets/gender.svg";

export default function GenderScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/onboarding/WelcomeIntro');
  };

  const [selected, setSelected] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState("");

  const handleNext = async () => {
    if (!selected) return;

    setIsSubmitting(true);
    setApiError("");

    try {
      await onboardingApi.updateProfile({ gender: selected });
      router.push("/onboarding/DOB");
    } catch (error) {
      setApiError("Failed to save gender. Please try again.");
      console.error("Gender update error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <OnboardingHeader
        step={2}
        total={4}
        onBack={handleBack}
        showSkip
        onSkip={() => router.push('/onboarding/DOB')}
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
        <GenderSvg
          width={"80%"}
          height={220}
          style={{ alignSelf: "center", marginTop: 8, marginBottom: 8 }}
        />

        <Text style={styles.title}>Select your Gender</Text>
        <Text style={styles.subtitle}>Choose one to continue</Text>

        {apiError ? <Text style={styles.errorText}>{apiError}</Text> : null}

        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            width: "100%",
            marginTop: 8,
          }}
        >
        <Pressable
          onPress={() => setSelected((current) => (current === "Female" ? null : "Female"))}
          style={{
            width: '48%',
            height: 140,
            borderRadius: 20,
            backgroundColor: "#FFFFFF",
            borderWidth: selected === "Female" ? 2.5 : 1,
            borderColor: selected === "Female" ? "#FF7B3F" : "#DDDDDD",
            justifyContent: "center",
            alignItems: "center",
            elevation: selected === "Female" ? 4 : 0,
          }}
        >
          <Image
            source={require("@/assets/female.png")}
            style={{ width: 55, height: 55 }}
          />
          <Text style={{ marginTop: 12, fontSize: 17, fontWeight: "600" }}>
            Female
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setSelected((current) => (current === "Male" ? null : "Male"))}
          style={{
            width: '48%',
            height: 140,
            borderRadius: 20,
            backgroundColor: "#FFFFFF",
            borderWidth: selected === "Male" ? 2.5 : 1,
            borderColor: selected === "Male" ? "#FF7B3F" : "#DDDDDD",
            justifyContent: "center",
            alignItems: "center",
            elevation: selected === "Male" ? 4 : 0,
          }}
        >
          <Image
            source={require("@/assets/male.png")}
            style={{ width: 55, height: 55 }}
          />
          <Text style={{ marginTop: 12, fontSize: 17, fontWeight: "600" }}>
            Male
          </Text>
        </Pressable>
        </View>

        <Pressable
          disabled={!selected || isSubmitting}
          onPress={handleNext}
          style={[
            styles.button,
            { opacity: !selected || isSubmitting ? 0.4 : 1, marginTop: 'auto' },
          ]}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Continue</Text>
          )}
        </Pressable>
      </ScrollView>
    </View>
  );
}
