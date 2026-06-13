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

        <View style={styles.segmentRow}>
          {Array.from({ length: total }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.segment,
                { backgroundColor: i < step ? '#FF7B3F' : '#FFE3D1' },
              ]}
            />
          ))}
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
  segmentRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 12,
  },
  segment: {
    flex: 1,
    height: 5,
    borderRadius: 3,
  },
});
