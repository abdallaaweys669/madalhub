import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { getEventAttendees } from '@/api/events';

function Avatar({ avatarUrl }) {
  if (avatarUrl) {
    return <Image source={{ uri: avatarUrl }} style={{ width: 38, height: 38, borderRadius: 19, marginRight: 10 }} />;
  }

  return (
    <View
      style={{
        width: 38,
        height: 38,
        borderRadius: 19,
        marginRight: 10,
        backgroundColor: '#9CA3AF',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Feather name="user" size={16} color="#FFFFFF" />
    </View>
  );
}

export default function EventAttendeesScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const eventId = Array.isArray(id) ? id[0] : id;
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let mounted = true;

    const loadAttendees = async () => {
      if (!eventId) {
        setItems([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setLoadError('');
      try {
        const payload = await getEventAttendees(eventId, { page: 1, limit: 100 });
        if (!mounted) return;
        setItems(Array.isArray(payload?.items) ? payload.items : []);
      } catch {
        if (!mounted) return;
        setLoadError('Could not load attendees right now.');
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    loadAttendees();
    return () => {
      mounted = false;
    };
  }, [eventId]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F7F8FA', paddingHorizontal: 16 }}>
      <TouchableOpacity
        onPress={() => router.back()}
        style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center', marginTop: 4 }}
      >
        <Feather name="arrow-left" size={22} color="#1F2937" />
      </TouchableOpacity>
      <Text
        style={{
          fontSize: 22,
          fontWeight: '700',
          color: '#1F2937',
          marginTop: 6,
          marginBottom: 14,
        }}
      >
        Members going
      </Text>
      <Text style={{ fontSize: 13, color: '#8B93A1', marginBottom: 14 }}>
        Event #{id}
      </Text>
      {isLoading ? (
        <View style={{ paddingVertical: 30 }}>
          <ActivityIndicator size="small" color="#FF7A00" />
        </View>
      ) : null}
      {!isLoading && loadError ? (
        <Text style={{ fontSize: 14, color: '#9CA3AF' }}>{loadError}</Text>
      ) : null}
      <FlatList
        data={items}
        keyExtractor={(item, index) => (item?.id != null ? String(item.id) : `attendee-${index}`)}
        ListEmptyComponent={
          !isLoading && !loadError ? (
            <Text style={{ fontSize: 14, color: '#9CA3AF' }}>No attendees yet.</Text>
          ) : null
        }
        renderItem={({ item }) => (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 10,
            }}
          >
            <Avatar avatarUrl={item?.avatarUrl} />
            <Text style={{ fontSize: 15, color: '#2D3440', fontWeight: '600' }}>
              {item?.name || 'Member'}
            </Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

