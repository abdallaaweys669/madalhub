import React, { type ComponentProps, useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type FilterButtonGroupProps = {
  options: Array<{
    value: string;
    label: string;
    icon?: ComponentProps<typeof Ionicons>['name'];
  }>;
  value: string;
  onChange: (next: string) => void;
};

export function FilterButtonGroup({
  options,
  value,
  onChange,
}: FilterButtonGroupProps) {
  const scales = useRef<Animated.Value[]>([]);
  if (scales.current.length !== options.length) {
    scales.current = options.map(() => new Animated.Value(1));
  }

  useEffect(() => {
    options.forEach((opt, idx) => {
      const isActive = opt.value === value;
      Animated.spring(scales.current[idx], {
        toValue: isActive ? 1.03 : 1,
        friction: 8,
        tension: 130,
        useNativeDriver: false,
      }).start();
    });
  }, [options, value]);

  return (
    <View style={styles.row}>
      {options.map((option) => {
        const active = option.value === value;
        const idx = options.findIndex((opt) => opt.value === option.value);
        return (
          <Pressable key={option.value} onPress={() => onChange(option.value)} hitSlop={4}>
            {({ pressed }) => (
              <Animated.View
                style={[
                  styles.button,
                  active ? styles.buttonActive : styles.buttonInactive,
                  {
                    transform: [{ scale: pressed ? 0.96 : scales.current[idx] }],
                  },
                ]}
              >
                <View style={styles.buttonContent}>
                  {option.icon ? (
                    <Ionicons
                      name={option.icon}
                      size={15}
                      color={active ? '#FF7A00' : '#8B93A1'}
                      style={styles.icon}
                    />
                  ) : null}
                  <Text
                    style={[
                      styles.buttonText,
                      active ? styles.buttonTextActive : styles.buttonTextInactive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </View>
              </Animated.View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  button: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginRight: 10,
    marginBottom: 10,
    borderWidth: 1,
  },
  buttonActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FF7A00',
    shadowColor: '#FF7A00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 8,
    elevation: 2,
  },
  buttonInactive: {
    backgroundColor: '#F2F3F5',
    borderColor: '#F2F3F5',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 6,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  buttonTextActive: {
    color: '#FF7A00',
  },
  buttonTextInactive: {
    color: '#5F6877',
  },
});

