import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import AuthCheckbox from '@/features/auth/components/AuthCheckbox';
import useGuardedRouter from '@/hooks/useGuardedRouter';
import { COLORS } from '@/constants/loginSignin/authStyles';
import { FONT_JAKARTA_BOLD } from '@/features/auth/theme/authTypography';

export default function SignupLegalBlock({
  requireAgeConfirmation = true,
  ageConfirmed,
  termsAccepted,
  onToggleAge,
  onToggleTerms,
  showErrors,
}) {
  const router = useGuardedRouter();

  const openTerms = () => router.push('/(modal)/termsOfService');
  const openPrivacy = () => router.push('/(modal)/privacyPolicy');

  return (
    <View style={styles.wrap}>
      {requireAgeConfirmation ? (
        <AuthCheckbox
          checked={ageConfirmed}
          onPress={onToggleAge}
          label="I am 18 years of age or older"
          error={showErrors && !ageConfirmed ? 'You must be 18 or older to create an account.' : ''}
        />
      ) : null}

      <AuthCheckbox
        checked={termsAccepted}
        onPress={onToggleTerms}
        label={<TermsLabel onTermsPress={openTerms} onPrivacyPress={openPrivacy} />}
        error={showErrors && !termsAccepted ? 'Please accept the Terms and Privacy Policy.' : ''}
      />
    </View>
  );
}

function TermsLabel({ onTermsPress, onPrivacyPress }) {
  return (
    <Text style={styles.termsText}>
      I agree to MadalHub's{' '}
      <Text style={styles.link} onPress={onTermsPress}>
        Terms of Service
      </Text>
      {' '}and{' '}
      <Text style={styles.link} onPress={onPrivacyPress}>
        Privacy Policy
      </Text>
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
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  link: {
    fontFamily: FONT_JAKARTA_BOLD,
    color: COLORS.primary,
  },
});
