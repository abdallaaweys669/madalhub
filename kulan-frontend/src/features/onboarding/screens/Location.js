import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import onboardingApi from "@/api/onboarding";
import OnboardingHeader from "@/features/onboarding/components/OnboardingHeader";
import styles from "@/constants/onboardingStyles/styles";

import LocationSvg from "@/assets/location.svg";

export default function LocationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/onboarding/WelcomeIntro');
  };

  const [locationText, setLocationText] = useState("");
  const [isDetecting, setIsDetecting] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") return setIsDetecting(false);

        let pos = await Location.getCurrentPositionAsync({});
        let geo = await Location.reverseGeocodeAsync(pos.coords);

        if (geo[0]) {
          const { city, region, country } = geo[0];
          const loc = `${city || ""}${region ? ", " + region : ""}${
            country ? ", " + country : ""
          }`;
          setLocationText(loc);
        }
      } catch (error) {
        console.log("Error detecting location:", error);
      }
      setIsDetecting(false);
    })();
  }, []);

  const handleNext = async () => {
    if (!locationText) return;

    setIsSubmitting(true);
    setApiError("");

    try {
      await onboardingApi.updateProfile({ location: locationText });
      router.push("/onboarding/Gender");
    } catch (error) {
      setApiError("Failed to save location. Please try again.");
      console.error("Location update error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#FFFFFF' }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <OnboardingHeader step={1} total={4} onBack={handleBack} />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 24,
          paddingBottom: Math.max(24, insets.bottom + 16),
        }}
      >
        <View style={{ flex: 1 }}>
          <LocationSvg width={280} height={250} style={{ alignSelf: 'center', marginTop: 8, marginBottom: 12 }} />

          <Text style={styles.title}>Where do you live?</Text>
          <Text style={styles.subtitle}>
            We use your city to find events near you.
          </Text>

          {apiError ? <Text style={styles.errorText}>{apiError}</Text> : null}

          <TextInput
            style={styles.input}
            placeholder={isDetecting ? "Detecting your location..." : "Enter your city"}
            value={locationText}
            onChangeText={setLocationText}
          />

          <Pressable
            style={[
              styles.button,
              { opacity: !locationText || isSubmitting ? 0.5 : 1, marginTop: 'auto' },
            ]}
            disabled={!locationText || isSubmitting}
            onPress={handleNext}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Continue</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
