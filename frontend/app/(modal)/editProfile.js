import React, { useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import useGuardedRouter from '@/hooks/useGuardedRouter';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import useAuth from '@/auth/useAuth';
import authApi from '@/api/auth';
import { updateMemberMe } from '@/api/member';
import onboardingApi from '@/api/onboarding';
import { buildProfileImageUri, pickProfileImagePath } from '@/utils/mediaUrl';
import { COLORS } from '@/theme/colors';
import { spacing } from '@/theme';
import LocationPickerModal from '@/components/createEvent/LocationPickerModal';
import { normalizeUser } from '@/auth/normalizeUser';
import AppPopup from '@/components/common/AppPopup';
import {
  SOCIAL_LINK_FIELDS,
  pickSocialLinkValues,
  buildSocialLinksPayload,
  getSocialLinksValidationError,
} from '@/utils/socialLinks';

function SocialInputField({ field, value, onChangeText }) {
  const IconComponent = field.iconPack === 'FontAwesome5' ? FontAwesome5 : Feather;

  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={{ color: COLORS.textSecondary, fontSize: 12, fontWeight: '700', marginBottom: 8, letterSpacing: 1 }}>
        {field.label.toUpperCase()}
      </Text>
      <View
        style={{
          minHeight: 56,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: COLORS.border,
          backgroundColor: COLORS.card,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 14,
        }}
      >
        <IconComponent
          name={field.iconName}
          size={18}
          color={field.brandColor}
          brand={Boolean(field.brand)}
        />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={field.placeholder}
          placeholderTextColor={COLORS.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          style={{
            flex: 1,
            marginLeft: 10,
            color: COLORS.textPrimary,
            fontSize: 16,
            paddingVertical: 0,
            minHeight: 22,
          }}
        />
      </View>
    </View>
  );
}

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

function LocationMapField({ value, onOpenMap }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={{ color: COLORS.textSecondary, fontSize: 12, fontWeight: '700', marginBottom: 8, letterSpacing: 1 }}>
        LOCATION
      </Text>
      <Pressable onPress={onOpenMap}>
        <View
          style={{
            minHeight: 56,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: COLORS.border,
            backgroundColor: COLORS.panel,
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 14,
          }}
        >
          <Feather name="map-pin" size={18} color={COLORS.textSecondary} />
          <Text
            style={{
              flex: 1,
              marginLeft: 10,
              color: value ? COLORS.textPrimary : COLORS.textMuted,
              fontSize: 16,
              paddingVertical: 14,
            }}
            numberOfLines={2}
          >
            {value || 'Tap to choose on map'}
          </Text>
          <Feather name="chevron-right" size={18} color={COLORS.textMuted} />
        </View>
      </Pressable>
    </View>
  );
}

export default function EditProfileScreen() {
  const router = useGuardedRouter();
  const insets = useSafeAreaInsets();
  const { user, setUser } = useAuth();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [saving, setSaving] = useState(false);
  const [profileImageUri, setProfileImageUri] = useState('');
  const [selectedProfileImage, setSelectedProfileImage] = useState(null);
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [isSuccessPopupVisible, setIsSuccessPopupVisible] = useState(false);
  const [error, setError] = useState('');
  const [socialLinks, setSocialLinks] = useState({
    website: '',
    linkedin: '',
    instagram: '',
    facebook: '',
    tiktok: '',
  });

  const hydrate = useCallback(() => {
    setFullName(String(user?.fullName ?? user?.full_name ?? '').trim());
    setPhone(String(user?.phone ?? user?.phoneNumber ?? '').trim());
    setLocation(String(user?.location ?? '').trim());
    setSocialLinks(pickSocialLinkValues(user));
    setProfileImageUri(buildProfileImageUri(user) || '');
    setSelectedProfileImage(null);
    setError('');
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      hydrate();
    }, [hydrate]),
  );

  const email = String(user?.email ?? '').trim();
  const displayAvatarUri = selectedProfileImage?.uri || profileImageUri;

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
      setError('Please enter your display name.');
      return;
    }

    const socialError = getSocialLinksValidationError(socialLinks);
    if (socialError) {
      setError(socialError);
      return;
    }

    setError('');
    setSaving(true);
    try {
      let uploadedProfileImg = null;
      if (selectedProfileImage?.uri) {
        const localUri = selectedProfileImage.uri;
        const fileName =
          selectedProfileImage.fileName ||
          (typeof localUri === 'string' && localUri.split('/').pop()?.split('?')[0]) ||
          `member-profile-${Date.now()}.jpg`;
        const inferredType = selectedProfileImage.mimeType || 'image/jpeg';
        const file = { uri: localUri, name: fileName, type: inferredType };

        const formData = new FormData();
        formData.append('file', file);
        const uploadResult = await onboardingApi.uploadMemberProfileImage(formData);
        uploadedProfileImg =
          pickProfileImagePath(uploadResult) ||
          uploadResult?.profileImg ||
          uploadResult?.profile_img ||
          null;
      }

      await updateMemberMe({
        full_name: fullName.trim(),
        phone: phone.trim() || undefined,
        location: location.trim() || undefined,
        ...buildSocialLinksPayload(socialLinks),
      });

      const me = await authApi.getMe();
      setUser((prev) => {
        if (!prev) return prev;
        const merged = normalizeUser(prev, me);
        if (uploadedProfileImg) {
          return normalizeUser(merged, {
            profileImg: uploadedProfileImg,
            profile_img: uploadedProfileImg,
          });
        }
        return merged;
      });

      if (uploadedProfileImg) {
        setProfileImageUri(buildProfileImageUri({ profileImg: uploadedProfileImg }) || '');
        setSelectedProfileImage(null);
      } else {
        setProfileImageUri(buildProfileImageUri(me) || '');
      }

      setIsSuccessPopupVisible(true);
    } catch (e) {
      setError(e?.message || 'Failed to save profile changes');
    } finally {
      setSaving(false);
    }
  };

  const canSave = fullName.trim().length > 0 && !saving;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#F5F5F5' }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={insets.top + 12}
    >
      <AppPopup
        visible={isSuccessPopupVisible}
        variant="success"
        title="Profile Updated"
        message="Your profile has been successfully updated."
        primaryLabel="Done"
        onPrimary={() => {
          setIsSuccessPopupVisible(false);
          router.back();
        }}
      />
      <LocationPickerModal
        visible={locationModalOpen}
        onClose={() => setLocationModalOpen(false)}
        onSelectLocation={(picked) => {
          const label = [picked.locationName, picked.locationAddress].filter(Boolean).join(' · ').trim();
          setLocation(label || 'Selected Location');
        }}
        initialLocation={null}
      />

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
            Member Profile
          </Text>
          <View style={{ width: 30 }} />
        </View>

        <View style={{ alignItems: 'center', marginBottom: 14 }}>
          <Pressable onPress={handlePickProfileImage} disabled={saving} hitSlop={8}>
            <View
              style={{
                width: 96,
                height: 96,
                borderRadius: 20,
                backgroundColor: COLORS.panel,
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}
            >
              {displayAvatarUri ? (
                <Image source={{ uri: displayAvatarUri }} style={{ width: 96, height: 96, borderRadius: 20 }} />
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
            </View>
          </Pressable>
          <Text style={{ marginTop: 8, color: COLORS.textSecondary, fontSize: 14 }}>Change Profile Photo</Text>
        </View>

        <InputField icon="user" label="FULL NAME" value={fullName} onChangeText={setFullName} placeholder="Your name" />
        <LocationMapField value={location} onOpenMap={() => setLocationModalOpen(true)} />
        <InputField icon="mail" label="EMAIL ADDRESS" value={email} onChangeText={() => {}} placeholder="you@example.com" editable={false} />
        <InputField icon="phone" label="PHONE NUMBER" value={phone} onChangeText={setPhone} placeholder="+252..." />

        <View style={{ marginTop: 8, marginBottom: 6 }}>
          <Text style={{ color: COLORS.textPrimary, fontSize: 18, fontWeight: '800' }}>Social & web</Text>
          <Text style={{ marginTop: 6, color: COLORS.textSecondary, fontSize: 13, lineHeight: 18 }}>
            Optional — add any links you want on your profile, or leave them blank.
          </Text>
        </View>

        {SOCIAL_LINK_FIELDS.map((field) => (
          <SocialInputField
            key={field.key}
            field={field}
            value={socialLinks[field.key]}
            onChangeText={(text) => setSocialLinks((prev) => ({ ...prev, [field.key]: text }))}
          />
        ))}

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
          {saving ? (
            <ActivityIndicator color={COLORS.card} />
          ) : (
            <Text style={{ color: COLORS.card, fontSize: 16, fontWeight: '800' }}>Save Changes</Text>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
