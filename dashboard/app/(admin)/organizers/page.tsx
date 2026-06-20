"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import RejectDialog from "@/components/RejectDialog";
import {
  getPendingOrganizers,
  approveOrganizer,
  rejectOrganizer,
  type OrganizerRow,
} from "@/lib/api";
import { CheckCircle, XCircle, ExternalLink, RefreshCw } from "lucide-react";

export default function OrganizersPage() {
  const [rows, setRows] = useState<OrganizerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<number | null>(null);
  const [rejectTarget, setRejectTarget] = useState<OrganizerRow | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    getPendingOrganizers()
      .then(setRows)
      .catch((e: unknown) => toast.error(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

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

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Organizer Verifications</h1>
          <p className="text-sm text-gray-500 mt-1">
            {loading ? "Loading…" : `${rows.length} pending`}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} className="gap-2">
          <RefreshCw size={14} />
          Refresh
        </Button>
      </div>

      <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/60">
              <TableHead className="font-semibold text-gray-600">Organization</TableHead>
              <TableHead className="font-semibold text-gray-600">Name / Email</TableHead>
              <TableHead className="font-semibold text-gray-600">Status</TableHead>
              <TableHead className="font-semibold text-gray-600">Document</TableHead>
              <TableHead className="text-right font-semibold text-gray-600">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 5 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-16 text-gray-400">
                  No pending organizer verifications
                </TableCell>
              </TableRow>
            ) : (
              rows.map((org) => (
                <TableRow key={org.id} className="hover:bg-orange-50/30 transition-colors">
                  <TableCell>
                    <p className="font-medium text-gray-900">{org.profile.organizationName}</p>
                    {org.profile.website && (
                      <p className="text-xs text-gray-400 mt-0.5">{org.profile.website}</p>
                    )}
                  </TableCell>
                  <TableCell>
                    <p className="text-sm text-gray-800">{org.fullName}</p>
                    <p className="text-xs text-gray-400">{org.email}</p>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="bg-amber-100 text-amber-700 border-0">
                      {org.verificationStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {org.document ? (
                      <div className="space-y-0.5">
                        <p className="text-xs text-gray-500 capitalize">{org.document.documentType}</p>
                        <a
                          href={`http://localhost:3000/${org.document.documentPath}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                          View doc <ExternalLink size={10} />
                        </a>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">No document</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        className="gap-1.5 text-white"
                        style={{ background: "linear-gradient(135deg,#FF7B3F,#FF5A1F)" }}
                        disabled={actionId === org.id}
                        onClick={() => handleApprove(org)}
                      >
                        <CheckCircle size={14} />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 text-red-600 border-red-200 hover:bg-red-50"
                        disabled={actionId === org.id}
                        onClick={() => setRejectTarget(org)}
                      >
                        <XCircle size={14} />
                        Reject
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <RejectDialog
        open={!!rejectTarget}
        title={`Reject ${rejectTarget?.profile.organizationName ?? ""}`}
        onClose={() => setRejectTarget(null)}
        onConfirm={handleReject}
      />
    </div>
  );
}
