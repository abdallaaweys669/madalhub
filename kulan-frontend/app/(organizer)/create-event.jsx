import React, { useState, useEffect, useCallback } from 'react';
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
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import apiClient from '@/api/client';
import { uploadEventCoverImage } from '@/api/eventAssets';
import organizerApi from '@/api/organizer';
import TextField from '@/features/auth/components/TextField';
import { COLORS } from '@/constants/loginSignin/authStyles';
import { useThemeColors } from '@/theme';
import { resolveApiAssetUrl } from '@/utils/mediaUrl';

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

/** Android: `mode="datetime"` is unreliable (native dismiss crash). Use date + time separately. */
function safeAndroidPickerHide(setOpen) {
  setTimeout(() => setOpen(false), 150);
}

export default function CreateEventScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const themeColors = useThemeColors();
  const { eventId } = useLocalSearchParams();
  const isEditing = !!eventId;

  const [values, setValues] = useState({
    title: '',
    description: '',
    locationName: '',
    locationAddress: '',
    capacity: '100',
    totalPrice: '0',
    interestId: '',
    isPhysical: true,
  });
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  /** Android-only: split date/time to avoid @react-native-community/datetimepicker dismiss crash */
  const [androidStartDateOpen, setAndroidStartDateOpen] = useState(false);
  const [androidStartTimeOpen, setAndroidStartTimeOpen] = useState(false);
  const [androidEndDateOpen, setAndroidEndDateOpen] = useState(false);
  const [androidEndTimeOpen, setAndroidEndTimeOpen] = useState(false);
  const [interests, setInterests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(!!isEditing);
  const [coverImagePath, setCoverImagePath] = useState(null);
  const [sponsorRows, setSponsorRows] = useState([]);
  const [orgPreview, setOrgPreview] = useState(null);
  const [coverUploading, setCoverUploading] = useState(false);

  useEffect(() => {
    const fetchInterests = async () => {
      try {
        const res = await apiClient.get('/events/interests');
        setInterests(res.data?.interests || []);
      } catch (error) {
        console.error('Failed to fetch interests:', error);
      }
    };
    fetchInterests();
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const s = await organizerApi.getOrganizerStatus();
        if (mounted) setOrgPreview(s);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isEditing) return;
    const fetchEvent = async () => {
      setFetchLoading(true);
      try {
        const res = await apiClient.get(`/events/${eventId}`);
        const data = res.data;
        setValues({
          title: data.title || '',
          description: data.description || '',
          locationName: data.location?.name || '',
          locationAddress: data.location?.address || '',
          capacity: String(data.capacity || '100'),
          totalPrice: String(data.price || 0),
          interestId: String(data.interestId || ''),
          isPhysical: !data.isOnline,
        });
        setStartDate(new Date(data.startsAt));
        setEndDate(new Date(data.endsAt));
        setCoverImagePath(data.image || data.coverImage || null);
        setSponsorRows(
          Array.isArray(data.sponsors)
            ? data.sponsors.map((s, i) => ({
                key: `s-${s.id ?? i}`,
                name: typeof s.name === 'string' ? s.name : '',
                logoPath: s.logo || null,
              }))
            : [],
        );
      } catch (error) {
        Alert.alert('Error', 'Failed to load event details');
      } finally {
        setFetchLoading(false);
      }
    };
    fetchEvent();
  }, [eventId]);

  const onChange = (field, value) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  const buildPayload = useCallback(() => {
    const sponsors = sponsorRows
      .filter((r) => r.name.trim())
      .map((r) => ({
        name: r.name.trim(),
        ...(r.logoPath ? { logo: r.logoPath } : {}),
      }));
    return {
      title: values.title,
      description: values.description,
      startDatetime: startDate.toISOString(),
      endDatetime: endDate.toISOString(),
      locationName: values.locationName || 'Online',
      locationAddress: values.locationAddress || '',
      capacity: Number(values.capacity) || 100,
      totalPrice: Number(values.totalPrice) || 0,
      interestId: Number(values.interestId),
      isPhysical: values.isPhysical,
      ...(coverImagePath ? { coverImage: coverImagePath } : {}),
      sponsors,
    };
  }, [
    values,
    startDate,
    endDate,
    coverImagePath,
    sponsorRows,
  ]);

  const pickCoverImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission', 'Photo access is needed for the cover image.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
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

  const pickSponsorLogo = async (key) => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
    });
    if (result.canceled || !result.assets?.[0]) return;
    try {
      const path = await uploadEventCoverImage(result.assets[0]);
      setSponsorRows((prev) =>
        prev.map((row) => (row.key === key ? { ...row, logoPath: path } : row)),
      );
    } catch (e) {
      Alert.alert('Upload failed', e?.message || 'Could not upload logo.');
    }
  };

  const addSponsorRow = () => {
    setSponsorRows((prev) => [
      ...prev,
      { key: `new-${Date.now()}`, name: '', logoPath: null },
    ]);
  };

  const removeSponsorRow = (key) => {
    setSponsorRows((prev) => prev.filter((r) => r.key !== key));
  };

  const updateSponsorName = (key, name) => {
    setSponsorRows((prev) => prev.map((r) => (r.key === key ? { ...r, name } : r)));
  };

  const handleIosStartChange = (event, selectedDate) => {
    setShowStartPicker(false);
    if (selectedDate) setStartDate(selectedDate);
  };

  const handleIosEndChange = (event, selectedDate) => {
    setShowEndPicker(false);
    if (selectedDate) setEndDate(selectedDate);
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

  const handleAndroidEndDate = (event, selectedDate) => {
    if (event?.type === 'set' && selectedDate) {
      setEndDate((prev) => mergeDatePart(prev, selectedDate));
    }
    safeAndroidPickerHide(setAndroidEndDateOpen);
  };

  const handleAndroidEndTime = (event, selectedDate) => {
    if (event?.type === 'set' && selectedDate) {
      setEndDate((prev) => mergeTimePart(prev, selectedDate));
    }
    safeAndroidPickerHide(setAndroidEndTimeOpen);
  };

  const onSubmit = async () => {
    if (!values.title.trim() || !values.description.trim() || !values.interestId) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const payload = buildPayload();

      if (isEditing) {
        await apiClient.patch(`/events/${eventId}`, payload);
        Alert.alert('Success', 'Event updated successfully', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      } else {
        await apiClient.post('/events', payload);
        Alert.alert('Success', 'Event created successfully', [
          { text: 'OK', onPress: () => router.replace('/(organizer)/dashboard') },
        ]);
      }
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to save event');
    } finally {
      setLoading(false);
    }
  };

  const onPublish = async () => {
    if (!values.title.trim() || !values.description.trim()) {
      Alert.alert('Error', 'Event must have a title and description before publishing');
      return;
    }

    setLoading(true);
    try {
      if (!isEditing) {
        const payload = {
          ...buildPayload(),
          interestId: Number(values.interestId) || 1,
        };
        const createRes = await apiClient.post('/events', payload);
        const newEventId = createRes.data.id;
        await apiClient.patch(`/events/publish/${newEventId}`);
      } else {
        const payload = buildPayload();
        await apiClient.patch(`/events/${eventId}`, payload);
        await apiClient.patch(`/events/publish/${eventId}`);
      }
      Alert.alert('Success', 'Event published successfully', [
        { text: 'OK', onPress: () => router.replace('/(organizer)/dashboard') },
      ]);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to publish event');
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: themeColors.backgroundMuted, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={themeColors.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: themeColors.backgroundMuted }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={{ padding: 20, paddingTop: insets.top + 8, paddingBottom: insets.bottom + 40 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <Pressable onPress={() => router.back()} style={{ padding: 4 }}>
              <Feather name="arrow-left" size={24} color={themeColors.text} />
            </Pressable>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{ fontSize: 22, fontWeight: '800', color: themeColors.text }}>
                {isEditing ? 'Edit event' : 'New event'}
              </Text>
              <Text style={{ fontSize: 13, color: themeColors.textSecondary, marginTop: 4, textAlign: 'center' }}>
                Cover, schedule & sponsors — members see this on the event page
              </Text>
            </View>
            <View style={{ width: 32 }} />
          </View>

          {orgPreview ? (
            <View
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 18,
                padding: 16,
                marginBottom: 18,
                flexDirection: 'row',
                alignItems: 'center',
                shadowColor: '#000',
                shadowOpacity: 0.06,
                shadowRadius: 12,
                elevation: 2,
              }}
            >
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  backgroundColor: '#FFF3E0',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 12,
                }}
              >
                <Text style={{ fontSize: 18, fontWeight: '800', color: COLORS.primary }}>
                  {(orgPreview.organizationName || orgPreview.fullName || 'O').slice(0, 1).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, color: COLORS.textLight }}>Hosting as</Text>
                <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.textDark }} numberOfLines={1}>
                  {orgPreview.organizationName?.trim() || orgPreview.fullName || 'Your organization'}
                </Text>
              </View>
            </View>
          ) : null}

          <TextField
            label="Event Title *"
            value={values.title}
            onChangeText={(v) => onChange('title', v)}
            placeholder="Enter event title"
            autoCapitalize="words"
          />

          <View style={{ marginTop: 16 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.textDark, marginBottom: 6 }}>Description *</Text>
            <View style={{ borderWidth: 1, borderColor: COLORS.inputBorder, borderRadius: 12, backgroundColor: COLORS.inputBg, padding: 12, minHeight: 80 }}>
              <TextInput multiline value={values.description} onChangeText={(v) => onChange('description', v)} placeholder="Describe your event..." style={{ fontSize: 15, color: COLORS.textDark }} />
            </View>
          </View>

          <View style={{ marginTop: 20 }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: COLORS.textDark, marginBottom: 10 }}>Cover image</Text>
            <Text style={{ fontSize: 13, color: COLORS.textLight, marginBottom: 12 }}>
              Shown at the top of the event — landscape photos work best.
            </Text>
            <Pressable
              onPress={pickCoverImage}
              disabled={coverUploading}
              style={{
                borderRadius: 18,
                overflow: 'hidden',
                backgroundColor: COLORS.cardBg,
                minHeight: 160,
                justifyContent: 'center',
                alignItems: 'center',
                borderWidth: 1,
                borderColor: COLORS.inputBorder,
              }}
            >
              {coverUploading ? (
                <ActivityIndicator color={COLORS.primary} />
              ) : coverImagePath ? (
                <Image
                  source={{ uri: resolveApiAssetUrl(coverImagePath) }}
                  style={{ width: '100%', height: 180 }}
                  resizeMode="cover"
                />
              ) : (
                <View style={{ padding: 28, alignItems: 'center' }}>
                  <Feather name="image" size={36} color={COLORS.primary} />
                  <Text style={{ marginTop: 10, fontWeight: '700', color: COLORS.textDark }}>Tap to add cover</Text>
                  <Text style={{ marginTop: 4, fontSize: 13, color: COLORS.textLight }}>Optional — adds polish</Text>
                </View>
              )}
            </Pressable>
            {coverImagePath ? (
              <Pressable onPress={() => setCoverImagePath(null)} style={{ marginTop: 10, alignSelf: 'flex-start' }}>
                <Text style={{ color: '#DC2626', fontWeight: '600', fontSize: 14 }}>Remove cover</Text>
              </Pressable>
            ) : null}
          </View>

          <View style={{ marginTop: 22 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: COLORS.textDark }}>Sponsors</Text>
              <Pressable
                onPress={addSponsorRow}
                style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 10 }}
              >
                <Feather name="plus-circle" size={18} color={COLORS.primary} />
                <Text style={{ marginLeft: 6, color: COLORS.primary, fontWeight: '700', fontSize: 14 }}>Add</Text>
              </Pressable>
            </View>
            <Text style={{ fontSize: 13, color: COLORS.textLight, marginBottom: 12 }}>
              Optional logos appear in the event carousel for members.
            </Text>
            {sponsorRows.length === 0 ? (
              <Text style={{ fontSize: 14, color: COLORS.textLight, fontStyle: 'italic' }}>No sponsors yet.</Text>
            ) : (
              sponsorRows.map((row) => (
                <View
                  key={row.key}
                  style={{
                    backgroundColor: COLORS.cardBg,
                    borderRadius: 14,
                    padding: 12,
                    marginBottom: 10,
                    borderWidth: 1,
                    borderColor: COLORS.inputBorder,
                  }}
                >
                  <TextInput
                    value={row.name}
                    onChangeText={(t) => updateSponsorName(row.key, t)}
                    placeholder="Sponsor name"
                    placeholderTextColor={COLORS.placeholder}
                    style={{
                      borderWidth: 1,
                      borderColor: COLORS.inputBorder,
                      borderRadius: 10,
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      fontSize: 15,
                      color: COLORS.textDark,
                      marginBottom: 10,
                    }}
                  />
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Pressable
                      onPress={() => pickSponsorLogo(row.key)}
                      style={{ flexDirection: 'row', alignItems: 'center' }}
                    >
                      {row.logoPath ? (
                        <Image
                          source={{ uri: resolveApiAssetUrl(row.logoPath) }}
                          style={{ width: 44, height: 44, borderRadius: 10 }}
                          resizeMode="contain"
                        />
                      ) : (
                        <View
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: 10,
                            borderWidth: 1,
                            borderColor: COLORS.inputBorder,
                            borderStyle: 'dashed',
                            justifyContent: 'center',
                            alignItems: 'center',
                          }}
                        >
                          <Feather name="upload" size={18} color={COLORS.primary} />
                        </View>
                      )}
                      <Text style={{ marginLeft: 10, color: COLORS.primary, fontWeight: '600', fontSize: 13 }}>
                        {row.logoPath ? 'Change logo' : 'Logo (optional)'}
                      </Text>
                    </Pressable>
                    <Pressable onPress={() => removeSponsorRow(row.key)} hitSlop={8}>
                      <Feather name="trash-2" size={20} color="#DC2626" />
                    </Pressable>
                  </View>
                </View>
              ))
            )}
          </View>

          <View
            style={{
              marginTop: 8,
              marginBottom: 8,
              backgroundColor: '#F0F9FF',
              borderRadius: 14,
              padding: 14,
              borderWidth: 1,
              borderColor: '#BAE6FD',
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: '700', color: '#0369A1', marginBottom: 6 }}>Speakers & hosts</Text>
            <Text style={{ fontSize: 13, color: '#0C4A6E', lineHeight: 20 }}>
              There is no separate speaker list in the database yet. Mention speakers by name in the description for now; we can add a dedicated speaker section in a future update.
            </Text>
          </View>

          <View style={{ marginTop: 16 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.textDark, marginBottom: 6 }}>Category *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row', gap: 8 }}>
              {interests.map((interest) => (
                <Pressable
                  key={interest.id}
                  onPress={() => onChange('interestId', String(interest.id))}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: 20,
                    backgroundColor: String(values.interestId) === String(interest.id) ? COLORS.primary : COLORS.cardBg,
                    marginRight: 8,
                    borderWidth: 1,
                    borderColor: COLORS.inputBorder,
                  }}
                >
                  <Text style={{ fontSize: 13, fontWeight: '600', color: String(values.interestId) === String(interest.id) ? 'white' : COLORS.textDark }}>
                    {interest.name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          <View style={{ marginTop: 16, flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.textDark, marginBottom: 6 }}>Start</Text>
              {Platform.OS === 'android' ? (
                <>
                  <Pressable
                    onPress={() => setAndroidStartDateOpen(true)}
                    style={{
                      borderWidth: 1,
                      borderColor: COLORS.inputBorder,
                      borderRadius: 12,
                      backgroundColor: COLORS.inputBg,
                      padding: 10,
                      marginBottom: 8,
                    }}
                  >
                    <Text style={{ fontSize: 11, color: COLORS.textLight }}>Date</Text>
                    <Text style={{ fontSize: 13, color: COLORS.textDark }}>{startDate.toLocaleDateString()}</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setAndroidStartTimeOpen(true)}
                    style={{
                      borderWidth: 1,
                      borderColor: COLORS.inputBorder,
                      borderRadius: 12,
                      backgroundColor: COLORS.inputBg,
                      padding: 10,
                    }}
                  >
                    <Text style={{ fontSize: 11, color: COLORS.textLight }}>Time</Text>
                    <Text style={{ fontSize: 13, color: COLORS.textDark }}>
                      {startDate.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                    </Text>
                  </Pressable>
                  {androidStartDateOpen ? (
                    <DateTimePicker
                      value={startDate}
                      mode="date"
                      display="default"
                      onChange={handleAndroidStartDate}
                    />
                  ) : null}
                  {androidStartTimeOpen ? (
                    <DateTimePicker
                      value={startDate}
                      mode="time"
                      display="default"
                      onChange={handleAndroidStartTime}
                    />
                  ) : null}
                </>
              ) : (
                <>
                  <Pressable
                    onPress={() => setShowStartPicker(true)}
                    style={{ borderWidth: 1, borderColor: COLORS.inputBorder, borderRadius: 12, backgroundColor: COLORS.inputBg, padding: 12 }}
                  >
                    <Text style={{ fontSize: 14, color: COLORS.textDark }}>{startDate.toLocaleString()}</Text>
                  </Pressable>
                  {showStartPicker ? (
                    <DateTimePicker value={startDate} mode="datetime" display="default" onChange={handleIosStartChange} />
                  ) : null}
                </>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.textDark, marginBottom: 6 }}>End</Text>
              {Platform.OS === 'android' ? (
                <>
                  <Pressable
                    onPress={() => setAndroidEndDateOpen(true)}
                    style={{
                      borderWidth: 1,
                      borderColor: COLORS.inputBorder,
                      borderRadius: 12,
                      backgroundColor: COLORS.inputBg,
                      padding: 10,
                      marginBottom: 8,
                    }}
                  >
                    <Text style={{ fontSize: 11, color: COLORS.textLight }}>Date</Text>
                    <Text style={{ fontSize: 13, color: COLORS.textDark }}>{endDate.toLocaleDateString()}</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setAndroidEndTimeOpen(true)}
                    style={{
                      borderWidth: 1,
                      borderColor: COLORS.inputBorder,
                      borderRadius: 12,
                      backgroundColor: COLORS.inputBg,
                      padding: 10,
                    }}
                  >
                    <Text style={{ fontSize: 11, color: COLORS.textLight }}>Time</Text>
                    <Text style={{ fontSize: 13, color: COLORS.textDark }}>
                      {endDate.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                    </Text>
                  </Pressable>
                  {androidEndDateOpen ? (
                    <DateTimePicker value={endDate} mode="date" display="default" onChange={handleAndroidEndDate} />
                  ) : null}
                  {androidEndTimeOpen ? (
                    <DateTimePicker value={endDate} mode="time" display="default" onChange={handleAndroidEndTime} />
                  ) : null}
                </>
              ) : (
                <>
                  <Pressable
                    onPress={() => setShowEndPicker(true)}
                    style={{ borderWidth: 1, borderColor: COLORS.inputBorder, borderRadius: 12, backgroundColor: COLORS.inputBg, padding: 12 }}
                  >
                    <Text style={{ fontSize: 14, color: COLORS.textDark }}>{endDate.toLocaleString()}</Text>
                  </Pressable>
                  {showEndPicker ? (
                    <DateTimePicker value={endDate} mode="datetime" display="default" onChange={handleIosEndChange} />
                  ) : null}
                </>
              )}
            </View>
          </View>

          <View style={{ marginTop: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.textDark }}>Physical Event</Text>
            <Switch value={values.isPhysical} onValueChange={(v) => onChange('isPhysical', v)} trackColor={{ false: '#D1D5DB', true: COLORS.primary }} />
          </View>

          {values.isPhysical && (
            <>
              <View style={{ marginTop: 16 }}>
                <TextField label="Venue Name" value={values.locationName} onChangeText={(v) => onChange('locationName', v)} placeholder="Enter venue name" />
              </View>
              <View style={{ marginTop: 12 }}>
                <TextField label="Address" value={values.locationAddress} onChangeText={(v) => onChange('locationAddress', v)} placeholder="Enter address" />
              </View>
            </>
          )}

          <View style={{ marginTop: 16, flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <TextField label="Capacity" value={values.capacity} onChangeText={(v) => onChange('capacity', v)} placeholder="100" keyboardType="number-pad" />
            </View>
            <View style={{ flex: 1 }}>
              <TextField label="Price ($)" value={values.totalPrice} onChangeText={(v) => onChange('totalPrice', v)} placeholder="0" keyboardType="decimal-pad" />
            </View>
          </View>

          <Pressable
            onPress={onSubmit}
            disabled={loading}
            style={{ backgroundColor: COLORS.primary, borderRadius: 14, height: 50, justifyContent: 'center', alignItems: 'center', marginTop: 24, opacity: loading ? 0.6 : 1 }}
          >
            {loading ? <ActivityIndicator color="white" /> : <Text style={{ color: 'white', fontWeight: '700', fontSize: 16 }}>{isEditing ? 'Update Event' : 'Save Draft'}</Text>}
          </Pressable>

          {!isEditing || true ? (
            <Pressable
              onPress={onPublish}
              disabled={loading}
              style={{ backgroundColor: '#22C55E', borderRadius: 14, height: 50, justifyContent: 'center', alignItems: 'center', marginTop: 12, opacity: loading ? 0.6 : 1 }}
            >
              <Text style={{ color: 'white', fontWeight: '700', fontSize: 16 }}>
                {isEditing ? 'Update & Publish' : 'Create & Publish'}
              </Text>
            </Pressable>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
