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

export default function PrivacyPolicyScreen() {
  const colors = useThemeColors();

  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: 'Privacy Policy' }} />
      <Text style={[styles.updated, { color: colors.textSecondary }]}>Last updated: May 2026 · Kulan member app</Text>
      <Text style={[styles.intro, { color: colors.text }]}>
        We built Kulan to help you enjoy events with confidence. This policy describes what we collect, why we use it,
        and the choices you have — in plain language.
      </Text>

      <H colors={colors}>What we collect</H>
      <P colors={colors}>
        Account details you provide (such as name, email, phone, and city), profile photo if you upload one, and
        interests you select. Technical data such as device type and app diagnostics may be collected to fix crashes and
        improve performance.
      </P>

      <H colors={colors}>How we use information</H>
      <P colors={colors}>
        To run your account, show relevant events, send notifications you opt into, and keep the community safe. We do
        not sell your personal data. Organizers may see limited contact information you choose to display on your
        profile so they can coordinate events.
      </P>

      <H colors={colors}>Profile visibility</H>
      <P colors={colors}>
        You can turn off showing your email or phone on your public member profile in Settings → Privacy. Other profile
        fields may still be visible depending on product features.
      </P>

      <H colors={colors}>Retention & security</H>
      <P colors={colors}>
        We retain data as long as your account is active and for a reasonable period afterward for legal and security
        needs. We use industry-standard safeguards, but no online service is 100% risk-free.
      </P>

      <H colors={colors}>Your rights</H>
      <P colors={colors}>
        Depending on where you live, you may have rights to access, correct, or delete your data. Contact your support
        channel to exercise these rights. We will respond within the timeframes required by law.
      </P>

      <H colors={colors}>Children</H>
      <P colors={colors}>
        Kulan is not directed at children under the age required in your region to consent to data processing. If you
        believe we have collected a child profile in error, contact us for removal.
      </P>

      <H colors={colors}>Contact</H>
      <P colors={colors}>
        For privacy questions, reach out through the support method your organization published for the Kulan app
        (email or help desk).
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
