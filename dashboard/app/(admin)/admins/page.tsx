"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminTableCard, ADMIN_TH, TruncateCell } from "@/components/admin/admin-table-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/page-header";
import { ListPagination, ListToolbar } from "@/components/admin/list-toolbar";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createAdmin, listAdmins, updateAdmin, type AdminUserRow } from "@/lib/api";
import { useAdminList } from "@/hooks/useAdminList";
import { useAdminSession } from "@/hooks/useAdminSession";
import { Plus } from "lucide-react";

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "pending", label: "Pending" },
  { value: "rejected", label: "Rejected" },
];

const PRIMARY_ADMIN_EMAIL = "admin@gmail.com";

function isPrimaryAdmin(email: string) {
  return email.trim().toLowerCase() === PRIMARY_ADMIN_EMAIL;
}

export default function AdminsPage() {
  const session = useAdminSession();
  const fetcher = useCallback((params: Parameters<typeof listAdmins>[0]) => listAdmins(params), []);
  const { searchInput, onSearchChange, status, onStatusChange, setPage, data, loading, error, reload } =
    useAdminList<AdminUserRow>(fetcher);

  const [open, setOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await createAdmin({ fullName: fullName.trim(), email: email.trim(), password });
      toast.success("Admin created");
      setOpen(false);
      setFullName("");
      setEmail("");
      setPassword("");
      void reload();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to create admin");
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(admin: AdminUserRow) {
    const next = admin.status === "active" ? "rejected" : "active";
    if (next === "rejected") {
      if (isPrimaryAdmin(admin.email)) {
        toast.error("The primary admin account cannot be deactivated");
        return;
      }
      if (session?.id === admin.id) {
        toast.error("You cannot deactivate your own account");
        return;
      }
    }
    try {
      await updateAdmin(admin.id, { status: next });
      toast.success(`Admin ${next === "active" ? "activated" : "deactivated"}`);
      void reload();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    }
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-6 p-4 md:p-6">
      <PageHeader
        title="Admin users"
        description="Create and manage dashboard administrators."
        actions={
          <Button size="sm" className="gap-1.5" onClick={() => setOpen(true)}>
            <Plus size={14} />
            Add admin
          </Button>
        }
      />

      <ListToolbar
        search={searchInput}
        onSearchChange={onSearchChange}
        searchPlaceholder="Search name or email…"
        status={status}
        onStatusChange={onStatusChange}
        statusOptions={STATUS_OPTIONS}
      />

      {error ? (
        <p className="text-sm text-destructive rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2">
          Could not load admins: {error}. Is the backend running on port 3000?
        </p>
      ) : null}

      {!loading && !error && status === "active" && data?.total === 0 ? (
        <p className="text-sm text-muted-foreground rounded-lg border bg-muted/30 px-3 py-2">
          No active admins. If you deactivated an account, switch Status to{" "}
          <button type="button" className="text-primary underline" onClick={() => onStatusChange("all")}>
            All statuses
          </button>{" "}
          or{" "}
          <button type="button" className="text-primary underline" onClick={() => onStatusChange("rejected")}>
            Rejected
          </button>{" "}
          to find and reactivate it.
        </p>
      ) : null}

      <AdminTableCard
        footer={
          data ? (
            <div className="px-4 pb-4">
              <ListPagination page={data.page} totalPages={data.totalPages} total={data.total} onPageChange={setPage} />
            </div>
          ) : undefined
        }
      >
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead className={`${ADMIN_TH} w-[20%]`}>Name</TableHead>
            <TableHead className={`${ADMIN_TH} w-[28%]`}>Email</TableHead>
            <TableHead className={`${ADMIN_TH} w-[14%]`}>Status</TableHead>
            <TableHead className={`${ADMIN_TH} w-[16%]`}>Created</TableHead>
            <TableHead className={`${ADMIN_TH} w-[22%] text-right`}>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <TableRow key={i}>
                {Array.from({ length: 5 }).map((_, j) => (
                  <TableCell key={j} className="px-3">
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : !data?.items.length ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-16 text-muted-foreground">
                {error
                  ? "Could not load admin accounts."
                  : status === "active"
                    ? "No active admins. Try All statuses or Rejected."
                    : "No admins found. Use Add admin to create one."}
              </TableCell>
            </TableRow>
          ) : (
            data.items.map((row) => {
              const isSelf = session?.id === row.id;
              const isPrimary = isPrimaryAdmin(row.email);
              const canDeactivate = row.status === "active" && !isSelf && !isPrimary;
              return (
              <TableRow key={row.id}>
                <TruncateCell className="font-medium px-3" title={row.fullName}>
                  {row.fullName}
                  {isSelf ? (
                    <span className="ml-1.5 text-xs font-normal text-muted-foreground">(you)</span>
                  ) : null}
                  {isPrimary ? (
                    <span className="ml-1.5 text-xs font-normal text-muted-foreground">(primary)</span>
                  ) : null}
                </TruncateCell>
                <TruncateCell className="px-3" title={row.email}>
                  {row.email}
                </TruncateCell>
                <TableCell className="px-3">
                  <Badge variant="secondary" className="capitalize">{row.status}</Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground whitespace-nowrap px-3">
                  {new Date(row.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right px-3">
                  {row.status !== "active" ? (
                    <Button variant="outline" size="sm" onClick={() => void toggleStatus(row)}>
                      Activate
                    </Button>
                  ) : canDeactivate ? (
                    <Button variant="outline" size="sm" onClick={() => void toggleStatus(row)}>
                      Deactivate
                    </Button>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      {isPrimary ? "Primary admin" : "Current account"}
                    </span>
                  )}
                </TableCell>
              </TableRow>
              );
            })
          )}
        </TableBody>
      </AdminTableCard>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create admin</DialogTitle>
          </DialogHeader>
          <form id="create-admin" onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-name">Full name</Label>
              <Input id="admin-name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-email">Email</Label>
              <Input id="admin-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-password">Password</Label>
              <Input id="admin-password" type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
          </form>
          <DialogFooter>
            <Button type="submit" form="create-admin" disabled={saving}>
              {saving ? "Creating…" : "Create admin"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
