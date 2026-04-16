import React from "react";
import { View, Text, StyleSheet, Pressable, Image } from "react-native";
import { useRouter } from "expo-router";
import { colors } from "../tokens/colors";

export default function WelcomeIntro() {
  const router = useRouter();

  return (
    <View style={styles.container}>

      {/* Hero Illustration */}
      <Image
        source={require("../../../assets/welcome_hero.png")}
        style={styles.illustration}
        resizeMode="contain"
      />

      {/* Title + Subtitle */}
      <View style={{ marginTop: 10 }}>
        <Text style={styles.title}>Make Kulan Yours</Text>
        <Text style={styles.subtitle}>
          We personalize events, connections and recommendations  
          based on your location & interests.
        </Text>
      </View>

      {/* CTA Button */}
      <Pressable
        style={styles.button}
        onPress={() => router.replace("/onboarding/Location")}
      >
        <Text style={styles.buttonText}>Start Personalizing</Text>
      </Pressable>

      {/* Mini info */}
      <Text style={styles.footerNote}>
        You can skip optional steps later (Gender & Date of Birth)
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  illustration: {
    width: "100%",
    height: 300,
    marginBottom: 25,
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    textAlign: "center",
    color: colors.text,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: colors.subtext,
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 10,
    marginBottom: 45,
  },
  button: {
    width: "100%",
    backgroundColor: colors.primary,
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 17,
  },
  footerNote: {
    marginTop: 18,
    fontSize: 13,
    color: "#94A3B8",
    textAlign: "center",
  },
});
