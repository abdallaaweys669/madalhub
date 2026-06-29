"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ScrollText } from "lucide-react";
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
import { ADMIN_TH } from "@/components/admin/admin-table-card";
import { ReportExportButtons } from "@/components/admin/report-export-buttons";
import { getReportSummary, type ReportSummary } from "@/lib/api";
import { getReportConfig } from "@/lib/reports";
import { DATE_PRESETS, defaultDateRange, rangeFromPreset } from "@/lib/report-dates";
import { downloadReportCsv, type ReportDocumentPayload } from "@/lib/report-export";
import { cn } from "@/lib/utils";

const ACTION_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  "Member joined": "default",
  "Organizer joined": "default",
  "Event published": "default",
  "Event draft created": "secondary",
  "Event created": "secondary",
  "Event registration": "default",
  "Credits granted": "default",
  "Credit request dismissed": "secondary",
  "Payment approved": "default",
  "Payment rejected": "destructive",
  "Account suspended": "destructive",
  "Event cancelled": "outline",
};

function formatWhen(value: unknown) {
  if (!value) return "—";
  return new Date(String(value)).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function LogsReportView() {
  const config = getReportConfig("logs")!;
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
    getReportSummary("logs", from || undefined, to || undefined)
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

  const breakdown = summary?.breakdown ?? [];
  const breakdownMax = Math.max(...breakdown.map((b) => b.value), 1);

  function handleExportCsv() {
    if (!summary?.rows.length) throw new Error("No rows to export");
    downloadReportCsv("madalhub-logs-report.csv", summary.rows);
  }

  function buildDocument(): ReportDocumentPayload | null {
    if (!summary) return null;
    return {
      filename: "madalhub-logs-report",
      title: "Admin Logs Report",
      filterLines: [`Period: ${from} → ${to}`],
      kpis: summary.kpis.map((k) => ({ label: k.label, value: k.value })),
      breakdown: summary.breakdown.map((b) => ({ label: b.label, value: b.value })),
      columns: ["When", "Action", "Subject", "Detail"],
      rows: summary.rows.map((r) => [
        formatWhen(r.occurredAt),
        String(r.action ?? ""),
        String(r.subject ?? ""),
        String(r.detail ?? ""),
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
            <ScrollText size={16} />
            Admin activity
          </div>
        }
      />

      <Card className="border-primary/10 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filters</CardTitle>
          <CardDescription>
            All platform activity in the selected period — members, organizers, events, registrations, credits, and moderation.
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
              <Label htmlFor="logs-from">From</Label>
              <Input
                id="logs-from"
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="w-full sm:w-[160px]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="logs-to">To</Label>
              <Input
                id="logs-to"
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
                  <CardTitle className="text-3xl tabular-nums tracking-tight">{kpi.value}</CardTitle>
                </CardHeader>
              </Card>
            ))}
      </div>

      {!summaryLoading && breakdown.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Actions breakdown</CardTitle>
            <CardDescription>Count by action type in this period</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {breakdown.map((item) => (
              <div key={item.label} className="space-y-1">
                <div className="flex justify-between text-sm gap-2">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="font-medium tabular-nums">{item.value}</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary/80 transition-all"
                    style={{ width: `${Math.round((item.value / breakdownMax) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <Card className="overflow-hidden py-0">
        <CardHeader className="border-b">
          <CardTitle className="text-base">Activity log</CardTitle>
          <CardDescription>Most recent admin-related events first</CardDescription>
        </CardHeader>
        <div className="max-h-[520px] overflow-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className={`${ADMIN_TH} w-[22%]`}>When</TableHead>
                <TableHead className={`${ADMIN_TH} w-[18%]`}>Action</TableHead>
                <TableHead className={`${ADMIN_TH} w-[22%]`}>Subject</TableHead>
                <TableHead className={`${ADMIN_TH} w-[38%]`}>Detail</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summaryLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
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
                    No admin activity in this period
                  </TableCell>
                </TableRow>
              ) : (
                summary.rows.map((row, i) => {
                  const action = String(row.action ?? "");
                  return (
                    <TableRow key={i}>
                      <TableCell className="px-3 text-sm text-muted-foreground whitespace-nowrap">
                        {formatWhen(row.occurredAt)}
                      </TableCell>
                      <TableCell className="px-3">
                        <Badge variant={ACTION_VARIANTS[action] ?? "secondary"} className="whitespace-nowrap">
                          {action || "—"}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-3 text-sm font-medium truncate max-w-0" title={String(row.subject ?? "")}>
                        {String(row.subject ?? "—")}
                      </TableCell>
                      <TableCell className="px-3 text-sm text-muted-foreground truncate max-w-0" title={String(row.detail ?? "")}>
                        {String(row.detail ?? "—")}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
