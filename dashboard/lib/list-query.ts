export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type ListParams = {
  search?: string;
  status?: string;
  activity?: string;
  gender?: string;
  joinedFrom?: string;
  joinedTo?: string;
  eventId?: number;
  memberId?: number;
  page?: number;
  limit?: number;
};

export function buildListQuery(params: ListParams): string {
  const q = new URLSearchParams();
  if (params.search?.trim()) q.set("search", params.search.trim());
  if (params.status?.trim() && params.status !== "all") q.set("status", params.status.trim());
  if (params.activity?.trim() && params.activity !== "all") q.set("activity", params.activity.trim());
  if (params.gender?.trim() && params.gender !== "all") q.set("gender", params.gender.trim());
  if (params.joinedFrom?.trim()) q.set("joinedFrom", params.joinedFrom.trim());
  if (params.joinedTo?.trim()) q.set("joinedTo", params.joinedTo.trim());
  if (params.eventId) q.set("eventId", String(params.eventId));
  if (params.memberId) q.set("memberId", String(params.memberId));
  if (params.page) q.set("page", String(params.page));
  if (params.limit) q.set("limit", String(params.limit));
  const s = q.toString();
  return s ? `?${s}` : "";
}
