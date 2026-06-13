import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { styles } from '@/constants/eventDetails_styles/eventDetails.styles';
import useAuth from '@/auth/useAuth';
import useGuardedRouter from '@/hooks/useGuardedRouter';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function formatTimeLabel(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return null;
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function FullWidthCta({ onPress, children, disabled = false, variant = 'primary' }) {
  if (disabled || variant !== 'primary') {
    return (
      <TouchableOpacity
        style={[
          barStyles.ctaButton,
          variant === 'closed' && barStyles.ctaClosed,
          variant === 'full' && barStyles.ctaFull,
          variant === 'ended' && barStyles.ctaEnded,
          disabled && barStyles.ctaDisabled,
        ]}
        onPress={onPress}
        activeOpacity={0.9}
        disabled={disabled}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={barStyles.ctaButton} onPress={onPress} activeOpacity={0.92}>
      <LinearGradient
        colors={['#FF7A00', '#FF9A3D']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={barStyles.ctaGradient}
      >
        {children}
      </LinearGradient>
    </TouchableOpacity>
  );
}

const EventBottomBar = ({
  joined,
  onRegister,
  onEditAttendance,
  price = 'Free',
  event,
}) => {
  const { isLoggedIn } = useAuth();
  const router = useGuardedRouter();
  const insets = useSafeAreaInsets();

  const eventState = event?.eventState ?? 'upcoming';
  const isClosed = eventState === 'closed';
  const isEnded = eventState === 'ended';
  const isFullyBooked = eventState === 'fully-booked';
  const isLive = eventState === 'live';
  const hasInactiveStatus = isEnded || isClosed || isFullyBooked;
  const endsAtLabel = formatTimeLabel(event?.endsAt ?? null);
  const stateSubtitle = isLive
    ? endsAtLabel
      ? `Ends at ${endsAtLabel}`
      : 'Happening now'
    : null;

  const handleRegisterPress = () => {
    if (isEnded) {
      Alert.alert('Event ended', 'This event has already ended.');
      return;
    }
    if (isClosed) {
      Alert.alert('Registration closed', 'Registration is closed for this event.');
      return;
    }
    if (isFullyBooked) {
      Alert.alert('Fully booked', 'This event is fully booked. You can join the waitlist and get notified.');
      return;
    }
    if (!isLoggedIn) {
      router.push('/(auth)/welcome');
      return;
    }
    onRegister?.();
  };

  const openTicket = () => {
    if (!event?.id) return;
    router.push(`/events/${event.id}/ticket`);
  };

  const displayPrice = typeof price === 'string' && price.trim().length > 0 ? price.trim() : 'Free';

  return (
    <View style={[styles.bottomBar, barStyles.bar, { paddingBottom: insets.bottom + 12 }]}>
      {joined ? (
        <>
          <View style={barStyles.joinedRow}>
            <View style={barStyles.goingRow}>
              <Feather name="check-circle" size={17} color="#16A34A" />
              <Text style={barStyles.goingText}>You&apos;re going!</Text>
            </View>
            <TouchableOpacity onPress={onEditAttendance} hitSlop={8} activeOpacity={0.8}>
              <Text style={barStyles.editLink}>Edit attendance</Text>
            </TouchableOpacity>
          </View>
          <FullWidthCta onPress={openTicket}>
            <Ionicons name="qr-code-outline" size={20} color="#FFFFFF" />
            <Text style={barStyles.ctaPrimaryText}>View ticket</Text>
          </FullWidthCta>
        </>
      ) : (
        <>
          {hasInactiveStatus ? (
            <FullWidthCta
              onPress={handleRegisterPress}
              variant={isClosed ? 'closed' : isFullyBooked ? 'full' : 'ended'}
            >
              <Feather
                name={isClosed ? 'lock' : isFullyBooked ? 'users' : 'clock'}
                size={18}
                color={isClosed ? '#B91C1C' : isFullyBooked ? '#C2410C' : '#64748B'}
              />
              <Text
                style={[
                  barStyles.ctaStatusText,
                  isClosed && { color: '#B91C1C' },
                  isFullyBooked && { color: '#C2410C' },
                ]}
              >
                {isClosed ? 'Registration closed' : isFullyBooked ? 'Fully booked' : 'Event ended'}
              </Text>
            </FullWidthCta>
          ) : (
            <FullWidthCta onPress={handleRegisterPress}>
              <Feather name="user-plus" size={18} color="#FFFFFF" />
              <Text style={barStyles.ctaPrimaryText}>Get ticket</Text>
              <Text style={barStyles.ctaDot}>·</Text>
              <Text style={barStyles.ctaPriceText}>{displayPrice}</Text>
            </FullWidthCta>
          )}
          {stateSubtitle && !hasInactiveStatus ? (
            <Text style={barStyles.liveHint}>{stateSubtitle}</Text>
          ) : null}
        </>
      )}
    </View>
  );
};

const barStyles = StyleSheet.create({
  bar: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 8,
  },
  joinedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  goingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    flexShrink: 1,
  },
  goingText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  editLink: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FF7B3F',
  },
  ctaButton: {
    width: '100%',
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#FF7B3F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 4,
  },
  ctaGradient: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 20,
  },
  ctaPrimaryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  ctaDot: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 18,
    fontWeight: '700',
    marginHorizontal: -2,
  },
  ctaPriceText: {
    color: 'rgba(255,255,255,0.95)',
    fontSize: 16,
    fontWeight: '700',
  },
  ctaClosed: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    shadowOpacity: 0,
    elevation: 0,
  },
  ctaFull: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    shadowOpacity: 0,
    elevation: 0,
  },
  ctaEnded: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowOpacity: 0,
    elevation: 0,
  },
  ctaDisabled: {
    opacity: 1,
  },
  ctaStatusText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#64748B',
  },
  liveHint: {
    marginTop: 8,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
});

export default EventBottomBar;
