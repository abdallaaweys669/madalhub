"use client";

import Link from "next/link";
import { Mail, Shield, Settings } from "lucide-react";
import { useAdminSession } from "@/hooks/useAdminSession";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function ProfilePage() {
  const session = useAdminSession();
  const initial = session?.initial ?? "A";
  const email = session?.email ?? "";

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 max-w-2xl">
      <PageHeader title="Profile" description="Your admin account." />

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4 mb-6">
            <Avatar className="size-16 rounded-xl">
              <AvatarFallback
                className="rounded-xl text-white text-xl font-bold"
                style={{ background: "linear-gradient(135deg,#FF7B3F,#FF5A1F)" }}
              >
                {initial}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-lg font-semibold">{email.split("@")[0] || "Admin"}</p>
              <p className="text-sm text-muted-foreground">{email || "Not signed in"}</p>
            </div>
          </div>

          <div className="space-y-4 text-sm">
            <div className="flex items-center gap-3">
              <Mail size={16} className="text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">Email</span>
              <span className="ml-auto font-medium truncate">{email || "—"}</span>
            </div>
            <div className="flex items-center gap-3">
              <Shield size={16} className="text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">Access</span>
              <span className="ml-auto font-medium">Administrator</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Link href="/settings">
        <Button variant="outline" className="w-fit gap-2">
          <Settings size={16} />
          Open settings
        </Button>
      </Link>
    </div>
  );
}
