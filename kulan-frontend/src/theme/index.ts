import { useColorScheme } from 'react-native';

// Define the color palettes for both light and dark modes
const lightColors = {
  primary: "#FF7B3F",       // Brand orange
  primarySoft: "#FFEFE5",   // Soft peach background
  text: "#1C1C1E",          // Primary text
  textSecondary: "#6E6E72", // Muted text
  background: "#FFFFFF",    // Screen background
  backgroundMuted: "#F5F5F6", // Home / list backdrop (light gray)
  card: "#FFFFFF",          // Card background
  border: "#F0F0F0",        // Subtle borders
  icon: '#333',
  tagOnlineBg: '#E8F6EE',
  tagOnlineFg: '#0D9A58',
  tagPhysicalBg: '#EEF3FF',
  tagPhysicalFg: '#5D6AE6',
};

const darkColors = {
  primary: "#FF7B3F",       // Brand orange stands out well
  primarySoft: "#4A2E1E",   // Dark, warm background
  text: "#F2F2F7",          // Primary text (off-white)
  textSecondary: "#8A8A8E", // Muted text
  background: "#000000",    // True black background
  backgroundMuted: "#000000",
  card: "#1C1C1E",          // Dark grey card background
  border: "#38383A",        // Subtle borders
  icon: '#FFF',
  tagOnlineBg: '#1C2A22',
  tagOnlineFg: '#5EE9A8',
  tagPhysicalBg: '#222433',
  tagPhysicalFg: '#A5B4FC',
};

// Custom hook to get the correct color palette
export const useThemeColors = () => {
  const colorScheme = useColorScheme();
  
  // Return the correct palette based on the user's color scheme
  // Default to light mode if the scheme is null/undefined
  const colors = colorScheme === 'dark' ? darkColors : lightColors;

  return colors;
};

// You can also export other theme properties here
export const spacing = {
  xs: 12,
  sm: 8,
  md: 16,
  lg: 20,
  xl: 24,
};