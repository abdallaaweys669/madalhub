"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ExternalLink, Flag, KeyRound, Loader2, Mail } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getEventDetail,
  getMemberDetail,
  getOrganizerDetail,
  getPublicEventApiUrl,
  grantOrganizerCredits,
  updateEventStatus,
  updateMemberStatus,
  updateOrganizerStatus,
  type EventDetail,
  type MemberDetail,
  type OrganizerDetail,
  type RegistrationListRow,
} from "@/lib/api";
import { getUploadUrl } from "@/lib/upload-url";
import { cn } from "@/lib/utils";

function isEventPast(event: Pick<EventDetail, "startDatetime" | "endDatetime">) {
  const end = event.endDatetime ? new Date(event.endDatetime) : new Date(event.startDatetime);
  return end.getTime() < Date.now();
}

function DetailField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid gap-1">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
      <div className="text-sm">{value ?? "—"}</div>
    </div>
  );
}

type MemberDialogProps = {
  memberId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated?: () => void;
};

export function MemberDetailDialog({ memberId, open, onOpenChange, onUpdated }: MemberDialogProps) {
  const [data, setData] = useState<MemberDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !memberId) return;
    let cancelled = false;
    setLoading(true);
    getMemberDetail(memberId)
      .then((detail) => {
        if (!cancelled) setData(detail);
      })
      .catch((e: unknown) => {
        if (!cancelled) toast.error(e instanceof Error ? e.message : "Failed to load member");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, memberId]);

  async function toggleStatus() {
    if (!data) return;
    const next = data.status === "active" ? "rejected" : "active";
    setSaving(true);
    try {
      await updateMemberStatus(data.id, next);
      setData({ ...data, status: next });
      toast.success(next === "active" ? "Member reactivated" : "Member suspended");
      onUpdated?.();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{data?.fullName ?? "Member"}</DialogTitle>
          <DialogDescription>
            Full member profile and registration history. Member data is visible to admins; per-event
            attendee lists stay with organizers only.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : data ? (
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <DetailField label="Email" value={data.email} />
              <DetailField label="Phone" value={data.phone} />
              <DetailField label="Location" value={data.location} />
              <DetailField
                label="Status"
                value={<Badge className="capitalize">{data.status}</Badge>}
              />
              <DetailField label="Email verified" value={data.emailVerified ? "Yes" : "No"} />
              <DetailField label="Joined" value={new Date(data.createdAt).toLocaleString()} />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" disabled={saving} onClick={() => void toggleStatus()}>
                {data.status === "active" ? "Suspend account" : "Reactivate account"}
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  toast.info("Log password-reset requests in your support tracker for now.")
                }
              >
                <KeyRound className="size-4 mr-1.5" />
                Reset issue
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  toast.info("No automated abuse flags yet — track manually in support notes.")
                }
              >
                <Flag className="size-4 mr-1.5" />
                Abuse flags
              </Button>
            </div>

            <div>
              <h3 className="text-sm font-semibold mb-2">
                Event registrations ({data.registrationCount})
              </h3>
              {data.registrations.length === 0 ? (
                <p className="text-sm text-muted-foreground">No registrations yet.</p>
              ) : (
                <ul className="divide-y rounded-lg border max-h-48 overflow-y-auto">
                  {data.registrations.map((reg) => (
                    <li key={reg.id} className="px-3 py-2 text-sm">
                      <p className="font-medium">{reg.eventTitle}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {reg.status.replace("_", " ")} · {new Date(reg.createdAt).toLocaleDateString()}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

type OrganizerDialogProps = {
  organizerId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated?: () => void;
};

export function OrganizerDetailDialog({
  organizerId,
  open,
  onOpenChange,
  onUpdated,
}: OrganizerDialogProps) {
  const [data, setData] = useState<OrganizerDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [credits, setCredits] = useState("1");
  const [granting, setGranting] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !organizerId) return;
    let cancelled = false;
    setLoading(true);
    getOrganizerDetail(organizerId)
      .then((detail) => {
        if (!cancelled) setData(detail);
      })
      .catch((e: unknown) => {
        if (!cancelled) toast.error(e instanceof Error ? e.message : "Failed to load organizer");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, organizerId]);

  async function handleGrant() {
    if (!data) return;
    if (data.verificationStatus !== "approved") {
      toast.error("Approve identity verification before granting publish credits.");
      return;
    }
    const amount = Number(credits);
    if (!Number.isInteger(amount) || amount < 1) {
      toast.error("Enter a valid credit amount");
      return;
    }
    setGranting(true);
    try {
      const result = (await grantOrganizerCredits(data.id, amount)) as {
        paidPublishCredits: number;
      };
      setData({ ...data, paidPublishCredits: result.paidPublishCredits });
      toast.success(`Granted ${amount} credit${amount === 1 ? "" : "s"}`);
      onUpdated?.();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Grant failed");
    } finally {
      setGranting(false);
    }
  }

  async function toggleStatus() {
    if (!data) return;
    const next = data.userStatus === "active" ? "rejected" : "active";
    setSaving(true);
    try {
      await updateOrganizerStatus(data.id, next);
      setData({ ...data, userStatus: next });
      toast.success(next === "active" ? "Organizer reactivated" : "Organizer suspended");
      onUpdated?.();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{data?.organizationName ?? "Organizer"}</DialogTitle>
          <DialogDescription>Verification, credits, events, and account actions.</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : data ? (
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <DetailField label="Contact" value={data.fullName} />
              <DetailField label="Email" value={data.email} />
              <DetailField label="Phone" value={data.phone} />
              <DetailField
                label="Verification"
                value={<Badge className="capitalize">{data.verificationStatus}</Badge>}
              />
              <DetailField
                label="Account status"
                value={<Badge className="capitalize">{data.userStatus}</Badge>}
              />
              <DetailField label="Publish credits" value={data.paidPublishCredits} />
              <DetailField label="Events" value={data.eventCount} />
              <DetailField label="Joined" value={new Date(data.createdAt).toLocaleDateString()} />
            </div>

            <div className="flex flex-wrap gap-2">
              {data.verificationStatus !== "approved" ? (
                <Link
                  href="/verifications"
                  className={cn(buttonVariants({ variant: "outline" }), "inline-flex items-center")}
                >
                  Open verifications
                </Link>
              ) : null}
              <Button variant="outline" disabled={saving} onClick={() => void toggleStatus()}>
                {data.userStatus === "active" ? "Suspend account" : "Reactivate account"}
              </Button>
            </div>

            <div className="rounded-lg border p-3 space-y-3">
              <p className="text-sm font-semibold">Grant publish credits</p>
              {data.verificationStatus !== "approved" ? (
                <p className="text-sm text-muted-foreground">
                  This organizer is <span className="font-medium capitalize">{data.verificationStatus}</span>.
                  Approve identity verification first — credits cannot be used to publish until then.
                </p>
              ) : (
                <div className="flex gap-2 items-end">
                  <div className="flex-1 grid gap-1.5">
                    <Label htmlFor="org-credits">Credits</Label>
                    <Input
                      id="org-credits"
                      type="number"
                      min={1}
                      value={credits}
                      onChange={(e) => setCredits(e.target.value)}
                    />
                  </div>
                  <Button disabled={granting} onClick={() => void handleGrant()}>
                    {granting ? <Loader2 className="size-4 animate-spin" /> : "Grant"}
                  </Button>
                </div>
              )}
            </div>

            {data.document ? (
              <DetailField
                label="Verification document"
                value={
                  <a
                    href={getUploadUrl(data.document.documentPath)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    View document <ExternalLink className="size-3.5" />
                  </a>
                }
              />
            ) : null}

            <div>
              <h3 className="text-sm font-semibold mb-2">Recent events</h3>
              {data.events.length === 0 ? (
                <p className="text-sm text-muted-foreground">No events yet.</p>
              ) : (
                <ul className="divide-y rounded-lg border max-h-40 overflow-y-auto">
                  {data.events.map((event) => (
                    <li key={event.id} className="px-3 py-2 text-sm flex justify-between gap-2">
                      <span className="font-medium truncate">{event.title}</span>
                      <Badge variant="secondary" className="capitalize shrink-0">
                        {event.status}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

type EventDialogProps = {
  eventId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated?: () => void;
  onOpenOrganizer?: (organizerId: number) => void;
};

export function EventDetailDialog({
  eventId,
  open,
  onOpenChange,
  onUpdated,
  onOpenOrganizer,
}: EventDialogProps) {
  const [data, setData] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !eventId) return;
    let cancelled = false;
    setLoading(true);
    getEventDetail(eventId)
      .then((detail) => {
        if (!cancelled) setData(detail);
      })
      .catch((e: unknown) => {
        if (!cancelled) toast.error(e instanceof Error ? e.message : "Failed to load event");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, eventId]);

  async function setStatus(status: string) {
    if (!data) return;
    setSaving(true);
    try {
      await updateEventStatus(data.id, status);
      setData({ ...data, status });
      toast.success(`Event marked as ${status}`);
      onUpdated?.();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{data?.title ?? "Event"}</DialogTitle>
          <DialogDescription>
            Registration count only — who registered stays visible to the event organizer in their
            app, not here.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : data ? (
          <div className="space-y-5">
            {(() => {
              const past = isEventPast(data);
              const canModerate = !past && data.status !== "cancelled";
              return (
                <>
            <div className="grid gap-4 sm:grid-cols-2">
              <DetailField
                label="Organizer"
                value={
                  onOpenOrganizer ? (
                    <button
                      type="button"
                      className="text-left text-primary hover:underline"
                      onClick={() => onOpenOrganizer(data.organizerId)}
                    >
                      {data.organizerName}
                    </button>
                  ) : (
                    data.organizerName
                  )
                }
              />
              <DetailField label="Organizer email" value={data.organizerEmail} />
              <DetailField
                label="Status"
                value={
                  <span className="inline-flex items-center gap-2">
                    <Badge className="capitalize">{data.status}</Badge>
                    {past && data.status === "published" ? (
                      <Badge variant="secondary">Ended</Badge>
                    ) : null}
                  </span>
                }
              />
              <DetailField label="Registrations" value={data.registrationCount} />
              <DetailField label="Starts" value={new Date(data.startDatetime).toLocaleString()} />
              <DetailField label="Ends" value={new Date(data.endDatetime).toLocaleString()} />
              <DetailField label="Location" value={data.locationName} />
            </div>

            {past && data.status === "published" ? (
              <p className="text-sm text-muted-foreground rounded-lg border bg-muted/30 px-3 py-2">
                This event has already ended. Unpublish and cancel are hidden for past events.
              </p>
            ) : null}

            <div className="flex flex-wrap gap-2">
              {canModerate && data.status === "published" ? (
                <>
                  <Button variant="outline" disabled={saving} onClick={() => void setStatus("draft")}>
                    Unpublish (draft)
                  </Button>
                  <Button variant="destructive" disabled={saving} onClick={() => void setStatus("cancelled")}>
                    Cancel event
                  </Button>
                </>
              ) : null}
              {canModerate && data.status === "draft" ? (
                <Button variant="outline" disabled={saving} onClick={() => void setStatus("cancelled")}>
                  Cancel draft
                </Button>
              ) : null}
              {data.status === "published" ? (
                <a
                  href={getPublicEventApiUrl(data.id)}
                  target="_blank"
                  rel="noreferrer"
                  className={cn(buttonVariants({ variant: "outline" }), "inline-flex items-center gap-1.5")}
                >
                  View public page <ExternalLink className="size-3.5" />
                </a>
              ) : null}
              {data.organizerEmail ? (
                <a
                  href={`mailto:${data.organizerEmail}?subject=${encodeURIComponent(`Regarding event: ${data.title}`)}`}
                  className={cn(buttonVariants({ variant: "outline" }), "inline-flex items-center gap-1.5")}
                >
                  <Mail className="size-3.5" />
                  Contact organizer
                </a>
              ) : null}
            </div>
                </>
              );
            })()}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

type RegistrationDialogProps = {
  registration: RegistrationListRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenEvent?: (eventId: number) => void;
  onOpenMember?: (memberId: number) => void;
};

export function RegistrationDetailDialog({
  registration,
  open,
  onOpenChange,
  onOpenEvent,
  onOpenMember,
}: RegistrationDialogProps) {
  if (!registration) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md" />
      </Dialog>
    );
  }

  const organizerMailto =
    registration.organizerEmail &&
    `mailto:${registration.organizerEmail}?subject=${encodeURIComponent(
      `Regarding registration: ${registration.eventTitle}`,
    )}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registration</DialogTitle>
          <DialogDescription>
            Member contact is shown here. Per-event attendee rosters remain organizer-only.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <DetailField label="Event" value={registration.eventTitle} />
            <DetailField
              label="Status"
              value={
                <Badge variant="secondary" className="capitalize">
                  {registration.status.replace("_", " ")}
                </Badge>
              }
            />
            <DetailField label="Member" value={registration.memberName} />
            <DetailField label="Member email" value={registration.memberEmail} />
            <DetailField
              label="Registered"
              value={new Date(registration.createdAt).toLocaleString()}
            />
            {registration.organizerName ? (
              <DetailField label="Organizer" value={registration.organizerName} />
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            {onOpenEvent ? (
              <Button
                variant="outline"
                onClick={() => {
                  onOpenChange(false);
                  onOpenEvent(registration.eventId);
                }}
              >
                Open event
              </Button>
            ) : null}
            {onOpenMember ? (
              <Button
                variant="outline"
                onClick={() => {
                  onOpenChange(false);
                  onOpenMember(registration.memberId);
                }}
              >
                View member
              </Button>
            ) : null}
            {organizerMailto ? (
              <a
                href={organizerMailto}
                className={cn(buttonVariants({ variant: "outline" }), "inline-flex items-center gap-1.5")}
              >
                <Mail className="size-3.5" />
                Contact organizer
              </a>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
