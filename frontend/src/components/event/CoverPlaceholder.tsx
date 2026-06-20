import React from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

type CoverPlaceholderProps = {
  letter: string;
  gradient: readonly [string, string];
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
  letterSize?: number;
  showLetter?: boolean;
};

export function CoverPlaceholder({
  letter,
  gradient,
  borderRadius = 0,
  style,
  letterSize = 44,
  showLetter = true,
}: CoverPlaceholderProps) {
  const initial = letter.trim().slice(0, 1).toUpperCase() || '?';

  return (
    <View style={[styles.wrap, { borderRadius }, style]}>
      <LinearGradient colors={[...gradient]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.gradient, { borderRadius }]}>
        {showLetter ? (
          <Text style={[styles.letter, { fontSize: letterSize }]}>{initial}</Text>
        ) : null}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
    backgroundColor: '#E8EAED',
    width: '100%',
    height: '100%',
  },
  gradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  letter: {
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -1,
    textShadowColor: 'rgba(0,0,0,0.18)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});
