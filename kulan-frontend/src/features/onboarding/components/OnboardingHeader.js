import React from "react";
import { View, Pressable, StyleSheet, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from 'react-native-safe-area-context';

export default function OnboardingHeader({
  step,
  total,
  onBack,
  onSkip,
  showSkip = false,
  skipLabel = 'Skip',
}) {
  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.row}>
          <Pressable onPress={onBack} style={styles.backBtn} hitSlop={8}>
            <Ionicons name="chevron-back" size={24} color="#FF7B3F" />
          </Pressable>

          <View style={styles.rightSlot}>
            {showSkip ? (
              <Pressable onPress={onSkip} hitSlop={8}>
                <Text style={styles.skipText}>{skipLabel}</Text>
              </Pressable>
            ) : null}
          </View>
        </View>

        <View style={styles.progressWrapper}>
          <View
            style={[
              styles.progressFill,
              { width: `${(step / total) * 100}%` },
            ]}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#FFFFFF',
  },
  container: {
    width: "100%",
    paddingHorizontal: 24,
    paddingTop: 6,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 36,
    height: 36,
    justifyContent: "center",
  },
  rightSlot: {
    minWidth: 48,
    alignItems: 'flex-end',
  },
  skipText: {
    color: '#FF7B3F',
    fontWeight: '700',
    fontSize: 15,
  },
  progressWrapper: {
    width: "100%",
    height: 6,
    backgroundColor: "#FFE3D1",
    borderRadius: 3,
    marginTop: 12,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#FF7B3F",
    borderRadius: 3,
  },
});
