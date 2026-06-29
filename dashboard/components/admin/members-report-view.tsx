"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Users } from "lucide-react";
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
import { AdminTableCard, ADMIN_TH, ADMIN_ACTIONS_TH, AdminActionsCell, AdminManageButton, TruncateCell } from "@/components/admin/admin-table-card";
import { ListPagination, ListToolbar } from "@/components/admin/list-toolbar";
import { MemberDetailDialog } from "@/components/admin/admin-record-dialogs";
import {
  getAdminReport,
  getReportSummary,
  listMembers,
  type MemberRow,
  type ReportSummary,
} from "@/lib/api";
import { useAdminList } from "@/hooks/useAdminList";
import { getReportConfig } from "@/lib/reports";
import { cn } from "@/lib/utils";
import { ReportExportButtons } from "@/components/admin/report-export-buttons";
import { downloadReportCsv, type ReportDocumentPayload } from "@/lib/report-export";
import { DATE_PRESETS, defaultDateRange, rangeFromPreset } from "@/lib/report-dates";

const GENDER_OPTIONS = [
  { value: "all", label: "All genders" },
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "not-set", label: "Not set" },
];

const ACTIVITY_OPTIONS = [
  { value: "all", label: "All members" },
  { value: "with-registrations", label: "Joined an event" },
  { value: "no-registrations", label: "No registrations yet" },
];

const GENDER_CHART_COLORS: Record<string, string> = {
  Male: "#FF7B3F",
  Female: "#6366F1",
  "Not set": "#94A3B8",
};

export default function MembersReportView() {
  const config = getReportConfig("members")!;
  const initialRange = useMemo(() => defaultDateRange(), []);

  const [from, setFrom] = useState(initialRange.from);
  const [to, setTo] = useState(initialRange.to);
  const [gender, setGender] = useState("all");
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const dateRangeValid = !from || !to || from <= to;

  const fetcher = useCallback(
    (params: Parameters<typeof listMembers>[0]) =>
      listMembers({
        ...params,
        gender: gender !== "all" ? gender : undefined,
        joinedFrom: dateRangeValid ? from || undefined : undefined,
        joinedTo: dateRangeValid ? to || undefined : undefined,
      }),
    [from, to, gender, dateRangeValid],
  );

  const {
    searchInput,
    onSearchChange,
    activity,
    onActivityChange,
    setPage,
    data,
    loading: listLoading,
    reload,
  } = useAdminList<MemberRow>(fetcher);

  useEffect(() => {
    if (!dateRangeValid) return;

    let cancelled = false;
    setSummaryLoading(true);
    getReportSummary("members", from || undefined, to || undefined, gender)
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
  }, [from, to, gender, dateRangeValid]);

  function handleFromChange(value: string) {
    setFrom(value);
    setPage(1);
  }

  function handleToChange(value: string) {
    setTo(value);
    setPage(1);
  }

  function handleGenderChange(value: string) {
    setGender(value);
    setPage(1);
  }

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

  const pieData = useMemo(
    () =>
      (summary?.breakdown ?? []).map((item) => ({
        name: item.label,
        value: item.value,
      })),
    [summary],
  );

  const pieTotal = pieData.reduce((sum, row) => sum + row.value, 0);

  async function handleExportCsv() {
    const result = await getAdminReport("members", from || undefined, to || undefined, {
      gender,
      search: searchInput.trim() || undefined,
    });
    downloadReportCsv("madalhub-members-report.csv", result.rows);
  }

  async function buildMembersDocument(): Promise<ReportDocumentPayload | null> {
    if (!dateRangeValid) return null;
    const result = await getAdminReport("members", from || undefined, to || undefined, {
      gender,
      search: searchInput.trim() || undefined,
    });
    const genderLabel = GENDER_OPTIONS.find((o) => o.value === gender)?.label ?? "All genders";
    return {
      filename: "madalhub-members-report",
      title: "Members Report",
      filterLines: [
        `Period: ${from} → ${to}`,
        `Gender: ${genderLabel}`,
        ...(searchInput.trim() ? [`Search: ${searchInput.trim()}`] : []),
      ],
      kpis: (summary?.kpis ?? []).map((k) => ({ label: k.label, value: k.value })),
      breakdown: (summary?.breakdown ?? []).map((b) => ({ label: b.label, value: b.value })),
      columns: ["Name", "Email", "Gender", "Location", "Profile", "Joined"],
      rows: result.rows.map((r) => [
        String(r.fullName ?? ""),
        String(r.email ?? ""),
        String(r.gender || "—"),
        String(r.location || "—"),
        String(r.profileCompleted ?? ""),
        r.joined ? new Date(String(r.joined)).toLocaleDateString() : "",
      ]),
    };
  }

  function openMember(id: number) {
    setSelectedId(id);
    setDialogOpen(true);
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-6 p-4 md:p-6">
      <PageHeader
        title={config.label}
        description={config.description}
        actions={
          <div className="hidden sm:flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary">
            <Users size={16} />
            Member analytics
          </div>
        }
      />

      <Card className="border-primary/10 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filters</CardTitle>
          <CardDescription>
            Charts and directory update automatically when you change dates or gender. Search filters the table below.
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
              <Label htmlFor="members-from">From</Label>
              <Input
                id="members-from"
                type="date"
                value={from}
                onChange={(e) => handleFromChange(e.target.value)}
                className="w-full sm:w-[160px]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="members-to">To</Label>
              <Input
                id="members-to"
                type="date"
                value={to}
                onChange={(e) => handleToChange(e.target.value)}
                className="w-full sm:w-[160px]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="members-gender">Gender</Label>
              <select
                id="members-gender"
                value={gender}
                onChange={(e) => handleGenderChange(e.target.value)}
                className="flex h-9 w-full sm:w-[160px] rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {GENDER_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <ReportExportButtons
              onExportCsv={handleExportCsv}
              buildDocument={buildMembersDocument}
              csvDisabled={!dateRangeValid}
            />
          </div>
          {!dateRangeValid ? (
            <p className="text-sm text-destructive">From date must be on or before the to date.</p>
          ) : null}
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
            <CardTitle className="text-base">Sign-ups trend</CardTitle>
            <CardDescription>New members per month in the selected period</CardDescription>
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              <Skeleton className="h-[240px] w-full rounded-lg" />
            ) : (
              <ChartContainer className="h-[240px] w-full">
                <ResponsiveContainer width="100%" height={240} minWidth={0} debounce={50}>
                  <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                    <defs>
                      <linearGradient id="membersReportFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#FF7B3F" stopOpacity={0.3} />
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
                      fill="url(#membersReportFill)"
                      strokeWidth={2.5}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Gender mix</CardTitle>
            <CardDescription>Members who joined in this period</CardDescription>
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              <Skeleton className="h-[240px] w-full" />
            ) : pieData.length === 0 ? (
              <p className="text-sm text-muted-foreground py-16 text-center">No members in this period</p>
            ) : (
              <div className="flex flex-col gap-4">
                <ChartContainer className="h-[160px] w-full">
                  <ResponsiveContainer width="100%" height={160} minWidth={0}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={48}
                        outerRadius={72}
                        paddingAngle={2}
                      >
                        {pieData.map((entry) => (
                          <Cell key={entry.name} fill={GENDER_CHART_COLORS[entry.name] ?? "#CBD5E1"} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
                <div className="space-y-2">
                  {pieData.map((item) => {
                    const pct = pieTotal > 0 ? Math.round((item.value / pieTotal) * 100) : 0;
                    return (
                      <div key={item.name} className="space-y-1">
                        <div className="flex items-center justify-between text-sm gap-2">
                          <span className="flex items-center gap-2 text-muted-foreground">
                            <span
                              className="size-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: GENDER_CHART_COLORS[item.name] ?? "#CBD5E1" }}
                            />
                            {item.name}
                          </span>
                          <span className="font-medium tabular-nums">
                            {item.value.toLocaleString()} · {pct}%
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${pct}%`,
                              backgroundColor: GENDER_CHART_COLORS[item.name] ?? "#CBD5E1",
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Member directory</h2>
          <p className="text-sm text-muted-foreground">
            Search and filter members in the selected join period. Use Manage for profile and registrations.
          </p>
        </div>

        <ListToolbar
          search={searchInput}
          onSearchChange={onSearchChange}
          searchPlaceholder="Search name or email…"
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
              <TableHead className={`${ADMIN_TH} w-[18%]`}>Name</TableHead>
              <TableHead className={`${ADMIN_TH} w-[22%]`}>Email</TableHead>
              <TableHead className={`${ADMIN_TH} w-[10%]`}>Gender</TableHead>
              <TableHead className={`${ADMIN_TH} w-[18%]`}>Location</TableHead>
              <TableHead className={`${ADMIN_TH} w-[10%]`}>Events</TableHead>
              <TableHead className={`${ADMIN_TH} w-[12%]`}>Joined</TableHead>
              <TableHead className={ADMIN_ACTIONS_TH}>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {listLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <TableCell key={j} className="px-3">
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : !data?.items.length ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-16 text-muted-foreground">
                  No members match these filters
                </TableCell>
              </TableRow>
            ) : (
              data.items.map((row) => (
                <TableRow key={row.id}>
                  <TruncateCell className="font-medium px-3" title={row.fullName}>
                    {row.fullName}
                  </TruncateCell>
                  <TruncateCell className="text-sm px-3 text-muted-foreground" title={row.email}>
                    {row.email}
                  </TruncateCell>
                  <TableCell className="px-3">
                    {row.gender ? (
                      <Badge variant="secondary" className="capitalize bg-primary/10 text-primary border-0">
                        {row.gender}
                      </Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TruncateCell className="text-sm text-muted-foreground px-3" title={row.location ?? undefined}>
                    {row.location || "—"}
                  </TruncateCell>
                  <TableCell className="px-3 text-sm tabular-nums">{row.registrationCount ?? 0}</TableCell>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap px-3">
                    {new Date(row.createdAt).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </TableCell>
                  <AdminActionsCell>
                    <AdminManageButton onClick={() => openMember(row.id)} />
                  </AdminActionsCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </AdminTableCard>
      </div>

      <MemberDetailDialog
        memberId={selectedId}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onUpdated={() => void reload()}
      />
    </div>
  );
}
