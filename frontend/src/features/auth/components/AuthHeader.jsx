import React from 'react';
import { View, Text } from 'react-native';
import CalendarMan from '@/assets/DatePickerCuate.svg';
import styles from '@/constants/loginSignin/authStyles';

export default function AuthHeader({ title, subtitle }) {
  return (
    <View style={{ alignItems: 'center', marginBottom: 20 }}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>

      <CalendarMan width={220} height={220} style={styles.illustration} />
    </View>
  );
}
