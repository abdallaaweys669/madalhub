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
import { AdminTableCard, ADMIN_TH, ADMIN_ACTIONS_TH, AdminActionsCell, AdminManageButton } from "@/components/admin/admin-table-card";
import { OrganizerDetailDialog } from "@/components/admin/admin-record-dialogs";
import { listOrganizers, type OrganizerListRow } from "@/lib/api";
import { useAdminList } from "@/hooks/useAdminList";

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "unverified", label: "Unverified" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

export default function OrganizersPage() {
  const fetcher = useCallback((params: Parameters<typeof listOrganizers>[0]) => listOrganizers(params), []);
  const { searchInput, onSearchChange, status, onStatusChange, setPage, data, loading, reload } =
    useAdminList<OrganizerListRow>(fetcher);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  function openOrganizer(id: number) {
    setSelectedId(id);
    setDialogOpen(true);
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-6 p-4 md:p-6">
      <PageHeader
        title="Organizers"
        description="Use Manage on a row to grant credits, review verification, suspend, and see events."
      />

      <ListToolbar
        search={searchInput}
        onSearchChange={onSearchChange}
        searchPlaceholder="Search org name, email…"
        status={status}
        onStatusChange={onStatusChange}
        statusOptions={STATUS_OPTIONS}
        statusLabel="Verification"
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
            <TableHead className={`${ADMIN_TH} w-[24%]`}>Organization</TableHead>
            <TableHead className={`${ADMIN_TH} w-[26%]`}>Contact</TableHead>
            <TableHead className={`${ADMIN_TH} w-[18%]`}>Verification</TableHead>
            <TableHead className={`${ADMIN_TH} w-[12%]`}>Credits</TableHead>
            <TableHead className={`${ADMIN_TH} w-[10%]`}>Events</TableHead>
            <TableHead className={`${ADMIN_TH} w-[14%]`}>Joined</TableHead>
            <TableHead className={ADMIN_ACTIONS_TH}>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                {Array.from({ length: 7 }).map((_, j) => (
                  <TableCell key={j} className="px-3">
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : !data?.items.length ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-16 text-muted-foreground">
                No organizers found
              </TableCell>
            </TableRow>
          ) : (
            data.items.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="max-w-0 px-3">
                  <p className="font-medium truncate" title={row.organizationName}>
                    {row.organizationName}
                  </p>
                  {row.website && (
                    <p className="text-xs text-muted-foreground truncate" title={row.website}>
                      {row.website}
                    </p>
                  )}
                </TableCell>
                <TableCell className="max-w-0 px-3">
                  <p className="text-sm truncate" title={row.fullName}>
                    {row.fullName}
                  </p>
                  <p className="text-xs text-muted-foreground truncate" title={row.email}>
                    {row.email}
                  </p>
                </TableCell>
                <TableCell className="px-3">
                  <Badge variant="secondary" className="capitalize bg-primary/10 text-primary border-0">
                    {row.verificationStatus}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm tabular-nums px-3">{row.paidPublishCredits}</TableCell>
                <TableCell className="text-sm tabular-nums px-3">{row.eventCount ?? 0}</TableCell>
                <TableCell className="text-sm text-muted-foreground whitespace-nowrap px-3">
                  {new Date(row.createdAt).toLocaleDateString()}
                </TableCell>
                <AdminActionsCell>
                  <AdminManageButton onClick={() => openOrganizer(row.id)} />
                </AdminActionsCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </AdminTableCard>

      <OrganizerDetailDialog
        organizerId={selectedId}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onUpdated={() => void reload()}
      />
    </div>
  );
}
