import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import useAuth from '@/auth/useAuth';
import organizerApi from '@/api/organizer';
import { updateOrganizerProfile, uploadOrganizerProfileImage } from '@/api/onboarding';
import { COLORS } from '@/theme/colors';
import { spacing } from '@/theme';
import { resolveApiAssetUrl } from '@/utils/mediaUrl';

function InputField({ icon, label, value, onChangeText, placeholder, multiline = false, editable = true }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={{ color: COLORS.textSecondary, fontSize: 12, fontWeight: '700', marginBottom: 8, letterSpacing: 1 }}>
        {label}
      </Text>
      <View
        style={{
          minHeight: multiline ? 120 : 56,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: COLORS.border,
          backgroundColor: editable ? COLORS.card : COLORS.panel,
          flexDirection: 'row',
          alignItems: multiline ? 'flex-start' : 'center',
          paddingHorizontal: 14,
          paddingTop: multiline ? 13 : 0,
        }}
      >
        <Feather name={icon} size={18} color={COLORS.textSecondary} style={{ marginTop: multiline ? 2 : 0 }} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textMuted}
          autoCapitalize="none"
          editable={editable}
          multiline={multiline}
          numberOfLines={multiline ? 5 : 1}
          style={{
            flex: 1,
            marginLeft: 10,
            color: COLORS.textPrimary,
            fontSize: 16,
            paddingVertical: 0,
            minHeight: multiline ? 96 : 22,
            textAlignVertical: multiline ? 'top' : 'center',
          }}
        />
      </View>
    </View>
  );
}

export default function OrganizerEditProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [fullName, setFullName] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [location, setLocation] = useState('');
  const [website, setWebsite] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [about, setAbout] = useState('');
  const [profileImageUri, setProfileImageUri] = useState('');
  const [selectedProfileImage, setSelectedProfileImage] = useState(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        if (mounted) setLoading(true);
        const data = await organizerApi.getProfileDashboard();
        if (!mounted) return;
        setFullName(user?.fullName || data?.fullName || '');
        setOrganizationName(data?.organizationName || '');
        setLocation(user?.location || data?.location || '');
        setWebsite(data?.website || '');
        setEmail(user?.email || data?.email || '');
        setPhone(user?.phoneNumber || user?.phone || data?.phone || '');
        setAbout(data?.organizationDescription || '');
        setProfileImageUri(resolveApiAssetUrl(user?.profileImg || data?.profileImg) || '');
      } catch (e) {
        if (!mounted) return;
        setError(e?.message || 'Failed to load profile');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [user?.email, user?.fullName, user?.location, user?.phone, user?.phoneNumber]);

  const canSave = useMemo(() => organizationName.trim().length > 0 && !saving, [organizationName, saving]);

  const handlePickProfileImage = async () => {
    setError('');
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError('Photo library permission is required to choose a profile photo.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });

    if (result.canceled || !result.assets?.length) return;
    const asset = result.assets[0];
    setSelectedProfileImage(asset);
    setProfileImageUri(asset.uri);
  };

  const handleSave = async () => {
    if (!organizationName.trim()) {
      setError('Organization name is required.');
      return;
    }
    setError('');
    setSaving(true);
    try {
      if (selectedProfileImage?.uri) {
        const localUri = selectedProfileImage.uri;
        const fileName = selectedProfileImage.fileName || `organizer-profile-${Date.now()}.jpg`;
        const inferredType = selectedProfileImage.mimeType || 'image/jpeg';
        const formData = new FormData();
        formData.append('file', {
          uri: localUri,
          name: fileName,
          type: inferredType,
        });
        await uploadOrganizerProfileImage(formData);
      }
      await updateOrganizerProfile({
        organization_name: organizationName.trim(),
        organization_description: about.trim(),
        website: website.trim(),
      });
      router.back();
    } catch (e) {
      setError(e?.message || 'Failed to save profile changes');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#F5F5F5' }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={insets.top + 12}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        automaticallyAdjustKeyboardInsets
        contentContainerStyle={{
          paddingTop: insets.top + 8,
          paddingBottom: insets.bottom + spacing.xl + 22,
          paddingHorizontal: spacing.lg,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={{ padding: 4 }}>
            <Feather name="arrow-left" size={22} color={COLORS.textPrimary} />
          </Pressable>
          <Text style={{ flex: 1, textAlign: 'center', color: COLORS.textPrimary, fontSize: 24, fontWeight: '800' }}>
            Organizer Profile
          </Text>
          <View style={{ width: 30 }} />
        </View>

        <View style={{ alignItems: 'center', marginBottom: 14 }}>
          <Pressable
            onPress={handlePickProfileImage}
            hitSlop={8}
            style={{
              width: 96,
              height: 96,
              borderRadius: 20,
              backgroundColor: COLORS.panel,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {profileImageUri ? (
              <Image
                source={{ uri: profileImageUri }}
                style={{ width: 96, height: 96, borderRadius: 20 }}
              />
            ) : (
              <Feather name="camera" size={28} color={COLORS.primary} />
            )}
            <View
              style={{
                position: 'absolute',
                right: 6,
                bottom: 6,
                width: 24,
                height: 24,
                borderRadius: 12,
                backgroundColor: '#0B1535',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Feather name="edit-2" size={12} color={COLORS.card} />
            </View>
          </Pressable>
          <Text style={{ marginTop: 8, color: COLORS.textSecondary, fontSize: 14 }}>Change Profile Photo</Text>
        </View>

        <InputField icon="user" label="FULL NAME" value={fullName} onChangeText={setFullName} placeholder="Your name" />
        <InputField
          icon="briefcase"
          label="ORGANIZATION NAME"
          value={organizationName}
          onChangeText={setOrganizationName}
          placeholder="Organization name"
        />
        <InputField icon="map-pin" label="LOCATION" value={location} onChangeText={setLocation} placeholder="City, Country" editable={false} />
        <InputField icon="globe" label="WEBSITE" value={website} onChangeText={setWebsite} placeholder="https://example.com" />
        <InputField icon="mail" label="EMAIL ADDRESS" value={email} onChangeText={setEmail} placeholder="you@example.com" editable={false} />
        <InputField icon="phone" label="PHONE NUMBER" value={phone} onChangeText={setPhone} placeholder="+252..." editable={false} />
        <InputField icon="file-text" label="BIO / ABOUT" value={about} onChangeText={setAbout} placeholder="Describe your organization" multiline />

        {error ? (
          <View
            style={{
              borderRadius: 12,
              borderWidth: 1,
              borderColor: COLORS.danger,
              backgroundColor: '#FEF2F2',
              paddingHorizontal: 12,
              paddingVertical: 10,
              marginBottom: 12,
            }}
          >
            <Text style={{ color: COLORS.danger, textAlign: 'center', fontSize: 14 }}>{error}</Text>
          </View>
        ) : null}

        <Pressable
          onPress={handleSave}
          disabled={!canSave}
          style={({ pressed }) => ({
            minHeight: 52,
            borderRadius: 14,
            backgroundColor: COLORS.primary,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: !canSave ? 0.45 : pressed ? 0.88 : 1,
            marginBottom: Math.max(insets.bottom, 12) + 8,
          })}
        >
          <Text style={{ color: COLORS.card, fontSize: 16, fontWeight: '800' }}>{saving ? 'Saving...' : 'Save Changes'}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
