export const REPORT_ITEMS = [
  {
    slug: "members",
    label: "Members",
    description: "Sign-ups, gender mix, registrations, and searchable member directory.",
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
    description: "Events created, status mix, categories, top sign-ups, and event directory.",
    exportType: "events" as const,
  },
  {
    slug: "engagement",
    label: "Engagement",
    description: "Sign-ups, check-ins, attendance rates, and registration directory.",
    exportType: "registrations" as const,
  },
  {
    slug: "verification",
    label: "Verification",
    description: "Organizer identity review pipeline and queue health.",
    exportType: null,
  },
  {
    slug: "location",
    label: "Location",
    description: "Members and events grouped by area or city.",
    exportType: null,
  },
  {
    slug: "logs",
    label: "Logs",
    description: "Platform activity: sign-ups, events, registrations, credits, and moderation.",
    exportType: null,
  },
] as const;

/** Legacy report slugs → redirect target */
export const LEGACY_REPORT_REDIRECTS: Record<string, string> = {
  "user-growth": "/reports/members",
  registrations: "/reports/engagement",
  attendance: "/reports/engagement?tab=attendance",
  "popular-events": "/reports/events",
  revenue: "/payments",
  audience: "/reports/members",
};

export type ReportSlug = (typeof REPORT_ITEMS)[number]["slug"];

export function getReportConfig(slug: string) {
  if (slug === "user-growth") {
    return REPORT_ITEMS.find((r) => r.slug === "members") ?? null;
  }
  return REPORT_ITEMS.find((r) => r.slug === slug) ?? null;
}

export function isReportSlug(slug: string): slug is ReportSlug {
  return REPORT_ITEMS.some((r) => r.slug === slug);
}

export function getLegacyReportRedirect(slug: string): string | null {
  return LEGACY_REPORT_REDIRECTS[slug] ?? null;
}
