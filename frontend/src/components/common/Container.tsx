import React from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';

import { useThemeColors } from '@/theme';

type ContainerProps = ViewProps & {
  children: React.ReactNode;
};

export function Container({ children, style, ...rest }: ContainerProps) {
  const colors = useThemeColors();

  return (
    <View style={[styles.root, { backgroundColor: colors.backgroundMuted }, style]} {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
