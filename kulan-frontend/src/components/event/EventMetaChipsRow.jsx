import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Ionicons } from '@expo/vector-icons';

import { styles as eventStyles } from '@/constants/eventDetails_styles/eventDetails.styles';
import { formatKeyToDisplayLabel } from '@/constants/eventFormatLabels';

function ChipShell({ children, onPress, style }) {
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [style, pressed ? { opacity: 0.88 } : null]}
      >
        {children}
      </Pressable>
    );
  }
  return <View style={style}>{children}</View>;
}

/**
 * Category · delivery (online / in-person) · event format — same visuals on create + detail;
 * pass `onPress*` handlers for interactive create flow, omit for read-only detail.
 *
 * @param {'create' | 'detail'} variant — create shows placeholder copy when unset; detail hides empty chips.
 */
export default function EventMetaChipsRow({
  categoryLabel,
  formatKey,
  isOnline,
  variant = 'detail',
  onPressCategory,
  onPressDelivery,
  onPressFormat,
  style,
}) {
  const formatDisplay = formatKeyToDisplayLabel(formatKey);
  const hasStoredFormat = Boolean(formatKey != null && String(formatKey).trim());
  const categoryTrimmed = typeof categoryLabel === 'string' ? categoryLabel.trim() : '';

  const showCategory = variant === 'create' || Boolean(categoryTrimmed);
  /** Detail always shows 3 pills (matches design); create always shows format row including placeholders. */
  const showFormat = variant === 'create' || variant === 'detail';

  const categoryText =
    variant === 'create' ? categoryTrimmed || 'Pick category' : categoryTrimmed;

  const formatText =
    variant === 'create'
      ? formatDisplay || 'Pick format'
      : formatDisplay || 'Not specified';

  const deliveryLabel = isOnline ? 'ONLINE' : 'IN-PERSON';

  const useFormatPlaceholderStyle = variant === 'detail' && !hasStoredFormat;
  const formatChipStyles = useFormatPlaceholderStyle
    ? [eventStyles.eventMetaChip, eventStyles.eventMetaChipFormatPlaceholder]
    : [eventStyles.eventMetaChip, eventStyles.eventMetaChipFormat];
  const formatTextStyles = useFormatPlaceholderStyle
    ? eventStyles.eventMetaChipFormatTextPlaceholder
    : eventStyles.eventMetaChipFormatText;
  const formatIconColor = useFormatPlaceholderStyle ? '#9CA3AF' : '#059669';

  return (
    <View style={[eventStyles.eventMetaChipRow, style]}>
      {showCategory ? (
        <ChipShell
          onPress={onPressCategory}
          style={[eventStyles.eventMetaChip, eventStyles.eventMetaChipCategory]}
        >
          <Ionicons name="pricetag-outline" size={12} color="#EA580C" />
          <Text style={eventStyles.eventMetaChipCategoryText} numberOfLines={1}>
            {categoryText}
          </Text>
        </ChipShell>
      ) : null}

      <ChipShell
        onPress={onPressDelivery}
        style={[eventStyles.eventMetaChip, eventStyles.eventMetaChipDelivery]}
      >
        <Feather name={isOnline ? 'video' : 'map-pin'} size={12} color="#4338CA" />
        <Text style={eventStyles.eventMetaChipDeliveryText}>{deliveryLabel}</Text>
      </ChipShell>

      {showFormat ? (
        <ChipShell onPress={onPressFormat} style={formatChipStyles}>
          <Feather name="grid" size={12} color={formatIconColor} />
          <Text style={formatTextStyles}>{formatText}</Text>
        </ChipShell>
      ) : null}
    </View>
  );
}
