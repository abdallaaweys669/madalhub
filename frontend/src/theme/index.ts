import { useMemo } from 'react';

const lightColors = {
  primary: '#FF7B3F',
  primarySoft: '#FFEFE5',
  text: '#1C1C1E',
  textSecondary: '#6E6E72',
  background: '#FFFFFF',
  backgroundMuted: '#F5F5F6',
  card: '#FFFFFF',
  border: '#F0F0F0',
  icon: '#333',
  tagOnlineBg: '#E8F6EE',
  tagOnlineFg: '#0D9A58',
  tagPhysicalBg: '#EEF3FF',
  tagPhysicalFg: '#5D6AE6',
};

export const useThemeColors = () => {
  return useMemo(() => lightColors, []);
};

export const spacing = {
  xs: 12,
  sm: 8,
  md: 16,
  lg: 20,
  xl: 24,
};
