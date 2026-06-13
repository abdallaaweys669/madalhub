import React from 'react';
import { ActivityIndicator, Image, Modal, Pressable, Text, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { resolveApiAssetUrl } from '@/utils/mediaUrl';

const ROLE_OPTIONS = [
  { key: 'speaker', label: 'Speaker', icon: 'mic' },
  { key: 'panelist', label: 'Panelist', icon: 'users' },
  { key: 'moderator', label: 'Moderator', icon: 'message-circle' },
  { key: 'keynote', label: 'Keynote speaker', icon: 'star' },
];

export default function SpeakerEditModal({
  visible,
  onClose,
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
  const photoUri = draftPhotoPick?.uri || (draftPerson.photoPath ? resolveApiAssetUrl(draftPerson.photoPath) : null);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(15,23,42,0.42)' }} onPress={() => !personSaving && onClose()}>
        <Pressable
          style={{
            marginTop: 'auto',
            backgroundColor: '#fff',
            borderTopLeftRadius: 18,
            borderTopRightRadius: 18,
            padding: 16,
          }}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={{ alignSelf: 'center', width: 48, height: 4, borderRadius: 2, backgroundColor: '#E5E7EB', marginBottom: 12 }} />
          <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 12 }}>
            {editingPersonKey ? 'Edit speaker' : 'Add speaker'}
          </Text>

          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            {ROLE_OPTIONS.map((r) => {
              const active = draftPerson.role === r.key;
              return (
                <Pressable
                  key={r.key}
                  onPress={() => setDraftPerson((d) => ({ ...d, role: r.key }))}
                  style={{
                    borderWidth: 1,
                    borderRadius: 10,
                    borderColor: active ? '#FF7A00' : '#E5E7EB',
                    backgroundColor: active ? '#FFF7ED' : '#fff',
                    paddingVertical: 9,
                    paddingHorizontal: 14,
                    alignItems: 'center',
                    flexDirection: 'row',
                    gap: 6
                  }}
                >
                  <Feather name={r.icon} size={14} color={active ? '#EA580C' : '#6B7280'} />
                  <Text style={{ fontWeight: '700', color: active ? '#EA580C' : '#374151' }}>{r.label}</Text>
                </Pressable>
              );
            })}
          </View>

          <TextInput
            value={draftPerson.fullName}
            onChangeText={(t) => setDraftPerson((d) => ({ ...d, fullName: t }))}
            placeholder="Full name"
            placeholderTextColor="#9CA3AF"
            style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12, marginBottom: 10 }}
          />
          <TextInput
            value={draftPerson.title}
            onChangeText={(t) => setDraftPerson((d) => ({ ...d, title: t }))}
            placeholder="Job title or organization"
            placeholderTextColor="#9CA3AF"
            style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12, marginBottom: 12 }}
          />
          <Text style={{ marginBottom: 8, color: '#6B7280' }}>Profile picture</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={{ width: 66, height: 66, borderRadius: 33 }} />
            ) : (
              <View style={{ width: 66, height: 66, borderRadius: 33, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' }}>
                <Feather name="user" size={24} color="#9CA3AF" />
              </View>
            )}
            <View style={{ gap: 8 }}>
              <Pressable onPress={onPickPhoto}>
                <Text style={{ color: '#EA580C', fontWeight: '700' }}>Image Upload Profile Picture</Text>
              </Pressable>
              {photoUri ? (
                <Pressable onPress={onRemovePhoto}>
                  <Text style={{ color: '#6B7280' }}>Remove photo</Text>
                </Pressable>
              ) : null}
            </View>
          </View>

          <Pressable
            onPress={onSave}
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
            <Pressable onPress={onDelete} style={{ alignItems: 'center', marginTop: 10 }}>
              <Text style={{ color: '#DC2626', fontWeight: '700' }}>Remove from lineup</Text>
            </Pressable>
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
