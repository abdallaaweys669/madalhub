import React, { useEffect, useMemo, useState } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import useGuardedRouter from '@/hooks/useGuardedRouter';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import useAuth from '@/auth/useAuth';
import SignOutButton from '@/components/auth/SignOutButton';
import { getPublishEligibility } from '@/api/organizer';
import {
  getOrganizerReportHref,
  ORGANIZER_REPORT_MENU,
} from '@/constants/organizerReports';
import { resolveApiAssetUrl } from '@/utils/mediaUrl';
import { COLORS } from '@/theme/colors';

const DRAWER_WIDTH = Math.min(Dimensions.get('window').width * 0.84, 300);

const MENU_ITEMS = [
  { key: 'attendees', label: 'Attendees', href: '/(organizer)/attendees', icon: 'users' },
  { key: 'credits', label: 'Credits', href: '/(organizer)/pay-to-publish', icon: 'credit-card' },
];

function creditsSummary(eligibility) {
  if (!eligibility) return null;
  const credits = Number(eligibility.paidPublishCredits ?? 0);
  if (credits > 0) return `${credits} credit${credits === 1 ? '' : 's'}`;
  if (eligibility.hasPendingCreditRequest) return 'Credit request pending';
  return 'No credits';
}

function DrawerNavItem({ icon, label, onPress, indent = false, trailingIcon }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.navItem,
        indent && styles.navItemIndent,
        pressed && styles.navItemPressed,
      ]}
    >
      <Feather name={icon} size={indent ? 16 : 18} color={COLORS.textPrimary} />
      <Text style={[styles.navLabel, indent && styles.navLabelIndent]}>{label}</Text>
      {trailingIcon ? (
        <Feather name={trailingIcon} size={16} color={COLORS.textSecondary} style={{ marginLeft: 'auto' }} />
      ) : null}
    </Pressable>
  );
}

export default function OrganizerDrawer({ visible, onClose, orgName }) {
  const router = useGuardedRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const slide = React.useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const [publishEligibility, setPublishEligibility] = useState(null);
  const [reportsExpanded, setReportsExpanded] = useState(false);

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
      <View style={styles.root}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <Animated.View
          style={[
            styles.panel,
            {
              width: DRAWER_WIDTH,
              paddingTop: insets.top + 12,
              paddingBottom: insets.bottom + 12,
              transform: [{ translateX: slide }],
            },
          ]}
        >
          <Pressable
            onPress={() => navigate('/(organizer)/(tabs)/organization')}
            style={styles.profileRow}
          >
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Text style={styles.avatarText}>{(displayName || 'O').slice(0, 2).toUpperCase()}</Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.profileName} numberOfLines={1}>
                {displayName}
              </Text>
              <Text style={styles.profileSub}>Organizer account</Text>
              {creditsLabel ? <Text style={styles.creditsLabel}>{creditsLabel}</Text> : null}
            </View>
          </Pressable>

          <ScrollView
            showsVerticalScrollIndicator={false}
            style={styles.menuScroll}
            contentContainerStyle={styles.menuScrollContent}
          >
            {MENU_ITEMS.map((item) => (
              <DrawerNavItem
                key={item.key}
                icon={item.icon}
                label={item.label}
                onPress={() => navigate(item.href)}
              />
            ))}

            <DrawerNavItem
              icon="bar-chart-2"
              label="Reports"
              trailingIcon={reportsExpanded ? 'chevron-up' : 'chevron-down'}
              onPress={() => setReportsExpanded((prev) => !prev)}
            />

            {reportsExpanded
              ? ORGANIZER_REPORT_MENU.map((item) => (
                  <DrawerNavItem
                    key={item.key}
                    icon={item.icon}
                    label={item.label}
                    indent
                    onPress={() => navigate(getOrganizerReportHref(item.key))}
                  />
                ))
              : null}
          </ScrollView>

          <View style={styles.footer}>
            <DrawerNavItem
              icon="settings"
              label="Settings"
              onPress={() => navigate('/(organizer)/settings')}
            />
            <View style={styles.signOutWrap}>
              <SignOutButton redirectTo="/(auth)/welcome" />
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, flexDirection: 'row' },
  backdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.45)' },
  panel: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  profileRow: {
    paddingHorizontal: 18,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF7ED',
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: COLORS.primary,
    fontWeight: '800',
    fontSize: 16,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.textPrimary,
  },
  profileSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  creditsLabel: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '700',
    marginTop: 4,
  },
  menuScroll: { flex: 1 },
  menuScrollContent: {
    paddingHorizontal: 10,
    paddingTop: 4,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  navItemIndent: {
    paddingLeft: 28,
    paddingVertical: 10,
  },
  navItemPressed: {
    backgroundColor: '#FFF7ED',
  },
  navLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  navLabelIndent: {
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingHorizontal: 10,
    paddingTop: 8,
  },
  signOutWrap: {
    marginTop: 4,
    paddingHorizontal: 4,
    paddingBottom: 4,
  },
});
