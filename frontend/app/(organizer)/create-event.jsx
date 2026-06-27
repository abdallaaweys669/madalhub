import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  LayoutAnimation,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import useGuardedRouter from '@/hooks/useGuardedRouter';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';

import apiClient from '@/api/client';
import { createOrganizerEvent, getEventInterests, patchOrganizerEvent, publishOrganizerEvent } from '@/api/events';
import { uploadEventCoverImage } from '@/api/eventAssets';
import { resolveApiAssetUrl } from '@/utils/mediaUrl';
import useAuth from '@/auth/useAuth';
import { getPublishEligibility } from '@/api/organizer';
import { resolveOrganizerPublishGate } from '@/utils/organizerPublish';
import { formatEventDateLabel, formatEventTimeLabel } from '@/utils/formatEventSchedule';
import { EVENT_FORMAT_OPTIONS } from '@/constants/eventFormats';
import { styles as eventStyles } from '@/constants/eventDetails_styles/eventDetails.styles';

import WysiwygHeader from '@/components/createEvent/WysiwygHeader';
import WysiwygInfoCard from '@/components/createEvent/WysiwygInfoCard';
import WysiwygLocation from '@/components/createEvent/WysiwygLocation';
import CategoryFormatSheet from '@/components/createEvent/CategoryFormatSheet';
import VenueOnlineModal, { LOCATION_TBD_LABEL } from '@/components/createEvent/VenueOnlineModal';
import WysiwygRoster from '@/components/createEvent/WysiwygRoster';
import SpeakerEditModal from '@/components/createEvent/SpeakerEditModal';
import WysiwygSponsors from '@/components/createEvent/WysiwygSponsors';
import CreateEventFloatingBar from '@/components/createEvent/CreateEventFloatingBar';
import CreateEventSkeleton from '@/components/skeletons/CreateEventSkeleton';
import AppPopup from '@/components/common/AppPopup';
import VerificationBadgeWhite from '@/assets/verification badge white mode.svg';

import AudienceDropdown from '@/components/createEvent/AudienceDropdown';

function formatRelativeSaveTime(date) {
  if (!date || !Number.isFinite(date.getTime())) return 'Not saved yet';
  const mins = Math.floor((Date.now() - date.getTime()) / 60000);
  if (mins <= 0) return 'Saved just now';
  if (mins === 1) return 'Saved 1 minute ago';
  return `Saved ${mins} minutes ago`;
}

function getDefaultSchedule() {
  const start = new Date();
  start.setMinutes(0, 0, 0);
  start.setHours(start.getHours() + 1);
  const end = new Date(start);
  end.setHours(end.getHours() + 1);
  return { start, end };
}

function formatScheduleDateTime(date) {
  if (!(date instanceof Date) || !Number.isFinite(date.getTime())) return null;
  const day = date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  return `${day} · ${time}`;
}

function addHours(date, hours) {
  const next = new Date(date);
  next.setHours(next.getHours() + hours);
  return next;
}

function getPublishValidationIssues({
  values,
  startDate,
  endDate,
  locationMode,
  onlineLink,
  ticketPaid,
  eventFormat,
  people,
}) {
  const issues = [];
  const startTime = startDate?.getTime?.();
  const endTime = endDate?.getTime?.();

  if (!values.title.trim()) issues.push('Add a clear event title.');
  if (!values.description.trim()) issues.push('Add a short event description.');
  if (!values.interestId) issues.push('Choose the event category.');

  if (!Number.isFinite(startTime) || !Number.isFinite(endTime)) {
    issues.push('Choose when your event starts and ends.');
  } else {
    const oneMinuteAgo = Date.now() - 60 * 1000;
    if (startTime < oneMinuteAgo) {
      issues.push('Start date and time must be in the future.');
    }
    if (endTime <= startTime) {
      issues.push('End date and time must be after the start date and time.');
    }
  }

  if (locationMode === 'venue' && !values.locationName.trim()) {
    issues.push('Add a venue name or choose Location TBD.');
  }
  if (locationMode === 'online' && !onlineLink.trim()) {
    issues.push('Add the online event link.');
  }
  if (ticketPaid && (Number(values.totalPrice) || 0) <= 0) {
    issues.push('Add a ticket price greater than 0 for paid events.');
  }

  if (eventFormat === 'panel') {
    const panelists = people.filter((p) => p.role === 'panelist' && p.fullName?.trim());
    const moderators = people.filter((p) => p.role === 'moderator' && p.fullName?.trim());
    if (panelists.length < 2) issues.push('Panel events need at least 2 panelists.');
    if (moderators.length < 1) issues.push('Panel events need at least 1 moderator.');
  }

  return issues;
}

export default function CreateEventScreen() {
  const router = useGuardedRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const params = useLocalSearchParams();
  const routeEventId = params.eventId != null ? String(params.eventId) : null;

  const [localEventId, setLocalEventId] = useState(null);
  const effectiveEventId = routeEventId || localEventId;

  const [values, setValues] = useState({
    title: '',
    description: '',
    locationName: '',
    locationAddress: '',
    capacity: '0',
    totalPrice: '0',
    interestId: '',
  });
  const [eventFormat, setEventFormat] = useState('meetup');
  const [locationMode, setLocationMode] = useState('venue');
  const handleLocationModeChange = (mode) => {
    setLocationMode(mode);
    if (mode === 'tbd') {
      setLocationPin(null);
      setValues((p) => ({
        ...p,
        locationName: LOCATION_TBD_LABEL,
        locationAddress: '',
      }));
    } else if (mode === 'online') {
      setLocationPin(null);
    } else if (mode === 'venue' && values.locationName === LOCATION_TBD_LABEL) {
      setValues((p) => ({ ...p, locationName: '', locationAddress: '' }));
    }
  };
  const [onlineLink, setOnlineLink] = useState('');
  const [locationPin, setLocationPin] = useState(null);
  const [ticketPaid, setTicketPaid] = useState(false);
  const [audienceGender, setAudienceGender] = useState('all');
  const [enableWaitlist, setEnableWaitlist] = useState(false);

  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  const [interests, setInterests] = useState([]);
  const [people, setPeople] = useState([]);
  const [sponsorRows, setSponsorRows] = useState([]);
  const [coverImagePath, setCoverImagePath] = useState(null);
  const [coverPreviewUri, setCoverPreviewUri] = useState(null);
  const [coverUploading, setCoverUploading] = useState(false);

  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(Boolean(routeEventId));
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [remoteStatus, setRemoteStatus] = useState(null);

  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [categorySheetOpen, setCategorySheetOpen] = useState(false);
  const [sheetMode, setSheetMode] = useState('category');
  const [categorySearch, setCategorySearch] = useState('');
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [mapModalOpen, setMapModalOpen] = useState(false);
  const [personModalVisible, setPersonModalVisible] = useState(false);
  const [editingPersonKey, setEditingPersonKey] = useState(null);
  const [personSaving, setPersonSaving] = useState(false);
  const [draftPhotoPick, setDraftPhotoPick] = useState(null);
  const [draftPerson, setDraftPerson] = useState({ fullName: '', role: 'speaker', title: '', photoPath: null });
  const [publishConfirmOpen, setPublishConfirmOpen] = useState(false);
  const [publishSuccessOpen, setPublishSuccessOpen] = useState(false);
  const [publishWarningOpen, setPublishWarningOpen] = useState(false);
  const [publishErrorMessage, setPublishErrorMessage] = useState('');
  const [publishSuccessKind, setPublishSuccessKind] = useState('published');
  const [sponsorNamePrompt, setSponsorNamePrompt] = useState(null);
  const [sponsorDraftName, setSponsorDraftName] = useState('');
  const [activeScheduleField, setActiveScheduleField] = useState(null);
  const [androidPickerStep, setAndroidPickerStep] = useState(null);

  const categoryLabel = useMemo(() => interests.find((x) => String(x.id) === String(values.interestId))?.name || null, [interests, values.interestId]);
  const filteredCategories = useMemo(() => {
    const q = categorySearch.trim().toLowerCase();
    if (!q) return interests;
    return interests.filter((i) => String(i?.name || '').toLowerCase().includes(q));
  }, [interests, categorySearch]);

  const publishValidationIssues = useMemo(
    () =>
      getPublishValidationIssues({
        values,
        startDate,
        endDate,
        locationMode,
        onlineLink,
        ticketPaid,
        eventFormat,
        people,
      }),
    [values, startDate, endDate, locationMode, onlineLink, ticketPaid, eventFormat, people],
  );

  const canPublish = publishValidationIssues.length === 0;

  const rosterForCard = useMemo(
    () => people.filter((p) => p.fullName.trim()).map((p) => ({ id: p.key, displayName: p.fullName, role: p.role, title: p.title, photoUrl: p.photoPath || null })),
    [people],
  );
  const sponsorLogos = useMemo(
    () => sponsorRows.filter((s) => s.logoPath).map((s) => ({ id: s.key, image: { uri: resolveApiAssetUrl(s.logoPath) } })),
    [sponsorRows],
  );

  useEffect(() => {
    (async () => {
      try {
        const list = await getEventInterests();
        setInterests(Array.isArray(list) ? list : []);
      } catch {
        setInterests([]);
      }
    })();
  }, []);

  useEffect(() => {
    if (!routeEventId) return;
    (async () => {
      try {
        const { data } = await apiClient.get(`/events/${routeEventId}`);
        setValues({
          title: data.title || '',
          description: data.description || '',
          locationName: data.location?.name || '',
          locationAddress: data.location?.address || '',
          capacity: String(data.capacity ?? '0'),
          totalPrice: String(data.price ?? data.totalPrice ?? 0),
          interestId: String(data.interestId || ''),
        });
        setEventFormat(String(data.eventFormat || 'meetup').toLowerCase());
        const latitude = Number(data.location?.latitude ?? data.locationLatitude);
        const longitude = Number(data.location?.longitude ?? data.locationLongitude);
        const hasPin = Number.isFinite(latitude) && Number.isFinite(longitude);
        const locationLabel = String(data.location?.name || '').trim();
        const isTbdLocation = ['to be announced', 'venue tbd'].includes(locationLabel.toLowerCase());

        if (data.isOnline === true && data.isHybrid !== true) {
          setLocationMode('online');
        } else if (isTbdLocation && !hasPin) {
          setLocationMode('tbd');
        } else {
          setLocationMode('venue');
        }

        setOnlineLink(data.onlineLink || '');
        setLocationPin(hasPin ? { latitude, longitude } : null);
        const loadedCoverPath = data.image || data.coverImage || null;
        setCoverImagePath(loadedCoverPath);
        setCoverPreviewUri(resolveApiAssetUrl(loadedCoverPath) || null);
        setAudienceGender(['all', 'female', 'male'].includes(data.audienceGender) ? data.audienceGender : 'all');
        setRemoteStatus(data.status ?? null);
        setTicketPaid(Number(data.price ?? data.totalPrice ?? 0) > 0);
        setPeople(Array.isArray(data.roster) ? data.roster.map((r, i) => ({ key: `r-${r.id ?? i}`, fullName: r.displayName || '', role: r.role || 'speaker', title: r.title || '', photoPath: r.photoUrl || null })) : []);
        setSponsorRows(Array.isArray(data.sponsors) ? data.sponsors.map((s, i) => ({ key: `s-${s.id ?? i}`, name: s.name || '', logoPath: s.logo || null })) : []);
        if (data.startsAt || data.startDatetime) setStartDate(new Date(data.startsAt ?? data.startDatetime));
        if (data.endsAt || data.endDatetime) setEndDate(new Date(data.endsAt ?? data.endDatetime));
      } catch {
        Alert.alert('Error', 'Failed to load event details');
      } finally {
        setFetchLoading(false);
      }
    })();
  }, [routeEventId]);

  const buildPayload = useCallback((draft = false) => {
    const schedule =
      startDate && endDate
        ? { start: startDate, end: endDate }
        : getDefaultSchedule();

    return {
    title: draft ? values.title.trim() || 'Untitled draft' : values.title.trim(),
    description: values.description.trim(),
    startDatetime: schedule.start.toISOString(),
    endDatetime: schedule.end.toISOString(),
    coverImage: coverImagePath || null,
    locationName:
      locationMode === 'online'
        ? 'Online'
        : locationMode === 'tbd'
          ? LOCATION_TBD_LABEL
          : values.locationName.trim() || 'Venue TBD',
    locationAddress: locationMode === 'venue' ? values.locationAddress.trim() : '',
    locationLatitude: locationMode === 'venue' ? locationPin?.latitude ?? null : null,
    locationLongitude: locationMode === 'venue' ? locationPin?.longitude ?? null : null,
    capacity: Number(values.capacity) || 0,
    totalPrice: ticketPaid ? Number(values.totalPrice) || 0 : 0,
    interestId: draft ? Number(values.interestId) || 1 : Number(values.interestId),
    isPhysical: locationMode !== 'online',
    eventFormat,
    isOnline: locationMode === 'online',
    isHybrid: false,
    onlineLink: locationMode === 'online' ? onlineLink.trim() : undefined,
    audienceGender,
    sponsors: sponsorRows.filter((s) => s.name.trim()).map((s) => ({ name: s.name.trim(), ...(s.logoPath ? { logo: s.logoPath } : {}) })),
    roster: people.filter((p) => p.fullName.trim()).map((p, idx) => ({ role: p.role, displayName: p.fullName.trim(), title: p.title.trim() || null, sortOrder: idx, photoUrl: p.photoPath || null })),
  };
  }, [values, startDate, endDate, coverImagePath, locationMode, locationPin, ticketPaid, onlineLink, audienceGender, eventFormat, sponsorRows, people]);

  const saveDraft = async () => {
    if (effectiveEventId) await patchOrganizerEvent(effectiveEventId, buildPayload(true));
    else {
      const created = await createOrganizerEvent(buildPayload(true));
      const id = created?.id != null ? String(created.id) : null;
      if (id) setLocalEventId(id);
    }
    setLastSavedAt(new Date());
  };

  const onSaveDraftPress = async () => {
    setLoading(true);
    try {
      await saveDraft();
    } catch (error) {
      Alert.alert('Save failed', error?.message || 'Could not save draft');
    } finally {
      setLoading(false);
    }
  };

  const onPickCover = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      quality: 0.85,
      allowsEditing: true,
      aspect: [16, 9],
    });
    if (result.canceled || !result.assets?.[0]) return;

    const picked = result.assets[0];
    setCoverPreviewUri(picked.uri);
    setCoverUploading(true);

    try {
      const path = await uploadEventCoverImage(picked);
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setCoverImagePath(path);
    } catch (error) {
      Alert.alert('Upload failed', error?.message || 'Could not upload cover image. Your preview is kept — try again or save draft later.');
    } finally {
      setCoverUploading(false);
    }
  };

  const openAddPerson = () => {
    setEditingPersonKey(null);
    setDraftPhotoPick(null);
    setDraftPerson({ fullName: '', role: eventFormat === 'panel' ? 'panelist' : 'speaker', title: '', photoPath: null });
    setPersonModalVisible(true);
  };

  const openEditPerson = (row) => {
    const person = people.find((p) => p.key === row.id);
    if (!person) return;
    setEditingPersonKey(person.key);
    setDraftPhotoPick(null);
    setDraftPerson({ fullName: person.fullName || '', role: person.role || 'speaker', title: person.title || '', photoPath: person.photoPath || null });
    setPersonModalVisible(true);
  };

  const pickDraftPersonPhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: 'images', quality: 0.85, allowsEditing: true, aspect: [1, 1] });
    if (!result.canceled && result.assets?.[0]) setDraftPhotoPick(result.assets[0]);
  };

  const savePersonFromModal = async () => {
    if (!draftPerson.fullName.trim()) return Alert.alert('Error', 'Please enter a name.');
    setPersonSaving(true);
    try {
      let photoPath = draftPerson.photoPath || null;
      if (draftPhotoPick) photoPath = await uploadEventCoverImage(draftPhotoPick);
      const row = { fullName: draftPerson.fullName.trim(), role: draftPerson.role, title: draftPerson.title.trim(), photoPath: photoPath || null };
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      if (editingPersonKey) setPeople((prev) => prev.map((p) => (p.key === editingPersonKey ? { ...p, ...row } : p)));
      else setPeople((prev) => [...prev, { key: `np-${Date.now()}`, ...row }]);
      setPersonModalVisible(false);
    } catch (e) {
      Alert.alert('Upload failed', e?.message || 'Could not upload photo.');
    } finally {
      setPersonSaving(false);
    }
  };

  const removeEditingPerson = () => {
    if (!editingPersonKey) return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setPeople((prev) => prev.filter((p) => p.key !== editingPersonKey));
    setPersonModalVisible(false);
  };

  const addSponsor = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: 'images', quality: 0.85, allowsEditing: true, aspect: [1, 1] });
    if (!result.canceled && result.assets?.[0]) {
      setSponsorDraftName('');
      setSponsorNamePrompt({ asset: result.assets[0] });
    }
  };

  const editSponsorLogo = (sponsorId) => {
    Alert.alert(
      'Edit Sponsor',
      'Choose an action for this sponsor',
      [
        {
          text: 'Update Logo',
          onPress: async () => {
            const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!perm.granted) return;
            const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: 'images', quality: 0.85, allowsEditing: true, aspect: [1, 1] });
            if (result.canceled || !result.assets?.[0]) return;
            const path = await uploadEventCoverImage(result.assets[0]);
            setSponsorRows((prev) => prev.map((s) => (s.key === sponsorId ? { ...s, logoPath: path } : s)));
          }
        },
        {
          text: 'Remove Sponsor',
          style: 'destructive',
          onPress: () => removeSponsor(sponsorId)
        },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const removeSponsor = (sponsorId) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSponsorRows((prev) => prev.filter((s) => s.key !== sponsorId));
  };

  const confirmSponsorAdd = async () => {
    if (!sponsorNamePrompt?.asset || !sponsorDraftName.trim()) return;
    const path = await uploadEventCoverImage(sponsorNamePrompt.asset);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSponsorRows((prev) => [...prev, { key: `sp-${Date.now()}`, name: sponsorDraftName.trim(), logoPath: path }]);
    setSponsorNamePrompt(null);
    setSponsorDraftName('');
  };

  const runPublish = async () => {
    if (!canPublish) {
      setPublishWarningOpen(true);
      return;
    }
    const wasAlreadyPublished = remoteStatus === 'published';
    setLoading(true);
    try {
      let id = effectiveEventId;
      if (!id) {
        const created = await createOrganizerEvent(buildPayload(true));
        id = created?.id != null ? String(created.id) : null;
        if (id) setLocalEventId(id);
      }
      if (id) {
        await patchOrganizerEvent(id, buildPayload(false));
        if (!wasAlreadyPublished) await publishOrganizerEvent(id);
      }
      setPublishConfirmOpen(false);
      if (!wasAlreadyPublished) setRemoteStatus('published');
      setPublishSuccessKind(wasAlreadyPublished ? 'saved' : 'published');
      setPublishSuccessOpen(true);
    } catch (e) {
      setPublishConfirmOpen(false);
      setPublishErrorMessage(e?.message || 'Publish failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onPublishPress = async () => {
    if (!canPublish) {
      setPublishWarningOpen(true);
      return;
    }
    if (remoteStatus === 'published') {
      runPublish();
      return;
    }
    try {
      const eligibility = await getPublishEligibility();
      const canProceed = await resolveOrganizerPublishGate(router, eligibility, {
        eventId: effectiveEventId,
        eventTitle: values.title,
      });
      if (!canProceed) return;
      setPublishConfirmOpen(true);
    } catch (e) {
      setPublishErrorMessage(e?.message || 'Could not check publish eligibility.');
    }
  };

  const applyDatePart = (base, picked, role = 'start') => {
    const fallback = role === 'end' ? getDefaultSchedule().end : getDefaultSchedule().start;
    const d = base ? new Date(base) : new Date(fallback);
    d.setFullYear(picked.getFullYear(), picked.getMonth(), picked.getDate());
    return d;
  };

  const applyTimePart = (base, picked, role = 'start') => {
    const fallback = role === 'end' ? getDefaultSchedule().end : getDefaultSchedule().start;
    const d = base ? new Date(base) : new Date(fallback);
    d.setHours(picked.getHours(), picked.getMinutes(), 0, 0);
    return d;
  };

  const closeSchedulePicker = () => {
    setActiveScheduleField(null);
    setAndroidPickerStep(null);
  };

  const openSchedulePicker = (field) => {
    setActiveScheduleField(field);
    if (Platform.OS === 'android') setAndroidPickerStep('date');
  };

  const handleScheduleChange = (event, selectedDate) => {
    if (!activeScheduleField) return;
    if (Platform.OS === 'android' && event?.type !== 'set') {
      closeSchedulePicker();
      return;
    }
    if (!selectedDate) return;

    if (Platform.OS === 'ios') {
      if (activeScheduleField === 'start') {
        setStartDate(selectedDate);
        setEndDate((prev) => {
          if (!prev || prev.getTime() <= selectedDate.getTime()) {
            return addHours(selectedDate, 1);
          }
          return prev;
        });
      } else {
        setEndDate(selectedDate);
      }
      return;
    }

    if (androidPickerStep === 'date') {
      if (activeScheduleField === 'start') {
        setStartDate((prev) => applyDatePart(prev, selectedDate, 'start'));
      } else {
        setEndDate((prev) => applyDatePart(prev, selectedDate, 'end'));
      }
      setAndroidPickerStep('time');
      return;
    }

    if (activeScheduleField === 'start') {
      setStartDate((prev) => {
        const nextStart = applyTimePart(prev, selectedDate, 'start');
        setEndDate((endPrev) => {
          if (!endPrev || endPrev.getTime() <= nextStart.getTime()) {
            return addHours(nextStart, 1);
          }
          return endPrev;
        });
        return nextStart;
      });
    } else {
      setEndDate((prev) => applyTimePart(prev, selectedDate, 'end'));
    }
    closeSchedulePicker();
  };

  if (fetchLoading) {
    return <CreateEventSkeleton />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <WysiwygHeader
        coverPath={coverImagePath}
        coverPreviewUri={coverPreviewUri}
        onBack={() => router.back()}
        onPickCover={onPickCover}
        coverUploading={coverUploading}
      />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          automaticallyAdjustKeyboardInsets
          nestedScrollEnabled
          contentContainerStyle={{ paddingBottom: insets.bottom + 150 }}
          bounces={false}
        >
          <View style={eventStyles.contentContainer}>
            <WysiwygInfoCard
              title={values.title}
              description={values.description}
              datePrimary={
                startDate
                  ? formatEventDateLabel(startDate, endDate)
                  : 'Tap to set date'
              }
              dateSecondary={
                startDate && endDate
                  ? formatEventTimeLabel(startDate, endDate)
                  : 'Choose start and end time'
              }
              categoryLabel={categoryLabel}
              formatLabel={eventFormat}
              deliveryMode={locationMode === 'online' ? 'online' : 'in-person'}
              onChangeTitle={(v) => setValues((p) => ({ ...p, title: v }))}
              onChangeDescription={(v) => setValues((p) => ({ ...p, description: v }))}
              onPressEditDate={() => setScheduleModalOpen(true)}
              onPressCategory={() => {
                setSheetMode('category');
                setCategorySheetOpen(true);
              }}
              onPressFormat={() => {
                setSheetMode('format');
                setCategorySheetOpen(true);
              }}
              onPressDeliveryMode={() => setLocationModalOpen(true)}
            />

            <WysiwygLocation
              locationPrimary={
                locationMode === 'online'
                  ? 'Online event'
                  : locationMode === 'tbd'
                    ? LOCATION_TBD_LABEL
                    : values.locationName || 'Tap to set venue'
              }
              locationSecondary={
                locationMode === 'online'
                  ? onlineLink || 'Add meeting link'
                  : locationMode === 'tbd'
                    ? 'Organizer will share location before the event'
                    : values.locationAddress || (locationPin ? 'Map pin saved for directions' : 'Type venue or add map pin (optional)')
              }
              hasMapPin={locationMode === 'venue' && Boolean(locationPin)}
              onPress={() => setLocationModalOpen(true)}
            />

            <Text style={eventStyles.sectionTitle}>Organized by</Text>
            <View style={eventStyles.organizationCard}>
              <View style={[eventStyles.organizationLogo, eventStyles.organizationLogoFallback]}>
                <Text style={eventStyles.organizationLogoFallbackText}>{String(user?.fullName || 'OR').slice(0, 2).toUpperCase()}</Text>
              </View>
              <View style={eventStyles.organizationTextWrap}>
                <View style={eventStyles.organizationNameRow}>
                  <Text style={eventStyles.organizationName}>{user?.fullName || 'Organizer'}</Text>
                  <VerificationBadgeWhite width={18} height={18} style={{ marginLeft: 4 }} />
                </View>
                <Text style={eventStyles.organizationCategory}>You are creating this event as organizer</Text>
              </View>
            </View>

            <WysiwygRoster roster={rosterForCard} eventFormat={eventFormat} onPressAdd={openAddPerson} onPressPerson={openEditPerson} />
            <WysiwygSponsors
              sponsors={sponsorRows.map((s) => ({ id: s.key, image: s.logoPath ? { uri: resolveApiAssetUrl(s.logoPath) } : null, name: s.name }))}
              onPressAddSponsor={addSponsor}
              onEditSponsor={editSponsorLogo}
              onRemoveSponsor={removeSponsor}
            />
            <AudienceDropdown value={audienceGender} onChange={setAudienceGender} />
            <View style={{ marginTop: 24 }}>
              <Text style={eventStyles.sectionTitle}>Waitlist</Text>
              <Pressable
                onPress={() => setEnableWaitlist((v) => !v)}
                style={{
                  marginTop: 10,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: enableWaitlist ? '#FF7A00' : '#E5E7EB',
                  backgroundColor: enableWaitlist ? '#FFF7ED' : '#FAFAFA',
                  paddingHorizontal: 14,
                  paddingVertical: 13,
                }}
              >
                <View style={{ flex: 1, paddingRight: 12 }}>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: '#111827' }}>Enable waitlist</Text>
                  <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 4, lineHeight: 17 }}>
                    Auto-fill spots when someone cancels a full event.
                  </Text>
                </View>
                <View
                  style={{
                    width: 48,
                    height: 28,
                    borderRadius: 14,
                    backgroundColor: enableWaitlist ? '#FF7A00' : '#D1D5DB',
                    justifyContent: 'center',
                    paddingHorizontal: 3,
                  }}
                >
                  <View
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 11,
                      backgroundColor: '#fff',
                      alignSelf: enableWaitlist ? 'flex-end' : 'flex-start',
                    }}
                  />
                </View>
              </Pressable>
            </View>
            <View style={{ marginTop: 24 }}>
              <Text style={eventStyles.sectionTitle}>Ticketing & Capacity</Text>
              <View style={{ backgroundColor: '#F9FAFB', borderRadius: 14, borderWidth: 1, borderColor: '#E5E7EB', padding: 14, gap: 14 }}>
                <View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 6 }}>
                    <Feather name="tag" size={14} color="#6B7280" />
                    <Text style={{ fontSize: 13, color: '#6B7280', fontWeight: '600' }}>TICKET TYPE</Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <Pressable
                      onPress={() => setTicketPaid(false)}
                      style={{ flex: 1, borderRadius: 10, borderWidth: 1, borderColor: !ticketPaid ? '#FF7A00' : '#E5E7EB', backgroundColor: !ticketPaid ? '#FFF7ED' : '#fff', paddingVertical: 10, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 }}
                    >
                      <Feather name="gift" size={16} color={!ticketPaid ? '#EA580C' : '#374151'} />
                      <Text style={{ fontWeight: '700', color: !ticketPaid ? '#EA580C' : '#374151' }}>Free</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => setTicketPaid(true)}
                      style={{ flex: 1, borderRadius: 10, borderWidth: 1, borderColor: ticketPaid ? '#FF7A00' : '#E5E7EB', backgroundColor: ticketPaid ? '#FFF7ED' : '#fff', paddingVertical: 10, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 }}
                    >
                      <Feather name="credit-card" size={16} color={ticketPaid ? '#EA580C' : '#374151'} />
                      <Text style={{ fontWeight: '700', color: ticketPaid ? '#EA580C' : '#374151' }}>Paid</Text>
                    </Pressable>
                  </View>
                </View>

                {ticketPaid ? (
                  <View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 6 }}>
                      <Feather name="dollar-sign" size={14} color="#6B7280" />
                      <Text style={{ fontSize: 13, color: '#6B7280', fontWeight: '600' }}>TICKET PRICE</Text>
                    </View>
                    <TextInput
                      value={values.totalPrice}
                      onChangeText={(v) => setValues((p) => ({ ...p, totalPrice: v.replace(/[^\d.]/g, '') }))}
                      placeholder="$ 0.00"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="decimal-pad"
                      style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 }}
                    />
                  </View>
                ) : null}

                <View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 6 }}>
                    <Feather name="users" size={14} color="#6B7280" />
                    <Text style={{ fontSize: 13, color: '#6B7280', fontWeight: '600' }}>CAPACITY</Text>
                  </View>
                  <TextInput
                    value={values.capacity}
                    onChangeText={(v) => setValues((p) => ({ ...p, capacity: v.replace(/[^\d]/g, '') }))}
                    placeholder="0 means Unlimited"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="number-pad"
                    style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 }}
                  />
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <CreateEventFloatingBar
        lastSavedText={formatRelativeSaveTime(lastSavedAt)}
        onSaveDraft={onSaveDraftPress}
        onPublish={onPublishPress}
        publishLabel={remoteStatus === 'published' ? 'Save Changes' : 'Publish Event'}
        loading={loading}
        disabledPublish={!canPublish && remoteStatus !== 'published'}
        bottomInset={insets.bottom}
      />

      <Modal
        visible={scheduleModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => {
          closeSchedulePicker();
          setScheduleModalOpen(false);
        }}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(15,23,42,0.42)' }}
          onPress={() => {
            closeSchedulePicker();
            setScheduleModalOpen(false);
          }}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{
              marginTop: 'auto',
              backgroundColor: '#fff',
              borderTopLeftRadius: 18,
              borderTopRightRadius: 18,
              padding: 16,
              paddingBottom: insets.bottom + 16,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 4 }}>Schedule</Text>
            <Text style={{ color: '#6B7280', marginBottom: 16 }}>
              Set when your event starts and ends.
            </Text>

            <Text style={{ fontWeight: '600', color: '#374151', marginBottom: 6 }}>Starts</Text>
            <Pressable
              onPress={() => openSchedulePicker('start')}
              style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, padding: 12, marginBottom: 14 }}
            >
              <Text style={{ color: startDate ? '#111827' : '#9CA3AF' }}>
                {formatScheduleDateTime(startDate) || 'Tap to set start'}
              </Text>
            </Pressable>

            <Text style={{ fontWeight: '600', color: '#374151', marginBottom: 6 }}>Ends</Text>
            <Pressable
              onPress={() => openSchedulePicker('end')}
              style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, padding: 12, marginBottom: 14 }}
            >
              <Text style={{ color: endDate ? '#111827' : '#9CA3AF' }}>
                {formatScheduleDateTime(endDate) || 'Tap to set end'}
              </Text>
            </Pressable>

            {activeScheduleField ? (
              <DateTimePicker
                value={
                  activeScheduleField === 'start'
                    ? startDate || getDefaultSchedule().start
                    : endDate || startDate || getDefaultSchedule().end
                }
                mode={Platform.OS === 'ios' ? 'datetime' : androidPickerStep || 'date'}
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleScheduleChange}
              />
            ) : null}

            <Pressable
              onPress={() => {
                closeSchedulePicker();
                setScheduleModalOpen(false);
              }}
              style={{
                marginTop: 8,
                backgroundColor: '#FF7A00',
                borderRadius: 12,
                paddingVertical: 14,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Done</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <CategoryFormatSheet
        visible={categorySheetOpen}
        mode={sheetMode}
        onClose={() => setCategorySheetOpen(false)}
        categories={filteredCategories}
        categorySearch={categorySearch}
        onChangeCategorySearch={setCategorySearch}
        selectedCategoryId={values.interestId}
        onSelectCategory={(item) => setValues((p) => ({ ...p, interestId: String(item.id) }))}
        eventFormats={EVENT_FORMAT_OPTIONS}
        selectedEventFormat={eventFormat}
        onSelectEventFormat={setEventFormat}
        primary="#FF7A00"
        primarySoft="#FFF7ED"
      />

      <VenueOnlineModal
        visible={locationModalOpen}
        onClose={() => setLocationModalOpen(false)}
        locationMode={locationMode}
        onChangeLocationMode={handleLocationModeChange}
        locationName={values.locationName}
        locationAddress={values.locationAddress}
        onChangeLocationName={(text) => setValues((p) => ({ ...p, locationName: text }))}
        onChangeLocationAddress={(text) => setValues((p) => ({ ...p, locationAddress: text }))}
        locationPin={locationPin}
        onlineLink={onlineLink}
        onChangeOnlineLink={setOnlineLink}
        onOpenMap={() => setMapModalOpen(true)}
        mapVisible={mapModalOpen}
        onCloseMap={() => setMapModalOpen(false)}
        onSelectLocation={(loc) => {
          setValues((p) => ({
            ...p,
            locationName: loc.locationName || loc.name || p.locationName,
            locationAddress: loc.locationAddress || loc.address || p.locationAddress,
          }));
          if (Number.isFinite(Number(loc.latitude)) && Number.isFinite(Number(loc.longitude))) {
            setLocationPin({ latitude: Number(loc.latitude), longitude: Number(loc.longitude) });
          }
        }}
      />

      <SpeakerEditModal
        visible={personModalVisible}
        onClose={() => setPersonModalVisible(false)}
        personSaving={personSaving}
        editingPersonKey={editingPersonKey}
        draftPerson={draftPerson}
        setDraftPerson={setDraftPerson}
        draftPhotoPick={draftPhotoPick}
        onPickPhoto={pickDraftPersonPhoto}
        onRemovePhoto={() => { setDraftPhotoPick(null); setDraftPerson((d) => ({ ...d, photoPath: null })); }}
        onSave={savePersonFromModal}
        onDelete={removeEditingPerson}
      />

      <AppPopup
        visible={publishWarningOpen}
        variant="warning"
        title="Before you publish"
        message="Please fix these details so attendees see the correct event information."
        details={publishValidationIssues}
        primaryLabel="Got it"
        onPrimary={() => setPublishWarningOpen(false)}
      />

      <AppPopup
        visible={publishConfirmOpen}
        variant="warning"
        title="Publish your event?"
        message="Your listing goes live right away. Attendees can discover it and register."
        primaryLabel="Publish"
        secondaryLabel="Not yet"
        loading={loading}
        onPrimary={runPublish}
        onSecondary={() => setPublishConfirmOpen(false)}
        onClose={() => !loading && setPublishConfirmOpen(false)}
      />

      <AppPopup
        visible={publishSuccessOpen}
        variant="success"
        title={publishSuccessKind === 'saved' ? 'Changes saved' : "You're live"}
        message={
          publishSuccessKind === 'saved'
            ? 'Updates are visible on your event page for everyone.'
            : 'Your event is published and visible to attendees. Share it to fill the room.'
        }
        primaryLabel="Done"
        onPrimary={() => setPublishSuccessOpen(false)}
      />

      <AppPopup
        visible={Boolean(publishErrorMessage)}
        variant="error"
        title="Publish failed"
        message={publishErrorMessage}
        primaryLabel="Try again"
        secondaryLabel="Close"
        onPrimary={() => {
          setPublishErrorMessage('');
          runPublish();
        }}
        onSecondary={() => setPublishErrorMessage('')}
        onClose={() => setPublishErrorMessage('')}
      />

      <Modal visible={!!sponsorNamePrompt} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 16, width: '84%', padding: 18 }}>
            <Text style={{ fontSize: 17, fontWeight: '700', marginBottom: 10 }}>Sponsor name</Text>
            <TextInput value={sponsorDraftName} onChangeText={setSponsorDraftName} placeholder="Company name" style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 11 }} />
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
              <Pressable style={{ flex: 1, paddingVertical: 11, borderRadius: 10, backgroundColor: '#F3F4F6', alignItems: 'center' }} onPress={() => { setSponsorNamePrompt(null); setSponsorDraftName(''); }}>
                <Text style={{ fontWeight: '700', color: '#374151' }}>Cancel</Text>
              </Pressable>
              <Pressable style={{ flex: 1, paddingVertical: 11, borderRadius: 10, backgroundColor: '#FF7A00', alignItems: 'center' }} onPress={confirmSponsorAdd}>
                <Text style={{ fontWeight: '700', color: '#fff' }}>Add</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
