"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  ShieldCheck,
  CreditCard,
  Settings,
  LogOut,
  User,
  Users,
  CalendarDays,
  UserCog,
  Building2,
  FileText,
  Tags,
  ListChecks,
  ChevronDown,
} from "lucide-react";
import { removeToken } from "@/lib/auth";
import { REPORT_ITEMS } from "@/lib/reports";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/verifications", label: "Verifications", icon: ShieldCheck },
  { href: "/payments", label: "Credit requests", icon: CreditCard },
  { href: "/organizers", label: "Organizers", icon: Building2 },
  { href: "/events", label: "Events", icon: CalendarDays },
  { href: "/members", label: "Members", icon: Users },
  { href: "/categories", label: "Categories", icon: Tags },
  { href: "/verification-types", label: "Verification types", icon: ListChecks },
  { href: "/admins", label: "Admin users", icon: UserCog },
] as const;

function isNavActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`) || pathname.startsWith(`${href}?`);
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const reportsActive = pathname.startsWith("/reports/");
  const [reportsOpen, setReportsOpen] = useState(reportsActive);

  useEffect(() => {
    if (reportsActive) setReportsOpen(true);
  }, [reportsActive]);

  async function signOut() {
    removeToken();
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link href="/" />}>
              <Image
                src="/madalhub_logo.png"
                alt="MadalHub"
                width={32}
                height={32}
                className="size-8 shrink-0 rounded-lg object-contain"
                priority
              />
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">MadalHub</span>
                <span className="truncate text-xs text-muted-foreground">Admin</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => (
                <SidebarMenuItem key={href}>
                  <SidebarMenuButton
                    render={<Link href={href} />}
                    isActive={isNavActive(pathname, href, exact)}
                    tooltip={label}
                  >
                    <Icon />
                    <span>{label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}

              <SidebarMenuItem>
                <SidebarMenuButton
                  type="button"
                  onClick={() => setReportsOpen((open) => !open)}
                  isActive={reportsActive}
                  tooltip="Reports"
                  className="justify-between"
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <FileText />
                    <span>Reports</span>
                  </span>
                  <ChevronDown
                    className={cn(
                      "size-4 shrink-0 text-muted-foreground transition-transform group-data-[collapsible=icon]:hidden",
                      reportsOpen && "rotate-180",
                    )}
                  />
                </SidebarMenuButton>
                {reportsOpen ? (
                  <SidebarMenuSub>
                    {REPORT_ITEMS.map((report) => {
                      const href = `/reports/${report.slug}`;
                      return (
                        <SidebarMenuSubItem key={report.slug}>
                          <SidebarMenuSubButton
                            render={<Link href={href} />}
                            isActive={pathname === href}
                            size="sm"
                          >
                            <span>{report.label}</span>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      );
                    })}
                  </SidebarMenuSub>
                ) : null}
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              render={<Link href="/profile" />}
              isActive={pathname === "/profile"}
              tooltip="Profile"
            >
              <User />
              <span>Profile</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              render={<Link href="/settings" />}
              isActive={pathname === "/settings"}
              tooltip="Settings"
            >
              <Settings />
              <span>Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={signOut} tooltip="Sign out">
              <LogOut />
              <span>Sign out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
