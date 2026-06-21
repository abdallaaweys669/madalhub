"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Download } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/page-header";
import ChartContainer from "@/components/ChartContainer";
import { AdminTableCard, ADMIN_TH } from "@/components/admin/admin-table-card";
import { ListPagination, ListToolbar } from "@/components/admin/list-toolbar";
import {
  getAdminReport,
  getReportSummary,
  listOrganizers,
  type OrganizerListRow,
  type ReportSummary,
} from "@/lib/api";
import { useAdminList } from "@/hooks/useAdminList";
import { getReportConfig } from "@/lib/reports";

const VERIFICATION_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "unverified", label: "Unverified" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

const ACTIVITY_OPTIONS = [
  { value: "all", label: "All organizers" },
  { value: "with-events", label: "With events" },
  { value: "no-events", label: "No events yet" },
];

function downloadCsv(filename: string, rows: Record<string, unknown>[]) {
  if (!rows.length) {
    toast.error("No rows to export");
    return;
  }
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = [headers.join(","), ...rows.map((r) => headers.map((h) => escape(r[h])).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function OrganizersReportView() {
  const config = getReportConfig("organizers")!;
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [appliedFrom, setAppliedFrom] = useState("");
  const [appliedTo, setAppliedTo] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summary, setSummary] = useState<ReportSummary | null>(null);

  const fetcher = useCallback(
    (params: Parameters<typeof listOrganizers>[0]) => listOrganizers(params),
    [],
  );
  const {
    searchInput,
    onSearchChange,
    status,
    onStatusChange,
    activity,
    onActivityChange,
    setPage,
    data,
    loading: listLoading,
  } = useAdminList<OrganizerListRow>(fetcher);

  useEffect(() => {
    let cancelled = false;
    setSummaryLoading(true);
    getReportSummary("organizers", appliedFrom || undefined, appliedTo || undefined)
      .then((result) => {
        if (!cancelled) setSummary(result);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          toast.error(err instanceof Error ? err.message : "Failed to load report");
          setSummary(null);
        }
      })
      .finally(() => {
        if (!cancelled) setSummaryLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [appliedFrom, appliedTo]);

  function applyRange() {
    setAppliedFrom(from);
    setAppliedTo(to);
  }

  const chartData = useMemo(
    () =>
      summary?.trendMonths.map((month, i) => ({
        month,
        value: summary.trendValues[i] ?? 0,
      })) ?? [],
    [summary],
  );

  async function handleExport() {
    try {
      const result = await getAdminReport("organizers", appliedFrom || undefined, appliedTo || undefined);
      downloadCsv("madalhub-organizers-report.csv", result.rows);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Export failed");
    }
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-6 p-4 md:p-6">
      <PageHeader title={config.label} description={config.description} />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Analytics date range</CardTitle>
          <CardDescription>Filters charts and KPIs. The organizer list below uses its own filters.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="space-y-2">
            <Label htmlFor="organizers-from">From</Label>
            <Input id="organizers-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="organizers-to">To</Label>
            <Input id="organizers-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <Button onClick={() => void applyRange()} disabled={summaryLoading}>
              {summaryLoading ? "Loading…" : "Apply"}
            </Button>
            <Button variant="outline" className="gap-1.5" onClick={() => void handleExport()}>
              <Download size={14} />
              Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryLoading
          ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
          : summary?.kpis.map((kpi) => (
              <Card key={kpi.key}>
                <CardHeader className="pb-2">
                  <CardDescription>{kpi.label}</CardDescription>
                  <CardTitle className="text-2xl tabular-nums">{kpi.value}</CardTitle>
                </CardHeader>
              </Card>
            ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Sign-ups trend</CardTitle>
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              <Skeleton className="h-[220px] w-full rounded-lg" />
            ) : (
              <ChartContainer className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height={220} minWidth={0} debounce={50}>
                  <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                    <defs>
                      <linearGradient id="organizersReportFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#FF7B3F" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="#FF7B3F" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#FF7B3F"
                      fill="url(#organizersReportFill)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Verification breakdown (in range)</CardTitle>
            <CardDescription>Status split for organizers who joined in the selected period.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {summaryLoading ? (
              <Skeleton className="h-32 w-full" />
            ) : (
              summary?.breakdown.map((item) => (
                <div key={item.label} className="flex items-center justify-between text-sm gap-2">
                  <span className="text-muted-foreground truncate capitalize">{item.label}</span>
                  <span className="font-medium tabular-nums shrink-0">{item.value.toLocaleString()}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {!summaryLoading && (summary?.topCreators?.length ?? 0) > 0 ? (
        <Card className="overflow-hidden py-0 min-w-0">
          <CardHeader className="border-b">
            <CardTitle className="text-base">Top creators in range</CardTitle>
            <CardDescription>Organizers with the most events created in the selected analytics period.</CardDescription>
          </CardHeader>
          <div className="max-h-[280px] overflow-auto">
            <Table className="table-fixed w-full">
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className={`${ADMIN_TH} w-[34%]`}>Organization</TableHead>
                  <TableHead className={`${ADMIN_TH} w-[34%]`}>Email</TableHead>
                  <TableHead className={`${ADMIN_TH} w-[12%]`}>Events</TableHead>
                  <TableHead className={`${ADMIN_TH} w-[20%]`}>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summary!.topCreators!.map((row, i) => (
                  <TableRow key={i}>
                    <TableCell className="truncate px-3 text-sm">{String(row.organization ?? "—")}</TableCell>
                    <TableCell className="truncate px-3 text-sm text-muted-foreground">{String(row.email ?? "—")}</TableCell>
                    <TableCell className="px-3 text-sm tabular-nums">{String(row.events ?? "0")}</TableCell>
                    <TableCell className="px-3">
                      <Badge variant="secondary" className="capitalize">
                        {String(row.status ?? "—")}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      ) : null}

      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">All organizers</h2>
          <p className="text-sm text-muted-foreground">
            Search and filter every organizer. Use Operations → Organizers for quick day-to-day lookup.
          </p>
        </div>

        <ListToolbar
          search={searchInput}
          onSearchChange={onSearchChange}
          searchPlaceholder="Search org name, email…"
          status={status}
          onStatusChange={onStatusChange}
          statusOptions={VERIFICATION_OPTIONS}
          statusLabel="Verification"
          activity={activity}
          onActivityChange={onActivityChange}
          activityOptions={ACTIVITY_OPTIONS}
          activityLabel="Activity"
        />

        <AdminTableCard
          footer={
            data ? (
              <div className="px-4 pb-4">
                <ListPagination
                  page={data.page}
                  totalPages={data.totalPages}
                  total={data.total}
                  onPageChange={setPage}
                />
              </div>
            ) : undefined
          }
        >
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className={`${ADMIN_TH} w-[22%]`}>Organization</TableHead>
              <TableHead className={`${ADMIN_TH} w-[24%]`}>Contact</TableHead>
              <TableHead className={`${ADMIN_TH} w-[14%]`}>Verification</TableHead>
              <TableHead className={`${ADMIN_TH} w-[10%]`}>Credits</TableHead>
              <TableHead className={`${ADMIN_TH} w-[10%]`}>Events</TableHead>
              <TableHead className={`${ADMIN_TH} w-[20%]`}>Joined</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {listLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <TableCell key={j} className="px-3">
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : !data?.items.length ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-16 text-muted-foreground">
                  No organizers match these filters
                </TableCell>
              </TableRow>
            ) : (
              data.items.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="max-w-0 px-3">
                    <p className="font-medium truncate" title={row.organizationName}>
                      {row.organizationName}
                    </p>
                    {row.website ? (
                      <p className="text-xs text-muted-foreground truncate" title={row.website}>
                        {row.website}
                      </p>
                    ) : null}
                  </TableCell>
                  <TableCell className="max-w-0 px-3">
                    <p className="text-sm truncate" title={row.fullName}>
                      {row.fullName}
                    </p>
                    <p className="text-xs text-muted-foreground truncate" title={row.email}>
                      {row.email}
                    </p>
                  </TableCell>
                  <TableCell className="px-3">
                    <Badge variant="secondary" className="capitalize bg-primary/10 text-primary border-0">
                      {row.verificationStatus}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm tabular-nums px-3">{row.paidPublishCredits}</TableCell>
                  <TableCell className="text-sm tabular-nums px-3">{row.eventCount ?? 0}</TableCell>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap px-3">
                    {new Date(row.createdAt).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </AdminTableCard>
      </div>
    </div>
  );
}
