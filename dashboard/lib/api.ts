import { getToken } from "./auth";

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
  pending: { verifications: number; payments: number };
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
  monthlyRevenue: { month: string; revenue: number }[];
  recentActivity: {
    type: "verification" | "payment";
    id: number;
    name: string;
    email: string | null;
    status?: string;
    amount?: number;
    plan?: string;
    createdAt: string;
  }[];
}

export function getAdminStats() {
  return request<AdminStats>("GET", "/admin/stats");
}

// ─── Overview (legacy) ───────────────────────────────────────────────────────

export interface PendingCounts {
  pendingOrganizers: number;
  pendingPayments: number;
}

export async function getPendingCounts(): Promise<PendingCounts> {
  const [organizers, payments] = await Promise.all([
    request<OrganizerRow[]>("GET", "/admin/organizers/pending"),
    request<PaymentRow[]>("GET", "/admin/payment-requests/pending"),
  ]);
  return {
    pendingOrganizers: organizers.length,
    pendingPayments: payments.length,
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
  };
  document: {
    documentType: string;
    documentPath: string;
    status: string;
  } | null;
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

// ─── Payments ────────────────────────────────────────────────────────────────

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
    reason,
  });
}
