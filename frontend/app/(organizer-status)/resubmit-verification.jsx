/**
 * Deprecated: old long-form resubmit screen.
 * Now redirects to the new resubmit-summary → wizard flow.
 */
import { Redirect } from 'expo-router';

export default function ResubmitVerificationRedirect() {
  return <Redirect href="/(organizer-status)/resubmit-summary" />;
}
