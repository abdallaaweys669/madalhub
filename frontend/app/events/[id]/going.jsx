import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import useGuardedRouter from '@/hooks/useGuardedRouter';

/** Legacy route — confirmation screen removed; ticket is the full-screen route. */
export default function EventGoingRedirect() {
  const { id } = useLocalSearchParams();
  const router = useGuardedRouter();
  const eventId = Array.isArray(id) ? id[0] : id;

  useEffect(() => {
    if (eventId) {
      router.replace(`/events/${eventId}/ticket`);
    } else {
      router.back();
    }
  }, [eventId, router]);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Stack.Screen options={{ headerShown: false }} />
      <ActivityIndicator color="#FF7B3F" />
    </View>
  );
}
