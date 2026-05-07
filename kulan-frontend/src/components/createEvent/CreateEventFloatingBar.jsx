import React from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

export default function CreateEventFloatingBar({
  lastSavedText,
  onSaveDraft,
  onPublish,
  publishLabel,
  loading,
  disabledPublish,
  bottomInset = 0,
}) {
  return (
    <View
      style={{
        position: 'absolute',
        left: 14,
        right: 14,
        bottom: bottomInset + 10,
        borderRadius: 16,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#F3F4F6',
        padding: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 8,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View>
          <Text style={{ color: '#16A34A', fontSize: 12, fontWeight: '600' }}>{lastSavedText}</Text>
          <Pressable onPress={onSaveDraft} hitSlop={8}>
            <Text style={{ color: '#EA580C', fontWeight: '700', marginTop: 2 }}>Save Draft</Text>
          </Pressable>
        </View>

        <View style={{ flex: 1 }} />

        <Pressable
          onPress={onPublish}
          disabled={disabledPublish || loading}
          style={{
            borderRadius: 12,
            backgroundColor: disabledPublish ? '#D1D5DB' : '#FF7A00',
            paddingHorizontal: 14,
            minWidth: 140,
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 11,
          }}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '800' }}>{publishLabel}</Text>}
        </Pressable>
      </View>
    </View>
  );
}
