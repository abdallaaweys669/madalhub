"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
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
import {
  Users,
  Building2,
  CalendarDays,
  Ticket,
  ShieldCheck,
  CreditCard,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  Sparkles,
  FileText,
  HeartHandshake,
  MapPin,
  ScrollText,
} from "lucide-react";
import { getAdminStats, type AdminStats } from "@/lib/api";
import { REPORT_ITEMS } from "@/lib/reports";
import ChartContainer from "@/components/ChartContainer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function fmt(n: number) {
  return n.toLocaleString();
}

function growthPct(current: number, previous: number) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

const STAT_CONFIG = [
  {
    key: "members" as const,
    label: "Members",
    icon: Users,
    href: "/reports/members",
    gradient: "from-violet-500/20 via-violet-500/5 to-transparent",
    iconBg: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
    stroke: "#8B5CF6",
  },
  {
    key: "organizers" as const,
    label: "Organizers",
    icon: Building2,
    href: "/reports/organizers",
    gradient: "from-orange-500/25 via-primary/5 to-transparent",
    iconBg: "bg-primary/15 text-primary",
    stroke: "#FF7B3F",
  },
  {
    key: "events" as const,
    label: "Events",
    icon: CalendarDays,
    href: "/reports/events",
    gradient: "from-emerald-500/20 via-emerald-500/5 to-transparent",
    iconBg: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
    stroke: "#10B981",
  },
  {
    key: "registrations" as const,
    label: "Engagement",
    icon: Ticket,
    href: "/reports/engagement",
    gradient: "from-indigo-500/20 via-indigo-500/5 to-transparent",
    iconBg: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400",
    stroke: "#6366F1",
  },
];

const VERIFICATION_COLORS: Record<string, string> = {
  unverified: "#94A3B8",
  pending: "#F59E0B",
  approved: "#22C55E",
  rejected: "#EF4444",
};

const REPORT_ICONS: Record<string, typeof FileText> = {
  members: Users,
  organizers: Building2,
  events: CalendarDays,
  engagement: HeartHandshake,
  verification: ShieldCheck,
  location: MapPin,
  logs: ScrollText,
};

type ChartMetric = "all" | "members" | "events" | "registrations";

const GROWTH_SERIES = [
  { key: "members" as const, label: "Members", color: "#8B5CF6", dash: "6 4" },
  { key: "events" as const, label: "Events", color: "#FF7B3F", dash: undefined },
  { key: "registrations" as const, label: "Registrations", color: "#6366F1", dash: undefined },
];

const CHART_FILTER_OPTIONS: { id: ChartMetric; label: string }[] = [
  { id: "all", label: "All three" },
  { id: "members", label: "Members" },
  { id: "events", label: "Events" },
  { id: "registrations", label: "Registrations" },
];

export default function DashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState("");
  const [chartMetric, setChartMetric] = useState<ChartMetric>("all");

  const reload = useCallback(async () => {
    try {
      const data = await getAdminStats();
      setStats(data);
      setError("");
    } catch (err: unknown) {
      setStats(null);
      setError(err instanceof Error ? err.message : "Failed to load stats.");
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    getAdminStats()
      .then((data) => {
        if (!cancelled) {
          setStats(data);
          setError("");
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setStats(null);
          setError(err instanceof Error ? err.message : "Failed to load stats.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const chartData = useMemo(() => {
    if (!stats) return [];
    return stats.trendMonths.map((month, i) => ({
      month,
      registrations: stats.trends.registrations[i] ?? 0,
      events: stats.trends.events[i] ?? 0,
      members: stats.trends.members[i] ?? 0,
    }));
  }, [stats]);

  const verificationPie = useMemo(() => {
    if (!stats) return [];
    const b = stats.verificationBreakdown;
    return [
      { name: "Approved", key: "approved", value: b.approved },
      { name: "Pending", key: "pending", value: b.pending },
      { name: "Unverified", key: "unverified", value: b.unverified },
      { name: "Rejected", key: "rejected", value: b.rejected },
    ].filter((x) => x.value > 0);
  }, [stats]);

  const eventTotal =
    stats
      ? stats.eventStatusBreakdown.published +
        stats.eventStatusBreakdown.draft +
        stats.eventStatusBreakdown.cancelled
      : 0;

  return (
    <div className="relative flex flex-1 flex-col gap-6 p-4 md:gap-8 md:p-6 overflow-hidden">
      {/* Ambient background */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute -top-32 -right-32 h-[420px] w-[420px] rounded-full bg-primary/20 blur-[100px]" />
        <div className="absolute top-1/3 -left-24 h-[320px] w-[320px] rounded-full bg-violet-500/15 blur-[90px]" />
        <div className="absolute bottom-0 right-1/4 h-[280px] w-[280px] rounded-full bg-indigo-500/10 blur-[80px]" />
      </div>

      {error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive flex items-center justify-between gap-3">
          <span>{error}</span>
          <Button variant="outline" size="sm" onClick={() => void reload()}>
            Retry
          </Button>
        </div>
      ) : null}

      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/10 via-background to-violet-500/5 p-6 md:p-8 shadow-sm">
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
            backgroundSize: "24px 24px",
          }}
        />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-background/60 px-3 py-1 text-xs font-medium text-primary backdrop-blur-sm">
              <Sparkles className="size-3.5" />
              MadalHub Admin
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground via-foreground to-primary bg-clip-text">
              Platform overview
            </h1>
            <p className="text-muted-foreground max-w-lg text-sm md:text-base">
              Live snapshot of members, organizers, events, and engagement across your community.
            </p>
          </div>
          {stats ? (
            <div className="flex flex-wrap gap-2">
              <Link
                href="/verifications"
                className="inline-flex items-center gap-2 rounded-xl bg-background/80 border border-border px-4 py-2.5 text-sm font-medium backdrop-blur-sm hover:border-primary/30 transition-colors"
              >
                <ShieldCheck className="size-4 text-amber-500" />
                {stats.pending.verifications} pending reviews
              </Link>
              <Link
                href="/payments"
                className="inline-flex items-center gap-2 rounded-xl bg-background/80 border border-border px-4 py-2.5 text-sm font-medium backdrop-blur-sm hover:border-primary/30 transition-colors"
              >
                <CreditCard className="size-4 text-primary" />
                {stats.pending.creditRequests} credit requests
              </Link>
            </div>
          ) : null}
        </div>
      </section>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats
          ? STAT_CONFIG.map(({ key, label, icon: Icon, href, gradient, iconBg, stroke }) => {
              const growth = growthPct(stats.thisMonth[key], stats.lastMonth[key]);
              const isUp = growth >= 0;
              return (
                <Link key={key} href={href} className="group block">
                  <Card
                    className={cn(
                      "relative overflow-hidden border-border/60 transition-all duration-300",
                      "hover:shadow-lg hover:shadow-primary/5 hover:border-primary/25 hover:-translate-y-0.5",
                      `bg-gradient-to-br ${gradient}`,
                    )}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardDescription className="flex items-center gap-2 font-medium text-foreground/70">
                          <span className={cn("flex size-8 items-center justify-center rounded-lg", iconBg)}>
                            <Icon className="size-4" />
                          </span>
                          {label}
                        </CardDescription>
                        <ArrowUpRight className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <CardTitle className="text-4xl font-bold tabular-nums tracking-tight mt-2">
                        {fmt(stats.totals[key])}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center justify-between gap-2">
                      <p className="text-xs text-muted-foreground">
                        <span className="font-semibold text-foreground">{fmt(stats.thisMonth[key])}</span> this month
                      </p>
                      <span
                        className={cn(
                          "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium",
                          isUp ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-red-500/10 text-red-600 dark:text-red-400",
                        )}
                      >
                        {isUp ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                        {Math.abs(growth)}%
                      </span>
                    </CardContent>
                    <div
                      className="absolute bottom-0 left-0 right-0 h-0.5 opacity-60 group-hover:opacity-100 transition-opacity"
                      style={{ background: `linear-gradient(90deg, transparent, ${stroke}, transparent)` }}
                    />
                  </Card>
                </Link>
              );
            })
          : STAT_CONFIG.map(({ key }) => (
              <Card key={key}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-24 mt-3" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-3 w-32" />
                </CardContent>
              </Card>
            ))}
      </div>

      {/* Main charts row */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-border/60 shadow-sm backdrop-blur-sm bg-card/80">
          <CardHeader className="gap-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle className="text-lg">Growth pulse</CardTitle>
                <CardDescription>
                  {chartMetric === "all"
                    ? "Members, events & registrations — last 6 months"
                    : `${CHART_FILTER_OPTIONS.find((o) => o.id === chartMetric)?.label} — last 6 months`}
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {CHART_FILTER_OPTIONS.map((option) => (
                  <Button
                    key={option.id}
                    type="button"
                    size="sm"
                    variant={chartMetric === option.id ? "default" : "outline"}
                    className="h-8 rounded-full px-3 text-xs"
                    onClick={() => setChartMetric(option.id)}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2 pt-1 border-t border-border/50 mt-1 pt-3">
              {GROWTH_SERIES.map((series) => {
                const active = chartMetric === "all" || chartMetric === series.key;
                return (
                  <div
                    key={series.key}
                    className={cn(
                      "flex items-center gap-2 text-xs transition-opacity",
                      active ? "opacity-100" : "opacity-35",
                    )}
                  >
                    <span
                      className="inline-flex h-3 w-8 items-center justify-center shrink-0"
                      aria-hidden
                    >
                      <span
                        className="block h-0.5 w-full rounded-full"
                        style={{
                          backgroundColor: series.dash && chartMetric === "all" ? "transparent" : series.color,
                          borderTop: series.dash && chartMetric === "all" ? `2px dashed ${series.color}` : undefined,
                          height: series.dash && chartMetric === "all" ? 0 : undefined,
                        }}
                      />
                    </span>
                    <span
                      className="size-2 shrink-0 rounded-full"
                      style={{ backgroundColor: series.color }}
                    />
                    <span className="font-medium text-foreground">{series.label}</span>
                  </div>
                );
              })}
            </div>
          </CardHeader>
          <CardContent>
            {stats === null ? (
              <Skeleton className="h-[280px] w-full rounded-xl" />
            ) : (
              <ChartContainer className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height={280} minWidth={0} debounce={50}>
                  <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                    <defs>
                      <linearGradient id="dashRegFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366F1" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#6366F1" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="dashEventFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#FF7B3F" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#FF7B3F" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="dashMemberFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/50" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (!active || !payload?.length) return null;
                        return (
                          <div className="rounded-xl border border-border bg-background px-3 py-2.5 text-xs shadow-lg">
                            <p className="mb-2 font-semibold text-foreground">{label}</p>
                            <ul className="space-y-1.5">
                              {payload.map((entry) => {
                                const series = GROWTH_SERIES.find((s) => s.key === entry.dataKey);
                                const color = series?.color ?? entry.color ?? "#888";
                                return (
                                  <li key={String(entry.dataKey)} className="flex items-center justify-between gap-4">
                                    <span className="flex items-center gap-2 text-muted-foreground">
                                      <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                                      {entry.name}
                                    </span>
                                    <span className="font-semibold tabular-nums text-foreground">{entry.value}</span>
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        );
                      }}
                    />
                    {(chartMetric === "all" || chartMetric === "registrations") && (
                      <Area
                        type="monotone"
                        dataKey="registrations"
                        name="Registrations"
                        stroke="#6366F1"
                        fill="url(#dashRegFill)"
                        strokeWidth={chartMetric === "registrations" ? 2.5 : 2}
                      />
                    )}
                    {(chartMetric === "all" || chartMetric === "events") && (
                      <Area
                        type="monotone"
                        dataKey="events"
                        name="Events"
                        stroke="#FF7B3F"
                        fill="url(#dashEventFill)"
                        strokeWidth={chartMetric === "events" ? 2.5 : 2}
                      />
                    )}
                    {(chartMetric === "all" || chartMetric === "members") && (
                      <Area
                        type="monotone"
                        dataKey="members"
                        name="Members"
                        stroke="#8B5CF6"
                        fill={chartMetric === "members" ? "url(#dashMemberFill)" : "transparent"}
                        strokeWidth={chartMetric === "members" ? 2.5 : 2}
                        strokeDasharray={chartMetric === "all" ? "6 4" : undefined}
                      />
                    )}
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <Card className="border-border/60 shadow-sm bg-card/80 flex-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Action needed</CardTitle>
              <CardDescription>Jump to review queues</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {stats === null ? (
                <>
                  <Skeleton className="h-20 w-full rounded-xl" />
                  <Skeleton className="h-20 w-full rounded-xl" />
                </>
              ) : (
                <>
                  <Link
                    href="/verifications"
                    className="group flex items-center justify-between rounded-xl border border-amber-200/60 bg-gradient-to-r from-amber-50/80 to-transparent dark:from-amber-950/30 p-4 hover:border-amber-300 transition-all hover:shadow-md"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex size-11 items-center justify-center rounded-xl bg-amber-500/15 ring-1 ring-amber-500/20">
                        <ShieldCheck className="size-5 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Verifications</p>
                        <p className="text-2xl font-bold tabular-nums">{stats.pending.verifications}</p>
                      </div>
                    </div>
                    <ArrowUpRight className="size-4 text-muted-foreground group-hover:text-amber-600 transition-colors" />
                  </Link>
                  <Link
                    href="/payments"
                    className="group flex items-center justify-between rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 to-transparent p-4 hover:border-primary/40 transition-all hover:shadow-md"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex size-11 items-center justify-center rounded-xl bg-primary/15 ring-1 ring-primary/20">
                        <CreditCard className="size-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Credit requests</p>
                        <p className="text-2xl font-bold tabular-nums">{stats.pending.creditRequests}</p>
                      </div>
                    </div>
                    <ArrowUpRight className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </Link>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-sm bg-card/80">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Event pipeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {stats === null ? (
                <Skeleton className="h-24 w-full" />
              ) : (
                [
                  { label: "Published", value: stats.eventStatusBreakdown.published, color: "#22C55E" },
                  { label: "Draft", value: stats.eventStatusBreakdown.draft, color: "#F59E0B" },
                  { label: "Cancelled", value: stats.eventStatusBreakdown.cancelled, color: "#EF4444" },
                ].map((item) => (
                  <div key={item.label} className="space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{item.label}</span>
                      <span className="font-semibold tabular-nums">{fmt(item.value)}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: eventTotal > 0 ? `${Math.round((item.value / eventTotal) * 100)}%` : "0%",
                          backgroundColor: item.color,
                        }}
                      />
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom row: verification + reports + activity */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border-border/60 shadow-sm bg-card/80">
          <CardHeader>
            <CardTitle className="text-base">Organizer verification</CardTitle>
            <CardDescription>Current pipeline split</CardDescription>
          </CardHeader>
          <CardContent>
            {stats === null ? (
              <Skeleton className="h-[200px] w-full" />
            ) : verificationPie.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-12">No organizers yet</p>
            ) : (
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <ChartContainer className="h-[160px] w-[160px] shrink-0">
                  <ResponsiveContainer width={160} height={160}>
                    <PieChart>
                      <Pie data={verificationPie} dataKey="value" nameKey="name" innerRadius={45} outerRadius={70} paddingAngle={3}>
                        {verificationPie.map((entry) => (
                          <Cell key={entry.key} fill={VERIFICATION_COLORS[entry.key] ?? "#CBD5E1"} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
                <div className="flex-1 space-y-2 w-full">
                  {verificationPie.map((item) => (
                    <div key={item.key} className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <span className="size-2.5 rounded-full" style={{ backgroundColor: VERIFICATION_COLORS[item.key] }} />
                        {item.name}
                      </span>
                      <span className="font-medium tabular-nums">{item.value}</span>
                    </div>
                  ))}
                  <Link href="/reports/verification" className="inline-flex items-center gap-1 text-xs text-primary font-medium mt-2 hover:underline">
                    View verification report
                    <ArrowUpRight className="size-3" />
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm bg-card/80">
          <CardHeader>
            <CardTitle className="text-base">Reports</CardTitle>
            <CardDescription>Analytics &amp; exports</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            {REPORT_ITEMS.map((report) => {
              const Icon = REPORT_ICONS[report.slug] ?? FileText;
              return (
                <Link
                  key={report.slug}
                  href={`/reports/${report.slug}`}
                  className="group flex items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 hover:border-border hover:bg-accent/50 transition-colors"
                >
                  <span className="flex size-8 items-center justify-center rounded-lg bg-muted group-hover:bg-primary/10 transition-colors">
                    <Icon className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{report.label}</p>
                    <p className="text-xs text-muted-foreground truncate">{report.description}</p>
                  </div>
                  <ArrowUpRight className="size-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 shrink-0" />
                </Link>
              );
            })}
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm bg-card/80">
          <CardHeader>
            <CardTitle className="text-base">Recent activity</CardTitle>
            <CardDescription>Latest verification &amp; credit requests</CardDescription>
          </CardHeader>
          <CardContent>
            {stats === null ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-lg" />
                ))}
              </div>
            ) : stats.recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No recent activity</p>
            ) : (
              <ul className="space-y-2 max-h-[240px] overflow-auto pr-1">
                {stats.recentActivity.slice(0, 8).map((item) => (
                  <li
                    key={`${item.type}-${item.id}`}
                    className="flex items-start gap-3 rounded-lg border border-border/50 bg-muted/30 px-3 py-2.5 text-sm"
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md",
                        item.type === "verification" ? "bg-amber-500/15 text-amber-600" : "bg-primary/15 text-primary",
                      )}
                    >
                      {item.type === "verification" ? <ShieldCheck className="size-3.5" /> : <CreditCard className="size-3.5" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {item.type === "verification" ? "Verification" : "Credit request"}
                        {item.status ? ` · ${item.status}` : ""}
                      </p>
                    </div>
                    <time className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">
                      {new Date(item.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    </time>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
