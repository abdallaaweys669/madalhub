import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Stack } from 'expo-router';
import { useThemeColors } from '@/theme';

function Block({ title, children, colors }) {
  return (
    <View style={[styles.block, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.blockTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.blockBody, { color: colors.textSecondary }]}>{children}</Text>
    </View>
  );
}

export default function HelpCenterScreen() {
  const colors = useThemeColors();

  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: 'Help Center' }} />
      <Text style={[styles.lead, { color: colors.textSecondary }]}>
        Quick answers for members using MadalHub to discover events, save favourites, and stay organised.
      </Text>

      <Block title="Finding events" colors={colors}>
        Open Explore to browse by category and time. Use Home for your personal mix: upcoming and past events you
        follow. Tap any card to see full details, speakers, and how to register.
      </Block>

      <Block title="Saving & joining" colors={colors}>
        Use the bookmark on a card to save an event for later — it appears under Profile → Saved. When registration
        is open, tap Register on the event page. If an event is full, waitlist options may appear when the organizer
        enables them.
      </Block>

      <Block title="Your profile" colors={colors}>
        From Home, tap your header card to open Profile. Edit your photo, name, phone, and city under Edit profile.
        Interests power recommendations — add several that match you. You can hide email or phone on your public
        profile from Settings → Privacy.
      </Block>

      <Block title="Notifications" colors={colors}>
        We use notifications for important updates (for example reminders before an event). You can adjust preferences
        in Settings. If push is off, you may still see in-app messages when you open the app.
      </Block>

      <Block title="Need more help?" colors={colors}>
        If something looks wrong (wrong time, missing location, payment question), note the event name and date and
        contact the organizer from the event page when available. For account or app issues, use the contact channel
        your team provides (support email or in-app form).
      </Block>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 22, paddingBottom: 48 },
  lead: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
  },
  block: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    marginBottom: 14,
  },
  blockTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 10,
  },
  blockBody: {
    fontSize: 16,
    lineHeight: 26,
  },
});
