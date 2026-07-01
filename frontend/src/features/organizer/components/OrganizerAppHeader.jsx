import React, { useCallback, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import useGuardedRouter from '@/hooks/useGuardedRouter';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/theme';
import { getTimeGreeting } from '@/features/organizer/utils/organizerHomeUtils';

function useTimeGreeting() {
  const [greeting, setGreeting] = useState(() => getTimeGreeting());

  useFocusEffect(
    useCallback(() => {
      setGreeting(getTimeGreeting());
    }, []),
  );

  return greeting;
}

export default function OrganizerAppHeader({
  title,
  orgName,
  orgTypeLabel,
  unreadCount = 0,
  onMenuPress,
  showBell = true,
  homeMode = false,
}) {
  const router = useGuardedRouter();
  const colors = useThemeColors();
  const timeGreeting = useTimeGreeting();
  const badge = unreadCount > 0 ? (unreadCount > 9 ? '9+' : String(unreadCount)) : null;

  if (homeMode && orgName) {
    return (
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 14,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: '#E7E7EA',
          backgroundColor: '#FFFFFF',
        }}
      >
        <Pressable onPress={onMenuPress} hitSlop={10} style={{ padding: 4, marginRight: 8 }}>
          <Ionicons name="menu" size={24} color={colors.textPrimary} />
        </Pressable>

        <View style={{ flex: 1, paddingRight: 8 }}>
          <Text style={{ fontSize: 13, color: '#64748B', fontWeight: '600' }}>
            {timeGreeting.text}! {timeGreeting.emoji}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
            <Text
              style={{ fontSize: 18, fontWeight: '800', color: colors.textPrimary, flexShrink: 1 }}
              numberOfLines={1}
            >
              {orgName}
            </Text>
            <Ionicons name="chevron-down" size={16} color="#94A3B8" style={{ marginLeft: 4 }} />
          </View>
          {orgTypeLabel ? (
            <View
              style={{
                alignSelf: 'flex-start',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                marginTop: 6,
                backgroundColor: '#FFF7ED',
                borderRadius: 999,
                paddingHorizontal: 10,
                paddingVertical: 4,
              }}
            >
              <Ionicons name="school-outline" size={12} color="#EA580C" />
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#C2410C' }} numberOfLines={1}>
                {orgTypeLabel}
              </Text>
            </View>
          ) : null}
        </View>

        {showBell ? (
          <Pressable
            onPress={() => router.push('/(organizer)/(tabs)/inbox')}
            hitSlop={10}
            style={{ padding: 4, position: 'relative' }}
          >
            <Ionicons name="notifications-outline" size={23} color={colors.textPrimary} />
            {badge ? (
              <View
                style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  minWidth: 16,
                  height: 16,
                  borderRadius: 8,
                  backgroundColor: '#FF7B3F',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingHorizontal: 3,
                }}
              >
                <Text style={{ color: '#fff', fontSize: 10, fontWeight: '800' }}>{badge}</Text>
              </View>
            ) : null}
          </Pressable>
        ) : (
          <View style={{ width: 31 }} />
        )}
      </View>
    );
  }

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#E7E7EA',
        backgroundColor: '#FFFFFF',
      }}
    >
      <Pressable onPress={onMenuPress} hitSlop={10} style={{ padding: 4 }}>
        <Ionicons name="menu" size={24} color={colors.textPrimary} />
      </Pressable>
      <Text
        style={{
          flex: 1,
          textAlign: 'center',
          fontSize: 17,
          fontWeight: '800',
          color: colors.textPrimary,
          paddingHorizontal: 8,
        }}
        numberOfLines={1}
      >
        {title}
      </Text>
      {showBell ? (
        <Pressable
          onPress={() => router.push('/(organizer)/(tabs)/inbox')}
          hitSlop={10}
          style={{ padding: 4, position: 'relative' }}
        >
          <Ionicons name="notifications-outline" size={23} color={colors.textPrimary} />
          {badge ? (
            <View
              style={{
                position: 'absolute',
                top: 0,
                right: 0,
                minWidth: 16,
                height: 16,
                borderRadius: 8,
                backgroundColor: '#E53E3E',
                alignItems: 'center',
                justifyContent: 'center',
                paddingHorizontal: 3,
              }}
            >
              <Text style={{ color: '#fff', fontSize: 10, fontWeight: '800' }}>{badge}</Text>
            </View>
          ) : null}
        </Pressable>
      ) : (
        <View style={{ width: 31 }} />
      )}
    </View>
  );
}
