import { getToken } from "./auth";
import { buildListQuery, type ListParams, type Paginated } from "./list-query";

export type { ListParams, Paginated };

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

async function request<T>(
  method: string,
  path: string,
  body?: unknown
): Promise<T> {
  const token = getToken();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") {
      throw new Error("Request timed out. Backend may be unreachable.");
    }
    throw e;
  } finally {
    clearTimeout(timeout);
  }

  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const json = (await res.json()) as
        | { message?: string | string[]; error?: string }
        | undefined;
      if (json?.message) {
        msg = Array.isArray(json.message) ? json.message.join(", ") : json.message;
      } else if (json?.error) {
        msg = json.error;
      }
    } catch {
      const text = await res.text().catch(() => "");
      if (text) msg = text;
    }
    throw new Error(msg);
  }
  return res.json() as Promise<T>;
}

// ─── Stats ──────────────────────────────────────────────────────────────────

export interface AdminStats {
  totals: {
    members: number;
    organizers: number;
    events: number;
    registrations: number;
  };
  pending: { verifications: number; creditRequests: number };
  thisMonth: {
    members: number;
    organizers: number;
    events: number;
    registrations: number;
  };
  lastMonth: {
    members: number;
    organizers: number;
    events: number;
    registrations: number;
  };
  trends: {
    members: number[];
    organizers: number[];
    events: number[];
    registrations: number[];
  };
  trendMonths: string[];
  eventStatusBreakdown: {
    draft: number;
    published: number;
    cancelled: number;
  };
  verificationBreakdown: {
    unverified: number;
    pending: number;
    approved: number;
    rejected: number;
  };
  recentActivity: {
    type: "verification" | "credit_request";
    id: number;
    name: string;
    email: string | null;
    status?: string;
    eventTitle?: string | null;
    createdAt: string;
  }[];
}

export function getAdminStats() {
  return request<AdminStats>("GET", "/admin/stats");
}

// ─── Overview (legacy) ───────────────────────────────────────────────────────

export interface PendingCounts {
  pendingOrganizers: number;
  pendingCreditRequests: number;
}

export async function getPendingCounts(): Promise<PendingCounts> {
  const [organizers, creditRequests] = await Promise.all([
    request<OrganizerRow[]>("GET", "/admin/organizers/pending"),
    request<CreditRequestRow[]>("GET", "/admin/credit-requests/pending"),
  ]);
  return {
    pendingOrganizers: organizers.length,
    pendingCreditRequests: creditRequests.length,
  };
}

// ─── Organizers ─────────────────────────────────────────────────────────────

export interface OrganizerRow {
  id: number;
  fullName: string;
  email: string;
  phone: string | null;
  userStatus: string;
  verificationStatus: string;
  profile: {
    organizationName: string;
    organizationDescription: string | null;
    website: string | null;
    facebook: string | null;
    instagram: string | null;
    phone: string | null;
  };
  document: {
    documentType: string;
    documentPath: string;
    status: string;
  } | null;
  hasDocument: boolean;
  hasOnlinePresence: boolean;
  proofType: "document" | "online_presence" | "none";
}

export function getPendingOrganizers() {
  return request<OrganizerRow[]>("GET", "/admin/organizers/pending");
}

export function approveOrganizer(organizerId: number) {
  return request("PATCH", `/admin/organizers/approve/${organizerId}`);
}

export function rejectOrganizer(organizerId: number, reason: string) {
  return request("PATCH", `/admin/organizers/reject/${organizerId}`, { reason });
}

// ─── Credit requests ─────────────────────────────────────────────────────────

export interface CreditRequestRow {
  id: number;
  organizerId: number;
  organizerName: string;
  organizerEmail: string | null;
  eventId: number | null;
  eventTitle: string | null;
  currentCredits: number;
  createdAt: string;
}

export function getPendingCreditRequests() {
  return request<CreditRequestRow[]>("GET", "/admin/credit-requests/pending");
}

export function grantCreditRequest(requestId: number, credits: number) {
  return request("PATCH", `/admin/credit-requests/${requestId}/grant`, { credits });
}

export function dismissCreditRequest(requestId: number) {
  return request("PATCH", `/admin/credit-requests/${requestId}/dismiss`);
}

export function grantOrganizerCredits(organizerId: number, credits: number) {
  return request("PATCH", `/admin/organizers/${organizerId}/credits`, { credits });
}

export interface MemberDetail {
  id: number;
  fullName: string;
  email: string;
  phone: string | null;
  location: string | null;
  status: string;
  emailVerified: boolean;
  createdAt: string;
  registrationCount: number;
  registrations: {
    id: number;
    eventId: number;
    eventTitle: string;
    status: string;
    createdAt: string;
  }[];
}

export interface OrganizerDetail {
  id: number;
  fullName: string;
  email: string;
  phone: string | null;
  userStatus: string;
  verificationStatus: string;
  organizationName: string;
  organizationDescription: string | null;
  website: string | null;
  facebook: string | null;
  instagram: string | null;
  paidPublishCredits: number;
  rejectionReason: string | null;
  createdAt: string;
  eventCount: number;
  document: {
    documentType: string;
    documentPath: string;
    status: string;
  } | null;
  events: {
    id: number;
    title: string;
    status: string;
    startDatetime: string;
    createdAt: string;
  }[];
}

export interface EventDetail {
  id: number;
  title: string;
  description: string;
  status: string;
  organizerId: number;
  organizerName: string;
  organizerEmail: string;
  locationName: string | null;
  locationAddress: string | null;
  capacity: number;
  audienceGender: string;
  startDatetime: string;
  endDatetime: string;
  createdAt: string;
  registrationCount: number;
}

export function getPublicEventApiUrl(eventId: number) {
  const base = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000").replace(/\/$/, "");
  return `${base}/events/${eventId}`;
}

export function getMemberDetail(id: number) {
  return request<MemberDetail>("GET", `/admin/members/${id}`);
}

export function updateMemberStatus(id: number, status: string) {
  return request<{ id: number; status: string }>("PATCH", `/admin/members/${id}/status`, { status });
}

export function getOrganizerDetail(id: number) {
  return request<OrganizerDetail>("GET", `/admin/organizers/${id}`);
}

export function updateOrganizerStatus(id: number, status: string) {
  return request<{ id: number; status: string }>("PATCH", `/admin/organizers/${id}/status`, { status });
}

export function getEventDetail(id: number) {
  return request<EventDetail>("GET", `/admin/events/${id}`);
}

export function updateEventStatus(id: number, status: string) {
  return request<{ id: number; status: string }>("PATCH", `/admin/events/${id}/status`, { status });
}

// ─── Payments (legacy) ───────────────────────────────────────────────────────

export interface PaymentRow {
  id: number;
  organizerId: number;
  organizerName: string;
  organizerEmail: string | null;
  plan: string;
  amountUsd: number;
  paymentReference: string | null;
  note: string | null;
  createdAt: string;
}

export function getPendingPayments() {
  return request<PaymentRow[]>("GET", "/admin/payment-requests/pending");
}

export function approvePayment(requestId: number) {
  return request("PATCH", `/admin/payment-requests/${requestId}/approve`);
}

export function rejectPayment(requestId: number, reason: string) {
  return request("PATCH", `/admin/payment-requests/${requestId}/reject`, {
    adminNote: reason,
  });
}

// ─── List endpoints ─────────────────────────────────────────────────────────

export interface MemberRow {
  id: number;
  fullName: string;
  email: string;
  phone: string | null;
  location: string | null;
  gender: string | null;
  profileCompleted: boolean;
  registrationCount: number;
  status: string;
  emailVerified: boolean;
  createdAt: string;
}

export interface OrganizerListRow {
  id: number;
  fullName: string;
  email: string;
  userStatus: string;
  verificationStatus: string;
  organizationName: string;
  website: string | null;
  paidPublishCredits: number;
  freePublishUsed: boolean;
  eventCount: number;
  createdAt: string;
}

export interface EventListRow {
  id: number;
  title: string;
  organizerId: number;
  organizerName: string;
  status: string;
  audienceGender: string;
  capacity: number;
  registrationCount: number;
  startDatetime: string;
  locationName: string | null;
  createdAt: string;
}

export interface RegistrationListRow {
  id: number;
  eventId: number;
  eventTitle: string;
  memberId: number;
  memberName: string;
  memberEmail: string;
  status: string;
  createdAt: string;
  organizerId: number | null;
  organizerName: string | null;
  organizerEmail: string | null;
}

export interface PaymentListRow extends PaymentRow {
  status: string;
  creditsGranted?: number;
}

export interface AdminUserRow {
  id: number;
  fullName: string;
  email: string;
  status: string;
  createdAt: string;
}

export interface AdminAnalytics {
  overview: AdminStats["totals"];
  pending: AdminStats["pending"];
  thisMonth: AdminStats["thisMonth"];
  lastMonth: AdminStats["lastMonth"];
  trends: AdminStats["trends"];
  trendMonths: string[];
  eventStatusBreakdown: AdminStats["eventStatusBreakdown"];
  verificationBreakdown: AdminStats["verificationBreakdown"];
  funnel: {
    members: number;
    activeMembers: number;
    organizers: number;
    verifiedOrganizers: number;
    events: number;
    publishedEvents: number;
    registrations: number;
  };
}

export type ReportType = "members" | "organizers" | "events" | "registrations" | "revenue";

export interface ReportSummary {
  type: string;
  from: string;
  to: string;
  kpis: { key: string; label: string; value: number | string }[];
  trendMonths: string[];
  trendValues: number[];
  breakdown: { label: string; value: number }[];
  rows: Record<string, unknown>[];
  topCreators?: Record<string, unknown>[];
  topEvents?: Record<string, unknown>[];
  categoryBreakdown?: { label: string; value: number }[];
  exportType: ReportType | null;
}

export function getReportSummary(
  type: string,
  from?: string,
  to?: string,
  gender?: string,
) {
  const q = new URLSearchParams({ type: type === "user-growth" ? "members" : type });
  if (from) q.set("from", from);
  if (to) q.set("to", to);
  if (gender && gender !== "all") q.set("gender", gender);
  return request<ReportSummary>("GET", `/admin/reports/summary?${q.toString()}`);
}

export function getAdminReport(
  type: ReportType,
  from?: string,
  to?: string,
  opts?: { gender?: string; search?: string },
) {
  const q = new URLSearchParams({ type });
  if (from) q.set("from", from);
  if (to) q.set("to", to);
  if (opts?.gender && opts.gender !== "all") q.set("gender", opts.gender);
  if (opts?.search?.trim()) q.set("search", opts.search.trim());
  return request<{ rows: Record<string, unknown>[] }>("GET", `/admin/reports?${q.toString()}`);
}

export function getAdminAnalytics() {
  return request<AdminAnalytics>("GET", "/admin/analytics");
}

export function listMembers(params: ListParams = {}) {
  return request<Paginated<MemberRow>>("GET", `/admin/members${buildListQuery(params)}`);
}

export function listOrganizers(params: ListParams = {}) {
  return request<Paginated<OrganizerListRow>>("GET", `/admin/organizers${buildListQuery(params)}`);
}

export function listEvents(params: ListParams = {}) {
  return request<Paginated<EventListRow>>("GET", `/admin/events${buildListQuery(params)}`);
}

export function listRegistrations(params: ListParams = {}) {
  return request<Paginated<RegistrationListRow>>("GET", `/admin/registrations${buildListQuery(params)}`);
}

export function listPaymentHistory(params: ListParams = {}) {
  return request<Paginated<PaymentListRow>>("GET", `/admin/payment-requests${buildListQuery(params)}`);
}

export function listAdmins(params: ListParams = {}) {
  return request<Paginated<AdminUserRow>>("GET", `/admin/admins${buildListQuery(params)}`);
}

export function createAdmin(body: { fullName: string; email: string; password: string }) {
  return request<AdminUserRow>("POST", "/admin/admins", body);
}

export function updateAdmin(id: number, body: { fullName?: string; status?: string }) {
  return request<AdminUserRow>("PATCH", `/admin/admins/${id}`, body);
}

// ─── Categories / interests ─────────────────────────────────────────────────

export interface InterestRow {
  id: number;
  name: string;
  icon: string | null;
  eventCount: number;
}

export function listInterests() {
  return request<{ items: InterestRow[] }>("GET", "/admin/interests");
}

export function createInterest(body: { name: string; icon?: string | null }) {
  return request<InterestRow>("POST", "/admin/interests", body);
}

export function updateInterest(id: number, body: { name?: string; icon?: string | null }) {
  return request<InterestRow>("PATCH", `/admin/interests/${id}`, body);
}

export function deleteInterest(id: number) {
  return request<{ ok: boolean }>("DELETE", `/admin/interests/${id}`);
}

// ─── Verification catalog (organizer types + proof document types) ─────────

export interface VerificationCatalogRow {
  id: number;
  slug: string;
  name: string;
  icon: string | null;
  sortOrder: number;
  isActive: boolean;
  usageCount: number;
}

export function listOrganizerTypes() {
  return request<{ items: VerificationCatalogRow[] }>("GET", "/admin/organizer-types");
}

export function createOrganizerType(body: {
  name: string;
  icon?: string | null;
  sortOrder?: number;
}) {
  return request<VerificationCatalogRow>("POST", "/admin/organizer-types", body);
}

export function updateOrganizerType(
  id: number,
  body: {
    name?: string;
    icon?: string | null;
    sortOrder?: number;
    isActive?: boolean;
  },
) {
  return request<VerificationCatalogRow>("PATCH", `/admin/organizer-types/${id}`, body);
}

export function deleteOrganizerType(id: number) {
  return request<{ ok: boolean }>("DELETE", `/admin/organizer-types/${id}`);
}

export function listVerificationDocumentTypes() {
  return request<{ items: VerificationCatalogRow[] }>("GET", "/admin/verification-document-types");
}

export function createVerificationDocumentType(body: {
  name: string;
  icon?: string | null;
  sortOrder?: number;
}) {
  return request<VerificationCatalogRow>("POST", "/admin/verification-document-types", body);
}

export function updateVerificationDocumentType(
  id: number,
  body: {
    name?: string;
    icon?: string | null;
    sortOrder?: number;
    isActive?: boolean;
  },
) {
  return request<VerificationCatalogRow>(
    "PATCH",
    `/admin/verification-document-types/${id}`,
    body,
  );
}

export function deleteVerificationDocumentType(id: number) {
  return request<{ ok: boolean }>("DELETE", `/admin/verification-document-types/${id}`);
}
