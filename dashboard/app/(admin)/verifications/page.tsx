"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
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
import { AdminTableCard, ADMIN_TH } from "@/components/admin/admin-table-card";
import { PageHeader } from "@/components/page-header";
import { ListToolbar } from "@/components/admin/list-toolbar";
import RejectDialog from "@/components/RejectDialog";
import DocumentPreviewDialog from "@/components/DocumentPreviewDialog";
import {
  getPendingOrganizers,
  approveOrganizer,
  rejectOrganizer,
  type OrganizerRow,
} from "@/lib/api";
import { CheckCircle, XCircle, RefreshCw, FileText } from "lucide-react";

export default function VerificationsPage() {
  const [rows, setRows] = useState<OrganizerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<number | null>(null);
  const [rejectTarget, setRejectTarget] = useState<OrganizerRow | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [previewDoc, setPreviewDoc] = useState<{
    title: string;
    path: string;
    type?: string;
  } | null>(null);

  const load = useCallback(async () => {
    try {
      setRows(await getPendingOrganizers());
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    getPendingOrganizers()
      .then((data) => {
        if (!cancelled) setRows(data);
      })
      .catch((e: unknown) => {
        if (!cancelled) toast.error(e instanceof Error ? e.message : "Failed to load");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = searchInput.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (org) =>
        org.profile.organizationName.toLowerCase().includes(q) ||
        org.fullName.toLowerCase().includes(q) ||
        org.email.toLowerCase().includes(q) ||
        (org.profile.website?.toLowerCase().includes(q) ?? false) ||
        (org.document?.documentType?.toLowerCase().includes(q) ?? false),
    );
  }, [rows, searchInput]);

  async function handleApprove(org: OrganizerRow) {
    setActionId(org.id);
    try {
      await approveOrganizer(org.id);
      toast.success(`${org.profile.organizationName} approved`);
      setRows((prev) => prev.filter((r) => r.id !== org.id));
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setActionId(null);
    }
  }

  async function handleReject(reason: string) {
    if (!rejectTarget) return;
    await rejectOrganizer(rejectTarget.id, reason);
    toast.success(`${rejectTarget.profile.organizationName} rejected`);
    setRows((prev) => prev.filter((r) => r.id !== rejectTarget.id));
  }

  const emptyMessage =
    rows.length === 0
      ? "No pending verifications"
      : searchInput.trim()
        ? "No matches for your search"
        : "No pending verifications";

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-6 p-4 md:p-6">
      <PageHeader
        title="Verification queue"
        description={`${filtered.length} pending review`}
        actions={
          <Button variant="outline" size="sm" onClick={() => { setLoading(true); void load(); }} className="gap-2">
            <RefreshCw size={14} />
            Refresh
          </Button>
        }
      />

      <ListToolbar
        search={searchInput}
        onSearchChange={setSearchInput}
        searchPlaceholder="Search organization, name, email…"
      />

      <AdminTableCard>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead className={`${ADMIN_TH} w-[24%]`}>Organization</TableHead>
            <TableHead className={`${ADMIN_TH} w-[26%]`}>Name / Email</TableHead>
            <TableHead className={`${ADMIN_TH} w-[14%]`}>Status</TableHead>
            <TableHead className={`${ADMIN_TH} w-[16%]`}>Document</TableHead>
            <TableHead className={`${ADMIN_TH} w-[20%] text-right`}>Actions</TableHead>
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
          ) : filtered.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-16 text-muted-foreground">
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            filtered.map((org) => (
              <TableRow key={org.id}>
                <TableCell className="max-w-0 px-3">
                  <p className="font-medium truncate" title={org.profile.organizationName}>
                    {org.profile.organizationName}
                  </p>
                  {org.profile.website && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate" title={org.profile.website}>
                      {org.profile.website}
                    </p>
                  )}
                </TableCell>
                <TableCell className="max-w-0 px-3">
                  <p className="text-sm truncate" title={org.fullName}>
                    {org.fullName}
                  </p>
                  <p className="text-xs text-muted-foreground truncate" title={org.email}>
                    {org.email}
                  </p>
                </TableCell>
                <TableCell className="px-3">
                  <Badge variant="secondary" className="bg-primary/10 text-primary border-0 capitalize">
                    {org.verificationStatus}
                  </Badge>
                </TableCell>
                <TableCell className="px-3">
                  {org.document ? (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground capitalize">{org.document.documentType}</p>
                      <Button
                        type="button"
                        variant="link"
                        size="sm"
                        className="h-auto p-0 text-xs text-primary gap-1"
                        onClick={() =>
                          setPreviewDoc({
                            title: org.profile.organizationName,
                            path: org.document!.documentPath,
                            type: org.document!.documentType,
                          })
                        }
                      >
                        <FileText size={12} />
                        View document
                      </Button>
                    </div>
                  ) : (
                    <span className="text-destructive text-xs">Missing document</span>
                  )}
                </TableCell>
                <TableCell className="text-right px-3">
                  <div className="flex items-center justify-end gap-1.5">
                    <Button
                      size="sm"
                      className="gap-1 h-7 px-2 text-xs"
                      disabled={actionId === org.id || !org.document}
                      onClick={() => handleApprove(org)}
                    >
                      <CheckCircle size={12} />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1 h-7 px-2 text-xs text-destructive hover:text-destructive"
                      disabled={actionId === org.id}
                      onClick={() => setRejectTarget(org)}
                    >
                      <XCircle size={12} />
                      Reject
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </AdminTableCard>

      <RejectDialog
        open={!!rejectTarget}
        title={`Reject ${rejectTarget?.profile.organizationName ?? ""}`}
        onClose={() => setRejectTarget(null)}
        onConfirm={handleReject}
      />

      {previewDoc && (
        <DocumentPreviewDialog
          open={!!previewDoc}
          onClose={() => setPreviewDoc(null)}
          title={previewDoc.title}
          documentPath={previewDoc.path}
          documentType={previewDoc.type}
        />
      )}
    </div>
  );
}
