"use client";

import { useCallback, useEffect, useState } from "react";
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
import { PageHeader } from "@/components/page-header";
import {
  dismissCreditRequest,
  getPendingCreditRequests,
  grantCreditRequest,
  type CreditRequestRow,
} from "@/lib/api";
import { CheckCircle, RefreshCw, XCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function CreditRequestsPage() {
  const [rows, setRows] = useState<CreditRequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<number | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [grantTarget, setGrantTarget] = useState<CreditRequestRow | null>(null);
  const [grantCredits, setGrantCredits] = useState("1");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await getPendingCreditRequests());
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = rows.filter((row) => {
    const q = searchInput.trim().toLowerCase();
    if (!q) return true;
    return (
      row.organizerName.toLowerCase().includes(q) ||
      (row.organizerEmail?.toLowerCase().includes(q) ?? false) ||
      (row.eventTitle?.toLowerCase().includes(q) ?? false) ||
      String(row.id).includes(q)
    );
  });

  async function handleGrant() {
    if (!grantTarget) return;
    const credits = Number(grantCredits);
    if (!Number.isInteger(credits) || credits < 1) {
      toast.error("Enter a valid credit amount (1 or more)");
      return;
    }

    setActionId(grantTarget.id);
    try {
      await grantCreditRequest(grantTarget.id, credits);
      toast.success(`Granted ${credits} credit${credits === 1 ? "" : "s"} to ${grantTarget.organizerName}`);
      setRows((prev) => prev.filter((r) => r.id !== grantTarget.id));
      setGrantTarget(null);
      setGrantCredits("1");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setActionId(null);
    }
  }

  async function handleDismiss(row: CreditRequestRow) {
    setActionId(row.id);
    try {
      await dismissCreditRequest(row.id);
      toast.success(`Request #${row.id} dismissed`);
      setRows((prev) => prev.filter((r) => r.id !== row.id));
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setActionId(null);
    }
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-6 p-4 md:p-6">
      <PageHeader
        title="Credit requests"
        description="Review organizer publish credit requests and grant credits manually."
      />

      <div className="flex items-center gap-2">
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search organizer, email, event…"
          className="flex h-8 max-w-md flex-1 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
        <Button variant="outline" size="sm" onClick={() => { void load(); }} className="gap-2 shrink-0">
          <RefreshCw size={14} />
          Refresh
        </Button>
      </div>

      <AdminTableCard>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead className={`${ADMIN_TH} w-[6%]`}>#</TableHead>
            <TableHead className={`${ADMIN_TH} w-[22%]`}>Organizer</TableHead>
            <TableHead className={`${ADMIN_TH} w-[24%]`}>Event</TableHead>
            <TableHead className={`${ADMIN_TH} w-[10%]`}>Balance</TableHead>
            <TableHead className={`${ADMIN_TH} w-[14%]`}>Requested</TableHead>
            <TableHead className={`${ADMIN_TH} w-[24%] text-right`}>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <TableRow key={i}>
                {Array.from({ length: 6 }).map((_, j) => (
                  <TableCell key={j} className="px-3"><Skeleton className="h-4 w-full" /></TableCell>
                ))}
              </TableRow>
            ))
          ) : filtered.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-16 text-muted-foreground">
                No pending credit requests
              </TableCell>
            </TableRow>
          ) : (
            filtered.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="text-muted-foreground text-sm px-3">#{row.id}</TableCell>
                <TableCell className="max-w-0 px-3">
                  <p className="font-medium truncate" title={row.organizerName}>{row.organizerName}</p>
                  <p className="text-xs text-muted-foreground truncate">{row.organizerEmail ?? "—"}</p>
                </TableCell>
                <TruncateCell className="px-3 text-sm">
                  {row.eventTitle ? (
                    <span title={row.eventTitle}>{row.eventTitle}</span>
                  ) : (
                    <span className="text-muted-foreground">General request</span>
                  )}
                </TruncateCell>
                <TableCell className="px-3">
                  <Badge variant="secondary">{row.currentCredits}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm whitespace-nowrap px-3">
                  {new Date(row.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right px-3">
                  <div className="flex items-center justify-end gap-1.5">
                    <Button
                      size="sm"
                      className="h-7 px-2 text-xs gap-1"
                      disabled={actionId === row.id}
                      onClick={() => {
                        setGrantTarget(row);
                        setGrantCredits("1");
                      }}
                    >
                      <CheckCircle size={12} /> Grant credits
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2 text-xs gap-1 text-destructive"
                      disabled={actionId === row.id}
                      onClick={() => handleDismiss(row)}
                    >
                      <XCircle size={12} /> Dismiss
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </AdminTableCard>

      <Dialog open={!!grantTarget} onOpenChange={(open) => !open && setGrantTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Grant publish credits</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Grant credits to <span className="font-medium text-foreground">{grantTarget?.organizerName}</span>
            {grantTarget?.eventTitle ? (
              <> for event &ldquo;{grantTarget.eventTitle}&rdquo;</>
            ) : null}
            .
          </p>
          <div className="grid gap-2">
            <Label htmlFor="credits">Number of credits</Label>
            <Input
              id="credits"
              type="number"
              min={1}
              value={grantCredits}
              onChange={(e) => setGrantCredits(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGrantTarget(null)}>Cancel</Button>
            <Button disabled={actionId === grantTarget?.id} onClick={() => { void handleGrant(); }}>
              Grant credits
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
