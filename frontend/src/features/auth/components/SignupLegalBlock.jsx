import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import AuthCheckbox from '@/features/auth/components/AuthCheckbox';
import { COLORS } from '@/constants/loginSignin/authStyles';
import { FONT_JAKARTA_BOLD } from '@/features/auth/theme/authTypography';

export default function SignupLegalBlock({
  ageConfirmed,
  termsAccepted,
  onToggleAge,
  onToggleTerms,
  showErrors,
}) {
  return (
    <View style={styles.wrap}>
      <AuthCheckbox
        checked={ageConfirmed}
        onPress={onToggleAge}
        label="I am 18 years of age or older"
        error={showErrors && !ageConfirmed ? 'You must be 18 or older to create an account.' : ''}
      />

      <AuthCheckbox
        checked={termsAccepted}
        onPress={onToggleTerms}
        label={<TermsLabel />}
        error={showErrors && !termsAccepted ? 'Please accept the Terms and Privacy Policy.' : ''}
      />
    </View>
  );
}

function TermsLabel() {
  return (
    <Text style={styles.termsText}>
      I agree to MadalHub's{' '}
      {/* TODO: open Terms of Service screen */}
      <Text style={styles.link} onPress={() => {}}>Terms of Service</Text>
      {' '}and{' '}
      {/* TODO: open Privacy Policy screen */}
      <Text style={styles.link} onPress={() => {}}>Privacy Policy</Text>
    </Text>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 4,
    marginBottom: 4,
    gap: 4,
  },
  termsText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  link: {
    fontFamily: FONT_JAKARTA_BOLD,
    color: COLORS.primary,
  },
});
