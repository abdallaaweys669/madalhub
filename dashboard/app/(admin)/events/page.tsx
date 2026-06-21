"use client";

import { useCallback, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { PageTabs } from "@/components/admin/page-tabs";
import { ListPagination, ListToolbar } from "@/components/admin/list-toolbar";
import {
  AdminTableCard,
  ADMIN_TH,
  ADMIN_ACTIONS_TH,
  AdminActionsCell,
  AdminManageButton,
  TruncateCell,
} from "@/components/admin/admin-table-card";
import {
  EventDetailDialog,
  MemberDetailDialog,
  OrganizerDetailDialog,
  RegistrationDetailDialog,
} from "@/components/admin/admin-record-dialogs";
import { listEvents, listRegistrations, type EventListRow, type RegistrationListRow } from "@/lib/api";
import { useAdminList } from "@/hooks/useAdminList";

const EVENT_STATUS = [
  { value: "all", label: "All statuses" },
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "cancelled", label: "Cancelled" },
];

const REG_STATUS = [
  { value: "all", label: "All statuses" },
  { value: "registered", label: "Registered" },
  { value: "checked_in", label: "Checked in" },
  { value: "attended", label: "Attended" },
  { value: "cancelled", label: "Cancelled" },
];

function EventsTab() {
  const fetcher = useCallback((params: Parameters<typeof listEvents>[0]) => listEvents(params), []);
  const { searchInput, onSearchChange, status, onStatusChange, setPage, data, loading, reload } =
    useAdminList<EventListRow>(fetcher);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [selectedOrganizerId, setSelectedOrganizerId] = useState<number | null>(null);
  const [organizerDialogOpen, setOrganizerDialogOpen] = useState(false);

  function openEvent(id: number) {
    setSelectedEventId(id);
    setEventDialogOpen(true);
  }

  return (
    <>
      <ListToolbar
        search={searchInput}
        onSearchChange={onSearchChange}
        searchPlaceholder="Search title or location…"
        status={status}
        onStatusChange={onStatusChange}
        statusOptions={EVENT_STATUS}
      />
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
            <TableHead className={`${ADMIN_TH} w-[28%]`}>Event</TableHead>
            <TableHead className={`${ADMIN_TH} w-[22%]`}>Organizer</TableHead>
            <TableHead className={`${ADMIN_TH} w-[14%]`}>Status</TableHead>
            <TableHead className={`${ADMIN_TH} w-[10%]`}>Regs</TableHead>
            <TableHead className={`${ADMIN_TH} w-[14%]`}>Starts</TableHead>
            <TableHead className={ADMIN_ACTIONS_TH}>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                {Array.from({ length: 6 }).map((_, j) => (
                  <TableCell key={j} className="px-3"><Skeleton className="h-4 w-full" /></TableCell>
                ))}
              </TableRow>
            ))
          ) : !data?.items.length ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-16 text-muted-foreground">No events found</TableCell>
            </TableRow>
          ) : (
            data.items.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="max-w-0 px-3">
                  <p className="font-medium truncate" title={row.title}>{row.title}</p>
                  <p className="text-xs text-muted-foreground capitalize truncate">{row.audienceGender} audience</p>
                </TableCell>
                <TruncateCell className="text-sm px-3" title={row.organizerName}>{row.organizerName}</TruncateCell>
                <TableCell className="px-3"><Badge variant="secondary" className="capitalize">{row.status}</Badge></TableCell>
                <TableCell className="tabular-nums text-sm px-3">{row.registrationCount}</TableCell>
                <TableCell className="text-sm text-muted-foreground whitespace-nowrap px-3">
                  {new Date(row.startDatetime).toLocaleDateString()}
                </TableCell>
                <AdminActionsCell>
                  <AdminManageButton onClick={() => openEvent(row.id)} />
                </AdminActionsCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </AdminTableCard>

      <EventDetailDialog
        eventId={selectedEventId}
        open={eventDialogOpen}
        onOpenChange={setEventDialogOpen}
        onUpdated={() => void reload()}
        onOpenOrganizer={(organizerId) => {
          setEventDialogOpen(false);
          setSelectedOrganizerId(organizerId);
          setOrganizerDialogOpen(true);
        }}
      />

      <OrganizerDetailDialog
        organizerId={selectedOrganizerId}
        open={organizerDialogOpen}
        onOpenChange={setOrganizerDialogOpen}
      />
    </>
  );
}

function RegistrationsTab() {
  const fetcher = useCallback((params: Parameters<typeof listRegistrations>[0]) => listRegistrations(params), []);
  const { searchInput, onSearchChange, status, onStatusChange, setPage, data, loading } =
    useAdminList<RegistrationListRow>(fetcher);
  const [selectedRegistration, setSelectedRegistration] = useState<RegistrationListRow | null>(null);
  const [registrationDialogOpen, setRegistrationDialogOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);
  const [memberDialogOpen, setMemberDialogOpen] = useState(false);

  function openRegistration(row: RegistrationListRow) {
    setSelectedRegistration(row);
    setRegistrationDialogOpen(true);
  }

  return (
    <>
      <ListToolbar
        search={searchInput}
        onSearchChange={onSearchChange}
        searchPlaceholder="Search member or event…"
        status={status}
        onStatusChange={onStatusChange}
        statusOptions={REG_STATUS}
      />
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
            <TableHead className={`${ADMIN_TH} w-[28%]`}>Event</TableHead>
            <TableHead className={`${ADMIN_TH} w-[28%]`}>Member</TableHead>
            <TableHead className={`${ADMIN_TH} w-[16%]`}>Status</TableHead>
            <TableHead className={`${ADMIN_TH} w-[16%]`}>Registered</TableHead>
            <TableHead className={ADMIN_ACTIONS_TH}>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                {Array.from({ length: 5 }).map((_, j) => (
                  <TableCell key={j} className="px-3"><Skeleton className="h-4 w-full" /></TableCell>
                ))}
              </TableRow>
            ))
          ) : !data?.items.length ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-16 text-muted-foreground">No registrations found</TableCell>
            </TableRow>
          ) : (
            data.items.map((row) => (
              <TableRow key={row.id}>
                <TruncateCell className="font-medium px-3" title={row.eventTitle}>{row.eventTitle}</TruncateCell>
                <TableCell className="max-w-0 px-3">
                  <p className="text-sm truncate" title={row.memberName}>{row.memberName}</p>
                  <p className="text-xs text-muted-foreground truncate" title={row.memberEmail}>{row.memberEmail}</p>
                </TableCell>
                <TableCell className="px-3">
                  <Badge variant="secondary" className="capitalize">{row.status.replace("_", " ")}</Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground whitespace-nowrap px-3">
                  {new Date(row.createdAt).toLocaleDateString()}
                </TableCell>
                <AdminActionsCell>
                  <AdminManageButton label="View" onClick={() => openRegistration(row)} />
                </AdminActionsCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </AdminTableCard>

      <RegistrationDetailDialog
        registration={selectedRegistration}
        open={registrationDialogOpen}
        onOpenChange={setRegistrationDialogOpen}
        onOpenEvent={(eventId) => {
          setSelectedEventId(eventId);
          setEventDialogOpen(true);
        }}
        onOpenMember={(memberId) => {
          setSelectedMemberId(memberId);
          setMemberDialogOpen(true);
        }}
      />

      <EventDetailDialog
        eventId={selectedEventId}
        open={eventDialogOpen}
        onOpenChange={setEventDialogOpen}
      />

      <MemberDetailDialog
        memberId={selectedMemberId}
        open={memberDialogOpen}
        onOpenChange={setMemberDialogOpen}
      />
    </>
  );
}

function EventsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") === "registrations" ? "registrations" : "events";

  function setTab(next: string) {
    router.replace(next === "registrations" ? "/events?tab=registrations" : "/events");
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-6 p-4 md:p-6">
      <PageHeader
        title="Events"
        description={
          tab === "registrations"
            ? "Use View on a row to open event, contact organizer, or see the member."
            : "Use Manage on a row for publish status and registration count — attendee names stay with organizers."
        }
      />
      <PageTabs
        tabs={[
          { id: "events", label: "All events" },
          { id: "registrations", label: "Registrations" },
        ]}
        active={tab}
        onChange={setTab}
      />
      {tab === "registrations" ? <RegistrationsTab /> : <EventsTab />}
    </div>
  );
}

export default function EventsPage() {
  return (
    <Suspense fallback={<div className="p-6"><Skeleton className="h-8 w-48" /></div>}>
      <EventsPageContent />
    </Suspense>
  );
}
