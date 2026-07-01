import React, { useEffect, useMemo } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { resolveApiAssetUrl } from '@/utils/mediaUrl';
import {
  getAllowedRosterRoles,
  getDefaultRosterRole,
  getRosterSectionMeta,
  ROSTER_ROLE_OPTIONS,
} from '@/utils/eventRosterByFormat';
import {
  SPEAKER_SOCIAL_LINK_FIELDS,
  getEmptySocialLinkValues,
  getSpeakerSocialLinksValidationError,
  isSpeakerRosterRole,
} from '@/utils/socialLinks';

export default function SpeakerEditModal({
  visible,
  onClose,
  eventFormat,
  personSaving,
  editingPersonKey,
  draftPerson,
  setDraftPerson,
  draftPhotoPick,
  onPickPhoto,
  onRemovePhoto,
  onSave,
  onDelete,
}) {
  const sectionMeta = getRosterSectionMeta(eventFormat);
  const allowedRoles = useMemo(() => new Set(getAllowedRosterRoles(eventFormat)), [eventFormat]);
  const roleOptions = useMemo(
    () => ROSTER_ROLE_OPTIONS.filter((role) => allowedRoles.has(role.key)),
    [allowedRoles],
  );

  useEffect(() => {
    if (!visible) return;
    setDraftPerson((current) => {
      if (allowedRoles.has(current.role)) return current;
      return { ...current, role: getDefaultRosterRole(eventFormat) };
    });
  }, [visible, eventFormat, allowedRoles, setDraftPerson]);

  const photoUri = draftPhotoPick?.uri || (draftPerson.photoPath ? resolveApiAssetUrl(draftPerson.photoPath) : null);
  const showSocialFields = isSpeakerRosterRole(draftPerson.role);
  const socialLinks = draftPerson.socialLinks || getEmptySocialLinkValues();
  const modalTitle = editingPersonKey ? sectionMeta.modalEditTitle : sectionMeta.modalAddTitle;

  const setSocialLink = (key, value) => {
    setDraftPerson((current) => ({
      ...current,
      socialLinks: {
        ...(current.socialLinks || getEmptySocialLinkValues()),
        [key]: value,
      },
    }));
  };

  const handleSavePress = () => {
    const socialError = showSocialFields ? getSpeakerSocialLinksValidationError(socialLinks) : null;
    if (socialError) {
      Alert.alert('Check social links', socialError);
      return;
    }
    onSave();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(15,23,42,0.42)' }} onPress={() => !personSaving && onClose()}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1, justifyContent: 'flex-end' }}
        >
          <Pressable
            style={{
              maxHeight: '88%',
              backgroundColor: '#fff',
              borderTopLeftRadius: 18,
              borderTopRightRadius: 18,
              padding: 16,
            }}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={{ alignSelf: 'center', width: 48, height: 4, borderRadius: 2, backgroundColor: '#E5E7EB', marginBottom: 12 }} />
            <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 12 }}>{modalTitle}</Text>

            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              {roleOptions.length > 1 ? (
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                  {roleOptions.map((role) => {
                    const active = draftPerson.role === role.key;
                    return (
                      <Pressable
                        key={role.key}
                        onPress={() => setDraftPerson((current) => ({ ...current, role: role.key }))}
                        style={{
                          borderWidth: 1,
                          borderRadius: 10,
                          borderColor: active ? '#FF7A00' : '#E5E7EB',
                          backgroundColor: active ? '#FFF7ED' : '#fff',
                          paddingVertical: 9,
                          paddingHorizontal: 14,
                          alignItems: 'center',
                          flexDirection: 'row',
                          gap: 6,
                        }}
                      >
                        <Feather name={role.icon} size={14} color={active ? '#EA580C' : '#6B7280'} />
                        <Text style={{ fontWeight: '700', color: active ? '#EA580C' : '#374151' }}>{role.label}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              ) : null}

              <TextInput
                value={draftPerson.fullName}
                onChangeText={(text) => setDraftPerson((current) => ({ ...current, fullName: text }))}
                placeholder="Full name"
                placeholderTextColor="#9CA3AF"
                style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12, marginBottom: 10 }}
              />
              <TextInput
                value={draftPerson.title}
                onChangeText={(text) => setDraftPerson((current) => ({ ...current, title: text }))}
                placeholder="Job title or organization"
                placeholderTextColor="#9CA3AF"
                style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12, marginBottom: 12 }}
              />

              <Text style={{ marginBottom: 8, color: '#6B7280' }}>Profile picture</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: showSocialFields ? 16 : 0 }}>
                {photoUri ? (
                  <Image source={{ uri: photoUri }} style={{ width: 66, height: 66, borderRadius: 33 }} />
                ) : (
                  <View style={{ width: 66, height: 66, borderRadius: 33, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' }}>
                    <Feather name="user" size={24} color="#9CA3AF" />
                  </View>
                )}
                <View style={{ gap: 8 }}>
                  <Pressable onPress={onPickPhoto}>
                    <Text style={{ color: '#EA580C', fontWeight: '700' }}>Upload profile picture</Text>
                  </Pressable>
                  {photoUri ? (
                    <Pressable onPress={onRemovePhoto}>
                      <Text style={{ color: '#6B7280' }}>Remove photo</Text>
                    </Pressable>
                  ) : null}
                </View>
              </View>

              {showSocialFields ? (
                <View style={{ marginBottom: 8 }}>
                  <Text style={{ fontWeight: '700', color: '#374151', marginBottom: 4 }}>Social profiles (optional)</Text>
                  <Text style={{ color: '#6B7280', fontSize: 13, lineHeight: 18, marginBottom: 10 }}>
                    Type the speaker's username — we link it automatically. Leave blank to hide.
                  </Text>
                  {SPEAKER_SOCIAL_LINK_FIELDS.map((field) => (
                    <View key={field.key} style={{ marginBottom: 10 }}>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: '#6B7280', marginBottom: 6 }}>
                        {field.label}
                      </Text>
                      <TextInput
                        value={socialLinks[field.key]}
                        onChangeText={(value) => setSocialLink(field.key, value)}
                        placeholder={field.placeholder}
                        placeholderTextColor="#9CA3AF"
                        autoCapitalize="none"
                        autoCorrect={false}
                        keyboardType={field.key === 'website' ? 'url' : 'default'}
                        style={{
                          borderWidth: 1,
                          borderColor: '#E5E7EB',
                          borderRadius: 12,
                          paddingHorizontal: 12,
                          paddingVertical: 12,
                          color: '#111827',
                        }}
                      />
                    </View>
                  ))}
                </View>
              ) : null}
            </ScrollView>

            <Pressable
              onPress={handleSavePress}
              disabled={personSaving}
              style={{ marginTop: 14, borderRadius: 12, backgroundColor: '#FF7A00', paddingVertical: 13, alignItems: 'center' }}
            >
              {personSaving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={{ color: '#fff', fontWeight: '700' }}>{editingPersonKey ? 'Save' : 'Add to event'}</Text>
              )}
            </Pressable>
            {editingPersonKey ? (
              <Pressable onPress={onDelete} style={{ alignItems: 'center', marginTop: 10, marginBottom: 4 }}>
                <Text style={{ color: '#DC2626', fontWeight: '700' }}>Remove from lineup</Text>
              </Pressable>
            ) : null}
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}
