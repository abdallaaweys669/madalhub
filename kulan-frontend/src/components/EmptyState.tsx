import React from 'react';
import { View, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';

// --- 1. Import hooks for dynamic theme colors and spacing ---
import { useThemeColors, spacing } from '@/theme';

// Define the component's props with TypeScript for better safety
interface EmptyStateProps {
  title: string;
  message: string;
  icon?: keyof typeof Feather.glyphMap; // Makes the icon customizable!
}

const EmptyState: React.FC<EmptyStateProps> = ({ title, message, icon = 'inbox' }) => {
  // --- 2. Get the current theme's colors (light or dark) ---
  const colors = useThemeColors();

  return (
    // The styles are now inline to dynamically use the theme colors
    <View style={{
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.lg,
      marginVertical: spacing.xl,
    }}>
      <Feather 
        name={icon} 
        size={48} 
        // --- 3. Use theme color for the icon ---
        color={colors.textSecondary} 
        style={{ opacity: 0.7 }}
      />
      <Text style={{
        fontSize: 18,
        fontWeight: 'bold',
        // --- 4. Use theme color for the title ---
        color: colors.text,
        marginTop: spacing.md,
      }}>
        {title}
      </Text>
      <Text style={{
        fontSize: 14,
        // --- 5. Use theme color for the message ---
        color: colors.textSecondary,
        textAlign: 'center',
        marginTop: spacing.sm,
      }}>
        {message}
      </Text>
    </View>
  );
};

export default EmptyState;