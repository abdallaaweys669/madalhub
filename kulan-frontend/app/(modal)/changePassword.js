import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '@/theme/colors';
import { changeOrganizerPassword } from '@/api/organizer';

export default function ChangePasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChangePassword = async () => {
    setError('');
    setSuccess('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('All fields are required.');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    setSaving(true);
    try {
      await changeOrganizerPassword(currentPassword, newPassword);
      setSuccess('Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => router.back(), 1500);
    } catch (e) {
      setError(e?.message || 'Failed to change password. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const inputWrapper = {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingHorizontal: 16,
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: COLORS.background }}
    >
      <Stack.Screen options={{ title: 'Change Password', headerShown: false }} />

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 40,
        }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 32 }}>
          <Pressable onPress={() => router.back()} style={{ padding: 4, marginRight: 12 }} hitSlop={12}>
            <Feather name="x" size={24} color={COLORS.textPrimary} />
          </Pressable>
          <Text style={{ fontSize: 20, fontWeight: '800', color: COLORS.textPrimary }}>Change Password</Text>
        </View>

        {/* Info Box — branded with COLORS tokens */}
        <View
          style={{
            backgroundColor: COLORS.panel,
            borderRadius: 14,
            padding: 16,
            marginBottom: 28,
            flexDirection: 'row',
            alignItems: 'flex-start',
            borderWidth: 1,
            borderColor: COLORS.primaryBorder,
          }}
        >
          <Feather name="info" size={20} color={COLORS.primary} style={{ marginRight: 12, marginTop: 2 }} />
          <Text style={{ flex: 1, fontSize: 14, lineHeight: 20, color: COLORS.textPrimary }}>
            Choose a strong password that you haven't used before. It must be at least 6 characters long.
          </Text>
        </View>

        {/* Current Password */}
        <View style={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 8 }}>Current Password</Text>
          <View style={[inputWrapper, { paddingVertical: 0 }]}>
            <TextInput
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Enter current password"
              placeholderTextColor={COLORS.textMuted}
              secureTextEntry={!showCurrent}
              style={{ flex: 1, fontSize: 16, color: COLORS.textPrimary, paddingVertical: 14 }}
              autoCapitalize="none"
            />
            <Pressable onPress={() => setShowCurrent(!showCurrent)} style={{ padding: 4 }} hitSlop={8}>
              <Feather name={showCurrent ? 'eye-off' : 'eye'} size={20} color={COLORS.textMuted} />
            </Pressable>
          </View>
        </View>

        {/* New Password */}
        <View style={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 8 }}>New Password</Text>
          <View style={[inputWrapper, { paddingVertical: 0 }]}>
            <TextInput
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Enter new password"
              placeholderTextColor={COLORS.textMuted}
              secureTextEntry={!showNew}
              style={{ flex: 1, fontSize: 16, color: COLORS.textPrimary, paddingVertical: 14 }}
              autoCapitalize="none"
            />
            <Pressable onPress={() => setShowNew(!showNew)} style={{ padding: 4 }} hitSlop={8}>
              <Feather name={showNew ? 'eye-off' : 'eye'} size={20} color={COLORS.textMuted} />
            </Pressable>
          </View>
        </View>

        {/* Confirm Password */}
        <View style={{ marginBottom: 28 }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 8 }}>Confirm New Password</Text>
          <View style={[inputWrapper, { paddingVertical: 0 }]}>
            <TextInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm new password"
              placeholderTextColor={COLORS.textMuted}
              secureTextEntry={!showConfirm}
              style={{ flex: 1, fontSize: 16, color: COLORS.textPrimary, paddingVertical: 14 }}
              autoCapitalize="none"
            />
            <Pressable onPress={() => setShowConfirm(!showConfirm)} style={{ padding: 4 }} hitSlop={8}>
              <Feather name={showConfirm ? 'eye-off' : 'eye'} size={20} color={COLORS.textMuted} />
            </Pressable>
          </View>
        </View>

        {/* Error Banner */}
        {error ? (
          <View
            style={{
              backgroundColor: '#FEF2F2',
              borderRadius: 12,
              padding: 14,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: '#FECACA',
            }}
          >
            <Text style={{ color: COLORS.danger, fontSize: 14, textAlign: 'center', fontWeight: '600' }}>{error}</Text>
          </View>
        ) : null}

        {/* Success Banner */}
        {success ? (
          <View
            style={{
              backgroundColor: '#ECFDF5',
              borderRadius: 12,
              padding: 14,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: '#A7F3D0',
            }}
          >
            <Text style={{ color: COLORS.success, fontSize: 14, textAlign: 'center', fontWeight: '600' }}>{success}</Text>
          </View>
        ) : null}

        {/* Submit */}
        <Pressable
          onPress={handleChangePassword}
          disabled={saving}
          style={({ pressed }) => ({
            backgroundColor: COLORS.primary,
            borderRadius: 14,
            paddingVertical: 16,
            alignItems: 'center',
            opacity: saving ? 0.6 : pressed ? 0.9 : 1,
            shadowColor: COLORS.primary,
            shadowOpacity: 0.3,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 4 },
            elevation: 4,
          })}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 16 }}>Change Password</Text>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
