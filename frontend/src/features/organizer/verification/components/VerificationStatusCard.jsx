import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const STATUS_CONFIG = {
  pending: {
    bg: '#F3F0FF',
    border: '#DDD6FE',
    iconColor: '#7C3AED',
    icon: 'time-outline',
    label: 'Verification in Review',
    sub: 'Usually within 24 hours',
  },
  approved: {
    bg: '#F0FDF4',
    border: '#BBF7D0',
    iconColor: '#16A34A',
    icon: 'checkmark-circle-outline',
    label: "You're Approved!",
    sub: 'You can now access the organizer dashboard.',
  },
  rejected: {
    bg: '#FEF2F2',
    border: '#FECACA',
    iconColor: '#DC2626',
    icon: 'close-circle-outline',
    label: 'Verification Rejected',
    sub: 'Please review the reason below and resubmit.',
  },
};

/**
 * Purple/green/red status card shown on pending / approved / rejected screens.
 */
export default function VerificationStatusCard({ status, reason }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;

  return (
    <View style={[styles.card, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
      <Ionicons name={cfg.icon} size={32} color={cfg.iconColor} style={styles.icon} />
      <Text style={[styles.label, { color: cfg.iconColor }]}>{cfg.label}</Text>
      <Text style={styles.sub}>{cfg.sub}</Text>
      {status === 'rejected' && reason ? (
        <View style={styles.reasonBox}>
          <Text style={styles.reasonTitle}>Admin note:</Text>
          <Text style={styles.reason}>{reason}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 24,
    alignItems: 'center',
    gap: 6,
    marginVertical: 16,
  },
  icon: {
    marginBottom: 4,
  },
  label: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  sub: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  reasonBox: {
    marginTop: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    width: '100%',
    gap: 4,
  },
  reasonTitle: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  reason: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
});
