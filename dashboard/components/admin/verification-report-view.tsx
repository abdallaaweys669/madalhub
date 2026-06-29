"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ShieldCheck, ArrowUpRight } from "lucide-react";
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
import { ADMIN_TH } from "@/components/admin/admin-table-card";
import { ReportExportButtons } from "@/components/admin/report-export-buttons";
import { getReportSummary, type ReportSummary } from "@/lib/api";
import { getReportConfig } from "@/lib/reports";
import { DATE_PRESETS, defaultDateRange, rangeFromPreset } from "@/lib/report-dates";
import { type ReportDocumentPayload } from "@/lib/report-export";
import { cn } from "@/lib/utils";

const STATUS_COLORS: Record<string, string> = {
  unverified: "#94A3B8",
  pending: "#F59E0B",
  approved: "#22C55E",
  rejected: "#EF4444",
};

function capitalize(value: string) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : "—";
}

export default function VerificationReportView() {
  const config = getReportConfig("verification")!;
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
    getReportSummary("verification", from || undefined, to || undefined)
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

  const pieData = useMemo(
    () =>
      (summary?.breakdown ?? []).map((item) => ({
        name: capitalize(item.label),
        key: item.label?.toLowerCase() || "unknown",
        value: item.value,
      })),
    [summary],
  );

  const pieTotal = pieData.reduce((s, r) => s + r.value, 0);

  function buildDocument(): ReportDocumentPayload | null {
    if (!summary) return null;
    return {
      filename: "madalhub-verification-report",
      title: "Verification Report",
      filterLines: [`Period: ${from} → ${to}`, "Pipeline snapshot and review queue"],
      kpis: summary.kpis.map((k) => ({ label: k.label, value: k.value })),
      breakdown: pieData.map((b) => ({ label: b.name, value: b.value })),
      columns: ["Organization", "Contact", "Email", "Status"],
      rows: summary.rows.map((r) => [
        String(r.organization ?? ""),
        String(r.contact ?? ""),
        String(r.email ?? ""),
        capitalize(String(r.status ?? "")),
      ]),
    };
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-6 p-4 md:p-6">
      <PageHeader
        title={config.label}
        description={config.description}
        actions={
          <Link
            href="/verifications"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Review queue
            <ArrowUpRight size={14} />
          </Link>
        }
      />

      <Card className="border-primary/10 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filters</CardTitle>
          <CardDescription>
            Approval trend uses the selected period. Status breakdown reflects current pipeline totals.
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
              <Label htmlFor="verification-from">From</Label>
              <Input id="verification-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-full sm:w-[160px]" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="verification-to">To</Label>
              <Input id="verification-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-full sm:w-[160px]" />
            </div>
            <ReportExportButtons
              onExportCsv={() => {
                if (!summary?.rows.length) throw new Error("No rows to export");
                const headers = ["organization", "contact", "email", "status"];
                const csv = [
                  headers.join(","),
                  ...summary.rows.map((r) =>
                    headers.map((h) => `"${String(r[h] ?? "").replace(/"/g, '""')}"`).join(","),
                  ),
                ].join("\n");
                const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "madalhub-verification-report.csv";
                a.click();
                URL.revokeObjectURL(url);
              }}
              buildDocument={buildDocument}
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
                  index === 0 && kpi.key === "pending" && "border-amber-200 bg-gradient-to-br from-amber-50 to-transparent dark:from-amber-950/20",
                  index === 0 && kpi.key !== "pending" && "border-primary/20 bg-gradient-to-br from-primary/5 to-transparent",
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
            <CardTitle className="text-base">Approvals trend</CardTitle>
            <CardDescription>Organizers approved per month in the selected period</CardDescription>
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              <Skeleton className="h-[240px] w-full rounded-lg" />
            ) : (
              <ChartContainer className="h-[240px] w-full">
                <ResponsiveContainer width="100%" height={240} minWidth={0} debounce={50}>
                  <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                    <defs>
                      <linearGradient id="verificationFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#22C55E" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#22C55E" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                    <Area type="monotone" dataKey="value" stroke="#22C55E" fill="url(#verificationFill)" strokeWidth={2.5} />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldCheck className="size-4 text-primary" />
              Pipeline snapshot
            </CardTitle>
            <CardDescription>Current verification statuses</CardDescription>
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              <Skeleton className="h-[240px] w-full" />
            ) : (
              <div className="flex flex-col gap-4">
                <ChartContainer className="h-[160px] w-full">
                  <ResponsiveContainer width="100%" height={160} minWidth={0}>
                    <PieChart>
                      <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={48} outerRadius={72} paddingAngle={2}>
                        {pieData.map((entry) => (
                          <Cell key={entry.key} fill={STATUS_COLORS[entry.key] ?? "#CBD5E1"} />
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
                      <div key={item.key} className="flex justify-between text-sm gap-2">
                        <span className="flex items-center gap-2 text-muted-foreground">
                          <span
                            className="size-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: STATUS_COLORS[item.key] ?? "#CBD5E1" }}
                          />
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

      <Card className="overflow-hidden py-0">
        <CardHeader className="border-b flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle className="text-base">Review queue preview</CardTitle>
            <CardDescription>Pending and unverified organizers — open Verifications to take action</CardDescription>
          </div>
          <Link href="/verifications" className="sm:hidden">
            <Button size="sm">Review</Button>
          </Link>
        </CardHeader>
        <div className="max-h-[360px] overflow-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className={ADMIN_TH}>Organization</TableHead>
                <TableHead className={ADMIN_TH}>Contact</TableHead>
                <TableHead className={ADMIN_TH}>Email</TableHead>
                <TableHead className={ADMIN_TH}>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summaryLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 4 }).map((_, j) => (
                      <TableCell key={j} className="px-3">
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : !summary?.rows.length ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-16 text-muted-foreground">
                    No items in the review queue
                  </TableCell>
                </TableRow>
              ) : (
                summary.rows.map((row, i) => (
                  <TableRow key={i}>
                    <TableCell className="px-3 text-sm font-medium">{String(row.organization ?? "—")}</TableCell>
                    <TableCell className="px-3 text-sm">{String(row.contact ?? "—")}</TableCell>
                    <TableCell className="px-3 text-sm text-muted-foreground">{String(row.email ?? "—")}</TableCell>
                    <TableCell className="px-3">
                      <Badge variant="secondary" className="capitalize">
                        {String(row.status ?? "—")}
                      </Badge>
                    </TableCell>
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
