"use client";

import { useCallback, useState } from "react";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/page-header";
import { ListPagination, ListToolbar } from "@/components/admin/list-toolbar";
import { AdminTableCard, ADMIN_TH, ADMIN_ACTIONS_TH, AdminActionsCell, AdminManageButton, TruncateCell } from "@/components/admin/admin-table-card";
import { MemberDetailDialog } from "@/components/admin/admin-record-dialogs";
import { listMembers, type MemberRow } from "@/lib/api";
import { useAdminList } from "@/hooks/useAdminList";

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "pending", label: "Pending" },
  { value: "rejected", label: "Rejected" },
];

export default function MembersPage() {
  const fetcher = useCallback((params: Parameters<typeof listMembers>[0]) => listMembers(params), []);
  const { searchInput, onSearchChange, status, onStatusChange, setPage, data, loading, reload } =
    useAdminList<MemberRow>(fetcher);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  function openMember(id: number) {
    setSelectedId(id);
    setDialogOpen(true);
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-6 p-4 md:p-6">
      <PageHeader
        title="Members"
        description="Use Manage on a row to view profile, registrations, and suspend or reactivate."
      />

      <ListToolbar
        search={searchInput}
        onSearchChange={onSearchChange}
        searchPlaceholder="Search name or email…"
        status={status}
        onStatusChange={onStatusChange}
        statusOptions={STATUS_OPTIONS}
      />

      <AdminTableCard
        footer={
          data ? (
            <div className="px-4 pb-4">
              <ListPagination
                page={data.page}
                totalPages={data.totalPages}
                total={data.total}
                onPageChange={setPage}
              />
            </div>
          ) : undefined
        }
      >
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead className={`${ADMIN_TH} w-[16%]`}>Name</TableHead>
            <TableHead className={`${ADMIN_TH} w-[24%]`}>Email</TableHead>
            <TableHead className={`${ADMIN_TH} w-[30%]`}>Location</TableHead>
            <TableHead className={`${ADMIN_TH} w-[14%]`}>Status</TableHead>
            <TableHead className={`${ADMIN_TH} w-[14%]`}>Joined</TableHead>
            <TableHead className={ADMIN_ACTIONS_TH}>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                {Array.from({ length: 6 }).map((_, j) => (
                  <TableCell key={j} className="px-3">
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : !data?.items.length ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-16 text-muted-foreground">
                No members found
              </TableCell>
            </TableRow>
          ) : (
            data.items.map((row) => (
              <TableRow key={row.id}>
                <TruncateCell className="font-medium px-3" title={row.fullName}>
                  {row.fullName}
                </TruncateCell>
                <TruncateCell className="text-sm px-3" title={row.email}>
                  {row.email}
                </TruncateCell>
                <TruncateCell className="text-sm text-muted-foreground px-3" title={row.location ?? undefined}>
                  {row.location || "—"}
                </TruncateCell>
                <TableCell className="px-3">
                  <Badge variant="secondary" className="capitalize">
                    {row.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground whitespace-nowrap px-3">
                  {new Date(row.createdAt).toLocaleDateString()}
                </TableCell>
                <AdminActionsCell>
                  <AdminManageButton onClick={() => openMember(row.id)} />
                </AdminActionsCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </AdminTableCard>

      <MemberDetailDialog
        memberId={selectedId}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onUpdated={() => void reload()}
      />
    </div>
  );
}
