import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert, StatusBar, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Redirect, Stack, useFocusEffect } from 'expo-router';
import useGuardedRouter from '@/hooks/useGuardedRouter';
import useAuth from '@/auth/useAuth';
import authApi from '@/api/auth';
import { updateMemberMe } from '@/api/member';
import { useThemeColors } from '@/theme';
import { normalizeUser, coerceProfileVisibilityBool } from '@/auth/normalizeUser';
import SignOutButton from '@/components/auth/SignOutButton';

const SettingItem = ({ icon, name, isSwitch, value, onValueChange, onPress, colors }) => (
  <TouchableOpacity onPress={onPress} disabled={!onPress} style={[styles.item, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
    <View style={styles.itemLeft}>
      <Feather name={icon} size={22} color={colors.icon} />
      <Text style={[styles.itemText, { color: colors.text }]}>{name}</Text>
    </View>
    {isSwitch ? (
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.border, true: '#FFD7BC' }}
        thumbColor={value ? '#FF7A00' : '#f4f3f4'}
      />
    ) : (
      onPress && <Feather name="chevron-right" size={22} color={colors.textSecondary} />
    )}
  </TouchableOpacity>
);

const SettingsScreen = () => {
  const router = useGuardedRouter();
  const colors = useThemeColors();
  const { user, setUser, isLoggedIn, isHydrated } = useAuth();
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [isUpdatingPrivacy, setIsUpdatingPrivacy] = useState(false);

  const refreshUser = useCallback(async () => {
    try {
      const me = await authApi.getMe();
      setUser((prev) => (prev ? normalizeUser(prev, me) : prev));
    } catch {
      /* ignore */
    }
  }, [setUser]);

  useFocusEffect(
    useCallback(() => {
      if (isUpdatingPrivacy) return;
      refreshUser();
    }, [refreshUser, isUpdatingPrivacy]),
  );

  const showEmail = coerceProfileVisibilityBool(user?.profileShowEmail ?? user?.profile_show_email, true);
  const showPhone = coerceProfileVisibilityBool(user?.profileShowPhone ?? user?.profile_show_phone, true);
  const hideProfile = coerceProfileVisibilityBool(user?.profileHidden ?? user?.profile_hidden, false);

  const onToggleProfileEmail = async (next) => {
    const previousUser = user;
    setUser((prev) => (prev ? { ...prev, profile_show_email: next, profileShowEmail: next } : prev));
    try {
      await updateMemberMe({ profile_show_email: next });
    } catch (e) {
      setUser(previousUser);
      Alert.alert('Could not update', e?.message || 'Try again.');
    }
  };

  const onToggleProfilePhone = async (next) => {
    const previousUser = user;
    setUser((prev) => (prev ? { ...prev, profile_show_phone: next, profileShowPhone: next } : prev));
    try {
      await updateMemberMe({ profile_show_phone: next });
    } catch (e) {
      setUser(previousUser);
      Alert.alert('Could not update', e?.message || 'Try again.');
    }
  };

  const onToggleProfileHidden = async (next) => {
    setIsUpdatingPrivacy(true);
    const previousUser = user;
    setUser((prev) => (prev ? { ...prev, profile_hidden: next, profileHidden: next } : prev));
    try {
      await updateMemberMe({ profile_hidden: next });
    } catch (e) {
      setUser(previousUser);
      Alert.alert('Could not update', e?.message || 'Try again.');
    } finally {
      setIsUpdatingPrivacy(false);
    }
  };

  if (isHydrated && !isLoggedIn) {
    return <Redirect href="/(auth)/welcome" />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.backgroundMuted }]}>
      <Stack.Screen options={{ title: 'Settings', headerBackTitle: 'Profile' }} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Account</Text>
          <SettingItem icon="edit-3" name="Edit Profile" colors={colors} onPress={() => router.push('/(modal)/editProfile')} />
          <SettingItem icon="lock" name="Change Password" colors={colors} onPress={() => router.push('/(modal)/changePassword')} />
          <SettingItem icon="star" name="Manage Interests" colors={colors} onPress={() => router.push('/(modal)/manageInterests')} />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Privacy</Text>
          <Text style={[styles.privacyIntro, { color: colors.textSecondary }]}>
            Choose whether other members and organizers can see your email or phone on your public profile.
          </Text>
          <SettingItem
            icon="mail"
            name="Show email on profile"
            colors={colors}
            isSwitch
            value={showEmail}
            onValueChange={onToggleProfileEmail}
          />
          <SettingItem
            icon="phone"
            name="Show phone on profile"
            colors={colors}
            isSwitch
            value={showPhone}
            onValueChange={onToggleProfilePhone}
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Anonymous Attendance</Text>
          <Text style={[styles.privacyIntro, { color: colors.textSecondary }]}>
            When enabled, other members will see you anonymously in event attendee lists. Your real name and photo will be hidden from non-organizers.
          </Text>
          <View style={[styles.hideProfileItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.hideProfileItemLeft}>
              <View style={[styles.hideProfileIconWrap, hideProfile ? { backgroundColor: '#FFF1E6' } : { backgroundColor: colors.backgroundMuted }]}>
                <Feather name={hideProfile ? 'eye-off' : 'eye'} size={20} color={hideProfile ? '#FF7A00' : colors.textSecondary} />
              </View>
              <View style={styles.hideProfileTextCol}>
                <Text style={[styles.hideProfileTitle, { color: colors.text }]}>Hide My Profile</Text>
                <Text style={[styles.hideProfileSubtitle, { color: colors.textSecondary }]}>
                  {hideProfile
                    ? 'You appear as "Anonymous Member" to other attendees'
                    : 'Other members can see your full profile'}
                </Text>
                {isUpdatingPrivacy ? (
                  <ActivityIndicator size="small" color="#FF7A00" style={{ marginTop: 4, alignSelf: 'flex-start' }} />
                ) : null}
              </View>
            </View>
            <Switch
              value={hideProfile}
              onValueChange={onToggleProfileHidden}
              trackColor={{ false: colors.border, true: '#FFD7BC' }}
              thumbColor={hideProfile ? '#FF7A00' : '#f4f3f4'}
              disabled={isUpdatingPrivacy}
            />
          </View>
          {hideProfile ? (
            <View style={[styles.anonymousPreview, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.anonymousPreviewRow}>
                <View style={[styles.anonymousAvatar, { backgroundColor: '#9CA3AF' }]}>
                  <Feather name="user" size={14} color="#FFFFFF" />
                </View>
                <View style={styles.anonymousPreviewTextCol}>
                  <Text style={[styles.anonymousPreviewName, { color: colors.textSecondary }]}>Anonymous Member</Text>
                  <Text style={[styles.anonymousPreviewLabel, { color: colors.textMuted }]}>How others see you in events</Text>
                </View>
              </View>
            </View>
          ) : null}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Notifications</Text>
          <SettingItem
            icon="bell"
            name="Push Notifications"
            colors={colors}
            isSwitch
            value={pushNotifications}
            onValueChange={setPushNotifications}
          />
          <SettingItem
            icon="mail"
            name="Email Notifications"
            colors={colors}
            isSwitch
            value={emailNotifications}
            onValueChange={setEmailNotifications}
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Support & Legal</Text>
          <SettingItem icon="help-circle" name="Help Center" colors={colors} onPress={() => router.push('/(modal)/helpCenter')} />
          <SettingItem icon="file-text" name="Terms of Service" colors={colors} onPress={() => router.push('/(modal)/termsOfService')} />
          <SettingItem icon="shield" name="Privacy Policy" colors={colors} onPress={() => router.push('/(modal)/privacyPolicy')} />
        </View>

        <View style={styles.section}>
          <SignOutButton />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: StatusBar.currentHeight || 0,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  section: {
    marginTop: 20,
    marginBottom: 10,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  privacyIntro: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
    marginTop: -4,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  itemText: {
    fontSize: 16,
    marginLeft: 15,
    flexShrink: 1,
  },
  hideProfileItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  hideProfileItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  hideProfileIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hideProfileTextCol: {
    flex: 1,
    marginLeft: 14,
    minWidth: 0,
  },
  hideProfileTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  hideProfileSubtitle: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
  anonymousPreview: {
    marginTop: 10,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  anonymousPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  anonymousAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  anonymousPreviewTextCol: {
    marginLeft: 12,
    flex: 1,
  },
  anonymousPreviewName: {
    fontSize: 14,
    fontWeight: '600',
  },
  anonymousPreviewLabel: {
    fontSize: 11,
    marginTop: 1,
  },
});

export default SettingsScreen;
