import React from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '@/constants/loginSignin/authStyles';

export type VerificationNoticeVariant = 'success' | 'error' | 'info';

type Props = {
  visible: boolean;
  variant: VerificationNoticeVariant;
  title: string;
  message?: string;
  primaryLabel: string;
  onPrimary: () => void;
};

const ACCENTS: Record<
  VerificationNoticeVariant,
  { icon: React.ComponentProps<typeof Feather>['name']; ring: string; iconColor: string }
> = {
  success: { icon: 'check-circle', ring: '#DCFCE7', iconColor: '#15803D' },
  error: { icon: 'x-circle', ring: '#FEE2E2', iconColor: COLORS.danger },
  info: { icon: 'send', ring: '#FFF7ED', iconColor: COLORS.primary },
};

export default function VerificationNoticeModal({
  visible,
  variant,
  title,
  message,
  primaryLabel,
  onPrimary,
}: Props) {
  const { width } = useWindowDimensions();
  const cardWidth = Math.min(340, width - 48);
  const accent = ACCENTS[variant];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onPrimary}>
      <View style={styles.modalRoot}>
        <Pressable style={styles.backdropTint} onPress={onPrimary} accessibilityRole="button" />
        <View style={[styles.card, { width: cardWidth }]}>
          <View style={[styles.iconRing, { backgroundColor: accent.ring }]}>
            <Feather name={accent.icon} size={36} color={accent.iconColor} />
          </View>
          <Text style={[styles.title, !message && styles.titleSolo]}>{title}</Text>
          {message ? (
            <Text style={styles.message}>{message}</Text>
          ) : null}
          <Pressable
            onPress={onPrimary}
            style={({ pressed }) => [
              styles.primaryBtn,
              { opacity: pressed ? 0.9 : 1 },
            ]}
          >
            <Text style={styles.primaryBtnText}>{primaryLabel}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  backdropTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.38)',
  },
  card: {
    zIndex: 1,
    backgroundColor: COLORS.cardBg,
    borderRadius: 24,
    paddingVertical: 28,
    paddingHorizontal: 22,
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOpacity: 0.2,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.06)',
  },
  iconRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textDark,
    textAlign: 'center',
    letterSpacing: -0.4,
    marginBottom: 10,
  },
  titleSolo: {
    marginBottom: 24,
  },
  message: {
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.textLight,
    textAlign: 'center',
    marginBottom: 24,
  },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 28,
    width: '100%',
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});
