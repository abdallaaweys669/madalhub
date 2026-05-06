import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ActivityIndicator,
  Alert,
  Switch,
  Modal,
  Animated,
  Easing,
  StyleSheet,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import apiClient from '@/api/client';
import {
  createOrganizerEvent,
  patchOrganizerEvent,
  publishOrganizerEvent,
  getEventInterests,
} from '@/api/events';
import { uploadEventCoverImage } from '@/api/eventAssets';
import TextField from '@/features/auth/components/TextField';
import { COLORS } from '@/theme/colors';
import { useThemeColors } from '@/theme';
import { resolveApiAssetUrl } from '@/utils/mediaUrl';
import LivePreviewCard from '@/components/createEvent/LivePreviewCard';
import CollapsibleSection from '@/components/createEvent/CollapsibleSection';

const META_SEPARATOR = '\n---\n[KULAN_EVENT_META]\n';
const META_END = '\n[/KULAN_EVENT_META]';

const SPEC_CATEGORY_LABELS = [
  'Tech',
  'Business',
  'Design',
  'Arts',
  'Community',
  'Education',
  'Health',
  'Sports',
];

const EVENT_TYPES = [
  { key: 'talk', label: 'Talk' },
  { key: 'panel', label: 'Panel' },
  { key: 'hybrid', label: 'Hybrid' },
  { key: 'meetup', label: 'Meetup' },
];

const EVENT_TYPE_HINTS = {
  talk: 'Talk: requires at least 1 speaker in People',
  panel: 'Panel: need 2+ panelists and 1+ moderator',
  hybrid: 'Hybrid: need 1+ speaker and 2+ panelists',
  meetup: 'Meetup: no speaker requirements',
};

const PEOPLE_BANNER = {
  talk: 'Add at least 1 speaker before publishing',
  panel: 'Add 2+ panelists and 1 moderator before publishing',
  hybrid: 'Add 1+ speaker and 2+ panelists before publishing',
  meetup: 'People are optional for Meetup events',
};

const ROLE_OPTIONS = [
  { key: 'speaker', label: 'Speaker' },
  { key: 'panelist', label: 'Panelist' },
  { key: 'moderator', label: 'Moderator' },
];

function mergeDatePart(base, picked) {
  const d = new Date(base);
  d.setFullYear(picked.getFullYear(), picked.getMonth(), picked.getDate());
  return d;
}

function mergeTimePart(base, picked) {
  const d = new Date(base);
  d.setHours(picked.getHours(), picked.getMinutes(), 0, 0);
  return d;
}

function safeAndroidPickerHide(setOpen) {
  setTimeout(() => setOpen(false), 150);
}

function stripAndParseMeta(rawDescription) {
  const desc = typeof rawDescription === 'string' ? rawDescription : '';
  const startIdx = desc.indexOf(META_SEPARATOR);
  if (startIdx === -1) {
    return { cleanDescription: desc, eventFormat: null, people: [], onlineLink: '' };
  }
  const cleanDescription = desc.slice(0, startIdx).trimEnd();
  const endIdx = desc.indexOf(META_END, startIdx);
  if (endIdx === -1) {
    return { cleanDescription: desc.trim(), eventFormat: null, people: [], onlineLink: '' };
  }
  const block = desc.slice(startIdx + META_SEPARATOR.length, endIdx);
  const lines = block.split('\n').map((l) => l.trim());
  const map = {};
  for (const line of lines) {
    const colon = line.indexOf(':');
    if (colon === -1) continue;
    const k = line.slice(0, colon).trim();
    const v = line.slice(colon + 1).trim();
    map[k] = v;
  }

  let eventFormat = null;
  const fmtRaw = (map.format || '').trim();
  if (fmtRaw && fmtRaw !== '-') {
    if (fmtRaw === 'panel' || fmtRaw === 'hybrid' || fmtRaw === 'talk' || fmtRaw === 'meetup') {
      eventFormat = fmtRaw;
    }
  }
  let people = [];
  let onlineLink = map.online_link && map.online_link !== '-' ? map.online_link : '';

  if (map.people_json) {
    try {
      const decoded = decodeURIComponent(map.people_json);
      const parsed = JSON.parse(decoded);
      if (Array.isArray(parsed)) {
        people = parsed.map((p, i) => ({
          key: `p-${i}-${Date.now()}`,
          fullName: String(p.fullName || '').trim(),
          role: ['speaker', 'panelist', 'moderator'].includes(p.role) ? p.role : 'speaker',
          title: String(p.title || '').trim(),
          bio: String(p.bio || '').trim(),
          photoPath: p.photoPath ? String(p.photoPath) : null,
        }));
      }
    } catch {
      /* ignore */
    }
  }

  return { cleanDescription, eventFormat, people, onlineLink };
}

function encodePeopleForMeta(people) {
  const minimal = people.map((p) => ({
    role: p.role,
    fullName: p.fullName,
    title: p.title || '',
    bio: p.bio || '',
    photoPath: p.photoPath || null,
  }));
  return encodeURIComponent(JSON.stringify(minimal));
}

function buildDescriptionWithMeta(cleanDescription, eventFormat, people, onlineLink) {
  const base = (cleanDescription || '').trimEnd();
  const peopleJson = encodePeopleForMeta(people);
  const linkLine = onlineLink?.trim() ? onlineLink.trim() : '-';
  const formatLine = eventFormat == null ? '-' : eventFormat;
  const metaBlock = [`format: ${formatLine}`, `online_link: ${linkLine}`, `people_json: ${peopleJson}`].join('\n');
  return `${base}${META_SEPARATOR}${metaBlock}${META_END}`;
}

function validatePeopleForEventType(eventType, people) {
  if (eventType === 'meetup' || eventType == null) return null;
  const speakers = people.filter((p) => p.role === 'speaker' && p.fullName?.trim());
  const panelists = people.filter((p) => p.role === 'panelist' && p.fullName?.trim());
  const moderators = people.filter((p) => p.role === 'moderator' && p.fullName?.trim());

  if (eventType === 'talk') {
    if (speakers.length < 1) return 'Talk format requires at least one speaker.';
    return null;
  }
  if (eventType === 'panel') {
    if (panelists.length < 2) return 'Panel format requires at least two panelists.';
    if (moderators.length < 1) return 'Panel format requires at least one moderator.';
    return null;
  }
  if (eventType === 'hybrid') {
    if (speakers.length < 1) return 'Hybrid format requires at least one speaker.';
    if (panelists.length < 2) return 'Hybrid format requires at least two panelists.';
    return null;
  }
  return null;
}

function initialsFromName(name) {
  if (!name?.trim()) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function PressScale({ children, style, onPress, disabled }) {
  const scale = useRef(new Animated.Value(1)).current;
  const onPressIn = () => {
    Animated.spring(scale, { toValue: 0.98, useNativeDriver: true, friction: 6 }).start();
  };
  const onPressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 6 }).start();
  };
  return (
    <Pressable onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut} disabled={disabled}>
      <Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>
    </Pressable>
  );
}

export default function CreateEventScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const themeColors = useThemeColors();
  const params = useLocalSearchParams();
  const routeEventId = params.eventId != null ? String(params.eventId) : null;
  const isEditing = !!routeEventId;

  const scrollRef = useRef(null);
  const previewHeightRef = useRef(180);
  const sectionYRef = useRef({ essentials: 0, polish: 0, people: 0, review: 0 });
  const footerProgressAnim = useRef(new Animated.Value(0)).current;

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
    isPhysical: true,
  });
  const [ticketPaid, setTicketPaid] = useState(false);
  const [eventType, setEventType] = useState('talk');
  const [people, setPeople] = useState([]);
  const [onlineLink, setOnlineLink] = useState('');

  const [sectionOpen, setSectionOpen] = useState({
    essentials: true,
    polish: false,
    people: false,
    review: false,
  });
  const [publishAttempted, setPublishAttempted] = useState(false);

  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setMinutes(0, 0, 0);
    d.setHours(d.getHours() + 1);
    return d;
  });
  const [hasEndTime, setHasEndTime] = useState(false);
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setMinutes(0, 0, 0);
    d.setHours(d.getHours() + 2);
    return d;
  });

  const [iosStartDateOpen, setIosStartDateOpen] = useState(false);
  const [iosStartTimeOpen, setIosStartTimeOpen] = useState(false);
  const [iosEndTimeOpen, setIosEndTimeOpen] = useState(false);
  const [androidStartDateOpen, setAndroidStartDateOpen] = useState(false);
  const [androidStartTimeOpen, setAndroidStartTimeOpen] = useState(false);
  const [androidEndTimeOpen, setAndroidEndTimeOpen] = useState(false);

  const [interests, setInterests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(!!isEditing);
  const [coverImagePath, setCoverImagePath] = useState(null);
  const [sponsorRows, setSponsorRows] = useState([]);
  const [coverUploading, setCoverUploading] = useState(false);
  const [remoteStatus, setRemoteStatus] = useState(null);

  const [personModalVisible, setPersonModalVisible] = useState(false);
  const [editingPersonKey, setEditingPersonKey] = useState(null);
  const [draftPerson, setDraftPerson] = useState({
    fullName: '',
    role: 'speaker',
    title: '',
    bio: '',
  });

  const [autosaveFlash, setAutosaveFlash] = useState(false);
  const checkOpacity = useRef(new Animated.Value(1)).current;
  const autosaveTimerRef = useRef(null);

  const [publishConfirmOpen, setPublishConfirmOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);

  const [sponsorNamePrompt, setSponsorNamePrompt] = useState(null);
  const [sponsorDraftName, setSponsorDraftName] = useState('');

  const primary = themeColors.primary;
  const primarySoft = COLORS.primarySoft;
  const primaryBorder = COLORS.primaryBorder;
  const textMuted = COLORS.textMuted;
  const successGreen = COLORS.success;

  const effectiveEndDate = useMemo(() => {
    if (hasEndTime) return endDate;
    return new Date(startDate.getTime() + 3600000);
  }, [hasEndTime, endDate, startDate]);

  const categoryLabel = useMemo(() => {
    const id = values.interestId;
    const hit = interests.find((x) => String(x.id) === String(id));
    return hit?.name || null;
  }, [interests, values.interestId]);

  const orderedCategories = useMemo(() => {
    const byLower = {};
    interests.forEach((i) => {
      if (i?.name) byLower[String(i.name).toLowerCase()] = i;
    });
    const ordered = SPEC_CATEGORY_LABELS.map((label) => byLower[label.toLowerCase()]).filter(Boolean);
    const rest = interests.filter((i) => !ordered.find((o) => String(o.id) === String(i.id)));
    return [...ordered, ...rest];
  }, [interests]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await getEventInterests();
        if (!cancelled) setInterests(Array.isArray(list) ? list : []);
      } catch {
        if (!cancelled) setInterests([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isEditing) return;
    const fetchEvent = async () => {
      setFetchLoading(true);
      try {
        const res = await apiClient.get(`/events/${routeEventId}`);
        const data = res.data;
        const rawDesc = data.description || '';
        const parsed = stripAndParseMeta(rawDesc);

        setValues({
          title: data.title || '',
          description: parsed.cleanDescription,
          locationName: data.location?.name || '',
          locationAddress: data.location?.address || '',
          capacity: String(data.capacity ?? '0'),
          totalPrice: String(data.price ?? data.totalPrice ?? 0),
          interestId: String(data.interestId || ''),
          isPhysical: data.isOnline != null ? !data.isOnline : true,
        });
        setTicketPaid(Number(data.price ?? data.totalPrice ?? 0) > 0);
        setEventType(parsed.eventFormat || 'talk');
        setPeople(parsed.people?.length ? parsed.people : []);
        setOnlineLink(parsed.onlineLink || '');
        setStartDate(new Date(data.startsAt ?? data.startDatetime));
        const endRaw = data.endsAt ?? data.endDatetime;
        if (endRaw) {
          setEndDate(new Date(endRaw));
          setHasEndTime(true);
        } else {
          setHasEndTime(false);
        }
        setCoverImagePath(data.image || data.coverImage || null);
        setRemoteStatus(data.status ?? null);
        setSponsorRows(
          Array.isArray(data.sponsors)
            ? data.sponsors.map((s, i) => ({
                key: `s-${s.id ?? i}`,
                name: typeof s.name === 'string' ? s.name : '',
                logoPath: s.logo || null,
              }))
            : [],
        );
      } catch {
        Alert.alert('Error', 'Failed to load event details');
      } finally {
        setFetchLoading(false);
      }
    };
    fetchEvent();
  }, [routeEventId, isEditing]);

  const onChange = (field, value) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  const buildPayload = useCallback(
    (options = {}) => {
      const draft = Boolean(options.draft);
      let endVal = effectiveEndDate;
      if (draft && startDate.getTime() >= endVal.getTime()) {
        endVal = new Date(startDate.getTime() + 3600000);
      }

      const sponsors = sponsorRows
        .filter((r) => r.name.trim())
        .map((r) => ({
          name: r.name.trim(),
          ...(r.logoPath ? { logo: r.logoPath } : {}),
        }));

      const descriptionBase = draft ? (values.description || '').trim() || ' ' : values.description;
      const descriptionWithMeta = buildDescriptionWithMeta(descriptionBase, eventType, people, onlineLink);

      const title = draft ? (values.title || '').trim() || 'Untitled draft' : values.title;

      const capNum = Number(values.capacity);
      const priceNum = ticketPaid ? Number(values.totalPrice) || 0 : 0;

      return {
        title,
        description: descriptionWithMeta,
        startDatetime: startDate.toISOString(),
        endDatetime: endVal.toISOString(),
        locationName: values.isPhysical ? values.locationName || 'Venue TBD' : values.locationName?.trim() || 'Online',
        locationAddress: values.locationAddress || '',
        capacity: Number.isFinite(capNum) ? capNum : 0,
        totalPrice: priceNum,
        interestId: draft ? Number(values.interestId) || 1 : Number(values.interestId),
        isPhysical: values.isPhysical,
        ...(coverImagePath ? { coverImage: coverImagePath } : {}),
        sponsors,
      };
    },
    [
      values,
      startDate,
      effectiveEndDate,
      coverImagePath,
      sponsorRows,
      eventType,
      people,
      onlineLink,
      ticketPaid,
    ],
  );

  const scheduleOk =
    startDate.getTime() < effectiveEndDate.getTime() &&
    (values.isPhysical ? Boolean(values.locationName.trim()) : Boolean(onlineLink.trim()));

  const progressMeta = useMemo(() => {
    let done = 0;
    const total = 5;
    if (values.title.trim()) done += 1;
    if (values.description.trim()) done += 1;
    if (values.interestId) done += 1;
    if (startDate.getTime() < effectiveEndDate.getTime()) done += 1;
    if (values.isPhysical ? values.locationName.trim() : onlineLink.trim()) done += 1;
    const percent = Math.round((done / total) * 100);
    return { done, total, percent };
  }, [values, startDate, effectiveEndDate, onlineLink]);

  useEffect(() => {
    Animated.timing(footerProgressAnim, {
      toValue: progressMeta.percent,
      duration: 320,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [progressMeta.percent, footerProgressAnim]);

  const peopleRuleOk = useMemo(
    () => !validatePeopleForEventType(eventType, people),
    [eventType, people],
  );

  const canPublish = useMemo(() => {
    if (!values.title.trim()) return false;
    if (!values.description.trim()) return false;
    if (!values.interestId) return false;
    if (startDate.getTime() >= effectiveEndDate.getTime()) return false;
    if (values.isPhysical && !values.locationName.trim()) return false;
    if (!values.isPhysical && !onlineLink.trim()) return false;
    return peopleRuleOk;
  }, [values, startDate, effectiveEndDate, onlineLink, peopleRuleOk]);

  const whatsNextText = useMemo(() => {
    if (!values.title.trim()) return 'Start with your event title';
    if (!values.description.trim()) return 'Add a description';
    if (!values.interestId) return 'Pick a category';
    if (startDate.getTime() >= effectiveEndDate.getTime()) return 'Set a date and time';
    if (values.isPhysical && !values.locationName.trim()) return 'Add your venue';
    if (!values.isPhysical && !onlineLink.trim()) return 'Add a meeting link';
    return 'Looking good — review and publish when ready';
  }, [values, startDate, effectiveEndDate, onlineLink]);

  const triggerAutosaveFeedback = useCallback(() => {
    setAutosaveFlash(true);
    checkOpacity.setValue(1);
    Animated.sequence([
      Animated.delay(2800),
      Animated.timing(checkOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start(() => {
      setAutosaveFlash(false);
    });
  }, [checkOpacity]);

  const performSaveDraft = useCallback(async () => {
    const payload = buildPayload({ draft: true });
    try {
      if (effectiveEventId) {
        await patchOrganizerEvent(effectiveEventId, payload);
      } else {
        const created = await createOrganizerEvent(payload);
        const id = created?.id != null ? String(created.id) : null;
        if (id) {
          setLocalEventId(id);
          router.replace({ pathname: '/(organizer)/create-event', params: { eventId: id } });
        }
      }
      triggerAutosaveFeedback();
    } catch (error) {
      const msg = error?.response?.data?.message || error?.message || 'Could not save draft';
      Alert.alert('Save failed', typeof msg === 'string' ? msg : 'Could not save draft');
    }
  }, [buildPayload, effectiveEventId, router, triggerAutosaveFeedback]);

  const saveDraftPress = useCallback(async () => {
    setLoading(true);
    try {
      await performSaveDraft();
    } finally {
      setLoading(false);
    }
  }, [performSaveDraft]);

  useEffect(() => {
    if (!effectiveEventId) return undefined;
    autosaveTimerRef.current = setInterval(() => {
      performSaveDraft().catch(() => {});
    }, 30000);
    return () => {
      if (autosaveTimerRef.current) clearInterval(autosaveTimerRef.current);
    };
  }, [effectiveEventId, performSaveDraft]);

  const scrollToSection = useCallback((key) => {
    setSectionOpen((prev) => ({ ...prev, [key]: true }));
    requestAnimationFrame(() => {
      const y = previewHeightRef.current + (sectionYRef.current[key] || 0);
      scrollRef.current?.scrollTo({ y: Math.max(0, y - 12), animated: true });
    });
  }, []);

  const pickCoverImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission', 'Photo access is needed for the cover image.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      allowsEditing: true,
      aspect: [16, 9],
    });
    if (result.canceled || !result.assets?.[0]) return;
    setCoverUploading(true);
    try {
      const path = await uploadEventCoverImage(result.assets[0]);
      setCoverImagePath(path);
    } catch (e) {
      Alert.alert('Upload failed', e?.message || 'Could not upload image.');
    } finally {
      setCoverUploading(false);
    }
  };

  const pickSponsorLogoForNew = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (result.canceled || !result.assets?.[0]) return;
    setSponsorDraftName('');
    setSponsorNamePrompt({ asset: result.assets[0] });
  };

  const confirmSponsorAdd = async () => {
    if (!sponsorNamePrompt?.asset) return;
    const trimmed = sponsorDraftName.trim();
    if (!trimmed) {
      Alert.alert('Name required', 'Enter a sponsor name.');
      return;
    }
    try {
      const path = await uploadEventCoverImage(sponsorNamePrompt.asset);
      setSponsorRows((prev) => [...prev, { key: `sp-${Date.now()}`, name: trimmed, logoPath: path }]);
      setSponsorNamePrompt(null);
    } catch (e) {
      Alert.alert('Upload failed', e?.message || 'Could not upload logo.');
    }
  };

  const pickSponsorLogo = async (key) => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (result.canceled || !result.assets?.[0]) return;
    try {
      const path = await uploadEventCoverImage(result.assets[0]);
      setSponsorRows((prev) => prev.map((row) => (row.key === key ? { ...row, logoPath: path } : row)));
    } catch (e) {
      Alert.alert('Upload failed', e?.message || 'Could not upload logo.');
    }
  };

  const removeSponsorRow = (key) => {
    setSponsorRows((prev) => prev.filter((r) => r.key !== key));
  };

  const updateSponsorName = (key, name) => {
    setSponsorRows((prev) => prev.map((r) => (r.key === key ? { ...r, name } : r)));
  };

  const openAddPerson = () => {
    setEditingPersonKey(null);
    setDraftPerson({
      fullName: '',
      role: eventType === 'panel' ? 'panelist' : 'speaker',
      title: '',
      bio: '',
    });
    setPersonModalVisible(true);
  };

  const savePersonFromModal = () => {
    if (!draftPerson.fullName?.trim()) {
      Alert.alert('Error', 'Please enter a name.');
      return;
    }
    if (editingPersonKey) {
      setPeople((prev) =>
        prev.map((p) =>
          p.key === editingPersonKey
            ? {
                ...p,
                fullName: draftPerson.fullName.trim(),
                role: draftPerson.role,
                title: draftPerson.title.trim(),
                bio: draftPerson.bio.trim(),
              }
            : p,
        ),
      );
    } else {
      setPeople((prev) => [
        ...prev,
        {
          key: `np-${Date.now()}`,
          fullName: draftPerson.fullName.trim(),
          role: draftPerson.role,
          title: draftPerson.title.trim(),
          bio: draftPerson.bio.trim(),
          photoPath: null,
        },
      ]);
    }
    setPersonModalVisible(false);
  };

  const removePerson = (key) => {
    setPeople((prev) => prev.filter((p) => p.key !== key));
  };

  const handleIosStartDateChange = (_, selectedDate) => {
    setIosStartDateOpen(false);
    if (selectedDate) setStartDate((prev) => mergeDatePart(prev, selectedDate));
  };

  const handleIosStartTimeChange = (_, selectedDate) => {
    setIosStartTimeOpen(false);
    if (selectedDate) setStartDate((prev) => mergeTimePart(prev, selectedDate));
  };

  const handleIosEndTimeChange = (_, selectedDate) => {
    setIosEndTimeOpen(false);
    if (selectedDate) {
      setHasEndTime(true);
      setEndDate(() => {
        const base = new Date(startDate);
        base.setHours(selectedDate.getHours(), selectedDate.getMinutes(), 0, 0);
        return base;
      });
    }
  };

  const handleAndroidStartDate = (event, selectedDate) => {
    if (event?.type === 'set' && selectedDate) {
      setStartDate((prev) => mergeDatePart(prev, selectedDate));
    }
    safeAndroidPickerHide(setAndroidStartDateOpen);
  };

  const handleAndroidStartTime = (event, selectedDate) => {
    if (event?.type === 'set' && selectedDate) {
      setStartDate((prev) => mergeTimePart(prev, selectedDate));
    }
    safeAndroidPickerHide(setAndroidStartTimeOpen);
  };

  const handleAndroidEndTime = (event, selectedDate) => {
    if (event?.type === 'set' && selectedDate) {
      setHasEndTime(true);
      setEndDate((base) => mergeTimePart(base, selectedDate));
    }
    safeAndroidPickerHide(setAndroidEndTimeOpen);
  };

  const runPublish = async () => {
    setPublishAttempted(true);
    if (!canPublish) {
      scrollToSection('review');
      return;
    }
    if (remoteStatus === 'published') {
      setLoading(true);
      try {
        await patchOrganizerEvent(effectiveEventId, buildPayload({ draft: false }));
        Alert.alert('Saved', 'Your changes were saved.');
      } catch (error) {
        const msg = error?.response?.data?.message || error?.message || 'Update failed';
        Alert.alert('Error', typeof msg === 'string' ? msg : 'Update failed');
      } finally {
        setLoading(false);
      }
      return;
    }

    const peopleErr = validatePeopleForEventType(eventType, people);
    if (peopleErr) {
      scrollToSection('people');
      Alert.alert('People', peopleErr);
      return;
    }

    setLoading(true);
    try {
      let id = effectiveEventId;
      if (!id) {
        const created = await createOrganizerEvent(buildPayload({ draft: true }));
        id = created?.id != null ? String(created.id) : null;
        if (id) setLocalEventId(id);
      }
      if (id) {
        await patchOrganizerEvent(id, buildPayload({ draft: false }));
        await publishOrganizerEvent(id);
      }
      setPublishConfirmOpen(false);
      setSuccessOpen(true);
    } catch (error) {
      const msg = error?.response?.data?.message || error?.message || 'Publish failed';
      Alert.alert('Error', typeof msg === 'string' ? msg : 'Publish failed');
    } finally {
      setLoading(false);
    }
  };

  const onPrimaryFooterPress = () => {
    if (!canPublish && remoteStatus !== 'published') {
      scrollToSection('review');
      return;
    }
    if (remoteStatus === 'published') {
      runPublish();
      return;
    }
    if (!canPublish) {
      scrollToSection('review');
      return;
    }
    setPublishConfirmOpen(true);
  };

  const reviewPeopleLabel = useMemo(() => {
    if (eventType === 'talk') return 'At least 1 speaker';
    if (eventType === 'panel') return '2+ panelists and 1+ moderator';
    if (eventType === 'hybrid') return '1+ speaker and 2+ panelists';
    return 'Optional for Meetup';
  }, [eventType]);

  const coverUriResolved = coverImagePath ? resolveApiAssetUrl(coverImagePath) : null;

  const peopleBadgeVariant = ['talk', 'panel', 'hybrid'].includes(eventType) ? 'warning' : 'optional';

  const primaryBtnLabel =
    remoteStatus === 'published'
      ? 'Save changes'
      : isEditing
        ? 'Save changes'
        : 'Publish event';

  const footerWideFlex = 2;
  const footerNarrowFlex = 1;

  const scheduleErr = publishAttempted && !scheduleOk;

  if (fetchLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: themeColors.backgroundMuted }]}>
        <ActivityIndicator size="large" color={themeColors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: COLORS.panel, paddingTop: insets.top }]}>
      <View style={styles.headerRow}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn} hitSlop={8}>
          <Feather name="chevron-left" size={24} color={COLORS.textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: COLORS.textPrimary }]}>Create event</Text>
        <Pressable
          onPress={saveDraftPress}
          disabled={loading}
          style={[styles.saveDraftPill, { backgroundColor: primarySoft, borderColor: primaryBorder }]}
          hitSlop={8}
        >
          <Text style={[styles.saveDraftPillText, { color: primary }]}>Save draft</Text>
        </Pressable>
      </View>

      <View style={[styles.autosaveStrip, { borderBottomColor: primaryBorder }]}>
        <Text style={[styles.autosaveText, { color: successGreen }]}>
          Autosaved just now{' '}
          {autosaveFlash ? (
            <Animated.Text style={{ opacity: checkOpacity }}>✓</Animated.Text>
          ) : (
            <Text style={{ color: successGreen }}> </Text>
          )}
        </Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView
          ref={scrollRef}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 110 + insets.bottom }}
        >
          <View
            style={{ paddingHorizontal: 16, paddingTop: 8 }}
            onLayout={(e) => {
              previewHeightRef.current = e.nativeEvent.layout.height;
            }}
          >
            <LivePreviewCard
              title={values.title}
              categoryLabel={categoryLabel}
              startDate={startDate}
              coverUri={coverUriResolved}
              isPhysical={values.isPhysical}
              primary={primary}
              primarySoft={primarySoft}
              primaryBorder={primaryBorder}
              textMuted={textMuted}
              textPrimary={COLORS.textPrimary}
            />
          </View>

          <View style={[styles.whatsNextBar, { backgroundColor: primarySoft }]}>
            <View style={[styles.whatsNextDot, { backgroundColor: primary }]} />
            <Text style={[styles.whatsNextText, { color: primary }]}>{whatsNextText}</Text>
          </View>

          <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
            <View
              onLayout={(e) => {
                sectionYRef.current.essentials = e.nativeEvent.layout.y;
              }}
            >
              <CollapsibleSection
                iconName="sparkles-outline"
                title="Essentials"
                subtitle="Title, schedule, location & format"
                badgeVariant="required"
                badgeText="Required"
                open={sectionOpen.essentials}
                onToggle={() => setSectionOpen((p) => ({ ...p, essentials: !p.essentials }))}
              >
                <TextField
                  label="Event title *"
                  value={values.title}
                  onChangeText={(v) => onChange('title', v)}
                  placeholder="What's the event called?"
                  autoCapitalize="words"
                  error={publishAttempted && !values.title.trim() ? 'Required' : undefined}
                />
                <View style={{ marginTop: -8 }}>
                  <Text style={styles.inputLabel}>Description *</Text>
                  <View
                    style={[
                      styles.descriptionBox,
                      publishAttempted && !values.description.trim() && { borderColor: COLORS.danger, borderWidth: 1.5 },
                    ]}
                  >
                    <TextInput
                      multiline
                      value={values.description}
                      onChangeText={(v) => onChange('description', v)}
                      placeholder="Tell attendees what to expect..."
                      placeholderTextColor="#9CA3AF"
                      style={styles.descriptionInput}
                    />
                  </View>
                </View>

                <Text style={[styles.inputLabel, { marginTop: 12 }]}>Category *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {orderedCategories.map((interest) => (
                    <Pressable
                      key={interest.id}
                      onPress={() => onChange('interestId', String(interest.id))}
                      style={[
                        styles.categoryChip,
                        String(values.interestId) === String(interest.id) && {
                          backgroundColor: primary,
                          borderColor: primary,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.categoryChipText,
                          String(values.interestId) === String(interest.id) && { color: '#FFF' },
                        ]}
                      >
                        {interest.name}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>

                <Text style={[styles.inputLabel, { marginTop: 16 }]}>Date & time *</Text>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.muted11}>Date</Text>
                    {Platform.OS === 'android' ? (
                      <>
                        <Pressable
                          onPress={() => setAndroidStartDateOpen(true)}
                          style={[styles.dateTile, scheduleErr && styles.dateTileErr]}
                        >
                          <Text style={styles.dateTileMain}>{startDate.toLocaleDateString()}</Text>
                        </Pressable>
                        {androidStartDateOpen ? (
                          <DateTimePicker value={startDate} mode="date" display="default" onChange={handleAndroidStartDate} />
                        ) : null}
                      </>
                    ) : (
                      <>
                        <Pressable onPress={() => setIosStartDateOpen(true)} style={[styles.dateTileIos, scheduleErr && styles.dateTileErr]}>
                          <Text style={styles.dateTileMain}>{startDate.toLocaleDateString()}</Text>
                        </Pressable>
                        {iosStartDateOpen ? (
                          <DateTimePicker value={startDate} mode="date" display="default" onChange={handleIosStartDateChange} />
                        ) : null}
                      </>
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.muted11}>Start time</Text>
                    {Platform.OS === 'android' ? (
                      <>
                        <Pressable onPress={() => setAndroidStartTimeOpen(true)} style={[styles.dateTile, scheduleErr && styles.dateTileErr]}>
                          <Text style={styles.dateTileMain}>
                            {startDate.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                          </Text>
                        </Pressable>
                        {androidStartTimeOpen ? (
                          <DateTimePicker value={startDate} mode="time" display="default" onChange={handleAndroidStartTime} />
                        ) : null}
                      </>
                    ) : (
                      <>
                        <Pressable
                          onPress={() => setIosStartTimeOpen(true)}
                          style={[styles.dateTileIos, scheduleErr && styles.dateTileErr]}
                        >
                          <Text style={styles.dateTileMain}>
                            {startDate.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                          </Text>
                        </Pressable>
                        {iosStartTimeOpen ? (
                          <DateTimePicker value={startDate} mode="time" display="default" onChange={handleIosStartTimeChange} />
                        ) : null}
                      </>
                    )}
                  </View>
                </View>

                <Text style={[styles.muted11, { marginTop: 10 }]}>End time (optional)</Text>
                {Platform.OS === 'android' ? (
                  <>
                    <Pressable
                      onPress={() => {
                        setHasEndTime(true);
                        setAndroidEndTimeOpen(true);
                      }}
                      style={[styles.dateTile, { marginTop: 6 }, scheduleErr && styles.dateTileErr]}
                    >
                      <Text style={styles.dateTileMain}>
                        {hasEndTime
                          ? endDate.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
                          : 'Default: 1 hour after start'}
                      </Text>
                    </Pressable>
                    {androidEndTimeOpen ? (
                      <DateTimePicker
                        value={hasEndTime ? endDate : new Date(startDate.getTime() + 3600000)}
                        mode="time"
                        display="default"
                        onChange={(ev, d) => {
                          if (ev?.type === 'set' && d) {
                            setHasEndTime(true);
                            setEndDate((prev) => {
                              const base = new Date(startDate);
                              base.setHours(d.getHours(), d.getMinutes(), 0, 0);
                              return base;
                            });
                          }
                          safeAndroidPickerHide(setAndroidEndTimeOpen);
                        }}
                      />
                    ) : null}
                  </>
                ) : (
                  <>
                    <Pressable
                      onPress={() => {
                        setHasEndTime(true);
                        setIosEndTimeOpen(true);
                      }}
                      style={[styles.dateTileIos, { marginTop: 6 }, scheduleErr && styles.dateTileErr]}
                    >
                      <Text style={styles.dateTileMain}>
                        {hasEndTime
                          ? endDate.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
                          : 'Default: 1 hour after start'}
                      </Text>
                    </Pressable>
                    {iosEndTimeOpen ? (
                      <DateTimePicker
                        value={hasEndTime ? endDate : new Date(startDate.getTime() + 3600000)}
                        mode="time"
                        display="default"
                        onChange={handleIosEndTimeChange}
                      />
                    ) : null}
                  </>
                )}

                <Text style={[styles.inputLabel, { marginTop: 18 }]}>Format *</Text>
                <View style={styles.modeRow}>
                  <Pressable
                    onPress={() => onChange('isPhysical', true)}
                    style={[styles.modeChip, values.isPhysical && { borderColor: primary, backgroundColor: primarySoft }]}
                  >
                    <Text style={styles.modeEmoji}>📍</Text>
                    <Text style={[styles.modeChipText, { color: COLORS.textPrimary }]}>In-person</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => onChange('isPhysical', false)}
                    style={[styles.modeChip, !values.isPhysical && { borderColor: primary, backgroundColor: primarySoft }]}
                  >
                    <Text style={styles.modeEmoji}>🌐</Text>
                    <Text style={[styles.modeChipText, { color: COLORS.textPrimary }]}>Online</Text>
                  </Pressable>
                </View>

                {values.isPhysical ? (
                  <>
                    <View style={{ marginTop: 12 }}>
                      <TextField
                        label="Venue / address *"
                        value={values.locationName}
                        onChangeText={(v) => onChange('locationName', v)}
                        placeholder="Venue name"
                        error={
                          publishAttempted && values.isPhysical && !values.locationName.trim() ? 'Required' : undefined
                        }
                      />
                    </View>
                    <TextField
                      label="Address (optional)"
                      value={values.locationAddress}
                      onChangeText={(v) => onChange('locationAddress', v)}
                      placeholder="Street, city"
                    />
                  </>
                ) : (
                  <View style={{ marginTop: 12 }}>
                    <TextField
                      label="Meeting link *"
                      value={onlineLink}
                      onChangeText={setOnlineLink}
                      placeholder="https://..."
                      autoCapitalize="none"
                      error={publishAttempted && !values.isPhysical && !onlineLink.trim() ? 'Required' : undefined}
                    />
                  </View>
                )}

                <Text style={[styles.inputLabel, { marginTop: 16 }]}>Event type *</Text>
                <View style={styles.typeGrid}>
                  {EVENT_TYPES.map((opt) => {
                    const active = eventType === opt.key;
                    return (
                      <Pressable
                        key={opt.key}
                        onPress={() => setEventType(opt.key)}
                        style={[styles.typeCell, active && { borderColor: primary, backgroundColor: primarySoft }]}
                      >
                        <Text style={[styles.typeCellText, { color: COLORS.textPrimary }]}>{opt.label}</Text>
                      </Pressable>
                    );
                  })}
                </View>
                <Text style={styles.typeHint}>{EVENT_TYPE_HINTS[eventType]}</Text>

                <Text style={[styles.inputLabel, { marginTop: 14 }]}>Capacity</Text>
                <View style={styles.stepperRow}>
                  <Pressable
                    style={[styles.stepperBtn, { borderColor: primaryBorder }]}
                    onPress={() =>
                      onChange('capacity', String(Math.max(0, (Number(values.capacity) || 0) - 10)))
                    }
                  >
                    <Text style={[styles.stepperBtnText, { color: primary }]}>−</Text>
                  </Pressable>
                  <Text style={styles.stepperVal}>
                    {Number(values.capacity) === 0 ? 'Unlimited' : values.capacity}
                  </Text>
                  <Pressable
                    style={[styles.stepperBtn, { borderColor: primaryBorder }]}
                    onPress={() => onChange('capacity', String((Number(values.capacity) || 0) + 10))}
                  >
                    <Text style={[styles.stepperBtnText, { color: primary }]}>+</Text>
                  </Pressable>
                </View>
                <Text style={styles.muted11}>0 means unlimited capacity</Text>

                <View style={styles.ticketRow}>
                  <Text style={styles.inputLabel}>Tickets</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <Text style={{ color: COLORS.textSecondary, fontWeight: '600' }}>Free</Text>
                    <Switch
                      value={ticketPaid}
                      onValueChange={setTicketPaid}
                      trackColor={{ false: '#D1D5DB', true: primary }}
                    />
                    <Text style={{ color: COLORS.textSecondary, fontWeight: '600' }}>Paid</Text>
                  </View>
                </View>
                {ticketPaid ? (
                  <TextField
                    label="Price (USD)"
                    value={values.totalPrice}
                    onChangeText={(v) => onChange('totalPrice', v)}
                    placeholder="0"
                    keyboardType="decimal-pad"
                  />
                ) : null}
              </CollapsibleSection>
            </View>

            <View
              onLayout={(e) => {
                sectionYRef.current.people = e.nativeEvent.layout.y;
              }}
            >
              <CollapsibleSection
                iconName="people-outline"
                title="People"
                subtitle="Speakers, panelists & moderators"
                badgeVariant={peopleBadgeVariant}
                badgeText={['talk', 'panel', 'hybrid'].includes(eventType) ? 'Required' : 'Optional'}
                open={sectionOpen.people}
                onToggle={() => setSectionOpen((p) => ({ ...p, people: !p.people }))}
              >
                <View style={[styles.bannerPeach, { borderColor: primaryBorder }]}>
                  <Text style={[styles.bannerPeachText, { color: COLORS.textPrimary }]}>{PEOPLE_BANNER[eventType]}</Text>
                </View>

                {people.map((p) => {
                  const roleLabel = ROLE_OPTIONS.find((r) => r.key === p.role)?.label || p.role;
                  return (
                    <View key={p.key} style={[styles.personCard, { borderColor: primaryBorder }]}>
                      <View style={[styles.personAvatar, { backgroundColor: primarySoft }]}>
                        <Text style={[styles.personAvatarLetters, { color: primary }]}>{initialsFromName(p.fullName)}</Text>
                      </View>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={styles.personName} numberOfLines={1}>
                          {p.fullName}
                        </Text>
                        <Text style={styles.personMeta} numberOfLines={1}>
                          {roleLabel}
                          {p.title ? ` · ${p.title}` : ''}
                        </Text>
                      </View>
                      <Pressable onPress={() => removePerson(p.key)} hitSlop={8}>
                        <Text style={[styles.removeText, { color: primary }]}>Remove</Text>
                      </Pressable>
                    </View>
                  );
                })}

                <Pressable
                  onPress={openAddPerson}
                  style={[styles.addPersonDashed, { borderColor: primaryBorder }]}
                >
                  <Ionicons name="add" size={22} color={primary} />
                  <Text style={[styles.addPersonDashedText, { color: primary }]}>Add person</Text>
                </Pressable>
              </CollapsibleSection>
            </View>

            <View
              onLayout={(e) => {
                sectionYRef.current.polish = e.nativeEvent.layout.y;
              }}
            >
              <CollapsibleSection
                iconName="color-wand-outline"
                title="Polish"
                subtitle="Cover & sponsors"
                badgeVariant="optional"
                open={sectionOpen.polish}
                onToggle={() => setSectionOpen((p) => ({ ...p, polish: !p.polish }))}
              >
                <Pressable
                  onPress={pickCoverImage}
                  disabled={coverUploading}
                  style={[styles.coverDashed, { borderColor: primaryBorder }]}
                >
                  {coverUploading ? (
                    <ActivityIndicator color={primary} />
                  ) : coverImagePath ? (
                    <Image source={{ uri: resolveApiAssetUrl(coverImagePath) }} style={styles.coverThumb} resizeMode="cover" />
                  ) : (
                    <>
                      <Feather name="upload" size={28} color={primary} />
                      <Text style={[styles.coverDashedTitle, { color: COLORS.textPrimary }]}>Upload cover photo</Text>
                      <Text style={styles.coverDashedHint}>JPG or PNG · 16:9 · Max 5MB</Text>
                    </>
                  )}
                </Pressable>

                <Text style={[styles.inputLabel, { marginTop: 18 }]}>Sponsors</Text>
                {sponsorRows.map((row) => (
                  <View key={row.key} style={styles.sponsorCard}>
                    <TextInput
                      value={row.name}
                      onChangeText={(t) => updateSponsorName(row.key, t)}
                      placeholder="Sponsor name"
                      placeholderTextColor="#9CA3AF"
                      style={styles.sponsorNameInput}
                    />
                    <View style={styles.sponsorRowInner}>
                      <Pressable onPress={() => pickSponsorLogo(row.key)} style={styles.sponsorLogoBtn}>
                        {row.logoPath ? (
                          <Image
                            source={{ uri: resolveApiAssetUrl(row.logoPath) }}
                            style={{ width: 44, height: 44, borderRadius: 8 }}
                            resizeMode="contain"
                          />
                        ) : (
                          <View style={[styles.sponsorLogoBox, { borderColor: primaryBorder }]}>
                            <Feather name="image" size={18} color={primary} />
                          </View>
                        )}
                        <Text style={[styles.addPersonText, { color: primary }]}>{row.logoPath ? 'Change logo' : 'Add logo'}</Text>
                      </Pressable>
                      <Pressable onPress={() => removeSponsorRow(row.key)}>
                        <Text style={styles.removeTextMuted}>Remove</Text>
                      </Pressable>
                    </View>
                  </View>
                ))}
                <Pressable
                  onPress={pickSponsorLogoForNew}
                  style={[styles.addPersonDashed, { borderColor: primaryBorder }]}
                >
                  <Feather name="plus" size={22} color={primary} />
                  <Text style={[styles.addPersonDashedText, { color: primary }]}>Add sponsor logo</Text>
                </Pressable>
              </CollapsibleSection>
            </View>

            <View
              onLayout={(e) => {
                sectionYRef.current.review = e.nativeEvent.layout.y;
              }}
            >
              <CollapsibleSection
                iconName="checkmark-done-outline"
                title="Review"
                subtitle="Publishing checklist"
                badgeVariant="check"
                open={sectionOpen.review}
                onToggle={() => setSectionOpen((p) => ({ ...p, review: !p.review }))}
              >
                <Text style={styles.reviewSectionLabel}>Required</Text>
                <ReviewRow ok={Boolean(values.title.trim())} label="Event title" />
                <ReviewRow ok={Boolean(values.description.trim())} label="Description" />
                <ReviewRow ok={Boolean(values.interestId)} label="Category" />
                <ReviewRow ok={startDate.getTime() < effectiveEndDate.getTime()} label="Date & time" />
                <ReviewRow ok={scheduleOk} label={values.isPhysical ? 'Venue' : 'Meeting link'} />
                <ReviewRow ok={peopleRuleOk} label={`People (${reviewPeopleLabel})`} />

                <Text style={[styles.reviewSectionLabel, { marginTop: 14 }]}>Optional</Text>
                <ReviewRow optional ok={Boolean(coverImagePath)} label="Cover image" />
                <ReviewRow optional ok={sponsorRows.some((r) => r.name.trim())} label="Sponsors" />
              </CollapsibleSection>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={[styles.footerBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <View style={styles.footerProgressHeader}>
          <Text style={[styles.footerStat, { color: COLORS.textSecondary }]}>
            {progressMeta.done} of {progressMeta.total} required fields done
          </Text>
          <Text style={[styles.footerPct, { color: primary }]}>{progressMeta.percent}%</Text>
        </View>
        <View style={[styles.footerTrack, { backgroundColor: primarySoft }]}>
          <Animated.View
            style={[
              styles.footerFill,
              {
                backgroundColor: primary,
                width: footerProgressAnim.interpolate({
                  inputRange: [0, 100],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
          <PressScale onPress={saveDraftPress} disabled={loading} style={{ flex: footerNarrowFlex }}>
            <View style={[styles.footerSecondaryBtn, { borderColor: primaryBorder, backgroundColor: primarySoft }]}>
              {loading ? <ActivityIndicator color={primary} size="small" /> : <Text style={[styles.footerSecondaryText, { color: primary }]}>Save draft</Text>}
            </View>
          </PressScale>
          <PressScale onPress={onPrimaryFooterPress} disabled={loading} style={{ flex: footerWideFlex }}>
            <View
              style={[
                styles.footerPrimaryBtn,
                {
                  backgroundColor:
                    remoteStatus === 'published' || canPublish ? primary : COLORS.border,
                },
              ]}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.footerPrimaryBtnText}>{primaryBtnLabel}</Text>
              )}
            </View>
          </PressScale>
        </View>
      </View>

      <Modal visible={personModalVisible} transparent animationType="slide" onRequestClose={() => setPersonModalVisible(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setPersonModalVisible(false)}>
          <Pressable style={[styles.modalSheet, { paddingBottom: Math.max(insets.bottom, 16) }]} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>{editingPersonKey ? 'Edit person' : 'Add person'}</Text>
            <Text style={styles.inputLabel}>Role</Text>
            <View style={styles.segmentRow}>
              {ROLE_OPTIONS.map((r) => (
                <Pressable
                  key={r.key}
                  onPress={() => setDraftPerson((d) => ({ ...d, role: r.key }))}
                  style={[styles.segmentBtn, draftPerson.role === r.key && { backgroundColor: primary, borderColor: primary }]}
                >
                  <Text style={[styles.segmentText, draftPerson.role === r.key && { color: '#FFF' }]}>{r.label}</Text>
                </Pressable>
              ))}
            </View>
            <Text style={[styles.inputLabel, { marginTop: 12 }]}>Name *</Text>
            <TextInput
              value={draftPerson.fullName}
              onChangeText={(t) => setDraftPerson((d) => ({ ...d, fullName: t }))}
              placeholder="Full name"
              placeholderTextColor="#9CA3AF"
              style={styles.modalInput}
            />
            <Text style={[styles.inputLabel, { marginTop: 12 }]}>Title / org (optional)</Text>
            <TextInput
              value={draftPerson.title}
              onChangeText={(t) => setDraftPerson((d) => ({ ...d, title: t }))}
              placeholder="Role or organization"
              placeholderTextColor="#9CA3AF"
              style={styles.modalInput}
            />
            <Text style={[styles.inputLabel, { marginTop: 12 }]}>Bio (optional)</Text>
            <TextInput
              value={draftPerson.bio}
              onChangeText={(t) => setDraftPerson((d) => ({ ...d, bio: t }))}
              placeholder="Short bio"
              placeholderTextColor="#9CA3AF"
              style={[styles.modalInput, { minHeight: 72 }]}
              multiline
            />
            <Pressable onPress={savePersonFromModal} style={[styles.modalSaveBtn, { backgroundColor: primary }]}>
              <Text style={styles.modalSaveText}>Add to event</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={publishConfirmOpen} transparent animationType="fade">
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmCard}>
            <Text style={styles.confirmTitle}>Publish now?</Text>
            <Text style={styles.confirmBody}>Your event will be visible to attendees immediately.</Text>
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 18 }}>
              <Pressable style={styles.confirmCancel} onPress={() => setPublishConfirmOpen(false)}>
                <Text style={styles.confirmCancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={[styles.confirmPublish, { backgroundColor: primary }]} onPress={runPublish}>
                <Text style={styles.confirmPublishText}>Publish</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={successOpen} transparent animationType="fade">
        <View style={styles.successOverlay}>
          <Ionicons name="sparkles" size={56} color={primary} />
          <Text style={styles.successTitle}>Event published!</Text>
          <Text style={styles.successSub}>Your event is now live on Kulan</Text>
          <Pressable
            style={[styles.successBtn, { backgroundColor: primary }]}
            onPress={() => {
              setSuccessOpen(false);
              router.replace('/(organizer)/dashboard');
            }}
          >
            <Text style={styles.successBtnText}>Go to live events</Text>
          </Pressable>
        </View>
      </Modal>

      <Modal visible={!!sponsorNamePrompt} transparent animationType="fade">
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmCard}>
            <Text style={styles.confirmTitle}>Sponsor name</Text>
            <TextInput
              placeholder="Company name"
              placeholderTextColor="#9CA3AF"
              style={styles.modalInput}
              value={sponsorDraftName}
              onChangeText={setSponsorDraftName}
            />
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 14 }}>
              <Pressable
                style={styles.confirmCancel}
                onPress={() => {
                  setSponsorNamePrompt(null);
                  setSponsorDraftName('');
                }}
              >
                <Text style={styles.confirmCancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={[styles.confirmPublish, { backgroundColor: primary }]} onPress={confirmSponsorAdd}>
                <Text style={styles.confirmPublishText}>Add</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function ReviewRow({ ok, label, optional }) {
  return (
    <View style={styles.reviewRow}>
      {optional ? (
        <Text style={{ color: COLORS.textMuted, fontSize: 16 }}>·</Text>
      ) : (
        <Ionicons name={ok ? 'checkmark-circle' : 'alert-circle'} size={20} color={ok ? COLORS.success : COLORS.danger} />
      )}
      <Text style={[styles.reviewLabel, optional && { color: COLORS.textMuted }]}>
        {label}
        {optional ? ' (optional)' : ''}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  iconBtn: { padding: 8 },
  headerTitle: { fontSize: 17, fontWeight: '800', flex: 1, textAlign: 'center' },
  saveDraftPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  saveDraftPillText: { fontSize: 13, fontWeight: '800' },
  autosaveStrip: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  autosaveText: { fontSize: 12, fontWeight: '600' },
  whatsNextBar: {
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  whatsNextDot: { width: 8, height: 8, borderRadius: 4 },
  whatsNextText: { flex: 1, fontSize: 14, fontWeight: '800' },
  inputLabel: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 8 },
  descriptionBox: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    backgroundColor: COLORS.background,
    padding: 14,
    minHeight: 100,
  },
  descriptionInput: { fontSize: 15, color: COLORS.textPrimary, textAlignVertical: 'top' },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  categoryChipText: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary },
  muted11: { fontSize: 11, color: COLORS.textMuted },
  dateTile: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    padding: 10,
    marginTop: 6,
  },
  dateTileIos: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    padding: 12,
    marginTop: 6,
  },
  dateTileErr: { borderColor: COLORS.danger },
  dateTileMain: { fontSize: 14, color: COLORS.textPrimary, fontWeight: '600' },
  modeRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  modeChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  modeEmoji: { fontSize: 18 },
  modeChipText: { fontSize: 14, fontWeight: '700' },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 4,
  },
  typeCell: {
    width: '47%',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    backgroundColor: COLORS.card,
  },
  typeCellText: { fontSize: 14, fontWeight: '800' },
  typeHint: { marginTop: 10, fontSize: 12, color: COLORS.textMuted, lineHeight: 17 },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 8,
  },
  stepperBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.card,
  },
  stepperBtnText: { fontSize: 22, fontWeight: '700', marginTop: -2 },
  stepperVal: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '800', color: COLORS.textPrimary },
  ticketRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  bannerPeach: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: COLORS.primarySoft,
    marginBottom: 14,
  },
  bannerPeachText: { fontSize: 13, fontWeight: '600', lineHeight: 18 },
  personCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
    backgroundColor: COLORS.card,
    gap: 10,
  },
  personAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  personAvatarLetters: { fontSize: 14, fontWeight: '800' },
  personName: { fontSize: 15, fontWeight: '800', color: COLORS.textPrimary },
  personMeta: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  removeText: { fontSize: 13, fontWeight: '700' },
  addPersonDashed: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: 'dashed',
    marginTop: 4,
  },
  addPersonDashedText: { fontSize: 15, fontWeight: '700' },
  addPersonText: { fontSize: 14, fontWeight: '700' },
  coverDashed: {
    minHeight: 140,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    gap: 8,
  },
  coverThumb: { width: '100%', height: 140, borderRadius: 12 },
  coverDashedTitle: { fontSize: 15, fontWeight: '800', marginTop: 4 },
  coverDashedHint: { fontSize: 12, color: COLORS.textMuted },
  sponsorCard: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    backgroundColor: COLORS.card,
  },
  sponsorNameInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  sponsorRowInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  sponsorLogoBtn: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sponsorLogoBox: {
    width: 44,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeTextMuted: { color: COLORS.textMuted, fontWeight: '600' },
  reviewSectionLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  reviewRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  reviewLabel: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary, flex: 1 },
  footerBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 10,
  },
  footerProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  footerStat: { fontSize: 13, fontWeight: '600' },
  footerPct: { fontSize: 13, fontWeight: '800' },
  footerTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  footerFill: {
    height: 4,
    borderRadius: 2,
  },
  footerSecondaryBtn: {
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerSecondaryText: { fontSize: 15, fontWeight: '800' },
  footerPrimaryBtn: {
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerPrimaryBtnText: { color: '#FFF', fontSize: 15, fontWeight: '800' },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  modalHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E0E0E5',
    marginBottom: 12,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 16 },
  modalInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  segmentRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  segmentBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#FAFAFB',
  },
  segmentText: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary },
  modalSaveBtn: {
    marginTop: 20,
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalSaveText: { color: '#FFF', fontWeight: '800', fontSize: 16 },
  confirmOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 24,
  },
  confirmCard: {
    backgroundColor: '#FFF',
    borderRadius: 18,
    padding: 20,
  },
  confirmTitle: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary },
  confirmBody: { marginTop: 10, fontSize: 14, color: COLORS.textSecondary, lineHeight: 20 },
  confirmCancel: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmCancelText: { fontWeight: '700', color: COLORS.textSecondary },
  confirmPublish: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmPublishText: { fontWeight: '800', color: '#FFF' },
  successOverlay: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.98)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  successTitle: { marginTop: 16, fontSize: 22, fontWeight: '900', color: COLORS.textPrimary },
  successSub: { marginTop: 8, fontSize: 15, color: COLORS.textSecondary, textAlign: 'center' },
  successBtn: {
    marginTop: 28,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
  },
  successBtnText: { color: '#FFF', fontWeight: '800', fontSize: 16 },
});
