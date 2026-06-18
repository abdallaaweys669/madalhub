import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Platform,
  Alert,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import GmailBrandIcon from '@/assets/gmail-brand.svg';
import GoogleMapsBrandIcon from '@/assets/google-maps-brand.svg';
import { Link, useLocalSearchParams, useFocusEffect } from 'expo-router';
import useGuardedRouter from '@/hooks/useGuardedRouter';
import useAuth from '@/auth/useAuth';
import { useSavedEvents } from '@/context/SavedEventsContext';
import { getEvents } from '@/api/events';
import Chip from '@/features/onboarding/components/Chip';
import { INTEREST_ICON_MAP } from '@/features/onboarding/data/interestIconMap';
import { MemberProfileEventsSection } from '@/components/member/MemberProfileEventsSection';
import { MemberProfileAvatar } from '@/components/member/MemberProfileAvatar';
import { MemberProfileSocialLinks } from '@/components/member/MemberProfileSocialLinks';
import onboardingApi from '@/api/onboarding';
import { getMemberById, getMemberInterestsById, getMemberJoinedEventsById, getMemberSavedEventsById } from '@/api/member';
import { mapApiEventToCard } from '@/api/events';
import { useThemeColors } from '@/theme';
import { coerceProfileVisibilityBool, pickDisplayName, pickLocationLabel } from '@/auth/normalizeUser';
import { mergeAuthenticatedUserFromMe } from '@/auth/mergeAuthenticatedUserFromMe';
import { canViewerSeeHiddenProfile } from '@/utils/anonymize';
import { openKulanMemberWhatsApp } from '@/utils/whatsapp';
import SignOutButton from '@/components/auth/SignOutButton';

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
  const router = useGuardedRouter();
  const params = useLocalSearchParams();
  const rawMemberId = params.memberId ?? params.member_id;
  const memberIdNum = rawMemberId != null && rawMemberId !== '' ? Number(rawMemberId) : null;

  const { user, setUser, userRole } = useAuth();
  const { savedEvents = [], isSyncingSaved, refreshSavedEvents } = useSavedEvents() || {};

  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [memberInterests, setMemberInterests] = useState([]);
  const [eventsMainTab, setEventsMainTab] = useState('going');
  const [goingEvents, setGoingEvents] = useState([]);
  const [loadingGoing, setLoadingGoing] = useState(true);
  const [viewedMember, setViewedMember] = useState(null);
  const [loadingMember, setLoadingMember] = useState(false);
  const [visitorInterests, setVisitorInterests] = useState([]);
  const [visitorGoingEvents, setVisitorGoingEvents] = useState([]);
  const [visitorSavedEvents, setVisitorSavedEvents] = useState([]);
  const [loadingVisitorExtras, setLoadingVisitorExtras] = useState(false);

  const uid = user?.id != null ? Number(user.id) : user?.sub != null ? Number(user.sub) : null;
  const isLoggedInViewer = uid != null;
  const forceVisitorView = params.from === 'attendees';
  const hasExplicitMemberId = memberIdNum != null && Number.isFinite(memberIdNum);
  const isOwnProfile =
    !hasExplicitMemberId || (isLoggedInViewer && Number(memberIdNum) === uid && !forceVisitorView);
  const isVisitorProfile = hasExplicitMemberId && (!isOwnProfile || forceVisitorView);
  const canEditProfile = isOwnProfile && !forceVisitorView;

  const displayUser = isOwnProfile ? user : viewedMember;
  const visitorName = pickDisplayName(user) || 'A MadalHub member';

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
    if (!isVisitorProfile || memberIdNum == null || !Number.isFinite(memberIdNum)) {
      setViewedMember(null);
      setVisitorInterests([]);
      setVisitorGoingEvents([]);
      setVisitorSavedEvents([]);
      setLoadingMember(false);
      setLoadingVisitorExtras(false);
      return undefined;
    }

    setLoadingMember(true);
    setLoadingVisitorExtras(true);

    Promise.all([
      getMemberById(memberIdNum),
      getMemberInterestsById(memberIdNum).catch(() => ({ interests: [] })),
      getMemberJoinedEventsById(memberIdNum).catch(() => ({ items: [] })),
      getMemberSavedEventsById(memberIdNum).catch(() => ({ items: [] })),
    ])
      .then(([member, interestsPayload, goingPayload, savedPayload]) => {
        if (cancelled) return;
        setViewedMember(member);
        setVisitorInterests(Array.isArray(interestsPayload?.interests) ? interestsPayload.interests : []);
        const goingItems = Array.isArray(goingPayload?.items) ? goingPayload.items : [];
        const savedItems = Array.isArray(savedPayload?.items) ? savedPayload.items : [];
        setVisitorGoingEvents(goingItems.map((event) => mapApiEventToCard(event)));
        setVisitorSavedEvents(savedItems.map((event) => mapApiEventToCard(event)));
      })
      .catch(() => {
        if (!cancelled) {
          setViewedMember(null);
          setVisitorInterests([]);
          setVisitorGoingEvents([]);
          setVisitorSavedEvents([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingMember(false);
          setLoadingVisitorExtras(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isVisitorProfile, memberIdNum]);

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
    await mergeAuthenticatedUserFromMe(setUser);
    try {
      const mine = await onboardingApi.getMyInterests();
      setMemberInterests(Array.isArray(mine) ? mine : []);
    } catch {
      setMemberInterests([]);
    }
  }, [isOwnProfile, setUser]);

  useFocusEffect(
    useCallback(() => {
      setBannerDismissed(false);
      loadJoinedFromFeed();
      if (canEditProfile) {
        refreshSavedEvents?.();
        refreshMemberData();
      }
    }, [loadJoinedFromFeed, refreshSavedEvents, refreshMemberData, canEditProfile]),
  );

  const now = useMemo(() => new Date(), []);

  const displayInterests = isVisitorProfile ? visitorInterests : memberInterests;
  const displayGoingEvents = isVisitorProfile ? visitorGoingEvents : goingEvents;
  const displaySavedEvents = isVisitorProfile ? visitorSavedEvents : savedEvents;

  const stats = useMemo(() => {
    const sourceGoing = displayGoingEvents;
    const goingUpcoming = sourceGoing.filter((e) => {
      if (e.eventState === 'ended') return false;
      const startsAt = e.startsAt ? new Date(e.startsAt) : null;
      if (!startsAt || !Number.isFinite(startsAt.getTime())) return true;
      if (e.eventState === 'live') return true;
      return startsAt.getTime() >= now.getTime();
    }).length;
    const savedCount = displaySavedEvents.length;
    const interestsCount = displayInterests.length;
    return { goingUpcoming, savedCount, interestsCount };
  }, [displayGoingEvents, displayInterests, displaySavedEvents, now]);

  const attendedCount = useMemo(
    () =>
      displayGoingEvents.filter((e) => {
        if (e.eventState === 'ended') return true;
        const startsAt = e.startsAt ? new Date(e.startsAt) : null;
        if (!startsAt || !Number.isFinite(startsAt.getTime())) return false;
        if (e.eventState === 'live') return false;
        return startsAt.getTime() < now.getTime();
      }).length,
    [displayGoingEvents, now],
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


  const handleVisitorWhatsApp = useCallback(() => {
    void openKulanMemberWhatsApp(phoneRaw, {
      memberName: displayName,
      visitorName,
    });
  }, [phoneRaw, displayName, visitorName]);

  if (isVisitorProfile && loadingMember) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (isVisitorProfile && !viewedMember && !loadingMember) {
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
          {canEditProfile ? (
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
            <MemberProfileAvatar
              user={displayUser}
              name={displayName}
              size={88}
              borderColor={colors.card}
              borderWidth={3}
              hidePhoto={isProfileBlocked}
            />
            {isProfileBlocked ? (
              <View style={styles.privateBadge}>
                <Feather name="eye-off" size={12} color="#FFFFFF" />
              </View>
            ) : null}
            {canEditProfile ? (
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
            {(canEditProfile || isVisitorProfile) && !isProfileBlocked ? (
              <Text style={[styles.attendedLine, { color: colors.textSecondary }]}>
                {attendedCount} event{attendedCount === 1 ? '' : 's'} attended
              </Text>
            ) : null}
            {(canEditProfile || isVisitorProfile) && !isProfileBlocked ? (
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

        {canEditProfile && !phoneRaw && !bannerDismissed ? (
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.completeBanner}
            onPress={() => router.push('/(modal)/editProfile')}
          >
            <View style={styles.completeBannerLeft}>
              <Feather name="phone" size={16} color="#FF7A00" />
              <View style={{ flex: 1 }}>
                <Text style={styles.completeBannerTitle}>Complete your profile</Text>
                <Text style={styles.completeBannerSub}>Add your phone number so others can reach you.</Text>
              </View>
            </View>
            <TouchableOpacity
              hitSlop={10}
              onPress={(e) => { e.stopPropagation(); setBannerDismissed(true); }}
            >
              <Feather name="x" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          </TouchableOpacity>
        ) : null}

        {isProfileBlocked ? (
          <View style={[styles.privacyBanner, { backgroundColor: '#F9FAFB', borderColor: '#E5E7EB' }]}>
            <Feather name="eye-off" size={16} color="#9CA3AF" />
            <Text style={styles.privacyBannerText}>
              This member has chosen to attend anonymously.
            </Text>
          </View>
        ) : null}

        {(canEditProfile || (isVisitorProfile && !isProfileBlocked)) ? (
          <View style={[styles.section, { borderTopColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Interests</Text>
            <View style={styles.interestsContainer}>
              {displayInterests.map((row) => {
                const id = Number(row.id);
                const label = row.name ?? String(id);
                return canEditProfile ? (
                  <View key={id} style={styles.chipWrapper}>
                    <Chip label={label} iconSpec={INTEREST_ICON_MAP[label]} selected />
                    <TouchableOpacity style={styles.removeButton} onPress={() => handleRemoveInterest(id)} hitSlop={6}>
                      <Feather name="x" size={14} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View key={id} style={styles.readOnlyChipWrap}>
                    <Chip label={label} iconSpec={INTEREST_ICON_MAP[label]} selected />
                  </View>
                );
              })}
              {canEditProfile ? (
                <Link href="/(modal)/manageInterests" asChild>
                  <TouchableOpacity style={StyleSheet.flatten([styles.addInterestPill, { backgroundColor: colors.backgroundMuted }])}>
                    <Text style={[styles.addInterestText, { color: colors.text }]}>Add</Text>
                    <Feather name="plus" size={16} color={colors.icon} />
                  </TouchableOpacity>
                </Link>
              ) : null}
              {isVisitorProfile && displayInterests.length === 0 && !loadingVisitorExtras ? (
                <Text style={[styles.emptyInline, { color: colors.textSecondary }]}>No interests listed.</Text>
              ) : null}
            </View>
          </View>
        ) : null}

        {(canEditProfile || isVisitorProfile) && !isProfileBlocked ? (
          <View style={[styles.section, { borderTopColor: colors.border }]}>
            <MemberProfileEventsSection
              mainTab={eventsMainTab}
              onMainTabChange={setEventsMainTab}
              goingEvents={displayGoingEvents}
              savedEvents={displaySavedEvents}
              loadingGoing={isVisitorProfile ? loadingVisitorExtras : loadingGoing}
              isSyncingSaved={isVisitorProfile ? loadingVisitorExtras : Boolean(isSyncingSaved)}
              readOnly={isVisitorProfile}
            />
          </View>
        ) : null}

        <View style={[styles.section, { borderTopColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Member details</Text>
          {canEditProfile ? (
            <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
              Control email and phone visibility for visitors in Settings → Privacy.
            </Text>
          ) : (
            <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
              {isVisitorProfile
                ? 'Shared details from this member. Tap WhatsApp to message with a MadalHub intro.'
                : 'Contact options when this member chooses to share them.'}
            </Text>
          )}

          {isProfileLimited ? (
            <Text style={[styles.sectionSubtitle, { color: colors.textSecondary, marginBottom: 0 }]}>
              This member has hidden their profile. Organizers see limited details.
            </Text>
          ) : null}

          {isProfileBlocked ? (
            <View style={[styles.contactRow, { borderTopColor: colors.border }]}>
              <View style={styles.contactIconSlot}>
                <Feather name="lock" size={22} color={colors.textSecondary} />
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
                <View style={styles.contactIconSlot}>
                  <MaterialCommunityIcons name="calendar-check" size={24} color="#FF7A00" />
                </View>
                <View style={styles.contactTextCol}>
                  <Text style={[styles.contactLabel, { color: colors.textSecondary }]}>Member since</Text>
                  <Text style={[styles.contactValue, { color: colors.text }]}>{joinedLabel}</Text>
                </View>
              </View>
            ) : null}

            {locationLabel ? (
              <View style={[styles.contactRow, { borderTopColor: colors.border }]}>
                <View style={styles.contactIconSlot}>
                  <GoogleMapsBrandIcon width={24} height={24} />
                </View>
                <View style={styles.contactTextCol}>
                  <Text style={[styles.contactLabel, { color: colors.textSecondary }]}>Location</Text>
                  <Text style={[styles.contactValue, { color: colors.text }]}>{locationLabel}</Text>
                </View>
              </View>
            ) : canEditProfile ? (
              <View style={[styles.contactRow, { borderTopColor: colors.border }]}>
                <View style={styles.contactIconSlot}>
                  <MaterialCommunityIcons name="map-marker-outline" size={24} color={colors.textSecondary} />
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
                disabled={isProfileBlocked}
              >
                <View style={styles.contactIconSlot}>
                  <GmailBrandIcon width={24} height={24} />
                </View>
                <View style={styles.contactTextCol}>
                  <Text style={[styles.contactLabel, { color: colors.textSecondary }]}>Email</Text>
                  <Text style={isVisitorProfile ? [styles.contactValue, { color: colors.text }] : styles.contactValueLink}>
                    {emailRaw}
                  </Text>
                </View>
                {!isVisitorProfile ? (
                  <Feather name="chevron-right" size={18} color={colors.textSecondary} />
                ) : (
                  <Feather name="external-link" size={16} color={colors.textSecondary} />
                )}
              </TouchableOpacity>
            ) : null}

            {showPhone && phoneRaw ? (
              isVisitorProfile ? (
                <TouchableOpacity
                  style={[styles.contactRow, { borderTopColor: colors.border }]}
                  onPress={handleVisitorWhatsApp}
                  activeOpacity={0.75}
                >
                  <View style={styles.contactIconSlot}>
                    <FontAwesome5 name="whatsapp" size={24} color="#25D366" brand />
                  </View>
                  <View style={styles.contactTextCol}>
                    <Text style={[styles.contactLabel, { color: colors.textSecondary }]}>WhatsApp</Text>
                    <Text style={[styles.contactValue, { color: colors.text }]}>{phoneRaw}</Text>
                  </View>
                  <Feather name="external-link" size={16} color={colors.textSecondary} />
                </TouchableOpacity>
              ) : (
              <TouchableOpacity
                style={[styles.contactRow, { borderTopColor: colors.border }]}
                onPress={() => Linking.openURL(`tel:${phoneRaw.replace(/\s/g, '')}`)}
                activeOpacity={0.75}
              >
                <View style={styles.contactIconSlot}>
                  <MaterialCommunityIcons name="phone" size={24} color="#007AFF" />
                </View>
                <View style={styles.contactTextCol}>
                  <Text style={[styles.contactLabel, { color: colors.textSecondary }]}>Phone</Text>
                  <Text style={styles.contactValueLink}>{phoneRaw}</Text>
                  <Text style={[styles.contactActionHint, { color: colors.textSecondary }]}>
                    Visible to members who view your profile
                  </Text>
                </View>
                <Feather name="chevron-right" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
              )
            ) : null}
            </>
          )}
        </View>

        {!isProfileBlocked ? (
          <MemberProfileSocialLinks
            user={displayUser}
            colors={colors}
            readOnly={isVisitorProfile}
          />
        ) : null}

        {canEditProfile ? (
          <View style={[styles.section, { borderTopColor: colors.border }]}>
            <SignOutButton redirectTo="/(tabs)/" style={styles.signOutButton} />
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
  contactActionHint: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
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
  sectionSubtitle: {
    marginTop: -8,
    marginBottom: 14,
    fontSize: 13,
    lineHeight: 18,
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
  readOnlyChipWrap: {
    marginRight: 10,
    marginBottom: 10,
  },
  emptyInline: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
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
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  contactIconSlot: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
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
  completeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginTop: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    gap: 10,
  },
  completeBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  completeBannerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#C2410C',
    marginBottom: 1,
  },
  completeBannerSub: {
    fontSize: 12,
    color: '#9A3412',
    lineHeight: 17,
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
  signOutButton: {
    marginTop: 4,
  },
});

export default ProfileScreen;
