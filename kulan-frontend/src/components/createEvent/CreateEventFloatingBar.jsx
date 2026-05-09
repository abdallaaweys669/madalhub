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
  const showSavedText = Boolean(lastSavedText) && lastSavedText !== 'Not saved yet';

  return (
    <View
      style={{
        position: 'absolute',
        left: 14,
        right: 14,
        bottom: bottomInset + 10,
        borderRadius: 18,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ECEEF1',
        padding: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.1,
        shadowRadius: 14,
        elevation: 8,
      }}
    >
      {showSavedText ? (
        <Text style={{ color: '#16A34A', fontSize: 12, fontWeight: '700', marginBottom: 8 }}>
          {lastSavedText}
        </Text>
      ) : null}

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Pressable
          onPress={onSaveDraft}
          hitSlop={8}
          style={({ pressed }) => ({
            flex: 1,
            height: 50,
            borderRadius: 14,
            borderWidth: 1.5,
            borderColor: '#FDBA74',
            backgroundColor: pressed ? '#FFF7ED' : '#FFFFFF',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: loading ? 0.7 : 1,
          })}
        >
          <Text style={{ color: '#C2410C', fontWeight: '800', fontSize: 16 }}>Save Draft</Text>
        </Pressable>

        <Pressable
          onPress={onPublish}
          disabled={disabledPublish || loading}
          style={({ pressed }) => ({
            flex: 1,
            height: 50,
            borderRadius: 14,
            backgroundColor: disabledPublish ? '#DDE1E7' : '#FF7A00',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: disabledPublish ? 1 : pressed ? 0.9 : 1,
          })}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ color: disabledPublish ? '#F8FAFC' : '#fff', fontWeight: '800', fontSize: 16 }}>
              {publishLabel}
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}
