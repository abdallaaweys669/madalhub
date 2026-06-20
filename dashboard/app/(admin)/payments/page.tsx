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
  getPendingPayments,
  approvePayment,
  rejectPayment,
  type PaymentRow,
} from "@/lib/api";
import { CheckCircle, XCircle, RefreshCw } from "lucide-react";

const PLAN_LABELS: Record<string, string> = {
  single: "Single publish ($5)",
  bundle: "Bundle 5x ($20)",
};

export default function PaymentsPage() {
  const [rows, setRows] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<number | null>(null);
  const [rejectTarget, setRejectTarget] = useState<PaymentRow | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    getPendingPayments()
      .then(setRows)
      .catch((e: unknown) => toast.error(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleApprove(row: PaymentRow) {
    setActionId(row.id);
    try {
      await approvePayment(row.id);
      toast.success(`Payment #${row.id} approved — credits granted`);
      setRows((prev) => prev.filter((r) => r.id !== row.id));
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setActionId(null);
    }
  }

  async function handleReject(reason: string) {
    if (!rejectTarget) return;
    await rejectPayment(rejectTarget.id, reason);
    toast.success(`Payment #${rejectTarget.id} rejected`);
    setRows((prev) => prev.filter((r) => r.id !== rejectTarget.id));
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payment Requests</h1>
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
              <TableHead className="font-semibold text-gray-600">#</TableHead>
              <TableHead className="font-semibold text-gray-600">Organizer</TableHead>
              <TableHead className="font-semibold text-gray-600">Plan</TableHead>
              <TableHead className="font-semibold text-gray-600">Amount</TableHead>
              <TableHead className="font-semibold text-gray-600">Reference / Note</TableHead>
              <TableHead className="font-semibold text-gray-600">Submitted</TableHead>
              <TableHead className="text-right font-semibold text-gray-600">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-16 text-gray-400">
                  No pending payment requests
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id} className="hover:bg-orange-50/30 transition-colors">
                  <TableCell className="text-gray-400 text-sm">#{row.id}</TableCell>
                  <TableCell>
                    <p className="font-medium text-gray-900">{row.organizerName}</p>
                    <p className="text-xs text-gray-400">{row.organizerEmail ?? "—"}</p>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="bg-violet-100 text-violet-700 border-0 capitalize">
                      {PLAN_LABELS[row.plan] ?? row.plan}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-semibold text-gray-900">
                    ${row.amountUsd}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600 max-w-[180px]">
                    {row.paymentReference && (
                      <p className="font-mono text-xs bg-gray-50 px-2 py-1 rounded mb-1 truncate">
                        {row.paymentReference}
                      </p>
                    )}
                    {row.note && <p className="text-gray-400 text-xs truncate">{row.note}</p>}
                    {!row.paymentReference && !row.note && <span className="text-gray-300">—</span>}
                  </TableCell>
                  <TableCell className="text-gray-500 text-sm">
                    {new Date(row.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        className="gap-1.5 text-white"
                        style={{ background: "linear-gradient(135deg,#FF7B3F,#FF5A1F)" }}
                        disabled={actionId === row.id}
                        onClick={() => handleApprove(row)}
                      >
                        <CheckCircle size={14} />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 text-red-600 border-red-200 hover:bg-red-50"
                        disabled={actionId === row.id}
                        onClick={() => setRejectTarget(row)}
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
        title={`Reject payment from ${rejectTarget?.organizerName ?? ""}`}
        onClose={() => setRejectTarget(null)}
        onConfirm={handleReject}
      />
    </div>
  );
}
