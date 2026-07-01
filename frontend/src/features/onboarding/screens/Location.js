import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Animated,
} from "react-native";
import * as ExpoLocation from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import useGuardedRouter from "@/hooks/useGuardedRouter";
import WelcomeAnimatedBackground from "@/features/auth/components/welcome/WelcomeAnimatedBackground";
import useOnboardingAnimation from "@/features/onboarding/hooks/useOnboardingAnimation";
import onboardingApi from "@/api/onboarding";
import useAuth from "@/auth/useAuth";
import { mergeAuthenticatedUserFromMe } from "@/auth/mergeAuthenticatedUserFromMe";
import OnboardingHeader from "@/features/onboarding/components/OnboardingHeader";
import { logApiError } from "@/api/logApiError";
import LocationSvg from "@/assets/location.svg";
import { SOMALIA_DISTRICTS } from "@/constants/somaliaDistricts";
import { formatDetectedLocationFromGeocode, reverseGeocodePlaceFromCoords } from "@/utils/somaliaDistrictMatch";

export { SOMALIA_DISTRICTS };

export function formatLocation(item) {
  return `${item.city}, ${item.region}, ${item.district}`;
}

export default function LocationScreen() {
  const router = useGuardedRouter();
  const insets = useSafeAreaInsets();
  const { setUser } = useAuth();

  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [isDetecting, setIsDetecting] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState("");
  const inputRef = useRef(null);

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
        const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
        if (status !== "granted") return;

        const pos = await ExpoLocation.getCurrentPositionAsync({
          accuracy: ExpoLocation.Accuracy.High,
        });
        const place = await reverseGeocodePlaceFromCoords(
          pos.coords.latitude,
          pos.coords.longitude,
        );

        if (place) {
          const detected = formatDetectedLocationFromGeocode(place);
          if (detected) {
            setQuery(detected);
            setSelected(detected);
          }
        }
      } catch (e) {
        logApiError(e, "GET location/detect");
      } finally {
        setIsDetecting(false);
      }
    })();
  }, []);

  const handleQueryChange = (text) => {
    setQuery(text);
    setSelected(null);

    if (text.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const lower = text.toLowerCase();
    const matches = SOMALIA_DISTRICTS.filter(
      (d) =>
        d.city.toLowerCase().includes(lower) ||
        d.region.toLowerCase().includes(lower) ||
        d.district.toLowerCase().includes(lower)
    ).slice(0, 6);

    setSuggestions(matches);
  };

  const handleSelect = (item) => {
    const formatted = formatLocation(item);
    setQuery(formatted);
    setSelected(formatted);
    setSuggestions([]);
  };

  const handleNext = async () => {
    const locationValue = selected || query.trim();
    if (!locationValue) return;

    setIsSubmitting(true);
    setApiError("");

    try {
      await onboardingApi.updateProfile({ location: locationValue });
      mergeAuthenticatedUserFromMe(setUser); // fire and forget — no need to block navigation
      router.push("/onboarding/Gender");
    } catch (error) {
      logApiError(error, "PATCH onboarding/profile location");
      setApiError("Failed to save location. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const canContinue = !!(selected || query.trim());

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#FFFFFF" }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <WelcomeAnimatedBackground />
      <OnboardingHeader step={1} total={5} onBack={handleBack} />

      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 24,
          paddingBottom: Math.max(24, insets.bottom + 16),
        }}
      >
        <Animated.View style={{ flex: 1, opacity: fade, transform: [{ translateY: slideUp }] }}>
          <Animated.View style={{ width: "100%", maxWidth: 440, height: 320, alignSelf: "center", marginTop: 8, marginBottom: 10, transform: [{ translateY: heroFloat }] }}>
            <LocationSvg width="100%" height="100%" />
          </Animated.View>

          <Text style={styles.title}>Where do you live?</Text>
          <Text style={styles.subtitle}>
            This helps us show you relevant events in your area.
          </Text>

          {apiError ? <Text style={styles.errorText}>{apiError}</Text> : null}

          <View style={styles.inputWrap}>
            <Ionicons
              name="search-outline"
              size={18}
              color="#FF7B3F"
              style={styles.inputIconLeft}
            />
            <TextInput
              ref={inputRef}
              style={styles.input}
              placeholder={
                isDetecting ? "Detecting your location…" : "Search city or district"
              }
              placeholderTextColor="#B0B0B0"
              value={query}
              onChangeText={handleQueryChange}
            />
            {query.length > 0 && (
              <Pressable
                style={styles.clearBtn}
                hitSlop={8}
                onPress={() => {
                  setQuery("");
                  setSelected(null);
                  setSuggestions([]);
                }}
              >
                <Ionicons name="close-circle" size={18} color="#CCC" />
              </Pressable>
            )}
          </View>

          {suggestions.length > 0 && (
            <View style={styles.dropdown}>
              {suggestions.map((item, idx) => (
                <Pressable
                  key={`${item.city}-${item.district}-${idx}`}
                  style={[
                    styles.suggestionRow,
                    idx < suggestions.length - 1 && styles.suggestionDivider,
                  ]}
                  onPress={() => handleSelect(item)}
                >
                  <Ionicons
                    name="location-outline"
                    size={15}
                    color="#FF7B3F"
                    style={{ marginRight: 8, marginTop: 1 }}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.suggestionMain}>{item.city}</Text>
                    <Text style={styles.suggestionSub}>
                      {item.region} · {item.district}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          )}

          <Pressable
            style={[
              styles.button,
              { opacity: canContinue && !isSubmitting ? 1 : 0.45, marginTop: "auto" },
            ]}
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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
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
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#FF7B3F",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 4,
  },
  inputIconLeft: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#222",
    padding: 0,
  },
  clearBtn: {
    marginLeft: 4,
    padding: 2,
  },
  dropdown: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#F0F0F0",
    borderRadius: 14,
    marginTop: 4,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
    overflow: "hidden",
  },
  suggestionRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  suggestionDivider: {
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
  },
  suggestionMain: {
    fontSize: 14,
    fontWeight: "600",
    color: "#222",
  },
  suggestionSub: {
    fontSize: 12,
    color: "#999",
    marginTop: 1,
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
