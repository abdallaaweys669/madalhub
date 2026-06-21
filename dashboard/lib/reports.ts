export const REPORT_ITEMS = [
  {
    slug: "user-growth",
    label: "User growth",
    description: "Member sign-ups, active users, and growth trends.",
    exportType: "members" as const,
  },
  {
    slug: "organizers",
    label: "Organizers",
    description: "Organizer analytics, filters, and full directory with event counts.",
    exportType: "organizers" as const,
  },
  {
    slug: "events",
    label: "Events",
    description: "Events created, published vs draft, and categories.",
    exportType: "events" as const,
  },
  {
    slug: "registrations",
    label: "Registrations",
    description: "Event sign-ups and registration status breakdown.",
    exportType: "registrations" as const,
  },
  {
    slug: "attendance",
    label: "Attendance",
    description: "QR check-ins, attendance rate, and no-shows.",
    exportType: "registrations" as const,
  },
  {
    slug: "revenue",
    label: "Revenue",
    description: "Publish credit payments and approved revenue.",
    exportType: "revenue" as const,
  },
  {
    slug: "verification",
    label: "Verification",
    description: "Organizer identity review pipeline.",
    exportType: null,
  },
  {
    slug: "popular-events",
    label: "Popular events",
    description: "Most registered events in the selected period.",
    exportType: "registrations" as const,
  },
  {
    slug: "audience",
    label: "Audience",
    description: "Male, female, and open-audience event performance.",
    exportType: "events" as const,
  },
  {
    slug: "location",
    label: "Location",
    description: "Members and events by area.",
    exportType: null,
  },
  {
    slug: "logs",
    label: "Logs",
    description: "Admin activity: credits, payments, suspensions, and event cancellations.",
    exportType: null,
  },
] as const;

export type ReportSlug = (typeof REPORT_ITEMS)[number]["slug"];

export function getReportConfig(slug: string) {
  return REPORT_ITEMS.find((r) => r.slug === slug) ?? null;
}

export function isReportSlug(slug: string): slug is ReportSlug {
  return REPORT_ITEMS.some((r) => r.slug === slug);
}
