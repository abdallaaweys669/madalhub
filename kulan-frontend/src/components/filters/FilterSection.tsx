import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type FilterSectionProps = {
  title: string;
  children: React.ReactNode;
};

export function FilterSection({ title, children }: FilterSectionProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.title}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 22,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 10,
  },
});

