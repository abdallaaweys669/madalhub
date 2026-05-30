import React from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type AppPopupVariant = 'success' | 'error' | 'warning' | 'info';

type AppPopupProps = {
  visible: boolean;
  variant?: AppPopupVariant;
  title: string;
  message?: string;
  details?: string[];
  primaryLabel: string;
  onPrimary: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  onClose?: () => void;
  loading?: boolean;
};

const VARIANTS: Record<
  AppPopupVariant,
  {
    icon: keyof typeof Ionicons.glyphMap;
    iconColor: string;
    iconBg: string;
    iconBorder: string;
    primaryBg: string;
    primaryText: string;
  }
> = {
  success: {
    icon: 'checkmark-circle',
    iconColor: '#059669',
    iconBg: '#ECFDF5',
    iconBorder: '#D1FAE5',
    primaryBg: '#FF7A00',
    primaryText: '#FFFFFF',
  },
  error: {
    icon: 'alert-circle',
    iconColor: '#DC2626',
    iconBg: '#FEF2F2',
    iconBorder: '#FECACA',
    primaryBg: '#DC2626',
    primaryText: '#FFFFFF',
  },
  warning: {
    icon: 'warning',
    iconColor: '#EA580C',
    iconBg: '#FFF7ED',
    iconBorder: '#FED7AA',
    primaryBg: '#FF7A00',
    primaryText: '#FFFFFF',
  },
  info: {
    icon: 'information-circle',
    iconColor: '#2563EB',
    iconBg: '#EFF6FF',
    iconBorder: '#BFDBFE',
    primaryBg: '#FF7A00',
    primaryText: '#FFFFFF',
  },
};

export default function AppPopup({
  visible,
  variant = 'info',
  title,
  message,
  details = [],
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
  onClose,
  loading = false,
}: AppPopupProps) {
  const accent = VARIANTS[variant];
  const close = onClose || onSecondary || onPrimary;

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={close}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => !loading && close()} accessibilityLabel="Close popup" />
        <View style={styles.card}>
          <View style={[styles.iconCircle, { backgroundColor: accent.iconBg, borderColor: accent.iconBorder }]}>
            <Ionicons name={accent.icon} size={34} color={accent.iconColor} />
          </View>
          <Text style={styles.title}>{title}</Text>
          {message ? <Text style={styles.message}>{message}</Text> : null}
          {details.length > 0 ? (
            <View style={styles.detailsBox}>
              {details.map((item) => (
                <View key={item} style={styles.detailRow}>
                  <View style={[styles.detailDot, { backgroundColor: accent.iconColor }]} />
                  <Text style={styles.detailText}>{item}</Text>
                </View>
              ))}
            </View>
          ) : null}
          <View style={secondaryLabel ? styles.actionsRow : styles.singleActionRow}>
            {secondaryLabel ? (
              <Pressable
                disabled={loading}
                style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}
                onPress={onSecondary || close}
              >
                <Text style={styles.secondaryText}>{secondaryLabel}</Text>
              </Pressable>
            ) : null}
            <Pressable
              disabled={loading}
              style={({ pressed }) => [
                styles.primaryBtn,
                secondaryLabel ? styles.actionFlex : styles.primaryBtnFull,
                { backgroundColor: accent.primaryBg },
                pressed && styles.pressed,
              ]}
              onPress={onPrimary}
            >
              {loading ? (
                <ActivityIndicator color={accent.primaryText} size="small" />
              ) : (
                <Text style={[styles.primaryText, { color: accent.primaryText }]}>{primaryLabel}</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 22,
    backgroundColor: 'rgba(15, 23, 42, 0.52)',
  },
  card: {
    width: '100%',
    maxWidth: 368,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingTop: 26,
    paddingBottom: 22,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 12,
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.06)',
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  message: {
    marginTop: 8,
    fontSize: 15,
    lineHeight: 22,
    color: '#64748B',
    textAlign: 'center',
  },
  detailsBox: {
    marginTop: 16,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    gap: 9,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  detailDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 7,
  },
  detailText: {
    flex: 1,
    color: '#475569',
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  singleActionRow: {
    marginTop: 20,
  },
  secondaryBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#475569',
  },
  primaryBtn: {
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionFlex: {
    flex: 1,
  },
  primaryBtnFull: {
    width: '100%',
  },
  primaryText: {
    fontSize: 15,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.9,
  },
});
