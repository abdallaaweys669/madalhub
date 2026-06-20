"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import Sparkline from "@/components/Sparkline";
import { getAdminStats, type AdminStats } from "@/lib/api";
import {
  Users,
  Building2,
  CalendarDays,
  Ticket,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";

/* ─── helpers ─────────────────────────────────────────────────────────────── */

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function fmtMoney(n: number) {
  if (n >= 1000) return `$${n.toLocaleString()}`;
  return `$${n}`;
}

function fmtNum(n: number) {
  return n.toLocaleString();
}

function newThisMonthLabel(count: number) {
  if (count === 0) return "No new this month";
  if (count === 1) return "1 new this month";
  return `${fmtNum(count)} new this month`;
}

function monthCompareHint(thisMonth: number, lastMonth: number) {
  if (thisMonth === 0 && lastMonth === 0) return null;
  if (lastMonth === 0) return "No new sign-ups last month";
  const diff = thisMonth - lastMonth;
  const pct = Math.round((diff / lastMonth) * 100);
  if (diff === 0) return `Same as last month (${fmtNum(lastMonth)})`;
  const direction = diff > 0 ? "up" : "down";
  return `${Math.abs(pct)}% ${direction} from last month (${fmtNum(lastMonth)})`;
}

function CompareBadge({ thisMonth, lastMonth }: { thisMonth: number; lastMonth: number }) {
  const hint = monthCompareHint(thisMonth, lastMonth);
  if (!hint) return null;

  if (thisMonth === lastMonth) {
    return (
      <div className="flex items-center gap-1 mt-1.5">
        <Minus size={11} style={{ color: "#94A3B8" }} />
        <span className="text-[11px] font-medium" style={{ color: "#64748B" }}>
          {hint}
        </span>
      </div>
    );
  }

  const up = thisMonth > lastMonth;
  return (
    <div className="flex items-center gap-1 mt-1.5">
      {up ? (
        <TrendingUp size={11} style={{ color: "#16A34A" }} />
      ) : (
        <TrendingDown size={11} style={{ color: "#DC2626" }} />
      )}
      <span
        className="text-[11px] font-medium"
        style={{ color: up ? "#16A34A" : "#DC2626" }}
      >
        {hint}
      </span>
    </div>
  );
}

function timeAgo(date: string | Date) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

/* ─── KPI card ────────────────────────────────────────────────────────────── */

function KpiCard({
  label,
  value,
  newThisMonth,
  lastMonth,
  trend,
  color = "#FF7B3F",
  icon: Icon,
}: {
  label: string;
  value: string;
  newThisMonth: number;
  lastMonth: number;
  trend: number[];
  color?: string;
  icon: React.ElementType;
}) {
  return (
    <div
      className="flex items-start justify-between p-5 rounded-2xl"
      style={{ background: "#FFFFFF", border: "1px solid rgba(255,123,63,0.15)" }}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 mb-2">
          <div
            className="w-6 h-6 rounded-md flex items-center justify-center"
            style={{ background: "#FFEFE5" }}
          >
            <Icon size={13} style={{ color: "#FF7B3F" }} />
          </div>
          <span className="text-[12px] font-medium" style={{ color: "#555555" }}>
            {label}
          </span>
        </div>
        <p className="text-[28px] font-bold leading-tight" style={{ color: "#0F172A" }}>
          {value}
        </p>
        <p className="text-[12px] font-medium mt-1.5" style={{ color: "#64748B" }}>
          {newThisMonthLabel(newThisMonth)}
        </p>
        <CompareBadge thisMonth={newThisMonth} lastMonth={lastMonth} />
      </div>
      <div className="shrink-0 self-center ml-3">
        <Sparkline data={trend} color={color} />
      </div>
    </div>
  );
}

/* ─── Page ────────────────────────────────────────────────────────────────── */

export default function OverviewPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loadError, setLoadError] = useState("");
  const [chartTab, setChartTab] = useState<"MRR" | "ARR">("MRR");

  const load = useCallback(() => {
    setLoadError("");
    getAdminStats()
      .then(setStats)
      .catch((err: unknown) => {
        setStats(null);
        setLoadError(err instanceof Error ? err.message : "Failed to load dashboard data.");
      });
  }, []);

  useEffect(() => { load(); }, [load]);

  const totalPending = stats
    ? stats.pending.verifications + stats.pending.payments
    : 0;
  const totalActions = totalPending + 10; // "Others"

  const kpis = stats
    ? [
        {
          label: "Members",
          value: fmtNum(stats.totals.members),
          newThisMonth: stats.thisMonth.members,
          lastMonth: stats.lastMonth.members,
          trend: stats.trends.members,
          color: "#FF7B3F",
          icon: Users,
        },
        {
          label: "Organizers",
          value: fmtNum(stats.totals.organizers),
          newThisMonth: stats.thisMonth.organizers,
          lastMonth: stats.lastMonth.organizers,
          trend: stats.trends.organizers,
          color: "#6366F1",
          icon: Building2,
        },
        {
          label: "Events",
          value: fmtNum(stats.totals.events),
          newThisMonth: stats.thisMonth.events,
          lastMonth: stats.lastMonth.events,
          trend: stats.trends.events,
          color: "#0EA5E9",
          icon: CalendarDays,
        },
        {
          label: "Registrations",
          value: fmtNum(stats.totals.registrations),
          newThisMonth: stats.thisMonth.registrations,
          lastMonth: stats.lastMonth.registrations,
          trend: stats.trends.registrations,
          color: "#22C55E",
          icon: Ticket,
        },
      ]
    : null;

  /* ── recent activity descriptors ── */
  const activityItems = stats?.recentActivity.slice(0, 5).map((item, i) => {
    if (item.type === "verification") {
      const pending = item.status === "pending";
      return {
        key: i,
        icon: pending ? (
          <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "#FFEFE5" }}>
            <ShieldCheck size={14} style={{ color: "#FF7B3F" }} />
          </div>
        ) : (
          <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "#DCFCE7" }}>
            <CheckCircle2 size={14} style={{ color: "#22C55E" }} />
          </div>
        ),
        text: (
          <span style={{ color: "#555555", fontSize: 13 }}>
            New organizer registration by{" "}
            <span style={{ color: "#0F172A", fontWeight: 600 }}>{item.name}</span>
          </span>
        ),
        time: timeAgo(item.createdAt),
      };
    }
    const approved = item.status === "approved";
    return {
      key: i,
      icon: (
        <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: approved ? "#DCFCE7" : "#FFEFE5" }}>
          <CreditCard size={14} style={{ color: approved ? "#22C55E" : "#FF7B3F" }} />
        </div>
      ),
      text: (
        <span style={{ color: "#555555", fontSize: 13 }}>
          {approved ? "Payment of " : "Payment request submitted by "}
          {approved ? (
            <>
              <span style={{ color: "#0F172A", fontWeight: 600 }}>${item.amount}</span>
              {" approved to "}
              <span style={{ color: "#0F172A", fontWeight: 600 }}>{item.name}</span>
            </>
          ) : (
            <span style={{ color: "#0F172A", fontWeight: 600 }}>{item.name}</span>
          )}
        </span>
      ),
      time: timeAgo(item.createdAt),
    };
  }) ?? [];

  /* ── recent "deployments" repurposed as latest payments ── */
  const deployments = stats?.recentActivity
    .filter((a) => a.type === "payment")
    .slice(0, 2)
    .map((a, i) => ({
      key: i,
      label: a.plan === "bundle" ? "Bundle plan approved" : "Single plan approved",
      env: a.status === "approved" ? "Production" : "Pending",
      branch: a.plan ?? "main",
      approved: a.status === "approved",
      time: timeAgo(a.createdAt),
    })) ?? [];

  return (
    <div style={{ background: "#F8FAFC", minHeight: "100%" }}>

      {/* ══ HERO ══════════════════════════════════════════════════════════ */}
      <div
        className="relative overflow-hidden px-8 pt-7 pb-7"
        style={{
          background: "linear-gradient(130deg, #FFF0E8 0%, #FFE0CC 55%, #FFCFB3 100%)",
        }}
      >
        {/* Decorative circles */}
        <div className="absolute -top-10 right-24 w-48 h-48 rounded-full opacity-30"
          style={{ background: "radial-gradient(circle, #FF9A6C, transparent)" }} />
        <div className="absolute -top-4 right-4 w-32 h-32 rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, #FF7B3F, transparent)" }} />
        <div className="absolute top-8 right-40 w-16 h-16 rounded-full opacity-15"
          style={{ background: "#FF7B3F" }} />

        {/* Greeting */}
        <div className="relative mb-5">
          <h1 className="text-[26px] font-bold leading-tight" style={{ color: "#0F172A" }}>
            {greeting()}, Admin 👋
          </h1>
          <p className="mt-1 text-[13px]" style={{ color: "#555555" }}>
            Here&apos;s what&apos;s happening today.
          </p>
          {loadError && (
            <div
              className="mt-4 px-4 py-3 rounded-xl text-sm font-medium flex items-center justify-between gap-3"
              style={{ background: "#FEE2E2", color: "#991B1B", border: "1px solid #FECACA" }}
            >
              <span>{loadError}</span>
              <button
                type="button"
                onClick={load}
                className="shrink-0 text-[12px] font-semibold underline cursor-pointer"
              >
                Retry
              </button>
            </div>
          )}
        </div>

        {/* KPI cards */}
        <div className="relative grid grid-cols-2 xl:grid-cols-4 gap-4">
          {kpis === null
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="p-5 rounded-2xl bg-white">
                  <Skeleton className="h-3 w-20 mb-3" />
                  <Skeleton className="h-8 w-28 mb-2" />
                  <Skeleton className="h-3 w-32" />
                </div>
              ))
            : kpis.map((k) => <KpiCard key={k.label} {...k} />)}
        </div>
      </div>

      {/* ══ MAIN CONTENT ════════════════════════════════════════════════ */}
      <div className="px-8 py-6 grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* ── LEFT: Revenue chart ── */}
        <div
          className="xl:col-span-2 rounded-2xl p-6"
          style={{ background: "#FFFFFF", border: "1px solid #E5E5E5" }}
        >
          <div className="flex items-start justify-between mb-5">
            <div>
              <p className="font-semibold text-[15px]" style={{ color: "#0F172A" }}>
                Revenue Growth
              </p>
              <p className="text-[12px] mt-0.5" style={{ color: "#A1A1A1" }}>
                Monthly recurring revenue trend
              </p>
            </div>
            <div className="flex items-center gap-1">
              {(["MRR", "ARR"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setChartTab(tab)}
                  className="px-3 py-1 rounded-md text-[12px] font-semibold transition-colors cursor-pointer"
                  style={
                    chartTab === tab
                      ? { background: "#FFEFE5", color: "#FF7B3F" }
                      : { background: "transparent", color: "#A1A1A1" }
                  }
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {stats === null ? (
            <Skeleton className="h-52 w-full rounded-xl" />
          ) : (
            <div className="relative">
              {/* Current value label */}
              <div
                className="absolute top-2 right-2 text-[11px] font-semibold px-2 py-1 rounded-md z-10"
                style={{ background: "#FFEFE5", color: "#FF7B3F" }}
              >
                {stats.monthlyRevenue.at(-1)?.month ?? ""}{" "}
                {fmtMoney(stats.monthlyRevenue.at(-1)?.revenue ?? 0)}
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart
                  data={stats.monthlyRevenue}
                  margin={{ top: 20, right: 8, left: -12, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FF7B3F" stopOpacity={0.18} />
                      <stop offset="95%" stopColor="#FF7B3F" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11, fill: "#A1A1A1" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#A1A1A1" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `$${v}`}
                  />
                  <Tooltip
                    formatter={(v) => [`$${v ?? 0}`, "Revenue"]}
                    contentStyle={{
                      borderRadius: 10,
                      border: "none",
                      boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                      fontSize: 12,
                    }}
                    cursor={{ stroke: "#FF7B3F", strokeWidth: 1, strokeDasharray: "4 4" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#FF7B3F"
                    strokeWidth={2}
                    fill="url(#revGrad)"
                    dot={{ fill: "#FF7B3F", r: 3.5, strokeWidth: 0 }}
                    activeDot={{ r: 5.5, fill: "#FF7B3F", strokeWidth: 0 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* ── RIGHT: Pending + Recent Activity ── */}
        <div className="flex flex-col gap-4">

          {/* Pending Actions */}
          <div
            className="rounded-2xl p-5"
            style={{ background: "#FFFFFF", border: "1px solid #E5E5E5" }}
          >
            <div className="flex items-center justify-between mb-0.5">
              <p className="font-semibold text-[14px]" style={{ color: "#0F172A" }}>
                Pending Actions
              </p>
              <Link
                href="/organizers"
                className="flex items-center gap-0.5 text-[12px] font-semibold hover:underline"
                style={{ color: "#FF7B3F" }}
              >
                View all <ArrowRight size={11} />
              </Link>
            </div>
            <p className="text-[12px] mb-4" style={{ color: "#A1A1A1" }}>
              {stats
                ? `You have ${totalPending} pending actions`
                : "Loading…"}
            </p>

            {stats ? (
              <>
                {/* Progress bar */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[22px] font-bold" style={{ color: "#0F172A" }}>
                    {totalPending} / {totalActions}
                  </span>
                </div>
                <div className="flex h-2 rounded-full overflow-hidden gap-0.5 mb-3">
                  <div
                    className="rounded-l-full"
                    style={{
                      width: `${(stats.pending.verifications / totalActions) * 100}%`,
                      background: "#FF7B3F",
                      minWidth: stats.pending.verifications > 0 ? 4 : 0,
                    }}
                  />
                  <div
                    style={{
                      width: `${(stats.pending.payments / totalActions) * 100}%`,
                      background: "#22C55E",
                      minWidth: stats.pending.payments > 0 ? 4 : 0,
                    }}
                  />
                  <div
                    className="rounded-r-full flex-1"
                    style={{ background: "#F59E0B" }}
                  />
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-1">
                  {[
                    { label: `Verifications (${stats.pending.verifications})`, color: "#FF7B3F" },
                    { label: `Payments (${stats.pending.payments})`, color: "#22C55E" },
                    { label: "Others (10)", color: "#F59E0B" },
                  ].map(({ label, color }) => (
                    <span key={label} className="flex items-center gap-1 text-[11px]" style={{ color: "#555555" }}>
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
                      {label}
                    </span>
                  ))}
                </div>
              </>
            ) : (
              <Skeleton className="h-2 w-full rounded-full" />
            )}
          </div>

          {/* Recent Activity */}
          <div
            className="rounded-2xl p-5 flex-1"
            style={{ background: "#FFFFFF", border: "1px solid #E5E5E5" }}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="font-semibold text-[14px]" style={{ color: "#0F172A" }}>
                Recent Activity
              </p>
              <Link
                href="/organizers"
                className="flex items-center gap-0.5 text-[12px] font-semibold hover:underline"
                style={{ color: "#FF7B3F" }}
              >
                View all <ArrowRight size={11} />
              </Link>
            </div>

            {stats === null ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Skeleton className="w-7 h-7 rounded-full shrink-0" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-3 w-full" />
                    </div>
                    <Skeleton className="h-3 w-10 shrink-0" />
                  </div>
                ))}
              </div>
            ) : activityItems.length === 0 ? (
              <p className="text-[12px] text-center py-4" style={{ color: "#A1A1A1" }}>
                No recent activity
              </p>
            ) : (
              <div className="space-y-3.5">
                {activityItems.map((item) => (
                  <div key={item.key} className="flex items-start gap-2.5">
                    {item.icon}
                    <div className="flex-1 min-w-0">
                      <div className="leading-snug">{item.text}</div>
                    </div>
                    <span
                      className="text-[11px] shrink-0 mt-0.5"
                      style={{ color: "#A1A1A1" }}
                    >
                      {item.time}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ══ BOTTOM ROW ══════════════════════════════════════════════════ */}
      <div className="px-8 pb-8 grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* This Month Growth */}
        <div
          className="xl:col-span-2 rounded-2xl p-6"
          style={{ background: "#FFFFFF", border: "1px solid #E5E5E5" }}
        >
          <p className="font-semibold text-[15px] mb-0.5" style={{ color: "#0F172A" }}>
            This Month Growth
          </p>
          <p className="text-[12px] mb-5" style={{ color: "#A1A1A1" }}>
            New sign-ups and activity from your database
          </p>

          {stats === null ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-5 w-full rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {[
                { label: "Members", icon: Users, thisMonth: stats.thisMonth.members, lastMonth: stats.lastMonth.members, trend: stats.trends.members },
                { label: "Organizers", icon: Building2, thisMonth: stats.thisMonth.organizers, lastMonth: stats.lastMonth.organizers, trend: stats.trends.organizers },
                { label: "Events", icon: CalendarDays, thisMonth: stats.thisMonth.events, lastMonth: stats.lastMonth.events, trend: stats.trends.events },
                { label: "Registrations", icon: Ticket, thisMonth: stats.thisMonth.registrations, lastMonth: stats.lastMonth.registrations, trend: stats.trends.registrations },
              ].map(({ label, icon: Icon, thisMonth, lastMonth, trend }) => {
                const peak = Math.max(...trend, 1);
                return (
                  <div key={label} className="flex items-center gap-3">
                    <div
                      className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
                      style={{ background: "#FFEFE5" }}
                    >
                      <Icon size={13} style={{ color: "#FF7B3F" }} />
                    </div>
                    <div className="w-28 shrink-0">
                      <span className="text-[13px] font-medium block" style={{ color: "#555555" }}>
                        {label}
                      </span>
                      <span className="text-[11px]" style={{ color: "#94A3B8" }}>
                        {fmtNum(thisMonth)} new · {fmtNum(lastMonth)} last mo.
                      </span>
                    </div>
                    <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "#F1F5F9" }}>
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min((thisMonth / peak) * 100, 100)}%`,
                          background: "linear-gradient(90deg,#FF7B3F,#FF5A1F)",
                        }}
                      />
                    </div>
                    <div className="w-24 shrink-0 text-right text-[11px] font-medium">
                      {(() => {
                        if (lastMonth === 0 && thisMonth === 0) {
                          return <span style={{ color: "#94A3B8" }}>—</span>;
                        }
                        if (lastMonth === 0) {
                          return <span style={{ color: "#16A34A" }}>New</span>;
                        }
                        const pct = Math.round(((thisMonth - lastMonth) / lastMonth) * 100);
                        if (pct === 0) {
                          return <span style={{ color: "#64748B" }}>Flat</span>;
                        }
                        const up = pct > 0;
                        return (
                          <span style={{ color: up ? "#16A34A" : "#DC2626" }}>
                            {up ? "↑" : "↓"}
                            {Math.abs(pct)}%
                          </span>
                        );
                      })()}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Deployments */}
        <div
          className="rounded-2xl p-5"
          style={{ background: "#FFFFFF", border: "1px solid #E5E5E5" }}
        >
          <div className="flex items-center justify-between mb-1">
            <p className="font-semibold text-[14px]" style={{ color: "#0F172A" }}>
              Recent Payments
            </p>
            <Link
              href="/payments"
              className="flex items-center gap-0.5 text-[12px] font-semibold hover:underline"
              style={{ color: "#FF7B3F" }}
            >
              View all <ArrowRight size={11} />
            </Link>
          </div>
          <p className="text-[12px] mb-4" style={{ color: "#A1A1A1" }}>
            Latest payment requests
          </p>

          {stats === null ? (
            <div className="space-y-4">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="flex items-start gap-3">
                  <Skeleton className="w-7 h-7 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : deployments.length === 0 ? (
            <p className="text-[12px] text-center py-4" style={{ color: "#A1A1A1" }}>
              No recent payments
            </p>
          ) : (
            <div className="space-y-4">
              {deployments.map((d) => (
                <div key={d.key} className="flex items-start gap-3">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: d.approved ? "#DCFCE7" : "#FFEFE5" }}
                  >
                    {d.approved ? (
                      <CheckCircle2 size={14} style={{ color: "#22C55E" }} />
                    ) : (
                      <AlertCircle size={14} style={{ color: "#FF7B3F" }} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium leading-tight" style={{ color: "#0F172A" }}>
                      {d.label}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                        style={{
                          background: d.approved ? "#DCFCE7" : "#FFEFE5",
                          color: d.approved ? "#16A34A" : "#FF7B3F",
                        }}
                      >
                        {d.env}
                      </span>
                      <span className="text-[11px]" style={{ color: "#A1A1A1" }}>
                        · {d.branch}
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] shrink-0 mt-0.5" style={{ color: "#A1A1A1" }}>
                    {d.time}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
