"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { CalendarDays } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
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
import { AdminTableCard, ADMIN_TH, TruncateCell } from "@/components/admin/admin-table-card";
import { ListPagination, ListToolbar } from "@/components/admin/list-toolbar";
import { ReportExportButtons } from "@/components/admin/report-export-buttons";
import {
  getAdminReport,
  getReportSummary,
  listEvents,
  type EventListRow,
  type ReportSummary,
} from "@/lib/api";
import { useAdminList } from "@/hooks/useAdminList";
import { getReportConfig } from "@/lib/reports";
import { DATE_PRESETS, defaultDateRange, rangeFromPreset } from "@/lib/report-dates";
import { downloadReportCsv, type ReportDocumentPayload } from "@/lib/report-export";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "published", label: "Published" },
  { value: "draft", label: "Draft" },
  { value: "cancelled", label: "Cancelled" },
];

const STATUS_CHART_COLORS: Record<string, string> = {
  published: "#22C55E",
  draft: "#F59E0B",
  cancelled: "#EF4444",
  unknown: "#94A3B8",
};

function capitalizeStatus(value: string) {
  if (!value) return "Unknown";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export default function EventsReportView() {
  const config = getReportConfig("events")!;
  const initialRange = useMemo(() => defaultDateRange(), []);

  const [from, setFrom] = useState(initialRange.from);
  const [to, setTo] = useState(initialRange.to);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summary, setSummary] = useState<ReportSummary | null>(null);

  const dateRangeValid = !from || !to || from <= to;

  const fetcher = useCallback(
    (params: Parameters<typeof listEvents>[0]) =>
      listEvents({
        ...params,
        joinedFrom: dateRangeValid ? from || undefined : undefined,
        joinedTo: dateRangeValid ? to || undefined : undefined,
      }),
    [from, to, dateRangeValid],
  );

  const {
    searchInput,
    onSearchChange,
    status,
    onStatusChange,
    setPage,
    data,
    loading: listLoading,
  } = useAdminList<EventListRow>(fetcher);

  useEffect(() => {
    if (!dateRangeValid) return;
    let cancelled = false;
    setSummaryLoading(true);
    getReportSummary("events", from || undefined, to || undefined)
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
  }, [from, to, dateRangeValid]);

  function applyPreset(preset: (typeof DATE_PRESETS)[number]) {
    const range = rangeFromPreset(preset);
    setFrom(range.from);
    setTo(range.to);
    setPage(1);
  }

  const chartData = useMemo(
    () =>
      summary?.trendMonths.map((month, i) => ({
        month,
        value: summary.trendValues[i] ?? 0,
      })) ?? [],
    [summary],
  );

  const statusPie = useMemo(
    () =>
      (summary?.breakdown ?? []).map((item) => ({
        name: capitalizeStatus(item.label),
        key: item.label?.toLowerCase() || "unknown",
        value: item.value,
      })),
    [summary],
  );

  const statusTotal = statusPie.reduce((s, r) => s + r.value, 0);
  const categoryRows = summary?.categoryBreakdown ?? [];

  async function handleExportCsv() {
    const result = await getAdminReport("events", from || undefined, to || undefined);
    downloadReportCsv("madalhub-events-report.csv", result.rows);
  }

  async function buildDocument(): Promise<ReportDocumentPayload | null> {
    if (!dateRangeValid) return null;
    const result = await getAdminReport("events", from || undefined, to || undefined);
    const statusLabel = STATUS_OPTIONS.find((o) => o.value === status)?.label ?? "All statuses";
    return {
      filename: "madalhub-events-report",
      title: "Events Report",
      filterLines: [
        `Period: ${from} → ${to}`,
        ...(status !== "all" ? [`Table filter — status: ${statusLabel}`] : []),
        ...(searchInput.trim() ? [`Search: ${searchInput.trim()}`] : []),
      ],
      kpis: (summary?.kpis ?? []).map((k) => ({ label: k.label, value: k.value })),
      breakdown: statusPie.map((b) => ({ label: b.name, value: b.value })),
      columns: ["Title", "Organizer", "Status", "Registrations", "Start", "Created"],
      rows: result.rows.map((r) => [
        String(r.title ?? ""),
        String(r.organizerName ?? ""),
        capitalizeStatus(String(r.status ?? "")),
        String(r.registrationCount ?? 0),
        r.startDatetime ? new Date(String(r.startDatetime)).toLocaleDateString() : "",
        r.createdAt ? new Date(String(r.createdAt)).toLocaleDateString() : "",
      ]),
    };
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-6 p-4 md:p-6">
      <PageHeader
        title={config.label}
        description={config.description}
        actions={
          <div className="hidden sm:flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary">
            <CalendarDays size={16} />
            Event analytics
          </div>
        }
      />

      <Card className="border-primary/10 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filters</CardTitle>
          <CardDescription>
            Charts and directory update when dates change. Search and status filter the table below.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            {DATE_PRESETS.map((preset) => (
              <Button
                key={preset.label}
                type="button"
                variant="outline"
                size="sm"
                className="h-8 rounded-full px-3 text-xs"
                onClick={() => applyPreset(preset)}
              >
                {preset.label}
              </Button>
            ))}
          </div>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:flex-wrap">
            <div className="space-y-2">
              <Label htmlFor="events-from">From</Label>
              <Input
                id="events-from"
                type="date"
                value={from}
                onChange={(e) => {
                  setFrom(e.target.value);
                  setPage(1);
                }}
                className="w-full sm:w-[160px]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="events-to">To</Label>
              <Input
                id="events-to"
                type="date"
                value={to}
                onChange={(e) => {
                  setTo(e.target.value);
                  setPage(1);
                }}
                className="w-full sm:w-[160px]"
              />
            </div>
            <ReportExportButtons
              onExportCsv={handleExportCsv}
              buildDocument={buildDocument}
              csvDisabled={!dateRangeValid}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {summaryLoading
          ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)
          : summary?.kpis.map((kpi, index) => (
              <Card
                key={kpi.key}
                className={cn(
                  "overflow-hidden",
                  index === 0 && "border-primary/20 bg-gradient-to-br from-primary/5 to-transparent",
                )}
              >
                <CardHeader className="pb-2">
                  <CardDescription>{kpi.label}</CardDescription>
                  <CardTitle className="text-3xl tabular-nums tracking-tight">{kpi.value}</CardTitle>
                </CardHeader>
              </Card>
            ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Events created</CardTitle>
            <CardDescription>New events per month in the selected period</CardDescription>
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              <Skeleton className="h-[240px] w-full rounded-lg" />
            ) : (
              <ChartContainer className="h-[240px] w-full">
                <ResponsiveContainer width="100%" height={240} minWidth={0} debounce={50}>
                  <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                    <defs>
                      <linearGradient id="eventsReportFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#FF7B3F" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#FF7B3F" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                    <Area type="monotone" dataKey="value" stroke="#FF7B3F" fill="url(#eventsReportFill)" strokeWidth={2.5} />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Status mix</CardTitle>
            <CardDescription>Events created in this period</CardDescription>
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              <Skeleton className="h-[240px] w-full" />
            ) : statusPie.length === 0 ? (
              <p className="text-sm text-muted-foreground py-16 text-center">No events in this period</p>
            ) : (
              <div className="flex flex-col gap-4">
                <ChartContainer className="h-[160px] w-full">
                  <ResponsiveContainer width="100%" height={160} minWidth={0}>
                    <PieChart>
                      <Pie data={statusPie} dataKey="value" nameKey="name" innerRadius={48} outerRadius={72} paddingAngle={2}>
                        {statusPie.map((entry) => (
                          <Cell key={entry.key} fill={STATUS_CHART_COLORS[entry.key] ?? STATUS_CHART_COLORS.unknown} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
                <div className="space-y-2">
                  {statusPie.map((item) => {
                    const pct = statusTotal > 0 ? Math.round((item.value / statusTotal) * 100) : 0;
                    const color = STATUS_CHART_COLORS[item.key] ?? STATUS_CHART_COLORS.unknown;
                    return (
                      <div key={item.key} className="flex items-center justify-between text-sm gap-2">
                        <span className="flex items-center gap-2 text-muted-foreground">
                          <span className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                          {item.name}
                        </span>
                        <span className="font-medium tabular-nums">
                          {item.value} · {pct}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {!summaryLoading && categoryRows.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Categories</CardTitle>
            <CardDescription>Events by interest category in the selected period</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {categoryRows.map((item) => {
              const max = Math.max(...categoryRows.map((c) => c.value), 1);
              return (
                <div key={item.label} className="space-y-1">
                  <div className="flex justify-between text-sm gap-2">
                    <span className="text-muted-foreground truncate">{item.label}</span>
                    <span className="font-medium tabular-nums shrink-0">{item.value}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary/80 transition-all"
                      style={{ width: `${Math.round((item.value / max) * 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      ) : null}

      {!summaryLoading && (summary?.topEvents?.length ?? 0) > 0 ? (
        <Card className="overflow-hidden py-0 min-w-0">
          <CardHeader className="border-b">
            <CardTitle className="text-base">Top events by sign-ups</CardTitle>
            <CardDescription>Most registered events in the selected period</CardDescription>
          </CardHeader>
          <div className="max-h-[280px] overflow-auto">
            <Table className="table-fixed w-full">
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className={`${ADMIN_TH} w-[50%]`}>Event</TableHead>
                  <TableHead className={`${ADMIN_TH} w-[20%]`}>Status</TableHead>
                  <TableHead className={`${ADMIN_TH} w-[30%]`}>Sign-ups</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summary!.topEvents!.map((row, i) => (
                  <TableRow key={i}>
                    <TableCell className="truncate px-3 text-sm font-medium">{String(row.title ?? "—")}</TableCell>
                    <TableCell className="px-3">
                      <Badge variant="secondary" className="capitalize">
                        {String(row.status ?? "—")}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-3 text-sm tabular-nums font-medium">{String(row.registrations ?? 0)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      ) : null}

      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Event directory</h2>
          <p className="text-sm text-muted-foreground">Search and filter events created in the selected period.</p>
        </div>
        <ListToolbar
          search={searchInput}
          onSearchChange={onSearchChange}
          searchPlaceholder="Search title or location…"
          status={status}
          onStatusChange={onStatusChange}
          statusOptions={STATUS_OPTIONS}
          statusLabel="Status"
        />
        <AdminTableCard
          footer={
            data ? (
              <div className="px-4 pb-4">
                <ListPagination page={data.page} totalPages={data.totalPages} total={data.total} onPageChange={setPage} />
              </div>
            ) : undefined
          }
        >
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className={`${ADMIN_TH} w-[28%]`}>Event</TableHead>
              <TableHead className={`${ADMIN_TH} w-[18%]`}>Organizer</TableHead>
              <TableHead className={`${ADMIN_TH} w-[12%]`}>Status</TableHead>
              <TableHead className={`${ADMIN_TH} w-[10%]`}>Sign-ups</TableHead>
              <TableHead className={`${ADMIN_TH} w-[16%]`}>Starts</TableHead>
              <TableHead className={`${ADMIN_TH} w-[16%]`}>Created</TableHead>
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
                  No events match these filters
                </TableCell>
              </TableRow>
            ) : (
              data.items.map((row) => (
                <TableRow key={row.id}>
                  <TruncateCell className="font-medium px-3" title={row.title}>
                    {row.title}
                  </TruncateCell>
                  <TruncateCell className="text-sm text-muted-foreground px-3" title={row.organizerName}>
                    {row.organizerName}
                  </TruncateCell>
                  <TableCell className="px-3">
                    <Badge variant="secondary" className="capitalize bg-primary/10 text-primary border-0">
                      {row.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-3 text-sm tabular-nums">{row.registrationCount ?? 0}</TableCell>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap px-3">
                    {new Date(row.startDatetime).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap px-3">
                    {new Date(row.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
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
