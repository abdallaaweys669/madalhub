import { useCallback, useEffect, useState } from 'react';
import organizerApi from '@/api/organizer';
import { resolveApiAssetUrl } from '@/utils/mediaUrl';

export default function useOrganizerDashboardData() {
  const [events, setEvents] = useState([]);
  const [organizationName, setOrganizationName] = useState('');
  const [headerProfileImg, setHeaderProfileImg] = useState('');
  const [headerFullName, setHeaderFullName] = useState('');
  const [verificationStatus, setVerificationStatus] = useState('');
  const [publishEligibility, setPublishEligibility] = useState(null);
  const [profileDashboard, setProfileDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    const [eventsData, profileData, eligibilityData] = await Promise.all([
      organizerApi.getOrganizerEvents(),
      organizerApi.getProfileDashboard().catch(() => null),
      organizerApi.getPublishEligibility().catch(() => null),
    ]);
    setEvents(Array.isArray(eventsData) ? eventsData : []);
    setProfileDashboard(profileData);
    setOrganizationName((profileData?.organizationName ?? '').trim());
    setHeaderFullName((profileData?.fullName ?? '').trim());
    setHeaderProfileImg(resolveApiAssetUrl(profileData?.profileImg) || '');
    setVerificationStatus(
      (profileData?.verificationStatus ?? eligibilityData?.verificationStatus ?? '').trim().toLowerCase(),
    );
    setPublishEligibility(eligibilityData);
    return { eventsData, profileData, eligibilityData };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        await refresh();
      } catch (error) {
        console.error('Failed to load organizer dashboard data:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  }, [refresh]);

  return {
    events,
    organizationName,
    headerProfileImg,
    headerFullName,
    verificationStatus,
    publishEligibility,
    profileDashboard,
    loading,
    refreshing,
    refresh,
    onRefresh,
  };
}
