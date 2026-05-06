import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  LayoutAnimation,
  Platform,
  UIManager,
  Animated,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const BADGE_STYLES = {
  required: { bg: '#FEF9C3', fg: '#A16207', label: 'Required' },
  optional: { bg: '#F3F4F6', fg: '#6B7280', label: 'Optional' },
  check: { bg: '#ECFDF5', fg: '#15803D', label: 'Check' },
  warning: { bg: '#FEF9C3', fg: '#A16207', label: 'Required' },
};

/**
 * @param {object} props
 * @param {string} props.iconName — Ionicons name (Outline set)
 * @param {string} props.title
 * @param {string} [props.subtitle]
 * @param {'required'|'optional'|'check'|'warning'} props.badgeVariant
 * @param {string} [props.badgeText] — override label
 * @param {boolean} props.open
 * @param {() => void} props.onToggle
 * @param {string} props.chevronColor
 * @param {React.ReactNode} props.children
 */
export default function CollapsibleSection({
  iconName,
  title,
  subtitle,
  badgeVariant = 'optional',
  badgeText,
  open,
  onToggle,
  chevronColor = '#596175',
  children,
}) {
  const spin = useRef(new Animated.Value(open ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(spin, {
      toValue: open ? 1 : 0,
      duration: 200,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [open, spin]);

  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '90deg'],
  });

  const badge = BADGE_STYLES[badgeVariant] || BADGE_STYLES.optional;
  const label = badgeText ?? badge.label;

  const handleToggle = () => {
    LayoutAnimation.configureNext(
      LayoutAnimation.create(220, LayoutAnimation.Types.easeInEaseOut, LayoutAnimation.Properties.opacity),
    );
    onToggle();
  };

  return (
    <View style={styles.card}>
      <Pressable onPress={handleToggle} style={styles.headerPress}>
        <View style={styles.headerLeft}>
          <Ionicons name={iconName} size={22} color="#FF7B3F" />
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{title}</Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>
        </View>
        <View style={[styles.badge, { backgroundColor: badge.bg }]}>
          <Text style={[styles.badgeText, { color: badge.fg }]}>{label}</Text>
        </View>
        <Animated.View style={{ transform: [{ rotate }] }}>
          <Ionicons name="chevron-forward" size={22} color={chevronColor} />
        </Animated.View>
      </Pressable>

      {open ? (
        <View style={styles.body}>
          <View style={styles.innerPad}>{children}</View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ECEEF5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 3,
    overflow: 'hidden',
  },
  headerPress: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, flex: 1 },
  title: { fontSize: 17, fontWeight: '800', color: '#12131A' },
  subtitle: { fontSize: 13, fontWeight: '500', color: '#6E7380', marginTop: 4 },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  badgeText: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.3 },
  body: { width: '100%' },
  innerPad: { paddingHorizontal: 16, paddingBottom: 16 },
});
