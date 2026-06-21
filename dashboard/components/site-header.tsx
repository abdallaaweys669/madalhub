"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import CommandSearch from "@/components/CommandSearch";
import ThemeToggle from "@/components/ThemeToggle";
import UserMenu from "@/components/UserMenu";
import { getReportConfig } from "@/lib/reports";

const TITLES: Record<string, string> = {
  "/": "Dashboard",
  "/verifications": "Verifications",
  "/organizers": "Organizers",
  "/payments": "Credit requests",
  "/members": "Members",
  "/events": "Events",
  "/admins": "Admin users",
  "/profile": "Profile",
  "/settings": "Settings",
};

function getTitle(pathname: string) {
  if (pathname.startsWith("/reports/")) {
    const slug = pathname.replace("/reports/", "");
    return getReportConfig(slug)?.label ?? "Reports";
  }
  return TITLES[pathname] ?? "Admin";
}

export function SiteHeader() {
  const pathname = usePathname();
  const title = getTitle(pathname);
  const isReport = pathname.startsWith("/reports/");

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background px-4 lg:px-6">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-1 data-[orientation=vertical]:h-4" />
      <Breadcrumb className="hidden sm:block">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href="/" />}>MadalHub</BreadcrumbLink>
          </BreadcrumbItem>
          {pathname !== "/" && (
            <>
              {isReport && (
                <>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbLink render={<Link href="/reports/user-growth" />}>Reports</BreadcrumbLink>
                  </BreadcrumbItem>
                </>
              )}
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{title}</BreadcrumbPage>
              </BreadcrumbItem>
            </>
          )}
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex-1 max-w-xs ml-auto hidden md:block">
        <CommandSearch />
      </div>
      <div className="flex items-center gap-1 ml-auto md:ml-0">
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  );
}
