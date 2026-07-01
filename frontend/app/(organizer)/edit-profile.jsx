import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import useGuardedRouter from '@/hooks/useGuardedRouter';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import useAuth from '@/auth/useAuth';
import { mergeAuthenticatedUserFromMe } from '@/auth/mergeAuthenticatedUserFromMe';
import { normalizeUser } from '@/auth/normalizeUser';
import { updateMemberMe } from '@/api/member';
import organizerApi from '@/api/organizer';
import { updateOrganizerProfile, uploadOrganizerProfileImage } from '@/api/onboarding';
import { MemberInitialAvatar } from '@/components/member/MemberInitialAvatar';
import { COLORS } from '@/theme/colors';
import { resolveApiAssetUrl } from '@/utils/mediaUrl';
import {
  buildOrganizerSocialPayload,
  getOrganizerSocialLinksValidationError,
  pickOrganizerSocialInputs,
} from '@/utils/socialLinks';

const BIO_MAX = 500;
const INPUT_BORDER = COLORS.primaryBorder || '#FFB899';

function ProfileField({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
  maxLength,
  showCounter = false,
}) {
  return (
    <View style={{ marginBottom: 18 }}>
      <Text style={{ color: COLORS.textPrimary, fontSize: 14, fontWeight: '700', marginBottom: 8 }}>
        {label}
      </Text>
      <View
        style={{
          borderRadius: 14,
          borderWidth: 1,
          borderColor: INPUT_BORDER,
          backgroundColor: '#FFFFFF',
          minHeight: multiline ? 132 : 52,
          paddingHorizontal: 14,
          paddingVertical: multiline ? 12 : 0,
          justifyContent: multiline ? 'flex-start' : 'center',
        }}
      >
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textMuted}
          multiline={multiline}
          maxLength={maxLength}
          scrollEnabled={multiline}
          style={{
            color: COLORS.textPrimary,
            fontSize: 15,
            lineHeight: multiline ? 22 : 20,
            minHeight: multiline ? 108 : 22,
            textAlignVertical: multiline ? 'top' : 'center',
            paddingVertical: 0,
          }}
        />
      </View>
      {showCounter && maxLength ? (
        <Text style={{ color: COLORS.textMuted, fontSize: 12, textAlign: 'right', marginTop: 6 }}>
          {String(value ?? '').length}/{maxLength}
        </Text>
      ) : null}
    </View>
  );
}

export default function OrganizerEditProfileScreen() {
  const router = useGuardedRouter();
  const insets = useSafeAreaInsets();
  const { user, setUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [fullName, setFullName] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [location, setLocation] = useState('');
  const [website, setWebsite] = useState('');
  const [instagram, setInstagram] = useState('');
  const [facebook, setFacebook] = useState('');
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
        const socialInputs = pickOrganizerSocialInputs(data);
        setInstagram(socialInputs.instagram);
        setFacebook(socialInputs.facebook);
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
  }, [user?.fullName, user?.location, user?.profileImg]);

  const canSave = useMemo(
    () => fullName.trim().length > 0 && organizationName.trim().length > 0 && !saving,
    [fullName, organizationName, saving],
  );

  const handlePickProfileImage = async () => {
    setError('');
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError('Photo library permission is required to choose a profile photo.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
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
    if (!fullName.trim()) {
      setError('Full name is required.');
      return;
    }
    if (!organizationName.trim()) {
      setError('Organization name is required.');
      return;
    }

    const socialError = getOrganizerSocialLinksValidationError({ instagram, facebook });
    if (socialError) {
      setError(socialError);
      return;
    }

    setError('');
    setSaving(true);
    try {
      let uploadedProfileImg = null;
      if (selectedProfileImage?.uri) {
        const uploadResult = await uploadOrganizerProfileImage(selectedProfileImage);
        uploadedProfileImg =
          uploadResult?.profileImg ||
          uploadResult?.profile_img ||
          uploadResult?.path ||
          null;
      }

      const socialPayload = buildOrganizerSocialPayload({ instagram, facebook });

      await updateOrganizerProfile({
        organization_name: organizationName.trim(),
        organization_description: about.trim(),
        website: website.trim(),
        instagram: socialPayload.instagram,
        facebook: socialPayload.facebook,
      });

      await updateMemberMe({
        full_name: fullName.trim(),
        location: location.trim() || undefined,
      });

      const merged = await mergeAuthenticatedUserFromMe(setUser);
      if (uploadedProfileImg && setUser) {
        setUser((prev) =>
          prev
            ? normalizeUser(prev, {
                profileImg: uploadedProfileImg,
                profile_img: uploadedProfileImg,
              })
            : prev,
        );
      } else if (!merged) {
        setUser((prev) =>
          prev
            ? {
                ...prev,
                fullName: fullName.trim(),
                location: location.trim(),
              }
            : prev,
        );
      }

      router.back();
    } catch (e) {
      setError(e?.message || 'Failed to save profile changes');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#FFFFFF' }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={insets.top + 12}
    >
      <View
        style={{
          paddingTop: insets.top + 8,
          paddingHorizontal: 16,
          paddingBottom: 10,
          flexDirection: 'row',
          alignItems: 'center',
          borderBottomWidth: 1,
          borderBottomColor: '#F3F4F6',
        }}
      >
        <Pressable onPress={() => router.back()} hitSlop={12} style={{ padding: 4, width: 40 }}>
          <Feather name="arrow-left" size={22} color={COLORS.textPrimary} />
        </Pressable>
        <Text style={{ flex: 1, textAlign: 'center', color: COLORS.textPrimary, fontSize: 18, fontWeight: '800' }}>
          Edit profile
        </Text>
        <Pressable
          onPress={handleSave}
          disabled={!canSave}
          hitSlop={8}
          style={{ width: 52, alignItems: 'flex-end', paddingVertical: 4 }}
        >
          {saving ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : (
            <Text style={{ color: canSave ? COLORS.primary : COLORS.textMuted, fontSize: 16, fontWeight: '800' }}>
              Save
            </Text>
          )}
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        automaticallyAdjustKeyboardInsets
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 20,
          paddingBottom: insets.bottom + 32,
        }}
      >
        <View style={{ alignItems: 'center', marginBottom: 24 }}>
          <Pressable onPress={handlePickProfileImage} style={{ position: 'relative' }}>
            {profileImageUri ? (
              <Image
                source={{ uri: profileImageUri }}
                style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: COLORS.primarySoft }}
              />
            ) : (
              <View
                style={{
                  width: 96,
                  height: 96,
                  borderRadius: 48,
                  backgroundColor: COLORS.primarySoft,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <MemberInitialAvatar name={organizationName || fullName || 'Organizer'} size={40} borderWidth={0} />
              </View>
            )}
            <View
              style={{
                position: 'absolute',
                right: -2,
                bottom: -2,
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: COLORS.primary,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 2,
                borderColor: '#FFFFFF',
              }}
            >
              <Feather name="camera" size={15} color="#FFFFFF" />
            </View>
          </Pressable>
          <Pressable onPress={handlePickProfileImage} style={{ marginTop: 10 }}>
            <Text style={{ color: COLORS.primary, fontSize: 15, fontWeight: '700' }}>Change photo</Text>
          </Pressable>
        </View>

        <ProfileField
          label="Full name"
          value={fullName}
          onChangeText={setFullName}
          placeholder="Your name"
        />
        <ProfileField
          label="Organization name"
          value={organizationName}
          onChangeText={setOrganizationName}
          placeholder="Organization name"
        />
        <ProfileField
          label="Bio / About"
          value={about}
          onChangeText={(text) => setAbout(text.slice(0, BIO_MAX))}
          placeholder="Describe your organization"
          multiline
          maxLength={BIO_MAX}
          showCounter
        />
        <ProfileField
          label="Website"
          value={website}
          onChangeText={setWebsite}
          placeholder="https://example.com"
        />
        <ProfileField
          label="Instagram"
          value={instagram}
          onChangeText={setInstagram}
          placeholder="@username"
        />
        <ProfileField
          label="Facebook"
          value={facebook}
          onChangeText={setFacebook}
          placeholder="username"
        />
        <ProfileField
          label="Location"
          value={location}
          onChangeText={setLocation}
          placeholder="City, Country"
        />

        {error ? (
          <View
            style={{
              borderRadius: 12,
              borderWidth: 1,
              borderColor: COLORS.danger,
              backgroundColor: '#FEF2F2',
              paddingHorizontal: 12,
              paddingVertical: 10,
              marginBottom: 16,
            }}
          >
            <Text style={{ color: COLORS.danger, textAlign: 'center', fontSize: 14 }}>{error}</Text>
          </View>
        ) : null}

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-start',
            gap: 10,
            borderRadius: 14,
            backgroundColor: COLORS.primarySoft,
            paddingHorizontal: 14,
            paddingVertical: 12,
          }}
        >
          <Feather name="info" size={18} color={COLORS.primary} style={{ marginTop: 1 }} />
          <Text style={{ flex: 1, color: COLORS.textSecondary, fontSize: 14, lineHeight: 20 }}>
            This is what members see on your public page.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
