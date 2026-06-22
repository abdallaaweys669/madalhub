import React, { memo } from 'react';
import { Pressable, Text, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { MaterialIcons } from '@expo/vector-icons';
import { FontAwesome5 } from '@expo/vector-icons';
import { Ionicons } from '@expo/vector-icons';
import { Feather } from '@expo/vector-icons';
import { colors } from '@/features/onboarding/tokens/colors';
import { resolveInterestIcon } from '@/components/explore/exploreCategoryIcons';
import { INTEREST_ICON_MAP } from '@/features/onboarding/data/interestIconMap';

function renderVectorIcon(iconSpec, color) {
  if (!iconSpec) return null;
  const { pack, name } = iconSpec;
  const size = 16;
  const props = { name, size, color };
  switch (pack) {
    case 'MaterialCommunityIcons':
      return <MaterialCommunityIcons {...props} />;
    case 'MaterialIcons':
      return <MaterialIcons {...props} />;
    case 'FontAwesome5':
      return <FontAwesome5 {...props} />;
    case 'Ionicons':
      return <Ionicons {...props} />;
    case 'Feather':
      return <Feather {...props} />;
    default:
      return null;
  }
}

function ChipBase({ label, icon, iconSpec, ionicon, selected, onPress }) {
  const resolvedIconSpec =
    iconSpec ||
    (ionicon ? { pack: 'Ionicons', name: ionicon } : null) ||
    (label ? { pack: 'Ionicons', name: resolveInterestIcon({ name: label }) } : null) ||
    INTEREST_ICON_MAP[label];

  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, selected && styles.chipActive]}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`${label}${selected ? ', selected' : ''}`}
      hitSlop={6}
    >
      {resolvedIconSpec ? (
        <View style={styles.iconWrap}>{renderVectorIcon(resolvedIconSpec, selected ? colors.text : colors.subtext)}</View>
      ) : (
        !!icon && <Text style={styles.emoji}>{icon}</Text>
      )}
      <Text style={[styles.text, selected && styles.textActive]}>{label}</Text>
    </Pressable>
  );
}

export default memo(ChipBase);

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bg,
    borderRadius: 999, paddingVertical: 8, paddingHorizontal: 12,
    marginRight: 8, marginBottom: 10,
    shadowColor: colors.shadow, shadowOpacity: 0.03, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1,
  },
  chipActive: { backgroundColor: colors.chipActiveBg, borderColor: colors.progressActive },
  iconWrap: { marginRight: 6 },
  emoji: { marginRight: 6, fontSize: 14 },
  text: { fontSize: 14, color: colors.text, fontWeight: '600' },
  textActive: { color: colors.text },
});
