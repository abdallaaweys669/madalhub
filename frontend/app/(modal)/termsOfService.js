import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Stack } from 'expo-router';
import { useThemeColors } from '@/theme';

function P({ children, colors }) {
  return <Text style={[styles.p, { color: colors.textSecondary }]}>{children}</Text>;
}

function H({ children, colors }) {
  return <Text style={[styles.h, { color: colors.text }]}>{children}</Text>;
}

export default function TermsOfServiceScreen() {
  const colors = useThemeColors();

  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: 'Terms of Service' }} />
      <Text style={[styles.updated, { color: colors.textSecondary }]}>Last updated: May 2026 · MadalHub member app</Text>
      <Text style={[styles.intro, { color: colors.text }]}>
        These terms explain how you may use MadalHub as an attendee. By creating an account or using the app, you agree to
        them. If you do not agree, please do not use the service.
      </Text>

      <H colors={colors}>1. The service</H>
      <P colors={colors}>
        MadalHub helps you discover events, save favourites, and manage your participation. Features may change as we
        improve the product. We try to keep event information accurate, but organizers are responsible for their own
        listings.
      </P>

      <H colors={colors}>2. Your account</H>
      <P colors={colors}>
        You must provide accurate registration details and keep your password secure. You are responsible for
        activity under your account. You must be old enough to enter a binding agreement where you live.
      </P>

      <H colors={colors}>3. Acceptable use</H>
      <P colors={colors}>
        Do not misuse the app: no harassment, hate speech, spam, scraping that overloads our systems, or attempts to
        access others accounts or data. Do not use MadalHub for illegal events or fraudulent ticketing.
      </P>

      <H colors={colors}>4. Events & third parties</H>
      <P colors={colors}>
        Events are created by independent organizers. Your attendance is between you and the organizer (including
        safety, refunds, and venue rules). MadalHub is not the seller of tickets unless clearly stated otherwise in the
        product.
      </P>

      <H colors={colors}>5. Disclaimer</H>
      <P colors={colors}>
        The app is provided as is to the extent permitted by law. We do not guarantee uninterrupted access. Where
        liability cannot be excluded, it is limited to the fullest extent allowed by applicable law.
      </P>

      <H colors={colors}>6. Changes</H>
      <P colors={colors}>
        We may update these terms. Continued use after changes means you accept the new terms. Material changes will be
        highlighted in the app or by email where appropriate.
      </P>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 22, paddingBottom: 48 },
  updated: { fontSize: 14, marginBottom: 16 },
  intro: { fontSize: 17, lineHeight: 26, fontWeight: '600', marginBottom: 22 },
  h: { fontSize: 19, fontWeight: '800', marginTop: 18, marginBottom: 10 },
  p: { fontSize: 16, lineHeight: 26, marginBottom: 6 },
});
