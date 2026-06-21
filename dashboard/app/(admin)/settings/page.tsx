"use client";

import { useTheme } from "next-themes";
import { Monitor, Moon, Sun } from "lucide-react";
import { useAdminSession } from "@/hooks/useAdminSession";
import { useIsClient } from "@/hooks/useIsClient";
import { removeToken } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const THEMES = [
  { id: "light", label: "Light", icon: Sun },
  { id: "dark", label: "Dark", icon: Moon },
  { id: "system", label: "System", icon: Monitor },
] as const;

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const session = useAdminSession();
  const mounted = useIsClient();

  async function signOut() {
    removeToken();
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 max-w-2xl">
      <PageHeader title="Settings" description="Preferences and account." />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Appearance</CardTitle>
          <CardDescription>Choose how the dashboard looks.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-3 gap-3">
          {THEMES.map(({ id, label, icon: Icon }) => {
            const active = mounted && theme === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setTheme(id)}
                className={`flex flex-col items-center gap-2 rounded-lg border px-3 py-4 text-sm font-medium transition-colors cursor-pointer ${
                  active
                    ? "border-primary bg-accent text-accent-foreground"
                    : "border-border hover:bg-muted"
                }`}
              >
                <Icon size={18} />
                {label}
              </button>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account</CardTitle>
          <CardDescription>Signed-in administrator.</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Email</dt>
              <dd className="font-medium truncate">{session?.email ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Role</dt>
              <dd className="font-medium">Administrator</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">User ID</dt>
              <dd className="font-medium">{session?.id ?? "—"}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Session</CardTitle>
          <CardDescription>Sign out on this device.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={signOut}>Sign out</Button>
        </CardContent>
      </Card>
    </div>
  );
}
