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

// Updated Somalia districts list - Banadir now has 18 districts per 2023 reorganization
export const SOMALIA_DISTRICTS = [
  // Banadir Region (Mogadishu) - 18 districts
  { city: "Mogadishu", region: "Banadir", district: "Abdiaziz" },
  { city: "Mogadishu", region: "Banadir", district: "Bondhere" },
  { city: "Mogadishu", region: "Banadir", district: "Daynile" },
  { city: "Mogadishu", region: "Banadir", district: "Dharkenley" },
  { city: "Mogadishu", region: "Banadir", district: "Hamar Jajab" },
  { city: "Mogadishu", region: "Banadir", district: "Hamar Weyne" },
  { city: "Mogadishu", region: "Banadir", district: "Hawl Wadaag" },
  { city: "Mogadishu", region: "Banadir", district: "Hodan" },
  { city: "Mogadishu", region: "Banadir", district: "Howlwadaag" },
  { city: "Mogadishu", region: "Banadir", district: "Karaan" },
  { city: "Mogadishu", region: "Banadir", district: "Kaxda" },
  { city: "Mogadishu", region: "Banadir", district: "Shangani" },
  { city: "Mogadishu", region: "Banadir", district: "Shibis" },
  { city: "Mogadishu", region: "Banadir", district: "Waberi" },
  { city: "Mogadishu", region: "Banadir", district: "Wadajir" },
  { city: "Mogadishu", region: "Banadir", district: "Warta Nabada" },
  { city: "Mogadishu", region: "Banadir", district: "Yaqshid" },
  // New Banadir districts (2023 reorganization)
  { city: "Mogadishu", region: "Banadir", district: "Garasbaaley" },
  { city: "Mogadishu", region: "Banadir", district: "Gubadley" },
  { city: "Mogadishu", region: "Banadir", district: "Daarusalaam" },
  { city: "Mogadishu", region: "Banadir", district: "Kurtunwarey" },
  { city: "Mogadishu", region: "Banadir", district: "Lafoole" },
  { city: "Mogadishu", region: "Banadir", district: "Safi" },

  // Woqooyi Galbeed
  { city: "Hargeisa", region: "Woqooyi Galbeed", district: "Hargeisa" },
  { city: "Hargeisa", region: "Woqooyi Galbeed", district: "Gabiley" },
  { city: "Berbera", region: "Woqooyi Galbeed", district: "Berbera" },
  { city: "Sheikh", region: "Woqooyi Galbeed", district: "Sheikh" },

  // Togdheer
  { city: "Burao", region: "Togdheer", district: "Burao" },
  { city: "Odwaa", region: "Togdheer", district: "Odwaa" },
  { city: "Buhoodle", region: "Togdheer", district: "Buhoodle" },

  // Sanaag
  { city: "Erigavo", region: "Sanaag", district: "Erigavo" },
  { city: "Badhan", region: "Sanaag", district: "Badhan" },
  { city: "Las Khorey", region: "Sanaag", district: "Las Khorey" },

  // Sool
  { city: "Las Anod", region: "Sool", district: "Las Anod" },
  { city: "Taleh", region: "Sool", district: "Taleh" },
  { city: "Caynabo", region: "Sool", district: "Caynabo" },

  // Bari (Puntland)
  { city: "Bosaso", region: "Bari", district: "Bosaso" },
  { city: "Bosaso", region: "Bari", district: "Qandala" },
  { city: "Bosaso", region: "Bari", district: "Rako" },
  { city: "Bosaso", region: "Bari", district: "Iskushuban" },
  { city: "Bosaso", region: "Bari", district: "Alula" },

  // Nugaal
  { city: "Garowe", region: "Nugaal", district: "Garowe" },
  { city: "Garowe", region: "Nugaal", district: "Eyl" },
  { city: "Garowe", region: "Nugaal", district: "Burtinle" },

  // Mudug
  { city: "Gaalkacyo", region: "Mudug", district: "Gaalkacyo" },
  { city: "Gaalkacyo", region: "Mudug", district: "Galdogob" },
  { city: "Gaalkacyo", region: "Mudug", district: "Jariban" },
  { city: "Gaalkacyo", region: "Mudug", district: "Harardhere" },

  // Jubaland
  { city: "Kismayo", region: "Jubaland", district: "Kismayo" },
  { city: "Kismayo", region: "Jubaland", district: "Afmadow" },
  { city: "Kismayo", region: "Jubaland", district: "Jilib" },
  { city: "Kismayo", region: "Jubaland", district: "Bardera" },
  { city: "Luuq", region: "Jubaland", district: "Luuq" },
  { city: "Garbaharey", region: "Jubaland", district: "Garbaharey" },

  // South West State
  { city: "Baidoa", region: "Bay", district: "Baidoa" },
  { city: "Baidoa", region: "Bay", district: "Buur Hakaba" },
  { city: "Baidoa", region: "Bay", district: "Qansax Dheere" },
  { city: "Barawe", region: "Lower Shabelle", district: "Barawe" },
  { city: "Marka", region: "Lower Shabelle", district: "Marka" },
  { city: "Afgooye", region: "Lower Shabelle", district: "Afgooye" },
  { city: "Kurtunwarey", region: "Lower Shabelle", district: "Kurtunwarey" },
  { city: "Sablaale", region: "Lower Shabelle", district: "Sablaale" },
  { city: "Wanlaweyn", region: "Lower Shabelle", district: "Wanlaweyn" },

  // Hirshabelle
  { city: "Beledweyne", region: "Hiraan", district: "Beledweyne" },
  { city: "Beledweyne", region: "Hiraan", district: "Bulo Burto" },
  { city: "Beledweyne", region: "Hiraan", district: "Jalalaqsi" },
  { city: "Jowhar", region: "Middle Shabelle", district: "Jowhar" },
  { city: "Jowhar", region: "Middle Shabelle", district: "Balad" },
  { city: "Jowhar", region: "Middle Shabelle", district: "Adale" },

  // Galmudug
  { city: "Dhuusamarreeb", region: "Galgaduud", district: "Dhuusamarreeb" },
  { city: "Dhuusamarreeb", region: "Galgaduud", district: "Ceel Buur" },
  { city: "Dhuusamarreeb", region: "Galgaduud", district: "Ceel Dheer" },
  { city: "Galkayo", region: "Mudug", district: "Galkayo" },
  { city: "Galkayo", region: "Mudug", district: "Galdogob" },
  { city: "Cadaado", region: "Galgaduud", district: "Cadaado" },
  { city: "Cadaado", region: "Galgaduud", district: "Abudwak" },

  // Other cities
  { city: "Borama", region: "Awdal", district: "Borama" },
  { city: "Borama", region: "Awdal", district: "Baki" },
  { city: "Borama", region: "Awdal", district: "Lughaye" },
  { city: "Zeila", region: "Awdal", district: "Zeila" },
  { city: "Garoowe", region: "Nugaal", district: "Garoowe" },
  { city: "Kismayo", region: "Jubbada Hoose", district: "Kismayo" },
  { city: "Jalalaqsi", region: "Hiraan", district: "Jalalaqsi" },
  { city: "Xudur", region: "Bakool", district: "Xudur" },
  { city: "Tayeeglow", region: "Bakool", district: "Tayeeglow" },
  { city: "Waajid", region: "Bakool", district: "Waajid" },
  { city: "Diinsoor", region: "Bay", district: "Diinsoor" },
  { city: "Qoryooley", region: "Lower Shabelle", district: "Qoryooley" },
  { city: "Kurtunwarey", region: "Lower Shabelle", district: "Kurtunwarey" },
  { city: "Saakow", region: "Middle Juba", district: "Saakow" },
  { city: "Bu'aale", region: "Middle Juba", district: "Bu'aale" },
  { city: "Tiyeglow", region: "Bakool", district: "Tiyeglow" },
  { city: "El Barde", region: "Bakool", district: "El Barde" },
  { city: "Hoddur", region: "Bakool", district: "Hoddur" },
  { city: "Sargo", region: "Sool", district: "Sargo" },
  { city: "Ceerigaabo", region: "Sanaag", district: "Ceerigaabo" },
  { city: "Laasqoray", region: "Sanaag", district: "Laasqoray" },
  { city: "Baligubadle", region: "Maroodijex", district: "Baligubadle" },
  { city: "Buuhoodle", region: "Togdheer", district: "Buuhoodle" },
  { city: "Oodweyne", region: "Togdheer", district: "Oodweyne" },
  { city: "Sallaxley", region: "Maroodijex", district: "Sallaxley" },
  { city: "Wajaale", region: "Woqooyi Galbeed", district: "Wajaale" },
  { city: "Zeila", region: "Awdal", district: "Zeila" },
  { city: "Lughaya", region: "Awdal", district: "Lughaya" },
  { city: "Baki", region: "Awdal", district: "Baki" },
  { city: "Dila", region: "Awdal", district: "Dila" },
  { city: "Saylac", region: "Awdal", district: "Saylac" },
  { city: "Cadaad", region: "Galgaduud", district: "Cadaad" },
  { city: "Cabudwaaq", region: "Galgaduud", district: "Cabudwaaq" },
  { city: "Baladweyn", region: "Hiraan", district: "Baladweyn" },
  { city: "Beled Hawo", region: "Gedo", district: "Beled Hawo" },
  { city: "Doolow", region: "Gedo", district: "Doolow" },
  { city: "Baardheere", region: "Gedo", district: "Baardheere" },
  { city: "Ceelwaaq", region: "Gedo", district: "Ceelwaaq" },
  { city: "Garbahaarey", region: "Gedo", district: "Garbahaarey" },
  { city: "Xamar Weyne", region: "Banadir", district: "Xamar Weyne" },
  { city: "Waaberi", region: "Banadir", district: "Waaberi" },
  { city: "Huriwa", region: "Banadir", district: "Huriwa" },
  { city: "Villa Somalia", region: "Banadir", district: "Abdiaziz" },
];

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

        const pos = await ExpoLocation.getCurrentPositionAsync({});
        const geo = await ExpoLocation.reverseGeocodeAsync(pos.coords);

        if (geo[0]) {
          const { district, subregion, region } = geo[0];
          const districtName = district || subregion || "";
          const regionName = region || "";

          // GPS "city" field is unreliable in Somalia (returns neighborhoods like "Jabad Geele").
          // Look up the correct city using fuzzy matching — GPS may return Somali names
          // like "Degmada Dayniile" for "Daynile", so we check if names contain each other.
          // Normalize: remove Somali prefix "degmada", collapse repeated letters (dayniile→daynile), lowercase
          const normalize = (s) =>
            s.toLowerCase()
              .replace(/degmada\s*/g, "")
              .replace(/(.)\1+/g, "$1")
              .trim();
          const gpsDistrict = normalize(districtName);
          const gpsRegion = normalize(regionName);

          const match = SOMALIA_DISTRICTS.find((d) => {
            const listDistrict = normalize(d.district);
            const listRegion = normalize(d.region);
            const districtMatch =
              listDistrict === gpsDistrict ||
              listDistrict.includes(gpsDistrict) ||
              gpsDistrict.includes(listDistrict);
            const regionMatch =
              !regionName ||
              listRegion === gpsRegion ||
              listRegion.includes(gpsRegion) ||
              gpsRegion.includes(listRegion);
            return districtMatch && regionMatch;
          });
          const cityName = match?.city || "";
          // If we matched, use the clean district name from our list
          const cleanDistrict = match?.district || districtName;

          const detected = [cleanDistrict, regionName, cityName]
            .filter(Boolean)
            .join(", ");
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
