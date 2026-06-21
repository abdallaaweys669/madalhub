import React, { useEffect, useMemo, useState } from 'react';
import { Animated, Dimensions, Image, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import useGuardedRouter from '@/hooks/useGuardedRouter';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import useAuth from '@/auth/useAuth';
import { getPublishEligibility } from '@/api/organizer';
import { resolveApiAssetUrl } from '@/utils/mediaUrl';
import { COLORS } from '@/theme/colors';

const DRAWER_WIDTH = Math.min(Dimensions.get('window').width * 0.82, 320);

const MENU_ITEMS = [
  { key: 'attendees', label: 'Attendees', href: '/(organizer)/attendees', icon: 'users' },
  { key: 'verify', label: 'Identity verification', href: '/(organizer-status)/resubmit-verification', icon: 'shield' },
  { key: 'billing', label: 'Credits', href: '/(organizer)/pay-to-publish', icon: 'credit-card' },
  { key: 'analytics', label: 'Analytics', href: '/(organizer)/analytics', icon: 'bar-chart-2' },
  { key: 'settings', label: 'Settings', href: '/(organizer)/settings', icon: 'settings' },
];

const COMING_SOON = [{ label: 'Team & co-hosts' }];

function creditsSummary(eligibility) {
  if (!eligibility) return null;
  const credits = Number(eligibility.paidPublishCredits ?? 0);
  if (credits > 0) return `${credits} credit${credits === 1 ? '' : 's'}`;
  if (eligibility.hasPendingCreditRequest) return 'Credit request pending';
  return 'No credits';
}

export default function OrganizerDrawer({ visible, onClose, orgName }) {
  const router = useGuardedRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const slide = React.useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const [publishEligibility, setPublishEligibility] = useState(null);

  const displayName = orgName || user?.fullName || 'Organizer';
  const avatarUri = resolveApiAssetUrl(user?.profileImg);
  const creditsLabel = useMemo(() => creditsSummary(publishEligibility), [publishEligibility]);

  useEffect(() => {
    Animated.timing(slide, {
      toValue: visible ? 0 : -DRAWER_WIDTH,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [visible, slide]);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await getPublishEligibility();
        if (!cancelled) setPublishEligibility(data);
      } catch {
        if (!cancelled) setPublishEligibility(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [visible]);

  const navigate = (href) => {
    onClose();
    router.push(href);
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={{ flex: 1, flexDirection: 'row' }}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(15,23,42,0.45)' }} onPress={onClose} />
        <Animated.View
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: DRAWER_WIDTH,
            backgroundColor: '#FFFFFF',
            paddingTop: insets.top + 12,
            paddingBottom: insets.bottom + 12,
            transform: [{ translateX: slide }],
            shadowColor: '#000',
            shadowOpacity: 0.15,
            shadowRadius: 16,
            elevation: 8,
          }}
        >
          <Pressable
            onPress={() => navigate('/(organizer)/(tabs)/organization')}
            style={{ paddingHorizontal: 18, marginBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}
          >
            {avatarUri ? (
              <Image
                source={{ uri: avatarUri }}
                style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#FFF7ED' }}
              />
            ) : (
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: '#FFF7ED',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ color: COLORS.primary, fontWeight: '800', fontSize: 16 }}>
                  {(displayName || 'O').slice(0, 2).toUpperCase()}
                </Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 18, fontWeight: '900', color: COLORS.textPrimary }} numberOfLines={1}>
                {displayName}
              </Text>
              <Text style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 2 }}>Organizer account</Text>
              {creditsLabel ? (
                <Text style={{ fontSize: 12, color: COLORS.primary, fontWeight: '700', marginTop: 4 }}>{creditsLabel}</Text>
              ) : null}
            </View>
          </Pressable>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 10, flexGrow: 1 }}
            style={{ flex: 1 }}
          >
            {MENU_ITEMS.map((item) => (
              <Pressable
                key={item.key}
                onPress={() => navigate(item.href)}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  paddingVertical: 12,
                  paddingHorizontal: 12,
                  borderRadius: 12,
                  backgroundColor: pressed ? '#FFF7ED' : 'transparent',
                })}
              >
                <Feather name={item.icon} size={18} color={COLORS.textPrimary} />
                <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.textPrimary }}>{item.label}</Text>
              </Pressable>
            ))}

            <Text
              style={{
                marginTop: 16,
                marginBottom: 8,
                marginLeft: 12,
                fontSize: 11,
                fontWeight: '700',
                color: COLORS.textMuted,
                letterSpacing: 1,
              }}
            >
              COMING SOON
            </Text>
            {COMING_SOON.map((item) => (
              <View
                key={item.label}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  opacity: 0.45,
                }}
              >
                <Feather name="clock" size={18} color={COLORS.textMuted} />
                <Text style={{ fontSize: 15, color: COLORS.textSecondary }}>{item.label}</Text>
              </View>
            ))}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}
