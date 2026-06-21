"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, LogOut, Settings, User } from "lucide-react";
import { useAdminSession } from "@/hooks/useAdminSession";
import { removeToken } from "@/lib/auth";

export default function UserMenu() {
  const [open, setOpen] = useState(false);
  const session = useAdminSession();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  async function signOut() {
    removeToken();
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  const initial = session?.initial ?? "A";
  const email = session?.email ?? "Admin";

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 ml-1 cursor-pointer rounded-lg px-1 py-1 hover:bg-muted transition-colors"
      >
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
          style={{ background: "linear-gradient(135deg,#FF7B3F,#FF5A1F)" }}
        >
          {initial}
        </div>
        <ChevronDown size={14} className="text-muted-foreground" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-border bg-popover shadow-lg z-50 py-1">
          <div className="px-3 py-2 border-b border-border">
            <p className="text-sm font-semibold text-foreground truncate">{email || "Admin"}</p>
            <p className="text-[11px] text-muted-foreground">Administrator</p>
          </div>
          <Link
            href="/profile"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
          >
            <User size={15} className="text-muted-foreground" />
            Profile
          </Link>
          <Link
            href="/settings"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
          >
            <Settings size={15} className="text-muted-foreground" />
            Settings
          </Link>
          <button
            type="button"
            onClick={signOut}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <LogOut size={15} className="text-muted-foreground" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
