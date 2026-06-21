"use client";

import { useEffect, useMemo, useState } from "react";
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
import { getAdminReport, getReportSummary, type ReportSummary } from "@/lib/api";
import type { ReportSlug } from "@/lib/reports";
import { cn } from "@/lib/utils";

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

type Props = {
  slug: ReportSlug;
  title: string;
  description: string;
};

export default function ReportView({ slug, title, description }: Props) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ReportSummary | null>(null);

  const [appliedFrom, setAppliedFrom] = useState("");
  const [appliedTo, setAppliedTo] = useState("");

  useEffect(() => {
    let cancelled = false;
    getReportSummary(slug, appliedFrom || undefined, appliedTo || undefined)
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          toast.error(err instanceof Error ? err.message : "Failed to load report");
          setData(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug, appliedFrom, appliedTo]);

  function applyRange() {
    setLoading(true);
    setAppliedFrom(from);
    setAppliedTo(to);
  }

  const chartData = useMemo(
    () =>
      data?.trendMonths.map((month, i) => ({
        month,
        value: data.trendValues[i] ?? 0,
      })) ?? [],
    [data],
  );

  const tableHeaders = useMemo(() => {
    if (!data?.rows.length) return [];
    return Object.keys(data.rows[0]);
  }, [data]);

  const showTrend = (data?.trendValues.length ?? 0) > 0;
  const showBreakdown = (data?.breakdown.length ?? 0) > 0;

  async function handleExport() {
    if (!data?.exportType) {
      downloadCsv(`madalhub-${slug}-report.csv`, data?.rows ?? []);
      return;
    }
    try {
      const result = await getAdminReport(data.exportType, appliedFrom || undefined, appliedTo || undefined);
      downloadCsv(`madalhub-${slug}-report.csv`, result.rows);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Export failed");
    }
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-6 p-4 md:p-6">
      <PageHeader title={title} description={description} />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Date range</CardTitle>
          <CardDescription>Defaults to the last 6 months if empty.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="space-y-2">
            <Label htmlFor={`${slug}-from`}>From</Label>
            <Input id={`${slug}-from`} type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${slug}-to`}>To</Label>
            <Input id={`${slug}-to`} type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <Button onClick={() => void applyRange()} disabled={loading}>
              {loading ? "Loading…" : "Apply"}
            </Button>
            <Button variant="outline" className="gap-1.5" disabled={!data?.rows.length} onClick={() => void handleExport()}>
              <Download size={14} />
              Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
          : data?.kpis.map((kpi) => (
              <Card key={kpi.key}>
                <CardHeader className="pb-2">
                  <CardDescription>{kpi.label}</CardDescription>
                  <CardTitle className="text-2xl tabular-nums">{kpi.value}</CardTitle>
                </CardHeader>
              </Card>
            ))}
      </div>

      {showTrend || showBreakdown ? (
      <div className={cn("grid gap-4", showTrend && showBreakdown ? "lg:grid-cols-3" : "")}>
        {showTrend ? (
        <Card className={showBreakdown ? "lg:col-span-2" : ""}>
          <CardHeader>
            <CardTitle className="text-base">Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[220px] w-full rounded-lg" />
            ) : (
              <ChartContainer className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height={220} minWidth={0} debounce={50}>
                  <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                    <defs>
                      <linearGradient id="reportFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#FF7B3F" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="#FF7B3F" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                    <Area type="monotone" dataKey="value" stroke="#FF7B3F" fill="url(#reportFill)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
        ) : null}

        {showBreakdown ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {loading ? (
              <Skeleton className="h-32 w-full" />
            ) : (
              data?.breakdown.map((item) => (
                <div key={item.label} className="flex items-center justify-between text-sm gap-2">
                  <span className="text-muted-foreground truncate">{item.label}</span>
                  <span className="font-medium tabular-nums shrink-0">{item.value.toLocaleString()}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
        ) : null}
      </div>
      ) : null}

      <Card className="overflow-hidden py-0 min-w-0">
        <div className="max-h-[420px] overflow-auto">
          <Table className="table-fixed w-full">
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                {tableHeaders.map((key) => (
                  <TableHead key={key} className="capitalize whitespace-nowrap px-3">
                    {key.replace(/([A-Z])/g, " $1")}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: Math.max(tableHeaders.length, 4) }).map((_, j) => (
                      <TableCell key={j} className="px-3">
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : !data?.rows.length ? (
                <TableRow>
                  <TableCell colSpan={Math.max(tableHeaders.length, 1)} className="text-center py-12 text-muted-foreground">
                    No data for this range
                  </TableCell>
                </TableRow>
              ) : (
                data.rows.map((row, i) => (
                  <TableRow key={i}>
                    {tableHeaders.map((key) => (
                      <TableCell key={key} className="text-sm max-w-0 truncate px-3" title={String(row[key] ?? "")}>
                        {String(row[key] ?? "—")}
                      </TableCell>
                    ))}
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
