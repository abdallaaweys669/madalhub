import React, { type ComponentProps, useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

type FilterChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
  icon?: IoniconName;
  variant?: 'default' | 'quickPick';
};

export function FilterChip({
  label,
  selected,
  onPress,
  icon,
  variant = 'default',
}: FilterChipProps) {
  const scale = useRef(new Animated.Value(selected ? 1.02 : 1)).current;
  const active = useRef(new Animated.Value(selected ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: selected ? 1.02 : 1,
      friction: 8,
      tension: 120,
      useNativeDriver: false,
    }).start();
    Animated.timing(active, {
      toValue: selected ? 1 : 0,
      duration: 180,
      useNativeDriver: false,
    }).start();
  }, [active, scale, selected]);

  const animatedBackgroundColor = active.interpolate({
    inputRange: [0, 1],
    outputRange: ['#F2F3F5', '#FFFFFF'],
  });
  const animatedBorderColor = active.interpolate({
    inputRange: [0, 1],
    outputRange: ['#F2F3F5', '#FF7A00'],
  });

  return (
    <Pressable onPress={onPress} hitSlop={4}>
      {({ pressed }) => (
        <Animated.View
          style={[
            styles.chip,
            variant === 'quickPick' && styles.quickPickChip,
            selected ? styles.chipActive : styles.chipInactive,
            {
              backgroundColor: animatedBackgroundColor,
              borderColor: animatedBorderColor,
              transform: [{ scale: pressed ? 0.96 : scale }],
            },
          ]}
        >
          <View style={styles.content}>
            {icon ? (
              <Ionicons
                name={icon}
                size={15}
                color={selected ? '#FF7A00' : '#8B93A1'}
                style={styles.icon}
              />
            ) : null}
            <Text style={[styles.text, selected ? styles.textActive : styles.textInactive]}>
              {label}
            </Text>
          </View>
        </Animated.View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginRight: 10,
    marginBottom: 10,
    borderWidth: 1,
  },
  quickPickChip: {
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  chipActive: {
    shadowColor: '#FF7A00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 8,
    elevation: 2,
  },
  chipInactive: {
    shadowOpacity: 0,
    elevation: 0,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 6,
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
  },
  textActive: {
    color: '#FF7A00',
  },
  textInactive: {
    color: '#5F6877',
  },
});

