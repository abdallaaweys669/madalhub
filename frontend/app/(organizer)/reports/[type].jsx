import React from 'react';
import { Redirect, useLocalSearchParams } from 'expo-router';

import OrganizerReportScreen from '@/features/organizer/screens/OrganizerReportScreen';
import { ORGANIZER_REPORT_TYPES } from '@/constants/organizerReports';

export default function OrganizerReportRoute() {
  const { type } = useLocalSearchParams();
  const reportType = Array.isArray(type) ? type[0] : type;

  if (!reportType || !ORGANIZER_REPORT_TYPES[reportType]) {
    return <Redirect href="/(organizer)/reports/overview" />;
  }

  return <OrganizerReportScreen reportType={reportType} />;
}
