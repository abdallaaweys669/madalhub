import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "16rem",
          "--header-height": "3.5rem",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset className="min-w-0">
        <SiteHeader />
        <div className="flex min-w-0 flex-1 flex-col overflow-x-hidden">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
