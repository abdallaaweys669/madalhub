import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { DEFAULT_COVER_GRADIENT } from '@/api/events';
import { EventCoverBanner } from '@/components/event/EventCoverBanner';
import TicketQrDisplay from '@/components/eventDetail/TicketQrDisplay';
import { toDisplayTitle } from '@/utils/eventDisplay';

export const TICKET_PAGE_BG = '#FFFFFF';
export const TICKET_FRAME_BG = '#FFFFFF';
export const TICKET_ORANGE = '#FF7B3F';

function DetailCell({ label, value, iconName }) {
  return (
    <View style={styles.detailCell}>
      <View style={styles.detailIconCircle}>
        <Feather name={iconName} size={14} color={TICKET_ORANGE} />
      </View>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue} numberOfLines={2}>
        {value || '—'}
      </Text>
    </View>
  );
}

const TicketPassCard = React.forwardRef(function TicketPassCard(
  {
    event,
    displayTitle,
    subtitle,
    ticketMeta,
    instituteName,
    qrValue,
    qrRef,
  },
  ref,
) {
  const organizerInitial = String(instituteName || 'O').trim().charAt(0).toUpperCase();

  return (
    <View ref={ref} collapsable={false} style={styles.frame}>
      <View style={styles.coverSection}>
        <EventCoverBanner
          preset="feed-flat"
          coverImageUrl={event.coverImageUrl}
          coverLetter={event.coverLetter}
          title={event.title}
          coverGradient={event.coverGradient ?? DEFAULT_COVER_GRADIENT}
          placeholderLetterSize={48}
          style={styles.coverBanner}
        >
            <LinearGradient
              colors={['transparent', 'rgba(15, 23, 42, 0.72)']}
              style={styles.coverGradient}
            />
        </EventCoverBanner>
      </View>

      <View style={styles.stubCard}>
        <View style={styles.seamLine} />

        <View style={styles.stubTop}>
            <View style={styles.ticketHeaderRow}>
              <Text style={styles.yourTicketLabel}>YOUR TICKET</Text>
              <View style={styles.confirmedBadge}>
                <Feather name="check-circle" size={13} color="#16A34A" />
                <Text style={styles.confirmedText}>Confirmed</Text>
              </View>
            </View>

            <Text style={styles.eventTitle}>{displayTitle || toDisplayTitle(event.title)}</Text>
            {subtitle ? (
              <Text style={styles.subtitle} numberOfLines={2}>
                {subtitle}
              </Text>
            ) : null}

            <View style={styles.qrBlock}>
              <TicketQrDisplay value={qrValue} size={200} qrRef={qrRef} />
            </View>

            <View style={styles.detailGrid}>
              <View style={styles.detailRow}>
                <DetailCell label="Date" value={ticketMeta.dateLabel} iconName="calendar" />
                <DetailCell label="Time" value={ticketMeta.timeLabel} iconName="clock" />
              </View>
              <View style={styles.detailRow}>
                <DetailCell
                  label="Venue"
                  value={ticketMeta.venueLabel}
                  iconName={ticketMeta.isOnline ? 'video' : 'map-pin'}
                />
                <DetailCell
                  label="Participants"
                  value={ticketMeta.guestLabel}
                  iconName="users"
                />
              </View>
            </View>
          </View>

          <View style={styles.organizerBar}>
            <View style={styles.organizerAvatar}>
              <Text style={styles.organizerAvatarText}>{organizerInitial}</Text>
            </View>
            <View style={styles.organizerTextBlock}>
              <Text style={styles.organizerPrefix}>Organized by</Text>
              <Text style={styles.organizerName} numberOfLines={2}>
                {instituteName}
              </Text>
            </View>
          </View>
        </View>
    </View>
  );
});

export default TicketPassCard;

const styles = StyleSheet.create({
  frame: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    overflow: 'visible',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
  },
  coverSection: {
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  coverBanner: {
    borderRadius: 0,
    marginBottom: 0,
    aspectRatio: 16 / 9,
  },
  coverGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  seamLine: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E2E8F0',
  },
  stubCard: {
    position: 'relative',
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
    overflow: 'visible',
  },
  stubTop: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  ticketHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 8,
  },
  yourTicketLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: TICKET_ORANGE,
    letterSpacing: 1.2,
  },
  confirmedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  confirmedText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#16A34A',
  },
  eventTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 26,
    letterSpacing: -0.3,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    lineHeight: 20,
  },
  qrBlock: {
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 16,
  },
  detailGrid: {
    gap: 16,
  },
  detailRow: {
    flexDirection: 'row',
    gap: 12,
  },
  detailCell: {
    flex: 1,
    minWidth: 0,
    alignItems: 'flex-start',
  },
  detailIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 18,
  },
  organizerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 20,
    marginBottom: 18,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E2E8F0',
  },
  organizerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  organizerAvatarText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#64748B',
  },
  organizerTextBlock: {
    flex: 1,
    minWidth: 0,
  },
  organizerPrefix: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
    marginBottom: 2,
  },
  organizerName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 18,
  },
});
