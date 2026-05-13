import React from 'react';
import { Alert, Share, Text, TouchableOpacity, View } from 'react-native';
import { styles } from '@/constants/eventDetails_styles/eventDetails.styles';
import useAuth from '@/auth/useAuth';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function formatTimeLabel(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return null;
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

const EventBottomBar = ({ joined, onToggleJoin, price = 'Free', event }) => {
  const { isLoggedIn } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const eventState = event?.eventState ?? 'upcoming';
  const isClosed = eventState === 'closed';
  const isEnded = eventState === 'ended';
  const isFullyBooked = eventState === 'fully-booked';
  const isLive = eventState === 'live';
  const hasInactiveStatus = isEnded || isClosed || isFullyBooked;
  const endsAtLabel = formatTimeLabel(event?.endsAt ?? null);
  const stateSubtitle = isEnded
    ? null
    : isClosed
      ? null
    : isFullyBooked
      ? null
      : isLive
        ? endsAtLabel
          ? `Ends at ${endsAtLabel}`
          : 'Happening now'
        : null;

  const handleJoin = () => {
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
    onToggleJoin?.();
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${event?.title ?? 'Event'}\n${event?.details ?? ''}`,
      });
    } catch {
      // Ignore share dismissal.
    }
  };

  const displayPrice = typeof price === 'string' && price.trim().length > 0 ? price : 'Free';

  return (
    <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 10 }]}>
      <View style={styles.bottomPriceColumn}>
        <Text style={styles.bottomPriceLabel}>PRICE</Text>
        <Text style={styles.bottomPriceValue}>{displayPrice}</Text>
      </View>
      {joined ? (
        <View style={styles.bottomJoinedActions}>
          <TouchableOpacity style={styles.bottomGoingButton} onPress={onToggleJoin} activeOpacity={0.9}>
            <Text style={styles.bottomGoingButtonText}>Going</Text>
            <Feather name="check" size={14} color="#FF7A00" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.bottomShareButton} onPress={handleShare} activeOpacity={0.9}>
            <Text style={styles.bottomShareButtonText}>Share</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.bottomActionWrap}>
          {hasInactiveStatus ? (
            <View style={styles.bottomStatusBlock}>
              <Text style={styles.bottomPriceLabel}>STATUS</Text>
              <View style={styles.bottomStatusValueRow}>
                <Feather
                  name={isClosed ? 'lock' : isFullyBooked ? 'users' : 'clock'}
                  size={15}
                  color={isClosed ? '#B91C1C' : isFullyBooked ? '#C2410C' : '#64748B'}
                />
                <Text
                  style={[
                    styles.bottomStatusValue,
                    isClosed
                      ? { color: '#B91C1C' }
                      : isFullyBooked
                        ? { color: '#C2410C' }
                        : null,
                  ]}
                >
                  {isClosed ? 'Closed' : isFullyBooked ? 'Full' : 'Ended'}
                </Text>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.bottomJoinButton}
              onPress={handleJoin}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={['#FF7A00', '#FF9A3D']}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.bottomJoinButtonGradient}
              >
                <Feather name="user-plus" size={18} color="#FFFFFF" />
                <Text style={styles.bottomJoinButtonText} numberOfLines={1}>
                  Register now
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
          {stateSubtitle && isLive ? <Text style={styles.bottomCtaSubtext}>{stateSubtitle}</Text> : null}
        </View>
      )}
    </View>
  );
};

export default EventBottomBar;

