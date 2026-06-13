import React from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';

const ICON_COLOR = '#FF7A00';

export type EventDateLocationRowsProps = {
  datePrimary?: string;
  dateSecondary?: string;
  locationPrimary?: string;
  locationSecondary?: string;
  style?: StyleProp<ViewStyle>;
};

export function EventDateLocationRows({
  datePrimary,
  dateSecondary,
  locationPrimary,
  locationSecondary,
  style,
}: EventDateLocationRowsProps) {
  const showDate = Boolean(datePrimary || dateSecondary);
  const showLocation = Boolean(locationPrimary);

  if (!showDate && !showLocation) return null;

  return (
    <View style={style}>
      {showDate ? (
        <View style={styles.row}>
          <View style={styles.iconBg}>
            <Feather name="calendar" size={18} color={ICON_COLOR} />
          </View>
          <View style={styles.textCol}>
            {datePrimary ? (
              <Text style={styles.primary} numberOfLines={1}>
                {datePrimary}
              </Text>
            ) : null}
            {dateSecondary ? (
              <Text style={styles.secondary} numberOfLines={1}>
                {dateSecondary}
              </Text>
            ) : null}
          </View>
        </View>
      ) : null}

      {showLocation ? (
        <View style={styles.row}>
          <View style={styles.iconBg}>
            <Feather name="map-pin" size={18} color={ICON_COLOR} />
          </View>
          <View style={styles.textCol}>
            <Text style={styles.primary} numberOfLines={1}>
              {locationPrimary}
            </Text>
            {locationSecondary ? (
              <Text style={styles.secondary} numberOfLines={2}>
                {locationSecondary}
              </Text>
            ) : null}
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  iconBg: {
    padding: 10,
    backgroundColor: '#F2F3F5',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    marginRight: 12,
  },
  textCol: {
    flex: 1,
    minWidth: 0,
  },
  primary: {
    fontSize: 14,
    color: '#111111',
    fontWeight: '600',
  },
  secondary: {
    fontSize: 13,
    color: '#666666',
    marginTop: 2,
  },
});
