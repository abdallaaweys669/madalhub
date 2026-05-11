import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  LayoutAnimation,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  UIManager,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';

import apiClient from '@/api/client';
import { createOrganizerEvent, getEventInterests, patchOrganizerEvent, publishOrganizerEvent } from '@/api/events';
import { uploadEventCoverImage } from '@/api/eventAssets';
import { resolveApiAssetUrl } from '@/utils/mediaUrl';
import useAuth from '@/auth/useAuth';
import { styles as eventStyles } from '@/constants/eventDetails_styles/eventDetails.styles';

import WysiwygHeader from '@/components/createEvent/WysiwygHeader';
import WysiwygInfoCard from '@/components/createEvent/WysiwygInfoCard';
import WysiwygLocation from '@/components/createEvent/WysiwygLocation';
import CategoryFormatSheet from '@/components/createEvent/CategoryFormatSheet';
import VenueOnlineModal from '@/components/createEvent/VenueOnlineModal';
import WysiwygRoster from '@/components/createEvent/WysiwygRoster';
import SpeakerEditModal from '@/components/createEvent/SpeakerEditModal';
import WysiwygSponsors from '@/components/createEvent/WysiwygSponsors';
import TicketingCapacityModal from '@/components/createEvent/TicketingCapacityModal';
import CreateEventFloatingBar from '@/components/createEvent/CreateEventFloatingBar';

const EDU_SUBTYPES = [
  { key: 'seminar', label: 'Seminar' },
  { key: 'workshop', label: 'Workshop' },
  { key: 'talk', label: 'Talk' },
  { key: 'bootcamp', label: 'Bootcamp' },
];

const COMPACT_TEMPLATES = [
  { key: 'meetup', label: 'Meetup', icon: 'people-outline' },
  { key: 'education', label: 'Seminar / Talk', icon: 'school-outline' },
  { key: 'panel', label: 'Panel', icon: 'mic-outline' },
];

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

function resolveEventFormat(template, eduSubtype) {
  if (template === 'panel') return 'panel';
  if (template === 'meetup') return 'meetup';
  if (template === 'education') return eduSubtype || 'talk';
  return null;
}

function formatRelativeSaveTime(date) {
  if (!date || !Number.isFinite(date.getTime())) return 'Not saved yet';
  const mins = Math.floor((Date.now() - date.getTime()) / 60000);
  if (mins <= 0) return 'Saved just now';
  if (mins === 1) return 'Saved 1 minute ago';
  return `Saved ${mins} minutes ago`;
}

const sheetStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 22,
    backgroundColor: 'rgba(15, 23, 42, 0.52)',
  },
  card: {
    width: '100%',
    maxWidth: 368,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 22,
    paddingTop: 26,
    paddingBottom: 22,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 12,
    zIndex: 1,
  },
  iconCirclePublish: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#FFEDD5',
  },
  iconCircleSuccess: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  cardBody: {
    marginTop: 8,
    fontSize: 15,
    lineHeight: 22,
    color: '#64748B',
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  btnSecondary: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSecondaryText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#475569',
  },
  btnPrimary: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FF7A00',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimaryText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  btnSuccessFull: {
    width: '100%',
    height: 50,
    borderRadius: 12,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSuccessFullText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});

export default function CreateEventScreen() {
  const router = useRouter();
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
  const [template, setTemplate] = useState('meetup');
  const [eduSubtype, setEduSubtype] = useState(null);
  const [isInPerson, setIsInPerson] = useState(true);
  const [onlineLink, setOnlineLink] = useState('');
  const [locationPin, setLocationPin] = useState(null);
  const [ticketPaid, setTicketPaid] = useState(false);

  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setHours(d.getHours() + 1, 0, 0, 0);
    return d;
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setHours(d.getHours() + 2, 0, 0, 0);
    return d;
  });

  const [interests, setInterests] = useState([]);
  const [people, setPeople] = useState([]);
  const [sponsorRows, setSponsorRows] = useState([]);
  const [coverImagePath, setCoverImagePath] = useState(null);
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
  const [ticketModalOpen, setTicketModalOpen] = useState(false);
  const [personModalVisible, setPersonModalVisible] = useState(false);
  const [editingPersonKey, setEditingPersonKey] = useState(null);
  const [personSaving, setPersonSaving] = useState(false);
  const [draftPhotoPick, setDraftPhotoPick] = useState(null);
  const [draftPerson, setDraftPerson] = useState({ fullName: '', role: 'speaker', title: '', photoPath: null });
  const [publishConfirmOpen, setPublishConfirmOpen] = useState(false);
  const [publishSuccessOpen, setPublishSuccessOpen] = useState(false);
  const [publishSuccessKind, setPublishSuccessKind] = useState('published');
  const [sponsorNamePrompt, setSponsorNamePrompt] = useState(null);
  const [sponsorDraftName, setSponsorDraftName] = useState('');
  const [activeDatePicker, setActiveDatePicker] = useState(null);

  const categoryLabel = useMemo(() => interests.find((x) => String(x.id) === String(values.interestId))?.name || null, [interests, values.interestId]);
  const filteredCategories = useMemo(() => {
    const q = categorySearch.trim().toLowerCase();
    if (!q) return interests;
    return interests.filter((i) => String(i?.name || '').toLowerCase().includes(q));
  }, [interests, categorySearch]);

  const canPublish = useMemo(() => {
    return Boolean(
      values.title.trim() &&
        values.description.trim() &&
        values.interestId &&
        startDate.getTime() < endDate.getTime() &&
        (isInPerson ? values.locationName.trim() : onlineLink.trim()) &&
        (!ticketPaid || (Number(values.totalPrice) || 0) > 0),
    );
  }, [values, startDate, endDate, isInPerson, onlineLink, ticketPaid]);

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
        setTemplate(
          data.eventFormat === 'panel'
            ? 'panel'
            : data.eventFormat === 'meetup'
              ? 'meetup'
              : data.eventFormat
                ? 'education'
                : 'meetup',
        );
        setEduSubtype(['seminar', 'workshop', 'talk', 'bootcamp'].includes(data.eventFormat) ? data.eventFormat : null);
        setIsInPerson(!(data.isOnline === true && data.isHybrid !== true));
        setOnlineLink(data.onlineLink || '');
        const latitude = Number(data.location?.latitude ?? data.locationLatitude);
        const longitude = Number(data.location?.longitude ?? data.locationLongitude);
        setLocationPin(
          Number.isFinite(latitude) && Number.isFinite(longitude)
            ? { latitude, longitude }
            : null,
        );
        setCoverImagePath(data.image || data.coverImage || null);
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

  const buildPayload = useCallback((draft = false) => ({
    title: draft ? values.title.trim() || 'Untitled draft' : values.title.trim(),
    description: values.description.trim(),
    startDatetime: startDate.toISOString(),
    endDatetime: endDate.toISOString(),
    coverImage: coverImagePath || null,
    locationName: isInPerson ? values.locationName.trim() || 'Venue TBD' : 'Online',
    locationAddress: values.locationAddress || '',
    locationLatitude: isInPerson ? locationPin?.latitude ?? null : null,
    locationLongitude: isInPerson ? locationPin?.longitude ?? null : null,
    capacity: Number(values.capacity) || 0,
    totalPrice: ticketPaid ? Number(values.totalPrice) || 0 : 0,
    interestId: draft ? Number(values.interestId) || 1 : Number(values.interestId),
    isPhysical: isInPerson,
    eventFormat: resolveEventFormat(template, eduSubtype),
    isOnline: !isInPerson,
    isHybrid: false,
    onlineLink: !isInPerson ? onlineLink.trim() : undefined,
    sponsors: sponsorRows.filter((s) => s.name.trim()).map((s) => ({ name: s.name.trim(), ...(s.logoPath ? { logo: s.logoPath } : {}) })),
    roster: people.filter((p) => p.fullName.trim()).map((p, idx) => ({ role: p.role, displayName: p.fullName.trim(), title: p.title.trim() || null, sortOrder: idx, photoUrl: p.photoPath || null })),
  }), [values, startDate, endDate, coverImagePath, isInPerson, locationPin, ticketPaid, onlineLink, template, eduSubtype, sponsorRows, people]);

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
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.85 });
    if (result.canceled || !result.assets?.[0]) return;
    setCoverUploading(true);
    try {
      const path = await uploadEventCoverImage(result.assets[0]);
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setCoverImagePath(path);
    } finally {
      setCoverUploading(false);
    }
  };

  const openAddPerson = () => {
    setEditingPersonKey(null);
    setDraftPhotoPick(null);
    setDraftPerson({ fullName: '', role: template === 'panel' ? 'panelist' : 'speaker', title: '', photoPath: null });
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
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.85, allowsEditing: true, aspect: [1, 1] });
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
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.85, allowsEditing: true, aspect: [1, 1] });
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
            const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.85, allowsEditing: true, aspect: [1, 1] });
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
    if (!canPublish) return;
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
      Alert.alert('Error', e?.message || 'Publish failed');
    } finally {
      setLoading(false);
    }
  };

  const applyDatePart = (base, picked) => {
    const d = new Date(base);
    d.setFullYear(picked.getFullYear(), picked.getMonth(), picked.getDate());
    return d;
  };

  const applyTimePart = (base, picked) => {
    const d = new Date(base);
    d.setHours(picked.getHours(), picked.getMinutes(), 0, 0);
    return d;
  };

  const handleScheduleChange = (event, selectedDate) => {
    if (!activeDatePicker) return;
    if (Platform.OS === 'android' && event?.type !== 'set') {
      setActiveDatePicker(null);
      return;
    }
    if (!selectedDate) return;

    if (activeDatePicker === 'startDate') {
      setStartDate((prev) => applyDatePart(prev, selectedDate));
    } else if (activeDatePicker === 'startTime') {
      setStartDate((prev) => applyTimePart(prev, selectedDate));
    } else if (activeDatePicker === 'endDate') {
      setEndDate((prev) => applyDatePart(prev, selectedDate));
    } else if (activeDatePicker === 'endTime') {
      setEndDate((prev) => applyTimePart(prev, selectedDate));
    }

    if (Platform.OS === 'android') setActiveDatePicker(null);
  };

  if (fetchLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#FF7A00" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 150 }} bounces={false}>
          <WysiwygHeader coverPath={coverImagePath} title={values.title} onBack={() => router.back()} onPickCover={onPickCover} coverUploading={coverUploading} onOpenSettings={() => setCategorySheetOpen(true)} />
          <View style={eventStyles.contentContainer}>
            <WysiwygInfoCard
              title={values.title}
              description={values.description}
              datePrimary={startDate.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
              dateSecondary={`${startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })} - ${endDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`}
              categoryLabel={categoryLabel}
              formatLabel={resolveEventFormat(template, eduSubtype)}
              deliveryMode={isInPerson ? 'in-person' : 'online'}
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
              locationPrimary={isInPerson ? values.locationName : 'Online event'}
              locationSecondary={isInPerson ? values.locationAddress : onlineLink}
              hasMapPin={Boolean(locationPin)}
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
                  <View style={eventStyles.verifiedBadge}><Feather name="check" size={11} color="#fff" /></View>
                </View>
                <Text style={eventStyles.organizationCategory}>You are creating this event as organizer</Text>
              </View>
            </View>

            <WysiwygRoster roster={rosterForCard} template={template} onPressAdd={openAddPerson} onPressPerson={openEditPerson} />
            <WysiwygSponsors
              sponsors={sponsorRows.map((s) => ({ id: s.key, image: s.logoPath ? { uri: resolveApiAssetUrl(s.logoPath) } : null, name: s.name }))}
              onPressAddSponsor={addSponsor}
              onEditSponsor={editSponsorLogo}
              onRemoveSponsor={removeSponsor}
            />
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
        onPublish={() => (remoteStatus === 'published' ? runPublish() : setPublishConfirmOpen(true))}
        publishLabel={remoteStatus === 'published' ? 'Save Changes' : 'Publish Event'}
        loading={loading}
        disabledPublish={!canPublish && remoteStatus !== 'published'}
        bottomInset={insets.bottom}
      />

      <Modal visible={scheduleModalOpen} transparent animationType="slide" onRequestClose={() => setScheduleModalOpen(false)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(15,23,42,0.42)' }} onPress={() => setScheduleModalOpen(false)}>
          <Pressable onPress={(e) => e.stopPropagation()} style={{ marginTop: 'auto', backgroundColor: '#fff', borderTopLeftRadius: 18, borderTopRightRadius: 18, padding: 16 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 12 }}>Schedule</Text>
            <Text style={{ fontWeight: '600', color: '#374151', marginBottom: 6 }}>Start</Text>
            <Pressable onPress={() => setActiveDatePicker('startDate')} style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, padding: 10, marginBottom: 8 }}>
              <Text>{startDate.toLocaleDateString()}</Text>
            </Pressable>
            <Pressable onPress={() => setActiveDatePicker('startTime')} style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, padding: 10 }}>
              <Text>{startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</Text>
            </Pressable>
            <Text style={{ fontWeight: '600', color: '#374151', marginTop: 10, marginBottom: 6 }}>End</Text>
            <Pressable onPress={() => setActiveDatePicker('endDate')} style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, padding: 10, marginBottom: 8 }}>
              <Text>{endDate.toLocaleDateString()}</Text>
            </Pressable>
            <Pressable onPress={() => setActiveDatePicker('endTime')} style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, padding: 10 }}>
              <Text>{endDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</Text>
            </Pressable>

            {activeDatePicker ? (
              <DateTimePicker
                value={activeDatePicker.startsWith('start') ? startDate : endDate}
                mode={activeDatePicker.toLowerCase().includes('date') ? 'date' : 'time'}
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleScheduleChange}
              />
            ) : null}
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
        templates={COMPACT_TEMPLATES}
        selectedTemplate={template}
        onSelectTemplate={(next) => { setTemplate(next); if (next !== 'education') setEduSubtype(null); }}
        eduSubtypes={EDU_SUBTYPES}
        selectedEduSubtype={eduSubtype}
        onSelectEduSubtype={setEduSubtype}
        primary="#FF7A00"
        primarySoft="#FFF7ED"
      />

      <VenueOnlineModal
        visible={locationModalOpen}
        onClose={() => setLocationModalOpen(false)}
        isInPerson={isInPerson}
        onChangeIsInPerson={setIsInPerson}
        locationName={values.locationName}
        locationAddress={values.locationAddress}
        locationPin={locationPin}
        onlineLink={onlineLink}
        onChangeOnlineLink={setOnlineLink}
        onOpenMap={() => setMapModalOpen(true)}
        mapVisible={mapModalOpen}
        onCloseMap={() => setMapModalOpen(false)}
        onSelectLocation={(loc) => {
          setValues((p) => ({
            ...p,
            locationName: loc.locationName || p.locationName,
            locationAddress: loc.locationAddress || p.locationAddress,
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

      <Modal
        visible={publishConfirmOpen}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setPublishConfirmOpen(false)}
      >
        <View style={sheetStyles.overlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => !loading && setPublishConfirmOpen(false)}
            accessibilityLabel="Close"
          />
          <View style={sheetStyles.card}>
            <View style={{ alignItems: 'center', marginBottom: 14 }}>
              <View style={sheetStyles.iconCirclePublish}>
                <Ionicons name="rocket-outline" size={28} color="#EA580C" />
              </View>
              <Text style={sheetStyles.cardTitle}>Publish your event?</Text>
              <Text style={sheetStyles.cardBody}>
                Your listing goes live right away—attendees can discover it and register.
              </Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Pressable
                style={({ pressed }) => [sheetStyles.btnSecondary, pressed && { opacity: 0.85 }]}
                onPress={() => setPublishConfirmOpen(false)}
                disabled={loading}
              >
                <Text style={sheetStyles.btnSecondaryText}>Not yet</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [sheetStyles.btnPrimary, pressed && { opacity: 0.92 }]}
                onPress={runPublish}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={sheetStyles.btnPrimaryText}>Publish</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={publishSuccessOpen}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setPublishSuccessOpen(false)}
      >
        <View style={sheetStyles.overlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setPublishSuccessOpen(false)}
            accessibilityLabel="Close"
          />
          <View style={sheetStyles.card}>
            <View style={{ alignItems: 'center', marginBottom: 18 }}>
              <View style={sheetStyles.iconCircleSuccess}>
                <Ionicons name="checkmark-circle" size={36} color="#059669" />
              </View>
              <Text style={sheetStyles.cardTitle}>
                {publishSuccessKind === 'saved' ? 'Changes saved' : "You're live"}
              </Text>
              <Text style={sheetStyles.cardBody}>
                {publishSuccessKind === 'saved'
                  ? 'Updates are visible on your event page for everyone.'
                  : 'Your event is published and visible to attendees. Share it to fill the room.'}
              </Text>
            </View>
            <Pressable
              style={({ pressed }) => [sheetStyles.btnSuccessFull, pressed && { opacity: 0.92 }]}
              onPress={() => setPublishSuccessOpen(false)}
            >
              <Text style={sheetStyles.btnSuccessFullText}>Done</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

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
