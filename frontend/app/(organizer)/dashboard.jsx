import { Redirect } from 'expo-router';

export default function OrganizerDashboardRedirect() {
  return <Redirect href="/(organizer)/(tabs)" />;
}
