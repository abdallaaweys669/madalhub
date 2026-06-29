import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import OrganizersReportView from "@/components/admin/organizers-report-view";
import MembersReportView from "@/components/admin/members-report-view";
import EventsReportView from "@/components/admin/events-report-view";
import EngagementReportView from "@/components/admin/engagement-report-view";
import VerificationReportView from "@/components/admin/verification-report-view";
import LocationReportView from "@/components/admin/location-report-view";
import LogsReportView from "@/components/admin/logs-report-view";
import { getLegacyReportRedirect, isReportSlug } from "@/lib/reports";

type Props = { params: Promise<{ slug: string }> };

export default async function ReportSlugPage({ params }: Props) {
  const { slug } = await params;

  const legacy = getLegacyReportRedirect(slug);
  if (legacy) {
    redirect(legacy);
  }

  if (!isReportSlug(slug)) notFound();

  switch (slug) {
    case "members":
      return <MembersReportView />;
    case "organizers":
      return <OrganizersReportView />;
    case "events":
      return <EventsReportView />;
    case "engagement":
      return (
        <Suspense fallback={null}>
          <EngagementReportView />
        </Suspense>
      );
    case "verification":
      return <VerificationReportView />;
    case "location":
      return <LocationReportView />;
    case "logs":
      return <LogsReportView />;
    default:
      notFound();
  }
}
