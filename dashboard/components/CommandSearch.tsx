"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ShieldCheck,
  CreditCard,
  Settings,
  User,
  Search,
  Users,
  CalendarDays,
  UserCog,
  Building2,
  FileText,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { REPORT_ITEMS } from "@/lib/reports";

const ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, keywords: ["home", "overview", "stats", "analytics"] },
  { href: "/verifications", label: "Verifications", icon: ShieldCheck, keywords: ["pending", "approve", "queue"] },
  { href: "/payments", label: "Credit requests", icon: CreditCard, keywords: ["pending", "credits", "publish"] },
  { href: "/organizers", label: "Organizers", icon: Building2, keywords: ["organizer", "list"] },
  { href: "/events", label: "Events", icon: CalendarDays, keywords: ["draft", "published", "registrations"] },
  { href: "/members", label: "Members", icon: Users, keywords: ["users", "signup"] },
  { href: "/admins", label: "Admin users", icon: UserCog, keywords: ["administrator", "create admin"] },
  { href: "/settings", label: "Settings", icon: Settings, keywords: ["theme", "dark", "light"] },
  { href: "/profile", label: "Profile", icon: User, keywords: ["account", "email"] },
  ...REPORT_ITEMS.map((r) => ({
    href: `/reports/${r.slug}`,
    label: `Report: ${r.label}`,
    icon: FileText,
    keywords: ["report", "export", r.slug, r.description.toLowerCase()],
  })),
];

export default function CommandSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ITEMS;
    return ITEMS.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.keywords.some((k) => k.includes(q) || q.includes(k)),
    );
  }, [query]);

  const navigate = useCallback(
    (href: string) => {
      setOpen(false);
      setQuery("");
      router.push(href);
    },
    [router],
  );

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-8 w-full items-center gap-2 rounded-lg border border-input bg-muted/40 px-2.5 text-sm text-muted-foreground hover:bg-muted/60"
      >
        <Search size={14} />
        <span className="flex-1 text-left">Search pages…</span>
        <kbd className="hidden sm:inline text-[10px] bg-background border rounded px-1">⌘K</kbd>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="p-0 gap-0 max-w-md">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle className="sr-only">Search</DialogTitle>
            <Input
              autoFocus
              placeholder="Search pages and reports…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </DialogHeader>
          <ul className="max-h-72 overflow-auto p-2">
            {filtered.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <button
                    type="button"
                    onClick={() => navigate(item.href)}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-accent text-left"
                  >
                    <Icon size={16} className="text-muted-foreground shrink-0" />
                    {item.label}
                  </button>
                </li>
              );
            })}
            {filtered.length === 0 && (
              <li className="px-2 py-6 text-center text-sm text-muted-foreground">No results</li>
            )}
          </ul>
        </DialogContent>
      </Dialog>
    </>
  );
}
