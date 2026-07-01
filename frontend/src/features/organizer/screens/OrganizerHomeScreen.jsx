import React, { useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import useGuardedRouter from '@/hooks/useGuardedRouter';
import { Ionicons } from '@expo/vector-icons';

import OrganizerTabScaffold from '@/features/organizer/components/OrganizerTabScaffold';
import OrganizerHomeHero from '@/features/organizer/components/OrganizerHomeHero';
import OrganizerOverviewGrid from '@/features/organizer/components/OrganizerOverviewGrid';
import OrganizerOverviewPeriodPicker from '@/features/organizer/components/OrganizerOverviewPeriodPicker';
import OrganizerUpcomingSection from '@/features/organizer/components/OrganizerUpcomingSection';
import useOrganizerDashboardData from '@/features/organizer/hooks/useOrganizerDashboardData';
import {
  computeOrganizerOverviewCounts,
  countOrganizerNextUpEvents,
  filterEventsByOverviewPeriod,
  getOrganizerNextUpEvents,
} from '@/features/organizer/utils/organizerEventUtils';
import {
  getOrganizerBannerPressHref,
  getOrganizerBannerStyles,
  getOrganizerDashboardBanner,
} from '@/utils/organizerPublish';
import { useThemeColors } from '@/theme';
import OrganizerDashboardSkeleton from '@/components/skeletons/OrganizerDashboardSkeleton';
import useAuth from '@/auth/useAuth';
import { formatCount } from '@/components/organizer/OrganizerProfileChrome';

export default function OrganizerHomeScreen() {
  const router = useGuardedRouter();
  const colors = useThemeColors();
  const { user } = useAuth();
  const [overviewPeriod, setOverviewPeriod] = useState('all');
  const {
    events,
    organizationName,
    headerFullName,
    verificationStatus,
    publishEligibility,
    profileDashboard,
    loading,
    refreshing,
    onRefresh,
  } = useOrganizerDashboardData();

  const greetingName = organizationName || headerFullName || user?.fullName || 'Organizer';
  const statusBanner = getOrganizerDashboardBanner(publishEligibility, verificationStatus);
  const bannerStyles = statusBanner ? getOrganizerBannerStyles(statusBanner.tone) : null;

  const filteredEvents = useMemo(
    () => filterEventsByOverviewPeriod(events, overviewPeriod),
    [events, overviewPeriod],
  );
  const overviewCounts = useMemo(
    () => computeOrganizerOverviewCounts(filteredEvents),
    [filteredEvents],
  );
  const nextUpEvents = useMemo(() => getOrganizerNextUpEvents(events, 6), [events]);
  const nextUpTotal = useMemo(() => countOrganizerNextUpEvents(events), [events]);

  const d = profileDashboard || {};
  const organizerTypeLabel = d.organizerTypeLabel || '';

  const overviewMetrics = {
    events: formatCount(overviewCounts.eventsCount),
    attendees: formatCount(overviewCounts.totalAttendees),
    upcoming: formatCount(overviewCounts.upcoming),
    drafts: formatCount(overviewCounts.drafts),
    live: formatCount(overviewCounts.live),
    past: formatCount(overviewCounts.past),
  };

  const handleOverviewMetricPress = (key) => {
    if (key === 'attendees') {
      router.push('/(organizer)/attendees');
      return;
    }
    const tabMap = {
      events: 'Published',
      upcoming: 'Published',
      drafts: 'Drafts',
      live: 'Published',
      past: 'Past',
    };
    router.push({
      pathname: '/(organizer)/(tabs)/events',
      params: { filter: tabMap[key] || 'Published' },
    });
  };

  if (loading) {
    return (
      <OrganizerTabScaffold title="Home" orgName={greetingName} homeMode showFab={false}>
        <OrganizerDashboardSkeleton />
      </OrganizerTabScaffold>
    );
  }

  return (
    <OrganizerTabScaffold
      title="Home"
      orgName={greetingName}
      orgTypeLabel={organizerTypeLabel}
      homeMode
      showFab={false}
    >
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        contentContainerStyle={{ padding: 16, paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
      >
        <OrganizerHomeHero onCreateEvent={() => router.push('/(organizer)/create-event')} />

        {statusBanner ? (
          <Pressable
            onPress={() => router.push(getOrganizerBannerPressHref(publishEligibility, verificationStatus))}
            style={{
              borderRadius: 16,
              borderWidth: 1,
              borderColor: bannerStyles.border,
              backgroundColor: bannerStyles.bg,
              padding: 14,
              marginBottom: 18,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Text style={{ color: bannerStyles.fg, fontWeight: '800', flex: 1, paddingRight: 8 }}>{statusBanner.text}</Text>
            <Ionicons name="chevron-forward" size={18} color={bannerStyles.fg} />
          </Pressable>
        ) : null}

        <OrganizerOverviewPeriodPicker value={overviewPeriod} onChange={setOverviewPeriod} />

        <OrganizerOverviewGrid metrics={overviewMetrics} onPressMetric={handleOverviewMetricPress} />

        <OrganizerUpcomingSection
          events={nextUpEvents}
          totalCount={nextUpTotal}
          onCreateEvent={() => router.push('/(organizer)/create-event')}
        />
      </ScrollView>
    </OrganizerTabScaffold>
  );
}
