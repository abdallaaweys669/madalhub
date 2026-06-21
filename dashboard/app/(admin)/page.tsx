"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Area,
  AreaChart,
  CartesianGrid,
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
} from "lucide-react";
import { getAdminStats, type AdminStats } from "@/lib/api";
import ChartContainer from "@/components/ChartContainer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

function fmt(n: number) {
  return n.toLocaleString();
}

const STAT_CONFIG = [
  { key: "members" as const, label: "Members", icon: Users },
  { key: "organizers" as const, label: "Organizers", icon: Building2 },
  { key: "events" as const, label: "Events", icon: CalendarDays },
  { key: "registrations" as const, label: "Registrations", icon: Ticket },
];

export default function DashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState("");

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
    }));
  }, [stats]);

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive flex items-center justify-between gap-3">
          <span>{error}</span>
          <Button variant="outline" size="sm" onClick={() => void reload()}>
            Retry
          </Button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats
          ? STAT_CONFIG.map(({ key, label, icon: Icon }) => (
              <Card key={key}>
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-2">
                    <Icon className="size-4 text-primary" />
                    {label}
                  </CardDescription>
                  <CardTitle className="text-3xl font-semibold tabular-nums">
                    {fmt(stats.totals[key])}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">{fmt(stats.thisMonth[key])}</span> new this month
                  </p>
                </CardContent>
              </Card>
            ))
          : STAT_CONFIG.map(({ key }) => (
              <Card key={key}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-9 w-20 mt-2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-3 w-32" />
                </CardContent>
              </Card>
            ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Platform activity</CardTitle>
            <CardDescription>Events and registrations — last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            {stats === null ? (
              <Skeleton className="h-[220px] w-full rounded-lg" />
            ) : (
              <ChartContainer className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height={220} minWidth={0} debounce={50}>
                  <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                    <defs>
                      <linearGradient id="brandFill" x1="0" y1="0" x2="0" y2="1">
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
                      dataKey="registrations"
                      name="Registrations"
                      stroke="#FF7B3F"
                      fill="url(#brandFill)"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="events"
                      name="Events"
                      stroke="#94A3B8"
                      fill="transparent"
                      strokeWidth={2}
                      strokeDasharray="4 4"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Pending review</CardTitle>
              <CardDescription>Items waiting for admin action</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {stats === null ? (
                <>
                  <Skeleton className="h-16 w-full rounded-lg" />
                  <Skeleton className="h-16 w-full rounded-lg" />
                </>
              ) : (
                <>
                  <Link
                    href="/verifications"
                    className="flex items-center justify-between rounded-lg border border-border p-4 hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 items-center justify-center rounded-md bg-primary/10">
                        <ShieldCheck className="size-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Verifications</p>
                        <p className="text-2xl font-semibold tabular-nums">{stats.pending.verifications}</p>
                      </div>
                    </div>
                    <ArrowUpRight className="size-4 text-muted-foreground" />
                  </Link>
                  <Link
                    href="/payments"
                    className="flex items-center justify-between rounded-lg border border-border p-4 hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 items-center justify-center rounded-md bg-primary/10">
                        <CreditCard className="size-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Credit requests</p>
                        <p className="text-2xl font-semibold tabular-nums">{stats.pending.creditRequests}</p>
                      </div>
                    </div>
                    <ArrowUpRight className="size-4 text-muted-foreground" />
                  </Link>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Event pipeline</CardTitle>
              <CardDescription>Current event statuses</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {stats === null ? (
                <Skeleton className="h-20 w-full" />
              ) : (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Published</span>
                    <span className="font-medium tabular-nums">{fmt(stats.eventStatusBreakdown.published)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Draft</span>
                    <span className="font-medium tabular-nums">{fmt(stats.eventStatusBreakdown.draft)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cancelled</span>
                    <span className="font-medium tabular-nums">{fmt(stats.eventStatusBreakdown.cancelled)}</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
