import { notFound } from "next/navigation";
import ReportView from "@/components/admin/report-view";
import OrganizersReportView from "@/components/admin/organizers-report-view";
import { getReportConfig, isReportSlug } from "@/lib/reports";

type Props = { params: Promise<{ slug: string }> };

export default async function ReportSlugPage({ params }: Props) {
  const { slug } = await params;
  if (!isReportSlug(slug)) notFound();
  if (slug === "organizers") {
    return <OrganizersReportView />;
  }
  const config = getReportConfig(slug)!;
  return <ReportView key={slug} slug={slug} title={config.label} description={config.description} />;
}
