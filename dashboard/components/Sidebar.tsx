"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { removeToken } from "@/lib/auth";
import {
  LayoutDashboard,
  BarChart2,
  ShieldCheck,
  CreditCard,
  Users,
  CalendarDays,
  Settings,
  LogOut,
} from "lucide-react";

const NAV = [
  {
    section: "OVERVIEW",
    items: [
      { href: "/", label: "Dashboard", icon: LayoutDashboard },
      { href: "/analytics", label: "Analytics", icon: BarChart2, soon: true },
    ],
  },
  {
    section: "MANAGEMENT",
    items: [
      { href: "/organizers", label: "Organizers", icon: ShieldCheck },
      { href: "/payments", label: "Payments", icon: CreditCard },
      { href: "/members", label: "Members", icon: Users, soon: true },
      { href: "/events", label: "Events", icon: CalendarDays, soon: true },
    ],
  },
  {
    section: "SETTINGS",
    items: [
      { href: "/settings", label: "Settings", icon: Settings, soon: true },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  async function handleSignOut() {
    removeToken();
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <aside
      className="flex flex-col w-[220px] min-h-screen shrink-0 border-r"
      style={{ background: "#FFFFFF", borderColor: "#E5E5E5" }}
    >
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-5 py-[18px] border-b" style={{ borderColor: "#E5E5E5" }}>
        <div
          className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0 text-white font-bold text-sm"
          style={{ background: "linear-gradient(135deg,#FF7B3F,#FF5A1F)" }}
        >
          M
        </div>
        <div>
          <p className="font-bold text-[#0F172A] text-sm leading-tight">MadalHub</p>
          <p className="text-[10px] text-[#A1A1A1] leading-tight">Dashboard</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
        {NAV.map(({ section, items }) => (
          <div key={section}>
            <p className="text-[10px] font-semibold text-[#A1A1A1] uppercase tracking-widest px-2 mb-1.5">
              {section}
            </p>
            <div className="space-y-0.5">
              {items.map(({ href, label, icon: Icon, soon }) => {
                const active = pathname === href;
                return (
                  <div key={href}>
                    {soon ? (
                      <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium text-[#A1A1A1] cursor-not-allowed select-none">
                        <Icon size={16} className="text-[#C4C4C4]" />
                        <span className="flex-1">{label}</span>
                        <span
                          className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
                          style={{ background: "#FFEFE5", color: "#FF7B3F" }}
                        >
                          Soon
                        </span>
                      </div>
                    ) : (
                      <Link
                        href={href}
                        className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-colors cursor-pointer"
                        style={
                          active
                            ? { background: "#FFEFE5", color: "#FF7B3F" }
                            : { color: "#555555" }
                        }
                      >
                        <Icon
                          size={16}
                          style={{ color: active ? "#FF7B3F" : "#888888" }}
                        />
                        {label}
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Profile + Sign out */}
      <div className="px-3 pb-4 pt-3 border-t" style={{ borderColor: "#E5E5E5" }}>
        <div className="flex items-center gap-2.5 px-2.5 py-2 mb-1">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
            style={{ background: "linear-gradient(135deg,#FF7B3F,#FF5A1F)" }}
          >
            A
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-[#0F172A] leading-tight">Admin</p>
            <p className="text-[11px] text-[#A1A1A1] leading-tight">Role 3</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-[13px] font-medium text-[#555555] hover:bg-gray-50 transition-colors cursor-pointer"
        >
          <LogOut size={15} className="text-[#888888]" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
