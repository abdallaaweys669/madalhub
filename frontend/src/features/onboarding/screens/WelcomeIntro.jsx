import React, { useEffect } from "react";
import { View, Text, StyleSheet, Pressable, Animated, ActivityIndicator, ScrollView } from "react-native";
import { useFonts } from "expo-font";
import { Ionicons } from "@expo/vector-icons";
import useGuardedRouter from "@/hooks/useGuardedRouter";
import MenTalkingIllustration from "@/assets/Men talking.svg";
import WelcomeAnimatedBackground from "@/features/auth/components/welcome/WelcomeAnimatedBackground";
import useOnboardingAnimation from "@/features/onboarding/hooks/useOnboardingAnimation";
import {
  authFontAssets,
  FONT_PLAYFAIR_BOLD,
  FONT_JAKARTA_REGULAR,
  FONT_JAKARTA_BOLD,
} from "@/features/auth/theme/authTypography";
import { colors } from "../tokens/colors";

const BENEFITS = [
  {
    icon: "location-outline",
    title: "Events near you",
    desc: "Based on where you live",
  },
  {
    icon: "sparkles-outline",
    title: "Matched to your interests",
    desc: "Only what you'll actually enjoy",
  },
  {
    icon: "time-outline",
    title: "One-time setup",
    desc: "Takes less than a minute",
  },
];

function BenefitRow({ icon, title, desc }) {
  return (
    <View style={styles.row}>
      <View style={styles.iconBadge}>
        <Ionicons name={icon} size={18} color={colors.primary} />
      </View>
      <View style={styles.rowText}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowDesc}>{desc}</Text>
      </View>
    </View>
  );
}

export default function WelcomeIntro() {
  const router = useGuardedRouter();
  const [fontsLoaded, fontsError] = useFonts(authFontAssets);

  const { fade, slideUp, heroFloat } = useOnboardingAnimation();

  useEffect(() => {
    if (fontsError) {
      console.warn("[Onboarding] Failed to load custom fonts, using fallback fonts.");
    }
  }, [fontsError]);

  if (!fontsLoaded && !fontsError) {
    return (
      <View style={[styles.container, styles.loading]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WelcomeAnimatedBackground />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View
          style={[
            styles.content,
            { opacity: fade, transform: [{ translateY: slideUp }] },
          ]}
        >
          <Animated.View style={[styles.heroWrap, { transform: [{ translateY: heroFloat }] }]}>
            <MenTalkingIllustration width="100%" height="100%" />
          </Animated.View>

          <Text style={styles.title}>Events made for you</Text>
          <Text style={styles.subtitle}>
            Your next favourite event is out there.{"\n"}Help us find it for you.
          </Text>

          <View style={styles.card}>
            {BENEFITS.map((b, i) => (
              <View key={b.title}>
                {i > 0 ? <View style={styles.divider} /> : null}
                <BenefitRow {...b} />
              </View>
            ))}
          </View>
        </Animated.View>

        <Animated.View style={[styles.footer, { opacity: fade }]}>
          <Pressable
            style={styles.button}
            onPress={() => router.replace("/onboarding/Location")}
          >
            <Text style={styles.buttonText}>Let's Get Started</Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 28,
    justifyContent: "space-between",
  },
  loading: {
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    width: "100%",
    alignItems: "center",
  },
  heroWrap: {
    width: "100%",
    maxWidth: 440,
    height: 320,
    marginBottom: 10,
    alignSelf: "center",
  },
  title: {
    fontFamily: FONT_PLAYFAIR_BOLD,
    fontSize: 30,
    textAlign: "center",
    color: colors.text,
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  subtitle: {
    fontFamily: FONT_JAKARTA_REGULAR,
    fontSize: 15,
    color: colors.subtext,
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 6,
    maxWidth: 330,
    marginBottom: 16,
  },
  card: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    paddingHorizontal: 16,
    paddingVertical: 6,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 11,
  },
  iconBadge: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: "rgba(255, 123, 63, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 13,
  },
  rowText: {
    flex: 1,
  },
  rowTitle: {
    fontFamily: FONT_JAKARTA_BOLD,
    fontSize: 15,
    color: colors.text,
  },
  rowDesc: {
    fontFamily: FONT_JAKARTA_REGULAR,
    fontSize: 12.5,
    color: colors.subtext,
    marginTop: 1,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255, 123, 63, 0.12)",
  },
  footer: {
    width: "100%",
    alignItems: "center",
    marginTop: 20,
  },
  button: {
    width: "100%",
    backgroundColor: colors.primary,
    minHeight: 56,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.primary,
    shadowOpacity: 0.28,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 7,
  },
  buttonText: {
    fontFamily: FONT_JAKARTA_BOLD,
    color: "#FFFFFF",
    fontSize: 17,
    letterSpacing: 0.3,
  },
});
