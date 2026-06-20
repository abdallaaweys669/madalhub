import { Redirect } from 'expo-router';

export default function OrganizerMyEventsRedirect() {
  return <Redirect href="/(organizer)/(tabs)/events" />;
}
