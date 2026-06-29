"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { MapPin } from "lucide-react";
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
import { ADMIN_TH } from "@/components/admin/admin-table-card";
import { ReportExportButtons } from "@/components/admin/report-export-buttons";
import { getReportSummary, type ReportSummary } from "@/lib/api";
import { getReportConfig } from "@/lib/reports";
import { DATE_PRESETS, defaultDateRange, rangeFromPreset } from "@/lib/report-dates";
import { downloadReportCsv, type ReportDocumentPayload } from "@/lib/report-export";
import { cn } from "@/lib/utils";

export default function LocationReportView() {
  const config = getReportConfig("location")!;
  const initialRange = useMemo(() => defaultDateRange(), []);

  const [from, setFrom] = useState(initialRange.from);
  const [to, setTo] = useState(initialRange.to);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summary, setSummary] = useState<ReportSummary | null>(null);

  const dateRangeValid = !from || !to || from <= to;

  useEffect(() => {
    if (!dateRangeValid) return;
    let cancelled = false;
    setSummaryLoading(true);
    getReportSummary("location", from || undefined, to || undefined)
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

  const chartData = useMemo(
    () =>
      summary?.trendMonths.map((month, i) => ({
        month,
        value: summary.trendValues[i] ?? 0,
      })) ?? [],
    [summary],
  );

  const breakdown = summary?.breakdown ?? [];
  const breakdownMax = Math.max(...breakdown.map((b) => b.value), 1);

  function handleExportCsv() {
    if (!summary?.rows.length) throw new Error("No rows to export");
    downloadReportCsv("madalhub-location-report.csv", summary.rows);
  }

  function buildDocument(): ReportDocumentPayload | null {
    if (!summary) return null;
    return {
      filename: "madalhub-location-report",
      title: "Location Report",
      filterLines: [`Period: ${from} → ${to}`],
      kpis: summary.kpis.map((k) => ({ label: k.label, value: k.value })),
      breakdown: summary.breakdown.map((b) => ({ label: b.label, value: b.value })),
      columns: ["Area", "Members", "Events"],
      rows: summary.rows.map((r) => [
        String(r.area ?? ""),
        String(r.members ?? 0),
        String(r.events ?? 0),
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
            <MapPin size={16} />
            Area analytics
          </div>
        }
      />

      <Card className="border-primary/10 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filters</CardTitle>
          <CardDescription>Members and events grouped by location in the selected join/create period.</CardDescription>
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
                onClick={() => {
                  const range = rangeFromPreset(preset);
                  setFrom(range.from);
                  setTo(range.to);
                }}
              >
                {preset.label}
              </Button>
            ))}
          </div>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:flex-wrap">
            <div className="space-y-2">
              <Label htmlFor="location-from">From</Label>
              <Input
                id="location-from"
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="w-full sm:w-[160px]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location-to">To</Label>
              <Input
                id="location-to"
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="w-full sm:w-[160px]"
              />
            </div>
            <ReportExportButtons
              onExportCsv={handleExportCsv}
              buildDocument={buildDocument}
              csvDisabled={!summary?.rows.length}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryLoading
          ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)
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
                  <CardTitle className="text-2xl tabular-nums tracking-tight truncate" title={String(kpi.value)}>
                    {kpi.value}
                  </CardTitle>
                </CardHeader>
              </Card>
            ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Members with location</CardTitle>
            <CardDescription>New members per month who set a location</CardDescription>
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              <Skeleton className="h-[240px] w-full rounded-lg" />
            ) : chartData.length === 0 ? (
              <p className="text-sm text-muted-foreground py-16 text-center">No trend data for this period</p>
            ) : (
              <ChartContainer className="h-[240px] w-full">
                <ResponsiveContainer width="100%" height={240} minWidth={0} debounce={50}>
                  <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                    <defs>
                      <linearGradient id="locationReportFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10B981" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                    <Area type="monotone" dataKey="value" stroke="#10B981" fill="url(#locationReportFill)" strokeWidth={2.5} />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top member areas</CardTitle>
            <CardDescription>By sign-ups in range</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {summaryLoading ? (
              <Skeleton className="h-[240px] w-full" />
            ) : breakdown.length === 0 ? (
              <p className="text-sm text-muted-foreground py-12 text-center">No location data</p>
            ) : (
              breakdown.map((item) => (
                <div key={item.label} className="space-y-1">
                  <div className="flex justify-between text-sm gap-2">
                    <span className="text-muted-foreground truncate" title={item.label}>
                      {item.label}
                    </span>
                    <span className="font-medium tabular-nums shrink-0">{item.value}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-500/80 transition-all"
                      style={{ width: `${Math.round((item.value / breakdownMax) * 100)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden py-0">
        <CardHeader className="border-b">
          <CardTitle className="text-base">Areas directory</CardTitle>
          <CardDescription>Member count and matching event locations per area</CardDescription>
        </CardHeader>
        <div className="max-h-[420px] overflow-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className={ADMIN_TH}>Area</TableHead>
                <TableHead className={ADMIN_TH}>Members</TableHead>
                <TableHead className={ADMIN_TH}>Events</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summaryLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 3 }).map((_, j) => (
                      <TableCell key={j} className="px-3">
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : !summary?.rows.length ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-16 text-muted-foreground">
                    No location data for this period
                  </TableCell>
                </TableRow>
              ) : (
                summary.rows.map((row, i) => (
                  <TableRow key={i}>
                    <TableCell className="px-3 text-sm font-medium">{String(row.area ?? "—")}</TableCell>
                    <TableCell className="px-3 text-sm tabular-nums">{String(row.members ?? 0)}</TableCell>
                    <TableCell className="px-3 text-sm tabular-nums">{String(row.events ?? 0)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
