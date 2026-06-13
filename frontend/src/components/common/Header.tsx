import React from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';

import { spacing } from '@/theme';

type HeaderProps = ViewProps & {
  left?: React.ReactNode;
  right?: React.ReactNode;
};

export function Header({ left, right, style, ...rest }: HeaderProps) {
  return (
    <View style={[styles.row, style]} {...rest}>
      <View style={styles.left}>{left}</View>
      <View style={styles.right}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  left: {
    flexShrink: 0,
    marginRight: spacing.sm,
  },
  right: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    minWidth: 0,
  },
});
