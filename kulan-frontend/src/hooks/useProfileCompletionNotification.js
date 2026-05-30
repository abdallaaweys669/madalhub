import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const NOTIF_ID_KEY = 'profile_completion_notif';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

async function requestPermissions() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('profile', {
      name: 'Profile Reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

async function cancelExisting() {
  const all = await Notifications.getAllScheduledNotificationsAsync();
  const mine = all.filter(n => n.content.data?.type === NOTIF_ID_KEY);
  await Promise.all(mine.map(n => Notifications.cancelScheduledNotificationAsync(n.identifier)));
}

async function scheduleHourly() {
  await cancelExisting();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '📱 Complete your profile',
      body: 'Add your phone number so event organizers can reach you.',
      sound: true,
      data: { type: NOTIF_ID_KEY },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 3600,
      repeats: true,
    },
  });
}

/**
 * Call this hook wherever auth is available (e.g. tabs layout).
 * Pass the raw phone string from the user object.
 * - If phone is empty  → requests permission + schedules hourly reminder
 * - If phone is filled → cancels all existing reminders
 */
export default function useProfileCompletionNotification(phone) {
  const scheduled = useRef(false);

  useEffect(() => {
    const phoneSet = typeof phone === 'string' && phone.trim().length > 0;

    if (phoneSet) {
      cancelExisting();
      scheduled.current = false;
      return;
    }

    if (scheduled.current) return;

    (async () => {
      const granted = await requestPermissions();
      if (!granted) return;
      await scheduleHourly();
      scheduled.current = true;
    })();
  }, [phone]);
}
