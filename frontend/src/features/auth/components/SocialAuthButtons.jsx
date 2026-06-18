import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import useClerkOAuth from '@/features/auth/hooks/useClerkOAuth';
import { FONT_JAKARTA_BOLD } from '@/features/auth/theme/authTypography';

const PROVIDERS = [
  {
    strategy: 'oauth_google',
    label: 'Google',
    icon: 'google',
    iconColor: '#EA4335',
    borderColor: '#EA433530',
  },
];

function SocialButton({ strategy, label, icon, iconColor, borderColor }) {
  const { signIn, loading } = useClerkOAuth(strategy);

  return (
    <Pressable
      onPress={signIn}
      disabled={loading}
      style={({ pressed }) => [
        styles.button,
        { borderColor },
        pressed && styles.buttonPressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={iconColor} />
      ) : (
        <FontAwesome5 name={icon} size={18} color={iconColor} solid={icon === 'google'} />
      )}
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

export default function SocialAuthButtons({ errorSlot }) {
  return (
    <View style={styles.container}>
      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>or continue with</Text>
        <View style={styles.dividerLine} />
      </View>

      <View style={styles.row}>
        {PROVIDERS.map((p) => (
          <SocialButton key={p.strategy} {...p} />
        ))}
      </View>

      {errorSlot ? <Text style={styles.errorText}>{errorSlot}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
    marginBottom: 4,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    fontSize: 13,
    color: '#9CA3AF',
    fontFamily: FONT_JAKARTA_BOLD,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    backgroundColor: '#FFFFFF',
  },
  buttonPressed: {
    backgroundColor: '#F9FAFB',
  },
  label: {
    fontSize: 13,
    fontFamily: FONT_JAKARTA_BOLD,
    color: '#374151',
  },
  errorText: {
    marginTop: 10,
    textAlign: 'center',
    color: '#DC2626',
    fontSize: 13,
  },
});
