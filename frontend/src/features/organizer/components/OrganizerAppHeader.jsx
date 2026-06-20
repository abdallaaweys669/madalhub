import React from 'react';
import { Pressable, Text, View } from 'react-native';
import useGuardedRouter from '@/hooks/useGuardedRouter';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/theme';

export default function OrganizerAppHeader({
  title,
  unreadCount = 0,
  onMenuPress,
  showBell = true,
}) {
  const router = useGuardedRouter();
  const colors = useThemeColors();
  const badge = unreadCount > 0 ? (unreadCount > 9 ? '9+' : String(unreadCount)) : null;

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
