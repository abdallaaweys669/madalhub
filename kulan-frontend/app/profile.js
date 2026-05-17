import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  Platform,
  Alert,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter, useLocalSearchParams } from 'expo-router';
import useAuth from '@/auth/useAuth';
import { useSavedEvents } from '@/context/SavedEventsContext';
import { getEvents } from '@/api/events';
import Chip from '@/features/onboarding/components/Chip';
import { INTEREST_ICON_MAP } from '@/features/onboarding/data/interestIconMap';
import { MemberProfileEventsSection } from '@/components/member/MemberProfileEventsSection';
import { MemberInitialAvatar } from '@/components/member/MemberInitialAvatar';
import onboardingApi from '@/api/onboarding';
import authApi from '@/api/auth';
import { getMemberById } from '@/api/member';
import { useThemeColors } from '@/theme';
import { normalizeUser, coerceProfileVisibilityBool, pickDisplayName, pickLocationLabel } from '@/auth/normalizeUser';
import { canViewerSeeHiddenProfile } from '@/utils/anonymize';

function formatJoinedDate(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return null;
  return d.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
}

function pickShowEmail(u) {
  if (u == null) return true;
  return coerceProfileVisibilityBool(u.profileShowEmail ?? u.profile_show_email, true);
}

function pickShowPhone(u) {
  if (u == null) return true;
  return coerceProfileVisibilityBool(u.profileShowPhone ?? u.profile_show_phone, true);
}

const ProfileScreen = () => {
  const colors = useThemeColors();
  const router = useRouter();
  const params = useLocalSearchParams();
  const rawMemberId = params.memberId ?? params.member_id;
  const memberIdNum = rawMemberId != null && rawMemberId !== '' ? Number(rawMemberId) : null;

  const { user, setUser, logout, userRole } = useAuth();
  const { savedEvents = [], isSyncingSaved, refreshSavedEvents } = useSavedEvents() || {};

  const [memberInterests, setMemberInterests] = useState([]);
  const [eventsMainTab, setEventsMainTab] = useState('going');
  const [goingEvents, setGoingEvents] = useState([]);
  const [loadingGoing, setLoadingGoing] = useState(true);
  const [viewedMember, setViewedMember] = useState(null);
  const [loadingMember, setLoadingMember] = useState(false);

  const uid = user?.id != null ? Number(user.id) : user?.sub != null ? Number(user.sub) : null;
  const isLoggedInViewer = uid != null;
  const hasExplicitMemberId = memberIdNum != null && Number.isFinite(memberIdNum);
  const isOwnProfile = !hasExplicitMemberId || (isLoggedInViewer && Number(memberIdNum) === uid);

  const displayUser = isOwnProfile ? user : viewedMember;

  const profileHidden = coerceProfileVisibilityBool(
    displayUser?.profileHidden ?? displayUser?.profile_hidden,
    false,
  );
  const viewerCanReveal = canViewerSeeHiddenProfile(userRole);
  const isProfileBlocked = !isOwnProfile && profileHidden && !viewerCanReveal;
  const isProfileLimited = !isOwnProfile && profileHidden && viewerCanReveal;

  const displayName = isProfileBlocked ? 'Anonymous Member' : (pickDisplayName(displayUser) || 'Member');
  const locationLabelRaw = pickLocationLabel(displayUser);
  const locationLabel = locationLabelRaw ? locationLabelRaw : null;
  const joinedLabel = formatJoinedDate(displayUser?.createdAt ?? displayUser?.created_at);
  const emailRaw = typeof displayUser?.email === 'string' ? displayUser.email.trim() : '';
  const phoneRaw = String(displayUser?.phone ?? displayUser?.phoneNumber ?? '').trim();
  const showEmail = pickShowEmail(displayUser);
  const showPhone = pickShowPhone(displayUser);

  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle('dark-content');
      if (Platform.OS === 'android') {
        StatusBar.setBackgroundColor(colors.background);
        StatusBar.setTranslucent(false);
      }
    }, [colors.background]),
  );

  useEffect(() => {
    let cancelled = false;
    if (!isOwnProfile && memberIdNum != null && Number.isFinite(memberIdNum)) {
      setLoadingMember(true);
      getMemberById(memberIdNum)
        .then((data) => {
          if (!cancelled) setViewedMember(data);
        })
        .catch(() => {
          if (!cancelled) setViewedMember(null);
        })
        .finally(() => {
          if (!cancelled) setLoadingMember(false);
        });
    } else {
      setViewedMember(null);
      setLoadingMember(false);
    }
    return () => {
      cancelled = true;
    };
  }, [isOwnProfile, memberIdNum]);

  const loadJoinedFromFeed = useCallback(async () => {
    if (!isOwnProfile) {
      setGoingEvents([]);
      setLoadingGoing(false);
      return;
    }
    setLoadingGoing(true);
    try {
      const { items } = await getEvents({ page: 1, limit: 50, sort: 'start-asc' });
      const joined = (items || []).filter((e) => e.isJoined);
      setGoingEvents(joined);
    } catch {
      setGoingEvents([]);
    } finally {
      setLoadingGoing(false);
    }
  }, [isOwnProfile]);

  const refreshMemberData = useCallback(async () => {
    if (!isOwnProfile) return;
    try {
      const me = await authApi.getMe();
      setUser((prev) => (prev ? normalizeUser(prev, me) : prev));
    } catch {
      // keep cached user
    }
    try {
      const mine = await onboardingApi.getMyInterests();
      setMemberInterests(Array.isArray(mine) ? mine : []);
    } catch {
      setMemberInterests([]);
    }
  }, [isOwnProfile, setUser]);

  useFocusEffect(
    useCallback(() => {
      loadJoinedFromFeed();
      if (isOwnProfile) {
        refreshSavedEvents?.();
        refreshMemberData();
      }
    }, [loadJoinedFromFeed, refreshSavedEvents, refreshMemberData, isOwnProfile]),
  );

  const now = useMemo(() => new Date(), []);

  const stats = useMemo(() => {
    const goingUpcoming = goingEvents.filter((e) => {
      if (e.eventState === 'ended') return false;
      const startsAt = e.startsAt ? new Date(e.startsAt) : null;
      if (!startsAt || !Number.isFinite(startsAt.getTime())) return true;
      if (e.eventState === 'live') return true;
      return startsAt.getTime() >= now.getTime();
    }).length;
    const savedCount = savedEvents.length;
    const interestsCount = memberInterests.length;
    return { goingUpcoming, savedCount, interestsCount };
  }, [goingEvents, savedEvents, memberInterests, now]);

  const attendedCount = useMemo(
    () =>
      goingEvents.filter((e) => {
        if (e.eventState === 'ended') return true;
        const startsAt = e.startsAt ? new Date(e.startsAt) : null;
        if (!startsAt || !Number.isFinite(startsAt.getTime())) return false;
        if (e.eventState === 'live') return false;
        return startsAt.getTime() < now.getTime();
      }).length,
    [goingEvents, now],
  );

  const handleRemoveInterest = async (interestId) => {
    const id = Number(interestId);
    const nextIds = memberInterests.filter((i) => Number(i.id) !== id).map((i) => Number(i.id));
    try {
      await onboardingApi.updateInterests(nextIds);
      setMemberInterests((prev) => prev.filter((i) => Number(i.id) !== id));
    } catch (e) {
      Alert.alert('Could not update', e?.message || 'Try again.');
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/(tabs)');
  };

  if (!isOwnProfile && loadingMember) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!isOwnProfile && !viewedMember) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
        <View style={styles.loadingWrap}>
          <Text style={{ color: colors.textSecondary }}>Could not load this profile.</Text>
          <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
            <Text style={{ color: colors.primary, fontWeight: '700' }}>Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} hitSlop={12}>
            <Feather name="arrow-left" size={22} color={colors.icon} />
          </TouchableOpacity>
          {isOwnProfile ? (
            <Link href="/settings" asChild>
              <TouchableOpacity style={styles.settingsButton} hitSlop={12}>
                <Feather name="settings" size={22} color={colors.icon} />
              </TouchableOpacity>
            </Link>
          ) : (
            <View style={{ width: 44 }} />
          )}
        </View>

        <View style={styles.identityRow}>
          <View style={styles.avatarWrap}>
            <MemberInitialAvatar
              name={displayName}
              size={88}
              borderColor={colors.card}
              borderWidth={3}
            />
            {isProfileBlocked ? (
              <View style={styles.privateBadge}>
                <Feather name="eye-off" size={12} color="#FFFFFF" />
              </View>
            ) : null}
            {isOwnProfile ? (
              <TouchableOpacity
                style={styles.editAvatarFab}
                onPress={() => router.push('/(modal)/editProfile')}
                activeOpacity={0.9}
                accessibilityLabel="Edit profile"
              >
                <Feather name="edit-2" size={14} color="#FFFFFF" />
              </TouchableOpacity>
            ) : null}
          </View>
          <View style={styles.identityTextCol}>
            <Text style={[styles.name, { color: colors.text }]} numberOfLines={2}>
              {displayName}
            </Text>
            {isOwnProfile ? (
              <Text style={[styles.attendedLine, { color: colors.textSecondary }]}>
                {attendedCount} event{attendedCount === 1 ? '' : 's'} attended
              </Text>
            ) : null}
            {isOwnProfile ? (
              <View style={styles.statsRow}>
                <View style={styles.statPlain}>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Going</Text>
                  <Text style={[styles.statValue, { color: colors.text }]}>{stats.goingUpcoming}</Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                <View style={styles.statPlain}>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Saved</Text>
                  <Text style={[styles.statValue, { color: colors.text }]}>{stats.savedCount}</Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                <View style={styles.statPlain}>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Interests</Text>
                  <Text style={[styles.statValue, { color: colors.text }]}>{stats.interestsCount}</Text>
                </View>
              </View>
            ) : null}
          </View>
        </View>

        {isProfileBlocked ? (
          <View style={[styles.privacyBanner, { backgroundColor: '#F9FAFB', borderColor: '#E5E7EB' }]}>
            <Feather name="eye-off" size={16} color="#9CA3AF" />
            <Text style={styles.privacyBannerText}>
              This member has chosen to attend anonymously.
            </Text>
          </View>
        ) : null}

        {isOwnProfile ? (
          <View style={[styles.section, { borderTopColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Interests</Text>
            <View style={styles.interestsContainer}>
              {memberInterests.map((row) => {
                const id = Number(row.id);
                const label = row.name ?? String(id);
                return (
                  <View key={id} style={styles.chipWrapper}>
                    <Chip label={label} iconSpec={INTEREST_ICON_MAP[label]} selected />
                    <TouchableOpacity style={styles.removeButton} onPress={() => handleRemoveInterest(id)} hitSlop={6}>
                      <Feather name="x" size={14} color="#fff" />
                    </TouchableOpacity>
                  </View>
                );
              })}
              <Link href="/(modal)/manageInterests" asChild>
                <TouchableOpacity style={[styles.addInterestPill, { backgroundColor: colors.backgroundMuted }]}>
                  <Text style={[styles.addInterestText, { color: colors.text }]}>Add</Text>
                  <Feather name="plus" size={16} color={colors.icon} />
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        ) : null}

        {isOwnProfile ? (
          <View style={[styles.section, { borderTopColor: colors.border }]}>
            <MemberProfileEventsSection
              mainTab={eventsMainTab}
              onMainTabChange={setEventsMainTab}
              goingEvents={goingEvents}
              savedEvents={savedEvents}
              loadingGoing={loadingGoing}
              isSyncingSaved={Boolean(isSyncingSaved)}
            />
          </View>
        ) : null}

        <View style={[styles.contactCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <LinearGradient
            colors={['#FF7A00', '#FF9A3D']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.contactCardAccent}
          />
          <View style={styles.contactCardInner}>
            <Text style={[styles.contactCardTitle, { color: colors.text }]}>Member details</Text>
            {isOwnProfile ? (
              <Text style={[styles.contactCardSubtitle, { color: colors.textSecondary }]}>
                Control email and phone visibility for visitors in Settings → Privacy.
              </Text>
            ) : (
              <Text style={[styles.contactCardSubtitle, { color: colors.textSecondary }]}>
                Contact options when this member chooses to share them.
              </Text>
            )}

            {isProfileLimited ? (
              <Text style={[styles.contactCardSubtitle, { color: colors.textSecondary }]}>
                This member has hidden their profile. Organizers see limited details.
              </Text>
            ) : null}

            {isProfileBlocked ? (
              <View style={[styles.contactRow, { borderTopColor: colors.border }]}>
                <View style={[styles.contactIconWrap, { backgroundColor: colors.backgroundMuted }]}>
                  <Feather name="lock" size={18} color={colors.textSecondary} />
                </View>
                <View style={styles.contactTextCol}>
                  <Text style={[styles.contactLabel, { color: colors.textSecondary }]}>Profile hidden</Text>
                  <Text style={[styles.contactValueMuted, { color: colors.textSecondary }]}>
                    This member is anonymous to other members.
                  </Text>
                </View>
              </View>
            ) : (
              <>

            {joinedLabel ? (
              <View style={[styles.contactRow, { borderTopColor: colors.border }]}>
                <View style={[styles.contactIconWrap, { backgroundColor: colors.primarySoft }]}>
                  <Feather name="award" size={18} color="#FF7A00" />
                </View>
                <View style={styles.contactTextCol}>
                  <Text style={[styles.contactLabel, { color: colors.textSecondary }]}>Member since</Text>
                  <Text style={[styles.contactValue, { color: colors.text }]}>{joinedLabel}</Text>
                </View>
              </View>
            ) : null}

            {locationLabel ? (
              <View style={[styles.contactRow, { borderTopColor: colors.border }]}>
                <View style={[styles.contactIconWrap, { backgroundColor: colors.primarySoft }]}>
                  <Feather name="map-pin" size={18} color="#FF7A00" />
                </View>
                <View style={styles.contactTextCol}>
                  <Text style={[styles.contactLabel, { color: colors.textSecondary }]}>Location</Text>
                  <Text style={[styles.contactValue, { color: colors.text }]}>{locationLabel}</Text>
                </View>
              </View>
            ) : isOwnProfile ? (
              <View style={[styles.contactRow, { borderTopColor: colors.border }]}>
                <View style={[styles.contactIconWrap, { backgroundColor: colors.backgroundMuted }]}>
                  <Feather name="map-pin" size={18} color={colors.textSecondary} />
                </View>
                <View style={styles.contactTextCol}>
                  <Text style={[styles.contactLabel, { color: colors.textSecondary }]}>Location</Text>
                  <Text style={[styles.contactValueMuted, { color: colors.textSecondary }]}>
                    Add in Edit profile for better matches
                  </Text>
                </View>
              </View>
            ) : null}

            {showEmail && emailRaw ? (
              <TouchableOpacity
                style={[styles.contactRow, { borderTopColor: colors.border }]}
                onPress={() => Linking.openURL(`mailto:${emailRaw}`)}
                activeOpacity={0.75}
              >
                <View style={[styles.contactIconWrap, { backgroundColor: colors.primarySoft }]}>
                  <Feather name="mail" size={18} color="#FF7A00" />
                </View>
                <View style={styles.contactTextCol}>
                  <Text style={[styles.contactLabel, { color: colors.textSecondary }]}>Email</Text>
                  <Text style={styles.contactValueLink}>{emailRaw}</Text>
                </View>
                <Feather name="chevron-right" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            ) : null}

            {showPhone && phoneRaw ? (
              <TouchableOpacity
                style={[styles.contactRow, { borderTopColor: colors.border }]}
                onPress={() => Linking.openURL(`tel:${phoneRaw.replace(/\s/g, '')}`)}
                activeOpacity={0.75}
              >
                <View style={[styles.contactIconWrap, { backgroundColor: colors.primarySoft }]}>
                  <Feather name="phone" size={18} color="#FF7A00" />
                </View>
                <View style={styles.contactTextCol}>
                  <Text style={[styles.contactLabel, { color: colors.textSecondary }]}>Phone</Text>
                  <Text style={styles.contactValueLink}>{phoneRaw}</Text>
                </View>
                <Feather name="chevron-right" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            ) : null}
              </>
            )}
          </View>
        </View>

        {isOwnProfile ? (
          <View style={[styles.section, { borderTopColor: colors.border }]}>
            <TouchableOpacity style={[styles.logoutItem, { backgroundColor: colors.primarySoft }]} onPress={handleLogout}>
              <Text style={styles.logoutText}>Sign out</Text>
              <Feather name="log-out" size={20} color="#E65A3A" />
            </TouchableOpacity>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  container: { flex: 1 },
  scrollContent: { paddingBottom: 32 },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingTop: 4,
  },
  backBtn: { padding: 10 },
  headerSpacer: { flex: 1 },
  settingsButton: { padding: 10 },
  avatarWrap: {
    position: 'relative',
  },
  editAvatarFab: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF7A00',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  privateBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#6B7280',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 4,
    gap: 16,
  },
  profilePic: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    backgroundColor: '#E2E8F0',
  },
  profilePicFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  profilePicLetter: {
    fontSize: 36,
    fontWeight: '800',
  },
  identityTextCol: {
    flex: 1,
    minWidth: 0,
    paddingTop: 4,
  },
  name: {
    fontSize: 22,
    fontWeight: '800',
  },
  attendedLine: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginTop: 14,
  },
  statPlain: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    marginVertical: 2,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    marginTop: 4,
    fontSize: 20,
    fontWeight: '800',
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 22,
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 15,
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  chipWrapper: {
    marginRight: 10,
    marginBottom: 10,
    position: 'relative',
  },
  removeButton: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: 'rgba(0,0,0,0.72)',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addInterestPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginRight: 10,
    marginBottom: 10,
  },
  addInterestText: {
    fontSize: 15,
    fontWeight: '600',
    marginRight: 5,
  },
  contactCard: {
    marginHorizontal: 20,
    marginTop: 8,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 6,
  },
  contactCardAccent: {
    height: 5,
    width: '100%',
  },
  contactCardInner: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 14,
  },
  contactCardTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  contactCardSubtitle: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  contactIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  contactTextCol: {
    flex: 1,
    minWidth: 0,
  },
  contactLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  contactValue: {
    marginTop: 3,
    fontSize: 16,
    fontWeight: '700',
  },
  contactValueMuted: {
    marginTop: 3,
    fontSize: 15,
    fontWeight: '600',
  },
  contactValueLink: {
    marginTop: 3,
    fontSize: 15,
    fontWeight: '700',
    color: '#EA580C',
  },
  privacyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  privacyBannerText: {
    flex: 1,
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
    lineHeight: 18,
  },
  logoutItem: {
    marginTop: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  logoutText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#E65A3A',
  },
});

export default ProfileScreen;
