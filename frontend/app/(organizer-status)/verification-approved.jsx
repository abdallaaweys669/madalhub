import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import useGuardedRouter from '@/hooks/useGuardedRouter';
import useAuth from '@/auth/useAuth';
import { markApprovedScreenShown, resolveOrganizerUserId } from '@/navigation/organizerGate';
import ApprovedSvg from '@/assets/approved.svg';

const ORANGE = '#FF7B3F';
const GREEN = '#16A34A';

export default function VerificationApprovedScreen() {
  const router = useGuardedRouter();
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const heroSize = Math.min(width - 32, 380);

  const goToDashboard = () => {
    void (async () => {
      const userId = await resolveOrganizerUserId(user);
      await markApprovedScreenShown(userId);
      router.replace('/(organizer)/(tabs)');
    })();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.screen}>
        <View style={styles.content}>
          <View style={styles.headerBlock}>
            <View style={[styles.heroWrap, { width: heroSize, height: heroSize * 0.88 }]}>
              <ApprovedSvg width="100%" height="100%" />
            </View>

            <Text style={styles.title}>You're Approved!</Text>
            <Text style={styles.subtitle}>
              Congratulations! Your organizer profile has been verified.
            </Text>
          </View>

          <View style={styles.card}>
            <View style={styles.cardIconWrap}>
              <Ionicons name="checkmark-circle" size={22} color={GREEN} />
            </View>
            <View style={styles.cardTextBlock}>
              <Text style={styles.cardLead}>You are now a</Text>
              <Text style={styles.cardTitle}>Verified Organizer</Text>
            </View>
          </View>

          <Text style={styles.hint}>You can now create and manage events.</Text>
        </View>

        <View style={styles.footer}>
          <Pressable
            style={({ pressed }) => [styles.ctaBtn, pressed && styles.ctaBtnPressed]}
            onPress={goToDashboard}
            accessibilityRole="button"
          >
            <Text style={styles.ctaLabel}>Go to Dashboard</Text>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  screen: {
    flex: 1,
    paddingHorizontal: 24,
  },
  content: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerBlock: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  heroWrap: {
    marginBottom: -24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 8,
  },
  card: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#F0FDF4',
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 18,
    marginBottom: 14,
  },
  cardIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTextBlock: {
    flex: 1,
  },
  cardLead: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  hint: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 4,
  },
  footer: {
    paddingTop: 12,
    paddingBottom: 8,
  },
  ctaBtn: {
    width: '100%',
    backgroundColor: ORANGE,
    borderRadius: 14,
    paddingVertical: 16,
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  ctaBtnPressed: {
    opacity: 0.92,
  },
  ctaLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
