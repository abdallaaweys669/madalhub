import React from 'react';
import { Share, Text, TouchableOpacity, View } from 'react-native';
import { styles } from '@/constants/eventDetails_styles/eventDetails.styles';
import useAuth from '@/auth/useAuth';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const EventBottomBar = ({ joined, onToggleJoin, price = 'Free', event }) => {
  const { isLoggedIn } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleJoin = () => {
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
      <View>
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
            <Text style={styles.bottomJoinButtonText}>Join Event</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default EventBottomBar;

